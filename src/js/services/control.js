'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;

let unhook = () => {};
const hook = ({state$, actions}) => {
	let subs = [];

	unhook = () => subs.forEach(sub => sub.dispose());
};

module.exports = {
	hook,
	unhook: () => unhook()
};
