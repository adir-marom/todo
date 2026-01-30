import { test, expect } from '@playwright/test';

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
    await page.fill('input[placeholder="Add a new task..."]', taskName);
    await page.press('input[placeholder="Add a new task..."]', 'Enter');

    // Wait for the task to appear in the list
    const taskItem = page.locator(`text=${taskName}`);
    await expect(taskItem).toBeVisible();

    // 2. Get initial progress state
    const progressBar = page.locator('[role="progressbar"]');
    const initialProgress = await progressBar.getAttribute('aria-valuenow');
    const initialText = await page.locator('span.font-medium.tabular-nums').innerText();
    
    console.log(`Initial progress: ${initialProgress}% (${initialText})`);

    // 3. Complete the task
    // Find the checkbox for our specific task
    const taskRow = page.locator('div.flex.items-start.gap-3', { hasText: taskName });
    const checkbox = taskRow.locator('button[role="checkbox"]');
    await checkbox.click();

    // 4. Verify progress bar updates
    // The task should move to archived, so it might disappear from the active list
    // but the progress bar in App.tsx calculates based on activeTasks.
    // Actually, toggleComplete in useTasks.ts sets archived: !t.completed.
    // So if it was active and we complete it, it becomes archived: true.
    
    // Let's wait for the progress bar to update. 
    // If it was 0% with 1 task, completing it should make it 100% or the task disappears.
    // Wait for the progress text to change or the "All tasks completed" message
    
    await expect(async () => {
      const newProgress = await progressBar.getAttribute('aria-valuenow');
      const newText = await page.locator('span.font-medium.tabular-nums').innerText();
      console.log(`New progress: ${newProgress}% (${newText})`);
      expect(newProgress).not.toBe(initialProgress);
    }).toPass();

    // 5. Verify "completed" count in progress bar area
    const completedText = page.locator('text=completed');
    await expect(completedText).toContainText('1 completed');
  });

  test('adding multiple tasks and completing them updates progress correctly', async ({ page }) => {
    // Clear existing tasks if any (optional, depends on app state)
    
    // Add 2 tasks
    await page.fill('input[placeholder="Add a new task..."]', 'Task 1');
    await page.press('input[placeholder="Add a new task..."]', 'Enter');
    await page.fill('input[placeholder="Add a new task..."]', 'Task 2');
    await page.press('input[placeholder="Add a new task..."]', 'Enter');

    const progressBar = page.locator('[role="progressbar"]');
    
    // Initially 0% (0/2)
    await expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    await expect(page.locator('span.font-medium.tabular-nums')).toHaveText('0%');

    // Complete 1 task
    const task1Row = page.locator('div.flex.items-start.gap-3', { hasText: 'Task 1' });
    await task1Row.locator('button[role="checkbox"]').click();

    // Should be 50% (1/2)
    await expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    await expect(page.locator('span.font-medium.tabular-nums')).toHaveText('50%');

    // Complete 2nd task
    const task2Row = page.locator('div.flex.items-start.gap-3', { hasText: 'Task 2' });
    await task2Row.locator('button[role="checkbox"]').click();

    // Should be 100% (2/2)
    await expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    await expect(page.locator('span.font-medium.tabular-nums')).toHaveText('100%');
    
    // Verify success message
    await expect(page.locator('text=All tasks completed! Great work!')).toBeVisible();
  });
});
