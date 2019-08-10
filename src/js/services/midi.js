'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;

const {obj} = require('iblokz-data');

const midi = require('../util/midi');
const pocket = require('../util/pocket');
const a = require('../util/audio');
const sampler = require('../util/audio/sources/sampler');

const initial = {
	device: -1,
	devices: [],
	channel: 10,
	scheme: 'mpc500',
	schemes: {
		mpc500: require('./maps/mpc500.json'),
		lpd8: require('./maps/lpd8.json')
	}
};

let reverb = a.connect(a.create('reverb', {
	on: false,
	wet: 0.1,
	dry: 0.9
}), a.context.destination);

let vcf = a.connect(a.create('vcf', {
	on: false,
	type: 'lowpass',
	cutoff: 0.64,
	resonance: 0,
	gain: 0
}), reverb);

const rack = {
};

const getIds = (inputs, indexes) => inputs
	.map(inp => inp.id)
	.filter((id, i) => indexes.indexOf(i) > -1);

const trigger = (row, col) => state => {
	let sampleId = obj.sub(state, ['pads', 'map', row, col, 'id']);
	if (sampleId) {
		let inst = sampler.clone(pocket.get(
			['sampleBank', sampleId]
		));
		inst = a.connect(inst, state.rack.vcf.on
			? vcf
			: state.rack.reverb.on
				? reverb
				: a.context.destination);
		a.start(inst);
	}
	return state;
};

const connect = devices => state => obj.patch(state, 'midi', {
	devices
});

let actions = {
	initial,
	connect,
	trigger
};

const locateMap = (map, value) => map.reduce((pos, list, row) =>
	list.find(v => v === value) ? {row, col: list.findIndex(v => v === value)} : pos,
	{row: -1, col: -1}
);

let unhook = () => {};
const hook = ({state$, actions}) => {
	let subs = [];

	const {devices$, msg$} = midi.init();
	const parsedMidiMsg$ = msg$
		.map(raw => ({msg: midi.parseMidiMsg(raw.msg), raw}))
		// .map(data => (console.log(data), data))
		.share();

	// midi device access
	subs.push(
		devices$.subscribe(data => actions.midi.connect(data))
	);

	// audio rack
	subs.push(
		state$.distinctUntilChanged(state => state.rack)
			.subscribe(state => {
				reverb = a.update(reverb, state.rack.reverb);
				vcf = a.update(vcf, state.rack.vcf);
				if (state.rack.reverb.on) {
					vcf = a.disconnect(vcf);
					vcf = a.connect(vcf, reverb);
				} else {
					vcf = a.disconnect(vcf);
					vcf = a.connect(vcf, a.context.destination);
				}
			})
	);

	// midi messages
	subs.push(
		parsedMidiMsg$
			// .map(midiData => (console.log({midiData}), midiData))
			// .filter(({msg}) => ['noteOn', 'noteOff'].indexOf(msg.state) > -1)
			.filter(({msg}) =>
				msg.state === 'controller' || msg.state === 'noteOn'
			)
			.withLatestFrom(state$, (midiData, state) => (Object.assign({}, midiData, {state})))
			// .filter(({raw, state}) => (
			// 	// console.log(raw.input.id, state.midiMap.devices.inputs, state.midiMap.data.in),
			// 	getIds(state.midiMap.devices.inputs, state.midiMap.data.in).indexOf(
			// 		raw.input.id
			// 	) > -1
			// ))
			.subscribe(({raw, msg, state}) => {
				console.log(state.midi.device, raw.input.id, msg.note.number, msg.state);
				if (
					(raw.input.id === state.midi.device || state.midi.device === -1)
					&& msg.channel === state.midi.channel
					&& msg.state === 'noteOn'
				) {
					const {row, col} = locateMap(
						state.midi.schemes[state.midi.scheme],
						msg.note.number
					);
					console.log(row, col);
					if (row === -1 || col === -1) return;
					// console.log((msg.note.number - 60 - col) / 4, (msg.note.number - 60 - col) % 2, row, col);
					actions.set(['pads', 'focused'], [
						row, col
					]);
					if (state.mode === 2)
						trigger(row, col)(state);
				}
			})
	);

	unhook = () => subs.forEach(sub => sub.dispose());
};

module.exports = {
	actions,
	hook,
	unhook: () => unhook()
};
