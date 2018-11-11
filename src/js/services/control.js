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
				if (sample) actions.pads.load(sample.id, sample.sound);
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

	unhook = () => subs.forEach(sub => sub.dispose());
};

module.exports = {
	actions,
	hook,
	unhook: () => unhook()
};
