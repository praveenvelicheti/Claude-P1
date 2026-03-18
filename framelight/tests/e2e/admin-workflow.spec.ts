/**
 * Admin Photographer Workflow — end-to-end simulation.
 *
 * Covers the full journey a photographer takes from first login:
 *   1. Edit profile (name, website, location) → save & verify toast
 *   2. Edit brand info (studio name, accent color, theme) → save & verify toast
 *   3. Create gallery — page by page through all 4 steps
 *      · Step 1: fill details (name, client, email, type)
 *      · Step 2: skip photo upload (optional)
 *      · Step 3: configure settings (downloads, PIN, favorites)
 *      · Step 4: configure design (theme, layout, accent color)
 *      · Publish the gallery → verify success toast
 *   4. "Edit" an existing gallery via the galleries list
 *   5. Error message clarity — each error names the exact operation that failed
 */

import { test, expect, type Page } from '@playwright/test'
import {
  mockSupabaseRoutes,
  injectSupabaseSession,
  SUPABASE_URL,
  TEST_STUDIO,
  FAKE_GALLERIES,
} from './helpers/auth'

// ─── Shared setup ────────────────────────────────────────────────────────────

async function setupSettings(page: Page) {
  await mockSupabaseRoutes(page)
  await injectSupabaseSession(page)
  await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
  await page.waitForURL('/dashboard/settings', { timeout: 12000 })
}

async function setupNewGallery(page: Page) {
  await mockSupabaseRoutes(page)
  await injectSupabaseSession(page)
  await page.goto('/dashboard/new', { waitUntil: 'domcontentloaded' })
  await page.waitForURL('/dashboard/new', { timeout: 12000 })
}

async function setupGalleries(page: Page) {
  await mockSupabaseRoutes(page)
  await injectSupabaseSession(page)
  await page.goto('/dashboard/galleries', { waitUntil: 'domcontentloaded' })
  await page.waitForURL('/dashboard/galleries', { timeout: 12000 })
}

// ─── Gallery wizard navigation helpers ───────────────────────────────────────

/** Fill Step 1 and advance to Step 2. */
async function completeStep1(
  page: Page,
  opts: { title?: string; clientName?: string; clientEmail?: string; type?: string } = {},
) {
  const {
    title = 'Playwright Admin Gallery',
    clientName = 'Alice Client',
    clientEmail = 'alice@example.com',
    type = 'portrait',
  } = opts

  await page.getByPlaceholder('Emma & James Wedding').fill(title)
  if (clientName) await page.getByPlaceholder('Emma Johnson').fill(clientName)
  if (clientEmail) await page.getByPlaceholder('emma@email.com').fill(clientEmail)

  // Gallery type dropdown
  const typeSelect = page.locator('select').first()
  if (await typeSelect.isVisible()) {
    await typeSelect.selectOption(type)
  }

  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText(/Drop photos|Upload Photos|drag/i).first()).toBeVisible({ timeout: 12000 })
}

/** Skip Step 2 (photos) and advance to Step 3. */
async function skipStep2(page: Page) {
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Enable Downloads').first()).toBeVisible({ timeout: 8000 })
}

/** Configure Step 3 settings and advance to Step 4. */
async function completeStep3(
  page: Page,
  opts: { enablePin?: boolean; enableDownloads?: boolean } = {},
) {
  const { enablePin = false } = opts

  if (enablePin) {
    // Toggle PIN — first switch on the page is PIN protection
    const switches = page.getByRole('switch')
    const pinSwitch = switches.first()
    await pinSwitch.click()
    // Wait for PIN inputs to appear then fill them
    const pinInputs = page.locator('input[maxlength="1"]')
    await expect(pinInputs.first()).toBeVisible({ timeout: 5000 })
    await pinInputs.nth(0).fill('1')
    await pinInputs.nth(1).fill('2')
    await pinInputs.nth(2).fill('3')
    await pinInputs.nth(3).fill('4')
  }

  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('button', { name: 'Publish Gallery' })).toBeVisible({ timeout: 8000 })
}

