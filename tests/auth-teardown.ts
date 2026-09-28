import { test } from '@playwright/test';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Auth Teardown', () => {
  test('cleanup auth storage states', async () => {
    const storageDir = join(process.cwd(), 'tests/e2e/.auth');
    if (existsSync(storageDir)) {
      rmSync(storageDir, { recursive: true, force: true });
      console.log('✓ Cleaned up auth storage states');
    }
  });
});