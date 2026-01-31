'use strict';

/**
 * Converts an AudioBuffer to a WAV file as an ArrayBuffer.
 * Uses 16-bit PCM encoding.
 * 
 * @param {AudioBuffer} buffer - The AudioBuffer to convert
 * @returns {ArrayBuffer} The WAV file as an ArrayBuffer
 */
const audioBufferToWav = (buffer) => {
	const numChannels = buffer.numberOfChannels;
	const sampleRate = buffer.sampleRate;
	const format = 1; // PCM
	const bitDepth = 16;
	const bytesPerSample = bitDepth / 8;
	const blockAlign = numChannels * bytesPerSample;

	// Interleave channels
	const length = buffer.length;
	const interleaved = new Float32Array(length * numChannels);

	for (let channel = 0; channel < numChannels; channel++) {
		const channelData = buffer.getChannelData(channel);
		for (let i = 0; i < length; i++) {
			interleaved[i * numChannels + channel] = channelData[i];
		}
	}

	// Convert to 16-bit PCM
	const dataLength = interleaved.length * bytesPerSample;
	const headerLength = 44;
	const totalLength = headerLength + dataLength;

	const arrayBuffer = new ArrayBuffer(totalLength);
	const view = new DataView(arrayBuffer);

	// WAV header
	// "RIFF" chunk descriptor
	writeString(view, 0, 'RIFF');
	view.setUint32(4, totalLength - 8, true); // file size - 8
	writeString(view, 8, 'WAVE');

	// "fmt " sub-chunk
	writeString(view, 12, 'fmt ');
	view.setUint32(16, 16, true); // fmt chunk size
	view.setUint16(20, format, true); // audio format (PCM = 1)
	view.setUint16(22, numChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * blockAlign, true); // byte rate
	view.setUint16(32, blockAlign, true);
	view.setUint16(34, bitDepth, true);

	// "data" sub-chunk
	writeString(view, 36, 'data');
	view.setUint32(40, dataLength, true);

	// Write audio data
	const offset = 44;
	for (let i = 0; i < interleaved.length; i++) {
		// Clamp to [-1, 1] and convert to 16-bit
		const sample = Math.max(-1, Math.min(1, interleaved[i]));
		const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
		view.setInt16(offset + i * bytesPerSample, int16, true);
	}

	return arrayBuffer;
};

/**
 * Helper function to write a string to a DataView.
 * @param {DataView} view - The DataView to write to
 * @param {number} offset - The offset to start writing at
 * @param {string} string - The string to write
 */
const writeString = (view, offset, string) => {
	for (let i = 0; i < string.length; i++) {
		view.setUint8(offset + i, string.charCodeAt(i));
	}
};

/**
 * Sanitizes a filename by removing or replacing invalid characters.
 * @param {string} name - The filename to sanitize
 * @returns {string} The sanitized filename
 */
const sanitizeFilename = (name) => {
	if (!name) return 'untitled';
	return name
		.replace(/[<>:"/\\|?*]/g, '-') // Replace invalid chars
		.replace(/\s+/g, '-') // Replace spaces with dashes
		.replace(/-+/g, '-') // Collapse multiple dashes
		.replace(/^-|-$/g, '') // Remove leading/trailing dashes
		.substring(0, 100); // Limit length
};

module.exports = {
	audioBufferToWav,
	sanitizeFilename
};