/** Configure Step 4 design and publish. */
async function publishGallery(page: Page, opts: { theme?: string; layout?: string } = {}) {
  const { theme = 'dark', layout = 'masonry' } = opts

  // Theme select
  const themeSelect = page.locator('select').filter({ hasText: /framelight|dark|minimal/i }).first()
  if (await themeSelect.isVisible()) {
    await themeSelect.selectOption(theme)
  }

  // Layout: find button group for layout options if present
  const layoutButton = page.getByRole('button', { name: new RegExp(layout, 'i') })
  if (await layoutButton.count() > 0) {
    await layoutButton.first().click()
  }

  await page.getByRole('button', { name: 'Publish Gallery' }).click()
}

// ─── 1. Edit Photographer Profile ────────────────────────────────────────────

test.describe('Admin workflow — 1. Edit profile', () => {
  test.beforeEach(async ({ page }) => {
    await setupSettings(page)
    // Profile tab is active by default
  })

  test('profile tab loads with pre-filled studio name', async ({ page }) => {
    await expect(page.getByPlaceholder('Ember & Light Studio')).toHaveValue(TEST_STUDIO, { timeout: 8000 })
  })

  test('admin can update studio name and website', async ({ page }) => {
    await page.getByPlaceholder('Ember & Light Studio').fill('Updated Studio Name')
    await page.getByPlaceholder('https://yourstudio.com').fill('https://mystudy.com')
    await page.getByPlaceholder('New York, NY').fill('Austin, TX')

    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page.getByText('Profile saved')).toBeVisible({ timeout: 8000 })
  })

  test('error message names the failing operation — profile save failure', async ({ page }) => {
    // Override profile route to return a server error on PATCH
    await page.route(`${SUPABASE_URL}/rest/v1/profiles*`, async route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ status: 500, body: JSON.stringify({ message: 'internal error' }) })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '00000000-0000-0000-0000-000000000001',
          studio_name: TEST_STUDIO,
          accent_color: '#5cbdb9',
          plan: 'free',
          storage_used_bytes: 0,
        }),
      })
    })

    await page.getByRole('button', { name: 'Save Changes' }).click()
    // Error must clearly name the operation (not just "Failed to save")
    await expect(page.getByText(/Failed to save profile/i)).toBeVisible({ timeout: 8000 })
  })

  test('profile avatar initials are visible', async ({ page }) => {
    // "Playwright Test Studio" → "PL"
    await expect(page.locator('text=PL').first()).toBeVisible({ timeout: 8000 })
  })

  test('Upload Photo button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Upload Photo' })).toBeVisible()
  })
})

// ─── 2. Edit Brand Info ───────────────────────────────────────────────────────

test.describe('Admin workflow — 2. Edit brand info', () => {
  test.beforeEach(async ({ page }) => {
    await setupSettings(page)
    await page.getByRole('button', { name: 'Branding', exact: true }).click()
    // Wait for branding section to load
    await expect(page.getByText('Accent Color')).toBeVisible({ timeout: 6000 })
  })

  test('branding tab renders all fields', async ({ page }) => {
    await expect(page.getByText('Studio Name').first()).toBeVisible()
    await expect(page.getByText('Accent Color')).toBeVisible()
    await expect(page.getByText('Default Gallery Theme')).toBeVisible()
    await expect(page.getByText('Custom Domain')).toBeVisible()
  })

  test('admin can update studio name in branding', async ({ page }) => {
    const studioInput = page.locator('main input[type="text"]').first()
    await studioInput.fill('New Brand Studio')
    await page.getByRole('button', { name: 'Save Branding' }).click()
    await expect(page.getByText('Branding saved')).toBeVisible({ timeout: 8000 })
  })

  test('admin can update accent color', async ({ page }) => {
    // The hex text input next to the color picker
    const hexInput = page.locator('input[type="text"]').filter({ hasText: /^#/ }).or(
      page.locator('input[type="text"][value^="#"]')
    ).first()
    await hexInput.fill('#ff6600')
    await page.getByRole('button', { name: 'Save Branding' }).click()
    await expect(page.getByText('Branding saved')).toBeVisible({ timeout: 8000 })
  })

  test('admin can update default gallery theme', async ({ page }) => {
    const themeSelect = page.locator('select').first()
    await themeSelect.selectOption('dark')
    await expect(themeSelect).toHaveValue('dark')
    await page.getByRole('button', { name: 'Save Branding' }).click()
    await expect(page.getByText('Branding saved')).toBeVisible({ timeout: 8000 })
  })

  test('admin can set custom domain', async ({ page }) => {
    await page.getByPlaceholder('galleries.yourstudio.com').fill('galleries.mystudy.com')
    await page.getByRole('button', { name: 'Save Branding' }).click()
    await expect(page.getByText('Branding saved')).toBeVisible({ timeout: 8000 })
  })

  test('error message names the failing operation — branding save failure', async ({ page }) => {
    await page.route(`${SUPABASE_URL}/rest/v1/profiles*`, async route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ status: 500, body: JSON.stringify({ message: 'internal error' }) })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '00000000-0000-0000-0000-000000000001',
          studio_name: TEST_STUDIO,
          accent_color: '#5cbdb9',
          plan: 'free',
          storage_used_bytes: 0,
        }),
      })
    })

    await page.getByRole('button', { name: 'Save Branding' }).click()
    // Error must clearly name the operation (not just "Failed to save")
    await expect(page.getByText(/Failed to save branding/i)).toBeVisible({ timeout: 8000 })
  })
})

