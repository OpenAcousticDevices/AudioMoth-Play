/****************************************************************************
 * amplitudeThreshold.js
 * openacousticdevices.info
 * July 2021
 *****************************************************************************/

// 32 KB buffer, 16-bit samples

const AMPLITUDE_THRESHOLD_BUFFER_LENGTH = 16384;

/**
 * Apply amplitude trheshold to given samples
 * @param {number[]} samples Samples to be processed
 * @param {number} inputLength Number of samples in samples to process
 * @param {number} threshold Amplitude threshold value
 * @param {number} minTriggerDurationSamples Minimum trigger duration in samples
 * @param {boolean[]} output Whether or not each sample is above the given threshold
 * @returns Samples with amplitude threshold applied
 */
function applyAmplitudeThreshold (samples, inputLength, threshold, minTriggerDurationSamples, output) {

    // Convert minimum trigger duration buffers

    const minTriggerDurationBuffers = Math.ceil(minTriggerDurationSamples / AMPLITUDE_THRESHOLD_BUFFER_LENGTH);

    let triggerDuration = 0;

    let aboveThreshold = false;

    let n = 0;

    let index = 0;

    let thresholdedSampleCount = 0;

    while (index < inputLength) {

        const limit = Math.min(inputLength, index + AMPLITUDE_THRESHOLD_BUFFER_LENGTH);

        while (index < limit) {

            if (Math.abs(samples[index]) > threshold) {

                aboveThreshold = true;

                triggerDuration = minTriggerDurationBuffers;

            }

            index++;

        }

        output[n] = aboveThreshold;

        n++;

        if (aboveThreshold) {

            if (triggerDuration > 1) {

                triggerDuration--;

            } else {

                aboveThreshold = false;

            }

        } else {

            thresholdedSampleCount++;

        }

    }

    thresholdedSampleCount *= AMPLITUDE_THRESHOLD_BUFFER_LENGTH;

    thresholdedSampleCount = Math.min(thresholdedSampleCount, inputLength);

    return thresholdedSampleCount;

}
