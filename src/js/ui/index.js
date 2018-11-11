'use strict';

// dom
const {
	h1, a, div, i,
	section, button, span
} = require('iblokz-snabbdom-helpers');
// components
const header = require('./header');
const board = require('./board');
const pads = require('./pads');
// const counter = require('./counter');

module.exports = ({state, actions}) => section('#ui', [
	header({state, actions}),
	section('.waveform', [
		div('#wave-timeline'),
		div('#waveform'),
		button({
			on: {
				click: () => actions.toggle(['session', 'playing'])
			}
		}, i(`.fa.fa-${state.session.playing ? 'pause' : 'play'}`))
	]),
	board({state, actions}),
	pads({state, actions})
]);
