'use strict';

const {
	section, span, a, div, pre, img, i,
	form, input, button, label,
	ul, li, table, tbody, thead, tr, td, th
} = require('iblokz-snabbdom-helpers');

const {obj} = require('iblokz-data');

module.exports = ({state, actions}) => section('#waveditor', [
	div('#wave-timeline'),
	div('#waveform'),
	button({
		on: {
			click: () => actions.toggle(['session', 'playing'])
		}
	}, i(`.fa.fa-${state.session.playing ? 'pause' : 'play'}`)),
	div('#tools', [
		button('.fa.fa-microphone'),
		button('.fa.fa-scissors'),
		button('.fa.fa-exchange'),
		button('.fa.fa-times')
	])
]);
