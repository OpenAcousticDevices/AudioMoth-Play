/****************************************************************************
 * playAudio.js
 * openacousticdevices.info
 * August 2021
 *****************************************************************************/

/* global AMPLITUDE_THRESHOLD_BUFFER_LENGTH */

let audioContext;
let source;

let startTime = 0.0;

// Range of sample rates guaranteed to be supported by browsers

const MIN_SAMPLE_RATE = 8000;
const MAX_SAMPLE_RATE = 96000;

// Modes which dictate how amplitude thresholded periods are handled

const PLAYBACK_MODE_ALL = 0;
const PLAYBACK_MODE_SKIP = 1;
const PLAYBACK_MODE_MUTE = 2;

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
 * @param {number} start Start index for playback
 * @param {number} length Number of samples which should be played
 * @param {number} sampleRate Sample rate of audio
 * @param {function} endEvent Callback for when playback ends or is manually stopped
 */
function playAudio (samples, samplesAboveThreshold, start, length, sampleRate, playbackRate, mode, playbackBufferLength, endEvent) {

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

        // Check if sample is in a thresholded period

        let thresholded = false;

        if (mode === PLAYBACK_MODE_MUTE || mode === PLAYBACK_MODE_SKIP) {

            const bufferIndex = Math.floor(index / AMPLITUDE_THRESHOLD_BUFFER_LENGTH);

            thresholded = !samplesAboveThreshold[bufferIndex];

        }

        // Duplicate/average out samples if needed

        if (powMultiplier > 1.0) {

            if (mode === PLAYBACK_MODE_SKIP) {

                if (!thresholded) {

                    for (let j = 0; j < powMultiplier; j++) {

                        nowBuffering[unthresholdedSampleIndex] = scaleValue(samples[index], -32768, 32767);

                        unthresholdedSampleIndex++;

                    }

                }

            } else {

                for (let j = 0; j < powMultiplier; j++) {

                    nowBuffering[(i * powMultiplier) + j] = thresholded ? 0 : scaleValue(samples[index], -32768, 32767);

                }

            }

        } else if (powMultiplier < 1.0) {

            if (mode === PLAYBACK_MODE_SKIP) {

                if (!thresholded) {

                    total += scaleValue(samples[index], -32768, 32767);

                    if (unthresholdedSampleIndex % positivePowMultiplier === 0) {

                        nowBuffering[downsampledBufferIndex] = total / positivePowMultiplier;

                        total = 0;

                        downsampledBufferIndex++;

                    }

                    unthresholdedSampleIndex++;

                }

            } else {

                total += thresholded ? 0 : scaleValue(samples[index], -32768, 32767);

                if (i % positivePowMultiplier === 0) {

                    nowBuffering[i / positivePowMultiplier] = total / positivePowMultiplier;

                    total = 0;

                }

            }

        } else {

            if (mode === PLAYBACK_MODE_SKIP) {

                if (!thresholded) {

                    nowBuffering[unthresholdedSampleIndex] = scaleValue(samples[index], -32768, 32767);

                    unthresholdedSampleIndex++;

                }

            } else {

                nowBuffering[i] = thresholded ? 0 : scaleValue(samples[index], -32768, 32767);

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
