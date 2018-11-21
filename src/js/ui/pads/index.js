'use strict';

const {
	section, span, a, div, pre, img, i,
	form, input, button, label,
	ul, li, table, tbody, thead, tr, td, th
} = require('iblokz-snabbdom-helpers');

const {obj} = require('iblokz-data');

module.exports = ({state, actions}) => section('#pads',
	div('.rows', Array(4).fill({}).map((a, row) =>
		div('.cols', Array(4).fill({}).map((a, col) =>
			button('.pad', {
				style: {
					backgroundImage: obj.sub(state, ['pads', 'map', row, col, 'id'])
						? `url(${obj.sub(state, ['pads', 'map', row, col, 'image'])})`
						: 'none'
				},
				class: {
					focused: state.pads.focused[0] === row && state.pads.focused[1] === col,
					assigned: obj.sub(state, ['pads', 'map', row, col, 'id'])
				},
				on: {
					focus: () => actions.set(['pads', 'focused'], [row, col]),
					click: () => (
						state.mode === 2 && actions.midi.trigger(row, col),
						state.mode === 0 && actions.set(['pads', 'focused'], [row, col])
					)
				}
			}, obj.sub(state, ['pads', 'map', row, col, 'name']) || '')
		))
	))
);
