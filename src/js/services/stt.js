'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;
const request = require('superagent');

const SpeechSDK = window.SpeechSDK;

const subscriptionKey = 'c63057e1219441489c1b43132685c4b8';
const region = 'westus';
const url = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

const init = token => {
	let speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
	speechConfig.speechRecognitionLanguage = "en-GB";
	let audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
	let recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
	return recognizer;
};

const recognize = recognizer =>
	$.fromCallback(recognizer.recognizeOnceAsync, recognizer)()
	.map(res => (console.log(res), res));

let unhook = () => {};
const hook = ({state$, actions}) => {
	let subs = [];

	request
		.post(url)
		.set({
			'Content-Type': 'application/json',
			'Ocp-Apim-Subscription-Key': subscriptionKey
		})
		.then(res => actions.set('stt', res.text));

	state$.distinctUntilChanged(state => state.stt + ' ' + state.sttMic)
		.filter(state => state.stt && state.sttMic)
		.map(state => init(state.stt))
		.flatMap(recognize)
		.subscribe(res => {
			let pattern = res.privText.replace(/\.$/, '');
			actions.samples.search({pattern});
			actions.set('sttMic', false);
		});

	unhook = () => subs.forEach(sub => sub.dispose());
};

module.exports = {
	hook,
	unhook: () => unhook()
};
