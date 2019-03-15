'use strict';

// dom
const {
	h1, a, div, i,
	section, button, span
} = require('iblokz-snabbdom-helpers');
// components
const header = require('./header');
const board = require('./board');
const pads = require('./pads');
const rack = require('./rack');
const waveditor = require('./waveditor');
// const counter = require('./counter');

module.exports = ({state, actions}) => section('#ui', [
	header({state, actions}),
	waveditor({state, actions}),
	board({state, actions}),
	pads({state, actions}),
	rack({state, actions})
]);
