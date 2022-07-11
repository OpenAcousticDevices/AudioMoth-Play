/****************************************************************************
 * index.js
 * openacousticdevices.info
 * June 2021
 *****************************************************************************/

/* global calculateSpectrogramFrames, drawSpectrogram, drawWaveform, readWav, readWavContents */
/* global Slider */
/* global applyLowPassFilter, applyHighPassFilter, applyBandPassFilter, FILTER_NONE, FILTER_LOW, FILTER_BAND, FILTER_HIGH, applyAmplitudeThreshold */
/* global playAudio, stopAudio, getTimestamp, PLAYBACK_MODE_SKIP, PLAYBACK_MODE_ALL, AMPLITUDE_THRESHOLD_BUFFER_LENGTH, createAudioContext */
/* global XMLHttpRequest */
/* global applyGoertzelFilter, drawGoertzelPlot, applyGoertzelThreshold, GOERTZEL_THRESHOLD_BUFFER_LENGTH, generateHammingValues */

/* global prepareUI, sampleRateChange */
/* global getPassFiltersObserved, getCentreObserved */
/* global getFilterRadioValue, updateThresholdTypeUI, updateThresholdUI, updateFilterLabel, getFilterType */
/* global getThresholdTypeIndex, THRESHOLD_TYPE_NONE, THRESHOLD_TYPE_AMPLITUDE, THRESHOLD_TYPE_GOERTZEL, getFrequencyTriggerFilterFreq, getFrequencyTriggerWindowLength, updateFilterUI, getFrequencyTrigger */
/* global thresholdScaleIndex, THRESHOLD_SCALE_PERCENTAGE, THRESHOLD_SCALE_16BIT, THRESHOLD_SCALE_DECIBEL */
/* global thresholdTypeLabel, thresholdTypeRadioButtons, lowPassFilterSlider, highPassFilterSlider, bandPassFilterSlider, amplitudeThresholdSlider, amplitudeThresholdDurationRadioButtons, goertzelFilterCentreSlider, goertzelFilterWindowRadioButtons, goertzelDurationRadioButtons, goertzelThresholdSlider */
/* global getMinimumTriggerDurationAmp, getMinimumTriggerDurationGoertzel, getFilterSliderStep, setBandPass, setLowPassSliderValue, setHighPassSliderValue, roundToSliderStep, setFrequencyTriggerFilterFreq, getMinimumAmplitudeThresholdDuration, getAmplitudeThresholdValues, getFrequencyTriggerValues, setAmplitudeThresholdScaleIndex */
/* global prevThresholdScaleIndex, resetElements, disableFilterUI, enableFilterUI */

/* global enableSlider, disableSlider */
/* global setCentreObserved, setPassFiltersObserved */

/* global exportPNG, exportPDF, exportAudio */

/* global enableSampleRateControl, disableSampleRateControl, updateSampleRateUI, getSampleRateSelection, addSampleRateUIListeners */

/* global downsample */

// Use these values to fill in the axis labels before samples have been loaded

const FILLER_SAMPLE_RATE = 384000;
const FILLER_SAMPLE_COUNT = FILLER_SAMPLE_RATE * 60;

// Error display elements

const errorSpan = document.getElementById('error-span');
const fileSelectionTitleSpan = document.getElementById('file-selection-title-span');
const browserErrorSpans = document.getElementById('browser-error-spans');
const ERROR_DISPLAY_TIME = 3000;

// File selection elements

const fileSelectionTitleDiv = document.getElementById('file-selection-title-div');
const fileButton = document.getElementById('file-button');
const disabledFileButton = document.getElementById('disabled-file-button');
const fileSpan = document.getElementById('file-span');
const trimmedSpan = document.getElementById('trimmed-span');
const loadingSpan = document.getElementById('loading-span');

// Example file variables

const exampleLinks = [document.getElementById('example-link1'), document.getElementById('example-link2'), document.getElementById('example-link3')];
const examplePaths = ['./assets/BAT.WAV', './assets/SWEEP.WAV', './assets/METRONOME.WAV'];
const exampleNames = ['Bat', 'Frequency Sweep', 'Metronome'];
const exampleResultObjects = {};

// Plot navigation buttons

const homeButton = document.getElementById('home-button');

const zoomInButton = document.getElementById('zoom-in-button');
const zoomOutButton = document.getElementById('zoom-out-button');

const panLeftButton = document.getElementById('pan-left-button');
const panRightButton = document.getElementById('pan-right-button');

// Minimum amount of time which can be viewed on the plot

const MIN_TIME_VIEW = 0.01;

// Minimum amount of time which can be viewed, in samples using the current sample rate

let minDisplayLength = FILLER_SAMPLE_COUNT;

// Multiplier for zooming in and out. Zoom out = current number of displayed samples * ZOOM_MULTIPLIER

const ZOOM_MULTIPLIER = 2;

// Current number of samples displayed on screen

let displayLength = FILLER_SAMPLE_COUNT;

// Offset within the sample set for displayed samples

let offset = 0;

// Zoom drag variables

let isDragging = false;
let dragStartX = 0;

// Waveform y axis navigation buttons

const waveformHomeButton = document.getElementById('waveform-home-button');
const waveformZoomInButton = document.getElementById('waveform-zoom-in-button');
const waveformZoomOutButton = document.getElementById('waveform-zoom-out-button');

// Vertical navigation variable

let waveformZoomYIndex = 0;
let goertzelZoomYIndex = 0;

const MAX_ZOOM_Y_INDEX = 8;

// Amplitude threshold scale selection

const amplitudeThresholdScaleSelect = document.getElementById('amplitude-threshold-scale-select');

// Canvases

const spectrogramPlaybackCanvas = document.getElementById('spectrogram-playback-canvas'); // Canvas layer where playback progress
const spectrogramDragCanvas = document.getElementById('spectrogram-drag-canvas'); // Canvas layer where zoom overlay is drawn
const spectrogramGoertzelCanvas = document.getElementById('spectrogram-goertzel-canvas'); // Canvas layer where Goertzel filter is drawn
const spectrogramGoertzelLineSVG = document.getElementById('spectrogram-goertzel-line-svg'); // SVG layer where Goertzel filter centre is drawn
const spectrogramThresholdCanvas = document.getElementById('spectrogram-threshold-canvas'); // Canvas layer where amplitude thresholded periods are drawn
const spectrogramCanvas = document.getElementById('spectrogram-canvas'); // Canvas layer where spectrogram is drawn
const spectrogramLoadingSVG = document.getElementById('spectrogram-loading-svg');
const spectrogramBorderCanvas = document.getElementById('spectrogram-border-canvas');

const waveformHolder = document.getElementById('waveform-holder');
const waveformPlaybackCanvas = document.getElementById('waveform-playback-canvas'); // Canvas layer where playback progress
const waveformDragCanvas = document.getElementById('waveform-drag-canvas'); // Canvas layer where zoom overlay is drawn
const waveformThresholdCanvas = document.getElementById('waveform-threshold-canvas'); // Canvas layer where amplitude thresholded periods are drawn
const waveformThresholdLineSVG = document.getElementById('waveform-threshold-line-svg'); // SVG layer where amplitude threshold value lines are drawn
const waveformCanvas = document.getElementById('waveform-canvas'); // Canvas layer where waveform is drawn
const waveformLoadingSVG = document.getElementById('waveform-loading-svg');
const waveformBorderCanvas = document.getElementById('waveform-border-canvas');

const goertzelCanvasHolder = document.getElementById('goertzel-canvas-holder');
const goertzelPlaybackCanvas = document.getElementById('goertzel-playback-canvas'); // Canvas layer where playback progress
const goertzelDragCanvas = document.getElementById('goertzel-drag-canvas'); // Canvas layer where zoom overlay is drawn
const goertzelThresholdCanvas = document.getElementById('goertzel-threshold-canvas'); // Canvas layer where Goertzel thresholded periods are drawn
const goertzelThresholdLineSVG = document.getElementById('goertzel-threshold-line-svg'); // SVG layer where Goertzel thresholded periods are drawn
const goertzelCanvas = document.getElementById('goertzel-canvas'); // Canvas layer where Goertzel response is drawn
const goertzelBorderCanvas = document.getElementById('goertzel-border-canvas');

const timeLabelSVG = document.getElementById('time-axis-label-svg');
const timeAxisHeadingSVG = document.getElementById('time-axis-heading-svg');

// Y axis label canvases

const spectrogramLabelSVG = document.getElementById('spectrogram-label-svg');
const waveformLabelSVG = document.getElementById('waveform-label-svg');
const goertzelLabelSVG = document.getElementById('goertzel-label-svg');

// File variables

let currentHeader;
let fileHandler;
let unfilteredSamples;
let filteredSamples;
let sampleCount = 0;
let trueSampleCount = 0;
let sampleRate, trueSampleRate;
let processedSpectrumFrames;
let spectrumMin = 0;
let spectrumMax = 0;
let firstFile = true;

let downsampledUnfilteredSamples;

// Drawing/processing flag

let drawing = false;

// Array of Goertzel responses

let goertzelValues = [];

// Boolean array equal length to sample count. Is sample over threshold

let samplesAboveThreshold;
let samplesAboveGoertzelThreshold;
let thresholdedValueCount = 0;

// Panel which states how much size reduction the amplitude threshold settings chosen will do

const sizeInformationPanel = document.getElementById('size-information-panel');

// Other UI

const resetButton = document.getElementById('reset-button');
const exportButton = document.getElementById('export-button');

// Audio playback controls

const playButton = document.getElementById('play-button');
const playIcon = document.getElementById('play-icon');
const stopIcon = document.getElementById('stop-icon');

const playbackSpeedDiv = document.getElementById('playback-speed-div');
const playbackSpeedSlider = new Slider('#playback-speed-slider', {
    ticks_labels: ['x1/16', 'x1/8', 'x1/4', 'x1/2', 'x1', 'x2'],
    ticks: [0, 1, 2, 3, 4, 5],
    value: 4
});
const playbackRates = [0.0625, 0.125, 0.25, 0.5, 1.0, 2.0];

const playbackModeSelect = document.getElementById('playback-mode-select');
const playbackModeOptionAll = document.getElementById('playback-mode-option-all');
const playbackModeOptionMute = document.getElementById('playback-mode-option-mute');
const playbackModeOptionSkip = document.getElementById('playback-mode-option-skip');

// Whether or not audio is currently playing

let playing = false;

// Whether or not playback was stopped but a button press or the audio finishing

let manuallyStopped = false;

// Time taken for initial render, used to work out if future renders should disable the UI

let initialRenderCompletionTime = 0;

// If task (rendering/playback) is longer than this, disable buttons whilst playing

const DISABLE_BUTTON_BUSY_LENGTH = 0.5;

// Timeout object which controls playback tracker animation frames

let animationTimer;

// List of coordinates used when playback mode skips thresholded samples

let skippingXCoords = [];

// Export image UI

const exportModalButton = document.getElementById('export-modal-button');
const exportCloseButton = document.getElementById('export-close-button');

const exportPNGButton = document.getElementById('export-png-button');
const exportPDFButton = document.getElementById('export-pdf-button');
const exportBothButton = document.getElementById('export-both-button');

// Export audio button

const exportAudioButton = document.getElementById('export-audio-button');

/**
 * Update UI based on which threshold type is selected
 */
function updateThresholdTypePlaybackUI () {

    updateThresholdTypeUI();

    const thresholdTypeIndex = getThresholdTypeIndex();

    if (sampleCount !== 0 && !drawing && !playing) {

        if (thresholdTypeIndex === THRESHOLD_TYPE_AMPLITUDE || thresholdTypeIndex === THRESHOLD_TYPE_GOERTZEL) {

            playbackModeOptionMute.disabled = false;
            playbackModeOptionSkip.disabled = false;

        } else {

            playbackModeOptionMute.disabled = true;
            playbackModeOptionSkip.disabled = true;

        }

    } else {

        playbackModeOptionMute.disabled = true;
        playbackModeOptionSkip.disabled = true;

    }

    switch (thresholdTypeIndex) {

    case THRESHOLD_TYPE_NONE:

        goertzelCanvasHolder.style.display = 'none';
        spectrogramGoertzelCanvas.style.display = 'none';
        spectrogramGoertzelLineSVG.style.display = 'none';

        waveformHolder.style.display = '';

        break;

    case THRESHOLD_TYPE_AMPLITUDE:

        goertzelCanvasHolder.style.display = 'none';
        spectrogramGoertzelCanvas.style.display = 'none';
        spectrogramGoertzelLineSVG.style.display = 'none';

        waveformHolder.style.display = '';

        break;

    case THRESHOLD_TYPE_GOERTZEL:

        goertzelCanvasHolder.style.display = '';
        spectrogramGoertzelCanvas.style.display = '';
        spectrogramGoertzelLineSVG.style.display = '';

        waveformHolder.style.display = 'none';

        break;

    }

}

/**
 * Convert a time in seconds to a pixel value on the screen, given the current zoom level
 * @param {number} seconds A length of time in seconds
 * @returns How many horizontal pixels on-screen portray this amount of time
 */
function samplesToPixels (samples) {

    const pixels = samples / displayLength * spectrogramCanvas.width;

    return pixels;

}

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Draw text to an SVG holder
 * @param {Element} parent SVG element to be drawn to
 * @param {string} content Text to be written
 * @param {number} x x coordinate
 * @param {number} y y coordinate
 * @param {string} anchor What end of the text it should be anchored to. Possible values: start/middle/end
 * @param {string} baseline What end of the text it should be anchored to. Possible values: text-top/middle/text-bottom
 */
function addSVGText (parent, content, x, y, anchor, baseline) {

    const textElement = document.createElementNS(SVG_NS, 'text');

    textElement.setAttributeNS(null, 'x', x);
    textElement.setAttributeNS(null, 'y', y);
    textElement.setAttributeNS(null, 'dominant-baseline', baseline);
    textElement.setAttributeNS(null, 'text-anchor', anchor);
    textElement.setAttributeNS(null, 'font-size', '10px');

    textElement.textContent = content;

    parent.appendChild(textElement);

}

