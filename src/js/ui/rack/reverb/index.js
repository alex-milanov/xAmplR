'use strict';

const {
	div, h2, span, p, ul, li, hr, button, br,
	form, label, input, fieldset, legend, i, img
} = require('iblokz-snabbdom-helpers');

module.exports = ({name = 'reverb', props, update}) => fieldset([
	legend([
		span('.on', [
			name.toUpperCase()
		])
	]),
	div('.on-switch.fa', {
		on: {click: ev => update('on', !props.on)},
		class: {
			'fa-circle-thin': !props.on,
			'on': props.on,
			'fa-circle': props.on
		}
	}),
	div([
		label(`Seconds`),
		' ',
		// span('.right', `${props.seconds}`),
		input('[type="number"]', {
			attrs: {min: 1, max: 50, step: 0.01},
			props: {value: props.seconds},
			on: {change: ev => update('seconds', parseFloat(ev.target.value))}
		}),
		' ',
		label(`Decay`),
		// span('.right', `${props.decay}`),
		' ',
		input('[type="number"]', {
			attrs: {min: 0, max: 100, step: 0.01},
			props: {value: props.decay},
			on: {change: ev => update('decay', parseFloat(ev.target.value))}
		}),
		' ',
		/*
		label(`Reverse`),
		// span('.right', `${props.reverse}`),
		' ',
		button('.fa', {
			class: {
				'fa-toggle-on': props.reverse,
				'fa-toggle-off': !props.reverse
			},
			on: {
				click: () => update('reverse', !props.reverse)
			}
		}),
		*/
		br(),
		label(`Dry`),
		span('.right', `${props.dry}`),
		input('[type="range"]', {
			attrs: {min: 0, max: 1, step: 0.01},
			props: {value: props.dry},
			on: {change: ev => update('dry', parseFloat(ev.target.value))}
		}),
		label(`Wet`),
		span('.right', `${props.wet}`),
		input('[type="range"]', {
			attrs: {min: 0, max: 1, step: 0.01},
			props: {value: props.wet},
			on: {change: ev => update('wet', parseFloat(ev.target.value))}
		})
		// label(`Gain`),
		// span('.right', `${props.gain}`),
		// input('[type="range"]', {
		// 	attrs: {min: 0, max: 1, step: 0.005},
		// 	props: {value: props.gain},
		// 	on: {change: ev => update('gain', parseFloat(ev.target.value))}
		// })
	])
]);
