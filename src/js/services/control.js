'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;

const gamepad = require('../util/gamepad');

let actions = {
	initial: {}
};

const play = url => {
	let an = document.createElement('AUDIO');
	an.setAttribute('autoplay', true);
	an.src = url;
};

const keyMap = [
	['7', '8', '9', '0'],
	['u', 'i', 'o', 'p'],
	['j', 'k', 'l', ';'],
	['m', ',', '.', '/']
];

const getIndex = key => keyMap.reduce(
	(p1, cols, row) => p1.row === -1 ? cols.reduce(
		(p2, mapKey, col) => key === mapKey
			? ({row, col})
			: p2,
		p1
	) : p1,
	{row: -1, col: -1}
);

let unhook = () => {};
const hook = ({state$, actions}) => {
	let subs = [];

	gamepad.changes()
		.map(pads => (console.log({pads}), pads))
		.withLatestFrom(state$, (pads, state) => ({pads, state}))
		.subscribe(({pads, state}) => {
			console.log(pads[0]);
			if (pads[0]) {
				if (pads[0].axes[1] === -1) actions.samples.prev();
				// if (pads[0].axes[0] > 0) actions.move('right');
				if (pads[0].axes[1] === 1) actions.samples.next();
				// if (pads[0].axes[0] < 0) actions.move('left');
				if (pads[0].buttons[8].pressed === true) {
					if (state.samples.list[state.samples.index]) play(state.samples.list[state.samples.index].sound);
				}
				if (pads[0].buttons[3].pressed === true) {
					let sample = state.samples.list[state.samples.index];
					if (sample) actions.pads.load(sample, sample.sound);
				}
				if (pads[0].buttons[0].pressed === true) {
					actions.set('sttMic', true);
				}
				if (pads[0].buttons[1].pressed === true) {
					actions.set('mode', 0);
				}
				if (pads[0].buttons[2].pressed === true) {
					actions.set('mode', 1);
				}
			}
		});

	$.fromEvent(document, 'keydown')
		.filter(ev => ['input', 'textarea'].indexOf(ev.target.tagName.toLowerCase()) === -1)
		.withLatestFrom(state$, (ev, state) => ({ev, state}))
		.subscribe(({ev, state}) => {
			if (ev.key > 0 && ev.key < 4) {
				actions.set('mode', parseInt(ev.key, 10) - 1);
			} else {
				let pos = getIndex(ev.key);
				console.log(ev.key, ev.target, pos);
				if (pos.row !== -1) {
					actions.set(['pads', 'focused'], [
						pos.row, pos.col
					]);
					if (state.mode === 2)
						actions.midi.trigger(pos.row, pos.col);
				}
			}
		});

	unhook = () => subs.forEach(sub => sub.dispose());
};

module.exports = {
	actions,
	hook,
	unhook: () => unhook()
};