/**
 * Draw line to an SVG holder
 * @param {Element} parent SVG element to be drawn to
 * @param {number} x1 X coordinate of line start
 * @param {number} y1 Y coordinate of line start
 * @param {number} x2 X coordinate of line end
 * @param {number} y2 Y coordinate of line end
 */
function addSVGLine (parent, x1, y1, x2, y2) {

    const lineElement = document.createElementNS(SVG_NS, 'line');

    lineElement.setAttributeNS(null, 'x1', x1);
    lineElement.setAttributeNS(null, 'y1', y1);
    lineElement.setAttributeNS(null, 'x2', x2);
    lineElement.setAttributeNS(null, 'y2', y2);
    lineElement.setAttributeNS(null, 'stroke', 'black');

    parent.appendChild(lineElement);

}

/**
 * Remove all SVG drawing elements from an SVG holder
 * @param {Element} parent SVG element containing labels to be cleared
 */
function clearSVG (parent) {

    while (parent.firstChild) {

        parent.removeChild(parent.lastChild);

    }

}

/**
 * Gets sample rate, returning a filler value if no samples have been loaded yet
 * @returns Sample rate
 */
function getTrueSampleRate () {

    return (sampleCount !== 0) ? trueSampleRate : FILLER_SAMPLE_RATE;

}

/**
 * Gets sample rate, returning a filler value if no samples have been loaded yet
 * @returns Sample rate
 */
function getSampleRate () {

    return (sampleCount !== 0) ? sampleRate : FILLER_SAMPLE_RATE;

}

/**
 * Convert zoom index to zoom level
 * @returns Zoom level
 */
function getZoomY () {

    return Math.pow(2, waveformZoomYIndex);

}

/**
 * Convert zoom index to zoom level for decibel plot
 * @returns Zoom level for decibel plot
 */
function getDecibelZoomY () {

    return 1.0 / Math.pow(10, (-6 * waveformZoomYIndex / 20));

}

/**
 * Convert zoom index to zoom level for Goertzel plot
 * @returns Zoom level for decibel plot
 */
function getGoertzelZoomY () {

    return Math.pow(2, goertzelZoomYIndex);

}

/**
 * Add borders to all plots
 */
function drawBorders () {

    const canvases = [spectrogramBorderCanvas, waveformBorderCanvas, goertzelBorderCanvas];

    for (let i = 0; i < canvases.length; i++) {

        const ctx = canvases[i].getContext('2d');

        ctx.strokeStyle = 'black';
        ctx.strokeRect(0, 0, canvases[i].width, canvases[i].height);

    }

}

/**
 * Fill in the y axis labels for the two plots and their shared x axis labels
 */
function drawAxisLabels () {

    // Length of lines used to denote each axis division

    const xMarkerLength = 4;
    const yMarkerLength = 4;

    // Draw x axis labels

    clearSVG(timeLabelSVG);

    // If no file has been loaded, use a filler sample count/rate

    const currentSampleRate = getSampleRate();
    const currentSampleCount = (sampleCount !== 0) ? sampleCount : FILLER_SAMPLE_COUNT;

    let label = 0;

    const displayedTimeAmounts = [
        {
            amount: 30,
            labelIncrement: 5,
            precision: 0
        },
        {
            amount: 10,
            labelIncrement: 2,
            precision: 0
        },
        {
            amount: 5,
            labelIncrement: 1,
            precision: 0
        },
        {
            amount: 2,
            labelIncrement: 0.5,
            precision: 1
        },
        {
            amount: 1,
            labelIncrement: 0.2,
            precision: 1
        },
        {
            amount: 0.5,
            labelIncrement: 0.1,
            precision: 1
        },
        {
            amount: 0.2,
            labelIncrement: 0.05,
            precision: 2
        },
        {
            amount: 0.1,
            labelIncrement: 0.02,
            precision: 2
        },
        {
            amount: 0.05,
            labelIncrement: 0.01,
            precision: 2
        },
        {
            amount: 0.02,
            labelIncrement: 0.005,
            precision: 3
        },
        {
            amount: 0.01,
            labelIncrement: 0.002,
            precision: 3
        },
        {
            amount: 0.005,
            labelIncrement: 0.001,
            precision: 3
        }
    ];

    let xLabelIncrementSecs = displayedTimeAmounts[0].labelIncrement;
    let xLabelDecimalPlaces = displayedTimeAmounts[0].precision;

    for (let i = 0; i < displayedTimeAmounts.length; i++) {

        const displayedTimeSamples = displayedTimeAmounts[i].amount * currentSampleRate;

        xLabelIncrementSecs = displayedTimeAmounts[i].labelIncrement;
        xLabelDecimalPlaces = displayedTimeAmounts[i].precision;

        if (displayLength > displayedTimeSamples) {

            break;

        }

    }

    const xLabelIncrementSamples = xLabelIncrementSecs * currentSampleRate;

    // So the centre of the text can be the label location, there's a small amount of padding around the label canvas
    const xLabelPadding = spectrogramLabelSVG.width.baseVal.value;

    while (label <= currentSampleCount) {

        // Convert the time to a pixel value, then take into account the label width and the padding to position correctly

        let x = samplesToPixels(label) - samplesToPixels(offset);

        if (x < 0) {

            label += xLabelIncrementSamples;
            continue;

        }

        if (x > waveformCanvas.width) {

            break;

        }

        x = (x === 0) ? x + 1 : x;
        x = (x === waveformCanvas.width) ? x - 0.5 : x;

        x += xLabelPadding;

        const labelText = (label / currentSampleRate).toFixed(xLabelDecimalPlaces);

        addSVGText(timeLabelSVG, labelText, x, 10, 'middle', 'middle');
        addSVGLine(timeLabelSVG, x, 0, x, xMarkerLength);

        label += xLabelIncrementSamples;

    }

    // Draw y axis labels for spectrogram

    clearSVG(spectrogramLabelSVG);

    const yLabelCounts = {
        8000: 4,
        16000: 4,
        32000: 4,
        48000: 4,
        96000: 4,
        192000: 4,
        250000: 5,
        384000: 4
    };

    const yLabelCount = yLabelCounts[getSampleRate()];

    const ySpecLabelIncrement = getSampleRate() / 2 / yLabelCount;

    const ySpecIncrement = spectrogramLabelSVG.height.baseVal.value / yLabelCount;

    const specLabelX = spectrogramLabelSVG.width.baseVal.value - 7;
    const specMarkerX = spectrogramLabelSVG.width.baseVal.value - yMarkerLength;

    for (let i = 0; i <= yLabelCount; i++) {

        const labelText = (i * ySpecLabelIncrement / 1000) + 'kHz';

        const y = spectrogramLabelSVG.height.baseVal.value - (i * ySpecIncrement);

        if (i === 0) {

            addSVGText(spectrogramLabelSVG, labelText, specLabelX, y, 'end', 'text-bottom');
            const endLabelY = spectrogramLabelSVG.height.baseVal.value - 0.5;
            addSVGLine(spectrogramLabelSVG, specMarkerX, endLabelY, spectrogramLabelSVG.width.baseVal.value, endLabelY);

        } else if (i === yLabelCount) {

            addSVGText(spectrogramLabelSVG, labelText, specLabelX, y, 'end', 'hanging');
            addSVGLine(spectrogramLabelSVG, specMarkerX, 0.5, spectrogramLabelSVG.width.baseVal.value, 0.5);

        } else {

            addSVGText(spectrogramLabelSVG, labelText, specLabelX, y, 'end', 'middle');
            addSVGLine(spectrogramLabelSVG, specMarkerX, y, spectrogramLabelSVG.width.baseVal.value, y);

        }

    }

    // Draw y axis labels for waveform

    clearSVG(waveformLabelSVG);

    const displayedWaveformAmounts = [
        {
            // 100%
            step16Bit: 8192,
            stepPercentage: 20,
            precisionPercentage: 0,
            labelsDecibel: [-12, -6, -4, -2, 0]
        },
        {
            // 50%
            step16Bit: 4096,
            stepPercentage: 10,
            precisionPercentage: 0,
            labelsDecibel: [-18, -12, -10, -8, -6]
        },
        {
            // 25%
            step16Bit: 2048,
            stepPercentage: 10,
            precisionPercentage: 0,
            labelsDecibel: [-24, -18, -16, -14, -12]
        },
        {
            // 12.5%
            step16Bit: 1024,
            stepPercentage: 5,
            precisionPercentage: 0,
            labelsDecibel: [-30, -24, -22, -20, -18]
        },
        {
            // 6.25%
            step16Bit: 512,
            stepPercentage: 1,
            precisionPercentage: 0,
            labelsDecibel: [-36, -30, -28, -26, -24]
        },
        {
            // 3.125%
            step16Bit: 256,
            stepPercentage: 1,
            precisionPercentage: 0,
            labelsDecibel: [-42, -36, -34, -32, -30]
        },
        {
            // 1.5625%
            step16Bit: 128,
            stepPercentage: 0.5,
            precisionPercentage: 1,
            labelsDecibel: [-48, -42, -40, -38, -36]
        },
        {
            // 0.78125%
            step16Bit: 64,
            stepPercentage: 0.2,
            precisionPercentage: 1,
            labelsDecibel: [-54, -48, -46, -44, -42]
        },
        {
            // 0.390625%
            step16Bit: 32,
            stepPercentage: 0.1,
            precisionPercentage: 1,
            labelsDecibel: [-60, -54, -52, -50, -48]
        }
    ];

    const z = getZoomY();
    const waveformMax = 32768 / z;
    const waveformMaxPercentage = 100.0 / z;

    const waveformCanvasH = waveformLabelSVG.height.baseVal.value;
    const waveformCanvasHCentre = waveformCanvasH / 2.0;

    const yLabelIncrementWaveform16Bit = displayedWaveformAmounts[waveformZoomYIndex].step16Bit;
    const yLabelIncrementWaveformPercentage = displayedWaveformAmounts[waveformZoomYIndex].stepPercentage;
    const yLabelDecimalPlacesWaveform = displayedWaveformAmounts[waveformZoomYIndex].precisionPercentage;
    const yLabelDecibelLabels = displayedWaveformAmounts[waveformZoomYIndex].labelsDecibel;

    const yLabelPositionIncrementWaveform = (yLabelIncrementWaveform16Bit / waveformMax) * waveformCanvasH / 2;
    const yLabelPositionIncrementWaveformPercentage = (yLabelIncrementWaveformPercentage / waveformMaxPercentage) * waveformCanvasH / 2;

    const waveformLabelTexts = [];
    const waveformLabelYPositions = [];

    if (thresholdScaleIndex === THRESHOLD_SCALE_PERCENTAGE) {

        let waveformLabelYOffsetPercentage = 0.0;
        let waveformLabelValuePercentage = 0.0;

        while (waveformLabelValuePercentage <= waveformMaxPercentage) {

            // 1.5% can't be selected but 0.5 is a chosen step, so skip that label

            if (yLabelIncrementWaveformPercentage === 0.5 && waveformLabelValuePercentage === 1.5) {

                waveformLabelValuePercentage += yLabelIncrementWaveformPercentage;
                waveformLabelYOffsetPercentage += yLabelPositionIncrementWaveformPercentage;

                continue;

            }

            waveformLabelTexts.push(waveformLabelValuePercentage.toFixed(yLabelDecimalPlacesWaveform) + '%');
            waveformLabelYPositions.push(waveformCanvasHCentre - waveformLabelYOffsetPercentage);

            // Add mirrored label

            if (waveformLabelValuePercentage > 0.0) {

                waveformLabelTexts.unshift(waveformLabelValuePercentage.toFixed(yLabelDecimalPlacesWaveform) + '%');
                waveformLabelYPositions.unshift(waveformCanvasHCentre + waveformLabelYOffsetPercentage);

            }

            waveformLabelValuePercentage += yLabelIncrementWaveformPercentage;
            waveformLabelYOffsetPercentage += yLabelPositionIncrementWaveformPercentage;

        }

    } else if (thresholdScaleIndex === THRESHOLD_SCALE_16BIT) {

        let waveformLabelYOffset = 0;
        let waveformLabelValue16Bit = 0;

        while (waveformLabelValue16Bit <= waveformMax) {

            waveformLabelTexts.push(waveformLabelValue16Bit);
            waveformLabelYPositions.push(waveformCanvasHCentre - waveformLabelYOffset);

            // Add mirrored label

            if (waveformLabelValue16Bit > 0) {

                waveformLabelTexts.unshift(waveformLabelValue16Bit);
                waveformLabelYPositions.unshift(waveformCanvasHCentre + waveformLabelYOffset);

            }

            waveformLabelValue16Bit += yLabelIncrementWaveform16Bit;
            waveformLabelYOffset += yLabelPositionIncrementWaveform;

        }

    } else if (thresholdScaleIndex === THRESHOLD_SCALE_DECIBEL) {

        for (let i = 0; i < yLabelDecibelLabels.length; i++) {

            const decibelValue = yLabelDecibelLabels[i];

            const labelPosition = Math.pow(10, decibelValue / 20);

            waveformLabelTexts.push(yLabelDecibelLabels[i] + 'dB');
            waveformLabelYPositions.push(waveformCanvasHCentre - (getDecibelZoomY() * labelPosition * waveformCanvasHCentre));

            // No label is drawn for 0, so no need to check that here

            waveformLabelTexts.unshift(yLabelDecibelLabels[i] + 'dB');
            waveformLabelYPositions.unshift(waveformCanvasHCentre + (getDecibelZoomY() * labelPosition * waveformCanvasHCentre));

        }

    }

    const wavLabelX = waveformLabelSVG.width.baseVal.value - 7;
    const wavMarkerX = waveformLabelSVG.width.baseVal.value - yMarkerLength;

    for (let i = 0; i < waveformLabelTexts.length; i++) {

        let markerY = waveformLabelYPositions[i];
        let labelY = markerY;

        let baseline = 'middle';

        if (markerY === waveformCanvasH) {

            baseline = 'text-bottom';

        } else if (markerY === 0) {

            baseline = 'hanging';

            // If on Windows, offset label text slightly

            if (navigator.platform.includes('Win')) {

                labelY -= 1;

            }

        }

        addSVGText(waveformLabelSVG, waveformLabelTexts[i], wavLabelX, labelY, 'end', baseline);

        // Nudge markers slightly onto canvas so they're not cut off

        markerY = (markerY === 0) ? markerY + 0.5 : markerY;
        markerY = (markerY === waveformCanvasH) ? markerY - 0.5 : markerY;

        addSVGLine(waveformLabelSVG, wavMarkerX, markerY, waveformLabelSVG.width.baseVal.value, markerY);

    }

    // Draw y axis labels for goertzel plot

    clearSVG(goertzelLabelSVG);

    const displayedGoertzelAmounts = [
        {
            // 100%
            labelIncrement: 20,
            precision: 0
        },
        {
            // 50%
            labelIncrement: 10,
            precision: 0
        },
        {
            // 25%
            labelIncrement: 10,
            precision: 0
        },
        {
            // 12.5%
            labelIncrement: 5,
            precision: 0
        },
        {
            // 6.25%
            labelIncrement: 1,
            precision: 0
        },
        {
            // 3.125%
            labelIncrement: 1,
            precision: 0
        },
        {
            // 1.5625% !
            labelIncrement: 0.5,
            precision: 1
        },
        {
            // 0.78125%
            labelIncrement: 0.2,
            precision: 1
        },
        {
            // 0.390625%
            labelIncrement: 0.1,
            precision: 1
        }
    ];

    let yLabelIncrementGoertzel = displayedGoertzelAmounts[0].labelIncrement;
    let yLabelDecimalPlacesGoertzel = displayedGoertzelAmounts[0].precision;

    const goertzelCanvasH = goertzelLabelSVG.height.baseVal.value;
    let yLabelPositionIncrementGoertzel = 0;

    const goertzelMax = 100.0 / getGoertzelZoomY();

    yLabelIncrementGoertzel = displayedGoertzelAmounts[goertzelZoomYIndex].labelIncrement;
    yLabelDecimalPlacesGoertzel = displayedGoertzelAmounts[goertzelZoomYIndex].precision;

    yLabelPositionIncrementGoertzel = (yLabelIncrementGoertzel / goertzelMax) * goertzelCanvasH;

    let goertzelLabelValue = 0.0;
    let goertzelLabelYPosition = goertzelCanvasH;

    const goertzelLabelTexts = [];
    const goertzelLabelYPositions = [];

    while (goertzelLabelValue <= goertzelMax) {

        // 1.5% can't be selected but 0.5 is a chosen step, so skip that label

        if (!(yLabelIncrementGoertzel === 0.5 && goertzelLabelValue === 1.5)) {

            goertzelLabelTexts.push(goertzelLabelValue.toFixed(yLabelDecimalPlacesGoertzel) + '%');
            goertzelLabelYPositions.push(goertzelLabelYPosition);

        }

        goertzelLabelValue += yLabelIncrementGoertzel;
        goertzelLabelYPosition -= yLabelPositionIncrementGoertzel;

    }

    const goertzelLabelX = goertzelLabelSVG.width.baseVal.value - 7;
    const goertzelMarkerX = goertzelLabelSVG.width.baseVal.value - yMarkerLength;

    for (let i = 0; i < goertzelLabelTexts.length; i++) {

        let markerY = goertzelLabelYPositions[i];
        let labelY = markerY;

        let baseline = 'middle';

        if (i === 0) {

            baseline = 'text-bottom';

        } else if (i === goertzelLabelTexts.length - 1) {

            baseline = 'hanging';

            // If on Windows, offset label text slightly

            if (navigator.platform.includes('Win')) {

                labelY -= 1;

            }

        }

        addSVGText(goertzelLabelSVG, goertzelLabelTexts[i], goertzelLabelX, labelY, 'end', baseline);

        // Nudge markers slightly onto canvas so they're not cut off

        markerY = (markerY === 0) ? markerY + 0.5 : markerY;
        markerY = (markerY === waveformCanvasH) ? markerY - 0.5 : markerY;

        addSVGLine(goertzelLabelSVG, goertzelMarkerX, markerY, goertzelLabelSVG.width.baseVal.value, markerY);

    }

}

