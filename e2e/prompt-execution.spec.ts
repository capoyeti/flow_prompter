import { test, expect } from '@playwright/test';

test.describe('Prompt Execution', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.ProseMirror', { timeout: 10000 });
  });

  test('executes a prompt and shows output', async ({ page }) => {
    // Enter a prompt
    const promptEditor = page.locator('.ProseMirror').first();
    await promptEditor.click();
    await promptEditor.fill('Say hello');

    // Click Run
    await page.click('button:has-text("Run")');

    // Wait for output to appear
    await expect(page.locator('text=GPT-5.2')).toBeVisible({ timeout: 30000 });

    // Output should contain some text
    const output = page.locator('[class*="output"], [class*="Output"]').first();
    await expect(output).toBeVisible();
  });

  test('shows Cmd+Enter shortcut hint', async ({ page }) => {
    await expect(page.locator('text=Cmd+Enter')).toBeVisible();
  });

  test('can run with keyboard shortcut', async ({ page }) => {
    const promptEditor = page.locator('.ProseMirror').first();
    await promptEditor.click();
    await promptEditor.fill('Say hi');

    // Use Cmd+Enter to run
    await page.keyboard.press('Meta+Enter');

    // Should show output
    await expect(page.locator('text=GPT-5.2')).toBeVisible({ timeout: 30000 });
  });
});
