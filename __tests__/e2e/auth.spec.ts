import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
    test('should display login page', async ({ page }) => {
        await page.goto('/login')

        await expect(page).toHaveTitle(/4FIS/)
        await expect(page.getByRole('heading', { name: /4FISuctenky/i })).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/login')

        await page.getByLabel(/email/i).fill('invalid@test.com')
        await page.getByLabel(/heslo/i).fill('wrongpassword')
        await page.getByRole('button', { name: /přihlásit/i }).click()

        // Should show error message or stay on login page
        await expect(page).toHaveURL(/login/)
    })

    test('should redirect unauthenticated user from dashboard', async ({ page }) => {
        await page.goto('/dashboard')

        // Should redirect to login
        await expect(page).toHaveURL(/login/)
    })

    test('should redirect authenticated user from login to dashboard', async ({ page }) => {
        // This test requires a valid test user
        // Skip if no test credentials are available
        test.skip(!process.env.TEST_USER_EMAIL, 'Test user credentials not configured')

        await page.goto('/login')

        await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!)
        await page.getByLabel(/heslo/i).fill(process.env.TEST_USER_PASSWORD!)
        await page.getByRole('button', { name: /přihlásit/i }).click()

        await expect(page).toHaveURL(/dashboard/)
    })
})

test.describe('Dashboard Access Control', () => {
    test.beforeEach(async ({ page }) => {
        // Skip these tests if no test credentials are available
        test.skip(!process.env.TEST_USER_EMAIL, 'Test user credentials not configured')

        // Login before each test
        await page.goto('/login')
        await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!)
        await page.getByLabel(/heslo/i).fill(process.env.TEST_USER_PASSWORD!)
        await page.getByRole('button', { name: /přihlásit/i }).click()
        await page.waitForURL(/dashboard/)
    })

    test('should display member dashboard', async ({ page }) => {
        await expect(page.getByRole('navigation')).toBeVisible()
    })
})
