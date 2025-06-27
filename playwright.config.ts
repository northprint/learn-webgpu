import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-dark',
      use: { 
        ...devices['Desktop Chrome'],
        colorScheme: 'dark'
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    port: 5174,
    reuseExistingServer: !process.env.CI,
  },
});