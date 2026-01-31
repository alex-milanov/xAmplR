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

/**
 * Creates and saves a ZIP file containing the provided files.
 * @param {string} fileName - The name of the ZIP file to create
 * @param {Object} files - Object mapping file paths to content (ArrayBuffer, string, or Blob)
 * @returns {Promise} Promise that resolves when the file is saved
 */
const saveZip = (fileName, files) => {
	const zip = new jsZip();
	Object.entries(files).forEach(([path, content]) => {
		zip.file(path, content);
	});
	return zip.generateAsync({type: 'blob'})
		.then(blob => fileSaver.saveAs(blob, fileName));
};

module.exports = {
	load,
	loadZip,
	save,
	saveZip
};
