'use strict';

// lib
const {obj} = require('iblokz-data');

// initial state
const initial = {
	number: 0
};

// action
const set = number => state => obj.patch(state, 'counter', {number});
const incr = () => state => obj.patch(state, 'counter', {number: state.counter.number + 1});
const decr = () => state => obj.patch(state, 'counter', {number: state.counter.number - 1});

module.exports = {
	initial,
	set,
	incr,
	decr
};
