'use strict';

const {
	section, span, a, div, pre, img, i,
	form, input, button, label,
	ul, li, table, tbody, thead, tr, td, th
} = require('iblokz-snabbdom-helpers');

const {obj} = require('iblokz-data');
const vcf = require('./vcf');
const reverb = require('./reverb');

module.exports = ({state, actions}) => section('#rack', [].concat(
	vcf({
		name: 'vcf',
		props: state.rack.vcf,
		update: (path, value) => actions.set([].concat(['rack', 'vcf'], path), value)
	}),
	reverb({
		name: 'reverb',
		props: state.rack.reverb,
		update: (path, value) => actions.set([].concat(['rack', 'reverb'], path), value)
	})
));
