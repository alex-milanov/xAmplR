'use strict';

const {
	section, span, a, div, pre, img, i,
	form, input, button, label,
	ul, li, table, tbody, thead, tr, td, th
} = require('iblokz-snabbdom-helpers');

const formUtil = require('../../util/form');

const play = url => {
	let an = document.createElement('AUDIO');
	an.setAttribute('autoplay', true);
	an.src = url;
};

module.exports = ({state, actions}) => section('#board', [
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
		input(`#board-search-pattern[name="pattern"][placeholder="Query"]`, {
			attrs: {
				value: state.query
			}
		}),
		button('Search')
	]),
	table('#board-samples[width="100%"][cellspacing=4][cellpadding=0]', [
		thead(tr([
			th('[width="60%"]', 'Sample'),
			th('Author'),
			th('Duration'),
			th('License'),
			th('Play'),
			th('Load')
		])),
		tbody(state.samples.list.map(sample =>
			tr([
				td([
					img(`[src="${sample.image}"]`),
					span(sample.name)
				]),
				td(sample.author),
				td(`${(sample.duration / 1000).toFixed(2)} m`),
				td(a(`[target="_blank"][href="${sample.license}"]`,
					sample.license.replace('http://creativecommons.org/', ''))),
				td([
					button({
						on: {
							click: () => play(sample.sound)
						}
					}, i('.fa.fa-play'))
				]),
				td([
					button({
						on: {
							click: ev => actions.pads.load(sample.id, sample.sound)
						}
					}, i('.fa.fa-plus'))
				])
			])
		))
	])
]);
