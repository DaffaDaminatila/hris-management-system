import { test, expect } from '@playwright/test';

// Auth fixtures with storageState for each role
const STORAGE_STATE_PATH = 'tests/e2e/.auth';

test.describe.configure({ retries: 0 });

// Login success/failure tests
test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/login');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should show login form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Sign In');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login successfully as HR', async ({ page }) => {
    await page.fill('input[type="email"]', 'hr@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('.user-trigger .user-name')).toContainText('HR Admin');
    await expect(page.locator('.user-role-badge')).toContainText('HR');
  });

  test('should login successfully as Manager', async ({ page }) => {
    await page.fill('input[type="email"]', 'manager@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('.user-trigger .user-name')).toContainText('John Manager');
    await expect(page.locator('.user-role-badge')).toContainText('MANAGER');
  });

  test('should login successfully as Staff', async ({ page }) => {
    await page.fill('input[type="email"]', 'staff@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('.user-trigger .user-name')).toContainText('Jane Staff');
    await expect(page.locator('.user-role-badge')).toContainText('STAFF');
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'hr@company.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('[role="alert"]')).toContainText('Invalid');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should show error on non-existent user', async ({ page }) => {
    await page.fill('input[type="email"]', 'nonexistent@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('[role="alert"]')).toContainText('Invalid');
  });

  test('should disable submit button when fields are empty', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
    
    await page.fill('input[type="email"]', 'hr@company.com');
    await expect(submitBtn).toBeDisabled();
    
    await page.fill('input[type="password"]', 'password');
    await expect(submitBtn).toBeEnabled();
  });
});

// Register tests (HR only)
test.describe('Registration (HR only)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as HR first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'hr@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should allow HR to access register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.locator('.auth-title')).toContainText('Register User');
  });

  test('should register a new Staff user', async ({ page }) => {
    await page.goto('/register');
    
    const timestamp = Date.now();
    const email = `staff${timestamp}@company.com`;
    
    await page.fill('input[name="fullName"]', 'New Staff');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password123');
    await page.selectOption('select[name="role"]', 'STAFF');
    await page.click('button[type="submit"]');
    
    // Wait for mutation to complete (button re-enables)
    await expect(page.locator('button[type="submit"]')).toHaveText('Register', { timeout: 15000 });
    
    // Verify new user can login
    await page.click('button[aria-label="Sign out"]');
    await expect(page).toHaveURL(/.*\/login/);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('.user-trigger .user-name')).toContainText('New Staff');
  });

  test('should register a new Manager user', async ({ page }) => {
    await page.goto('/register');
    
    const timestamp = Date.now();
    const email = `manager${timestamp}@company.com`;
    
    await page.fill('input[name="fullName"]', 'New Manager');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password123');
    await page.selectOption('select[name="role"]', 'MANAGER');
    await page.click('button[type="submit"]');
    
    // Wait for mutation to complete
    await expect(page.locator('button[type="submit"]')).toHaveText('Register', { timeout: 15000 });
    
    // Verify new user appears in users list
    await page.goto('/users');
    await expect(page.getByText(email)).toBeVisible({ timeout: 15000 });
  });

  test('should show validation - submit disabled for incomplete registration', async ({ page }) => {
    await page.goto('/register');
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
    
    await page.fill('input[name="fullName"]', 'New Staff');
    await expect(submitBtn).toBeDisabled();
    
    await page.fill('input[name="email"]', 'test@company.com');
    await expect(submitBtn).toBeDisabled();
    
    await page.fill('input[name="password"]', 'password123');
    await expect(submitBtn).toBeEnabled();
  });
});

// Logout tests
test.describe('Logout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'hr@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('button[aria-label="Sign out"]')).toBeVisible({ timeout: 15000 });
  });

  test('should logout successfully from sidebar', async ({ page }) => {
    await page.click('button[aria-label="Sign out"]');
    
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h1')).toContainText('Sign In');
  });

  test('should clear session on logout', async ({ page }) => {
    await page.click('button[aria-label="Sign out"]');
    await expect(page).toHaveURL(/.*\/login/);
    
    // Try to access protected route
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/login/);
  });
});