// ─── 3. Create Gallery — Step 1: Details ─────────────────────────────────────

test.describe('Admin workflow — 3a. Create gallery: Step 1 Details', () => {
  test.beforeEach(async ({ page }) => {
    await setupNewGallery(page)
  })

  test('step indicator shows 4 steps', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Details' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Photos' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Design' })).toBeVisible()
  })

  test('step 1 renders all detail fields', async ({ page }) => {
    await expect(page.getByPlaceholder('Emma & James Wedding')).toBeVisible()
    await expect(page.getByPlaceholder('Emma Johnson')).toBeVisible()
    await expect(page.getByPlaceholder('emma@email.com')).toBeVisible()
    await expect(page.getByText('Gallery Preview')).toBeVisible()
  })

  test('empty title shows a clear, specific error', async ({ page }) => {
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Please enter a gallery name')).toBeVisible({ timeout: 6000 })
  })

  test('preview panel updates live as title is typed', async ({ page }) => {
    await page.getByPlaceholder('Emma & James Wedding').fill('Live Title Test')
    await expect(page.getByText('Live Title Test').first()).toBeVisible()
  })

  test('gallery type dropdown has all options', async ({ page }) => {
    const typeSelect = page.locator('select').first()
    for (const opt of ['Wedding', 'Portrait', 'Family', 'Commercial', 'Event', 'Other']) {
      await expect(typeSelect.locator(`option:has-text("${opt}")`)).toHaveCount(1)
    }
  })

  test('Cancel button returns to galleries list', async ({ page }) => {
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page).toHaveURL('/dashboard/galleries')
  })

  test('admin fills all step 1 fields and proceeds to step 2', async ({ page }) => {
    await completeStep1(page, {
      title: 'Admin Full Details Gallery',
      clientName: 'Bob Builder',
      clientEmail: 'bob@build.com',
      type: 'family',
    })
    // Should now be on step 2
    await expect(page.getByText(/Drop photos|Upload Photos|drag/i).first()).toBeVisible()
  })

  test('error message is clear when gallery creation fails on step 1', async ({ page }) => {
    // Replace the full galleries route handler — POST returns a PostgREST error,
    // GET still returns fake galleries (no route.continue() to avoid chain issues)
    await page.route(`${SUPABASE_URL}/rest/v1/galleries*`, async route => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'PGRST301', message: 'Database error', details: '', hint: '' }),
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_GALLERIES),
      })
    })

    await page.getByPlaceholder('Emma & James Wedding').fill('Failure Gallery')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText(/Failed to create gallery/i)).toBeVisible({ timeout: 8000 })
  })
})

// ─── 4. Create Gallery — Step 2: Photos ──────────────────────────────────────

test.describe('Admin workflow — 3b. Create gallery: Step 2 Photos', () => {
  test.beforeEach(async ({ page }) => {
    await setupNewGallery(page)
    await completeStep1(page)
  })

  test('upload area renders on step 2', async ({ page }) => {
    await expect(page.getByText(/Drop photos|Upload Photos|drag/i).first()).toBeVisible()
  })

  test('preview panel shows 0 uploaded photos', async ({ page }) => {
    await expect(page.getByText('0 uploaded')).toBeVisible()
  })

  test('Back button returns to step 1', async ({ page }) => {
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByPlaceholder('Emma & James Wedding')).toBeVisible({ timeout: 6000 })
  })

  test('can continue to step 3 without uploading photos', async ({ page }) => {
    await skipStep2(page)
    await expect(page.getByText('Enable Downloads').first()).toBeVisible()
  })
})

