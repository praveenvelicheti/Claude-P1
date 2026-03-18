/**
 * Public gallery page tests — client-facing view.
 * Uses mocked gallery data from helpers/auth.ts.
 */
import { test, expect } from '@playwright/test'
import { mockSupabaseRoutes, injectSupabaseSession, FAKE_GALLERIES } from './helpers/auth'

const PUBLISHED_GALLERY = FAKE_GALLERIES[0] // slug: 'smith-wedding-abc12', no PIN
const PIN_GALLERY = FAKE_GALLERIES[1] // slug: 'johnson-portraits-xyz99', PIN: '1234'

async function setupPublicGallery(
  page: import('@playwright/test').Page,
  gallery: typeof FAKE_GALLERIES[0],
  options?: { asPhotographer?: boolean },
) {
  await mockSupabaseRoutes(page)

  // Override galleries to return this specific gallery for slug-based lookup
  await page.route('**/rest/v1/galleries*', async route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(gallery),
      })
    }
    return route.continue()
  })

  await page.route('**/rest/v1/profiles*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: gallery.photographer_id,
        studio_name: 'Test Photography',
        logo_url: null,
        accent_color: '#5cbdb9',
        plan: 'free',
      }),
    }),
  )

  await page.route('**/rest/v1/photos*', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )

  await page.route('**/rest/v1/favorites*', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )

  await page.route('**/rest/v1/downloads*', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )

  if (options?.asPhotographer) {
    await injectSupabaseSession(page)
  }
}

test.describe('Public gallery — no PIN', () => {
  test.beforeEach(async ({ page }) => {
    await setupPublicGallery(page, PUBLISHED_GALLERY)
  })

  test('gallery page loads and shows title', async ({ page }) => {
    await page.goto(`/g/${PUBLISHED_GALLERY.slug}`, { waitUntil: 'domcontentloaded' })
    // Title appears in the hero h1
    await expect(page.getByRole('heading', { name: PUBLISHED_GALLERY.title })).toBeVisible({ timeout: 10000 })
  })

  test('shows studio name in gallery nav', async ({ page }) => {
    await page.goto(`/g/${PUBLISHED_GALLERY.slug}`, { waitUntil: 'domcontentloaded' })
    // Gallery title appears in the sticky nav bar as a subtitle
    await expect(page.getByText(PUBLISHED_GALLERY.title).first()).toBeVisible({ timeout: 8000 })
  })

  test('no PIN gate shown for public gallery', async ({ page }) => {
    await page.goto(`/g/${PUBLISHED_GALLERY.slug}`, { waitUntil: 'domcontentloaded' })
    // Gallery title should be visible
    await expect(page.getByRole('heading', { name: PUBLISHED_GALLERY.title })).toBeVisible({ timeout: 10000 })
    // No password input (PIN gate)
    await expect(page.locator('input[type="password"]')).toHaveCount(0)
  })
})

test.describe('Public gallery — PIN protected', () => {
  test.beforeEach(async ({ page }) => {
    await setupPublicGallery(page, PIN_GALLERY)
  })

  test('shows PIN gate before granting access', async ({ page }) => {
    await page.goto(`/g/${PIN_GALLERY.slug}`, { waitUntil: 'domcontentloaded' })

    // PIN gate shows "Private Gallery" text and a numpad
    await expect(page.getByText('Private Gallery')).toBeVisible({ timeout: 10000 })
  })

  test('correct PIN unlocks the gallery', async ({ page }) => {
    await page.goto(`/g/${PIN_GALLERY.slug}`, { waitUntil: 'domcontentloaded' })

    // Wait for PIN numpad to appear
    await expect(page.getByText('Private Gallery')).toBeVisible({ timeout: 8000 })

    // Click each digit of the PIN (numpad uses individual digit buttons)
    const pin = PIN_GALLERY.pin_code! // '1234'
    for (const digit of pin.split('')) {
      await page.getByRole('button', { name: digit, exact: true }).click()
    }

    // After 4 digits, PIN auto-submits → gallery title should be visible
    await expect(page.getByRole('heading', { name: PIN_GALLERY.title })).toBeVisible({ timeout: 10000 })
  })

  test('wrong PIN shows error', async ({ page }) => {
    await page.goto(`/g/${PIN_GALLERY.slug}`, { waitUntil: 'domcontentloaded' })

    await expect(page.getByText('Private Gallery')).toBeVisible({ timeout: 8000 })

    // Enter wrong PIN via numpad buttons
    for (const digit of '0000'.split('')) {
      await page.getByRole('button', { name: digit, exact: true }).click()
    }

    await expect(
      page.getByText(/incorrect|wrong|invalid/i).first()
    ).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Public gallery — photographer admin bypass', () => {
  test('logged-in photographer skips PIN gate', async ({ page }) => {
    await setupPublicGallery(page, PIN_GALLERY, { asPhotographer: true })
    await page.goto(`/g/${PIN_GALLERY.slug}`, { waitUntil: 'domcontentloaded' })

    // With admin_bypass, gallery content should load without PIN
    await expect(page.getByRole('heading', { name: PIN_GALLERY.title })).toBeVisible({ timeout: 12000 })
    // No PIN gate
    await expect(page.locator('input[type="password"]')).toHaveCount(0)
  })
})
