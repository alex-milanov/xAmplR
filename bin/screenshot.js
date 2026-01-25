#!/usr/bin/env node
/**
 * Script to take a screenshot of the xAmplR app
 * Usage: node bin/screenshot.js [url] [output-path]
 */

const {chromium} = require('playwright');
const path = require('path');
const fs = require('fs');

const DEFAULT_URL = 'http://localhost:1234';

// Find next available screenshot index
function getNextScreenshotPath() {
	const screenshotsDir = path.join(__dirname, '..', 'assets', 'screenshots');
	if (!fs.existsSync(screenshotsDir)) {
		fs.mkdirSync(screenshotsDir, {recursive: true});
	}
	
	let index = 1;
	let screenshotPath;
	do {
		screenshotPath = path.join(screenshotsDir, `${index}.png`);
		index++;
	} while (fs.existsSync(screenshotPath) && index < 1000);
	
	return screenshotPath;
}

const DEFAULT_OUTPUT = getNextScreenshotPath();

async function takeScreenshot(url = DEFAULT_URL, outputPath = DEFAULT_OUTPUT) {
	console.log(`Taking screenshot of ${url}...`);
	
	// Ensure output directory exists
	const outputDir = path.dirname(outputPath);
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, {recursive: true});
	}
	
	const browser = await chromium.launch();
	const page = await browser.newPage();
	
	try {
		// Set viewport size for consistent screenshots
		await page.setViewportSize({width: 1920, height: 1080});
		
		// Navigate to the app
		await page.goto(url, {waitUntil: 'networkidle'});
		
		// Wait for UI to render
		await page.waitForSelector('#ui', {timeout: 10000});
		
		// Wait for JavaScript to initialize
		await page.waitForFunction(() => {
			return window.state$ !== undefined && window.actions !== undefined;
		}, {timeout: 15000});
		
		console.log('App loaded, setting up screenshot scene...');
		
		// Search for a sample
		console.log('Searching for samples...');
		await page.evaluate(async () => {
			const searchQuery = 'kick';
			await window.actions.samples.search({
				pattern: searchQuery,
				source: 'freesound',
				limit: 12,
				page: 1
			});
		});
		
		// Wait for search results to appear
		await page.waitForFunction(() => {
			return window.state$ && new Promise((resolve) => {
				const sub = window.state$.subscribe(state => {
					if (state.samples && state.samples.list && state.samples.list.length > 0) {
						sub.unsubscribe();
						resolve(true);
					}
				});
				// Timeout after 10 seconds
				setTimeout(() => {
					sub.unsubscribe();
					resolve(false);
				}, 10000);
			});
		}, {timeout: 15000});
		
		// Wait a bit for UI to update
		await page.waitForTimeout(1000);
		
		// Load the first sample into the focused pad
		console.log('Loading sample into pad...');
		await page.evaluate(async () => {
			return new Promise((resolve) => {
				const sub = window.state$.subscribe(state => {
					if (state.samples && state.samples.list && state.samples.list.length > 0) {
						const firstSample = state.samples.list[0];
						if (firstSample && firstSample.sound) {
							// Load sample into focused pad
							window.actions.pads.load(firstSample, firstSample.sound).then(() => {
								sub.unsubscribe();
								resolve(true);
							}).catch(err => {
								console.error('Error loading sample:', err);
								sub.unsubscribe();
								resolve(false);
							});
						} else {
							sub.unsubscribe();
							resolve(false);
						}
					}
				});
				// Timeout after 15 seconds
				setTimeout(() => {
					sub.unsubscribe();
					resolve(false);
				}, 15000);
			});
		});
		
		// Wait for pad to be updated with sample
		console.log('Waiting for pad to be updated...');
		await page.waitForFunction(() => {
			return new Promise((resolve) => {
				const sub = window.state$.subscribe(state => {
					const focused = state.pads?.focused || [0, 0];
					const padSample = state.pads?.map?.[focused[0]]?.[focused[1]];
					if (padSample && padSample.id) {
						sub.unsubscribe();
						resolve(true);
					}
				});
				setTimeout(() => {
					sub.unsubscribe();
					resolve(false);
				}, 10000);
			});
		}, {timeout: 15000});
		
		// Wait for waveform to render in wavesurfer
		console.log('Waiting for waveform to render...');
		
		// Wait for wavesurfer to initialize and load the waveform
		// Wavesurfer creates a canvas inside #waveform when it loads
		await page.waitForFunction(() => {
			const waveformEl = document.querySelector('#waveform');
			if (!waveformEl) return false;
			
			// Check for canvas (wavesurfer renders waveform on canvas)
			const canvas = waveformEl.querySelector('canvas');
			if (canvas && canvas.width > 0) return true;
			
			// Also check for wavesurfer instance (it might be in the element's data or as a child)
			// Wavesurfer v2 uses canvas for rendering
			return false;
		}, {timeout: 15000}).catch(() => {
			console.log('Wavesurfer may not have rendered, checking alternative indicators...');
		});
		
		// Additional wait for wavesurfer to fully render
		// Wavesurfer loads asynchronously, so we need to wait for the 'ready' event
		await page.waitForTimeout(3000);
		
		// Final check - see if we can find any visual indication of waveform
		const hasWaveform = await page.evaluate(() => {
			const waveformEl = document.querySelector('#waveform');
			if (!waveformEl) return false;
			
			// Check for canvas
			const canvas = waveformEl.querySelector('canvas');
			if (canvas && canvas.width > 0 && canvas.height > 0) return true;
			
			// Check if wavesurfer has any children (it might render differently)
			return waveformEl.children.length > 0;
		});
		
		if (!hasWaveform) {
			console.log('Warning: Waveform may not be visible in screenshot');
		} else {
			console.log('Waveform detected, ready for screenshot');
		}
		
		// Wait a bit more for everything to settle
		await page.waitForTimeout(1000);
		
		// Take screenshot
		await page.screenshot({
			path: outputPath,
			fullPage: true
		});
		
		console.log(`✓ Screenshot saved to ${outputPath}`);
	} catch (error) {
		console.error('Error taking screenshot:', error);
		process.exit(1);
	} finally {
		await browser.close();
	}
}

// Get command line arguments
const url = process.argv[2] || DEFAULT_URL;
const output = process.argv[3] || DEFAULT_OUTPUT;

takeScreenshot(url, output);
