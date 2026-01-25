'use strict';

const { Observable, from, of, concat } = require('rxjs');
const { mergeMap, reduce } = require('rxjs/operators');
const $ = Observable;
const fileSaver = require('file-saver');
const jsZip = require("jszip");
const {fn, obj} = require("iblokz-data");

const load = (file, readAs = 'text') => new Observable(stream => {
	const fr = new FileReader();
	fr.onload = function(ev) {
		// console.log(readAs, ev.target.result);
		stream.next(
			readAs === 'json'
				? JSON.parse(ev.target.result)
				: ev.target.result
		);
		stream.complete();
	};
	// console.log(file, readAs);
	((typeof file === 'string')
		? from(fetch(file)).pipe(mergeMap(res => res.blob()))
		: of(file))
		.subscribe(f => fn.switch(readAs, {
			arrayBuffer: f => fr.readAsArrayBuffer(f),
			default: f => fr.readAsText(f)
		})(f));
});

const loadZip = file => load(file, 'arrayBuffer')
	.pipe(mergeMap(data => from(jsZip.loadAsync(data))))
	.pipe(mergeMap(zf => concat(
		...Object.keys(zf.files)
			.filter(k => !zf.files[k].dir)
			// .map(k => (console.log(k), k))
			.map(k => from(zf.files[k].async('arraybuffer')).map(v => ({k, v})))
		).pipe(reduce((o, {k, v}) => obj.patch(o, k, v), {}))
	));

const save = (fileName, content) => fileSaver.saveAs(
	new Blob([JSON.stringify(content)], {type: "text/plain;charset=utf-8"}),
	fileName
);

module.exports = {
	load,
	loadZip,
	save
};
