'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;

const {obj, fn} = require('iblokz-data');
const pocket = require('../util/pocket');
const file = require('../util/file');
const {context} = require('../util/audio');
const sampler = require('../util/audio/sources/sampler');

const load = (id, url) => $.fromPromise(fetch(url.replace('http://', '//'))
	.then(res => res.arrayBuffer()))
	.concatMap(buffer => $.fromCallback(context.decodeAudioData, context)(buffer))
	.map(buffer => ({
		id,
		node: sampler.create(url, buffer)
	}))
	.map(sample => (
		pocket.put(['sampleBank', sample.id], sample.node),
		state => obj.patch(state, ['pads', 'map', ...state.pads.focused], sample.id)
	));

const actions = {
	initial: {
		focused: [0, 0],
		map: {}
	},
	load
};

let unhook = () => {};
const hook = ({state$, actions}) => {
	let subs = [];

	unhook = () => subs.forEach(sub => sub.dispose());
};

module.exports = {
	actions,
	hook,
	unhook: () => unhook()
};
