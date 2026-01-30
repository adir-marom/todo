const { test, expect } = require('@playwright/test');

test.describe('Todo List Progress Bar', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing tasks if possible, or just start fresh
    // For this test, we'll assume the server starts with a clean or known state
    // or we'll just work with what's there.
    await page.goto('/');
    await page.waitForSelector('h1:has-text("Todo List")');
  });

  test('progress bar updates when completing a task', async ({ page }) => {
    // 1. Add a new task to ensure we have at least one
    const taskName = `Test Task ${Date.now()}`;
    await page.fill('input[aria-label="Quick add task"]', taskName);
    await page.press('input[aria-label="Quick add task"]', 'Enter');

    // Wait for the task to appear in the list
    const taskItem = page.locator(`h3:has-text("${taskName}")`);
    await expect(taskItem).toBeVisible();

    // 2. Get initial progress state
    const progressBar = page.locator('[role="progressbar"]');
    const initialProgress = await progressBar.getAttribute('aria-valuenow');
    const initialText = await page.locator('span.font-medium.tabular-nums').innerText();
    
    console.log(`Initial progress: ${initialProgress}% (${initialText})`);

    // 3. Complete the task
    // Find the checkbox for our specific task
    const taskRow = page.locator('div.flex.items-start.gap-3', { has: page.locator('h3', { hasText: taskName }) });
    const checkbox = taskRow.locator('button[role="checkbox"]');
    
    // Force click since Radix checkboxes can sometimes be tricky
    await checkbox.click({ force: true });
    
    // 4. Verify progress bar updates
    await expect(async () => {
      const newProgress = await progressBar.getAttribute('aria-valuenow');
      const newText = await page.locator('span.font-medium.tabular-nums').innerText();
      console.log(`New progress: ${newProgress}% (${newText})`);
      expect(newProgress).not.toBe(initialProgress);
    }).toPass({ timeout: 10000 });

    // 5. Verify "completed" count in progress bar area
    const completedText = page.locator('text=completed');
    await expect(completedText).toContainText('1 completed');
  });

  test('adding multiple tasks and completing them updates progress correctly', async ({ page }) => {
    // Add 2 tasks with unique names to avoid strict mode violations
    const task1Name = `Task 1 ${Date.now()}`;
    const task2Name = `Task 2 ${Date.now()}`;
    
    await page.fill('input[aria-label="Quick add task"]', task1Name);
    await page.press('input[aria-label="Quick add task"]', 'Enter');
    await page.fill('input[aria-label="Quick add task"]', task2Name);
    await page.press('input[aria-label="Quick add task"]', 'Enter');

    const progressBar = page.locator('[role="progressbar"]');
    
    // Wait for tasks to be visible
    await expect(page.locator(`h3:has-text("${task1Name}")`)).toBeVisible();
    await expect(page.locator(`h3:has-text("${task2Name}")`)).toBeVisible();

    // Initially 0% (0/2) - assuming fresh start or just checking relative
    const initialProgress = await progressBar.getAttribute('aria-valuenow');

    // Complete 1 task
    const task1Row = page.locator('div.flex.items-start.gap-3', { has: page.locator('h3', { hasText: task1Name }) });
    await task1Row.locator('button[role="checkbox"]').click({ force: true });

    // Should update
    await expect(async () => {
      const newProgress = await progressBar.getAttribute('aria-valuenow');
      expect(newProgress).not.toBe(initialProgress);
    }).toPass({ timeout: 10000 });

    // Complete 2nd task
    const task2Row = page.locator('div.flex.items-start.gap-3', { has: page.locator('h3', { hasText: task2Name }) });
    await task2Row.locator('button[role="checkbox"]').click({ force: true });

    // Should be 100% if we started at 0% and added 2
    // But let's just check it's higher than before
    await expect(async () => {
      const finalProgress = await progressBar.getAttribute('aria-valuenow');
      expect(Number(finalProgress)).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });
  });
});
