/**
 * Auth page tests — no login required.
 * Tests the UI, form validation, and navigation of Login / Signup pages.
 */
import { test, expect } from '@playwright/test'
import { mockSupabaseRoutes } from './helpers/auth'

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseRoutes(page)
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
  })

  test('renders all key elements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.getByPlaceholder('you@studio.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    // Override auth mock to simulate failure for this test
    await page.route('**/auth/v1/token*', route =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
      }),
    )

    await page.getByPlaceholder('you@studio.com').fill('wrong@user.com')
    await page.getByPlaceholder('••••••••').fill('badpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(
      page.getByText(/invalid|credentials|failed/i).first()
    ).toBeVisible({ timeout: 8000 })
  })

  test('navigates to signup from "Create an account" link', async ({ page }) => {
    await page.getByRole('link', { name: 'Create an account' }).click()
    await expect(page).toHaveURL('/signup')
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
  })
})

test.describe('Signup page', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseRoutes(page)
    await page.goto('/signup', { waitUntil: 'domcontentloaded' })
  })

  test('renders all form fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
    await expect(page.getByPlaceholder('Ember & Light Studio')).toBeVisible()
    await expect(page.getByPlaceholder('you@studio.com')).toBeVisible()
    await expect(page.getByPlaceholder('Min 8 characters')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible()
  })

  test('shows error when password is too short', async ({ page }) => {
    await page.getByPlaceholder('Ember & Light Studio').fill('Test Studio')
    await page.getByPlaceholder('you@studio.com').fill('user@test.com')
    await page.getByPlaceholder('Min 8 characters').fill('short')
    await page.getByRole('button', { name: 'Create Account' }).click()

    await expect(page.getByText(/at least 8 characters/i)).toBeVisible({ timeout: 5000 })
  })

  test('successful signup shows confirmation screen', async ({ page }) => {
    await page.route('**/auth/v1/signup*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 'new-user', email: 'new@user.com' }, session: null }),
      }),
    )

    await page.getByPlaceholder('Ember & Light Studio').fill('My New Studio')
    await page.getByPlaceholder('you@studio.com').fill('newuser@test.com')
    await page.getByPlaceholder('Min 8 characters').fill('SecurePass123!')
    await page.getByRole('button', { name: 'Create Account' }).click()

    // Should show the "You're in!" confirmation heading
    await expect(page.getByRole('heading', { name: /You're in/i })).toBeVisible({ timeout: 8000 })
  })

  test('navigates back to login via "Sign in" link', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Route protection', () => {
  test('redirects unauthenticated users from /dashboard to /login', async ({ page }) => {
    await mockSupabaseRoutes(page)
    // Override auth to return no session
    await page.route('**/auth/v1/token*', route =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
    )
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForURL(/\/login/, { timeout: 10000 })
    await expect(page).toHaveURL('/login')
  })

  test('redirects unauthenticated users from /dashboard/settings to /login', async ({ page }) => {
    await mockSupabaseRoutes(page)
    await page.route('**/auth/v1/token*', route =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
    )
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
    await page.waitForURL(/\/login/, { timeout: 10000 })
    await expect(page).toHaveURL('/login')
  })
})