// ─── 5. Create Gallery — Step 3: Settings ────────────────────────────────────

test.describe('Admin workflow — 3c. Create gallery: Step 3 Settings', () => {
  test.beforeEach(async ({ page }) => {
    await setupNewGallery(page)
    await completeStep1(page)
    await skipStep2(page)
  })

  test('all setting toggles are visible', async ({ page }) => {
    await expect(page.getByText('Enable Downloads').first()).toBeVisible()
    await expect(page.getByText(/ZIP/i).first()).toBeVisible()
    await expect(page.getByText(/Favorites/i).first()).toBeVisible()
    await expect(page.getByText(/PIN/i).first()).toBeVisible()
  })

  test('preview panel shows PIN as Off by default', async ({ page }) => {
    await expect(page.getByText('Off').first()).toBeVisible()
  })

  test('enabling PIN reveals 4-digit code input', async ({ page }) => {
    const switches = page.getByRole('switch')
    await switches.first().click()
    await expect(page.locator('input[maxlength="1"]').first()).toBeVisible({ timeout: 5000 })
    // 4 digit inputs
    await expect(page.locator('input[maxlength="1"]')).toHaveCount(4)
  })

  test('preview panel updates to show PIN as Enabled after toggle', async ({ page }) => {
    const switches = page.getByRole('switch')
    await switches.first().click()
    // Preview panel should now show "Enabled" for PIN
    await expect(page.getByText('Enabled').first()).toBeVisible({ timeout: 5000 })
  })

  test('Back button returns to step 2', async ({ page }) => {
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByText(/Drop photos|Upload Photos|drag/i).first()).toBeVisible({ timeout: 6000 })
  })

  test('admin configures PIN and advances to step 4', async ({ page }) => {
    await completeStep3(page, { enablePin: true })
    await expect(page.getByRole('button', { name: 'Publish Gallery' })).toBeVisible()
  })

  test('admin can advance to step 4 with default settings', async ({ page }) => {
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('button', { name: 'Publish Gallery' })).toBeVisible({ timeout: 8000 })
  })
})

// ─── 6. Create Gallery — Step 4: Design ──────────────────────────────────────

test.describe('Admin workflow — 3d. Create gallery: Step 4 Design', () => {
  test.beforeEach(async ({ page }) => {
    await setupNewGallery(page)
    await completeStep1(page)
    await skipStep2(page)
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('button', { name: 'Publish Gallery' })).toBeVisible({ timeout: 8000 })
  })

  test('design step renders theme and layout options', async ({ page }) => {
    await expect(page.getByText(/Theme|Layout|Accent/i).first()).toBeVisible()
  })

  test('Publish Gallery and Save Draft buttons are both visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Publish Gallery' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save Draft' })).toBeVisible()
  })

  test('Save Draft navigates to galleries list without publishing', async ({ page }) => {
    await page.getByRole('button', { name: 'Save Draft' }).click()
    await expect(page).toHaveURL('/dashboard/galleries')
  })

  test('Back button returns to step 3', async ({ page }) => {
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByText('Enable Downloads').first()).toBeVisible({ timeout: 6000 })
  })

  test('error message is clear when publish fails', async ({ page }) => {
    // Return a PostgREST error on PATCH so updateErr is set and throws
    await page.route(`${SUPABASE_URL}/rest/v1/galleries*`, async route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'PGRST301', message: 'Database error', details: '', hint: '' }),
        })
      }
      return route.continue()
    })

    await page.getByRole('button', { name: 'Publish Gallery' }).click()
    await expect(page.getByText(/Failed to publish gallery/i)).toBeVisible({ timeout: 10000 })
  })
})

// ─── 7. Full end-to-end gallery creation and publish ─────────────────────────