/**
 * Add axis heading to plots
 */
function drawAxisHeadings () {

    clearSVG(timeAxisHeadingSVG);

    addSVGText(timeAxisHeadingSVG, 'Time (seconds)', timeAxisHeadingSVG.width.baseVal.value / 2, 10, 'middle', 'middle');

}

/**
 * Clear a canvas of its contents and reset all transformations
 * @param {object} canvas The canvas to be cleared
 */
function resetCanvas (canvas) {

    // Setting the width/height of a canvas in any way wipes it clean and resets the context's transformations
    // eslint-disable-next-line no-self-assign
    canvas.width = canvas.width;

}

/**
 * Update zoom input with current zoom level and enable/disable zoom in/out buttons if appropriate
 */
function updateZoomUI () {

    if (sampleCount === 0) {

        zoomInButton.disabled = true;
        zoomOutButton.disabled = true;
        homeButton.disabled = true;
        return;

    }

    if (displayLength === sampleCount) {

        homeButton.disabled = true;

    } else {

        homeButton.disabled = false;

    }

    if (displayLength >= sampleCount) {

        zoomOutButton.disabled = true;

    } else {

        zoomOutButton.disabled = false;

    }

    if (displayLength <= minDisplayLength) {

        zoomInButton.disabled = true;

    } else {

        zoomInButton.disabled = false;

    }

}

/**
 * Enable/disable pan buttons when appropriate
 */
function updatePanUI () {

    if (sampleCount === 0) {

        panRightButton.disabled = true;
        panLeftButton.disabled = true;
        return;

    }

    if (offset <= 0) {

        panLeftButton.disabled = true;

    } else {

        panLeftButton.disabled = false;

    }

    let sampleEnd = Math.floor(offset + displayLength);

    // Gap at the end of the plot in samples
    const gapLength = sampleEnd - sampleCount;

    sampleEnd = sampleEnd > sampleCount ? sampleCount : sampleEnd;

    if (gapLength >= 0) {

        panRightButton.disabled = true;

    } else {

        panRightButton.disabled = false;

    }

}

/**
 * Update zoom and pan UI elements, disabling x axis home button if needed
 */
function updateNavigationUI () {

    updateZoomUI();
    updatePanUI();

}

/**
 * Get the offset from centre the two amplitude threshold lines should be drawn
 * @returns Offset from centre
 */
function getAmplitudeThresholdLineOffset () {

    const h = waveformThresholdLineSVG.height.baseVal.value;

    const centre = h / 2;
    let offsetFromCentre = 0;

    const amplitudeThresholdValues = getAmplitudeThresholdValues();

    if (thresholdScaleIndex === THRESHOLD_SCALE_PERCENTAGE) {

        const amplitudeThresholdRatio = parseFloat(amplitudeThresholdValues.percentage) / 100.0;
        offsetFromCentre = amplitudeThresholdRatio * centre * getZoomY();

    } else if (thresholdScaleIndex === THRESHOLD_SCALE_16BIT) {

        const amplitudeThresholdRatio = amplitudeThresholdValues.amplitude / 32768.0;
        offsetFromCentre = amplitudeThresholdRatio * centre * getZoomY();

    } else if (thresholdScaleIndex === THRESHOLD_SCALE_DECIBEL) {

        const amplitudeThresholdRatio = Math.pow(10, amplitudeThresholdValues.decibels / 20);
        offsetFromCentre = amplitudeThresholdRatio * centre * getDecibelZoomY();

    }

    return offsetFromCentre;

}

/**
 * Draw amplitude threshold value to its overlay layer
 */
function drawAmplitudeThresholdLines () {

    const w = waveformThresholdLineSVG.width.baseVal.value;
    const h = waveformThresholdLineSVG.height.baseVal.value;

    const centre = h / 2;

    clearSVG(waveformThresholdLineSVG);

    const offsetFromCentre = getAmplitudeThresholdLineOffset();

    const positiveY = centre - offsetFromCentre;
    const negativeY = centre + offsetFromCentre;

    addSVGLine(waveformThresholdLineSVG, 0, positiveY, w, positiveY);
    addSVGLine(waveformThresholdLineSVG, 0, negativeY, w, negativeY);

}

/**
 * Draw Goertzel threshold value to its overlay layer
 */
function drawGoertzelThresholdLine () {

    const w = goertzelThresholdLineSVG.width.baseVal.value;
    const h = goertzelThresholdLineSVG.height.baseVal.value;

    clearSVG(goertzelThresholdLineSVG);

    const frequencyTrigger = getFrequencyTrigger() / 100.0;

    const thresholdY = h - (h * frequencyTrigger * getGoertzelZoomY());

    addSVGLine(goertzelThresholdLineSVG, 0, thresholdY, w, thresholdY);

}

/**
 * Draw Goertzel filter band over spectrogram canvas
 */
function drawGoertzelFilter () {

    const filterCtx = spectrogramGoertzelCanvas.getContext('2d');

    const w = spectrogramGoertzelCanvas.width;
    const h = spectrogramGoertzelCanvas.height;

    resetCanvas(spectrogramGoertzelCanvas);
    clearSVG(spectrogramGoertzelLineSVG);

    const nyquist = sampleRate / 2.0;

    const freq = getFrequencyTriggerFilterFreq();
    const freqY = h - (h * freq / nyquist);

    const windowLength = getFrequencyTriggerWindowLength();
    const bandwidth = 4.0 * sampleRate / windowLength;
    const bandwidthY = (h * bandwidth / nyquist) / 2;

    // Draw centre frequency

    addSVGLine(spectrogramGoertzelLineSVG, 0, freqY, w, freqY);

    // Shade thresholded frequency

    filterCtx.globalAlpha = 0.25;
    filterCtx.fillStyle = 'red';

    filterCtx.fillRect(0, freqY - bandwidthY, w, bandwidthY * 2);

}

/**
 * Draw amplitude threshold periods to the overlay layer
 */
function drawThresholdedPeriods () {

    const waveformCtx = waveformThresholdCanvas.getContext('2d');
    const waveformW = waveformThresholdCanvas.width;
    const waveformH = waveformThresholdCanvas.height;

    waveformCtx.clearRect(0, 0, waveformW, waveformH);

    const spectrogramCtx = spectrogramThresholdCanvas.getContext('2d');
    const spectrogramW = spectrogramThresholdCanvas.width;
    const spectrogramH = spectrogramThresholdCanvas.height;

    spectrogramCtx.clearRect(0, 0, spectrogramW, spectrogramH);

    // Reset scaling from zoom

    waveformCtx.resetTransform();

    waveformCtx.fillStyle = 'white';
    waveformCtx.globalAlpha = 0.75;

    spectrogramCtx.resetTransform();

    spectrogramCtx.fillStyle = 'white';
    spectrogramCtx.globalAlpha = 0.85;

    let drawingPeriod = false;
    let startPixels;

    const start = Math.floor(offset / AMPLITUDE_THRESHOLD_BUFFER_LENGTH);
    const end = Math.floor((offset + displayLength - 1) / AMPLITUDE_THRESHOLD_BUFFER_LENGTH);

    for (let i = start; i <= end; i++) {

        const sampleIndex = i * AMPLITUDE_THRESHOLD_BUFFER_LENGTH;

        if (!samplesAboveThreshold[i]) {

            if (!drawingPeriod) {

                drawingPeriod = true;
                startPixels = samplesToPixels(sampleIndex - offset);

            }

        } else {

            if (drawingPeriod) {

                drawingPeriod = false;

                const endPixels = samplesToPixels(sampleIndex - offset);
                const lengthPixels = endPixels - startPixels;

                waveformCtx.fillRect(startPixels, 0, lengthPixels, waveformH);
                spectrogramCtx.fillRect(startPixels, 0, lengthPixels, spectrogramH);

            }

        }

    }

    // If a period is cut off by the end of the displayed area

    if (drawingPeriod) {

        const endPixels = samplesToPixels(offset + displayLength);
        const lengthPixels = endPixels - startPixels;

        waveformCtx.fillRect(startPixels, 0, lengthPixels, waveformH);
        spectrogramCtx.fillRect(startPixels, 0, lengthPixels, spectrogramH);

    }

}

/**
 * Draw Goertzel threshold periods to the overlay layer
 */
function drawGoertzelThresholdedPeriods () {

    const spectrogramCtx = spectrogramThresholdCanvas.getContext('2d');
    const spectrogramW = spectrogramThresholdCanvas.width;
    const spectrogramH = spectrogramThresholdCanvas.height;

    spectrogramCtx.clearRect(0, 0, spectrogramW, spectrogramH);

    const goertzelCtx = goertzelThresholdCanvas.getContext('2d');
    const goertzelW = goertzelThresholdCanvas.width;
    const goertzelH = goertzelThresholdCanvas.height;

    goertzelCtx.clearRect(0, 0, goertzelW, goertzelH);

    // Reset scaling from zoom

    spectrogramCtx.resetTransform();

    spectrogramCtx.fillStyle = 'white';
    spectrogramCtx.globalAlpha = 0.85;

    // goertzelCtx.resetTransform();

    goertzelCtx.fillStyle = 'white';
    goertzelCtx.globalAlpha = 0.75;

    let drawingPeriod = false;
    let startPixels;

    const start = Math.floor(offset / GOERTZEL_THRESHOLD_BUFFER_LENGTH);
    const end = Math.floor((offset + displayLength - 1) / GOERTZEL_THRESHOLD_BUFFER_LENGTH);

    for (let i = start; i <= end; i++) {

        const sampleIndex = i * GOERTZEL_THRESHOLD_BUFFER_LENGTH;

        if (!samplesAboveGoertzelThreshold[i]) {

            if (!drawingPeriod) {

                drawingPeriod = true;
                startPixels = samplesToPixels(sampleIndex - offset);

            }

        } else {

            if (drawingPeriod) {

                drawingPeriod = false;

                const endPixels = samplesToPixels(sampleIndex - offset);
                const lengthPixels = endPixels - startPixels;

                spectrogramCtx.fillRect(startPixels, 0, lengthPixels, spectrogramH);
                goertzelCtx.fillRect(startPixels, 0, lengthPixels, goertzelH);

            }

        }

    }

    // If a period is cut off by the end of the displayed area

    if (drawingPeriod) {

        const endPixels = samplesToPixels(offset + displayLength);
        const lengthPixels = endPixels - startPixels;

        spectrogramCtx.fillRect(startPixels, 0, lengthPixels, spectrogramH);
        goertzelCtx.fillRect(startPixels, 0, lengthPixels, goertzelH);

    }

}

