'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;

const request = require('superagent');
const {obj} = require('iblokz-data');
const pocket = require('../util/pocket');

const url = `//m2.audiocommons.org/api/audioclips`;

const search = ({pattern, source = 'freesound'}) =>
	request.get(`${url}/search`)
		.query({pattern, source})
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
			state => obj.patch(state, ['samples'], {list})
		));

const actions = {
	initial: {
		list: []
	},
	search
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
