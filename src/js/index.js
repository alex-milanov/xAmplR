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
// audio
let audio = require('./services/audio.js');
actions = app.attach(actions, 'audio', audio.actions);
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
actions = app.attach(actions, 'midi', midi.actions);
// stt - speach to text
// let stt = require('./services/stt.js');
// control
let control = require('./services/control.js');
actions = app.attach(actions, 'control', control.actions);

// hot reloading
if (module.hot) {
	// actions
	actions$ = $.fromEventPattern(
    h => module.hot.accept("./actions", h)
	).flatMap(() => {
		actions = app.adapt(require('./actions'));
		actions = app.attach(actions, 'pads', pads.actions);
		actions = app.attach(actions, 'samples', samples.actions);
		actions = app.attach(actions, 'midi', midi.actions);
		actions = app.attach(actions, 'control', control.actions);
		return actions.stream.startWith(state => state);
	}).merge(actions.stream);
	// ui
	module.hot.accept("./ui", function() {
		ui = require('./ui');
		actions.stream.onNext(state => state);
	});
	// services
	// audio
	module.hot.accept("./services/audio.js", function() {
		audio.unhook();
		audio = require('./services/audio.js');
		actions = app.adapt(require('./actions'));
		actions = app.attach(actions, 'audio', audio.actions);
		actions = app.attach(actions, 'pads', pads.actions);
		actions = app.attach(actions, 'samples', samples.actions);
		actions = app.attach(actions, 'midi', midi.actions);
		actions = app.attach(actions, 'control', control.actions);
		audio.hook({state$, actions});
		actions.stream.onNext(state => state);
	});
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
		actions = app.attach(actions, 'audio', audio.actions);
		actions = app.attach(actions, 'pads', pads.actions);
		actions = app.attach(actions, 'samples', samples.actions);
		actions = app.attach(actions, 'midi', midi.actions);
		actions = app.attach(actions, 'control', control.actions);
		samples.hook({state$, actions});
		actions.stream.onNext(state => state);
	});
	// pads
	module.hot.accept("./services/pads.js", function() {
		pads.unhook();
		pads = require('./services/pads.js');
		actions = app.adapt(require('./actions'));
		actions = app.attach(actions, 'audio', audio.actions);
		actions = app.attach(actions, 'pads', pads.actions);
		actions = app.attach(actions, 'samples', samples.actions);
		actions = app.attach(actions, 'midi', midi.actions);
		actions = app.attach(actions, 'control', control.actions);
		pads.hook({state$, actions});
		actions.stream.onNext(state => state);
	});
	// midi
	module.hot.accept("./services/midi.js", function() {
		midi.unhook();
		midi = require('./services/midi.js');
		actions = app.adapt(require('./actions'));
		actions = app.attach(actions, 'audio', audio.actions);
		actions = app.attach(actions, 'pads', pads.actions);
		actions = app.attach(actions, 'samples', samples.actions);
		actions = app.attach(actions, 'midi', midi.actions);
		actions = app.attach(actions, 'control', control.actions);
		midi.hook({state$, actions});
		actions.stream.onNext(state => state);
	});
	// stt
	// module.hot.accept("./services/stt.js", function() {
	// 	stt.unhook();
	// 	stt = require('./services/stt.js');
	// 	stt.hook({state$, actions});
	// 	actions.stream.onNext(state => state);
	// });
	// control
	module.hot.accept("./services/control.js", function() {
		control.unhook();
		control = require('./services/control.js');
		actions = app.adapt(require('./actions'));
		actions = app.attach(actions, 'audio', audio.actions);
		actions = app.attach(actions, 'pads', pads.actions);
		actions = app.attach(actions, 'samples', samples.actions);
		actions = app.attach(actions, 'midi', midi.actions);
		actions = app.attach(actions, 'control', control.actions);
		control.hook({state$, actions});
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

audio.hook({state$, actions});
wavesurfer.hook({state$, actions});
samples.hook({state$, actions});
pads.hook({state$, actions});
midi.hook({state$, actions});
// stt.hook({state$, actions});
control.hook({state$, actions});