/**
 * Draw a loading message to the given canvas
 * @param {object} canvas The canvas to be cleared and display the loading message
 */
function drawLoadingImage (svgCanvas) {

    const w = svgCanvas.width.baseVal.value;
    const h = svgCanvas.height.baseVal.value;

    clearSVG(svgCanvas);

    addSVGText(svgCanvas, 'Loading' + '.'.repeat(3), w / 2 - 20, h / 2, 'start', 'middle');

}

/**
 * Re-enable UI at the end of the drawing process
 */
function reenableUI () {

    fileButton.disabled = false;

    for (let i = 0; i < exampleLinks.length; i++) {

        exampleLinks[i].disabled = false;

    }

    enableSampleRateControl();

    updateNavigationUI();
    updateYZoomUI();

    updateFilterUI();

    thresholdTypeLabel.classList.remove('grey');
    for (let i = 0; i < thresholdTypeRadioButtons.length; i++) {

        thresholdTypeRadioButtons[i].disabled = false;

    }

    updateThresholdTypePlaybackUI();

    updateThresholdUI();

    resetButton.disabled = false;
    exportButton.disabled = false;
    exportModalButton.disabled = false;
    exportAudioButton.disabled = false;

    playButton.disabled = false;
    enableSlider(playbackSpeedSlider, playbackSpeedDiv);
    playbackModeSelect.disabled = false;

    enableFilterUI();

    if (errorSpan.style.display === 'none') {

        fileSpan.style.display = '';
        loadingSpan.style.display = 'none';

    }

}

/**
 * Draw the waveform plot, its axis labels, and then re-enable all UI
 * @param {number[]} samples Samples to render
 * @param {boolean} isInitialRender Is this the first time this file has been rendered
 * @param {number} spectrogramCompletionTime Time taken to render spectrogram
 */
function drawWaveformPlot (samples, isInitialRender, spectrogramCompletionTime) {

    console.log('Drawing waveform');

    resetCanvas(waveformCanvas);

    const thresholdTypeIndex = getThresholdTypeIndex();

    // Halving vertical view just cuts off the mid point label, so reduce zoom slightly if in decibel mode

    const zoomLevel = (thresholdScaleIndex === THRESHOLD_SCALE_DECIBEL) ? getDecibelZoomY() : getZoomY();

    drawWaveform(samples, offset, displayLength, zoomLevel, (waveformCompletionTime) => {

        if (isInitialRender) {

            initialRenderCompletionTime = spectrogramCompletionTime + waveformCompletionTime;
            console.log('Initial rendering took', initialRenderCompletionTime, 'ms');

        }

        resetCanvas(waveformThresholdCanvas);
        clearSVG(waveformThresholdLineSVG);

        waveformLoadingSVG.style.display = 'none';

        if (thresholdTypeIndex === THRESHOLD_TYPE_AMPLITUDE) {

            drawThresholdedPeriods();
            drawAmplitudeThresholdLines();

        }

        drawAxisLabels();

        drawing = false;

        disabledFileButton.style.display = isChrome ? 'none' : '';
        fileButton.style.display = isChrome ? '' : 'none';

        fileButton.disabled = false;
        if (thresholdTypeIndex === THRESHOLD_TYPE_GOERTZEL) {

            resetCanvas(goertzelCanvas);
            resetCanvas(goertzelThresholdCanvas);
            clearSVG(goertzelThresholdLineSVG);

            const windowLength = getFrequencyTriggerWindowLength();

            drawGoertzelPlot(goertzelValues, windowLength, offset, displayLength, getGoertzelZoomY(), () => {

                drawGoertzelThresholdedPeriods();
                drawGoertzelFilter();
                drawGoertzelThresholdLine();
                reenableUI();

            });

        } else {

            reenableUI();

        }

    });

}

/**
 * Estimate time taken to render with the new display length
 * @returns Approximate render time
 */
function estimateRenderTime () {

    if (sampleCount === 0) {

        return 0;

    }

    const displayRatio = displayLength / sampleCount;

    return displayRatio * initialRenderCompletionTime / getSampleRate();

}

/**
 * Draw spectrogram and waveform plots
 * @param {number[]} samples Samples to render
 * @param {boolean} isInitialRender Is this the first time the file has been rendered
 */
function drawPlots (samples, isInitialRender) {

    drawSpectrogram(processedSpectrumFrames, spectrumMin, spectrumMax, async (completionTime) => {

        resetCanvas(spectrogramThresholdCanvas);
        spectrogramLoadingSVG.style.display = 'none';

        drawWaveformPlot(samples, isInitialRender, completionTime);

        updateFileSizePanel();

    });

}

/**
 * Turn off all UI elements so settings can't be changed during processing
 */
function disableUI (startUp) {

    if (!startUp) {

        fileButton.disabled = true;

        for (let i = 0; i < exampleLinks.length; i++) {

            exampleLinks[i].disabled = true;

        }

    }

    disableSampleRateControl();

    resetButton.disabled = true;
    exportButton.disabled = true;
    exportModalButton.disabled = true;
    exportAudioButton.disbled = true;

    zoomInButton.disabled = true;
    zoomOutButton.disabled = true;
    homeButton.disabled = true;

    waveformHomeButton.disabled = true;
    waveformZoomInButton.disabled = true;
    waveformZoomOutButton.disabled = true;

    thresholdTypeLabel.classList.remove('grey');
    for (let i = 0; i < thresholdTypeRadioButtons.length; i++) {

        thresholdTypeRadioButtons[i].disabled = false;

    }

    playbackModeOptionMute.disabled = true;
    playbackModeOptionSkip.disabled = true;

    playButton.disabled = true;
    disableSlider(playbackSpeedSlider, playbackSpeedDiv);
    playbackModeSelect.disabled = true;

    disableFilterUI();

}

/**
 * Temporarily disable UI then calculate spectrogram frames
 * @param {number[]} samples Samples to be processed
 * @param {boolean} isInitialRender Is this the first time the file has been rendered
 */
function processContents (samples, isInitialRender, renderPlots) {

    drawing = true;

    // Wait short period to make sure UI is completely disabled before processing actually begins

    setTimeout(() => {

        console.log('Calculating spectrogram frames');

        // Process spectrogram frames

        const result = calculateSpectrogramFrames(samples, sampleCount, renderPlots ? offset : 0, renderPlots ? displayLength : sampleCount);

        processedSpectrumFrames = result.frames;

        if (spectrumMin === 0.0 && spectrumMax === 0.0) {

            spectrumMin = result.min;
            spectrumMax = result.max;

            console.log('Setting colour map. Min: ' + spectrumMin + ' Max: ' + spectrumMax);

        }

        if (renderPlots) {

            drawPlots(samples, isInitialRender);

        } else {

            drawing = false;

        }

    }, 0);

}

/**
 * Reset x axis zoom/pan settings
 */
function resetXTransformations () {

    const currentSampleCount = (sampleCount !== 0) ? sampleCount : FILLER_SAMPLE_COUNT;
    displayLength = currentSampleCount;
    offset = 0;
    updateNavigationUI();

}

/**
 * Reset all zoom/pan settings
 */
function resetTransformations () {

    resetXTransformations();
    waveformZoomYIndex = 0;
    goertzelZoomYIndex = 0;

}

/**
 * Shift plot along if zooming out at current location would create a gap at the end of the plot
 */
function removeEndGap () {

    const sampleEnd = Math.floor(offset + displayLength);

    const gapLength = sampleEnd - sampleCount;

    if (gapLength > 0) {

        offset -= gapLength;

    }

}

/**
 * Pan plot to the right
 */
function panRight () {

    if (sampleCount !== 0 && !drawing && !playing) {

        const offsetIncrement = Math.floor(displayLength / 2);

        offset = offset + offsetIncrement;

        removeEndGap();

        setTimeout(() => {

            updatePlots(false, true, false, false, false);

        }, 0);

        updatePanUI();

    }

}

/**
 * Pan plot to the left
 */
function panLeft () {

    if (sampleCount !== 0 && !drawing && !playing) {

        const offsetIncrement = Math.floor(displayLength / 2);

        const newOffset = offset - offsetIncrement;

        offset = Math.max(newOffset, 0);

        setTimeout(() => {

            updatePlots(false, true, false, false, false);

        }, 0);

        updatePanUI();

    }

}

/**
 * Zoom plot in
 */
function zoomIn () {

    if (sampleCount !== 0 && !drawing && !playing) {

        const oldCentre = offset + Math.floor(displayLength / 2);

        const newDisplayLength = Math.floor(displayLength / ZOOM_MULTIPLIER);

        displayLength = (newDisplayLength >= minDisplayLength) ? newDisplayLength : minDisplayLength;

        const newCentre = offset + Math.floor(displayLength / 2);

        const diffSamples = oldCentre - newCentre;

        offset += diffSamples;

        offset = (offset < 0) ? 0 : offset;

        setTimeout(() => {

            updatePlots(false, true, false, false, false);

        }, 10);

        updateNavigationUI();

    }

}

/**
 * Zoom plot out
 */
function zoomOut () {

    if (sampleCount !== 0 && !drawing && !playing) {

        const oldCentre = offset + Math.floor(displayLength / 2);

        const newDisplayLength = displayLength * ZOOM_MULTIPLIER;

        if (newDisplayLength < sampleCount) {

            displayLength = newDisplayLength;

            const newCentre = offset + Math.floor(displayLength / 2);

            const diffSecs = oldCentre - newCentre;

            offset += diffSecs;

            offset = (offset < 0) ? 0 : offset;

            removeEndGap();

            updateNavigationUI();

        } else {

            resetXTransformations();

        }

        setTimeout(() => {

            updatePlots(false, true, false, false, false);

        }, 10);

    }

}

/**
 * Enable/disable waveform navigation buttons if current values are within limits
 */
function updateYZoomUI () {

    if (sampleCount === 0) {

        waveformHomeButton.disabled = true;
        waveformZoomInButton.disabled = true;
        waveformZoomOutButton.disabled = true;
        return;

    }

    const thresholdTypeIndex = getThresholdTypeIndex();

    if (thresholdTypeIndex === THRESHOLD_TYPE_NONE || thresholdTypeIndex === THRESHOLD_TYPE_AMPLITUDE) {

        waveformHomeButton.disabled = (waveformZoomYIndex === 0);
        waveformZoomInButton.disabled = (waveformZoomYIndex >= MAX_ZOOM_Y_INDEX);
        waveformZoomOutButton.disabled = (waveformZoomYIndex === 0);

    } else {

        waveformHomeButton.disabled = (goertzelZoomYIndex === 0);
        waveformZoomInButton.disabled = (goertzelZoomYIndex >= MAX_ZOOM_Y_INDEX);
        waveformZoomOutButton.disabled = (goertzelZoomYIndex === 0);

    }

}

/**
 * Zoom waveform in on y axis
 */
function zoomInWaveformY () {

    if (sampleCount !== 0 && !drawing && !playing) {

        const newZoom = waveformZoomYIndex + 1;

        if (newZoom <= MAX_ZOOM_Y_INDEX) {

            waveformZoomYIndex = newZoom;

            disableUI(false);

            const filterIndex = getFilterRadioValue();

            // Redraw just the waveform plot

            if (filterIndex === FILTER_NONE) {

                drawWaveformPlot(downsampledUnfilteredSamples, false);

            } else {

                drawWaveformPlot(filteredSamples, false);

            }

            updateYZoomUI();

        }

    }

}

/**
 * Zoom waveform out on y axis
 */
function zoomOutWaveformY () {

    if (sampleCount !== 0 && !drawing && !playing) {

        const newZoom = waveformZoomYIndex - 1;

        if (newZoom >= 0) {

            waveformZoomYIndex = newZoom;

            disableUI(false);

            const filterIndex = getFilterRadioValue();

            // Redraw just the waveform plot

            if (filterIndex === FILTER_NONE) {

                drawWaveformPlot(downsampledUnfilteredSamples, false);

            } else {

                drawWaveformPlot(filteredSamples, false);

            }

            updateYZoomUI();

        }

    }

}

/**
 * Set y zoom level to default and redraw waveform plot
 */
function resetWaveformZoom () {

    if (sampleCount !== 0 && !drawing && !playing) {

        waveformZoomYIndex = 0;

        disableUI(false);

        const filterIndex = getFilterRadioValue();

        // Redraw just the waveform plot

        if (filterIndex === FILTER_NONE) {

            drawWaveformPlot(downsampledUnfilteredSamples, false);

        } else {

            drawWaveformPlot(filteredSamples, false);

        }

        updateYZoomUI();

    }

}

/**
 * Zoom Goertzel plot in on y axis
 */
function zoomInGoertzelY () {

    if (sampleCount !== 0 && !drawing && !playing) {

        const newZoom = goertzelZoomYIndex + 1;

        if (newZoom <= MAX_ZOOM_Y_INDEX) {

            goertzelZoomYIndex = newZoom;

            disableUI(false);

            // Redraw just the goertzel plot

            resetCanvas(goertzelCanvas);
            resetCanvas(goertzelThresholdCanvas);
            clearSVG(goertzelThresholdLineSVG);

            const windowLength = getFrequencyTriggerWindowLength();

            drawGoertzelPlot(goertzelValues, windowLength, offset, displayLength, getGoertzelZoomY(), () => {

                drawAxisLabels();
                drawGoertzelThresholdedPeriods();
                drawGoertzelFilter();
                drawGoertzelThresholdLine();
                reenableUI();

                updateYZoomUI();

            });

        }

    }

}

