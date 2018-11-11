'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;

const {obj} = require('iblokz-data');

const midi = require('../util/midi');
const pocket = require('../util/pocket');
const a = require('../util/audio');
const sampler = require('../util/audio/sources/sampler');

const getIds = (inputs, indexes) => inputs
	.map(inp => inp.id)
	.filter((id, i) => indexes.indexOf(i) > -1);

const trigger = (row, col) => state => {
	let sampleId = obj.sub(state, ['pads', 'map', row, col]);
	if (sampleId) {
		let inst = sampler.clone(pocket.get(
			['sampleBank', sampleId]
		));
		inst = a.connect(inst, a.context.destination);
		a.start(inst);
	}
	return state;
};

let actions = {
	initial: {},
	trigger
};

let unhook = () => {};
const hook = ({state$, actions}) => {
	let subs = [];

	const {devices$, msg$} = midi.init();

	// midi device access
	subs.push(
		devices$.subscribe(data => actions.midiMap.connect(data))
	);

	const parsedMidiMsg$ = msg$
		.map(raw => ({msg: midi.parseMidiMsg(raw.msg), raw}))
		// .map(data => (console.log(data), data))
		.share();

	// midi messages
	subs.push(
		parsedMidiMsg$
			.map(midiData => (console.log({midiData}), midiData))
			// .filter(({msg}) => ['noteOn', 'noteOff'].indexOf(msg.state) > -1)
			.filter(({msg}) =>
				msg.channel === 13 && msg.state === 'controller' && msg.value === 1
			)
			.withLatestFrom(state$, (midiData, state) => (Object.assign({}, midiData, {state})))
			// .filter(({raw, state}) => (
			// 	// console.log(raw.input.id, state.midiMap.devices.inputs, state.midiMap.data.in),
			// 	getIds(state.midiMap.devices.inputs, state.midiMap.data.in).indexOf(
			// 		raw.input.id
			// 	) > -1
			// ))
			.subscribe(({raw, msg, state}) => {
				// console.log(state.midiMap.devices.inputs, raw.input);
				if (msg.controller >= 10 && msg.controller <= 26) {
					const col = (msg.controller - 10) % 4;
					const row = ((msg.controller - 10 - col) / 4);
					let sampleId = obj.sub(state, ['pads', 'map', row, col]);
					// let inst;
					switch (state.mode) {
						case 1:
							trigger(row, col);
							break;
						case 0:
							actions.set(['pads', 'focused'], [
								row, col
							]);
							break;
						default:
					}
				}
				if (msg.controller >= 37 && msg.controller <= 39) {
					actions.set('mode', msg.controller - 37);
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
