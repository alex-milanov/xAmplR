'use strict';

const fse = require('fs-extra');
const path = require('path');

const paths = {
	'dist/fonts': [
		'node_modules/font-awesome/fonts',
		'node_modules/cc-icons/fonts'
	],
	'dist/assets': 'src/assets'
};

const copy = (a, b) => fse.copySync(
	path.resolve(__dirname, '..', a),
	path.resolve(__dirname, '..', b)
);

Object.keys(paths).forEach(
	p => typeof paths[p] === 'string'
		? copy(paths[p], p)
		: paths[p].forEach(item => copy(item, p))
);