/**
 * Zoom Goertzel plot out on y axis
 */
function zoomOutGoertzelY () {

    if (sampleCount !== 0 && !drawing && !playing) {

        const newZoom = goertzelZoomYIndex - 1;

        if (newZoom >= 0) {

            goertzelZoomYIndex = newZoom;

            disableUI(false);

            // Redraw just the goertzel plot

            resetCanvas(goertzelCanvas);
            resetCanvas(goertzelThresholdCanvas);
            clearSVG(goertzelThresholdLineSVG);

            const windowLength = getFrequencyTriggerWindowLength();

            drawGoertzelPlot(goertzelValues, windowLength, offset, displayLength, getGoertzelZoomY(), () => {

                drawAxisLabels();
                drawGoertzelThresholdedPeriods();
                drawGoertzelFilter();
                drawGoertzelThresholdLine();
                reenableUI();

                updateYZoomUI();

            });

        }

    }

}

/**
 * Set y zoom level to default and redraw Goertzel plot plot
 */
function resetGoertzelZoom () {

    if (sampleCount !== 0 && !drawing && !playing) {

        goertzelZoomYIndex = 0;

        disableUI(false);

        // Redraw just the goertzel plot

        resetCanvas(goertzelCanvas);
        resetCanvas(goertzelThresholdCanvas);
        clearSVG(goertzelThresholdLineSVG);

        const windowLength = getFrequencyTriggerWindowLength();

        drawGoertzelPlot(goertzelValues, windowLength, offset, displayLength, getGoertzelZoomY(), () => {

            drawAxisLabels();
            drawGoertzelThresholdedPeriods();
            drawGoertzelFilter();
            drawGoertzelThresholdLine();
            reenableUI();

            updateYZoomUI();

        });

    }

}

/**
 * Zoom in on the currently shown plot (waveform or Goertzel) in the y axis only
 */
function zoomInY () {

    const thresholdTypeIndex = getThresholdTypeIndex();

    if (thresholdTypeIndex === THRESHOLD_TYPE_GOERTZEL) {

        zoomInGoertzelY();

    } else {

        zoomInWaveformY();

    }

}

/**
 * Zoom in on the currently shown plot (waveform or Goertzel) in the y axis only
 */
function zoomOutY () {

    const thresholdTypeIndex = getThresholdTypeIndex();

    if (thresholdTypeIndex === THRESHOLD_TYPE_GOERTZEL) {

        zoomOutGoertzelY();

    } else {

        zoomOutWaveformY();

    }

}

/**
 * Reset the Y zoom the currently shown plot (waveform or Goertzel)
 */
function resetZoomY () {

    const thresholdTypeIndex = getThresholdTypeIndex();

    if (thresholdTypeIndex === THRESHOLD_TYPE_GOERTZEL) {

        resetGoertzelZoom();

    } else {

        resetWaveformZoom();

    }

}

/**
 * Apply filter and/or amplitude threshold if enabled
 * @param {boolean} reapplyFilter Whether or not to reappply a frequency filter
 * @param {boolean} updateThresholdedSampleArray Whether or not to recalculate the boolean array of thresholded samples
 * @param {boolean} recalculateGoertzelValues Whether or not the Goertzel filter used for frequency thresholding needs to be recalculated
 * @returns Samples to be rendered
 */
function getRenderSamples (reapplyFilter, updateThresholdedSampleArray, recalculateGoertzelValues) {

    const thresholdTypeIndex = getThresholdTypeIndex();

    const filterIndex = getFilterRadioValue();
    const isFiltering = filterIndex !== FILTER_NONE;

    // Apply low/band/high pass filter

    if (reapplyFilter && isFiltering && thresholdTypeIndex !== THRESHOLD_TYPE_GOERTZEL) {

        let lowPassFilterValue;
        let highPassFilterValue;
        let bandPassFilterValue0, bandPassFilterValue1;

        switch (filterIndex) {

        case FILTER_LOW:
            lowPassFilterValue = lowPassFilterSlider.getValue();
            console.log('Applying low-pass filter at', lowPassFilterValue, 'Hz');

            applyLowPassFilter(downsampledUnfilteredSamples, sampleCount, filteredSamples, getSampleRate(), lowPassFilterValue);

            break;
        case FILTER_HIGH:
            highPassFilterValue = highPassFilterSlider.getValue();
            console.log('Applying high-pass filter at', highPassFilterValue, 'Hz');

            applyHighPassFilter(downsampledUnfilteredSamples, sampleCount, filteredSamples, getSampleRate(), highPassFilterValue);

            break;
        case FILTER_BAND:
            bandPassFilterValue0 = Math.min(...bandPassFilterSlider.getValue());
            bandPassFilterValue1 = Math.max(...bandPassFilterSlider.getValue());
            console.log('Applying band-pass filter between', bandPassFilterValue0, 'and', bandPassFilterValue1, 'Hz');

            applyBandPassFilter(downsampledUnfilteredSamples, sampleCount, filteredSamples, getSampleRate(), bandPassFilterValue0, bandPassFilterValue1);

            break;

        }

    }

    const renderSamples = (isFiltering && thresholdTypeIndex !== THRESHOLD_TYPE_GOERTZEL) ? filteredSamples : downsampledUnfilteredSamples;

    // Apply amplitude threshold

    if (thresholdTypeIndex === THRESHOLD_TYPE_AMPLITUDE && updateThresholdedSampleArray) {

        const amplitudeThresholdValues = getAmplitudeThresholdValues();

        let threshold = 0;

        if (thresholdScaleIndex === THRESHOLD_SCALE_PERCENTAGE) {

            threshold = 32768.0 * parseFloat(amplitudeThresholdValues.percentage) / 100.0;

        } else if (thresholdScaleIndex === THRESHOLD_SCALE_16BIT) {

            threshold = amplitudeThresholdValues.amplitude;

        } else if (thresholdScaleIndex === THRESHOLD_SCALE_DECIBEL) {

            threshold = 32768.0 * Math.pow(10, amplitudeThresholdValues.decibels / 20);

        }

        const minimumTriggerDurationSecs = getMinimumTriggerDurationAmp();
        const minimumTriggerDurationSamples = minimumTriggerDurationSecs * getSampleRate();

        console.log('Applying amplitude threshold');
        console.log('Threshold:', threshold);
        console.log('Minimum trigger duration: %i (%i samples)', minimumTriggerDurationSecs, minimumTriggerDurationSamples);

        thresholdedValueCount = applyAmplitudeThreshold(renderSamples, sampleCount, threshold, minimumTriggerDurationSamples, samplesAboveThreshold);

    }

    if (thresholdTypeIndex === THRESHOLD_TYPE_GOERTZEL && updateThresholdedSampleArray) {

        const minimumTriggerDurationSecs = getMinimumTriggerDurationGoertzel();
        const minimumTriggerDurationSamples = minimumTriggerDurationSecs * getSampleRate();

        const windowLength = getFrequencyTriggerWindowLength();

        if (recalculateGoertzelValues || goertzelValues.length === 0) {

            const freq = getFrequencyTriggerFilterFreq();

            // Create array which will contain all the Goertzel values

            goertzelValues = new Array(Math.floor(sampleCount / windowLength));

            // Apply filter to samples

            applyGoertzelFilter(renderSamples, sampleCount, sampleRate, freq, windowLength, goertzelValues);

        }

        // Divide slider value by maximum possible Goertzel response

        const threshold = getFrequencyTrigger() / 100;

        thresholdedValueCount = applyGoertzelThreshold(goertzelValues, threshold, windowLength, minimumTriggerDurationSamples, samplesAboveGoertzelThreshold);

    }

    return renderSamples;

}

/**
 * Apply filter and amplitude threshold if appropriate then redraw plots
 * @param {boolean} resetColourMap Whether or not to reset the stored max and min values used to calculate the colour map
 * @param {boolean} updateSpectrogram Whether or not to recalculate the spectrogram frames. Needs to be done when the contents of the samples or navigation changes
 * @param {boolean} updateThresholdedSampleArray Whether or not to recalculate the boolean array of thresholded samples.
 * @param {boolean} reapplyFilter Whether or not to reappply a frequency filter
 * @param {boolean} recalculateGoertzelValues Whether or not the Goertzel filter used for frequency thresholding needs to be recalculated
 */
async function updatePlots (resetColourMap, updateSpectrogram, updateThresholdedSampleArray, reapplyFilter, recalculateGoertzelValues) {

    if (drawing || sampleCount === 0) {

        return;

    }

    const approximateRenderTime = estimateRenderTime();

    if (approximateRenderTime > DISABLE_BUTTON_BUSY_LENGTH) {

        disableUI(false);

    }

    if (resetColourMap) {

        console.log('Resetting colour map');
        spectrumMin = 0.0;
        spectrumMax = 0.0;

    }

    const thresholdTypeIndex = getThresholdTypeIndex();

    const filterIndex = getFilterRadioValue();

    if (filterIndex === FILTER_NONE && thresholdTypeIndex === THRESHOLD_TYPE_NONE) {

        processContents(downsampledUnfilteredSamples, false, true);

        return;

    }

    const renderSamples = getRenderSamples(reapplyFilter, updateThresholdedSampleArray, recalculateGoertzelValues);

    if (updateSpectrogram) {

        processContents(renderSamples, false, true);

    } else {

        drawPlots(renderSamples, false);

    }

}

/**
 * Display an error and then fade out after ERROR_DISPLAY_TIME ms
 * @param {string} message Error message
 * @param {string} title Optional title on error display
 */
function showErrorDisplay (message) {

    fileSpan.style.display = 'none';
    loadingSpan.style.display = 'none';
    errorSpan.style.display = '';
    errorSpan.innerHTML = message;

    setTimeout(() => {

        errorSpan.animate({opacity: 0}, {
            duration: 1000,
            easing: 'linear',
            iterations: 1,
            fill: 'backwards'
        }).onfinish = () => {

            errorSpan.style.display = 'none';
            fileSpan.style.display = '';

        };

    }, ERROR_DISPLAY_TIME);

}

/**
 * Process the result of loading a file
 * @param {object} result wavReader.js result object
 * @param {function} callback Function called after completion
 */
function processReadResult (result, callback) {

    if (!result.success) {

        console.error('Failed to read file');

        let errorMessage = result.error;

        if (result.error === 'Could not read input file.' || result.error === 'File is too large. Use the Split function in the AudioMoth Configuration App to split your recording into 60 second sections.') {

            errorMessage += '<br>';
            errorMessage += 'For more information, <u><a href="#faqs" style="color: white;">click here</a></u>.';

        }

        showErrorDisplay(errorMessage);

        reenableUI();

        return;

    }

    currentHeader = result.header;

    trueSampleRate = result.header.wavFormat.samplesPerSecond;
    trueSampleCount = result.samples.length;
    sampleRate = trueSampleRate;
    sampleCount = trueSampleCount;

    const lengthSecs = sampleCount / sampleRate;

    const loadedFileName = fileHandler ? fileHandler.name : 'Example file';
    console.log('------ ' + loadedFileName + ' ------');
    console.log('Loaded ' + sampleCount + ' samples at a sample rate of ' + sampleRate + ' Hz (' + lengthSecs + ' seconds)');

    callback(result);

}

/**
 * Read the contents of the file given by the current filehandler
 * @returns Samples read from file
 */
async function readFromFile (exampleFilePath, callback) {

    console.log('Reading samples');

    let result;

    if (exampleFilePath) {

        if (exampleResultObjects[exampleFilePath] === undefined) {

            const req = new XMLHttpRequest();

            req.open('GET', exampleFilePath, true);
            req.responseType = 'arraybuffer';

            req.onload = () => {

                const arrayBuffer = req.response; // Note: not oReq.responseText
                result = readWavContents(arrayBuffer);

                processReadResult(result, callback);

            };

            req.send(null);

        } else {

            result = exampleResultObjects[exampleFilePath];

            processReadResult(result, callback);

        }

    } else {

        if (!fileHandler) {

            console.error('No filehandler!');
            return [];

        }

        result = await readWav(fileHandler);

        processReadResult(result, callback);

    }

}

/**
 * Update what the maximum value for the zoom can be, based on the number of samples loaded
 */
function updateMaxZoom () {

    minDisplayLength = MIN_TIME_VIEW * getSampleRate();

}

/**
 * Add unit to file size
 * @param {number} fileSize File size in bytes
 * @returns String with correct unit
 */
function formatFileSize (fileSize) {

    fileSize = Math.round(fileSize / 1000);

    return fileSize + ' kB';

}

/**
 * Update panel with estimate of file size
 */
function updateFileSizePanel () {

    const totalSeconds = unfilteredSamples.length / getSampleRate();
    const totalFileSize = getSampleRate() * 2 * totalSeconds;

    const thresholdTypeIndex = getThresholdTypeIndex();

    if (thresholdTypeIndex !== THRESHOLD_TYPE_NONE) {

        const thresholdedSeconds = thresholdedValueCount / getSampleRate();

        const thresholdedFileSize = getSampleRate() * 2 * (totalSeconds - thresholdedSeconds);

        const compressionRatio = (thresholdedFileSize > 0) ? totalFileSize / thresholdedFileSize : 0;

        sizeInformationPanel.innerHTML = 'Original WAV file size: ' + formatFileSize(totalFileSize) + '. Resulting T.WAV file size: ' + formatFileSize(thresholdedFileSize) + '.<br>';

        sizeInformationPanel.innerHTML += 'Current threshold settings give a file compression ratio of ' + compressionRatio.toFixed(1) + '.';

    } else {

        sizeInformationPanel.innerHTML = 'File size: ' + formatFileSize(totalFileSize) + '.<br>';
        sizeInformationPanel.innerHTML += 'Enable triggering to estimate file size reduction.';

    }

}

/**
 * Load a file either from a user-selected location or a hosted example file
 * @param {string} exampleFilePath Path of an example recording if file isn't chosen by user
 * @param {string} exampleName Name of example file if file isn't chosen by user
 */
