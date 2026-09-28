import { test, expect } from '@playwright/test';

const STORAGE_STATE_PATH = 'tests/e2e/.auth';

test.describe.configure({ retries: 0 });

test.describe('Navigation - Sidebar Role-Based Visibility', () => {
  test.describe('HR User', () => {
    test.use({ storageState: `${STORAGE_STATE_PATH}/hr.json` });

    test('should show all navigation items for HR', async ({ page }) => {
      await page.goto('/dashboard');
      const navList = page.locator('.nav-list');
      await expect(navList).toContainText('Dashboard');
      await expect(navList).toContainText('Leave Request');
      await expect(navList).toContainText('Leave Approval');
      await expect(navList).toContainText('Users');
      await expect(navList).toContainText('Settings');
    });

    test('should navigate to each HR route', async ({ page }) => {
      const hrRoutes = [
        { link: 'Dashboard', url: /.*\/dashboard/ },
        { link: 'Leave Request', url: /.*\/leave\/request/ },
        { link: 'Leave Approval', url: /.*\/leave\/approval/ },
        { link: 'Users', url: /.*\/users/ },
        { link: 'Settings', url: /.*\/settings/ },
      ];

      for (const route of hrRoutes) {
        await page.goto('/dashboard');
        await page.locator('.nav-list').getByRole('link', { name: route.link }).click();
        await expect(page).toHaveURL(route.url);
      }
    });
  });

  test.describe('Manager User', () => {
    test.use({ storageState: `${STORAGE_STATE_PATH}/manager.json` });

    test('should show limited navigation items for Manager', async ({ page }) => {
      await page.goto('/dashboard');
      const navList = page.locator('.nav-list');
      await expect(navList).toContainText('Dashboard');
      await expect(navList).toContainText('Leave Request');
      await expect(navList).toContainText('Leave Approval');

      await expect(navList).not.toContainText('Users');
      await expect(navList).not.toContainText('Settings');
    });

    test('should navigate to allowed Manager routes', async ({ page }) => {
      const managerRoutes = [
        { link: 'Dashboard', url: /.*\/dashboard/ },
        { link: 'Leave Request', url: /.*\/leave\/request/ },
        { link: 'Leave Approval', url: /.*\/leave\/approval/ },
      ];

      for (const route of managerRoutes) {
        await page.goto('/dashboard');
        await page.locator('.nav-list').getByRole('link', { name: route.link }).click();
        await expect(page).toHaveURL(route.url);
      }
    });

    test('should redirect Manager from HR-only routes', async ({ page }) => {
      await page.goto('/users');
      await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

      await page.goto('/settings');
      await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
    });
  });

  test.describe('Staff User', () => {
    test.use({ storageState: `${STORAGE_STATE_PATH}/staff.json` });

    test('should show minimal navigation items for Staff', async ({ page }) => {
      await page.goto('/dashboard');
      const navList = page.locator('.nav-list');
      await expect(navList).toContainText('Dashboard');
      await expect(navList).toContainText('Leave Request');

      await expect(navList).not.toContainText('Leave Approval');
      await expect(navList).not.toContainText('Users');
      await expect(navList).not.toContainText('Settings');
    });

    test('should navigate to allowed Staff routes', async ({ page }) => {
      await page.goto('/dashboard');
      await page.locator('.nav-list').getByRole('link', { name: 'Dashboard' }).click();
      await expect(page).toHaveURL(/.*\/dashboard/);

      await page.locator('.nav-list').getByRole('link', { name: 'Leave Request' }).click();
      await expect(page).toHaveURL(/.*\/leave\/request/);
    });

    test('should redirect Staff from Manager/HR routes', async ({ page }) => {
      await page.goto('/leave/approval');
      await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

      await page.goto('/users');
      await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

      await page.goto('/settings');
      await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
    });
  });
});

test.describe('Navigation - Unauthenticated Redirects', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should redirect unauthenticated users from all protected routes', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/leave/request',
      '/leave/approval',
      '/users',
      '/settings',
      '/register',
    ];

    for (const route of protectedRoutes) {
      await page.goto('/login');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.goto(route);
      await expect(page).toHaveURL(/.*\/login/, { timeout: 15000 });
    }
  });
});

test.describe('Navigation - HR Authenticated Routes', () => {
  test.use({ storageState: `${STORAGE_STATE_PATH}/hr.json` });

  test('should allow authenticated users to access allowed routes', async ({ page }) => {
    const hrRoutes = [
      '/dashboard',
      '/leave/request',
      '/leave/approval',
      '/users',
      '/settings',
      '/register',
    ];

    for (const route of hrRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${route.replace('/', '\\/')}$`));
    }
  });
});

test.describe('Navigation - Manager Authenticated Routes', () => {
  test.use({ storageState: `${STORAGE_STATE_PATH}/manager.json` });

  test('should allow Manager to access Manager routes', async ({ page }) => {
    const managerRoutes = [
      '/dashboard',
      '/leave/request',
      '/leave/approval',
    ];

    for (const route of managerRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${route.replace('/', '\\/')}$`));
    }
  });
});

test.describe('Navigation - Staff Authenticated Routes', () => {
  test.use({ storageState: `${STORAGE_STATE_PATH}/staff.json` });

  test('should allow Staff to access Staff routes', async ({ page }) => {
    const staffRoutes = [
      '/dashboard',
      '/leave/request',
    ];

    for (const route of staffRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${route.replace('/', '\\/')}$`));
    }
  });
});

test.describe('Navigation - Redirect to Dashboard When Authenticated', () => {
  test.use({ storageState: `${STORAGE_STATE_PATH}/hr.json` });

  test('should redirect to dashboard when accessing login page while authenticated', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
});

test.describe('Navigation - Active State & Breadcrumbs', () => {
  test.use({ storageState: `${STORAGE_STATE_PATH}/hr.json` });

  test('should show active state on current route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.nav-link.active')).toContainText('Dashboard');

    await page.goto('/leave/request');
    await expect(page.locator('.nav-link.active')).toContainText('Leave Request');

    await page.goto('/leave/approval');
    await expect(page.locator('.nav-link.active')).toContainText('Leave Approval');

    await page.goto('/users');
    await expect(page.locator('.nav-link.active')).toContainText('Users');
  });

  test('should show user info in sidebar footer', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('.sidebar-footer .user-name')).toContainText('HR Admin');
    await expect(page.locator('.sidebar-footer .user-role')).toContainText('HR');
  });

  test('should show logout button in sidebar', async ({ page }) => {
    await page.goto('/dashboard');

    const signOutBtn = page.locator('button[aria-label="Sign out"]');
    await expect(signOutBtn).toBeVisible();
    await expect(signOutBtn).toContainText('Sign Out');
  });
});

test.describe('Navigation - Deep Linking & Browser Back/Forward', () => {
  test.use({ storageState: `${STORAGE_STATE_PATH}/hr.json` });

  test('should support deep linking to protected routes', async ({ page }) => {
    await page.goto('/leave/approval');
    await expect(page).toHaveURL(/.*\/leave\/approval/);
    await expect(page.getByRole('heading', { name: 'Pending Leave Approvals' })).toBeVisible();
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/leave/request');
    await expect(page).toHaveURL(/.*\/leave\/request/);

    await page.goto('/users');
    await expect(page).toHaveURL(/.*\/users/);

    await page.goBack();
    await expect(page).toHaveURL(/.*\/leave\/request/);

    await page.goBack();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goForward();
    await expect(page).toHaveURL(/.*\/leave\/request/);
  });
});
