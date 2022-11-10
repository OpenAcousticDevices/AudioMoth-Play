/****************************************************************************
 * exportAudio.js
 * openacousticdevices.info
 * June 2022
 *****************************************************************************/

/* global Blob */

/* global createAudioMothHeader, writeAudioMothHeader */

/* global AMPLITUDE_THRESHOLD_BUFFER_LENGTH */
/* global PLAYBACK_MODE_SKIP, PLAYBACK_MODE_MUTE */

/* global MIN_SAMPLE_RATE */
/* global INT16_MAX, INT16_MIN */

function createAudioArray (samples, unthresholdedSamples, start, length, sampleRate, mode, playbackBufferLength, volumeModifier, playbackRate) {

    /**
     * Get array of samples like playAudio uses
     * Copy header of original file to get artist information
     * Update file size
     * Update sample rate
     * Create blob
     */

    const targetSampleRate = sampleRate * playbackRate;
    let acceptedSampleRate = targetSampleRate;
    let sampleArrayLength = playbackBufferLength;

    let powMultiplier = 1.0;

    if (playbackRate !== 1.0) {

        let multiplier = 0.0;

        while (acceptedSampleRate < MIN_SAMPLE_RATE) {

            multiplier++;

            acceptedSampleRate = targetSampleRate * Math.pow(2, multiplier);

        }

        powMultiplier = Math.pow(2, multiplier);

        sampleArrayLength *= powMultiplier;

    }

    const sampleArray = new Int16Array(sampleArrayLength);

    let unthresholdedSampleIndex = 0;

    for (let i = 0; i < length; i++) {

        const index = start + i;

        let sample = samples[index] * volumeModifier;

        if (sample > INT16_MAX) sample = INT16_MAX;
        if (sample < INT16_MIN) sample = INT16_MIN;

        // Check if sample is in a thresholded period

        let thresholded = false;

        if (mode === PLAYBACK_MODE_MUTE || mode === PLAYBACK_MODE_SKIP) {

            const bufferIndex = Math.floor(index / AMPLITUDE_THRESHOLD_BUFFER_LENGTH);

            thresholded = !unthresholdedSamples[bufferIndex];

        }

        if (mode === PLAYBACK_MODE_SKIP) {

            if (!thresholded) {

                if (powMultiplier > 1.0) {

                    for (let j = 0; j < powMultiplier; j++) {

                        sampleArray[(unthresholdedSampleIndex * powMultiplier) + j] = sample;

                    }

                } else {

                    sampleArray[unthresholdedSampleIndex] = sample;

                }

                unthresholdedSampleIndex++;

            }

        } else {

            if (powMultiplier > 1.0) {

                for (let j = 0; j < powMultiplier; j++) {

                    sampleArray[(i * powMultiplier) + j] = thresholded ? 0 : sample;

                }

            } else {

                sampleArray[i] = thresholded ? 0 : sample;

            }

        }

    }

    // Rewrite header

    const numberOfSamples = playbackBufferLength * powMultiplier;

    const header = createAudioMothHeader(numberOfSamples, acceptedSampleRate, 'Audio clip exported from the AudioMoth Filter Playground.', 'AudioMoth Filter Playground');

    const headerBuffer = new ArrayBuffer(header.size);

    writeAudioMothHeader(headerBuffer, header);

    return [headerBuffer, sampleArray];

}

function writeFile (audioArray, fileName, callback) {

    const blob = new Blob(audioArray, {type: 'audio/wav'});

    const url = URL.createObjectURL(blob);

    const newFileName = fileName.substring(0, fileName.length - 4) + '_EXPORT.wav';

    const link = document.createElement('a');
    link.download = newFileName;
    link.href = url;
    link.click();
    link.remove();

    callback();

}

function exportAudio (samples, unthresholdedSamples, start, length, sampleRate, mode, playbackBufferLength, fileName, callback) {

    const audioArray = createAudioArray(samples, unthresholdedSamples, start, length, sampleRate, mode, playbackBufferLength, 1.0, 1.0);

    writeFile(audioArray, fileName, callback);

}
