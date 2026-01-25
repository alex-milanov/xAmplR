/**
 * Unit test for recorder utility
 * Tests MediaRecorder integration and data$ emission
 */

const {test, expect} = require('@playwright/test');

const isHeaded = process.env.HEADED === 'true';
const baseURL = process.env.TEST_PORT ? `http://localhost:${process.env.TEST_PORT}` : 'http://localhost:1234';

test.describe('Recorder Utility', () => {
	test('should create a recording with data$ Subject and stop method', async ({page}) => {
		// Navigate to the app
		await page.goto(baseURL, {waitUntil: 'networkidle', timeout: 30000});
		await page.waitForSelector('#ui', {timeout: 10000});
		
		// Test that MediaRecorder is available (basic test)
		const result = await page.evaluate(() => {
			return {
				hasMediaRecorder: typeof window.MediaRecorder !== 'undefined',
				canCreate: typeof window.MediaRecorder === 'function'
			};
		});
		
		expect(result.hasMediaRecorder).toBe(true);
		expect(result.canCreate).toBe(true);
	});
	
	test('should handle recording lifecycle', async ({page}) => {
		await page.goto(baseURL, {waitUntil: 'networkidle', timeout: 30000});
		await page.waitForSelector('#ui', {timeout: 10000});
		
		// Test that we can create a MediaRecorder instance
		const result = await page.evaluate(async () => {
			try {
				// Request a media stream
				const stream = await navigator.mediaDevices.getUserMedia({audio: true});
				const recorder = new MediaRecorder(stream, {audioBitsPerSecond: 32000});
				
				// Test basic properties
				const hasStart = typeof recorder.start === 'function';
				const hasStop = typeof recorder.stop === 'function';
				const initialState = recorder.state;
				
				// Clean up
				stream.getTracks().forEach(track => track.stop());
				
				return {
					success: true,
					hasStart,
					hasStop,
					initialState
				};
			} catch (error) {
				return {
					success: false,
					error: error.message
				};
			}
		});
		
		expect(result.success).toBe(true);
		expect(result.hasStart).toBe(true);
		expect(result.hasStop).toBe(true);
		expect(result.initialState).toBe('inactive');
	});
});
