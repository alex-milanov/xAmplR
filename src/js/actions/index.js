'use strict';

const {obj, arr} = require('iblokz-data');

// namespaces=
const counter = require('./counter');
const midiMap = require('./midi-map');

// initial
const initial = {
	mode: 0,
	stt: false,
	sttMic: false,
	query: '',
	session: {
		sample: 'assets/LatinEthnoElektroGroove.mp3',
		playing: false,
		focused: [0, 0],
		pads: {}
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
