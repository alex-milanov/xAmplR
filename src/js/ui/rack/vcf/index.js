'use strict';

const {
	div, h2, span, p, ul, li, hr, button, br, a,
	form, label, input, fieldset, legend, i, img,
	select, option
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
		div([
			label(`Type`),
			select({
				on: {change: ev => update('type', ev.target.value)}
			}, [
				'lowpass', 'highpass'
				// 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass'
			].map(type =>
				option({
					attrs: {
						value: type
					},
					props: {
						selected: props.type === type
					}
				}, type)
			))
		]),
		div([
			label(`Cutoff`),
			span('.right', `${props.cutoff}`),
			input('[type="range"]', {
				attrs: {min: 0, max: 1, step: 0.01},
				props: {value: props.cutoff},
				on: {change: ev => update('cutoff', parseFloat(ev.target.value))}
			})
		]),
		label(`Resonance`),
		span('.right', `${props.resonance}`),
		input('[type="range"]', {
			attrs: {min: 0, max: 1, step: 0.01},
			props: {value: props.resonance},
			on: {change: ev => update('resonance', parseFloat(ev.target.value))}
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
