/****************************************************************************
 * goertzelFilter.js
 * openacousticdevices.info
 * October 2021
 *****************************************************************************/

// Number of samples compared to threshold before deciding if buffer is above or below the threshold

const GOERTZEL_THRESHOLD_BUFFER_LENGTH = 16384;

// Drawing canvas

const goertzelPlotCanvas = document.getElementById('goertzel-canvas');

const GOERTZEL_PIXEL_WIDTH = goertzelPlotCanvas.width;
const GOERTZEL_PIXEL_HEIGHT = goertzelPlotCanvas.height;

const TWO_PI = 2.0 * Math.PI;

let hammingValues;
let hammingMean;

/**
 * Generate values to be used for Hamming filter
 * @param {number} N Filter length
 */
function generateHammingValues (N) {

    console.log('Generating Hamming filter values');

    hammingValues = new Array(N);

    let hammingTotal = 0;

    for (let i = 0; i < N; i++) {

        hammingValues[i] = 0.54 - 0.46 * Math.cos(TWO_PI * i / (N - 1));
        hammingTotal += hammingValues[i];

    }

    hammingMean = hammingTotal / N;

}

/**
 * Apply a Goertzel filter to a given set of samples
 * @param {number[]} samples Samples
 * @param {number} sampleRate Sample rate of the sample set
 * @param {number} freq Centre frequency
 * @param {number} N Filter length
 * @param {number[]} output Goertzel responses
 */
function applyGoertzelFilter (samples, sampleRate, freq, N, output) {

    console.log('Applying Goertzel filter at ' + freq + '.');

    // Generate Hamming filter if first load

    if (!hammingValues) {

        generateHammingValues(N);

    }

    // Apply filter

    const c = 2.0 * Math.cos(2.0 * Math.PI * freq / sampleRate);

    const maximum = N * 32768.0 * hammingMean / 2.0;
    const scaler = Math.pow(maximum, -1);

    let i = 0;
    let index = 0;

    let d1 = 0.0;
    let d2 = 0.0;

    let y;

    while (i < samples.length) {

        y = hammingValues[i % N] * samples[i] + c * d1 - d2;
        d2 = d1;
        d1 = y;

        if (i % N === N - 1) {

            const magnitude = (d1 * d1) + (d2 * d2) - c * d1 * d2;
            const goertzelValue = magnitude < 0 ? 0 : Math.sqrt(magnitude);

            output[index] = Math.min(goertzelValue * scaler, 1.0);

            d1 = 0.0;
            d2 = 0.0;

            index++;

        }

        i++;

    }

}

/**
 * Draw Goertzel plot
 * @param {number[]} pointData Raw Goertzel values as pixel heights
 * @param {function} callback Function to be called on completion
 */
function renderRawGoertzelPlot (pointData, callback) {

    const ctx = goertzelPlotCanvas.getContext('2d');

    ctx.strokeStyle = '#004d99';
    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(0, GOERTZEL_PIXEL_HEIGHT);

    let prevX = 0;
    let prevY = GOERTZEL_PIXEL_HEIGHT;

    for (let i = 0; i < pointData.length; i += 2) {

        if (!(prevX === pointData[i] && prevY === pointData[i + 1])) {

            ctx.lineTo(pointData[i], prevY);
            ctx.lineTo(pointData[i], pointData[i + 1]);

        }

        prevX = pointData[i];
        prevY = pointData[i + 1];

    }

    ctx.stroke();

    callback();

}

/**
 * Draw Goertzel plot using the maximum and minimmum value of each x co-ordinate on the plot
 * @param {number[]} pointData Goertzel values as pixel heights grouped into columns
 * @param {function} callback Function to be called on completion
 */
function renderGoertzelPlot (pointData, callback) {

    const ctx = goertzelPlotCanvas.getContext('2d');

    const id = ctx.getImageData(0, 0, GOERTZEL_PIXEL_WIDTH, GOERTZEL_PIXEL_HEIGHT);

    const pixels = id.data;

    for (let i = 0; i < GOERTZEL_PIXEL_WIDTH; i++) {

        const y0 = pointData[2 * i];
        const y1 = pointData[(2 * i) + 1];

        const max = (y0 > y1) ? y0 : y1;
        const min = (y0 > y1) ? y1 : y0;

        for (let j = min; j <= max; j++) {

            const index = j * (GOERTZEL_PIXEL_WIDTH * 4) + i * 4;

            pixels[index] = 0;
            pixels[index + 1] = 77;
            pixels[index + 2] = 153;
            pixels[index + 3] = 255;

        }

    }

    ctx.putImageData(id, 0, 0);

    callback();

}

