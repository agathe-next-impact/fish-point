import { test, expect } from '@playwright/test';

test.describe('Spot Creation Flow', () => {
  test('should show spot creation form', async ({ page }) => {
    await page.goto('/spots/new');
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/login/);
  });

  test('should display spots list page', async ({ page }) => {
    await page.goto('/spots');
    await expect(page.getByRole('heading', { name: /spots de pêche/i })).toBeVisible();
  });

  test('should have search input', async ({ page }) => {
    await page.goto('/spots');
    await expect(page.getByPlaceholder(/rechercher/i)).toBeVisible();
  });
});
