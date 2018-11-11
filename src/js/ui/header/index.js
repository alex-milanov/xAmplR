'use strict';

const {
	section, button, span, header, h1,
	ul, li, i
} = require('iblokz-snabbdom-helpers');

module.exports = ({state, actions}) => header([
	ul('.left', [
		li(button({
			on: {
				click: () => actions.set('sttMic', true)
			},
			class: {
				selected: state.sttMic
			}
		}, i('.fa.fa-volume-control-phone')))
	]),
	h1('xAmplR'),
	ul('.right', [
		li(button({
			on: {
				click: () => actions.set('mode', 0)
			},
			class: {
				selected: state.mode === 0
			}
		}, i('.fa.fa-edit'))),
		li(button({
			on: {
				click: () => actions.set('mode', 1)
			},
			class: {
				selected: state.mode === 1
			}
		}, i('.fa.fa-music')))
	])
]);
