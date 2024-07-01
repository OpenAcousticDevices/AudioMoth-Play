/****************************************************************************
 * waveform.js
 * openacousticdevices.info
 * September 2021
 *****************************************************************************/

/* global INT16_MAX */

// Drawing canvas

const wavCanvas = document.getElementById('waveform-canvas');

const WAVEFORM_COLOURS_AGBR = [[0, 77, 153, 255], [0, 0, 0, 255], [0, 0, 0, 255]];
const WAVEFORM_COLOURS_HEX = ['#004d99', '#000000', '#000000'];

/**
 * Draw the waveform plot
 * @param {canvas} canvas Canvas to be drawn to
 * @param {number[]} data Absolute values of samples to be plotted. Either raw data or grouped into columns.
 * @param {number} colourMapIndex Index of colour map
 * @param {number} startTime Time when render started
 * @param {function} callback Function called on completion
 */
function renderRawWaveform (canvas, pointData, colourMapIndex, startTime, callback) {

    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = WAVEFORM_COLOURS_HEX[colourMapIndex];
    ctx.lineWidth = 1;

    ctx.beginPath();

    const WAV_PIXEL_HEIGHT = canvas.height;

    ctx.moveTo(0, WAV_PIXEL_HEIGHT / 2);

    let prevX = -1;
    let prevY = -1;

    for (let i = 0; i < pointData.length; i += 2) {

        if (!(prevX === pointData[i] && prevY === pointData[i + 1])) {

            ctx.lineTo(pointData[i], pointData[i + 1]);

        }

        prevX = pointData[i];
        prevY = pointData[i + 1];

    }

    ctx.stroke();

    const endTime = new Date();
    const diff = endTime - startTime;

    callback(diff);

}

/**
 * Draw the waveform plot
 * @param {canvas} canvas Canvas to be drawn to
 * @param {number[]} data Absolute values of samples to be plotted
 * @param {number} colourMapIndex Index of colour map
 * @param {number} startTime Time when render started
 * @param {function} callback Function called on completion
 */
function renderWaveform (canvas, data, colourMapIndex, startTime, callback) {

    const ctx = canvas.getContext('2d', {willReadFrequently: true});

    const WAV_PIXEL_WIDTH = canvas.width;
    const WAV_PIXEL_HEIGHT = canvas.height;

    const id = ctx.getImageData(0, 0, WAV_PIXEL_WIDTH, WAV_PIXEL_HEIGHT);

    const pixels = id.data;

    for (let i = 0; i < WAV_PIXEL_WIDTH; i++) {

        const y0 = data[2 * i];
        const y1 = data[(2 * i) + 1];

        const max = (y0 > y1) ? y0 : y1;
        const min = (y0 > y1) ? y1 : y0;

        for (let j = min; j <= max; j++) {

            const index = j * (WAV_PIXEL_WIDTH * 4) + i * 4;

            const colour = WAVEFORM_COLOURS_AGBR[colourMapIndex];

            pixels[index] = colour[0];
            pixels[index + 1] = colour[1];
            pixels[index + 2] = colour[2];
            pixels[index + 3] = colour[3];

        }

    }

    ctx.putImageData(id, 0, 0);

    const endTime = new Date();
    const diff = endTime - startTime;

    if (callback) {

        callback(diff);

    }

}

/**
 * Draw waveform array, grouping samples into columns if more than MAX_RAW_PLOT_LENGTH are to be rendered
 * @param {number[]} samples Array of samples to be rendered
 * @param {number} offset Offset from start of sample array to start rendering
 * @param {number} length Number of samples to render
 * @param {number} yZoom Amount to zoom in plot on y axis
 * @param {number} colourMapIndex Index of colour map
 * @param {function} callback Function called on completion
 */
function drawWaveform (samples, offset, length, yZoom, colourMapIndex, callback) {

    const WAV_PIXEL_WIDTH = wavCanvas.width;
    const WAV_PIXEL_HEIGHT = wavCanvas.height;

    const halfHeight = WAV_PIXEL_HEIGHT / 2;

    let multiplier = Math.pow(INT16_MAX, -1);

    // Scale in y axis to apply zoom

    multiplier *= yZoom;

    // Scale to size of canvas

    multiplier *= halfHeight;

    // Flip y axis

    multiplier *= -1;

    const samplesPerPixel = length / WAV_PIXEL_WIDTH;

    const startTime = new Date();

    // If one or fewer samples will be drawn per pixel

    if (samplesPerPixel <= 1) {

        console.log('Plotting raw sample data on waveform');

        const pointData = new Array((length * 2) + 2).fill(0);

        const width = WAV_PIXEL_WIDTH / length;

        // Just draw lines between points

        for (let i = 0; i < length + 1; i++) {

            // Evenly distribute points along canvas

            const x = width * i;

            // Get the sample

            let y = samples[offset + i];

            // Scale data from -32767 to 32767, to -1 and 1, scale on y axis and then scale to canvas height

            y *= multiplier;

            // Calculate the actual pixel height

            y += halfHeight;

            // Add to data for rendering

            pointData[2 * i] = x;
            pointData[(2 * i) + 1] = y;

        }

        renderRawWaveform(wavCanvas, pointData, colourMapIndex, startTime, callback);

    } else {

        console.log('Plotting max and min sample per pixel column on waveform');

        // Array to store the max and min y for each x

        const pointData = new Array(2 * WAV_PIXEL_WIDTH).fill(0);

        for (let i = 0; i < WAV_PIXEL_WIDTH; i++) {

            let max = 99999;
            let min = 99999;

            // Take the max and min of the samples within a pixel column, plus 1 sample either side

            for (let j = -1; j < samplesPerPixel + 1; j++) {

                let index = Math.round(offset + (i * samplesPerPixel) + j);

                // Handle start and end of samples

                index = (index < 0) ? 0 : index;
                index = (index >= samples.length) ? samples.length - 1 : index;

                const sample = samples[index];

                max = (sample > max || max === 99999) ? sample : max;
                min = (sample < min || min === 99999) ? sample : min;

            }

            // Scale the heights between the top and bottom of the canvas

            pointData[2 * i] = Math.round(max * multiplier) + halfHeight;
            pointData[(2 * i) + 1] = Math.round(min * multiplier) + halfHeight;

        }

        renderWaveform(wavCanvas, pointData, colourMapIndex, startTime, callback);

    }

}
