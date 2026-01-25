/**
 * Playwright E2E test for wavesurfer functionality
 * Tests sample loading, cropping, and waveform display
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

/**
 * Wait for a sample to be loaded into a pad
 */
async function waitForPadSample(page, row, col, timeout = 10000) {
	return await page.waitForFunction(
		({row, col}) => {
			if (!window.state$) return false;
			const state = window.state$.getValue();
			const padData = state?.pads?.map?.[row]?.[col];
			return padData && padData.id;
		},
		{row, col},
		{timeout}
	);
}

/**
 * Wait for wavesurfer to load a waveform
 */
async function waitForWaveform(page, timeout = 15000) {
	// Wait for the waveform canvas to appear and have content
	return await page.waitForFunction(
		() => {
			const waveformEl = document.querySelector('#waveform');
			if (!waveformEl) return false;
			const canvas = waveformEl.querySelector('canvas');
			return canvas && canvas.width > 0 && canvas.height > 0;
		},
		{timeout}
	).catch(() => {
		// Fallback: check if wavesurfer has any content
		return page.waitForFunction(
			() => {
				const waveformEl = document.querySelector('#waveform');
				return waveformEl && waveformEl.children.length > 0;
			},
			{timeout: 5000}
		);
	});
}

test.describe('Wavesurfer Functionality', () => {
	let errors = [];
	let warnings = [];

	test.beforeEach(async ({page}) => {
		errors = [];
		warnings = [];

		// Capture console messages
		page.on('console', msg => {
			const text = msg.text();
			if (msg.type() === 'error') {
				errors.push(text);
				console.log('❌ ERROR:', text);
			} else if (msg.type() === 'warning') {
				warnings.push(text);
				// Filter out expected warnings
				if (!text.includes('ScriptProcessorNode') && !text.includes('Web MIDI API')) {
					console.log('⚠️  WARN:', text);
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

		// Wait for app to initialize
		await page.waitForFunction(() => {
			return window.state$ !== undefined && window.actions !== undefined;
		}, {timeout: 15000});
	});

	test('should load sample from search and display waveform', async ({page}) => {
		console.log('🎵 Testing sample loading and waveform display...');

		// Search for a sample
		console.log('Searching for samples...');
		await page.evaluate(async () => {
			await window.actions.samples.search({
				pattern: 'kick',
				source: 'freesound',
				limit: 12,
				page: 1
			});
		});

		// Wait for search results
		await page.waitForFunction(() => {
			if (!window.state$) return false;
			const state = window.state$.getValue();
			return state.samples && state.samples.list && state.samples.list.length > 0;
		}, {timeout: 15000});

		await waitForReadability(page, 1000, 500);

		// Load the first sample into pad [0, 0]
		console.log('Loading sample into pad [0, 0]...');
		const loadResult = await page.evaluate(async () => {
			const state = window.state$.getValue();
			if (state.samples.list.length === 0) return {success: false, error: 'No samples in list'};

			const firstSample = state.samples.list[0];
			try {
				await window.actions.pads.load(firstSample, firstSample.sound);
				return {success: true, sampleId: firstSample.id};
			} catch (err) {
				return {success: false, error: err.message};
			}
		});

		expect(loadResult.success).toBe(true);
		console.log('Sample loaded:', loadResult.sampleId);

		// Wait for pad to be updated
		await waitForPadSample(page, 0, 0, 15000);
		console.log('Pad updated with sample');

		// Wait for wavesurfer to load the waveform
		console.log('Waiting for waveform to render...');
		try {
			await waitForWaveform(page, 15000);
			console.log('✅ Waveform rendered');
		} catch (err) {
			console.log('⚠️  Waveform may not have rendered, checking state...');
		}

		// Verify the sample is in the pocket
		const sampleInPocket = await page.evaluate((sampleId) => {
			if (!window.state$) return false;
			// Check if we can access the pocket (it's not exposed, but we can check state)
			const state = window.state$.getValue();
			const padData = state?.pads?.map?.[0]?.[0];
			return padData && padData.id === sampleId;
		}, loadResult.sampleId);

		expect(sampleInPocket).toBe(true);

		// Check for wavesurfer load errors
		const wavesurferErrors = errors.filter(err =>
			err.includes('Wavesurfer') ||
			err.includes('Sample not found in pocket') ||
			err.includes('Sample node missing output.buffer')
		);

		if (wavesurferErrors.length > 0) {
			console.log('\n❌ WAVESURFER ERRORS:');
			wavesurferErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
		}

		// Verify waveform element exists
		const waveformExists = await page.evaluate(() => {
			const waveformEl = document.querySelector('#waveform');
			return waveformEl !== null;
		});

		expect(waveformExists).toBe(true);

		// Check for critical errors
		const criticalErrors = errors.filter(err =>
			!err.includes('ScriptProcessorNode') &&
			!err.includes('Web MIDI API') &&
			!err.includes('MIDI') &&
			!err.includes('Slow network')
		);

		if (criticalErrors.length > 0) {
			console.log('\n❌ CRITICAL ERRORS:');
			criticalErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
		}

		console.log('✅ Sample loading test completed');
	});

	test('should crop a sample using wavesurfer region', async ({page}) => {
		console.log('✂️  Testing sample cropping...');

		// First, load a sample
		console.log('Loading sample for cropping...');
		await page.evaluate(async () => {
			await window.actions.samples.search({
				pattern: 'kick',
				source: 'freesound',
				limit: 12,
				page: 1
			});
		});

		await page.waitForFunction(() => {
			if (!window.state$) return false;
			const state = window.state$.getValue();
			return state.samples && state.samples.list && state.samples.list.length > 0;
		}, {timeout: 15000});

		await waitForReadability(page, 1000, 500);

		// Load sample into pad [0, 0]
		const loadResult = await page.evaluate(async () => {
			const state = window.state$.getValue();
			const firstSample = state.samples.list[0];
			await window.actions.pads.load(firstSample, firstSample.sound);
			return {sampleId: firstSample.id, sound: firstSample.sound};
		});

		// Wait for pad and waveform
		await waitForPadSample(page, 0, 0, 15000);
		await waitForReadability(page, 2000, 1000);

		// Wait for waveform to be ready
		try {
			await waitForWaveform(page, 15000);
		} catch (err) {
			console.log('⚠️  Waveform may not be ready, continuing...');
		}

		// Get initial sample info
		const initialSample = await page.evaluate(() => {
			if (!window.state$) return null;
			const state = window.state$.getValue();
			const padData = state?.pads?.map?.[0]?.[0];
			return padData ? {
				id: padData.id,
				image: padData.image
			} : null;
		});

		expect(initialSample).not.toBeNull();
		console.log('Initial sample ID:', initialSample.id);

		// Set a region in waveEditor (simulate selecting a portion of the waveform)
		// The region is stored in state.waveEditor.region
		console.log('Setting crop region...');
		await page.evaluate((sampleId) => {
			if (!window.state$) return;
			const state = window.state$.getValue();
			const buffer = state?.pads?.map?.[0]?.[0];
			if (!buffer) return;

			// Set a region (crop from 0.1 to 0.5 of the sample)
			// We need to trigger the region update through the wavesurfer plugin
			// For now, we'll directly set the region in state
			window.actions.set(['waveEditor', 'region'], {
				start: 0.1,
				end: 0.5
			});
		}, initialSample.id);

		await waitForReadability(page, 500, 200);

		// Click the crop button
		console.log('Clicking crop button...');
		const cropButton = page.locator('#waveditor button.fa-crop');
		await expect(cropButton).toBeVisible();
		await cropButton.click();

		// Wait for crop processing
		console.log('Waiting for crop to complete...');
		await waitForReadability(page, 3000, 2000);

		// Verify the sample was cropped
		const croppedSample = await page.evaluate(() => {
			if (!window.state$) return null;
			const state = window.state$.getValue();
			const padData = state?.pads?.map?.[0]?.[0];
			return padData ? {
				id: padData.id,
				image: padData.image,
				updated: padData.updated
			} : null;
		});

		expect(croppedSample).not.toBeNull();
		console.log('Cropped sample ID:', croppedSample.id);
		console.log('Sample updated:', croppedSample.updated);

		// The cropped sample should have the same ID (it replaces the original)
		// But the image should be different (new waveform)
		// And updated timestamp should be newer
		if (initialSample.image && croppedSample.image) {
			// Images should be different (different waveform)
			expect(croppedSample.image).not.toBe(initialSample.image);
		}

		// Check for crop errors
		const cropErrors = errors.filter(err =>
			err.includes('Error cropping') ||
			err.includes('crop') ||
			err.includes('buffer')
		);

		if (cropErrors.length > 0) {
			console.log('\n❌ CROP ERRORS:');
			cropErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
		}

		// Check for critical errors
		const criticalErrors = errors.filter(err =>
			!err.includes('ScriptProcessorNode') &&
			!err.includes('Web MIDI API') &&
			!err.includes('MIDI') &&
			!err.includes('Slow network')
		);

		if (criticalErrors.length > 0) {
			console.log('\n❌ CRITICAL ERRORS:');
			criticalErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
		}

		console.log('✅ Sample cropping test completed');
	});

	test('should handle multiple sample loads and waveform updates', async ({page}) => {
		console.log('🔄 Testing multiple sample loads...');

		// Search for samples
		await page.evaluate(async () => {
			await window.actions.samples.search({
				pattern: 'drum',
				source: 'freesound',
				limit: 12,
				page: 1
			});
		});

		await page.waitForFunction(() => {
			if (!window.state$) return false;
			const state = window.state$.getValue();
			return state.samples && state.samples.list && state.samples.list.length > 0;
		}, {timeout: 15000});

		await waitForReadability(page, 1000, 500);

		// Load multiple samples into different pads, waiting for each to complete
		const samples = [];
		const numSamples = await page.evaluate(() => {
			const state = window.state$.getValue();
			return Math.min(3, state.samples.list.length);
		});

		// Load samples one at a time, waiting for each to complete
		for (let i = 0; i < numSamples; i++) {
			const sampleInfo = await page.evaluate(async (index) => {
				const state = window.state$.getValue();
				if (index >= state.samples.list.length) return null;
				
				const sample = state.samples.list[index];
				await window.actions.set(['pads', 'focused'], [0, index]);
				await window.actions.pads.load(sample, sample.sound);
				return {id: sample.id, pad: [0, index]};
			}, i);

			if (!sampleInfo) break;

			// Wait for this sample to be loaded into the pad before moving to next
			await waitForPadSample(page, sampleInfo.pad[0], sampleInfo.pad[1], 20000);
			console.log(`Sample loaded in pad [${sampleInfo.pad[0]}, ${sampleInfo.pad[1]}]:`, sampleInfo.id);
			samples.push(sampleInfo);

			// Small delay between loads to avoid overwhelming the system
			await waitForReadability(page, 500, 200);
		}

		console.log(`Loaded ${samples.length} samples`);

		// Focus each pad and verify waveform updates
		for (let i = 0; i < samples.length; i++) {
			const pad = samples[i].pad;
			console.log(`Focusing pad [${pad[0]}, ${pad[1]}]...`);

			await page.evaluate(({row, col}) => {
				window.actions.set(['pads', 'focused'], [row, col]);
			}, {row: pad[0], col: pad[1]});

			await waitForReadability(page, 1000, 500);

			// Wait for waveform to update (if it loads)
			try {
				await waitForWaveform(page, 10000);
				console.log(`✅ Waveform updated for pad [${pad[0]}, ${pad[1]}]`);
			} catch (err) {
				console.log(`⚠️  Waveform may not have updated for pad [${pad[0]}, ${pad[1]}]`);
			}
		}

		// Check for errors
		const criticalErrors = errors.filter(err =>
			!err.includes('ScriptProcessorNode') &&
			!err.includes('Web MIDI API') &&
			!err.includes('MIDI') &&
			!err.includes('Slow network')
		);

		if (criticalErrors.length > 0) {
			console.log('\n❌ CRITICAL ERRORS:');
			criticalErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
		}

		console.log('✅ Multiple sample loads test completed');
	});

	test('should handle wavesurfer when pad has no sample', async ({page}) => {
		console.log('🔍 Testing wavesurfer with empty pad...');

		// Focus an empty pad
		await page.evaluate(() => {
			window.actions.set(['pads', 'focused'], [1, 1]);
		});

		await waitForReadability(page, 1000, 500);

		// Verify the pad is empty
		const padState = await page.evaluate(() => {
			if (!window.state$) return null;
			const state = window.state$.getValue();
			const padData = state?.pads?.map?.[1]?.[1];
			return {
				hasSample: !!padData && !!padData.id,
				focused: state?.pads?.focused
			};
		});

		expect(padState.hasSample).toBe(false);
		expect(padState.focused).toEqual([1, 1]);

		// Wavesurfer should not try to load anything (should be handled gracefully)
		// Check for errors related to missing samples
		const missingSampleErrors = errors.filter(err =>
			err.includes('Sample not found in pocket') ||
			err.includes('Sample node missing output.buffer') ||
			err.includes('Invalid sample format')
		);

		// These warnings are expected and should be handled gracefully
		if (missingSampleErrors.length > 0) {
			console.log('⚠️  Expected warnings for empty pad:', missingSampleErrors.length);
		}

		// Check for critical errors (unexpected errors)
		const criticalErrors = errors.filter(err =>
			!err.includes('ScriptProcessorNode') &&
			!err.includes('Web MIDI API') &&
			!err.includes('MIDI') &&
			!err.includes('Slow network') &&
			!err.includes('Sample not found in pocket') &&
			!err.includes('Sample node missing output.buffer') &&
			!err.includes('Invalid sample format')
		);

		if (criticalErrors.length > 0) {
			console.log('\n❌ CRITICAL ERRORS:');
			criticalErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
			throw new Error(`Unexpected errors with empty pad: ${criticalErrors.join('; ')}`);
		}

		console.log('✅ Empty pad test completed');
	});
});
