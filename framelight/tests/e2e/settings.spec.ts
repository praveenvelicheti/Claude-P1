/**
 * Settings page tests — all 6 tabs, profile data reflection.
 */
import { test, expect } from '@playwright/test'
import { mockSupabaseRoutes, injectSupabaseSession, TEST_EMAIL, TEST_STUDIO } from './helpers/auth'

async function setup(page: import('@playwright/test').Page) {
  await mockSupabaseRoutes(page)
  await injectSupabaseSession(page)
  await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
  await page.waitForURL('/dashboard/settings', { timeout: 12000 })
}

test.describe('Settings — tabs', () => {
  test('all 6 tabs are visible', async ({ page }) => {
    await setup(page)

    for (const tab of ['Profile', 'Branding', 'Billing', 'Gallery Defaults', 'Notifications', 'Security']) {
      await expect(page.getByRole('button', { name: tab })).toBeVisible()
    }
  })

  test('Profile tab is active by default', async ({ page }) => {
    await setup(page)

    const profileTab = page.getByRole('button', { name: 'Profile' })
    await expect(profileTab).toHaveClass(/font-medium/)
  })

  test('clicking a tab makes it active', async ({ page }) => {
    await setup(page)

    // Use exact: true to match only the sidebar nav tab button, not "Save Branding"
    await page.getByRole('button', { name: 'Branding', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Branding', exact: true })).toHaveClass(/font-medium/, { timeout: 3000 })
  })
})

test.describe('Settings — Profile tab', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page)
  })

  test('profile avatar shows studio initials', async ({ page }) => {
    // Studio "Playwright Test Studio" → first 2 chars = "PL"
    const avatar = page.locator('.bg-teal.flex.items-center.justify-center').filter({ hasText: 'PL' }).first()
    await expect(avatar).toBeVisible({ timeout: 8000 })
  })

  test('studio name field is pre-filled with profile data', async ({ page }) => {
    const studioInput = page.getByPlaceholder('Ember & Light Studio')
    await expect(studioInput).toHaveValue(TEST_STUDIO, { timeout: 8000 })
  })

  test('email field is pre-filled', async ({ page }) => {
    const emailInput = page.getByPlaceholder('you@studio.com')
    await expect(emailInput).toHaveValue(TEST_EMAIL, { timeout: 8000 })
  })

  test('Save Changes calls updateProfile and shows toast', async ({ page }) => {
    let patchCalled = false
    // Override the profile route — handle ALL methods to avoid network calls
    await page.route('**/rest/v1/profiles*', async route => {
      const method = route.request().method()
      if (method === 'PATCH') {
        patchCalled = true
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ studio_name: TEST_STUDIO, accent_color: '#5cbdb9' }),
        })
      }
      // Return profile for GET requests
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: '00000000-0000-0000-0000-000000000001', studio_name: TEST_STUDIO, accent_color: '#5cbdb9', plan: 'free', storage_used_bytes: 0 }),
      })
    })

    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page.getByText('Profile saved')).toBeVisible({ timeout: 8000 })
    expect(patchCalled).toBe(true)
  })
})

test.describe('Settings — Branding tab', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page)
    await page.getByRole('button', { name: 'Branding' }).click()
  })

  test('branding fields render', async ({ page }) => {
    await expect(page.getByText('Studio Name').first()).toBeVisible()
    await expect(page.getByText('Accent Color')).toBeVisible()
    await expect(page.getByText('Default Gallery Theme')).toBeVisible()
    await expect(page.getByText('Custom Domain')).toBeVisible()
  })

  test('studio name is pre-filled', async ({ page }) => {
    // Branding studio name input (first input after "Studio Name" label)
    const studioInput = page.locator('main input[type="text"]').first()
    await expect(studioInput).toHaveValue(TEST_STUDIO, { timeout: 8000 })
  })

  test('accent color hex input is pre-filled', async ({ page }) => {
    // The text input showing the hex color value (next to color picker)
    await expect(page.locator('input[type="text"][value^="#"]').first()).toBeVisible({ timeout: 8000 })
  })

  test('Save Branding shows success toast', async ({ page }) => {
    await page.getByRole('button', { name: 'Save Branding' }).click()
    await expect(page.getByText('Branding saved')).toBeVisible({ timeout: 8000 })
  })
})

test.describe('Settings — Billing tab', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page)
    await page.getByRole('button', { name: 'Billing' }).click()
  })

  test('shows current plan banner', async ({ page }) => {
    // The plan banner at the top of Billing tab
    await expect(page.getByRole('heading', { name: /free plan/i }).or(
      page.locator('.bg-ink').getByText(/free plan/i)
    ).first()).toBeVisible({ timeout: 6000 })
  })

  test('shows all 4 plan cards', async ({ page }) => {
    for (const plan of ['Free', 'Basic', 'Pro', 'Ultimate']) {
      await expect(page.getByText(plan).first()).toBeVisible()
    }
  })

  test('Upgrade Plan button is visible', async ({ page }) => {
    // The upgrade button is inside the dark banner at top of billing tab
    await expect(page.getByText('Upgrade Plan').first()).toBeVisible()
  })
})

test.describe('Settings — Gallery Defaults tab', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page)
    await page.getByRole('button', { name: 'Gallery Defaults' }).click()
  })

  test('all default toggles are visible', async ({ page }) => {
    await expect(page.getByText('Enable Downloads by default')).toBeVisible()
    await expect(page.getByText('Enable ZIP download by default')).toBeVisible()
    await expect(page.getByText('Enable Favorites by default')).toBeVisible()
    await expect(page.getByText('Enable PIN protection by default')).toBeVisible()
    await expect(page.getByText('Photographer admin bypass by default')).toBeVisible()
  })
})

test.describe('Settings — Notifications tab', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page)
    await page.getByRole('button', { name: 'Notifications' }).click()
  })

  test('all notification toggles are visible', async ({ page }) => {
    await expect(page.getByText('Gallery viewed')).toBeVisible()
    await expect(page.getByText('Photo downloaded')).toBeVisible()
    await expect(page.getByText('Gallery expiring')).toBeVisible()
    await expect(page.getByText('New client activity')).toBeVisible()
  })

  test('notification descriptions are shown', async ({ page }) => {
    await expect(page.getByText(/Email when a client views/i)).toBeVisible()
    await expect(page.getByText(/Email when photos are downloaded/i)).toBeVisible()
  })
})

test.describe('Settings — Security tab', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page)
    await page.getByRole('button', { name: 'Security' }).click()
  })

  test('change password form renders', async ({ page }) => {
    await expect(page.getByText('Change Password')).toBeVisible()
    // Password labels
    await expect(page.getByText('Current Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Update Password' })).toBeVisible()
  })

  test('2FA section renders', async ({ page }) => {
    await expect(page.getByText('Two-Factor Authentication')).toBeVisible()
    await expect(page.getByText('Enable 2FA')).toBeVisible()
    await expect(page.getByText(/extra layer of security/i)).toBeVisible()
  })

  test('clicking 2FA toggle shows coming soon toast', async ({ page }) => {
    // The Security tab has: Update Password button + 2FA role="switch" toggle
    // The 2FA toggle is the only role="switch" on this tab
    await page.getByRole('switch').click()
    await expect(page.getByText(/coming soon/i)).toBeVisible({ timeout: 6000 })
  })
})
