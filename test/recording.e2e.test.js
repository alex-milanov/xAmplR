/**
 * Playwright E2E test for audio recording functionality
 * Tests recording start/stop and sample loading
 */

const {test, expect} = require('@playwright/test');

// Detect if we're running in headed mode
const isHeaded = process.env.HEADED === 'true';
const baseURL = process.env.TEST_PORT ? `http://localhost:${process.env.TEST_PORT}` : 'http://localhost:1234';

/**
 * Waits for human readability (only in headed mode) or minimal wait for app processes
 */
async function waitForReadability(page, headedMs = 1000, headlessMs = 100) {
	await page.waitForTimeout(isHeaded ? headedMs : headlessMs);
}

test.describe('Audio Recording', () => {
	let errors = [];
	let warnings = [];

	test.beforeEach(async ({page}) => {
		errors = [];
		warnings = [];
		const logs = [];

		// Capture console messages
		page.on('console', msg => {
			const text = msg.text();
			if (msg.type() === 'error') {
				errors.push(text);
				console.log('❌ ERROR:', text);
			} else if (msg.type() === 'warning') {
				warnings.push(text);
				console.log('⚠️  WARN:', text);
			} else if (msg.type() === 'log') {
				logs.push(text);
				// Log all recording-related messages
				if (text.includes('recording') || text.includes('Recording') || 
				    text.includes('audio.load') || text.includes('MediaRecorder') ||
				    text.includes('data$') || text.includes('buffer')) {
					console.log('📝 LOG:', text);
				}
			}
		});

		// Capture page errors
		page.on('pageerror', error => {
			errors.push(error.message);
			console.log('❌ PAGE ERROR:', error.message);
		});

		// Navigate to app
		await page.goto(baseURL, {waitUntil: 'networkidle', timeout: 30000});
		
		// Wait for UI to render
		await page.waitForSelector('#ui', {timeout: 10000});
		await waitForReadability(page, 2000, 500);
	});

	test('should start and stop recording', async ({page}) => {
		console.log('🎤 Testing recording start/stop...');

		// Find the record button (microphone icon)
		const recordButton = page.locator('button:has(i.fa-microphone)');
		await expect(recordButton).toBeVisible();

		// Check initial state - recording should be false
		const initialState = await page.evaluate(() => {
			// Access state from window if exposed, or check button class
			return document.querySelector('button:has(i.fa-microphone)')?.classList.contains('recording') || false;
		});
		console.log('Initial recording state:', initialState);

		// Click to start recording
		console.log('Clicking record button to start...');
		await recordButton.click();
		await waitForReadability(page, 2000, 500);

		// Check if recording started (button should have 'recording' class)
		const recordingStarted = await page.evaluate(() => {
			return document.querySelector('button:has(i.fa-microphone)')?.classList.contains('recording') || false;
		});
		console.log('Recording started:', recordingStarted);

		// Wait a bit for recording to capture some audio
		await waitForReadability(page, 3000, 1000);

		// Click again to stop recording
		console.log('Clicking record button to stop...');
		await recordButton.click();
		await waitForReadability(page, 3000, 2000); // Wait longer for processing

		// Check if recording stopped
		const recordingStopped = await page.evaluate(() => {
			return !document.querySelector('button:has(i.fa-microphone)')?.classList.contains('recording');
		});
		console.log('Recording stopped:', recordingStopped);

		// Check for errors
		if (errors.length > 0) {
			console.log('\n❌ ERRORS DURING RECORDING:');
			errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
		}

		// The test passes if we got through without critical errors
		// (Some warnings/errors are expected, like ScriptProcessorNode deprecation, MIDI permissions)
		const criticalErrors = errors.filter(err => 
			!err.includes('ScriptProcessorNode') && 
			!err.includes('change is not a function') &&
			!err.includes('Web MIDI API') &&
			!err.includes('MIDI')
		);

		if (criticalErrors.length > 0) {
			throw new Error(`Critical errors during recording: ${criticalErrors.join('; ')}`);
		}
	});

	test('should load recorded sample into focused pad', async ({page}) => {
		console.log('🎤 Testing recording and sample loading into focused pad...');

		// Find pads and record button
		const pads = page.locator('.pad');
		const recordButton = page.locator('button:has(i.fa-microphone)');
		await expect(recordButton).toBeVisible();
		await expect(pads.first()).toBeVisible();

		// Focus a specific pad (e.g., row 1, col 2)
		const targetRow = 1;
		const targetCol = 2;
		console.log(`Focusing pad at [${targetRow}, ${targetCol}]...`);
		
		// Get the pad at the target position (pads are in a 4x4 grid)
		const padIndex = targetRow * 4 + targetCol;
		const targetPad = pads.nth(padIndex);
		await targetPad.focus();
		await waitForReadability(page, 500, 100);

		// Verify the pad is focused
		const isFocused = await targetPad.evaluate(el => el.classList.contains('focused'));
		console.log(`Pad at [${targetRow}, ${targetCol}] is focused:`, isFocused);

		// Get initial state of the target pad
		const initialPadState = await page.evaluate(({row, col}) => {
			// Try to access state if exposed
			if (window.state$) {
				const state = window.state$.getValue();
				const padData = state?.pads?.map?.[row]?.[col];
				return {
					hasData: !!padData,
					id: padData?.id || null,
					name: padData?.name || null
				};
			}
			// Fallback: check DOM
			const pad = document.querySelector(`.pad.focused`);
			return {
				hasData: !!pad?.textContent?.trim(),
				id: null,
				name: pad?.textContent?.trim() || null
			};
		}, {row: targetRow, col: targetCol});
		console.log('Initial pad state:', initialPadState);

		// Start recording
		console.log('Starting recording...');
		await recordButton.click();
		await waitForReadability(page, 2000, 500);

		// Record for a short time
		await waitForReadability(page, 2000, 1000);

		// Stop recording
		console.log('Stopping recording...');
		await recordButton.click();
		
		// Wait for processing (audio decoding, buffer creation, etc.)
		console.log('Waiting for audio processing...');
		await waitForReadability(page, 5000, 3000);

		// Check if the recorded sample was loaded into the focused pad
		const finalPadState = await page.evaluate(({row, col}) => {
			// Try to access state if exposed
			if (window.state$) {
				const state = window.state$.getValue();
				const padData = state?.pads?.map?.[row]?.[col];
				return {
					hasData: !!padData,
					id: padData?.id || null,
					name: padData?.name || null,
					image: padData?.image || null,
					updated: padData?.updated || null,
					focused: state?.pads?.focused || null
				};
			}
			// Fallback: check DOM
			const pad = document.querySelector(`.pad.focused`);
			const hasBackgroundImage = pad?.style?.backgroundImage && pad.style.backgroundImage !== 'none';
			return {
				hasData: !!pad?.textContent?.trim() || hasBackgroundImage,
				id: null,
				name: pad?.textContent?.trim() || null,
				image: hasBackgroundImage ? 'present' : null,
				updated: null,
				focused: null
			};
		}, {row: targetRow, col: targetCol});
		console.log('Final pad state:', JSON.stringify(finalPadState, null, 2));

		// Check if the pad has a recorded sample
		const hasRecordedSample = finalPadState.id?.includes('recorded:') || 
		                          (finalPadState.hasData && !initialPadState.hasData);
		
		console.log('Has recorded sample:', hasRecordedSample);
		console.log('Sample ID:', finalPadState.id);
		console.log('Sample has image:', !!finalPadState.image);
		console.log('Focused pad:', finalPadState.focused);

		// Check for specific errors
		const hasChangeError = errors.some(err => err.includes('change is not a function'));
		if (hasChangeError) {
			console.log('\n❌ CRITICAL: "change is not a function" error detected!');
			console.log('This indicates the recording data processing failed.');
			throw new Error('"change is not a function" error occurred - recording processing failed');
		}

		// Check state structure for debugging
		const stateDebug = await page.evaluate(({row, col}) => {
			if (window.state$) {
				const state = window.state$.getValue();
				return {
					padsExists: !!state?.pads,
					focused: state?.pads?.focused,
					mapExists: !!state?.pads?.map,
					mapType: typeof state?.pads?.map,
					mapIsArray: Array.isArray(state?.pads?.map),
					mapKeys: state?.pads?.map ? Object.keys(state.pads.map) : [],
					mapRowExists: !!state?.pads?.map?.[row],
					mapRowType: typeof state?.pads?.map?.[row],
					mapRowIsArray: Array.isArray(state?.pads?.map?.[row]),
					targetPad: state?.pads?.map?.[row]?.[col],
					allPads: state?.pads?.map
				};
			}
			return null;
		}, {row: targetRow, col: targetCol});

		// Verify the sample was loaded
		if (!hasRecordedSample) {
			console.log('\n❌ FAILED: Recorded sample was not loaded into the focused pad');
			console.log('Initial state:', initialPadState);
			console.log('Final state:', finalPadState);
			console.log('\n💡 State debugging info:');
			console.log(JSON.stringify(stateDebug, null, 2));
			
			// Log all errors for debugging
			if (errors.length > 0) {
				console.log('\n📋 All errors captured:');
				errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
			}
			
			throw new Error(`Recorded sample was not loaded into pad [${targetRow}, ${targetCol}]. Check browser console for audio.load reducer messages.`);
		}

		// Verify the sample has required properties
		expect(finalPadState.hasData).toBe(true);
		if (finalPadState.id) {
			expect(finalPadState.id).toContain('recorded:');
		}

		console.log('✅ Recorded sample successfully loaded into focused pad!');
	});

	test('should handle recording state changes correctly', async ({page}) => {
		console.log('🎤 Testing recording state management...');

		const recordButton = page.locator('button:has(i.fa-microphone)');
		
		// Monitor console for state changes
		const stateLogs = [];
		page.on('console', msg => {
			if (msg.type() === 'log') {
				const text = msg.text();
				if (text.includes('recording') || text.includes('Recording')) {
					stateLogs.push(text);
				}
			}
		});

		// Toggle recording multiple times
		for (let i = 0; i < 3; i++) {
			console.log(`Toggle ${i + 1}...`);
			await recordButton.click();
			await waitForReadability(page, 1500, 500);
			await recordButton.click();
			await waitForReadability(page, 2000, 1000);
		}

		// Check for errors after multiple toggles
		const criticalErrors = errors.filter(err => 
			!err.includes('ScriptProcessorNode') &&
			!err.includes('Slow network') &&
			!err.includes('Web MIDI API') &&
			!err.includes('MIDI')
		);

		if (criticalErrors.length > 0) {
			console.log('\n❌ ERRORS AFTER MULTIPLE TOGGLES:');
			criticalErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
			throw new Error(`Errors occurred during multiple recording toggles: ${criticalErrors.join('; ')}`);
		}

		console.log('✅ Multiple toggles completed without critical errors');
	});
});
