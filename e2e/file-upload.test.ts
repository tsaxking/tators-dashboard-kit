import { expect, test } from '@playwright/test';


test('File upload', async ({ page }) => {
    await page.goto('/test/file-upload');
});