/**
 * Draw plot of the Goertzel response
 * @param {number[]} goertzelValues Response values produced by applyGoertzelFilter()
 * @param {number[]} windowLength Window length of filter
 * @param {number} offset Offset through the samples being drawn
 * @param {number} length Number of samples being drawn
 * @param {function} callback Completion function
 */
function drawGoertzelPlot (goertzelValues, windowLength, offset, length, yZoom, callback) {

    // Convert offset and length of drawing location from samples to Goertzel responses

    const windowedLength = Math.floor(length / windowLength);
    const windowedOffset = Math.floor(offset / windowLength);

    const valuesPerPixel = windowedLength / GOERTZEL_PIXEL_WIDTH;

    if (valuesPerPixel <= 1) {

        console.log('Plotting raw Goertzel data on plot');

        const pointData = new Array((windowedLength * 2) + 2).fill(0);

        const width = GOERTZEL_PIXEL_WIDTH / windowedLength;

        // Just draw lines between points

        for (let i = 0; i < windowedLength + 1; i++) {

            // Evenly distribute points along canvas

            const x = width * i;

            // Get the sample

            const y = GOERTZEL_PIXEL_HEIGHT - (goertzelValues[windowedOffset + i] * GOERTZEL_PIXEL_HEIGHT * yZoom);

            // Add to data for rendering

            pointData[2 * i] = x;
            pointData[(2 * i) + 1] = y;

        }

        renderRawGoertzelPlot(pointData, callback);

    } else {

        console.log('Plotting max and min sample per pixel column on Goertzel plot');

        const pointData = new Array(2 * GOERTZEL_PIXEL_WIDTH).fill(0);

        for (let i = 0; i < GOERTZEL_PIXEL_WIDTH; i++) {

            let max = 99999;
            let min = 99999;

            // Take the max and min of the Goertzel values within a pixel column, plus 1 value either side

            for (let j = -1; j < valuesPerPixel + 1; j++) {

                let index = Math.round(windowedOffset + (i * valuesPerPixel) + j);

                // Handle start and end

                index = (index < 0) ? 0 : index;
                index = (index >= goertzelValues.length) ? goertzelValues.length - 1 : index;

                const y = GOERTZEL_PIXEL_HEIGHT - (goertzelValues[index] * GOERTZEL_PIXEL_HEIGHT * yZoom);

                max = (y > max || max === 99999) ? y : max;
                min = (y < min || min === 99999) ? y : min;

            }

            // Scale the heights between the top and bottom of the canvas

            pointData[2 * i] = Math.round(max);
            pointData[(2 * i) + 1] = Math.round(min);

        }

        renderGoertzelPlot(pointData, callback);

    }

}

/**
 * Apply threshold to a set of Goertzel values
 * @param {number[]} goertzelValues Response values produced by applyGoertzelFilter()
 * @param {number} threshold Threshold values should be compared to
 * @param {number} windowLength Window length of filter
 * @param {number} minTriggerDurationSamples Minimum length of a triggered period in samples
 * @param {boolean[]} output Whether or not each sample is above thye threshold
 * @returns The number of values above the threshold
 */
function applyGoertzelThreshold (goertzelValues, threshold, windowLength, minTriggerDurationSamples, output) {

    // Convert minimum trigger duration buffers

    const minTriggerDurationBuffers = Math.ceil(minTriggerDurationSamples / GOERTZEL_THRESHOLD_BUFFER_LENGTH);

    let triggerDuration = 0;

    let aboveThreshold = false;

    let n = 0;

    let index = 0;

    let thresholdedValueCount = 0;

    const goertzelBufferLength = GOERTZEL_THRESHOLD_BUFFER_LENGTH / windowLength;

    while (index < goertzelValues.length) {

        const limit = Math.min(goertzelValues.length, index + goertzelBufferLength);

        while (index < limit) {

            if (goertzelValues[index] > threshold) {

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

            thresholdedValueCount++;

        }

    }

    thresholdedValueCount *= GOERTZEL_THRESHOLD_BUFFER_LENGTH;

    thresholdedValueCount = Math.min(thresholdedValueCount, goertzelValues.length * windowLength);

    return thresholdedValueCount;

}
