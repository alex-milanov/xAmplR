'use strict';

const {obj} = require('iblokz-data');

const keys = Object.keys;

const arrify = o => o instanceof Object
  ? !(o instanceof Array) && keys(o).filter(k => k.match(/^-?[0-9.]+$/)).length === keys(o).length
    ? keys(o).map(k => arrify(o[k]))
    : keys(o).reduce((o2, k) => obj.patch(o2, k, arrify(o[k])), {})
  : o;

const toData = form => arrify(Array.from(form.elements)
  // .map(el => (console.log(el.name), el))
  .filter(el => el.name !== undefined && el.name !== '')
  .reduce((o, el) => obj.patch(o, el.name.split('.'),
    el.type && el.type === 'number'
      ? Number(el.value)
      : el.value
  ), {}));

const clear = form => Array.from(form.elements)
  .forEach(el => (el.value = null));

module.exports = {
	toData,
	clear
};
