import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible();
  });

  test('should show register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /inscription/i })).toBeVisible();
  });

  test('should have Google login button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/google/i)).toBeVisible();
  });

  test('should link between login and register', async ({ page }) => {
    await page.goto('/login');
    await page.getByText(/inscription/i).click();
    await expect(page).toHaveURL('/register');
  });
});
