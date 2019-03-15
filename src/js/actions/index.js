'use strict';

const {obj, arr} = require('iblokz-data');

// namespaces=
const counter = require('./counter');
const midiMap = require('./midi-map');

// initial
const initial = {
	mode: 1,
	stt: false,
	sttMic: false,
	query: '',
	session: {
		sample: 'assets/LatinEthnoElektroGroove.mp3',
		playing: false,
		focused: [0, 0],
		pads: {}
	},
	samples: {
		list: [],
		query: {
			page: 1,
			pattern: '',
			source: 'freesound',
			limit: 12
		}
	},
	rack: {
		vcf: {
			on: false,
			type: 'lowpass',
			cutoff: 0.64,
			resonance: 0,
			gain: 0
		},
		reverb: {
			on: false,
			seconds: 3,
			decay: 2,
			reverse: false,
			dry: 0.8,
			wet: 0.7
		}
	}
};

// actions
const set = (key, value) => state => obj.patch(state, key, value);
const toggle = key => state => obj.patch(state, key, !obj.sub(state, key));
const arrToggle = (key, value) => state =>
	obj.patch(state, key,
		arr.toggle(obj.sub(state, key), value)
	);

module.exports = {
	initial,
	// namespaces
	midiMap,
	// actions
	set,
	toggle,
	arrToggle
};
