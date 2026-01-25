'use strict';
// lib
const {Observable, interval, merge} = require('rxjs');
const {mergeMap, map, distinctUntilChanged, filter, share, scan} = require('rxjs/operators');
const $ = Observable;

const WaveSurfer = require('wavesurfer.js');
// window.WaveSurfer = WaveSurfer;
const TimelinePlugin = require('wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js');
const ExtWSRegionsPlugin = require('../ext/ws/regions.js').default;
// console.log(RegionsPlugin);
// require('wavesurfer/plugin/wavesurfer.timeline.js');
// WaveSurfer = window.WaveSurfer;

const {obj} = require('iblokz-data');
const pocket = require('../util/pocket');

const init = container => {
	container.innerHTML = '';
	let wavesurfer = WaveSurfer.create({
		container: '#waveform',
		waveColor: '#000',
		progressColor: '#111516',
		plugins: [
			TimelinePlugin.create({
				container: '#wave-timeline'
				// deferInit: true // stop the plugin from initialising immediately
			}),
			ExtWSRegionsPlugin.create({
				dragSelection: true,
				singleRegion: true
				// plugin options ...
			})
		]
	});

	// wavesurfer.on('region-updated', ev => console.log('region updated', ev))

	// wavesurfer.load('assets/LatinEthnoElektroGroove.mp3');
	return wavesurfer;
};

const load = ({wavesurfer, sample}) => {
	console.log('Wavesurfer load called:', {sample, wavesurfer: Boolean(wavesurfer)});

	if (!sample || !Array.isArray(sample) || sample.length < 2) {
		console.log('Invalid sample format, skipping load');
		return wavesurfer;
	}

	if (sample[0] === 'url') {
		console.log('Loading from URL:', sample[1]);
		wavesurfer.load(sample[1]);
	} else if (sample[1]) {
		const sampleId = sample[1];
		const node = pocket.get(['sampleBank', sampleId]);

		if (!node) {
			console.warn('Sample not found in pocket:', sampleId);
			return wavesurfer;
		}

		if (!node.output || !node.output.buffer) {
			console.warn('Sample node missing output.buffer:', sampleId, node);
			return wavesurfer;
		}

		console.log('Loading decoded buffer for sample:', sampleId);
		wavesurfer.loadDecodedBuffer(node.output.buffer);
	}

	return wavesurfer;
};

let unhook = () => {};
const hook = ({state$, actions}) => {
	let subs = [];

	let wavesurfer$ = interval(100)
		.pipe(
			map(() => document.querySelector('#waveform')),
			distinctUntilChanged((prev, curr) => prev === curr),
			filter(el => el),
			map(init),
			share()
		);

	let sampleChange$ = state$.pipe(
		distinctUntilChanged((prev, curr) => {
			const prevFocused = JSON.stringify((prev.pads && prev.pads.focused) || [0, 0]);
			const currFocused = JSON.stringify((curr.pads && curr.pads.focused) || [0, 0]);
			const prevFocusedPath = (prev.pads && prev.pads.focused) || [0, 0];
			const currFocusedPath = (curr.pads && curr.pads.focused) || [0, 0];
			const prevSample = JSON.stringify(obj.sub(prev.pads, ['map', ...prevFocusedPath]));
			const currSample = JSON.stringify(obj.sub(curr.pads, ['map', ...currFocusedPath]));
			return prevFocused === currFocused && prevSample === currSample;
		}),
		map(state => {
			const focused = (state.pads && state.pads.focused) || [0, 0];
			const sampleId = obj.sub(state.pads.map, [...focused, 'id']);
			return sampleId ? ['id', sampleId] : null;
		}),
		filter(sample => sample !== null && sample[1] !== undefined)
	);

	let regionChanges = wavesurfer$
		.pipe(mergeMap(ws => new Observable(obs =>
				ws.on('region-updated', ev => obs.next(ev))
		)));

	regionChanges.subscribe(ev => (
		console.log('region updated', [ev.start, ev.end]),
		actions.waveEditor.updateRegion(ev)
	));

	wavesurfer$
		.pipe(mergeMap(wavesurfer =>
			merge(
				sampleChange$.pipe(map(sample => wavesurfer => load({wavesurfer, sample}))),
			state$.pipe(
				distinctUntilChanged((prev, curr) => {
					const prevPlaying = prev.session && prev.session.playing;
					const currPlaying = curr.session && curr.session.playing;
					return prevPlaying === currPlaying;
				}),
				map(state => wavesurfer => (wavesurfer.playPause(), wavesurfer))
			)
			).pipe(scan((wavesurfer, reducer) => reducer(wavesurfer), wavesurfer))
		))
		.subscribe(data => {});

	unhook = () => subs.forEach(sub => sub.unsubscribe());
};

module.exports = {
	hook,
	unhook: () => unhook()
};
