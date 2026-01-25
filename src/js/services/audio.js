'use strict';

const {obj, fn} = require('iblokz-data');
const uuid = require('uuid/v1');
const drawWave = require('draw-wave');

// lib
const { Observable, from, of, fromEvent, firstValueFrom } = require('rxjs');
const { mergeMap, concatMap, map, startWith, distinctUntilChanged, catchError, filter } = require('rxjs/operators');
const $ = Observable;

const pocket = require('../util/pocket');
const a = require('../util/audio');
const bufferUtils = require('audio-buffer-utils');
const rec = require('../util/recorder');
const file = require('../util/file');
const sampler = require('../util/audio/sources/sampler');

const initial = {
	on: false,
	deviceInputs: {
		0: 'default',
		1: 'default',
		2: 'default',
		3: 'default'
	},
	devices: []
};

const connect = devices => state => obj.patch(state, 'audio', {
	devices
});

const load = (sample = {
	id: `recorded:${uuid()}`
}, buffer, url) => firstValueFrom(
	(buffer ? of(buffer) : from(fetch(url.replace('http://', '//'))
		.then(res => res.arrayBuffer()))
		.pipe(concatMap(buffer => from(a.context.decodeAudioData(buffer)))))
		.pipe(map(buffer => ({
			sample,
			node: sampler.create(url, buffer)
		})))
		.pipe(map(({sample, node}) => {
			pocket.put(['sampleBank', sample.id], node);
			return state => {
				const focused = state.pads?.focused || [0, 0];
				return obj.patch(state, ['pads', 'map', ...focused], {
					...sample,
					updated: new Date()
				});
			}
		}))
		.pipe(catchError(error => {
			console.error('Error loading audio sample:', error);
			return of(state => state); // Return identity reducer on error
		}))
);

// uuid, {start, end}
const crop = (id, {start, end}) => firstValueFrom(
	of(pocket.get(['sampleBank', id]))
		.pipe(map(node => node.output.buffer))
		.pipe(map(buffer => bufferUtils.slice(buffer, start * buffer.sampleRate, end * buffer.sampleRate)))
		.pipe(map(buffer => ({
			sample: {id, image: drawBuffer(buffer)},
			node: sampler.create(null, buffer)
		})))
		.pipe(map(({sample, node}) => {
			pocket.put(['sampleBank', sample.id], node);
			return state => obj.patch(state, ['pads', 'map', ...state.pads.focused], {
				...sample,
				updated: new Date()
			});
		}))
		.pipe(catchError(error => {
			console.error('Error cropping audio sample:', error);
			return of(state => state); // Return identity reducer on error
		}))
);

const actions = {
	initial,
	connect,
	load,
	crop
};

const drawBuffer = buffer => {
	let canvas = document.createElement('canvas');
	canvas.width = 128;
	canvas.height = 128;
	drawWave.canvas(canvas, buffer, '#52F6A4');
	return canvas.toDataURL();
};

let unhook = () => {};

const createAnalyser = context => {
	console.log('Creating analyser');
	let analyser = context.createAnalyser();
	analyser.minDecibels = -90;
	analyser.maxDecibels = -10;
	analyser.smoothingTimeConstant = 0.85;
	analyser.connect(context.destination);
	return analyser;
};

const hook = ({state$, actions}) => {
	let subs = [];

	// devices
	fromEvent(navigator.mediaDevices, 'devicechange')
		.pipe(
			startWith({}),
			mergeMap(() => from(navigator.mediaDevices.enumerateDevices())),
			map(devices => devices.filter(d => d.kind === 'audioinput'))
		)
		.subscribe(devices => actions.audio.connect(devices));

	let recording = null;

	const getStream = (deviceId = 'default') => from(
		navigator.mediaDevices.getUserMedia({audio: {deviceId}}));

	const recordingSub$ = state$.pipe(
		distinctUntilChanged((prev, curr) => prev.recording === curr.recording),
		mergeMap(state => getStream(state.audio.deviceInputs[0]).pipe(map(stream => ({state, stream}))))
	)
		.subscribe(({state, stream}) => {
			if (state.recording) {
				// Start new recording (old code didn't clean up previous, just overwrote)
				recording = rec.record(stream, a.context);
				// Subscribe to data$ but don't store it - let it stay active (like old code)
				recording.data$
					.pipe(mergeMap(data => file.load(data, 'arrayBuffer')))
					.pipe(mergeMap(arrayBuffer => from(a.context.decodeAudioData(arrayBuffer))))
					.subscribe({
						next: buffer => {
							actions.audio.load({
								id: `recorded:${uuid()}`,
								image: drawBuffer(buffer)
							}, buffer);
						},
						error: err => {
							console.error('Error in recording data$ subscription:', err);
						}
					});
			} else if (recording) {
				// Stop recording - subscription stays active to receive data$ emission
				recording.stop();
				recording = null;
				// Don't stop the stream - let it stay active (like old code)
			}
		});
	subs.push(recordingSub$);

	unhook = () => {
		subs.forEach(sub => sub.unsubscribe());
		// Old code didn't clean up recording here - just let it be
	};
};

module.exports = {
	actions,
	hook,
	unhook: () => unhook()
};
