'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;

const WaveSurfer = require('wavesurfer.js');
// window.WaveSurfer = WaveSurfer;
const TimelinePlugin = require('wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js');
const RegionsPlugin = require('wavesurfer.js/dist/plugin/wavesurfer.regions.min.js');
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
			RegionsPlugin.create({
				// plugin options ...
			})
		]
	});
	// wavesurfer.load('assets/LatinEthnoElektroGroove.mp3');
	return wavesurfer;
};

const load = ({wavesurfer, sample}) => {
	console.log(wavesurfer, sample, pocket);
	if (sample[0] === 'url') wavesurfer.load(sample[1]);
	else if (sample[1])
		wavesurfer.loadDecodedBuffer(
			pocket.get(['sampleBank', sample[1]]).output.buffer
		);
	return wavesurfer;
};

let unhook = () => {};
const hook = ({state$, actions}) => {
	let subs = [];

	let wavesurfer$ = $.interval(100)
		.map(() => document.querySelector('#waveform'))
		.distinctUntilChanged(el => el)
		.filter(el => el)
		.map(init);

	let sampleChange$ = state$
		.distinctUntilChanged(state =>
			state.pads.focused.toString() +
				' ' + obj.sub(state.pads, ['map', ...state.pads.focused, 'id'])
		)
		.map(state => (['id', obj.sub(state.pads.map, [...state.pads.focused, 'id'])]))
		.startWith((['url', 'assets/LatinEthnoElektroGroove.mp3']));

	wavesurfer$
		.flatMap(wavesurfer =>
			$.merge(
				sampleChange$
					.map(sample => wavesurfer => load({wavesurfer, sample})),
				state$
					.distinctUntilChanged(state => state.session.playing)
					.map(state => wavesurfer => (wavesurfer.playPause(), wavesurfer))
			)
			.scan((wavesurfer, reducer) => reducer(wavesurfer), wavesurfer)
		)
		.subscribe(data => {});

	unhook = () => subs.forEach(sub => sub.dispose());
};

module.exports = {
	hook,
	unhook: () => unhook()
};
