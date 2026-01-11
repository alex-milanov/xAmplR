'use strict';

const {
	section, button, span, header, h1,
	ul, li, i, img, select, option, input
} = require('iblokz-snabbdom-helpers');

const uuid = require('uuid/v1');
const drawWave = require('draw-wave');

const {obj} = require('iblokz-data');


const pocket = require('../../util/pocket');
const a = require('../../util/audio');


const drawBuffer = buffer => {
	let canvas = document.createElement('canvas');
	canvas.width = 128;
	canvas.height = 128;
	drawWave.canvas(canvas, buffer, '#52F6A4');
	return canvas.toDataURL();
};

const fileToAudioBuffer = file => new Promise((resolve, reject) => {
	const fr = new FileReader();
	fr.onload = function(ev) {
		console.log('file to buffer', ev, ev.target.result);
		resolve(ev.target.result)
	};
	// console.log(file, readAs);
	fr.readAsArrayBuffer(file);
})
	.then(arrayBuffer => a.context.decodeAudioData(arrayBuffer))


const openDialog = () => new Promise((resolve, reject) => {
	let fileEl = document.createElement('input');
	fileEl.setAttribute('type', 'file');
	fileEl.addEventListener('change', ev => {
		console.log(ev.target.files, this);
		resolve(
			ev.target.files[0]
		);
	});
	fileEl.dispatchEvent(new MouseEvent('click', {
		view: window,
		bubbles: true,
		cancelable: true
	}));
});

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
		),
		li(button(i(`.fa.fa-upload`, {
			on: {
				click: () => openDialog()
					.then(file => fileToAudioBuffer(file)
						.then(buffer => ({file, buffer}))
					)
					.then(({file, buffer}) => actions.audio.load({
						id: `recorded:${uuid()}`,
						name: file.name,
						image: drawBuffer(buffer)
					}, buffer))
			}
		}))),
		li(button(i(`.fa.fa-save`))),
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
