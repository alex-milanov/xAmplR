'use strict';
// lib
const { Observable } = require('rxjs');
const $ = Observable;

const {obj, fn} = require('iblokz-data');
const pocket = require('../util/pocket');
const file = require('../util/file');
const {context} = require('../util/audio');
const sampler = require('../util/audio/sources/sampler');

const { from, firstValueFrom } = require('rxjs');
const { concatMap, map, catchError } = require('rxjs/operators');
const { of } = require('rxjs');

const load = (sample, url) => firstValueFrom(
	from(fetch(url.replace('http://', '//'))
		.then(res => res.arrayBuffer()))
		.pipe(concatMap(buffer => from(context.decodeAudioData(buffer))))
		.pipe(map(buffer => ({
			sample,
			node: sampler.create(url, buffer)
		})))
		.pipe(map(({sample, node}) => {
			pocket.put(['sampleBank', sample.id], node);
			return state => obj.patch(state, ['pads', 'map', ...state.pads.focused], {
				...sample,
				updated: new Date()
			});
		}))
		.pipe(catchError(error => {
			console.error('Error loading pad sample:', error);
			return of(state => state); // Return identity reducer on error
		}))
);

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

	unhook = () => subs.forEach(sub => sub.unsubscribe());
};

module.exports = {
	actions,
	hook,
	unhook: () => unhook()
};
