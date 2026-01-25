
const { Observable } = require('rxjs');
const $ = Observable;

// util
const {obj, arr} = require('iblokz-data');

const initial = {
	region: {start: 0, end: 0} // {start: 0, end: 0}
};

const updateRegion = ({start, end}) => state =>
	obj.patch(state, 'waveEditor', {region: {start, end}})

module.exports = {
	initial,
	updateRegion
}
