/****************************************************************************
 * spectrogram.js
 * openacousticdevices.info
 * June 2021
 *****************************************************************************/

/* global STFT */

// Canvas the spectrogram will be drawn to

const specCanvas = document.getElementById('spectrogram-canvas');

const PIXEL_WIDTH = specCanvas.width;
const PIXEL_HEIGHT = specCanvas.height;

const stft = new STFT(PIXEL_WIDTH, PIXEL_HEIGHT);

// 2D array which will hold spectrogram frames

const spectrogram = new Array(PIXEL_WIDTH * PIXEL_HEIGHT);

// 255 colours from Jet
const rgbColours = [[0, 0, 131], [0, 2, 132], [0, 4, 133], [0, 6, 135], [0, 8, 136], [0, 9, 137], [0, 11, 138], [0, 13, 140], [0, 15, 141], [0, 17, 142], [0, 19, 143], [0, 21, 144], [0, 23, 146], [0, 24, 147], [0, 26, 148], [0, 28, 149], [0, 30, 151], [0, 32, 152], [0, 34, 153], [0, 36, 154], [0, 38, 155], [0, 39, 157], [0, 41, 158], [0, 43, 159], [0, 45, 160], [0, 47, 161], [0, 49, 163], [0, 51, 164], [0, 53, 165], [0, 54, 166], [0, 56, 168], [0, 58, 169], [0, 60, 170], [0, 63, 171], [0, 66, 173], [0, 69, 174], [0, 72, 175], [0, 75, 177], [0, 79, 178], [1, 82, 179], [1, 85, 181], [1, 88, 182], [1, 91, 183], [1, 94, 185], [1, 97, 186], [1, 100, 188], [1, 103, 189], [1, 106, 190], [1, 110, 192], [1, 113, 193], [1, 116, 194], [2, 119, 196], [2, 122, 197], [2, 125, 198], [2, 128, 200], [2, 131, 201], [2, 134, 202], [2, 137, 204], [2, 140, 205], [2, 144, 206], [2, 147, 208], [2, 150, 209], [2, 153, 210], [2, 156, 212], [3, 159, 213], [3, 162, 215], [3, 165, 216], [3, 168, 217], [3, 171, 219], [3, 175, 220], [3, 178, 221], [3, 181, 223], [3, 184, 224], [3, 187, 225], [3, 190, 227], [3, 193, 228], [3, 196, 229], [4, 199, 231], [4, 202, 232], [4, 205, 233], [4, 209, 235], [4, 212, 236], [4, 215, 237], [4, 218, 239], [4, 221, 240], [4, 224, 242], [4, 227, 243], [4, 230, 244], [4, 233, 246], [5, 236, 247], [5, 240, 248], [5, 243, 250], [5, 246, 251], [5, 249, 252], [5, 252, 254], [5, 255, 255], [9, 255, 251], [13, 255, 247], [17, 255, 243], [21, 255, 239], [25, 255, 235], [28, 255, 231], [32, 255, 227], [36, 255, 223], [40, 255, 219], [44, 255, 215], [48, 255, 211], [52, 255, 207], [56, 255, 203], [60, 255, 199], [64, 255, 195], [68, 255, 191], [71, 255, 187], [75, 255, 183], [79, 255, 179], [83, 255, 175], [87, 255, 171], [91, 255, 167], [95, 255, 163], [99, 255, 159], [103, 255, 155], [107, 255, 151], [110, 255, 147], [114, 255, 143], [118, 255, 139], [122, 255, 135], [126, 255, 131], [130, 255, 128], [134, 255, 124], [138, 255, 120], [142, 255, 116], [146, 255, 112], [150, 255, 108], [153, 255, 104], [157, 255, 100], [161, 255, 96], [165, 255, 92], [169, 255, 88], [173, 255, 84], [177, 255, 80], [181, 255, 76], [185, 255, 72], [189, 255, 68], [193, 255, 64], [196, 255, 60], [200, 255, 56], [204, 255, 52], [208, 255, 48], [212, 255, 44], [216, 255, 40], [220, 255, 36], [224, 255, 32], [228, 255, 28], [232, 255, 24], [235, 255, 20], [239, 255, 16], [243, 255, 12], [247, 255, 8], [251, 255, 4], [255, 255, 0], [255, 251, 0], [255, 247, 0], [255, 243, 0], [255, 239, 0], [255, 235, 0], [255, 231, 0], [254, 227, 0], [254, 223, 0], [254, 219, 0], [254, 215, 0], [254, 210, 0], [254, 206, 0], [254, 202, 0], [254, 198, 0], [254, 194, 0], [254, 190, 0], [254, 186, 0], [254, 182, 0], [253, 178, 0], [253, 174, 0], [253, 170, 0], [253, 166, 0], [253, 162, 0], [253, 158, 0], [253, 154, 0], [253, 150, 0], [253, 146, 0], [253, 142, 0], [253, 138, 0], [253, 134, 0], [253, 130, 0], [252, 125, 0], [252, 121, 0], [252, 117, 0], [252, 113, 0], [252, 109, 0], [252, 105, 0], [252, 101, 0], [252, 97, 0], [252, 93, 0], [252, 89, 0], [252, 85, 0], [252, 81, 0], [252, 77, 0], [251, 73, 0], [251, 69, 0], [251, 65, 0], [251, 61, 0], [251, 57, 0], [251, 53, 0], [251, 49, 0], [251, 45, 0], [251, 40, 0], [251, 36, 0], [251, 32, 0], [251, 28, 0], [250, 24, 0], [250, 20, 0], [250, 16, 0], [250, 12, 0], [250, 8, 0], [250, 4, 0], [250, 0, 0], [246, 0, 0], [242, 0, 0], [239, 0, 0], [235, 0, 0], [231, 0, 0], [227, 0, 0], [223, 0, 0], [220, 0, 0], [216, 0, 0], [212, 0, 0], [208, 0, 0], [204, 0, 0], [200, 0, 0], [197, 0, 0], [193, 0, 0], [189, 0, 0], [185, 0, 0], [181, 0, 0], [178, 0, 0], [174, 0, 0], [170, 0, 0], [166, 0, 0], [162, 0, 0], [159, 0, 0], [155, 0, 0], [151, 0, 0], [147, 0, 0], [143, 0, 0], [139, 0, 0], [136, 0, 0], [132, 0, 0], [128, 0, 0], [128, 0, 0]];

