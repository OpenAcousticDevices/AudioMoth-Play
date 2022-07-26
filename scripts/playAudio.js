/****************************************************************************
 * playAudio.js
 * openacousticdevices.info
 * August 2021
 *****************************************************************************/

/* global AMPLITUDE_THRESHOLD_BUFFER_LENGTH */
/* global MIN_SAMPLE_RATE, MAX_SAMPLE_RATE */
/* global PLAYBACK_MODE_ALL, PLAYBACK_MODE_SKIP, PLAYBACK_MODE_MUTE */

let audioContext;
let source;

let startTime = 0.0;

/**
 * Scale a given value between a max and min
 * @param {number} x Value to be scaled
 * @param {number} max Upper end of possible values
 * @param {number} min Lower end of possible values
 * @returns x scaled between min and max
 */
function scaleValue (x, max, min) {

    return (2 * ((x - min) / (max - min))) - 1;

}

/**
 * Create the AudioContext object required for playback
 */
function createAudioContext () {

    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (audioContext) {

        audioContext.close();

    }

    audioContext = new AudioContext();

}

/**
 * Given a set of samples, play from start index for the given length
 * @param {number[]} samples Array of 16-bit samples
 * @param {boolean[]} unthresholdedSamples Whether or not each sample is above the chosen threshold
 * @param {number} start Start index for playback
 * @param {number} length Number of samples which should be played
 * @param {number} sampleRate Sample rate of audio
 * @param {number} playbackRate Speed of playback
 * @param {number} mode One of PLAYBACK_MODE_ALL, PLAYBACK_MODE_SKIP, PLAYBACK_MODE_MUTE
 * @param {number} playbackBufferLength Length of buffer holding samples to be played
 * @param {function} endEvent Callback for when playback ends or is manually stopped
 */
function playAudio (samples, unthresholdedSamples, start, length, sampleRate, playbackRate, mode, playbackBufferLength, volumeModifier, endEvent) {

    startTime = audioContext.currentTime;

    const targetSampleRate = sampleRate * playbackRate;

    let multiplier = 0.0;
    let acceptedSampleRate = targetSampleRate;

    while (acceptedSampleRate < MIN_SAMPLE_RATE || acceptedSampleRate > MAX_SAMPLE_RATE) {

        multiplier += (targetSampleRate < MIN_SAMPLE_RATE) ? 1 : -1;

        acceptedSampleRate = targetSampleRate * Math.pow(2, multiplier);

    }

    const powMultiplier = Math.pow(2, multiplier);
    const positivePowMultiplier = Math.pow(2, Math.abs(multiplier));

    const audioBuffer = audioContext.createBuffer(1, playbackBufferLength * powMultiplier, acceptedSampleRate);

    const nowBuffering = audioBuffer.getChannelData(0);

    let total = 0;

    let unthresholdedSampleIndex = 0;
    let downsampledBufferIndex = 0;

    for (let i = 0; i < length; i++) {

        const index = start + i;

        let sample = samples[index] * volumeModifier;
        sample = Math.min(32767, sample);
        sample = Math.max(-32768, sample);

        // Check if sample is in a thresholded period

        let thresholded = false;

        if (mode === PLAYBACK_MODE_MUTE || mode === PLAYBACK_MODE_SKIP) {

            const bufferIndex = Math.floor(index / AMPLITUDE_THRESHOLD_BUFFER_LENGTH);

            thresholded = !unthresholdedSamples[bufferIndex];

        }

        // Duplicate/average out samples if needed

        if (powMultiplier > 1.0) {

            if (mode === PLAYBACK_MODE_SKIP) {

                if (!thresholded) {

                    for (let j = 0; j < powMultiplier; j++) {

                        nowBuffering[unthresholdedSampleIndex] = scaleValue(sample, -32768, 32767);

                        unthresholdedSampleIndex++;

                    }

                }

            } else {

                for (let j = 0; j < powMultiplier; j++) {

                    nowBuffering[(i * powMultiplier) + j] = thresholded ? 0 : scaleValue(sample, -32768, 32767);

                }

            }

        } else if (powMultiplier < 1.0) {

            if (mode === PLAYBACK_MODE_SKIP) {

                if (!thresholded) {

                    total += scaleValue(sample, -32768, 32767);

                    if (unthresholdedSampleIndex % positivePowMultiplier === 0) {

                        nowBuffering[downsampledBufferIndex] = total / positivePowMultiplier;

                        total = 0;

                        downsampledBufferIndex++;

                    }

                    unthresholdedSampleIndex++;

                }

            } else {

                total += thresholded ? 0 : scaleValue(sample, -32768, 32767);

                if (i % positivePowMultiplier === 0) {

                    nowBuffering[i / positivePowMultiplier] = total / positivePowMultiplier;

                    total = 0;

                }

            }

        } else {

            if (mode === PLAYBACK_MODE_SKIP) {

                if (!thresholded) {

                    nowBuffering[unthresholdedSampleIndex] = scaleValue(sample, -32768, 32767);

                    unthresholdedSampleIndex++;

                }

            } else {

                nowBuffering[i] = thresholded ? 0 : scaleValue(sample, -32768, 32767);

            }

        }

    }

    source = audioContext.createBufferSource();

    source.addEventListener('ended', () => {

        endEvent();

    });

    source.buffer = audioBuffer;

    source.connect(audioContext.destination);

    source.start();

}

/**
 * Stop current playback
 */
function stopAudio () {

    source.stop();

}

/**
 * Get timestamp of current playback
 * @returns Time of current playback in seconds
 */
function getTimestamp () {

    return audioContext.currentTime - startTime;

}
