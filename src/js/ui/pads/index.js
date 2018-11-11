'use strict';

const {
	section, span, a, div, pre, img, i,
	form, input, button, label,
	ul, li, table, tbody, thead, tr, td, th
} = require('iblokz-snabbdom-helpers');

module.exports = ({state, actions}) => section('#pads',
	div('.rows', Array(4).fill({}).map((a, row) =>
		div('.cols', Array(4).fill({}).map((a, col) =>
			button('.pad', {
				class: {
					focused: state.mode === 0 && state.pads.focused[0] === row && state.pads.focused[1] === col
				},
				on: {
					focus: () => state.mode === 0 && actions.set(['pads', 'focused'], [row, col]),
					click: () => state.mode === 1 && actions.midi.trigger(row, col)
				}
			})
		))
	))
);
