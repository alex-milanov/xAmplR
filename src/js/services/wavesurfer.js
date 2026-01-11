'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;

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
		.map(init)
		.share();

	let sampleChange$ = state$
		.distinctUntilChanged(state =>
			JSON.stringify(state.pads.focused) +
			JSON.stringify(obj.sub(state.pads, ['map', ...state.pads.focused]))
		)
		.map(state => (['id', obj.sub(state.pads.map, [...state.pads.focused, 'id'])]))
		

	let regionChanges = wavesurfer$
		.flatMap(ws => $.create(obs =>
				ws.on('region-updated', ev => obs.onNext(ev))
		));

	regionChanges.subscribe(ev => (
		console.log('region updated', [ev.start, ev.end]),
		actions.waveEditor.updateRegion(ev)
	));

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