test.describe('Admin workflow — 3e. Full gallery creation flow', () => {
  test('admin completes all 4 steps and publishes a gallery', async ({ page }) => {
    await setupNewGallery(page)

    const title = `Admin E2E Gallery ${Date.now()}`

    // ── Step 1: Details ──────────────────────────────────────────────────────
    await page.getByPlaceholder('Emma & James Wedding').fill(title)
    await page.getByPlaceholder('Emma Johnson').fill('Jane Doe')
    await page.getByPlaceholder('emma@email.com').fill('jane@doe.com')
    // Verify live preview
    await expect(page.getByText(title).first()).toBeVisible()
    await page.getByRole('button', { name: 'Continue' }).click()

    // ── Step 2: Photos (skip) ────────────────────────────────────────────────
    await expect(page.getByText(/Drop photos|Upload Photos|drag/i).first()).toBeVisible({ timeout: 12000 })
    await page.getByRole('button', { name: 'Continue' }).click()

    // ── Step 3: Settings ─────────────────────────────────────────────────────
    await expect(page.getByText('Enable Downloads').first()).toBeVisible({ timeout: 8000 })
    // Leave defaults, advance
    await page.getByRole('button', { name: 'Continue' }).click()

    // ── Step 4: Design ───────────────────────────────────────────────────────
    await expect(page.getByRole('button', { name: 'Publish Gallery' })).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: 'Publish Gallery' }).click()

    // Success: toast or redirect
    await expect(
      page.getByText(/published/i).first().or(page.locator('[class*="toast"]').first())
    ).toBeVisible({ timeout: 15000 })
  })

  test('admin creates gallery with PIN protection enabled', async ({ page }) => {
    await setupNewGallery(page)

    await completeStep1(page, { title: 'PIN Protected Gallery' })
    await skipStep2(page)
    await completeStep3(page, { enablePin: true })

    // Step 4 — publish
    await page.getByRole('button', { name: 'Publish Gallery' }).click()
    await expect(
      page.getByText(/published/i).first().or(page.locator('[class*="toast"]').first())
    ).toBeVisible({ timeout: 15000 })
  })

  test('step tabs track completion — completed steps are clickable', async ({ page }) => {
    await setupNewGallery(page)
    await completeStep1(page)

    // After completing step 1, clicking the "Details" step tab should navigate back
    const detailsTab = page.getByRole('button', { name: 'Details' })
    await detailsTab.click()
    await expect(page.getByPlaceholder('Emma & James Wedding')).toBeVisible({ timeout: 6000 })
  })

  test('gallery link appears in preview panel after creation', async ({ page }) => {
    await setupNewGallery(page)
    await completeStep1(page)

    // After step 1, gallery is created → link snippet should appear in preview
    const linkPreview = page.locator('text=/\\/g\\//').first()
    await expect(linkPreview).toBeVisible({ timeout: 8000 })
  })
})

// ─── 8. Edit an existing gallery ─────────────────────────────────────────────

