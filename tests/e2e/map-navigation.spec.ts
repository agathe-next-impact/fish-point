import { test, expect } from '@playwright/test';

test.describe('Map Navigation', () => {
  test('should load map page', async ({ page }) => {
    await page.goto('/map');
    await expect(page).toHaveURL('/map');
  });

  test('should show landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/meilleurs spots de pêche/i)).toBeVisible();
  });
});