/**
 * Fast approximation of log2()
 * @param {number} n Value to have log2() applied to
 * @returns log2(n)
 */
function fastLog2 (n) {

    const a = new ArrayBuffer(4);
    const i = new Int32Array(a);
    const f = new Float32Array(a);

    f[0] = n;
    const t = i[0] * 1.1920928955078125e-7;
    return t - 126.94269504;

}

/**
 * Create spectrogram
 * @param {number[]} sampleArray Samples to be processed
 * @param {number} sampleArrayLength The number of valid samples in the array
 * @param {number} offset Number of samples in array to start processing
 * @param {number} length Number of samples after offset to stop
 * @returns Object containing the spectrogram and its minimum and maximum values for use in colouring
 */
function calculateSpectrogramFrames (sampleArray, sampleArrayLength, offset, length) {

    stft.calculate(sampleArray, sampleArrayLength, offset, length, spectrogram);

    // Calculate the max and min values in spectrogram so the colour map can be applied during rendering

    let max = 0;
    let min = 1000000;

    for (let i = 0; i < PIXEL_WIDTH; i += 1) {

        for (let k = 0; k < PIXEL_HEIGHT; k += 1) {

            const index = i * PIXEL_HEIGHT + k;

            if (spectrogram[index] === 0.0) {

                continue;

            }

            max = Math.max(max, spectrogram[index]);
            min = Math.min(min, spectrogram[index]);

        }

    }

    // Apply log2() to min and max as it will be applied to scale spectrogram values later

    min = fastLog2(min);
    max = fastLog2(max);

    return {
        frames: spectrogram,
        min: min,
        max: max
    };

}

/**
 * Render spectrogram to canvas
 * @param {number[][]} spectrogram 2D array created by calculateSpectrogramFrames()
 * @param {number} min log2(Minimum value in spectrogram)
 * @param {number} max log2(Maximum value in spectrogram)
 * @param {function} callback Function to be called on completion
 */
function drawSpectrogram (spectrogram, min, max, callback) {

    const startTime = new Date();

    const ctx = specCanvas.getContext('2d');

    const id = ctx.getImageData(0, 0, PIXEL_WIDTH, PIXEL_HEIGHT);

    const pixels = id.data;

    for (let i = 0; i < PIXEL_HEIGHT; i += 1) {

        for (let j = 0; j < PIXEL_WIDTH; j += 1) {

            const index = i * PIXEL_WIDTH + j;

            let colour = [255, 255, 255];

            if (spectrogram[index] !== 0.0) {

                let colourIndex = Math.round(255 * (fastLog2(spectrogram[index]) - min) / (max - min));

                colourIndex = Math.max(colourIndex, 0);
                colourIndex = Math.min(colourIndex, 255);

                colour = rgbColours[colourIndex];

            }

            const offset = 4 * index;

            pixels[offset] = colour[0];
            pixels[offset + 1] = colour[1];
            pixels[offset + 2] = colour[2];
            pixels[offset + 3] = 255;

        }

    }

    ctx.putImageData(id, 0, 0);

    const endTime = new Date();
    const diff = endTime - startTime;

    callback(diff);

}
