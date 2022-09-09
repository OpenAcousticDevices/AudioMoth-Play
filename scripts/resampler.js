/****************************************************************************
 * resampler.js
 * openacousticdevices.info
 * September 2022
 *****************************************************************************/

'use strict';

/* global INT16_MIN, INT16_MAX */

/* Greatest common divisor function */

function greatestCommonDivider (a, b) {

    let c;

    while (a !== 0) {

        c = a;
        a = b % a;
        b = c;

    }

    return b;

}

/* Calculate output length */

function resampleOutputLength (inputLength, originalSampleRate, requestedSampleRate) {

    const gcd = greatestCommonDivider(originalSampleRate, requestedSampleRate);

    const divider = originalSampleRate / gcd;

    const multiplier = requestedSampleRate / gcd;

    return Math.floor(inputLength / divider) * multiplier;

}

/* Resample an input array */

function resample (inputArray, originalSampleRate, outputArray, requestedSampleRate) {

    /* Calculate the downsampling parameters */

    const sampleRateDivider = Math.ceil(originalSampleRate / requestedSampleRate);

    const rawSampleRate = sampleRateDivider * requestedSampleRate;

    const step = originalSampleRate / rawSampleRate;

    /* Calculate the number of samples to read and write */

    const length = resampleOutputLength(inputArray.length, originalSampleRate, requestedSampleRate);

    /* Finish early if no data is to be written */

    if (length === 0) return;

    /* Write the data */

    let count = 0;

    let total = 0;

    let position = 0;

    let inputIndex = 0;

    let outputIndex = 0;

    let currentSample = 0;

    let nextSample = inputArray[inputIndex++];

    while (outputIndex < length) {

        /* Read next sample */

        currentSample = nextSample;

        if (inputIndex < inputArray.length) nextSample = inputArray[inputIndex++];

        /* Interpolate until a new sample is required */

        while (position < 1.0 && outputIndex < length) {

            const interpolatedSample = currentSample + position * (nextSample - currentSample);

            total += interpolatedSample;

            count += 1;

            /* Write a new output sample */

            if (count === sampleRateDivider) {

                let value = total / sampleRateDivider;

                value = Math.sign(value) * Math.round(Math.abs(value));

                value = Math.max(INT16_MIN, Math.min(INT16_MAX, value));

                outputArray[outputIndex++] = value;

                total = 0;

                count = 0;

            }

            position += step;

        }

        position -= 1.0;

    }

}
