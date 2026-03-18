import type { Page } from '@playwright/test'

export const SUPABASE_URL = 'https://vvduriumhgnjbrrzchql.supabase.co'
export const PROJECT_REF = 'vvduriumhgnjbrrzchql'

export const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'
export const TEST_EMAIL = 'test_e2e@playwright.framelight'
export const TEST_STUDIO = 'Playwright Test Studio'
/** Generate a minimal valid-format JWT (signature is fake but structure is correct for client-side parsing) */
function makeFakeJwt(userId: string, email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const exp = Math.floor(Date.now() / 1000) + 3600
  const iat = Math.floor(Date.now() / 1000)
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    email,
    role: 'authenticated',
    aud: 'authenticated',
    exp,
    iat,
    user_metadata: { studio_name: TEST_STUDIO },
  })).toString('base64url')
  return `${header}.${payload}.fakesignature`
}

export const FAKE_ACCESS_TOKEN = makeFakeJwt(TEST_USER_ID, TEST_EMAIL)

/** A fake Supabase user object */
export const FAKE_USER = {
  id: TEST_USER_ID,
  email: TEST_EMAIL,
  role: 'authenticated',
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
  user_metadata: { studio_name: TEST_STUDIO },
}

/** A fake photographer profile */
export const FAKE_PROFILE = {
  id: TEST_USER_ID,
  studio_name: TEST_STUDIO,
  logo_url: null,
  accent_color: '#5cbdb9',
  plan: 'free',
  storage_used_bytes: 1024 * 1024 * 50, // 50 MB
  created_at: '2024-01-01T00:00:00.000Z',
}

/** Sample galleries */
export const FAKE_GALLERIES = [
  {
    id: 'aaaaaaaa-0000-0000-0000-000000000001',
    photographer_id: TEST_USER_ID,
    slug: 'smith-wedding-abc12',
    title: 'Smith Wedding',
    client_name: 'Jane Smith',
    client_email: 'jane@smith.com',
    cover_url: null,
    status: 'published',
    layout: 'masonry',
    theme: 'framelight',
    pin_enabled: false,
    pin_code: null,
    admin_bypass: true,
    downloads_enabled: true,
    zip_enabled: true,
    favorites_enabled: true,
    download_sizes: 'both',
    view_count: 42,
    expiry_date: null,
    expiry_reminder_days: 7,
    created_at: '2024-03-01T00:00:00.000Z',
    updated_at: '2024-03-01T00:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-0000-0000-0000-000000000002',
    photographer_id: TEST_USER_ID,
    slug: 'johnson-portraits-xyz99',
    title: 'Johnson Portraits',
    client_name: 'Tom Johnson',
    client_email: null,
    cover_url: null,
    status: 'draft',
    layout: 'grid',
    theme: 'dark',
    pin_enabled: true,
    pin_code: '1234',
    admin_bypass: true,
    downloads_enabled: false,
    zip_enabled: false,
    favorites_enabled: true,
    download_sizes: 'both',
    view_count: 5,
    expiry_date: null,
    expiry_reminder_days: 7,
    created_at: '2024-03-15T00:00:00.000Z',
    updated_at: '2024-03-15T00:00:00.000Z',
  },
]

/**
 * Pre-populates localStorage with a fake Supabase session via addInitScript().
 * This runs BEFORE any page script, so supabase.auth.getSession() reads from
 * localStorage immediately and never hits the network.
 *
 * Call this BEFORE page.goto().
 */
export async function injectSupabaseSession(page: Page) {
  await page.addInitScript(
    ({ ref, user, token }) => {
      const now = Math.floor(Date.now() / 1000)
      const key = `sb-${ref}-auth-token`
      localStorage.setItem(
        key,
        JSON.stringify({
          access_token: token,
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: now + 3600,
          refresh_token: 'fake-refresh-token',
          user,
        }),
      )
    },
    { ref: PROJECT_REF, user: FAKE_USER, token: FAKE_ACCESS_TOKEN },
  )
}

/**
 * Registers route intercepts for the Supabase REST + Auth APIs,
 * and blocks external resources (Google Fonts, etc.) that would hang
 * in a network-isolated environment.
 * Call this BEFORE page.goto() so every request is covered.
 */
export async function mockSupabaseRoutes(page: Page) {
  // Block external resources that would hang without network access
  await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com|gravatar\.com/, route => route.abort())

  const base = SUPABASE_URL

  // ── Auth: getSession / refresh ──────────────────────────────────────────
  await page.route(`${base}/auth/v1/token*`, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: FAKE_ACCESS_TOKEN,
        refresh_token: 'fake-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: FAKE_USER,
      }),
    }),
  )

  await page.route(`${base}/auth/v1/user*`, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FAKE_USER),
    }),
  )

  await page.route(`${base}/auth/v1/logout*`, route =>
    route.fulfill({ status: 204, body: '' }),
  )

  // ── Profiles ─────────────────────────────────────────────────────────────
  await page.route(`${base}/rest/v1/profiles*`, async route => {
    const method = route.request().method()
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_PROFILE),
      })
    }
    if (method === 'PATCH') {
      const body = route.request().postDataJSON() ?? {}
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...FAKE_PROFILE, ...body }),
      })
    }
    return route.continue()
  })

  // ── Galleries ─────────────────────────────────────────────────────────────
  await page.route(`${base}/rest/v1/galleries*`, async route => {
    const method = route.request().method()
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_GALLERIES),
      })
    }
    if (method === 'POST') {
      const body = route.request().postDataJSON() ?? {}
      const newGallery = {
        id: 'aaaaaaaa-0000-0000-0000-' + Date.now().toString().slice(-12),
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...body,
      }
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newGallery),
      })
    }
    if (method === 'PATCH') {
      const body = route.request().postDataJSON() ?? {}
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...FAKE_GALLERIES[0], ...body }),
      })
    }
    return route.continue()
  })

  // ── Photos ────────────────────────────────────────────────────────────────
  await page.route(`${base}/rest/v1/photos*`, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  )

  // ── Edge functions (upload URL) ───────────────────────────────────────────
  await page.route(`${base}/functions/v1/*`, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        uploadUrl: 'https://mock-r2.example.com/upload',
        publicUrl: 'https://mock-r2.example.com/photo.jpg',
      }),
    }),
  )
}