async function loadFile (exampleFilePath, exampleName) {

    let fileName;

    if (exampleFilePath) {

        console.log('Loading example file');

        fileName = exampleName;

    } else {

        const opts = {
            types: [
                {
                    description: 'WAV files',
                    accept: {
                        'audio/wav': ['.wav']
                    }
                }
            ],
            excludeAcceptAllOption: true,
            multiple: false
        };

        // Display file picker

        try {

            fileHandler = await window.showOpenFilePicker(opts);

        } catch (error) {

            console.error('Request was aborted.');
            console.error(error);
            return;

        }

        // If no file was selected, return

        if (!fileHandler) {

            fileSpan.innerText = 'No WAV files selected.';
            return;

        }

        fileHandler = fileHandler[0];

        fileName = fileHandler.name;

    }

    const prevSampleRate = sampleRate;

    // Display loading text

    if (errorSpan.style.display === 'none') {

        fileSpan.style.display = 'none';
        loadingSpan.style.display = '';

    }

    // Read samples

    await readFromFile(exampleFilePath, (result) => {

        const samples = result.samples;

        // If no samples can be read, return

        if (!samples) {

            return;

        }

        filteredSamples = new Array(sampleCount);

        // If file has been trimmed, display warning

        trimmedSpan.style.display = result.trimmed ? '' : 'none';

        // Reset threshold arrays

        samplesAboveThreshold = new Array(Math.ceil(samples.length / AMPLITUDE_THRESHOLD_BUFFER_LENGTH));
        samplesAboveGoertzelThreshold = new Array(samplesAboveThreshold.length);

        goertzelValues = [];

        // Reset UI

        resetTransformations();

        clearSVG(waveformThresholdLineSVG);

        // Fill sample arrays

        unfilteredSamples = samples;

        downsampledUnfilteredSamples = new Int16Array(sampleCount);

        const downsampleResult = downsample(unfilteredSamples, getTrueSampleRate(), downsampledUnfilteredSamples, getSampleRate());

        if (!downsampleResult.success) {

            console.error(downsampleResult.error);
            showErrorDisplay('Failed to downsample audio.');

            // Reset sample rate selection

            updateSampleRateUI(getTrueSampleRate());

            return;

        }

        // Update file name display

        fileSpan.innerText = fileName;

        // Work out what the maximum zoom level should be

        updateMaxZoom();

        // Reset values used to calculate colour map

        console.log('Resetting colour map');
        spectrumMin = 0.0;
        spectrumMax = 0.0;

        // Update filter range, resetting values if it's the first file loaded or the sliders have been observed

        const resetSliders = firstFile || prevSampleRate === undefined;

        const passFiltersObserved = getPassFiltersObserved();
        const centreObserved = getCentreObserved();

        sampleRateChange(resetSliders || !passFiltersObserved, resetSliders || !centreObserved, getSampleRate());
        updateSampleRateUI(getTrueSampleRate());

        if (resetSliders) {

            // Handle band/low/high-pass filter sliders

            const maxFreq = getSampleRate() / 2;
            const filterSliderStep = getFilterSliderStep(getSampleRate());

            const currentBandPassLower = Math.min(...bandPassFilterSlider.getValue());
            const currentBandPassHigher = Math.max(...bandPassFilterSlider.getValue());
            const currentLowPassFreq = lowPassFilterSlider.getValue();
            const currentHighPassFreq = highPassFilterSlider.getValue();

            const newBandPassLower = currentBandPassLower > maxFreq ? 0 : currentBandPassLower;
            const newBandPassHigher = currentBandPassHigher > maxFreq ? maxFreq : currentBandPassHigher;
            setBandPass(roundToSliderStep(newBandPassLower, filterSliderStep), roundToSliderStep(newBandPassHigher, filterSliderStep));

            const newLowPassFreq = currentLowPassFreq > maxFreq ? maxFreq : currentLowPassFreq;
            setLowPassSliderValue(roundToSliderStep(newLowPassFreq, filterSliderStep));

            const newHighPassFreq = currentHighPassFreq > maxFreq ? maxFreq : currentHighPassFreq;
            setHighPassSliderValue(roundToSliderStep(newHighPassFreq, filterSliderStep));

            updateFilterUI();

            updateFilterLabel();

            // Handle Goertzel filter slider

            const currentGoertzelFilterValue = getFrequencyTriggerFilterFreq();

            const newGoertzelFilterValue = currentGoertzelFilterValue > maxFreq ? maxFreq / 2 : currentGoertzelFilterValue;
            setFrequencyTriggerFilterFreq(newGoertzelFilterValue);

            updateThresholdUI();

        }

        // Enable "Are you sure you wish to navigate away from the page?" alert

        window.onbeforeunload = () => {

            return true;

        };

        // Create audio context to allow for playback

        createAudioContext();

        // Generate spectrogram frames and draw plots

        const thresholdTypeIndex = getThresholdTypeIndex();

        const filterIndex = getFilterRadioValue();

        // Flag that the first file has now been loaded

        firstFile = false;

        if (filterIndex === FILTER_NONE && thresholdTypeIndex === THRESHOLD_TYPE_NONE) {

            processContents(unfilteredSamples, true, true);

        } else {

            // Calculate spectrogram frames of unfiltered samples to create initial colour map

            processContents(unfilteredSamples, true, false);

            // Get filtered/thresholded samples

            const renderSamples = getRenderSamples(true, true);

            // Plot samples

            processContents(renderSamples, false, true);

        }

    });

}

/**
 * Load samples from all example files then render the first file
 * @param {boolean} devMode If testing locally, don't load example files as it will fail
 */
async function loadExampleFiles (devMode) {

    if (devMode) {

        disabledFileButton.style.display = 'none';
        fileButton.style.display = '';

        return;

    }

    console.log('Loading example files');

    drawing = true;

    spectrogramLoadingSVG.style.display = '';
    waveformLoadingSVG.style.display = '';

    for (let i = 0; i < exampleNames.length; i++) {

        await readFromFile(examplePaths[i], (result) => {

            console.log('Loaded', exampleNames[i]);

            exampleResultObjects[examplePaths[i]] = result;

            if (i === exampleNames.length - 1) {

                loadFile(examplePaths[0], exampleNames[0]);

            }

        });

    }

}

/**
 * Handle a new file being selected
 */
fileButton.addEventListener('click', () => {

    if (!drawing && !playing) {

        loadFile();

    }

});

/**
 * Handle example files being selected
 */
for (let i = 0; i < examplePaths.length; i++) {

    exampleLinks[i].addEventListener('click', () => {

        if (!drawing && !playing) {

            loadFile(examplePaths[i], exampleNames[i]);

        }

    });

}

/**
 * Handle start of a zoom drag event
 * @param {event} e Drag event
 */
function handleMouseDown (e) {

    // If it's not a left click, ignore it

    if (e.button !== 0) {

        return;

    }

    // If samples have been loaded and drawing a plot isn't currently underway

    if (sampleCount !== 0 && !drawing && !playing) {

        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();

        // Update drag start location

        dragStartX = e.clientX - rect.left;

        isDragging = true;

    }

}

// Assign listeners to both spectrogram and waveform overlay canvases to allow a zoom drag to start on either

spectrogramDragCanvas.addEventListener('mousedown', handleMouseDown);
waveformDragCanvas.addEventListener('mousedown', handleMouseDown);
goertzelDragCanvas.addEventListener('mousedown', handleMouseDown);

/**
 * Draw the alpha-ed overlay rectangle to the given canvas
 * @param {object} canvas Canvas being drawn to
 * @param {number} dragCurrentX The end of the drag area
 */
function drawZoomOverlay (canvas, dragCurrentX) {

    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Lock drag area to plot

    let dragBoxEnd = Math.min(dragCurrentX, canvas.width);
    dragBoxEnd = Math.max(dragBoxEnd, 0);

    // Draw a light grey box with a black outline

    ctx.fillStyle = 'lightgrey';
    ctx.globalAlpha = 0.5;
    ctx.fillRect(dragStartX, 0, dragBoxEnd - dragStartX, canvas.height);

    ctx.fillStyle = 'black';
    ctx.strokeRect(dragStartX, 0, dragBoxEnd - dragStartX, canvas.height);

}

/**
 * If drag is in process, update drag UI
 * @param {number} dragCurrentX Current mouse location
 */
function handleMouseMove (dragCurrentX) {

    // If dragging has started, samples are available and a plot is not currently being drawn

    if (isDragging && sampleCount !== 0 && !drawing && !playing) {

        // Draw zoom areas on each canvas

        drawZoomOverlay(spectrogramDragCanvas, dragCurrentX);
        drawZoomOverlay(waveformDragCanvas, dragCurrentX);
        drawZoomOverlay(goertzelDragCanvas, dragCurrentX);

    }

}

/**
 * End dragging action
 * @param {number} dragEndX Location where mouse was lifted
 */
function dragZoom (dragEndX) {

    // If dragging has started, samples are available and a plot is not currently being drawn

    if (isDragging && sampleCount !== 0 && !drawing && !playing) {

        isDragging = false;

        // Clear zoom overlay canvases

        const specCtx = spectrogramDragCanvas.getContext('2d');
        specCtx.clearRect(0, 0, spectrogramDragCanvas.width, spectrogramDragCanvas.height);
        const wavCtx = waveformDragCanvas.getContext('2d');
        wavCtx.clearRect(0, 0, waveformDragCanvas.width, waveformDragCanvas.height);
        const goertzelCtx = goertzelDragCanvas.getContext('2d');
        goertzelCtx.clearRect(0, 0, goertzelDragCanvas.width, goertzelDragCanvas.height);

        if (dragEndX === dragStartX) {

            return;

        }

        // Calculate new zoom value

        let newDisplayLength = Math.floor(displayLength * (Math.abs(dragStartX - dragEndX) / spectrogramDragCanvas.width));

        const dragLeft = Math.min(dragStartX, dragEndX);
        const dragRight = Math.max(dragStartX, dragEndX);

        let newOffset;

        if (newDisplayLength >= minDisplayLength) {

            console.log('Zooming to display selected area');

            // Calculate new offset value

            newOffset = offset + Math.round(displayLength * dragLeft / spectrogramDragCanvas.width);

        } else {

            console.log('Zoomed max amount, moving offset to centre of dragged area');

            // Zoom to max zoom level and centre plot on selected centre

            newDisplayLength = minDisplayLength;

            const dragDiff = dragRight - dragLeft;
            const dragCentre = dragLeft + (dragDiff / 2);
            const dragCentreSamples = Math.round(displayLength * dragCentre / spectrogramDragCanvas.width);

            newOffset = offset + dragCentreSamples - (newDisplayLength / 2);

        }

        newOffset = (newOffset < 0) ? 0 : newOffset;

        // Set new zoom/offset values

        displayLength = newDisplayLength;
        offset = newOffset;

        removeEndGap();

        // Redraw plots

        setTimeout(() => {

            updatePlots(false, true, false, false, false);

        }, 10);

        updateNavigationUI();

    }

}

// Handle mouse events anywhere on the page

document.addEventListener('mouseup', (e) => {

    // If it's not a left click, ignore it

    if (e.button !== 0 || !isDragging) {

        return;

    }

    const w = spectrogramDragCanvas.width;

    // Get end of zoom drag

    const rect = spectrogramDragCanvas.getBoundingClientRect();
    let dragEndX = Math.min(w, Math.max(0, e.clientX - rect.left));

    dragEndX = (dragEndX < 0) ? 0 : dragEndX;
    dragEndX = (dragEndX > w) ? w : dragEndX;

    dragZoom(dragEndX);

});

document.addEventListener('mousemove', (e) => {

    if (!isDragging) {

        return;

    }

    const rect = spectrogramDragCanvas.getBoundingClientRect();
    const dragCurrentX = e.clientX - rect.left;

    handleMouseMove(dragCurrentX);

});

/**
 * Handle canvas being double clicked on by zooming in, centred on the click location
 * @param {event} e Double click event
 */
function handleDoubleClick (e) {

    // If it's not a left click, ignore it

    if (e.button !== 0) {

        return;

    }

    // Clear zoom overlay canvases

    const specCtx = spectrogramDragCanvas.getContext('2d');
    specCtx.clearRect(0, 0, spectrogramDragCanvas.width, spectrogramDragCanvas.height);
    const wavCtx = waveformDragCanvas.getContext('2d');
    wavCtx.clearRect(0, 0, waveformDragCanvas.width, waveformDragCanvas.height);
    const goertzelCtx = goertzelDragCanvas.getContext('2d');
    goertzelCtx.clearRect(0, 0, goertzelDragCanvas.width, goertzelDragCanvas.height);

    // If samples have been loaded and drawing a plot isn't currently underway

    if (sampleCount !== 0 && !drawing && !playing) {

        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();

        const clickX = e.clientX - rect.left;

        const clickCentreSamples = Math.round(displayLength * clickX / spectrogramDragCanvas.width);

        const newDisplayLength = Math.floor(displayLength / ZOOM_MULTIPLIER);

        // If zoom is at max, just move offset to clicked location

        if (newDisplayLength >= minDisplayLength) {

            displayLength = newDisplayLength;

        } else {

            displayLength = minDisplayLength;

        }

        let newOffset = offset + clickCentreSamples;

        newOffset -= Math.round(displayLength / 2);

        newOffset = (newOffset < 0) ? 0 : newOffset;

        offset = newOffset;

        removeEndGap();

        // Redraw plots

        setTimeout(() => {

            updatePlots(false, true, false, false, false);

        }, 10);

        updateNavigationUI();

    }

}

spectrogramDragCanvas.addEventListener('dblclick', handleDoubleClick);
waveformDragCanvas.addEventListener('dblclick', handleDoubleClick);
goertzelDragCanvas.addEventListener('dblclick', handleDoubleClick);

// Add amplitude threshold scale listener