// Session persistence tests
test.describe('Session Persistence', () => {
  test('should persist session across page reloads', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'hr@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Reload the page
    await page.reload();
    
    // Should still be authenticated
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('.user-trigger .user-name')).toContainText('HR Admin');
  });

  test('should persist session across browser restart (storageState)', async ({ page, context }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'hr@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Save storage state
    await context.storageState({ path: `${STORAGE_STATE_PATH}/hr.json` });
    
    // Create new context with saved state
    const newContext = await page.context().browser()?.newContext({
      storageState: `${STORAGE_STATE_PATH}/hr.json`,
    });
    
    if (newContext) {
      const newPage = await newContext.newPage();
      await newPage.goto('/dashboard');
      await expect(newPage).toHaveURL(/.*\/dashboard/);
      await expect(newPage.locator('.user-trigger .user-name')).toContainText('HR Admin');
      await newContext.close();
    }
  });

  test('should have separate storage for each role', async ({ browser }) => {
    // Login as HR and save state
    const hrContext = await browser.newContext();
    const hrPage = await hrContext.newPage();
    await hrPage.goto('/login');
    await hrPage.fill('input[type="email"]', 'hr@company.com');
    await hrPage.fill('input[type="password"]', 'password');
    await hrPage.click('button[type="submit"]');
    await expect(hrPage).toHaveURL(/.*\/dashboard/);
    await hrContext.storageState({ path: `${STORAGE_STATE_PATH}/hr.json` });
    await hrContext.close();
    
    // Login as Manager and save state
    const managerContext = await browser.newContext();
    const managerPage = await managerContext.newPage();
    await managerPage.goto('/login');
    await managerPage.fill('input[type="email"]', 'manager@company.com');
    await managerPage.fill('input[type="password"]', 'password');
    await managerPage.click('button[type="submit"]');
    await expect(managerPage).toHaveURL(/.*\/dashboard/);
    await managerContext.storageState({ path: `${STORAGE_STATE_PATH}/manager.json` });
    await managerContext.close();
    
    // Login as Staff and save state
    const staffContext = await browser.newContext();
    const staffPage = await staffContext.newPage();
    await staffPage.goto('/login');
    await staffPage.fill('input[type="email"]', 'staff@company.com');
    await staffPage.fill('input[type="password"]', 'password');
    await staffPage.click('button[type="submit"]');
    await expect(staffPage).toHaveURL(/.*\/dashboard/);
    await staffContext.storageState({ path: `${STORAGE_STATE_PATH}/staff.json` });
    await staffContext.close();
    
    // Verify each state works independently
    const hrVerify = await browser.newContext({ storageState: `${STORAGE_STATE_PATH}/hr.json` });
    const hrVerifyPage = await hrVerify.newPage();
    await hrVerifyPage.goto('/dashboard');
    await expect(hrVerifyPage.locator('.user-trigger .user-name')).toContainText('HR Admin');
    await hrVerify.close();
    
    const managerVerify = await browser.newContext({ storageState: `${STORAGE_STATE_PATH}/manager.json` });
    const managerVerifyPage = await managerVerify.newPage();
    await managerVerifyPage.goto('/dashboard');
    await expect(managerVerifyPage.locator('.user-trigger .user-name')).toContainText('John Manager');
    await managerVerify.close();
    
    const staffVerify = await browser.newContext({ storageState: `${STORAGE_STATE_PATH}/staff.json` });
    const staffVerifyPage = await staffVerify.newPage();
    await staffVerifyPage.goto('/dashboard');
    await expect(staffVerifyPage.locator('.user-trigger .user-name')).toContainText('Jane Staff');
    await staffVerify.close();
  });
});