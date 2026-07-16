import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  // visual goldens are platform-tagged; run them with `npm run test:visual` on
  // a matching platform, not in the default cross-platform smoke run
  testIgnore: '**/visual.spec.js',
  webServer: {
    command: 'node scripts/serve.mjs',
    port: 8098,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:8098',
  },
});
