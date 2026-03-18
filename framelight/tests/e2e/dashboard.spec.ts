/**
 * Dashboard tests — all requests mocked via Supabase route intercepts.
 */
import { test, expect } from '@playwright/test'
import { mockSupabaseRoutes, injectSupabaseSession } from './helpers/auth'

async function setup(page: import('@playwright/test').Page, path = '/dashboard') {
  await mockSupabaseRoutes(page)
  await injectSupabaseSession(page)
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForURL(path, { timeout: 12000 })
}

test.describe('Dashboard Overview', () => {
  test('hero and stats render', async ({ page }) => {
    await setup(page)

    await expect(page.getByText(/Good to see you/i).first()).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('Active Galleries').first()).toBeVisible()
    await expect(page.getByText('Total Views').first()).toBeVisible()
    await expect(page.getByText('Storage Used').first()).toBeVisible()
    await expect(page.getByText(/Pro tip/i).first()).toBeVisible()
  })

  test('displays studio name in hero greeting', async ({ page }) => {
    await setup(page)
    // Studio name appears in the hero inside the <em> tag
    await expect(
      page.locator('main em').filter({ hasText: 'Playwright Test Studio' })
    ).toBeVisible({ timeout: 8000 })
  })

  test('shows recent galleries from mocked data', async ({ page }) => {
    await setup(page)
    await expect(page.getByText('Smith Wedding').first()).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('Johnson Portraits').first()).toBeVisible()
  })

  test('New Gallery button navigates to wizard', async ({ page }) => {
    await setup(page)
    await page.getByRole('button', { name: 'New Gallery' }).first().click()
    await expect(page).toHaveURL('/dashboard/new')
  })

  test('View All button navigates to galleries list', async ({ page }) => {
    await setup(page)
    await page.getByRole('button', { name: 'View All' }).click()
    await expect(page).toHaveURL('/dashboard/galleries')
  })

  test('See all link navigates to galleries list', async ({ page }) => {
    await setup(page)
    await page.getByRole('button', { name: 'See all' }).click()
    await expect(page).toHaveURL('/dashboard/galleries')
  })
})

test.describe('Sidebar navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page)
  })

  test('sidebar shows Framelight branding', async ({ page }) => {
    const sidebar = page.locator('aside')
    await expect(sidebar.getByText('Framelight')).toBeVisible()
  })

  test('studio name and plan show in user row', async ({ page }) => {
    const sidebar = page.locator('aside')
    await expect(sidebar.getByText('Playwright Test Studio')).toBeVisible()
    await expect(sidebar.getByText(/free plan/i)).toBeVisible()
  })

  test('storage bar renders', async ({ page }) => {
    const sidebar = page.locator('aside')
    await expect(sidebar.getByText('Storage')).toBeVisible()
    await expect(sidebar.getByText(/GB/).first()).toBeVisible()
  })

  test('Galleries nav link navigates correctly', async ({ page }) => {
    await page.getByRole('link', { name: 'Galleries' }).click()
    await expect(page).toHaveURL('/dashboard/galleries')
  })

  test('Settings nav link navigates correctly', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL('/dashboard/settings')
  })

  test('clicking studio row navigates to settings — NOT logout', async ({ page }) => {
    const studioRow = page.locator('aside').locator('div[class*="rounded-lg"][class*="cursor-pointer"]').last()
    await studioRow.click()
    await expect(page).toHaveURL('/dashboard/settings', { timeout: 6000 })
  })

  test('sign-out icon signs user out and redirects to login', async ({ page }) => {
    const signOutBtn = page.locator('aside').getByTitle('Sign out')
    await signOutBtn.click()
    await page.waitForURL('/login', { timeout: 8000 })
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Galleries list page', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page, '/dashboard/galleries')
  })

  test('filter tabs are visible', async ({ page }) => {
    // Filter labels are lowercase: 'all', 'published', 'draft', 'expired'
    await expect(page.getByRole('button', { name: 'all' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'published' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'draft' }).first()).toBeVisible()
  })

  test('shows gallery cards', async ({ page }) => {
    await expect(page.getByText('Smith Wedding').first()).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('Johnson Portraits').first()).toBeVisible()
  })

  test('published filter shows published galleries', async ({ page }) => {
    await page.getByRole('button', { name: 'published' }).first().click()
    await expect(page.getByText('Smith Wedding').first()).toBeVisible({ timeout: 6000 })
  })

  test('draft filter shows draft galleries', async ({ page }) => {
    await page.getByRole('button', { name: 'draft' }).first().click()
    await expect(page.getByText('Johnson Portraits').first()).toBeVisible({ timeout: 6000 })
  })

  test('New Gallery button is clickable', async ({ page }) => {
    await page.getByRole('button', { name: /New Gallery/i }).click()
    await expect(page).toHaveURL('/dashboard/new')
  })
})
