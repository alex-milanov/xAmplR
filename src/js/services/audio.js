'use strict';

const {obj, fn} = require('iblokz-data');
const uuid = require('uuid/v1');
const drawWave = require('draw-wave');

// lib
const Rx = require('rx');
const $ = Rx.Observable;

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
}, buffer, url) =>
	(buffer ? $.just(buffer) : $.fromPromise(fetch(url.replace('http://', '//'))
		.then(res => res.arrayBuffer()))
		.concatMap(buffer => $.fromCallback(a.context.decodeAudioData, a.context)(buffer)))
	.map(buffer => ({
		sample,
		node: sampler.create(url, buffer)
	}))
	.map(({sample, node}) => (
		pocket.put(['sampleBank', sample.id], node),
		state => obj.patch(state, ['pads', 'map', ...state.pads.focused], sample)
	));

const actions = {
	initial,
	connect,
	load
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
	$.fromEvent(navigator.mediaDevices, 'devicechange')
		.startWith({})
		.flatMap(() => $.fromPromise(navigator.mediaDevices.enumerateDevices()))
		.map(devices => devices.filter(d => d.kind === 'audioinput'))
		.subscribe(devices => actions.audio.connect(devices));

	let recording = null;

	const getStream = (deviceId = 'default') => $.fromPromise(
		navigator.mediaDevices.getUserMedia({audio: {deviceId}}));

	state$.distinctUntilChanged(state => state.recording)
		.map(state => (console.log(state.audio.deviceInputs[0]), state))
		.flatMap(state => getStream(state.audio.deviceInputs[0]).map(stream => ({state, stream})))
		.subscribe(({state, stream}) => {
			if (state.recording) {
				// console.log(channel, rec.record, source[channel].stream);
				recording = rec.record(stream, a.context);
				recording.data$
					.flatMap(data => file.load(data, 'arrayBuffer'))
					.flatMap(arrayBuffer => $.fromPromise(a.context.decodeAudioData(arrayBuffer)))
					.subscribe(buffer => actions.audio.load({
						id: `recorded:${uuid()}`,
						image: drawBuffer(buffer)
					}, buffer));
			} else if (recording) {
				recording.stop();
				recording = null;
			}
		});

	unhook = () => subs.forEach(sub => sub.dispose());
};

module.exports = {
	actions,
	hook,
	unhook: () => unhook()
};