amplitudeThresholdScaleSelect.addEventListener('change', function () {

    setAmplitudeThresholdScaleIndex(parseInt(amplitudeThresholdScaleSelect.value));

    const filterIndex = getFilterRadioValue();

    // If mode is changed to or from decibel, the scale of the waveform plot has changed slightly, so redraw

    if (thresholdScaleIndex === THRESHOLD_SCALE_DECIBEL || prevThresholdScaleIndex === THRESHOLD_SCALE_DECIBEL) {

        if (filterIndex === FILTER_NONE) {

            drawWaveformPlot(downsampledUnfilteredSamples, false);

        } else {

            drawWaveformPlot(filteredSamples, false);

        }

    }

    drawAxisLabels();

    const thresholdTypeIndex = getThresholdTypeIndex();

    if (thresholdTypeIndex === THRESHOLD_TYPE_AMPLITUDE) {

        handleAmplitudeThresholdChange();

        drawAmplitudeThresholdLines();

    }

});

/**
 * Run updatePlots function without refreshing the colour map, recalculating the spectrogram frames
 */
function handleFilterChange () {

    updatePlots(false, true, true, true, false);

}

bandPassFilterSlider.on('slideStop', handleFilterChange);
lowPassFilterSlider.on('slideStop', handleFilterChange);
highPassFilterSlider.on('slideStop', handleFilterChange);

/**
 * Handle event when a different threshold type is selected
 * @param {event} e Threshold type change event
 */
function handleThresholdTypeChange (e) {

    if (sampleCount === 0 || drawing || playing) {

        e.preventDefault();
        e.stopPropagation();

        return;

    }

    const thresholdTypeIndex = getThresholdTypeIndex();

    if (thresholdTypeIndex === THRESHOLD_TYPE_GOERTZEL) {

        amplitudeThresholdScaleSelect.value = THRESHOLD_SCALE_PERCENTAGE;
        amplitudeThresholdScaleSelect.disabled = true;

    } else {

        amplitudeThresholdScaleSelect.value = thresholdScaleIndex;
        amplitudeThresholdScaleSelect.disabled = false;

    }

    updatePlots(false, true, true, false, false);

    if (thresholdTypeIndex === THRESHOLD_TYPE_NONE) {

        playbackModeSelect.value = 0;

    }

    setTimeout(() => {

        updateThresholdTypePlaybackUI();
        updateThresholdUI();

    }, 10);

}

for (let i = 0; i < thresholdTypeRadioButtons.length; i++) {

    thresholdTypeRadioButtons[i].addEventListener('change', handleThresholdTypeChange);

}

/**
 * Run updatePlots function without refreshing the colour map, recalculating the spectrogram frames
 */
function handleAmplitudeThresholdChange () {

    updatePlots(false, false, true, false, false);

}

amplitudeThresholdSlider.on('slideStop', handleAmplitudeThresholdChange);
amplitudeThresholdSlider.on('change', drawAmplitudeThresholdLines);

for (let i = 0; i < amplitudeThresholdDurationRadioButtons.length; i++) {

    amplitudeThresholdDurationRadioButtons[i].addEventListener('change', handleAmplitudeThresholdChange);

}

/**
 * Handle event when the Goertzel filter changes
 * @param {event} e Value change event
 */
function handleGoertzelFilterChange (e) {

    if (sampleCount === 0 || drawing || playing) {

        e.preventDefault();
        e.stopPropagation();

        return;

    }

    updateThresholdUI();
    updatePlots(false, false, true, false, true);

}

goertzelFilterCentreSlider.on('slideStop', handleGoertzelFilterChange);
goertzelFilterCentreSlider.on('change', drawGoertzelFilter);

for (let i = 0; i < goertzelFilterWindowRadioButtons.length; i++) {

    goertzelFilterWindowRadioButtons[i].addEventListener('change', (e) => {

        const windowLength = getFrequencyTriggerWindowLength();
        generateHammingValues(windowLength);

        handleGoertzelFilterChange(e);

    });

}

/**
 * Handle event when the Goertzel filter threshold changes without the filter itself changing
 * @param {event} e Value change event
 */
function handleGoertzelThresholdChange (e) {

    if (sampleCount === 0 || drawing || playing) {

        e.preventDefault();
        e.stopPropagation();

        return;

    }

    updateThresholdUI();
    updatePlots(false, false, true, false, false);

}

for (let i = 0; i < goertzelDurationRadioButtons.length; i++) {

    goertzelDurationRadioButtons[i].addEventListener('change', handleGoertzelThresholdChange);

}

goertzelThresholdSlider.on('slideStop', handleGoertzelThresholdChange);
goertzelThresholdSlider.on('change', drawGoertzelThresholdLine);

/**
 * Reset button event
 */
function reset () {

    if (sampleCount !== 0 && !drawing && !playing) {

        sampleRate = getTrueSampleRate();

        resetElements();

        sampleRateChange(true, true, getSampleRate());
        updateSampleRateUI(getTrueSampleRate());

        const downsampleResult = downsample(unfilteredSamples, getTrueSampleRate(), downsampledUnfilteredSamples, sampleRate);

        if (!downsampleResult.success) {

            console.error(downsampleResult.error);
            showErrorDisplay('Failed to downsample audio.');

            // Reset sample rate selection

            updateSampleRateUI(getTrueSampleRate());

            return;

        }

        sampleCount = downsampleResult.length;

        updateFilterUI();
        updateThresholdTypePlaybackUI();
        updateThresholdUI();

        setCentreObserved(false);
        setPassFiltersObserved(false);

        playbackModeSelect.value = 0;

        updatePlots(true, true, true, true, true);

        resetXTransformations();

    }

}

resetButton.addEventListener('click', reset);

// Add sample rate UI listeners

addSampleRateUIListeners(() => {

    const oldSampleRate = sampleRate;
    sampleRate = getSampleRateSelection();

    const passFiltersObserved = getPassFiltersObserved();
    const centreObserved = getCentreObserved();
    sampleRateChange(!passFiltersObserved, !centreObserved, getSampleRate());

    const downsampleResult = downsample(unfilteredSamples, trueSampleRate, downsampledUnfilteredSamples, sampleRate);

    if (!downsampleResult.success) {

        console.error(downsampleResult.error);
        showErrorDisplay('Failed to downsample audio.');

        // Reset sample rate selection

        updateSampleRateUI(getTrueSampleRate());

        return;

    }

    sampleCount = downsampleResult.length;

    // Scale the offset and display length to take into account the new downsampled sample rate

    const downsampleMultiplier = sampleRate / oldSampleRate;
    offset = Math.floor(offset * downsampleMultiplier);
    displayLength = Math.floor(displayLength * downsampleMultiplier);

    // Reset colour map here, rather than as part of updatePlots() so the max and min don't use the possibly filtered values

    console.log('Resetting colour map');
    spectrumMin = 0.0;
    spectrumMax = 0.0;

    processContents(downsampledUnfilteredSamples, false, false);

    drawing = false;

    updateFilterUI();
    updateThresholdTypePlaybackUI();
    updateThresholdUI();

    updatePlots(false, true, true, true, true);

});

// Add filter slider listeners which update the information label

bandPassFilterSlider.on('change', updateFilterLabel);
lowPassFilterSlider.on('change', updateFilterLabel);
highPassFilterSlider.on('change', updateFilterLabel);

/**
 * Add home, zoom and pan control to buttons
 */
function resetNavigation () {

    resetXTransformations();
    updatePlots(false, true, false, false, false);

}

homeButton.addEventListener('click', () => {

    if (sampleCount !== 0 && !drawing && !playing) {

        resetNavigation();

    }

});

zoomInButton.addEventListener('click', zoomIn);
zoomOutButton.addEventListener('click', zoomOut);

panLeftButton.addEventListener('click', panLeft);
panRightButton.addEventListener('click', panRight);

// Add navigation control for waveform y axis

waveformHomeButton.addEventListener('click', resetZoomY);

waveformZoomInButton.addEventListener('click', zoomInY);
waveformZoomOutButton.addEventListener('click', zoomOutY);

/**
 * Export configuration to file which can be read by the AudioMoth Configuration App
 */
function exportConfig () {

    if (sampleCount === 0 || drawing || playing) {

        return;

    }

    const filterIndex = getFilterRadioValue();
    let filterValue0 = 0;
    let filterValue1 = 0;

    switch (filterIndex) {

    case FILTER_LOW:
        filterValue1 = lowPassFilterSlider.getValue();
        break;
    case FILTER_HIGH:
        filterValue0 = highPassFilterSlider.getValue();
        break;
    case FILTER_NONE:
    case FILTER_BAND:
        filterValue0 = Math.min(...bandPassFilterSlider.getValue());
        filterValue1 = Math.max(...bandPassFilterSlider.getValue());
        break;

    }

    const minimumTriggerDuration = getMinimumAmplitudeThresholdDuration();

    const thresholdScales = ['percentage', '16bit', 'decibel'];

    const amplitudeThresholdValues = getAmplitudeThresholdValues();

    let amplitudeThreshold = 0;

    switch (thresholdScaleIndex) {

    case THRESHOLD_SCALE_PERCENTAGE:

        amplitudeThreshold = parseFloat(amplitudeThresholdValues.percentage);
        break;

    case THRESHOLD_SCALE_16BIT:

        amplitudeThreshold = amplitudeThresholdValues.amplitude;
        break;

    case THRESHOLD_SCALE_DECIBEL:

        amplitudeThreshold = amplitudeThresholdValues.decibels;
        break;

    }

    const frequencyTriggerValues = getFrequencyTriggerValues();

    let frequencyTrigger = 0;

    switch (thresholdScaleIndex) {

    case THRESHOLD_SCALE_PERCENTAGE:

        frequencyTrigger = parseFloat(frequencyTriggerValues.percentage);
        break;

    case THRESHOLD_SCALE_16BIT:

        frequencyTrigger = frequencyTriggerValues.amplitude;
        break;

    case THRESHOLD_SCALE_DECIBEL:

        frequencyTrigger = frequencyTriggerValues.decibels;
        break;

    }

    const frequencyTriggerWindowLength = getFrequencyTriggerWindowLength();

    const thresholdTypeIndex = getThresholdTypeIndex();

    const filterType = getFilterType();

    const passFiltersEnabled = thresholdTypeIndex !== THRESHOLD_TYPE_GOERTZEL && filterType !== 'none';

    const settings = {
        version: 'playground',
        sampleRate: getSampleRate(),
        passFiltersEnabled: passFiltersEnabled,
        filterType: filterType,
        lowerFilter: filterValue0,
        higherFilter: filterValue1,
        amplitudeThresholdingEnabled: thresholdTypeIndex === THRESHOLD_TYPE_AMPLITUDE,
        amplitudeThreshold: amplitudeThreshold,
        minimumAmplitudeThresholdDuration: minimumTriggerDuration,
        amplitudeThresholdScale: thresholdScales[thresholdScaleIndex],
        frequencyTriggerEnabled: thresholdTypeIndex === THRESHOLD_TYPE_GOERTZEL,
        frequencyTriggerCentreFrequency: goertzelFilterCentreSlider.getValue(),
        frequencyTriggerWindowLength: frequencyTriggerWindowLength,
        frequencyTriggerThreshold: frequencyTrigger,
        minimumFrequencyTriggerDuration: minimumTriggerDuration,
        frequencyTriggerThresholdScale: thresholdScales[thresholdScaleIndex]
    };

    const content = 'data:text/json;charset=utf-8,' + JSON.stringify(settings);

    const encodedUri = encodeURI(content);

    // Create hidden <a> tag to apply download to

    const link = document.createElement('a');

    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'audiomoth_filter.config');
    document.body.appendChild(link);

    // Click link

    link.click();

}

exportButton.addEventListener('click', exportConfig);

/**
 * Get playback rate value from slider
 * @returns Rate to play audio at
 */
function getPlaybackRate () {

    return playbackRates[playbackSpeedSlider.getValue()];

}

/**
 * PLAYBACK_MODE_ALL (0) - Play all samples
 * PLAYBACK_MODE_MUTE (1) - Mute samples below the chosen amplitude threshold
 * PLAYBACK_MODE_SKIP (2) - Skip samples below the amplitude threshold
 * @returns Playback mode selected
 */
function getPlaybackMode () {

    let playbackMode = parseInt(playbackModeSelect.value);

    // If amplitude threshold isn't on, all modes are equivalent to playing all samples

    const thresholdTypeIndex = getThresholdTypeIndex();

    playbackMode = (thresholdTypeIndex !== THRESHOLD_TYPE_NONE) ? playbackMode : PLAYBACK_MODE_ALL;

    return playbackMode;

}

/**
 * Draw a line which shows how far through a recording the playback is
 */
function playAnimation () {

    const waveformCtx = waveformPlaybackCanvas.getContext('2d');
    const waveformW = waveformPlaybackCanvas.width;
    const waveformH = waveformPlaybackCanvas.height;

    const spectrogramCtx = spectrogramPlaybackCanvas.getContext('2d');
    const spectrogramH = spectrogramPlaybackCanvas.height;

    const goertzelCtx = goertzelPlaybackCanvas.getContext('2d');
    const goertzelH = goertzelPlaybackCanvas.height;

    // Get current playback information

    const playbackRate = getPlaybackRate();

    const displayedTime = displayLength / getSampleRate();
    const progress = getTimestamp() / displayedTime * playbackRate;

    const playbackMode = getPlaybackMode();

    // Calculate x co-ordinate of playback marker

    let x = 0;

    if (playbackMode === PLAYBACK_MODE_SKIP) {

        // If playback mode skips thresholded periods, used previously calculated X axis values

        let index = Math.round(getTimestamp() * getSampleRate() * playbackRate);
        index = Math.min(index, skippingXCoords.length - 1);

        x = skippingXCoords[index];

    } else {

        x = progress * waveformW;

    }

    // Draw on waveform canvas

    resetCanvas(waveformPlaybackCanvas);

    waveformCtx.strokeStyle = 'red';
    waveformCtx.lineWidth = 1;

    waveformCtx.moveTo(x, 0);
    waveformCtx.lineTo(x, waveformH);
    waveformCtx.stroke();

    // Draw on spectrogram canvas

    resetCanvas(spectrogramPlaybackCanvas);

    spectrogramCtx.strokeStyle = 'red';
    spectrogramCtx.lineWidth = 1;

    spectrogramCtx.moveTo(x, 0);
    spectrogramCtx.lineTo(x, spectrogramH);
    spectrogramCtx.stroke();

    // Draw on Goertzel canvas

    resetCanvas(goertzelPlaybackCanvas);

    goertzelCtx.strokeStyle = 'red';
    goertzelCtx.lineWidth = 1;

    goertzelCtx.moveTo(x, 0);
    goertzelCtx.lineTo(x, goertzelH);
    goertzelCtx.stroke();

    // Set timer for next update

    animationTimer = setTimeout(playAnimation, 1);

}