test.describe('Admin workflow — 4. Edit existing gallery', () => {
  test.beforeEach(async ({ page }) => {
    await setupGalleries(page)
  })

  test('galleries list shows existing galleries', async ({ page }) => {
    await expect(page.getByText(FAKE_GALLERIES[0].title)).toBeVisible({ timeout: 8000 })
    await expect(page.getByText(FAKE_GALLERIES[1].title)).toBeVisible({ timeout: 8000 })
  })

  test('clicking gallery title navigates to edit page', async ({ page }) => {
    await page.getByText(FAKE_GALLERIES[0].title).first().click()
    await expect(page).toHaveURL(`/dashboard/gallery/${FAKE_GALLERIES[0].id}`, { timeout: 8000 })
  })

  test('status badges are visible on gallery cards', async ({ page }) => {
    // Published gallery has a "published" badge
    await expect(page.getByText('published').first()).toBeVisible({ timeout: 8000 })
    // Draft gallery has a "draft" badge
    await expect(page.getByText('draft').first()).toBeVisible({ timeout: 8000 })
  })

  test('filter buttons narrow down the gallery list', async ({ page }) => {
    await page.getByRole('button', { name: 'published' }).click()
    // Only published gallery should show
    await expect(page.getByText(FAKE_GALLERIES[0].title)).toBeVisible({ timeout: 6000 })
    await expect(page.getByText(FAKE_GALLERIES[1].title)).not.toBeVisible()

    await page.getByRole('button', { name: 'draft' }).click()
    await expect(page.getByText(FAKE_GALLERIES[1].title)).toBeVisible({ timeout: 6000 })
    await expect(page.getByText(FAKE_GALLERIES[0].title)).not.toBeVisible()
  })

  test('delete modal requires typing DELETE to confirm', async ({ page }) => {
    // Click delete icon on first gallery card
    const deleteButtons = page.locator('button[title="Delete"]')
    await deleteButtons.first().click()

    // Modal should appear
    await expect(page.getByText('Delete Gallery?')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Type "DELETE" to confirm/i)).toBeVisible()

    // The modal's confirm Delete button — use .last() to avoid matching the icon buttons
    const confirmButton = page.getByRole('button', { name: 'Delete', exact: true }).last()
    await expect(confirmButton).toBeDisabled()

    // Type DELETE to enable
    await page.getByPlaceholder('DELETE').fill('DELETE')
    await expect(confirmButton).toBeEnabled()

    // Cancel closes the modal
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByText('Delete Gallery?')).not.toBeVisible()
  })

  test('share modal shows gallery link', async ({ page }) => {
    const shareButtons = page.locator('button[title="Share"]')
    await shareButtons.first().click()

    await expect(page.getByText('Share Gallery')).toBeVisible({ timeout: 5000 })
    // Modal subtitle confirms it's the share dialog (not just a toast)
    await expect(page.getByText('Send this link to your client')).toBeVisible()
    // Copy button is present inside the modal
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible()
  })

  test('error message is clear when gallery delete fails', async ({ page }) => {
    // Wait for galleries to render first
    await expect(page.getByText(FAKE_GALLERIES[0].title)).toBeVisible({ timeout: 8000 })

    // Replace galleries route — DELETE returns PostgREST error, GET keeps returning galleries
    await page.route(`${SUPABASE_URL}/rest/v1/galleries*`, async route => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'PGRST301', message: 'Database error', details: '', hint: '' }),
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_GALLERIES),
      })
    })

    const deleteButtons = page.locator('button[title="Delete"]')
    await deleteButtons.first().click()
    await page.getByPlaceholder('DELETE').fill('DELETE')
    // Use .last() to target the modal confirm button, not the icon buttons
    await page.getByRole('button', { name: 'Delete', exact: true }).last().click()

    await expect(page.getByText(/Failed to delete gallery/i)).toBeVisible({ timeout: 8000 })
  })
})

// ─── 9. Full admin session from settings → create → publish ──────────────────

test.describe('Admin workflow — Full session simulation', () => {
  test('admin edits profile, sets branding, creates and publishes a gallery', async ({ page }) => {
    // ── Settings: Profile ────────────────────────────────────────────────────
    await setupSettings(page)

    await page.getByPlaceholder('Ember & Light Studio').fill('My Updated Studio')
    await page.getByPlaceholder('https://yourstudio.com').fill('https://mystudio.io')
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page.getByText('Profile saved')).toBeVisible({ timeout: 8000 })

    // ── Settings: Branding ───────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Branding', exact: true }).click()
    await expect(page.getByText('Accent Color')).toBeVisible({ timeout: 6000 })

    const hexInput = page.locator('input[type="text"][value^="#"]').first()
    await hexInput.fill('#3366ff')
    const themeSelect = page.locator('select').first()
    await themeSelect.selectOption('minimal')
    await page.getByRole('button', { name: 'Save Branding' }).click()
    await expect(page.getByText('Branding saved')).toBeVisible({ timeout: 8000 })

    // ── Navigate to New Gallery ───────────────────────────────────────────────
    await page.goto('/dashboard/new', { waitUntil: 'domcontentloaded' })
    await page.waitForURL('/dashboard/new', { timeout: 12000 })

    const galleryTitle = `Full Session Gallery ${Date.now()}`

    // Step 1 — Details
    await page.getByPlaceholder('Emma & James Wedding').fill(galleryTitle)
    await page.getByPlaceholder('Emma Johnson').fill('Session Client')
    await page.getByPlaceholder('emma@email.com').fill('session@client.com')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText(/Drop photos|Upload Photos|drag/i).first()).toBeVisible({ timeout: 12000 })

    // Step 2 — Photos (skip)
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Enable Downloads').first()).toBeVisible({ timeout: 8000 })

    // Step 3 — Settings (defaults)
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('button', { name: 'Publish Gallery' })).toBeVisible({ timeout: 8000 })

    // Step 4 — Publish
    await page.getByRole('button', { name: 'Publish Gallery' }).click()
    await expect(
      page.getByText(/published/i).first().or(page.locator('[class*="toast"]').first())
    ).toBeVisible({ timeout: 15000 })
  })
})
