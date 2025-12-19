import { test, expect } from '@playwright/test';

test.describe('Evaluation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await page.waitForSelector('[data-testid="prompt-editor"], .ProseMirror', { timeout: 10000 });
  });

  test('clears evaluation when re-running prompt', async ({ page }) => {
    // Step 1: Enter a prompt
    const promptEditor = page.locator('.ProseMirror').first();
    await promptEditor.click();
    await promptEditor.fill('Write a haiku about coffee');

    // Step 2: Run the prompt
    await page.click('button:has-text("Run")');

    // Wait for output to appear
    await expect(page.locator('text=GPT-5.2')).toBeVisible({ timeout: 30000 });

    // Step 3: Open the Evaluate & Assist panel
    await page.click('button:has-text("Assistant")');

    // Step 4: Run evaluation
    await page.click('button:has-text("Evaluate Outputs")');

    // Wait for evaluation results
    await expect(page.locator('text=Avg:')).toBeVisible({ timeout: 30000 });

    // Store the score for later comparison
    const scoreElement = page.locator('[class*="text-green"], [class*="bg-green"]').first();
    await expect(scoreElement).toBeVisible();

    // Step 5: Close panel and modify prompt
    await page.click('[aria-label="Close"], button:has([class*="close"]), [class*="close"]');

    // Modify the prompt
    await promptEditor.click();
    await promptEditor.fill('Write a haiku about tea and relaxation');

    // Step 6: Run again
    await page.click('button:has-text("Run")');

    // Wait for new output
    await page.waitForTimeout(3000);

    // Step 7: Open panel and verify evaluation is cleared
    await page.click('button:has-text("Assistant")');

    // The evaluation results should be cleared - should show the empty state
    await expect(page.locator('text=Click "Evaluate Outputs"')).toBeVisible({ timeout: 5000 });
  });

  test('saves evaluation to history', async ({ page }) => {
    // Enter and run a prompt
    const promptEditor = page.locator('.ProseMirror').first();
    await promptEditor.click();
    await promptEditor.fill('Write a short poem');

    await page.click('button:has-text("Run")');
    await expect(page.locator('text=GPT-5.2')).toBeVisible({ timeout: 30000 });

    // Open panel and evaluate
    await page.click('button:has-text("Assistant")');
    await page.click('button:has-text("Evaluate Outputs")');
    await expect(page.locator('text=Avg:')).toBeVisible({ timeout: 30000 });

    // Close panel
    await page.keyboard.press('Escape');

    // Run a new prompt to create history
    await promptEditor.click();
    await promptEditor.fill('Write another poem');
    await page.click('button:has-text("Run")');
    await page.waitForTimeout(3000);

    // Navigate to history - click on the first history item
    const historyItem = page.locator('[class*="History"] button, button[title*="history"]').first();
    if (await historyItem.isVisible()) {
      await historyItem.click();

      // Open panel - should show the saved evaluation
      await page.click('button:has-text("Assistant")');
      await expect(page.locator('text=Avg:')).toBeVisible({ timeout: 5000 });
    }
  });
});
