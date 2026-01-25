'use strict';

// lib
const { fromEventPattern } = require('rxjs');
const { distinctUntilChanged, map } = require('rxjs/operators');

// iblokz
const vdom = require('iblokz-snabbdom-helpers');
const {createState, attach} = require('iblokz-state');
const {obj} = require('iblokz-data');

// app
let actionsTree = require('./actions');
let ui = require('./ui');

// services
// audio
let audio = require('./services/audio.js');
actionsTree = obj.patch(actionsTree, 'audio', audio.actions);
// wavesurfer
let wavesurfer = require('./services/wavesurfer.js');
// samples - audiocommons
let samples = require('./services/samples.js');
actionsTree = obj.patch(actionsTree, 'samples', samples.actions);
// pads
let pads = require('./services/pads.js');
actionsTree = obj.patch(actionsTree, 'pads', pads.actions);
// midi
let midi = require('./services/midi.js');
actionsTree = obj.patch(actionsTree, 'midi', midi.actions);
// stt - speach to text
// let stt = require('./services/stt.js');
// control
let control = require('./services/control.js');
actionsTree = obj.patch(actionsTree, 'control', control.actions);

let {actions, state$} = createState(actionsTree);

// hot reloading
if (module.hot) {
	// actions
	// module.hot.accept("./actions", function() {
	// 	actionsTree = require('./actions');
	// 	const result = createState(actionsTree);
	// 	actions = result.actions;
	// 	state$ = result.state$;
	// 	// Re-attach service actions
	// 	actions = attach(actions, 'audio', audio.actions);
	// 	actions = attach(actions, 'samples', samples.actions);
	// 	actions = attach(actions, 'pads', pads.actions);
	// 	actions = attach(actions, 'midi', midi.actions);
	// 	actions = attach(actions, 'control', control.actions);
	// 	// Trigger a re-render with current state
	// 	actions.stream.next({path: ['_reload'], payload: []});
	// });
	// ui
	module.hot.accept("./ui", function() {
		ui = require('./ui');
		// Trigger a re-render with current state
		actions.stream.next({path: ['_reload'], payload: []});
	});
	// services
	// audio
	module.hot.accept("./services/audio.js", function() {
		audio.unhook();
		audio = require('./services/audio.js');
		actions = attach(actions, 'audio', audio.actions);
		audio.hook({state$, actions});
		actions.stream.next({path: ['_reload'], payload: []});
	});
	// wavesurfer
	module.hot.accept("./services/wavesurfer.js", function() {
		wavesurfer.unhook();
		wavesurfer = require('./services/wavesurfer.js');
		wavesurfer.hook({state$, actions});
		actions.stream.next({path: ['_reload'], payload: []});
	});
	// samples
	module.hot.accept("./services/samples.js", function() {
		samples.unhook();
		samples = require('./services/samples.js');
		actions = attach(actions, 'samples', samples.actions);
		samples.hook({state$, actions});
		actions.stream.next({path: ['_reload'], payload: []});
	});
	// pads
	module.hot.accept("./services/pads.js", function() {
		pads.unhook();
		pads = require('./services/pads.js');
		actions = attach(actions, 'pads', pads.actions);
		pads.hook({state$, actions});
		actions.stream.next({path: ['_reload'], payload: []});
	});
	// midi
	module.hot.accept("./services/midi.js", function() {
		midi.unhook();
		midi = require('./services/midi.js');
		actions = attach(actions, 'midi', midi.actions);
		midi.hook({state$, actions});
		actions.stream.next({path: ['_reload'], payload: []});
	});
	// stt
	// module.hot.accept("./services/stt.js", function() {
	// 	stt.unhook();
	// 	stt = require('./services/stt.js');
	// 	stt.hook({state$, actions});
	// 	actions.stream.next({path: ['_reload'], payload: []});
	// });
	// control
	module.hot.accept("./services/control.js", function() {
		control.unhook();
		control = require('./services/control.js');
		actions = attach(actions, 'control', control.actions);
		control.hook({state$, actions});
		actions.stream.next({path: ['_reload'], payload: []});
	});
}


// Expose state$ and actions on window for testing
if (typeof window !== 'undefined') {
	window.state$ = state$;
	window.actions = actions;
}

// state -> ui
const ui$ = state$.pipe(
	map(state => ui({state, actions}))
);
vdom.patchStream(ui$, '#ui');

audio.hook({state$, actions});
wavesurfer.hook({state$, actions});
samples.hook({state$, actions});
pads.hook({state$, actions});
midi.hook({state$, actions});
// stt.hook({state$, actions});
control.hook({state$, actions});
