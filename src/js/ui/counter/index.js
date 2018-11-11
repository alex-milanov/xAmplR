'use strict';

const {section, button, span} = require('iblokz-snabbdom-helpers');

module.exports = ({state, actions}) => section('.counter', [
	button({on: {click: () => actions.counter.decr()}}, 'Decrease'),
	span(`Number:`),
	span('[contenteditable="true"]', {
		on: {input: ev => actions.counter.set(parseInt(ev.target.textContent, 10))}
	}, state.counter.number),
	button({on: {click: () => actions.counter.incr()}}, 'Increase')
]);
