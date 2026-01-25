'use strict';
// lib
const { Observable } = require('rxjs');
const $ = Observable;

const request = require('superagent');
const {obj} = require('iblokz-data');
const pocket = require('../util/pocket');

const FS_URL = `https://freesound.org/apiv2/search/text/`;  //?query=piano&token=
const FS_TOKEN = process.env.FS_TOKEN;

console.log(process.env);

const withParams = (url, params) =>
	`${url}?${new URLSearchParams(params).toString()}`

console.log(withParams(FS_URL, {token: FS_TOKEN, query: 'kick'}));


const search = ({pattern, source = 'freesound', limit = 12, page = 1}) =>
	fetch(withParams(FS_URL, {
			token: FS_TOKEN, query: pattern,
			fields: 'id,name,username,license,duration,images,previews',
			page, page_size: limit
		}))
		.then(res => res.json())
		.then(data => (console.log(
			JSON.stringify(data, null, 2)), data))
		.then(data => data.results)
		.then(results => results.map(r => ({
			id: r.id,
			name: r.name,
			author: r.username,
			// sound: m.content.availableAs[0].locator,
			// image: m.content.images[0].locator,
			sound: r.previews['preview-hq-ogg'],
			image: r.images['waveform_m'],
			license: r.license,
			duration: r.duration
		})))
		.then(list => (
			state => obj.patch(state, ['samples'], {
				list: page > 1 ? [].concat(state.samples.list, list) : list,
				query: {pattern, source, limit, page}})
		));


const url = `https://m2.audiocommons.org/api/audioclips`;

const _search = ({pattern, source = 'freesound', limit = 12, page = 1}) =>
	request.get(`${url}/search`)
		.query({pattern, source, limit, page})
		.then(res => res.body.results)
		.then(results => (console.log(results), results))
		.then(results => results[0].members.map(
			m => ({
				id: m.content['@id'],
				name: m.content.title,
				author: m.content.author.replace('freesound-users:', ''),
				sound: m.content.availableAs[0].locator,
				image: m.content.images[0].locator,
				license: m.content.license,
				duration: m.content.duration
			})
		))
		.then(list => (
			state => obj.patch(state, ['samples'], {
				list: page > 1 ? [].concat(state.samples.list, list) : list,
				query: {pattern, source, limit, page}})
		));

const next = () => state => obj.patch(state, ['samples'], {
	index: state.samples.index < state.samples.list.length - 1
		? state.samples.index + 1
		: state.samples.index
});

const prev = () => state => obj.patch(state, ['samples'], {
	index: state.samples.index > 0 ? state.samples.index - 1 : state.samples.index
});

const actions = {
	initial: {
		list: [],
		query: {
			page: 1,
			pattern: '',
			source: 'freesound',
			limit: 12
		},
		index: 0
	},
	search,
	next,
	prev
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
