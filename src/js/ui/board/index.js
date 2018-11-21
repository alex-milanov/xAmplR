'use strict';

const {
	section, span, a, div, pre, img, i,
	form, input, button, label, select, option,
	ul, li, table, tbody, thead, tr, td, th
} = require('iblokz-snabbdom-helpers');

const formUtil = require('../../util/form');
const {fn, obj} = require('iblokz-data');

const play = url => {
	let an = document.createElement('AUDIO');
	an.setAttribute('autoplay', true);
	an.src = url;
};

module.exports = ({state, actions}) => section('#board', [].concat(
	form('#board-search', {
		on: {
			submit: ev => {
				ev.preventDefault();
				let data = formUtil.toData(ev.target);
				console.log(data);
				actions.samples.search(data);
			}
		}
	}, [
		input(`[type="hidden"][name="page"][value=1]`),
		input(`#board-search-pattern[name="pattern"][placeholder="Query"]`, {
			attrs: {
				value: state.samples.query.pattern
			}
		}),
		select(`[name="source"]`, ['freesound', 'jamendo', 'europeana'].map(
			s => option(`[value="${s}"]`, s)
		)),
		button('Search')
	]),
	(state.samples.list.length > 0) ? ul('#board-samples', [].concat(
		state.samples.list.map((sample, index) =>
			li({
				class: {
					selected: index === state.samples.index
				}
			}, [
				img(`.wave[src="${sample.image}"]`),
				span('.name', {
					on: {
						click: () => actions.set(['samples', 'index'], index)
					}
				}, sample.name),
				a(`.author[title="${sample.author}"]`, i('.fa.fa-user')),
				span('.duration', `${(sample.duration / 1000).toFixed(2)} s`),
				a(`.license[target="_blank"][href="${sample.license}"]`,
					fn.pipe(
						() => sample.license.replace('http://creativecommons.org/', ''),
						license => obj.switch(license, {
							'default': license,
							'licenses/by/3.0/': [
								i(`.cc.cc-cc.cc-2x`),
								i(`.cc.cc-by.cc-2x`)
							],
							'publicdomain/zero/1.0/': [
								i(`.cc.cc-cc.cc-2x`),
								i(`.cc.cc-zero.cc-2x`)
							],
							'licenses/by-nc/3.0/': [
								i(`.cc.cc-cc.cc-2x`),
								i(`.cc.cc-by.cc-2x`),
								i(`.cc.cc-nc.cc-2x`)
							],
							'licenses/sampling+/1.0/': [
								i(`.cc.cc-cc.cc-2x`)
							]
						})
					)()
				),
				span('.controls', [
					button({
						on: {
							click: () => play(sample.sound)
						}
					}, i('.fa.fa-play')),
					button({
						on: {
							click: ev => actions.pads.load(sample, sample.sound)
						}
					}, i('.fa.fa-plus'))
				])
			])),
		li(button(`.full`, {
			on: {
				click: () => actions.samples.search({...state.samples.query, page: state.samples.query.page + 1})
			}
		}, 'Load more samples...'))
	)) : []
));