/**
 * Event called when playback is either manually stopped or finishes
 */
function stopEvent () {

    // Update playing status

    playing = false;

    // Reenable UI

    reenableUI();

    // Switch from stop icon to play icon

    playIcon.style.display = '';
    stopIcon.style.display = 'none';

    // Switch colour of button

    playButton.classList.remove('btn-danger');
    playButton.classList.add('btn-success');

    // Stop animation loop

    clearTimeout(animationTimer);

    // Get final position of playback line

    const waveformCtx = waveformPlaybackCanvas.getContext('2d');
    const waveformH = waveformPlaybackCanvas.height;

    const spectrogramCtx = spectrogramPlaybackCanvas.getContext('2d');
    const spectrogramW = spectrogramPlaybackCanvas.width;
    const spectrogramH = spectrogramPlaybackCanvas.height;

    const playbackMode = getPlaybackMode();

    let x = spectrogramW;

    if (playbackMode === PLAYBACK_MODE_SKIP) {

        x = skippingXCoords[skippingXCoords.length - 1];

    }

    resetCanvas(waveformPlaybackCanvas);

    resetCanvas(spectrogramPlaybackCanvas);
    resetCanvas(goertzelPlaybackCanvas);

    if (!manuallyStopped) {

        // Draw line briefly on waveform canvas

        waveformCtx.strokeStyle = 'red';
        waveformCtx.lineWidth = 1;

        waveformCtx.moveTo(x, 0);
        waveformCtx.lineTo(x, waveformH);
        waveformCtx.stroke();

        // Draw line briefly on spectrogram canvas

        spectrogramCtx.strokeStyle = 'red';
        spectrogramCtx.lineWidth = 1;

        spectrogramCtx.moveTo(x, 0);
        spectrogramCtx.lineTo(x, spectrogramH);
        spectrogramCtx.stroke();

        setTimeout(() => {

            resetCanvas(waveformPlaybackCanvas);

            resetCanvas(spectrogramPlaybackCanvas);
            resetCanvas(goertzelPlaybackCanvas);

        }, 100);

    }

    manuallyStopped = false;

}

/**
 * Play audio button
 */
playButton.addEventListener('click', () => {

    if (sampleCount === 0 || drawing) {

        return;

    }

    if (playing) {

        manuallyStopped = true;

        // If already playing, stop

        stopAudio();

        reenableUI();

    } else {

        // Update playing status

        playing = true;

        const playbackRate = getPlaybackRate();

        // If the recording will be playing for more than DISABLE_BUTTON_BUSY_LENGTH, disable the buttons so it's clear they don't work

        if (displayLength / getSampleRate() / playbackRate > DISABLE_BUTTON_BUSY_LENGTH) {

            fileButton.disabled = true;

            homeButton.disabled = true;
            zoomInButton.disabled = true;
            zoomOutButton.disabled = true;
            panLeftButton.disabled = true;
            panRightButton.disabled = true;

            waveformHomeButton.disabled = true;
            waveformZoomInButton.disabled = true;
            waveformZoomOutButton.disabled = true;

            for (let i = 0; i < thresholdTypeRadioButtons.length; i++) {

                thresholdTypeRadioButtons[i].disabled = true;

            }

            disableSampleRateControl();

            resetButton.disabled = true;
            exportButton.disabled = true;
            exportModalButton.disabled = true;
            exportAudioButton.disabled = true;

            disableSlider(playbackSpeedSlider, playbackSpeedDiv);
            playbackModeSelect.disabled = true;

        }

        // Otherwise, disable UI then play

        disableUI(false);
        playButton.disabled = false;

        // Switch from play icon to stop icon

        playIcon.style.display = 'none';
        stopIcon.style.display = '';

        // Switch play button colour

        playButton.classList.remove('btn-success');
        playButton.classList.add('btn-danger');

        // Get mode which dictates how amplitude thresholded periods are handled

        const playbackMode = getPlaybackMode();

        // Get currently displayed samples to play

        const filterIndex = getFilterRadioValue();

        const samples = (filterIndex !== FILTER_NONE && playbackMode !== PLAYBACK_MODE_ALL) ? filteredSamples : downsampledUnfilteredSamples;

        let playbackBufferLength = displayLength;

        const thresholdTypeIndex = getThresholdTypeIndex();

        // If playback mode is to skip thresholded periods, build an array of X axis locations which map to playback progress

        if (playbackMode === PLAYBACK_MODE_SKIP) {

            // Create x coordinate map

            skippingXCoords = new Array(displayLength).fill(0);

            const waveformW = waveformPlaybackCanvas.width;

            let n = 0;

            const displayedTime = displayLength / getSampleRate();

            // Create mapping from sample index to x coordinate

            const start = Math.floor(offset / AMPLITUDE_THRESHOLD_BUFFER_LENGTH);
            const end = Math.floor((offset + displayLength - 1) / AMPLITUDE_THRESHOLD_BUFFER_LENGTH);

            for (let i = start; i <= end; i++) {

                const sampleIndex = i * AMPLITUDE_THRESHOLD_BUFFER_LENGTH;

                const sampleAboveThreshold = (thresholdTypeIndex === THRESHOLD_TYPE_GOERTZEL) ? samplesAboveGoertzelThreshold[i] : samplesAboveThreshold[i];

                if (sampleAboveThreshold) {

                    // Add an x coordinate for each sample within the period above the threshold

                    for (let j = 0; j < AMPLITUDE_THRESHOLD_BUFFER_LENGTH; j++) {

                        const periodSample = sampleIndex + j - offset;

                        if (periodSample >= 0 && periodSample < displayLength) {

                            let xCoord = periodSample / getSampleRate() / displayedTime;
                            xCoord *= waveformW;

                            skippingXCoords[n] = xCoord;
                            n++;

                        }

                    }

                }

            }

            // Reduce length to just unthresholded samples on screen

            skippingXCoords.length = n;
            playbackBufferLength = n;

        }

        // Play the samples

        if (playbackBufferLength > 0) {

            if (thresholdTypeIndex === THRESHOLD_TYPE_GOERTZEL) {

                playAudio(samples, samplesAboveGoertzelThreshold, offset, displayLength, getSampleRate(), playbackRate, playbackMode, playbackBufferLength, stopEvent);

            } else {

                playAudio(samples, samplesAboveThreshold, offset, displayLength, getSampleRate(), playbackRate, playbackMode, playbackBufferLength, stopEvent);

            }

            // Start animation loop

            playAnimation();

        } else {

            stopEvent();

        }

    }

});

// Export UI

function exportImage (exportFunction) {

    let plot0yAxis = 'Amplitude';
    const plot1yAxis = 'Frequency';

    const canvas0array = [];
    const canvas1array = [spectrogramCanvas];

    let yAxis0svg = waveformLabelSVG;
    const yAxis1svg = spectrogramLabelSVG;

    let linesY0 = [-1];
    let linesY1 = [-1];

    let offsetFromCentre;
    const centre = waveformThresholdLineSVG.height.baseVal.value / 2;

    const goertzelH = goertzelThresholdLineSVG.height.baseVal.value;

    const spectrogramH = spectrogramGoertzelCanvas.height;
    const nyquist = sampleRate / 2.0;

    // Each threshold mode has its own axis labels and combination of canvas layers

    switch (getThresholdTypeIndex()) {

    case THRESHOLD_TYPE_AMPLITUDE:

        canvas0array.push(waveformCanvas);
        canvas0array.push(waveformThresholdCanvas);

        canvas1array.push(spectrogramThresholdCanvas);

        offsetFromCentre = getAmplitudeThresholdLineOffset();

        linesY0 = [centre - offsetFromCentre, centre + offsetFromCentre];

        break;

    case THRESHOLD_TYPE_GOERTZEL:

        canvas0array.push(goertzelCanvas);
        canvas0array.push(goertzelThresholdCanvas);

        canvas1array.push(spectrogramThresholdCanvas);
        canvas1array.push(spectrogramGoertzelCanvas);

        plot0yAxis = 'Frequency Response';

        yAxis0svg = goertzelLabelSVG;

        linesY0 = [goertzelH - (goertzelH * getFrequencyTrigger() / 100.0 * getGoertzelZoomY())];
        linesY1 = [spectrogramH - (spectrogramH * getFrequencyTriggerFilterFreq() / nyquist)];

        break;

    case THRESHOLD_TYPE_NONE:

        canvas0array.push(waveformCanvas);

        break;

    }

    let title = fileSpan.innerText;

    for (let i = 0; i < exampleNames.length; i++) {

        if (title.includes(exampleNames[i])) {

            title += ' Example';
            break;

        }

    }

    exportFunction(canvas0array, canvas1array, timeLabelSVG, yAxis0svg, yAxis1svg, plot0yAxis, plot1yAxis, linesY0, linesY1, fileSpan.innerText, title);

}

exportPNGButton.addEventListener('click', () => {

    exportImage(exportPNG);

    exportCloseButton.click();

});

exportPDFButton.addEventListener('click', () => {

    exportImage(exportPDF);

    exportCloseButton.click();

});

exportBothButton.addEventListener('click', () => {

    exportImage(exportPNG);
    exportImage(exportPDF);

    exportCloseButton.click();

});

function handleExportAudioResult (err) {

    if (err) {

        console.error(err);

        showErrorDisplay(err);

    }

}

exportAudioButton.addEventListener('click', () => {

    // Get mode which dictates how amplitude thresholded periods are handled

    const playbackMode = getPlaybackMode();

    // Get currently displayed samples to play

    const filterIndex = getFilterRadioValue();

    const samples = (filterIndex !== FILTER_NONE && playbackMode !== PLAYBACK_MODE_ALL) ? filteredSamples : downsampledUnfilteredSamples;

    let playbackBufferLength = displayLength;

    const thresholdTypeIndex = getThresholdTypeIndex();

    // If playback mode is to skip thresholded periods, build an array of X axis locations which map to playback progress

    if (playbackMode === PLAYBACK_MODE_SKIP) {

        // Create x coordinate map

        skippingXCoords = new Array(displayLength).fill(0);

        const waveformW = waveformPlaybackCanvas.width;

        let n = 0;

        const displayedTime = displayLength / getSampleRate();

        // Create mapping from sample index to x coordinate

        const start = Math.floor(offset / AMPLITUDE_THRESHOLD_BUFFER_LENGTH);
        const end = Math.floor((offset + displayLength - 1) / AMPLITUDE_THRESHOLD_BUFFER_LENGTH);

        for (let i = start; i <= end; i++) {

            const sampleIndex = i * AMPLITUDE_THRESHOLD_BUFFER_LENGTH;

            const sampleAboveThreshold = (thresholdTypeIndex === THRESHOLD_TYPE_GOERTZEL) ? samplesAboveGoertzelThreshold[i] : samplesAboveThreshold[i];

            if (sampleAboveThreshold) {

                // Add an x coordinate for each sample within the period above the threshold

                for (let j = 0; j < AMPLITUDE_THRESHOLD_BUFFER_LENGTH; j++) {

                    const periodSample = sampleIndex + j - offset;

                    if (periodSample >= 0 && periodSample < displayLength) {

                        let xCoord = periodSample / getSampleRate() / displayedTime;
                        xCoord *= waveformW;

                        skippingXCoords[n] = xCoord;
                        n++;

                    }

                }

            }

        }

        // Reduce length to just unthresholded samples on screen

        skippingXCoords.length = n;
        playbackBufferLength = n;

    }

    // Export audio as WAV file

    if (playbackBufferLength > 0) {

        let fileName = fileSpan.innerText;
        fileName = (fileName.toLowerCase().includes('.wav')) ? fileName : fileName + '.wav';

        if (thresholdTypeIndex === THRESHOLD_TYPE_GOERTZEL) {

            exportAudio(samples, samplesAboveGoertzelThreshold, offset, displayLength, getSampleRate(), playbackMode, playbackBufferLength, currentHeader, fileName, handleExportAudioResult);

        } else {

            exportAudio(samples, samplesAboveThreshold, offset, displayLength, getSampleRate(), playbackMode, playbackBufferLength, currentHeader, fileName, handleExportAudioResult);

        }

    } else {

        showErrorDisplay('File was not written. File length would be 0 samples.');

    }

});

// Start zoom and offset level on default values

resetTransformations();

// Add filler axis labels

drawAxisLabels();
drawAxisHeadings();
drawBorders();

// Prepare threshold UI

updateThresholdTypePlaybackUI();
updateThresholdUI();

// Prepare filter UI
// First 2 arguments only used in Config app

prepareUI(null, null, () => {

    // If a Goertzel value has been changed, don't rescale the values to defaults as sample rate changes
    const passFiltersObserved = getPassFiltersObserved();
    const centreObserved = getCentreObserved();
    sampleRateChange(!passFiltersObserved, !centreObserved, getSampleRate());
    handleFilterChange();

});

updateFilterUI();
updateFilterLabel();

// Disable controls until file is loaded

disableUI(true);

// Draw loading SVG texts

drawLoadingImage(waveformLoadingSVG);
drawLoadingImage(spectrogramLoadingSVG);

// Display error if current browser is not Chrome

const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

if (!isChrome) {

    fileSelectionTitleDiv.classList.add('grey');
    browserErrorSpans.style.display = '';
    fileSelectionTitleSpan.style.display = 'none';
    disabledFileButton.style.display = '';
    fileButton.style.display = 'none';

}

// Check for dev mode

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

if (urlParams.get('dev')) {

    console.log('DEV MODE - Files will not be loaded automatically.');
    loadExampleFiles(true);

} else {

    loadExampleFiles();

}
