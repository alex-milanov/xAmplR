'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

// iblokz
const vdom = require('iblokz-snabbdom-helpers');
const {obj, arr} = require('iblokz-data');

// app
const app = require('./util/app');
let actions = app.adapt(require('./actions'));
let ui = require('./ui');
let actions$;
const state$ = new Rx.BehaviorSubject();
// services
// wavesurfer
let wavesurfer = require('./services/wavesurfer.js');
// samples - audiocommons
let samples = require('./services/samples.js');
actions = app.attach(actions, 'samples', samples.actions);
// pads
let pads = require('./services/pads.js');
actions = app.attach(actions, 'pads', pads.actions);
// midi
let midi = require('./services/midi.js');

// hot reloading
if (module.hot) {
	// actions
	actions$ = $.fromEventPattern(
    h => module.hot.accept("./actions", h)
	).flatMap(() => {
		actions = app.adapt(require('./actions'));
		actions = app.attach(actions, 'samples', samples.actions);
		return actions.stream.startWith(state => state);
	}).merge(actions.stream);
	// ui
	module.hot.accept("./ui", function() {
		ui = require('./ui');
		actions.stream.onNext(state => state);
	});
	// services
	// wavesurfer
	module.hot.accept("./services/wavesurfer.js", function() {
		wavesurfer.unhook();
		wavesurfer = require('./services/wavesurfer.js');
		wavesurfer.hook({state$, actions});
		actions.stream.onNext(state => state);
	});
	// samples
	module.hot.accept("./services/samples.js", function() {
		samples.unhook();
		samples = require('./services/samples.js');
		actions = app.adapt(require('./actions'));
		actions = app.attach(actions, 'samples', samples.actions);
		samples.hook({state$, actions});
		actions.stream.onNext(state => state);
	});
	// pads
	module.hot.accept("./services/pads.js", function() {
		pads.unhook();
		pads = require('./services/pads.js');
		actions = app.adapt(require('./actions'));
		actions = app.attach(actions, 'pads', pads.actions);
		pads.hook({state$, actions});
		actions.stream.onNext(state => state);
	});
	// midi
	module.hot.accept("./services/midi.js", function() {
		midi.unhook();
		midi = require('./services/midi.js');
		midi.hook({state$, actions});
		actions.stream.onNext(state => state);
	});
} else {
	actions$ = actions.stream;
}

// actions -> state
actions$
	.map(action => (
		action.path && console.log(action.path.join('.'), action.payload),
		console.log(action),
		action
	))
	.startWith(() => actions.initial)
	.scan((state, change) => change(state), {})
	.map(state => (console.log(state), state))
	.subscribe(state => state$.onNext(state));

// state -> ui
const ui$ = state$.map(state => ui({state, actions}));
vdom.patchStream(ui$, '#ui');

wavesurfer.hook({state$, actions});
samples.hook({state$, actions});
pads.hook({state$, actions});
midi.hook({state$, actions});

// livereload impl.
if (module.hot) {
	document.write(`<script src="http://${(location.host || 'localhost').split(':')[0]}` +
	`:35729/livereload.js?snipver=1"></script>`);
}
