// @ts-check
const {defineConfig, devices} = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
const isHeaded = process.env.HEADED === 'true';

module.exports = defineConfig({
	testDir: './test',
	testMatch: /.*\.e2e\.test\.js$/,
	/* Run tests in parallel when headless, sequentially when headed for visibility */
	fullyParallel: !isHeaded,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Run tests in parallel when headless, sequentially when headed */
	workers: isHeaded ? 1 : undefined,
	/* Increase timeout for visual debugging in headed mode */
	timeout: isHeaded ? 60000 : 30000,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: 'html',
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		/* Default to port 1234 for tests (same as dev server) */
		baseURL: process.env.TEST_PORT ? `http://localhost:${process.env.TEST_PORT}` : 'http://localhost:1234',
		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				headless: process.env.HEADED !== 'true',
				viewport: {width: 1920, height: 1080},
				// Enable Web Audio API and microphone access
				launchOptions: {
					args: [
						'--autoplay-policy=no-user-gesture-required',
						'--disable-features=AutoplayIgnoreWebAudio',
						'--use-fake-ui-for-media-stream', // Auto-accept microphone permissions
						'--use-fake-device-for-media-stream', // Use fake audio device
					],
				},
				// Grant microphone permissions
				permissions: ['microphone'],
			},
		},
	],

	/* Use existing dev server if running, otherwise start one */
	/* Set USE_EXISTING_SERVER=true to use an already running server */
	/* Set TEST_PORT environment variable to use a different port */
	webServer: process.env.USE_EXISTING_SERVER !== 'true' ? {
		command: process.env.TEST_PORT ? `PORT=${process.env.TEST_PORT} pnpm start` : 'pnpm start',
		url: process.env.TEST_PORT ? `http://localhost:${process.env.TEST_PORT}` : 'http://localhost:1234',
		reuseExistingServer: false,
		timeout: 120 * 1000,
	} : undefined,
});
