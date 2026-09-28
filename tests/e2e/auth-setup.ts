import { test, expect } from '@playwright/test';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const STORAGE_STATE_DIR = join(process.cwd(), 'tests/e2e/.auth');

test.describe('Auth Setup', () => {
  test.beforeAll(async () => {
    if (!existsSync(STORAGE_STATE_DIR)) {
      mkdirSync(STORAGE_STATE_DIR, { recursive: true });
    }
  });

  test('create HR storage state', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { timeout: 30000 });
    await page.fill('input[type="email"]', 'hr@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    await context.storageState({ path: join(STORAGE_STATE_DIR, 'hr.json') });
    await context.close();
    console.log('✓ Created HR storage state');
  });

  test('create Manager storage state', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { timeout: 30000 });
    await page.fill('input[type="email"]', 'manager@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    await context.storageState({ path: join(STORAGE_STATE_DIR, 'manager.json') });
    await context.close();
    console.log('✓ Created Manager storage state');
  });

  test('create Staff storage state', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { timeout: 30000 });
    await page.fill('input[type="email"]', 'staff@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    await context.storageState({ path: join(STORAGE_STATE_DIR, 'staff.json') });
    await context.close();
    console.log('✓ Created Staff storage state');
  });
});