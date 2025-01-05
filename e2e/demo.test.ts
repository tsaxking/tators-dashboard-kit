import { expect, test } from '@playwright/test';

test('Front end data management', async ({ page }) => {
	await page.goto('/test');
	const tests = await page.locator('.data-test').all();
	if (!tests.length) {
		throw new Error('No tests found');
	}

	for (const test of tests) {
		const id = await test.getAttribute('id');
		const value = await test.getAttribute('data-value');
		const message = await test.getAttribute('data-message');
		
		expect(id).toBeTruthy();
		expect(value).toBeTruthy();

		console.log(`Test: ${id} (${value}) - ${message || 'No messsage'}`);

		expect(value).toBe('success');
	}
});

// test('This will eventually be a test', () => {
// 	expect(true).toBe(true);
// });
