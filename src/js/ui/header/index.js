'use strict';

const {
	section, button, span, header, h1,
	ul, li, i, img
} = require('iblokz-snabbdom-helpers');

module.exports = ({state, actions}) => header([
	ul('.left', [
		li(button({
			on: {
				click: () => actions.set('mode', 0)
			},
			class: {
				selected: state.mode === 0
			}
		}, img(`[src="assets/icons/midi.svg"]`))),
		li(button({
			on: {
				click: () => actions.set('mode', 1)
			},
			class: {
				selected: state.mode === 1
			}
		}, i('.fa.fa-edit'))),
		li(button({
			on: {
				click: () => actions.set('mode', 2)
			},
			class: {
				selected: state.mode === 2
			}
		}, i('.fa.fa-music')))
	]),
	h1('xAmplR'),
	ul('.right', [
		li(button({
			on: {
				click: () => actions.toggle('recording')
			},
			class: {
				recording: state.recording
			}
		}, i('.fa.fa-microphone')))
	])
]);
