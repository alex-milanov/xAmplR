'use strict';

const {
	section, button, span, header, h1,
	ul, li, i, img, select, option, input
} = require('iblokz-snabbdom-helpers');

const {obj} = require('iblokz-data');

module.exports = ({state, actions}) => header([
	h1('xAmplR'),
	ul('.left', [
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
		}, i('.fa.fa-music'))),
		li(button(img(`[src="assets/icons/midi.svg"]`))),
		li(
			select(`[name="device"]`, {
				props: {value: state.midi.device},
				on: {change: ev => actions.set(['midi', 'device'], ev.target.value)}
			}, [].concat(
				option(`[value="-1"]`, {
					attrs: {
						selected: state.midi.device === '-1'
					}
				}, 'Any device'),
				(obj.sub(state, ['midi', 'devices', 'inputs']) || []).map((device, k) =>
					option(`[value="${device.id}"]`, {
						attrs: {
							selected: device.id === state.midi.device
						}
					}, device.name)
				)
			))
		),
		li(
			input(`[name="channel"][type="number"][size="3"]`, {
				style: {width: '60px'},
				props: {value: state.midi.channel},
				on: {input: ev => actions.set(['midi', 'channel'], parseInt(ev.target.value, 10))}
			})
		),
		li(
			select({
				on: {change: ev => actions.set(['midi', 'scheme'], ev.target.value)}
			}, Object.keys(state.midi.schemes).map(scheme =>
				option({props: {selected: scheme === state.midi.scheme}}, scheme)
			))
		)
		// li(button({
		// 	on: {
		// 		click: () => actions.set('mode', 0)
		// 	},
		// 	class: {
		// 		selected: state.mode === 0
		// 	}
		// }, i('.fa.fa-cogs'))),
	]),
	// ul('.center', [
	//
	// ]),
	ul('.right', [
		li(
			select(`[name="audioDevice0"]`, {
				props: {value: state.audio.deviceInputs[0]},
				on: {change: ev => actions.set(['audio', 'deviceInputs', 0], ev.target.value)}
			}, [].concat(
				state.audio.devices.map((device, k) =>
					option(`[value="${device.deviceId}"]`, {
						attrs: {
							selected: device.deviceId === state.audio.deviceInputs[0]
						}
					}, device.label)
				)
			))
		),
		li(button({
			on: {
				click: () => actions.toggle('recording')
			},
			class: {
				recording: state.recording
			}
		}, i('.fa.fa-microphone')))
		// li(button([
		// 	i('.fa.fa-retweet')
		// ]))
	])
]);
