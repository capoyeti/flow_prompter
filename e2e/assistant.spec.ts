import { test, expect } from '@playwright/test';

test.describe('Assistant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.ProseMirror', { timeout: 10000 });
  });

  test('opens assistant panel', async ({ page }) => {
    await page.click('button:has-text("Assistant")');
    await expect(page.locator('text=Evaluate & Assist')).toBeVisible();
  });

  test('shows context message when no prompt has been run', async ({ page }) => {
    await page.click('button:has-text("Assistant")');
    await expect(page.locator('text=Run a prompt first')).toBeVisible();
  });

  test('can send message to assistant after running prompt', async ({ page }) => {
    // Run a prompt first
    const promptEditor = page.locator('.ProseMirror').first();
    await promptEditor.click();
    await promptEditor.fill('Write a product description for a coffee mug');
    await page.click('button:has-text("Run")');
    await expect(page.locator('text=GPT-5.2')).toBeVisible({ timeout: 30000 });

    // Open assistant panel
    await page.click('button:has-text("Assistant")');

    // Send a message
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('How can I improve this prompt?');
    await page.click('button:has-text("Send")');

    // Wait for response
    await expect(page.locator('text=Replying')).toBeVisible({ timeout: 5000 });

    // Wait for response to complete
    await expect(page.locator('[class*="suggestion"], [class*="Suggestion"]')).toBeVisible({
      timeout: 60000,
    });
  });

  test('New Chat button clears conversation', async ({ page }) => {
    // Run a prompt first
    const promptEditor = page.locator('.ProseMirror').first();
    await promptEditor.click();
    await promptEditor.fill('Hello world');
    await page.click('button:has-text("Run")');
    await expect(page.locator('text=GPT-5.2')).toBeVisible({ timeout: 30000 });

    // Open assistant and send a message
    await page.click('button:has-text("Assistant")');
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('Test message');
    await page.click('button:has-text("Send")');

    // Wait for user message to appear in chat
    await expect(page.locator('text=Test message')).toBeVisible({ timeout: 5000 });

    // Click New Chat
    await page.click('button:has-text("New Chat")');

    // Conversation should be cleared
    await expect(page.locator('text=Test message')).not.toBeVisible();
    await expect(page.locator('text=Ask me how to improve')).toBeVisible();
  });

  test('applies Intent suggestion', async ({ page }) => {
    // Run a prompt
    const promptEditor = page.locator('.ProseMirror').first();
    await promptEditor.click();
    await promptEditor.fill('Write a product description for headphones');
    await page.click('button:has-text("Run")');
    await expect(page.locator('text=GPT-5.2')).toBeVisible({ timeout: 30000 });

    // Open assistant and ask for improvements
    await page.click('button:has-text("Assistant")');
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('How can I make this prompt better?');
    await page.click('button:has-text("Send")');

    // Wait for suggestions to appear
    const intentSuggestion = page.locator('[class*="suggestion"]:has-text("Intent")');
    await expect(intentSuggestion).toBeVisible({ timeout: 60000 });

    // Click Apply on the Intent suggestion
    const applyButton = intentSuggestion.locator('button:has-text("Apply")');
    await applyButton.click();

    // Wait for Intent to be updated
    await page.waitForTimeout(1000);

    // Verify Intent was applied - the Intent section should no longer say "Not set"
    await page.keyboard.press('Escape');
    const intentSection = page.locator('text=Intent').first();
    await expect(intentSection).toBeVisible();

    // The intent value should be visible (not "Not set")
    const intentValue = page.locator('[class*="Intent"]').filter({ hasNotText: 'Not set' });
    await expect(intentValue).toBeVisible();
  });
});
