/**
 * Gallery creation wizard tests — full 4-step flow.
 */
import { test, expect, type Page } from '@playwright/test'
import { mockSupabaseRoutes, injectSupabaseSession } from './helpers/auth'

async function setup(page: Page) {
  await mockSupabaseRoutes(page)
  await injectSupabaseSession(page)
  await page.goto('/dashboard/new', { waitUntil: 'domcontentloaded' })
  await page.waitForURL('/dashboard/new', { timeout: 12000 })
}

/** Fill the Gallery Name field and advance to step 2. */
async function completeStep1(page: Page, title = 'Playwright Gallery') {
  // Use the specific placeholder to find the Gallery Name input
  await page.getByPlaceholder('Emma & James Wedding').fill(title)
  await page.getByRole('button', { name: 'Continue' }).click()
  // Step 2 upload area
  await expect(
    page.getByText(/Drop photos|Upload Photos|drag/i).first()
  ).toBeVisible({ timeout: 12000 })
}

async function skipToStep(page: Page, targetStep: number, title = 'PW Gallery') {
  if (targetStep <= 1) return
  await completeStep1(page, title)
  if (targetStep <= 2) return
  // Step 2 → 3
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Enable Downloads').first()).toBeVisible({ timeout: 8000 })
  if (targetStep <= 3) return
  // Step 3 → 4
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('button', { name: 'Publish Gallery' })).toBeVisible({ timeout: 8000 })
}

test.describe('Step 1 — Details', () => {
  test('form renders with all fields', async ({ page }) => {
    await setup(page)

    // Step tab buttons (use role to avoid strict violation with "Gallery Details" text)
    await expect(page.getByRole('button', { name: 'Details' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Photos' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Design' })).toBeVisible()

    // Gallery name input (unique placeholder)
    await expect(page.getByPlaceholder('Emma & James Wedding')).toBeVisible()

    // Preview panel
    await expect(page.getByText('Gallery Preview')).toBeVisible()
  })

  test('shows error toast when title is empty and Continue is clicked', async ({ page }) => {
    await setup(page)
    await page.getByRole('button', { name: 'Continue' }).click()
    // Toast appears with "Please enter a gallery name"
    await expect(page.getByText('Please enter a gallery name')).toBeVisible({ timeout: 6000 })
  })

  test('preview panel updates as title is typed', async ({ page }) => {
    await setup(page)
    await page.getByPlaceholder('Emma & James Wedding').fill('Live Preview Gallery')
    // Title appears in the preview panel on the right
    await expect(page.getByText('Live Preview Gallery').first()).toBeVisible()
  })

  test('Cancel button navigates to galleries list', async ({ page }) => {
    await setup(page)
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page).toHaveURL('/dashboard/galleries')
  })
})

test.describe('Step 2 — Photos', () => {
  test('upload area renders', async ({ page }) => {
    await setup(page)
    await completeStep1(page)

    await expect(
      page.getByText(/Drop photos|Upload Photos|drag/i).first()
    ).toBeVisible({ timeout: 8000 })
  })

  test('can continue without uploading any photos', async ({ page }) => {
    await setup(page)
    await completeStep1(page)

    await page.getByRole('button', { name: 'Continue' }).click()
    // Should reach step 3
    await expect(page.getByText('Enable Downloads').first()).toBeVisible({ timeout: 8000 })
  })

  test('Back button returns to step 1', async ({ page }) => {
    await setup(page)
    await completeStep1(page)

    await page.getByRole('button', { name: 'Back' }).click()
    // Back on step 1 — Gallery Name input visible again
    await expect(page.getByPlaceholder('Emma & James Wedding')).toBeVisible({ timeout: 6000 })
  })
})

test.describe('Step 3 — Settings', () => {
  test('settings toggles render', async ({ page }) => {
    await setup(page)
    await skipToStep(page, 3)

    await expect(page.getByText('Enable Downloads').first()).toBeVisible()
    await expect(page.getByText(/ZIP/i).first()).toBeVisible()
    await expect(page.getByText(/Favorites/i).first()).toBeVisible()
    await expect(page.getByText(/PIN/i).first()).toBeVisible()
  })

  test('toggling PIN shows PIN code input', async ({ page }) => {
    await setup(page)
    await skipToStep(page, 3)

    // Click the Toggle switch button for "Enable PIN Protection"
    // The Toggle component renders a role="switch" button
    const switches = page.getByRole('switch')
    await switches.first().click() // first switch is PIN Protection

    // 4 individual digit inputs should appear (PIN entry uses 4 separate cells)
    await expect(
      page.locator('input[maxlength="1"]').first()
    ).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Step 4 — Design', () => {
  test('design options render', async ({ page }) => {
    await setup(page)
    await skipToStep(page, 4)

    await expect(
      page.getByText(/Theme|Layout|Accent/i).first()
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Publish Gallery' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save Draft' })).toBeVisible()
  })

  test('Save Draft navigates to galleries list', async ({ page }) => {
    await setup(page)
    await skipToStep(page, 4)

    await page.getByRole('button', { name: 'Save Draft' }).click()
    await expect(page).toHaveURL('/dashboard/galleries')
  })
})

test.describe('Full gallery creation flow', () => {
  test('creates and publishes a gallery end-to-end', async ({ page }) => {
    await setup(page)

    const title = `PW Full Flow ${Date.now()}`

    // Step 1 — Details
    await page.getByPlaceholder('Emma & James Wedding').fill(title)
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText(/Drop photos|Upload Photos/i).first()).toBeVisible({ timeout: 12000 })

    // Step 2 — Photos (skip)
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Enable Downloads').first()).toBeVisible({ timeout: 8000 })

    // Step 3 — Settings
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('button', { name: 'Publish Gallery' })).toBeVisible({ timeout: 8000 })

    // Step 4 — Publish
    await page.getByRole('button', { name: 'Publish Gallery' }).click()

    // Should navigate away or show success toast
    await expect(
      page.getByText(/published/i).first().or(page.locator('[class*="toast"]').first())
    ).toBeVisible({ timeout: 15000 })
  })
})
