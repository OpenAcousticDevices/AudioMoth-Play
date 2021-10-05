/****************************************************************************
 * waveform.js
 * openacousticdevices.info
 * September 2021
 *****************************************************************************/

// Drawing canvas

const wavCanvas = document.getElementById('waveform-canvas');

const WAV_PIXEL_WIDTH = wavCanvas.width;
const WAV_PIXEL_HEIGHT = wavCanvas.height;

/**
 * Draw the waveform plot
 * @param {number[]} data Absolute values of samples to be plotted. Either raw data or grouped into columns.
 * @param {number} startTime Time when render started
 * @param {function} callback Function called on completion
 */
function renderRawWaveform (pointData, startTime, callback) {

    const ctx = wavCanvas.getContext('2d');

    ctx.strokeStyle = '#004d99';
    ctx.lineWidth = 1;

    ctx.beginPath();

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
 * @param {number[]} data Absolute values of samples to be plotted. Either raw data or grouped into columns.
 * @param {number} startTime Time when render started
 * @param {function} callback Function called on completion
 */
function renderWaveform (data, startTime, callback) {

    const ctx = wavCanvas.getContext('2d');

    const id = ctx.getImageData(0, 0, WAV_PIXEL_WIDTH, WAV_PIXEL_HEIGHT);

    const pixels = id.data;

    for (let i = 0; i < WAV_PIXEL_WIDTH; i++) {

        const y0 = data[2 * i];
        const y1 = data[(2 * i) + 1];

        const max = (y0 > y1) ? y0 : y1;
        const min = (y0 > y1) ? y1 : y0;

        for (let j = min; j <= max; j++) {

            const index = j * (WAV_PIXEL_WIDTH * 4) + i * 4;

            pixels[index] = 0;
            pixels[index + 1] = 77;
            pixels[index + 2] = 153;
            pixels[index + 3] = 255;

        }

    }

    ctx.putImageData(id, 0, 0);

    const endTime = new Date();
    const diff = endTime - startTime;

    callback(diff);

}

/**
 * Draw waveform array, grouping samples into columns if more than MAX_RAW_PLOT_LENGTH are to be rendered
 * @param {number[]} samples Array of samples to be rendered
 * @param {number} offset Offset from start of sample array to start rendering
 * @param {number} length Number of samples to render
 * @param {number} yZoom Amount to zoom in plot on y axis
 * @param {function} callback Function called on completion
 */
function drawWaveform (samples, offset, length, yZoom, callback) {

    const halfHeight = WAV_PIXEL_HEIGHT / 2;

    let multiplier = Math.pow(32767, -1);

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

        renderRawWaveform(pointData, startTime, callback);

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

        renderWaveform(pointData, startTime, callback);

    }

}
