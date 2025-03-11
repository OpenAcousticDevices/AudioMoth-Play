/****************************************************************************
 * index.js
 * openacousticdevices.info
 * June 2021
 *****************************************************************************/

/* global XMLHttpRequest, bootstrap */
/* global INT16_MAX, LENGTH_OF_WAV_HEADER, DATE_REGEX, TIMESTAMP_REGEX, SECONDS_IN_DAY, MIN_SAMPLE_RATE */
/* global STATIC_COLOUR_MIN, STATIC_COLOUR_MAX */
/* global Y_LABEL_COUNTS */

/* global showLowFrequencyTabs, hideLowFrequencyTabs, addLowFrequencyRadioButtonListeners, isLowFrequencyTabEnabled, addLowFrequencyTabCloseListener, addLowFrequencyTabOpenListener, standardTabButton, enableLowFrequencyControls, disableLowFrequencyControls */

/* global calculateSpectrogramFrames, drawSpectrogram, drawWaveform, readWav, readExampleWav, checkHeader, readGuano */
/* global showSliceLoadingUI, hideSliceLoadingUI, loadPreview, drawPreviewWaveform, updateSelectionSpan, drawSliceSelection, showSliceModal, hideSliceModal, setSliceSelectButtonEventHandler, setSliceCancelButtonListener, saveCurrentSlicePosition, usePreviewSelection, moveSliceSelectionLeft, moveSliceSelectionRight */
/* global applyLowPassFilter, applyHighPassFilter, applyBandPassFilter, FILTER_NONE, FILTER_LOW, FILTER_BAND, FILTER_HIGH, applyAmplitudeThreshold */
/* global playAudio, stopAudio, getTimestamp, PLAYBACK_MODE_SKIP, PLAYBACK_MODE_ALL, AMPLITUDE_THRESHOLD_BUFFER_LENGTH, createAudioContext */
/* global applyGoertzelFilter, drawGoertzelPlot, applyGoertzelThreshold, GOERTZEL_THRESHOLD_BUFFER_LENGTH, generateHammingValues */
/* global formatAxisUnits, getIncrementAndPrecision, formatTimeLabel */

/* global addSVGText, addSVGLine, clearSVG, addSVGRect, checkSVGLabelCutOff */

/* global prepareUI, sampleRateChange */
/* global getPassFiltersObserved, getCentreObserved */
/* global getFilterRadioValue, updateThresholdTypeUI, updateThresholdUI, updateFilterLabel */
/* global getThresholdTypeIndex, THRESHOLD_TYPE_NONE, THRESHOLD_TYPE_AMPLITUDE, THRESHOLD_TYPE_GOERTZEL, getFrequencyTriggerFilterFreq, getFrequencyTriggerWindowLength, updateFilterUI, getFrequencyTrigger */
/* global thresholdScaleIndex, THRESHOLD_SCALE_PERCENTAGE, THRESHOLD_SCALE_16BIT, THRESHOLD_SCALE_DECIBEL */
/* global thresholdTypeLabel, thresholdTypeRadioButtons, lowPassFilterSlider, highPassFilterSlider, bandPassFilterSlider, amplitudeThresholdSlider, amplitudeThresholdDurationRadioButtons, goertzelFilterCentreSlider, goertzelFilterWindowRadioButtons, goertzelDurationRadioButtons, goertzelThresholdSlider */
/* global getMinimumTriggerDurationAmp, getMinimumTriggerDurationGoertzel, getFilterSliderStep, setBandPass, setLowPassSliderValue, setHighPassSliderValue, roundToSliderStep, setFrequencyTriggerFilterFreq, getMinimumAmplitudeThresholdDuration, getAmplitudeThresholdValues, getFrequencyTriggerValues, setAmplitudeThresholdScaleIndex */
/* global prevThresholdScaleIndex, resetElements, disableFilterUI, enableFilterUI */

/* global setCentreObserved, setPassFiltersObserved */

/* global exportPNG, exportJPG, exportPDF, createImageCanvas, exportAudio, createAudioArray, exportVideo */

/* global enableSampleRateControl, disableSampleRateControl, updateSampleRateUI, getSampleRateSelection, addSampleRateUIListeners */

/* global downsample, resampleOutputLength */

// Launch page as app without instructions

const launchAppLink = document.getElementById('launch-app-link');

// Use these values to fill in the axis labels before samples have been loaded

const FILLER_SAMPLE_RATE = 384000;
const FILLER_SAMPLE_COUNT = FILLER_SAMPLE_RATE * 60;

// Error display elements

const errorSpan = document.getElementById('error-span');
const fileSelectionTitleSpan = document.getElementById('file-selection-title-span');
const browserErrorSpan = document.getElementById('browser-error-span');
const browserErrorSpanApp = document.getElementById('browser-error-span-app');
const appExampleLink = document.getElementById('app-example-link');
const ERROR_DISPLAY_TIME = 3000;

// File selection elements

const fileSelectionTitleDiv = document.getElementById('file-selection-title-div');
const fileButton = document.getElementById('file-button');
const disabledFileButton = document.getElementById('disabled-file-button');
const fileSpan = document.getElementById('file-span');
const fileInformationLink = document.getElementById('file-information-link');
const resampledSpan = document.getElementById('resampled-span');
const loadingSpan = document.getElementById('loading-span');
let isExampleFile = true;

// File information modal
const informationModalDialog = document.getElementById('information-modal-dialog');
const artistSpan = document.getElementById('artist-span');
const commentSpan = document.getElementById('comment-span');
const guanoHolder = document.getElementById('guano-holder');
const informationDownloadButton = document.getElementById('information-download-button');
const informationClipboardButton = document.getElementById('information-clipboard-button');

const DEFAULT_INFORMATION_MODAL_WIDTH = 400;
const INFORMATION_MODAL_PADDING = 40;

// Recording slice UI
const sliceLoadingBorderSVG = document.getElementById('slice-loading-border-svg');
const sliceBorderSVG = document.getElementById('slice-border-svg');
const sliceReselectSpan = document.getElementById('slice-reselect-span');
const sliceReselectLink = document.getElementById('slice-reselect-link');
let showReselectLink = false;
let sliceSelectionCallback;

// Settings UI

const settingsModalButton = document.getElementById('settings-modal-button');
const settingsApplyButton = document.getElementById('settings-apply-button');
const settingsModal = new bootstrap.Modal(document.getElementById('settings-modal'));
const settingsFileTimeCheckbox = document.getElementById('settings-file-time-checkbox');
const settingsFileTimeLabel = document.getElementById('settings-file-time-label');
const settingsLowFrequencyCheckbox = document.getElementById('settings-low-frequency-checkbox');
const settingsDynamicColoursCheckbox = document.getElementById('settings-dynamic-colours-checkbox');
const settingsVideoLineCheckbox = document.getElementById('settings-video-line-checkbox');
const settingsVideoFixedFPSCheckbox = document.getElementById('settings-video-fixed-fps-checkbox');
const settingsMonochromeSelect = document.getElementById('settings-monochrome-select');

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
const panLeftIcon = document.getElementById('pan-left-icon');
const panRightIcon = document.getElementById('pan-right-icon');
const panDoubleLeftIcon = document.getElementById('pan-double-left-icon');
const panDoubleRightIcon = document.getElementById('pan-double-right-icon');

// Time constant

const SECONDS_IN_A_MINUTE = 60;

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

// Is UI disabled?

let uiDisabled = false;

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
const spectrogramBorderSVG = document.getElementById('spectrogram-border-svg');

const waveformHolder = document.getElementById('waveform-holder');
const waveformPlaybackCanvas = document.getElementById('waveform-playback-canvas'); // Canvas layer where playback progress
const waveformDragCanvas = document.getElementById('waveform-drag-canvas'); // Canvas layer where zoom overlay is drawn
const waveformThresholdCanvas = document.getElementById('waveform-threshold-canvas'); // Canvas layer where amplitude thresholded periods are drawn
const waveformThresholdLineSVG = document.getElementById('waveform-threshold-line-svg'); // SVG layer where amplitude threshold value lines are drawn
const waveformCanvas = document.getElementById('waveform-canvas'); // Canvas layer where waveform is drawn
const waveformLoadingSVG = document.getElementById('waveform-loading-svg');
const waveformBorderSVG = document.getElementById('waveform-border-svg');

const goertzelCanvasHolder = document.getElementById('goertzel-canvas-holder');
const goertzelPlaybackCanvas = document.getElementById('goertzel-playback-canvas'); // Canvas layer where playback progress
const goertzelDragCanvas = document.getElementById('goertzel-drag-canvas'); // Canvas layer where zoom overlay is drawn
const goertzelThresholdCanvas = document.getElementById('goertzel-threshold-canvas'); // Canvas layer where Goertzel thresholded periods are drawn
const goertzelThresholdLineSVG = document.getElementById('goertzel-threshold-line-svg'); // SVG layer where Goertzel thresholded periods are drawn
const goertzelCanvas = document.getElementById('goertzel-canvas'); // Canvas layer where Goertzel response is drawn
const goertzelBorderSVG = document.getElementById('goertzel-border-svg');

const timeLabelSVG = document.getElementById('time-axis-label-svg');
const timeAxisHeadingSVG = document.getElementById('time-axis-heading-svg');

// Y axis label canvases

const spectrogramLabelSVG = document.getElementById('spectrogram-label-svg');
const waveformLabelSVG = document.getElementById('waveform-label-svg');
const goertzelLabelSVG = document.getElementById('goertzel-label-svg');

// Heading used on the X axis ("Time (x)")

let xAxisHeading = 'Time (S)';

// Whether or not to dynamically generate a colour scheme for spectrograms

let useDynamicColours = false;

// Whether or not to use a monochrome colour palette

const COLOUR_MAP_DEFAULT = 0;
const COLOUR_MAP_MONOCHROME = 1;
const COLOUR_MAP_INVERSE_MONOCHROME = 2;
let colourMapIndex = COLOUR_MAP_DEFAULT;

// File variables

let fileHandler;
let unfilteredSamples;
let filteredSamples;
let sampleCount = 0;
let trueSampleCount = 0;
let sampleRate, trueSampleRate;
let processedSpectrumFrames;
let spectrumMin = Number.MAX_SAFE_INTEGER;
let spectrumMax = Number.MIN_SAFE_INTEGER;
let firstFile = true;

let artist = '';
let comment = '';
let possibleGuano = false;
let guanoData = [];

let resampledFile = false;

let originalDataSize = 0;
let originalSampleRate = 0;

let downsampledUnfilteredSamples;

// If a slice is selected, the amount all x labels should be offset by

let timeLabelOffset = 0;

// When navigating between slices of a larger file, transformations and downsampled sample rate need to be remembered

let prePanOffset = 0;
let prePanDisplayLength = 0;
let prePanSampleRate = 0;

// If file is sliced, the original size of the file in samples

let overallFileLengthSamples;
let originalFileLength = 0;

// Timestamp when file was recorded

let fileTimestamp = -1;
let fileTimezone = '';
let useFileTime = false;

// Video export options

let videoLineEnabled = true;
let fixedFpsEnabled = false;

// Low frequency setting

let lowFrequencyEnabled = false;

// Drawing/processing flag

let drawing = false;

// Array of Goertzel responses

let goertzelValues = [];

// Boolean array equal length to sample count. Is sample over threshold

let samplesAboveThreshold;
let samplesAboveGoertzelThreshold;
let thresholdedValueCount = 0;

// When low frequency panel is switched to, disable the threshold UI but remember what it was on

let previousTriggerSetting = 0;

// Panel which states how much size reduction the amplitude threshold settings chosen will do

const sizeInformationPanel = document.getElementById('size-information-panel');

// Other UI

const resetButton = document.getElementById('reset-button');
const exportButton = document.getElementById('export-button');
const disabledExportButton = document.getElementById('disabled-export-button');

// Audio playback controls

const playButton = document.getElementById('play-button');
const playIcon = document.getElementById('play-icon');
const stopIcon = document.getElementById('stop-icon');

const playbackSpeedSelect = document.getElementById('playback-speed-select');

const volumeSelect = document.getElementById('volume-select');

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
const exportJPGButton = document.getElementById('export-jpg-button');
const exportPDFButton = document.getElementById('export-pdf-button');
const exportAllButton = document.getElementById('export-all-button');

// Export audio/video buttons

const exportAudioButton = document.getElementById('export-audio-button');
const exportVideoButton = document.getElementById('export-video-button');
const exportVideoIcon = document.getElementById('video-icon');
const exportVideoSpinner = document.getElementById('video-spinner');

// Instruction UI

const instructionsContent = document.getElementById('instructions-content');

// When preview UI opens, if it's a new file then the sample rate should change when a slice is selected, otherwise it should stay the same

let isNewFile = false;

// Warning modal which displays when window is too narrow

const resizeModal = new bootstrap.Modal(document.getElementById('resize-modal'));
const resizeModalDontTellAgainCheckbox = document.getElementById('resize-modal-dont-tell-again-checkbox');

// Warning modal which displays when the file loaded was recorded on a device without the clock set

const unsetClockModal = new bootstrap.Modal(document.getElementById('unset-clock-modal'));
const unsetClockModalDontTellAgainCheckbox = document.getElementById('unset-clock-modal-dont-tell-again-checkbox');

/**
 * @returns Boolean check if currently loaded file is a T.WAV AudioMoth file
 */
function isTWAV () {

    return fileSpan.innerText.includes('T.WAV');

}

function getFilterType () {

    const triggerType = getThresholdTypeIndex();

    // Frequency filter not available when triggering on frequency

    return triggerType !== THRESHOLD_TYPE_GOERTZEL ? getFilterRadioValue() : FILTER_NONE;

}

/**
 * 0 - Default
 * 1 - Loading
 * 2 - Error
 * @param {number} index Which span to show
 */
async function displaySpans (index) {

    if (resampledFile) {

        resampledSpan.textContent = 'File has been resampled from ' + originalSampleRate / 1000 + ' to ' + trueSampleRate / 1000 + ' kHz.';

    } else {

        resampledSpan.textContent = '';

    }

    switch (index) {

    case 0:
        fileSpan.style.display = '';
        resampledSpan.style.display = resampledFile ? '' : 'none';
        loadingSpan.style.display = 'none';
        errorSpan.style.display = 'none';
        fileButton.disabled = false;

        if (isExampleFile) {

            fileInformationLink.style.display = 'none';

        } else {

            // Find the AudioMoth recording line and make sure it fits in the window

            const recordedRegex0 = /^Recorded at (\d\d:\d\d:\d\d \d\d\/\d\d\/\d{4}) \(UTC([-|+]\d+)?:?(\d\d)?\) by AudioMoth [A-F0-9]{16}/;
            const found0 = comment.match(recordedRegex0);
            const recordedRegex1 = /^Recorded at (\d\d:\d\d:\d\d \d\d\/\d\d\/\d{4}) \(UTC([-|+]\d+)?:?(\d\d)?\) during deployment [A-F0-9]{16}/;
            const found1 = comment.match(recordedRegex1);

            let line = found0 ? found0[0] : '';
            line = found1 ? found1[0] : line;

            // Create an offscreen canvas to measure

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const computedStyle = window.getComputedStyle(fileSpan);
            const font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
            ctx.font = font;

            const recordingTextWidth = ctx.measureText(line).width;

            let newModalWidth = Math.max(DEFAULT_INFORMATION_MODAL_WIDTH, recordingTextWidth + INFORMATION_MODAL_PADDING);

            // If GUANO data exists, check the widest line fits in the window

            guanoData = [];

            guanoHolder.innerHTML = '';

            if (possibleGuano) {

                const result = await readGuano(fileHandler);

                if (result.success) {

                    guanoHolder.innerHTML = '';

                    guanoData = result.guano;

                    let longestLineWidth = 0;

                    const boldFont = 'bold ' + font;

                    for (let i = 0; i < guanoData.length; i++) {

                        const titleSpan = document.createElement('span');
                        titleSpan.style = 'font-weight: bold; display: inline;';
                        titleSpan.innerText = guanoData[i][0] + ': ';

                        guanoHolder.appendChild(titleSpan);

                        const valueSpan = document.createElement('span');
                        valueSpan.style = 'display: inline;';

                        if (guanoData[i][0] === 'Loc Position') {

                            const [latitude, longitude] = guanoData[i][1].split(' ');
                            const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
                            valueSpan.innerHTML = `<a href="${googleMapsLink}" target="_blank">${latitude}, ${longitude}</a>`;

                        } else {

                            valueSpan.innerText = guanoData[i][1];

                        }

                        guanoHolder.appendChild(valueSpan);

                        const breakElement = document.createElement('br');

                        guanoHolder.appendChild(breakElement);

                        ctx.font = boldFont;
                        const titleWidth = ctx.measureText(guanoData[i][0] + ': ').width;

                        ctx.font = font;
                        const valueWidth = ctx.measureText(guanoData[i][1]).width;

                        const totalWidth = titleWidth + valueWidth;

                        longestLineWidth = Math.max(longestLineWidth, totalWidth);

                    }

                    newModalWidth = Math.max(newModalWidth, longestLineWidth + INFORMATION_MODAL_PADDING);

                }

            }

            informationModalDialog.style = `min-width: ${newModalWidth}px !important; max-width: ${newModalWidth}px !important;`;

            guanoHolder.style.display = !guanoData ? 'none' : '';

            artistSpan.innerText = artist;
            commentSpan.innerText = comment;

            if (artist !== '' || comment !== '' || guanoData) fileInformationLink.style.display = '';

            artistSpan.style.display = (artist === '') ? 'none' : '';
            commentSpan.style.display = (comment === '') ? 'none' : '';

            informationDownloadButton.disabled = artist === '';
            informationClipboardButton.disabled = artist === '';

        }

        sliceReselectSpan.style.display = showReselectLink ? '' : 'none';

        break;

    case 1:
        loadingSpan.style.display = '';
        fileSpan.style.display = 'none';
        fileInformationLink.style.display = 'none';
        resampledSpan.style.display = 'none';
        errorSpan.style.display = 'none';
        sliceReselectSpan.style.display = 'none';
        break;

    case 2:
        errorSpan.style.display = '';
        fileSpan.style.display = 'none';
        fileInformationLink.style.display = 'none';
        loadingSpan.style.display = 'none';
        resampledSpan.style.display = 'none';
        sliceReselectSpan.style.display = 'none';
        fileButton.disabled = false;
        break;

    }

}

function getInformationString () {

    let str = '';

    str += artist + '\n';
    str += comment + '\n';

    for (let i = 0; i < guanoData.length; i++) {

        str += guanoData[i][0] + ': ' + guanoData[i][1] + '\n';

    }

    return str;

}

informationDownloadButton.addEventListener('click', () => {

    const downloadElement = document.createElement('a');
    downloadElement.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(getInformationString()));

    const infoFileName = fileSpan.innerText.replace(/\.wav|\.WAV/, '.txt');

    downloadElement.setAttribute('download', infoFileName);

    downloadElement.style.display = 'none';
    document.body.appendChild(downloadElement);

    downloadElement.click();

    document.body.removeChild(downloadElement);

});

informationClipboardButton.addEventListener('click', () => {

    navigator.clipboard.writeText(getInformationString());

});

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

    const canvases = [spectrogramBorderSVG, waveformBorderSVG, goertzelBorderSVG, sliceLoadingBorderSVG, sliceBorderSVG];

    for (let i = 0; i < canvases.length; i++) {

        const w = canvases[i].width.baseVal.value;
        const h = canvases[i].height.baseVal.value;

        addSVGRect(canvases[i], 0, 0, w, h, 'black', 2, false);

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

    let currentSampleCount = (sampleCount !== 0) ? sampleCount : FILLER_SAMPLE_COUNT;
    currentSampleCount = Math.max(currentSampleCount, originalFileLength);

    let label = 0;

    // Get the label increment amount and label decimal precision

    let incrementPrecision;

    const msOffset = fileTimestamp - Math.floor(fileTimestamp);

    // If file time is enabled, you may need to take into account milliseconds when positioning labels
    if (useFileTime && fileTimestamp > 0 && !isTWAV() && msOffset > 0) {

        // The initial label is likely to be pushed off the edge, so set the increment and precision based on the reduced display length
        incrementPrecision = getIncrementAndPrecision(displayLength - msOffset, currentSampleRate);

        label -= msOffset * currentSampleRate;

    } else {

        incrementPrecision = getIncrementAndPrecision(displayLength, currentSampleRate);

    }

    const xLabelIncrementSecs = incrementPrecision.xLabelIncrementSecs;
    const xLabelDecimalPlaces = incrementPrecision.xLabelDecimalPlaces;

    const xLabelIncrementSamples = xLabelIncrementSecs * currentSampleRate;

    // So the centre of the text can be the label location, there's a small amount of padding around the label canvas
    const xLabelPadding = spectrogramLabelSVG.width.baseVal.value;

    let currentDisplayTime = Math.max(displayLength, originalFileLength) / currentSampleRate;
    currentDisplayTime += timeLabelOffset;

    if (useFileTime && fileTimestamp > 0 && !isTWAV()) {

        currentDisplayTime += fileTimestamp;

    }

    currentDisplayTime = (currentDisplayTime + (offset / currentSampleRate)) % SECONDS_IN_DAY;

    let overallLength = isExampleFile ? currentSampleCount : overallFileLengthSamples;

    if (resampledFile) {

        overallLength = resampleOutputLength(overallFileLengthSamples, originalSampleRate, sampleRate);

    }

    const overallLengthSeconds = overallLength / currentSampleRate;

    // Work out the true range being displayed

    const startSeconds = (offset / currentSampleRate) + timeLabelOffset;
    const endSeconds = startSeconds + (displayLength / currentSampleRate);

    const startSecondsFormatted = formatTimeLabel(startSeconds, overallLengthSeconds, xLabelDecimalPlaces, useFileTime && fileTimestamp > 0 && !isTWAV());
    const endSecondsFormatted = formatTimeLabel(endSeconds, overallLengthSeconds, xLabelDecimalPlaces, useFileTime && fileTimestamp > 0 && !isTWAV());

    console.log('Displaying:', startSecondsFormatted, '-', endSecondsFormatted);

    while (label <= currentSampleCount) {

        // Convert the time to a pixel value, then take into account the label width and the padding to position correctly

        const x = samplesToPixels(label) - samplesToPixels(offset);

        if (x < 0) {

            label += xLabelIncrementSamples;
            continue;

        }

        if (x > waveformCanvas.width) {

            break;

        }

        let labelX = x;
        let tickX = x + xLabelPadding;

        // If the label format includes milliseconds and hours, the offset at the ends must be bigger

        let xLabelEdgeOffset = 2;

        xLabelEdgeOffset = (currentDisplayTime > 3600) ? xLabelEdgeOffset + 3 : xLabelEdgeOffset;
        xLabelEdgeOffset = (xLabelDecimalPlaces >= 2) ? xLabelEdgeOffset + 4 : xLabelEdgeOffset;
        xLabelEdgeOffset = (xLabelDecimalPlaces >= 3) ? xLabelEdgeOffset + 4 : xLabelEdgeOffset;

        labelX = (labelX === 0) ? labelX + xLabelEdgeOffset : labelX;
        labelX = (labelX === waveformCanvas.width) ? labelX - xLabelEdgeOffset : labelX;

        labelX += xLabelPadding;

        let labelValue = label / currentSampleRate;
        labelValue += timeLabelOffset;

        if (useFileTime && fileTimestamp > 0 && !isTWAV()) {

            labelValue += fileTimestamp;

        }

        labelValue = labelValue % SECONDS_IN_DAY;

        const labelText = formatTimeLabel(labelValue, overallLengthSeconds, xLabelDecimalPlaces, useFileTime && fileTimestamp > 0 && !isTWAV());

        // Ticks must be offset to 0.5, end tick must align with end of plot

        tickX = (tickX >= waveformCanvas.width) ? tickX - 0.5 : tickX;
        tickX = Math.floor(tickX) + 0.5;

        const labelTextElem = addSVGText(timeLabelSVG, labelText, labelX, 12, 'middle', 'middle');
        addSVGLine(timeLabelSVG, tickX, 0, tickX, xMarkerLength);

        checkSVGLabelCutOff(labelTextElem);

        label += xLabelIncrementSamples;

    }

    // Draw y axis labels for spectrogram

    clearSVG(spectrogramLabelSVG);

    const yLabelCount = Y_LABEL_COUNTS[getSampleRate()];

    const ySpecLabelIncrement = getSampleRate() / 2 / yLabelCount;

    const ySpecIncrement = spectrogramLabelSVG.height.baseVal.value / yLabelCount;

    const specLabelX = spectrogramLabelSVG.width.baseVal.value - 7;
    const specMarkerX = spectrogramLabelSVG.width.baseVal.value - yMarkerLength;

    for (let i = 0; i <= yLabelCount; i++) {

        let labelText;

        if (getSampleRate() <= 1000) {

            labelText = (i * ySpecLabelIncrement) + 'Hz';

        } else {

            labelText = (i * ySpecLabelIncrement / 1000) + 'kHz';

        }

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
            const endLabelY = Math.floor(y) + 0.5;
            addSVGLine(spectrogramLabelSVG, specMarkerX, endLabelY, spectrogramLabelSVG.width.baseVal.value, endLabelY);

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
    const waveformMax = (INT16_MAX + 1) / z;
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

        // Nudge markers slightly onto canvas so they're not cut off and align with 0.5

        if (markerY === 0) {

            markerY = markerY + 0.5;

        } else if (markerY === waveformCanvasH) {

            markerY = markerY - 0.5;

        } else {

            markerY = Math.floor(markerY) + 0.5;

        }

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

        } else if (Math.round(labelY) === 0) {

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

    const currentSampleRate = getSampleRate();

    let format;

    const incrementPrecision = getIncrementAndPrecision(displayLength, currentSampleRate);
    const xLabelDecimalPlaces = incrementPrecision.xLabelDecimalPlaces;

    // If the file time is being used, always display as hh:mm:ss, then add relevant milliseconds

    if (useFileTime && fileTimestamp > 0 && !isTWAV()) {

        format = 'hh:mm:ss';

        if (xLabelDecimalPlaces > 0) {

            format += '.';
            format += 's'.repeat(xLabelDecimalPlaces);

        }

        xAxisHeading = 'Time of Day (' + format;
        xAxisHeading += fileTimezone !== '' ? ' ' + fileTimezone : '';
        xAxisHeading += ')';

    } else {

        let currentSampleCount = (sampleCount !== 0) ? sampleCount : FILLER_SAMPLE_COUNT;
        currentSampleCount = Math.max(currentSampleCount, originalFileLength);
        const overallLengthSeconds = currentSampleCount / currentSampleRate;

        format = formatAxisUnits(overallLengthSeconds, xLabelDecimalPlaces);

        xAxisHeading = 'Time (' + format + ')';

    }

    addSVGText(timeAxisHeadingSVG, xAxisHeading, timeAxisHeadingSVG.width.baseVal.value / 2, 10, 'middle', 'middle');

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

    let darkenPanLeft = false;
    let darkenPanRight = false;

    let overallLength = overallFileLengthSamples;

    if (resampledFile || sampleRate !== trueSampleRate) {

        overallLength = resampleOutputLength(overallFileLengthSamples, originalSampleRate, sampleRate);

    }

    // If it's a sliced longer file, work out which panning buttons are appropriate differently

    if (overallLength === sampleCount || isExampleFile) {

        if (offset <= 0) {

            panLeftButton.disabled = true;

        } else {

            panLeftButton.disabled = false;

        }

        const sampleEnd = Math.floor(offset + displayLength);

        // Gap at the end of the plot in samples
        const gapLength = sampleEnd - sampleCount;

        if (gapLength >= 0) {

            panRightButton.disabled = true;

        } else {

            panRightButton.disabled = false;

        }

    } else {

        const timeLabelOffsetSamples = timeLabelOffset * sampleRate;

        if (offset + timeLabelOffsetSamples <= 0) {

            panLeftButton.disabled = true;

        } else {

            panLeftButton.disabled = false;

            // If the next pan click would move to the next chunk, darken the button slightly

            darkenPanLeft = offset === 0 && timeLabelOffsetSamples > 0;

        }

        const sampleEnd = Math.floor(offset + displayLength + timeLabelOffsetSamples);

        // Gap at the end of the file in samples
        const gapLength = sampleEnd - overallLength;

        if (gapLength >= 0) {

            panRightButton.disabled = true;

        } else {

            panRightButton.disabled = false;

            // If the next pan click would move to the next chunk, darken the button slightly

            darkenPanRight = offset + displayLength === sampleCount;

        }

    }

    if (darkenPanLeft) {

        panLeftButton.classList.remove('button-secondary');
        panLeftButton.classList.add('button-secondary-dark');

        panLeftIcon.style.display = 'none';
        panDoubleLeftIcon.style.display = '';

    } else {

        panLeftButton.classList.remove('button-secondary-dark');
        panLeftButton.classList.add('button-secondary');

        panLeftIcon.style.display = '';
        panDoubleLeftIcon.style.display = 'none';

    }

    if (darkenPanRight) {

        panRightButton.classList.remove('button-secondary');
        panRightButton.classList.add('button-secondary-dark');

        panRightIcon.style.display = 'none';
        panDoubleRightIcon.style.display = '';

    } else {

        panRightButton.classList.remove('button-secondary-dark');
        panRightButton.classList.add('button-secondary');

        panRightIcon.style.display = '';
        panDoubleRightIcon.style.display = 'none';

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

        const amplitudeThresholdRatio = amplitudeThresholdValues.amplitude / (INT16_MAX + 1);
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

    uiDisabled = false;

    fileButton.disabled = false;

    for (let i = 0; i < exampleLinks.length; i++) {

        exampleLinks[i].disabled = false;

    }

    enableSampleRateControl();
    enableLowFrequencyControls();

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
    exportVideoButton.disabled = false;

    playButton.disabled = false;
    playbackSpeedSelect.disabled = false;
    volumeSelect.disabled = false;
    playbackModeSelect.disabled = false;

    sliceReselectLink.disabled = false;

    settingsModalButton.disabled = false;

    enableFilterUI();

    if (errorSpan.style.display === 'none') {

        displaySpans(0);

    }

    hideSliceModal();

}

/**
 * Draw the waveform plot, its axis labels, and then re-enable all UI
 * @param {number[]} samples Samples to render
 * @param {boolean} isInitialRender Is this the first time this file has been rendered
 * @param {number} spectrogramCompletionTime Time taken to render spectrogram
 */
function drawWaveformPlot (samples, isInitialRender, spectrogramCompletionTime) {

    // console.log('Drawing waveform');

    resetCanvas(waveformCanvas);

    const thresholdTypeIndex = getThresholdTypeIndex();

    // Halving vertical view just cuts off the mid point label, so reduce zoom slightly if in decibel mode

    const zoomLevel = (thresholdScaleIndex === THRESHOLD_SCALE_DECIBEL) ? getDecibelZoomY() : getZoomY();

    drawWaveform(samples, offset, displayLength, zoomLevel, colourMapIndex, (waveformCompletionTime) => {

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
        drawAxisHeadings();

        drawing = false;

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

    drawSpectrogram(processedSpectrumFrames, useDynamicColours ? spectrumMin : STATIC_COLOUR_MIN, useDynamicColours ? spectrumMax : STATIC_COLOUR_MAX, colourMapIndex, async (completionTime) => {

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

    uiDisabled = true;

    disableSampleRateControl();

    resetButton.disabled = true;
    exportButton.disabled = true;
    exportModalButton.disabled = true;
    exportAudioButton.disabled = true;
    exportVideoButton.disabled = true;

    zoomInButton.disabled = true;
    zoomOutButton.disabled = true;
    panLeftButton.disabled = true;
    panRightButton.disabled = true;
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
    playbackSpeedSelect.disabled = true;
    volumeSelect.disabled = true;
    playbackModeSelect.disabled = true;

    sliceReselectLink.disabled = true;

    disableFilterUI();

    sizeInformationPanel.classList.add('grey');

    settingsModalButton.disabled = true;

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

        // console.log('Calculating spectrogram frames');

        // If the resulting frames aren't for rendering or the colour map hasn't been calculated yet, use all the samples

        let useAllSamples = !renderPlots || (spectrumMin === 0.0 && spectrumMax === 0.0);

        // If you're loading an offset part of a file, there's no need to process all samples

        useAllSamples &= offset === 0;

        const result = calculateSpectrogramFrames(samples, sampleCount, useAllSamples ? 0 : offset, useAllSamples ? sampleCount : displayLength);

        processedSpectrumFrames = result.frames;

        if ((spectrumMin === 0.0 && spectrumMax === 0.0) || useDynamicColours) {

            spectrumMin = result.min;
            spectrumMax = result.max;

            console.log('Calculated colour map. Min: ' + spectrumMin.toFixed(2) + ' Max: ' + spectrumMax.toFixed(2));

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
 * Also, if a displayed period can't be displayed in a single slice, push it into a valid slice
 * For example, 0:55 - 1:25 won't fit in the slice 0:30 - 1:30 or 1:00 - 2:00. So it has to be nudged back inside a valid slice
 * These periods which can't fit into a single slice will always be longer than 30 seconds as they must cross two 30 second barriers simultaneously
 */
function removeEndGap () {

    const sampleEnd = Math.floor(offset + displayLength);

    const gapLength = sampleEnd - sampleCount;

    if (gapLength > 0 && displayLength < 30 * sampleRate) {

        offset -= gapLength;

    }

}

/**
 * Pan plot to the right
 */
function panRight () {

    if (sampleCount !== 0 && !drawing && !playing) {

        const offsetIncrement = Math.floor(displayLength / 2);

        const newOffset = offset + offsetIncrement;

        if (offset + displayLength < sampleCount) {

            offset = newOffset;

            removeEndGap();

            setTimeout(() => {

                updatePlots(false, true, false, false, false);

            }, 0);

            updatePanUI();

        } else {

            // If moving between chunks is likely to cause a bit of lag, disable the UI

            if (sampleRate >= 96000) {

                disableUI();

            }

            // Each slice is 30 seconds, so moving one to the right shifts everything to the right 30 seconds
            // In order to make sure the offset is in the right place, subtract 30 seconds from the newOffset

            prePanOffset = newOffset - (30 * sampleRate);
            prePanDisplayLength = displayLength;

            prePanSampleRate = sampleRate;

            spectrumMin = Number.MAX_SAFE_INTEGER;
            spectrumMax = Number.MIN_SAFE_INTEGER;

            moveSliceSelectionRight();
            usePreviewSelection(true);

        }

    }

}

/**
 * Pan plot to the left
 */
function panLeft () {

    if (sampleCount !== 0 && !drawing && !playing) {

        const offsetIncrement = Math.floor(displayLength / 2);

        const newOffset = offset - offsetIncrement;

        if (newOffset < 0) {

            if (offset > 0 || overallFileLengthSamples === sampleCount || isExampleFile) {

                offset = 0;

            } else {

                // If moving between chunks is likely to cause a bit of lag, disable the UI

                if (sampleRate >= 96000) {

                    disableUI();

                }

                // Each slice is 30 seconds, so moving one to the left shifts everything to the left 30 seconds
                // In order to make sure the offset is in the right place, add the (negative) newOffset to 30 seconds

                prePanOffset = newOffset + (30 * sampleRate);
                prePanDisplayLength = displayLength;

                prePanSampleRate = sampleRate;

                moveSliceSelectionLeft();
                usePreviewSelection(true);

                return;

            }

        } else {

            offset = newOffset;

        }

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
            updateNavigationUI();

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

            const filterIndex = getFilterType();

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

            const filterIndex = getFilterType();

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

        const filterIndex = getFilterType();

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
                drawAxisHeadings();
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
                drawAxisHeadings();
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
            drawAxisHeadings();
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

    const filterIndex = getFilterType();
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

            if (bandPassFilterValue1 < sampleRate / 2) {

                applyBandPassFilter(downsampledUnfilteredSamples, sampleCount, filteredSamples, getSampleRate(), bandPassFilterValue0, bandPassFilterValue1);

            } else {

                console.log('Applying high-pass filter as band-pass top value = Nyquist');

                applyHighPassFilter(downsampledUnfilteredSamples, sampleCount, filteredSamples, getSampleRate(), bandPassFilterValue0);

            }

            break;

        }

    }

    const renderSamples = (isFiltering && thresholdTypeIndex !== THRESHOLD_TYPE_GOERTZEL) ? filteredSamples : downsampledUnfilteredSamples;

    // Apply amplitude threshold

    if (thresholdTypeIndex === THRESHOLD_TYPE_AMPLITUDE && updateThresholdedSampleArray) {

        const amplitudeThresholdValues = getAmplitudeThresholdValues();

        let threshold = 0;

        if (thresholdScaleIndex === THRESHOLD_SCALE_PERCENTAGE) {

            threshold = (INT16_MAX + 1) * parseFloat(amplitudeThresholdValues.percentage) / 100.0;

        } else if (thresholdScaleIndex === THRESHOLD_SCALE_16BIT) {

            threshold = amplitudeThresholdValues.amplitude;

        } else if (thresholdScaleIndex === THRESHOLD_SCALE_DECIBEL) {

            threshold = (INT16_MAX + 1) * Math.pow(10, amplitudeThresholdValues.decibels / 20);

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
 * @param {boolean} reapplyFilter Whether or not to reapply a frequency filter
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

        // console.log('Resetting colour map');

        spectrumMin = Number.MAX_SAFE_INTEGER;
        spectrumMax = Number.MIN_SAFE_INTEGER;

    }

    const thresholdTypeIndex = getThresholdTypeIndex();

    const filterIndex = getFilterType();

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

    displaySpans(2);

    errorSpan.innerHTML = message;

    setTimeout(() => {

        errorSpan.animate({opacity: 0}, {
            duration: 1000,
            easing: 'linear',
            iterations: 1,
            fill: 'backwards'
        }).onfinish = () => {

            displaySpans(0);

        };

    }, ERROR_DISPLAY_TIME);

}

/**
 * Process the result of loading a file
 * @param {object} result wavReader.js result object
 * @param {number} updateSampleRate Whether or not to update the sample rate from the result object
 * @param {function} callback Function called after completion
 */
function processReadResult (result, updateSampleRate, callback) {

    if (!result.success) {

        console.error('Failed to read file');

        showErrorDisplay(result.error);

        reenableUI();

        return;

    }

    fileTimestamp = -1;
    fileTimezone = '';

    const loadedFileName = fileHandler ? fileHandler.name : 'Example file';

    /**
     * Check for comment header
     * If it includes a timestamp, use that
     * If it includes a timezone, use that too
     * If there is no header, check the file name for a timestamp
     * Regex must search for the timestamp somewhere in the name to allow for prefixes
     * If the file name is used, don't include the timezone on the labels
     */

    if (result.comment !== '') {

        console.log('Reading comment header for timestamp');

        const dateRegexResult = DATE_REGEX.exec(result.comment);

        if (dateRegexResult) {

            console.log('Found timestamp');

            fileTimestamp = (parseInt(dateRegexResult[1]) * 3600) + (parseInt(dateRegexResult[2]) * 60) + parseInt(dateRegexResult[3]);
            fileTimestamp += dateRegexResult[4] === undefined ? 0 : parseFloat(dateRegexResult[4]);

            fileTimezone = dateRegexResult[8] === undefined ? 'UTC' : 'UTC' + dateRegexResult[8];

        }

    }

    // If no timestamp was found in the header, check the file name

    if (fileTimestamp === -1) {

        // console.log('Checking file name for timestamp');

        const timestampRegexResult = TIMESTAMP_REGEX.exec(loadedFileName);

        if (timestampRegexResult) {

            console.log('Found timestamp');

            fileTimestamp = (parseInt(timestampRegexResult[2]) * 3600) + (parseInt(timestampRegexResult[3]) * 60) + parseInt(timestampRegexResult[4]);
            fileTimestamp += timestampRegexResult[6] === undefined ? 0 : (parseFloat(timestampRegexResult[6]) / 1000);

            fileTimezone = '';

        }

    }

    if (fileTimestamp !== -1) {

        console.log('Loaded file with timestamp:', fileTimestamp, ' ', fileTimezone);

    }

    originalFileLength = overallFileLengthSamples;

    if (updateSampleRate) {

        trueSampleRate = result.sampleRate;
        sampleRate = trueSampleRate;

    }

    trueSampleCount = result.samples.length;
    sampleCount = trueSampleCount;

    const duration = sampleCount / trueSampleRate;

    console.log('------ ' + loadedFileName + ' ------');

    console.log('Loaded ' + sampleCount + ' samples at a sample rate of ' + trueSampleRate + ' Hz (' + duration.toFixed(2) + ' seconds)');

    callback(result);

}

/**
 * Close preview UI and re-enable everything
 */
function cancelPreview () {

    isNewFile = false;

    // Remove 'Loading...' from file span
    displaySpans(0);

    // Hide modal window
    hideSliceModal();

    reenableUI();

}

/**
 * Read the contents of the file given by the current filehandler
 * @returns Samples read from file
 */
async function readFromFile (exampleFilePath, callback) {

    timeLabelOffset = 0;
    overallFileLengthSamples = 0;

    // console.log('Reading samples');

    let result;

    if (exampleFilePath) {

        showReselectLink = false;

        if (exampleResultObjects[exampleFilePath] === undefined) {

            const req = new XMLHttpRequest();

            req.open('GET', exampleFilePath, true);
            req.responseType = 'arraybuffer';

            req.onload = () => {

                const arrayBuffer = req.response;

                result = readExampleWav(arrayBuffer);

                processReadResult(result, true, callback);

            };

            req.send(null);

        } else {

            result = exampleResultObjects[exampleFilePath];

            processReadResult(result, true, callback);

        }

    } else {

        if (!fileHandler) {

            console.error('No filehandler!');
            showErrorDisplay('Failed to load file.');
            return;

        }

        const checkResult = await checkHeader(fileHandler);

        if (!checkResult.success) {

            console.error(checkResult.error);
            showErrorDisplay(checkResult.error);
            return;

        }

        const header = checkResult.header;

        overallFileLengthSamples = header.data.size / header.wavFormat.bytesPerCapture;

        if (overallFileLengthSamples > SECONDS_IN_A_MINUTE * header.wavFormat.samplesPerSecond) {

            disableUI(false);

            console.log('File is greater than 60 seconds long. Loading preview.');

            sliceSelectionCallback = callback;

            showSliceLoadingUI();
            showSliceModal();

            loadPreview(fileHandler, header, () => {

                isNewFile = true;

                updateSelectionSpan(0, 60);

                drawPreviewWaveform(() => {

                    drawSliceSelection(0);

                    hideSliceLoadingUI();

                    saveCurrentSlicePosition();

                });

            }, cancelPreview);

        } else {

            isNewFile = true;

            showReselectLink = false;

            result = await readWav(fileHandler);

            processReadResult(result, true, callback);

        }

    }

}

setSliceSelectButtonEventHandler(async (selection, length, setTransformations) => {

    timeLabelOffset = selection;

    let readResult;

    hideSliceModal();

    // If a slice length doesn't equal 60, don't provide a length and slice() will automatically select until the end of the file

    if (length !== 60) {

        readResult = await readWav(fileHandler, selection);

    } else {

        readResult = await readWav(fileHandler, selection, length);

    }

    processReadResult(readResult, isNewFile, (processedResult) => {

        const currentSampleRate = trueSampleRate;
        const currentSampleCount = (sampleCount !== 0) ? sampleCount : FILLER_SAMPLE_COUNT;
        const maxDisplayTime = (Math.max(currentSampleCount, originalFileLength) / currentSampleRate) + timeLabelOffset;

        sliceReselectLink.innerText = formatTimeLabel(selection, maxDisplayTime, 0, false) + ' - ' + formatTimeLabel(selection + length, maxDisplayTime, 0, false);
        showReselectLink = true;

        sliceSelectionCallback(processedResult, setTransformations);

        isNewFile = false;

    });

});

setSliceCancelButtonListener(cancelPreview);

sliceReselectLink.addEventListener('click', () => {

    disableUI(false);

    displaySpans(1);

    showSliceModal();

    saveCurrentSlicePosition();

});

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

    if (fileSize < 1000) return fileSize + ' B';

    fileSize /= 1000;

    if (Math.round(fileSize) < 1000) return fileSize.toPrecision(3) + ' kB';

    fileSize /= 1000;

    if (Math.round(fileSize) < 1000) return fileSize.toPrecision(3) + ' MB';

    fileSize /= 1000;

    return fileSize.toPrecision(3) + ' GB';

}

/**
 * Update panel with estimate of file size
 */
function updateFileSizePanel () {

    sizeInformationPanel.classList.remove('grey');

    const fileSize = originalDataSize * getSampleRate() / originalSampleRate + LENGTH_OF_WAV_HEADER;

    const fileDescription = trueSampleRate !== getSampleRate() ? 'Downsampled' : resampledFile ? 'Resampled' : 'Original';

    const fileString = fileDescription + ' WAV file size: ' + formatFileSize(fileSize);

    if (getThresholdTypeIndex() !== THRESHOLD_TYPE_NONE) {

        const compressionRatio = sampleCount / thresholdedValueCount;

        const thresholdedFileSize = (fileSize - LENGTH_OF_WAV_HEADER) / compressionRatio + LENGTH_OF_WAV_HEADER;

        sizeInformationPanel.innerHTML = fileString + '. Resulting T.WAV file size: ' + formatFileSize(thresholdedFileSize) + '.<br>';

        if (thresholdedValueCount === 0) {

            sizeInformationPanel.innerHTML += 'Current threshold settings will result in an empty file.';

        } else {

            sizeInformationPanel.innerHTML += 'Current threshold settings give a file compression ratio of ' + compressionRatio.toFixed(1) + '.';

        }

    } else {

        sizeInformationPanel.innerHTML = fileString + '.<br>';

        sizeInformationPanel.innerHTML += 'Enable triggering to estimate file size reduction.';

    }

}

function checkFileDate () {

    if (unsetClockModalDontTellAgainCheckbox.checked) {

        return;

    }

    const regex = /^Recorded at (\d\d:\d\d:\d\d \d\d\/\d\d\/\d{4}) \(UTC([-|+]\d+)?:?(\d\d)?\)/;
    const match = comment.match(regex);

    if (match) {

        const dateStr = match[1];
        const date = new Date(dateStr);

        if (date.getFullYear() === 1970) {

            unsetClockModal.show();

        }

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
        isExampleFile = true;

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
            artistSpan.innerText = 'AudioMoth';
            commentSpan.innerText = '-';
            return;

        }

        fileHandler = fileHandler[0];

        fileName = fileHandler.name;

        isExampleFile = false;

    }

    const prevSampleRate = sampleRate;

    // Display loading text

    if (errorSpan.style.display === 'none') {

        displaySpans(1);

    }

    // Read samples

    await readFromFile(exampleFilePath, (result, setTransformations) => {

        const samples = result.samples;

        // If no samples can be read, return

        if (!samples) {

            displaySpans(0);

            return;

        }

        filteredSamples = new Array(sampleCount);

        resampledFile = result.resampled;

        originalDataSize = result.originalDataSize;

        originalSampleRate = result.originalSampleRate;

        // Collect the header information

        artist = result.artist;

        comment = result.comment;

        // Check if file had date set correctly

        checkFileDate();

        // Collect possibility of GUANO data

        possibleGuano = result.possibleGuano;

        // Reset threshold arrays

        samplesAboveThreshold = new Array(Math.ceil(samples.length / AMPLITUDE_THRESHOLD_BUFFER_LENGTH));
        samplesAboveGoertzelThreshold = new Array(samplesAboveThreshold.length);

        goertzelValues = [];

        // Reset transformations or, if panning to a new slice, set the transformations to precalculated values

        if (setTransformations) {

            offset = prePanOffset;
            displayLength = (offset + displayLength > sampleCount) ? sampleCount - offset : prePanDisplayLength;

            sampleRate = prePanSampleRate;

        } else {

            const downsampledDisplayLength = displayLength;

            resetTransformations();

            // If the sample rate was changed in another slice, don't reset the displayLength

            if (sampleRate !== trueSampleRate) {

                displayLength = downsampledDisplayLength;

            }

        }

        updateNavigationUI();

        clearSVG(waveformThresholdLineSVG);

        // Fill sample arrays

        unfilteredSamples = samples;

        downsampledUnfilteredSamples = new Int16Array(sampleCount);

        const downsampleResult = downsample(unfilteredSamples, getTrueSampleRate(), downsampledUnfilteredSamples, getSampleRate(), isLowFrequencyTabEnabled());

        if (!downsampleResult.success) {

            console.error(downsampleResult.error);
            showErrorDisplay('Failed to downsample audio.');

            // Reset sample rate selection

            updateSampleRateUI(getTrueSampleRate());

            return;

        }

        sampleCount = downsampleResult.length;

        // Update file name display

        fileSpan.innerText = fileName;

        // Work out what the maximum zoom level should be

        updateMaxZoom();

        // Reset values used to calculate colour map

        // console.log('Resetting colour map');

        spectrumMin = Number.MAX_SAFE_INTEGER;
        spectrumMax = Number.MIN_SAFE_INTEGER;

        if (!setTransformations && isNewFile) {

            updateSampleRateUI(getTrueSampleRate());

        }

        // Update filter range, resetting values if it's the first file loaded or the sliders have been observed

        const resetSliders = firstFile || prevSampleRate === undefined;
        sampleRateChangeListener(resetSliders);

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

        const filterIndex = getFilterType();

        // Flag that the first file has now been loaded

        firstFile = false;

        if (filterIndex === FILTER_NONE && thresholdTypeIndex === THRESHOLD_TYPE_NONE) {

            // unfilteredSamples and downsampledUnfilteredSamples only differ if downsampling has occurred, so use downsampledUnfilteredSamples

            processContents(downsampledUnfilteredSamples, true, true);

        } else {

            // Calculate spectrogram frames of unfiltered samples to create initial colour map

            processContents(downsampledUnfilteredSamples, true, false);

            // Get filtered/thresholded samples

            const renderSamples = getRenderSamples(true, true);

            // Plot samples

            processContents(renderSamples, false, true);

        }

    });

}

/**
 * Load samples from all example files then render the first file
 */
async function loadExampleFiles () {

    console.log('Loading example files');

    drawing = true;

    spectrogramLoadingSVG.style.display = '';
    waveformLoadingSVG.style.display = '';

    for (let i = 0; i < exampleNames.length; i++) {

        await readFromFile(examplePaths[i], (result) => {

            console.log('Loaded', exampleNames[i]);

            exampleResultObjects[examplePaths[i]] = result;

            if (i === exampleNames.length - 1) {

                isNewFile = true;
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

        try {

            loadFile();

        } catch (error) {

            showErrorDisplay('File could not be opened.');

        }

    }

});

/**
 * Handle example files being selected
 */
for (let i = 0; i < examplePaths.length; i++) {

    exampleLinks[i].addEventListener('click', () => {

        if (!drawing && !playing) {

            isNewFile = true;
            loadFile(examplePaths[i], exampleNames[i]);

        }

    });

}

appExampleLink.addEventListener('click', () => {

    if (!drawing && !playing) {

        isNewFile = true;
        loadFile(examplePaths[0], exampleNames[0]);

    }

});

/**
 * Handle start of a zoom drag event
 * @param {event} e Drag event
 */
function handleMouseDown (e) {

    // If it's not a left click or if the UI is disabled, ignore it

    if (e.button !== 0 || uiDisabled) {

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

        // If drag selection is imperceptively close to an edge, just round it to the edge

        const DRAG_ZOOM_BUFFER = 10;

        newOffset = (newOffset < DRAG_ZOOM_BUFFER) ? 0 : newOffset;

        if (sampleCount - (newOffset + newDisplayLength) < DRAG_ZOOM_BUFFER) {

            newOffset = sampleCount - newDisplayLength;

        }

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

    if (e.button !== 0) {

        return;

    }

    if (isDragging) {

        const w = spectrogramDragCanvas.width;

        // Get end of zoom drag

        const rect = spectrogramDragCanvas.getBoundingClientRect();

        let dragEndX = e.clientX - rect.left;
        dragEndX = Math.min(w, Math.max(0, dragEndX));

        dragZoom(dragEndX);

    }

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

    // If it's not a left click or if the UI is disabled, ignore it

    if (e.button !== 0 || uiDisabled) {

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

    const filterIndex = getFilterType();

    // If mode is changed to or from decibel, the scale of the waveform plot has changed slightly, so redraw

    if (thresholdScaleIndex === THRESHOLD_SCALE_DECIBEL || prevThresholdScaleIndex === THRESHOLD_SCALE_DECIBEL) {

        if (filterIndex === FILTER_NONE) {

            drawWaveformPlot(downsampledUnfilteredSamples, false);

        } else {

            drawWaveformPlot(filteredSamples, false);

        }

    }

    drawAxisLabels();
    drawAxisHeadings();

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

        const downsampleResult = downsample(unfilteredSamples, getTrueSampleRate(), downsampledUnfilteredSamples, sampleRate, false);

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
        updateNavigationUI();

    }

}

resetButton.addEventListener('click', reset);

// Add sample rate UI listeners

function sampleRateChangeListener (resetSliders) {

    const oldSampleRate = sampleRate;
    sampleRate = getSampleRateSelection();

    const passFiltersObserved = getPassFiltersObserved();
    const centreObserved = getCentreObserved();
    sampleRateChange(resetSliders || !passFiltersObserved, resetSliders || !centreObserved, getSampleRate());

    const downsampleResult = downsample(unfilteredSamples, trueSampleRate, downsampledUnfilteredSamples, sampleRate, isLowFrequencyTabEnabled());

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

    // console.log('Resetting colour map');

    spectrumMin = Number.MAX_SAFE_INTEGER;
    spectrumMax = Number.MIN_SAFE_INTEGER;

    processContents(downsampledUnfilteredSamples, false, false);

    drawing = false;

    updateFilterUI();
    updateThresholdTypePlaybackUI();
    updateThresholdUI();

    updatePlots(false, true, true, true, true);

}

addLowFrequencyRadioButtonListeners(sampleRateChangeListener);
addSampleRateUIListeners(sampleRateChangeListener);

addLowFrequencyTabCloseListener(() => {

    thresholdTypeRadioButtons[previousTriggerSetting].checked = true;

    exportButton.style.display = '';
    disabledExportButton.style.display = 'none';

    sampleRateChangeListener();

});

addLowFrequencyTabOpenListener(() => {

    // Disable triggering but remember setting

    previousTriggerSetting = getThresholdTypeIndex();
    thresholdTypeRadioButtons[0].checked = true;

    disabledExportButton.style.display = '';
    exportButton.style.display = 'none';

    updateThresholdTypeUI();
    updateThresholdUI();

    sampleRateChangeListener();

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
    updateNavigationUI();
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

    const filterIndex = getFilterType();
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

    const filterTypes = ['low', 'band', 'high', 'none'];
    const filterType = filterTypes[getFilterRadioValue()];

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

    return parseFloat(playbackSpeedSelect.value);

}

/**
 * Get playback/export volume
 * @returns Volume to play and export audio in video and audio output
 */
function getVolume () {

    return parseFloat(volumeSelect.value);

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

/* Build an array of X axis locations which map to playback progress */

function fillSkipArray () {

    const thresholdTypeIndex = getThresholdTypeIndex();

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
    return n;

}

/* Convert an array of values to a percentage array of length outputSize */

function convertSkipArray (inputArray, maxValue, outputSize) {

    if (!Array.isArray(inputArray) || inputArray.length === 0 || outputSize === 0) {

        return [];

    }

    const resultArray = new Array(outputSize);
    const step = inputArray.length / outputSize;

    for (let i = 0; i < outputSize; i++) {

        const index = Math.floor(i * step);
        resultArray[i] = inputArray[index];

    }

    const scaledArray = resultArray.map((value) => ((value / maxValue) * 100).toFixed(3));

    return scaledArray;

}

/**
 * Create a set of samples at a sample rate of MIN_SAMPLE_RATE with a user-selected filter applied as well as a Nyquist low-pass filter
 * @param {Array} outputArray Where to store the samples
 * @returns success: true if successful, false otherwise. error: error message if not successful
 */
function createMinSampleRateSamples (outputArray) {

    const targetSampleRate = getSampleRate();

    const downsampledMinSamples = new Int16Array(trueSampleCount);

    /* Downsample to minimum sample rate (8 kHz) */

    const downsampleResult = downsample(unfilteredSamples, getTrueSampleRate(), downsampledMinSamples, MIN_SAMPLE_RATE, false);

    if (!downsampleResult.success) {

        return {
            success: false,
            error: downsampleResult.error
        };

    }

    /* Apply low-pass filter at Nyquist limit of targeted sample rate (e.g. 500 Hz). If user-selected filters are also required, combine them */

    let lowPassFilterValue;
    let highPassFilterValue;
    let bandPassFilterValue0, bandPassFilterValue1;

    const nyquistLimit = targetSampleRate / 2;

    const filterIndex = getFilterType();

    switch (filterIndex) {

    case FILTER_NONE:
    case FILTER_LOW:

        if (filterIndex === FILTER_LOW) {

            console.log('Attempting to apply low-pass filter at ' + lowPassFilterValue + ' Hz and Nyquist low-pass filter at ' + nyquistLimit + ' Hz');

            lowPassFilterValue = Math.min(lowPassFilterSlider.getValue(), nyquistLimit);

        } else {

            console.log('Attempting to apply Nyquist low-pass filter at ' + nyquistLimit + ' Hz');

            lowPassFilterValue = nyquistLimit;

        }

        console.log('Applying low-pass filter at ' + lowPassFilterValue + ' Hz');

        applyLowPassFilter(downsampledMinSamples, trueSampleCount, outputArray, MIN_SAMPLE_RATE, lowPassFilterValue);

        break;
    case FILTER_HIGH:

        highPassFilterValue = highPassFilterSlider.getValue();

        console.log('Combined high-pass filter at ' + highPassFilterValue + ' Hz and Nyquist low-pass filter at ' + nyquistLimit + ' Hz');
        console.log('Applying band-pass filter between ' + highPassFilterValue + ' and ' + nyquistLimit + ' Hz');

        applyBandPassFilter(downsampledMinSamples, trueSampleCount, outputArray, MIN_SAMPLE_RATE, highPassFilterValue, nyquistLimit);

        break;
    case FILTER_BAND:

        bandPassFilterValue0 = Math.min(...bandPassFilterSlider.getValue());
        bandPassFilterValue1 = Math.max(...bandPassFilterSlider.getValue());

        console.log('Attempting to apply band-pass filter between ' + bandPassFilterValue0 + ' and ' + bandPassFilterValue1 + ' Hz and Nyquist low-pass filter at ' + nyquistLimit + 'Hz');

        bandPassFilterValue1 = Math.min(bandPassFilterValue1, nyquistLimit);

        console.log('Applying band-pass filter between ' + bandPassFilterValue0 + ' and ' + bandPassFilterValue1 + ' Hz');

        applyBandPassFilter(downsampledMinSamples, trueSampleCount, outputArray, MIN_SAMPLE_RATE, bandPassFilterValue0, bandPassFilterValue1);

        break;

    }

    return {
        success: true
    };

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
            disableLowFrequencyControls();

            resetButton.disabled = true;
            exportButton.disabled = true;
            exportModalButton.disabled = true;
            exportAudioButton.disabled = true;
            exportVideoButton.disabled = true;

            playbackSpeedSelect.disabled = true;
            volumeSelect.disabled = true;
            playbackModeSelect.disabled = true;

            settingsModalButton.disabled = true;

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

        const filterIndex = getFilterType();

        let samples;

        if (getSampleRate() < MIN_SAMPLE_RATE) {

            samples = new Int16Array(trueSampleCount);
            const minSampleRateSamplesResult = createMinSampleRateSamples(samples);

            if (!minSampleRateSamplesResult.success) {

                console.error(minSampleRateSamplesResult.error);
                showErrorDisplay('Failed to downsample audio.');

                stopEvent();

                return;

            }

        } else {

            samples = filterIndex !== FILTER_NONE ? filteredSamples : downsampledUnfilteredSamples;

        }

        let playbackBufferLength = displayLength;

        const thresholdTypeIndex = getThresholdTypeIndex();

        // If playback mode is to skip thresholded periods, build an array of X axis locations which map to playback progress

        if (playbackMode === PLAYBACK_MODE_SKIP) {

            playbackBufferLength = fillSkipArray();

        }

        // Play the samples

        if (playbackBufferLength > 0) {

            // If sample rate is below minimum, rescale values to match altered sample rate

            const unthresholdedSamples = (getSampleRate() >= MIN_SAMPLE_RATE && thresholdTypeIndex === THRESHOLD_TYPE_GOERTZEL) ? samplesAboveGoertzelThreshold : samplesAboveThreshold;

            const lowSampleRateMultiplier = getSampleRate() < MIN_SAMPLE_RATE ? MIN_SAMPLE_RATE / getSampleRate() : 1;

            const playOffset = offset * lowSampleRateMultiplier;
            const playDisplayLength = displayLength * lowSampleRateMultiplier;

            const playSampleRate = Math.max(MIN_SAMPLE_RATE, getSampleRate());

            const playPlaybackBufferLength = playbackBufferLength * lowSampleRateMultiplier;

            const playPlaybackMode = getSampleRate() < MIN_SAMPLE_RATE ? PLAYBACK_MODE_ALL : playbackMode;

            playAudio(samples, unthresholdedSamples, playOffset, playDisplayLength, playSampleRate, playbackRate, playPlaybackMode, playPlaybackBufferLength, getVolume(), stopEvent);

            // Start animation loop

            playAnimation();

        } else {

            stopEvent();

        }

    }

});

// Export UI

function createExportCanvas (exportFunction) {

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

    const fileName = fileSpan.innerText.replace(/\.[^/.]+$/, '');

    return exportFunction(canvas0array, canvas1array, timeLabelSVG, xAxisHeading, yAxis0svg, yAxis1svg, plot0yAxis, plot1yAxis, linesY0, linesY1, fileName, title);

}

exportPNGButton.addEventListener('click', () => {

    createExportCanvas(exportPNG);

    exportCloseButton.click();

});

exportJPGButton.addEventListener('click', () => {

    createExportCanvas(exportJPG);

    exportCloseButton.click();

});

exportPDFButton.addEventListener('click', () => {

    createExportCanvas(exportPDF);

    exportCloseButton.click();

});

exportAllButton.addEventListener('click', () => {

    createExportCanvas(exportPNG);
    createExportCanvas(exportJPG);
    createExportCanvas(exportPDF);

    exportCloseButton.click();

});

function handleExportAudioResult (err) {

    if (err) {

        console.error(err);

        showErrorDisplay(err);

    }

}

function getAudioForExport (useLowSampleRateProcessing) {

    // Get mode which dictates how amplitude thresholded periods are handled

    const playbackMode = getPlaybackMode();

    // Get currently displayed samples to play

    const filterIndex = getFilterType();

    let samples;
    let playbackBufferLength = displayLength;

    if (useLowSampleRateProcessing) {

        samples = new Int16Array(trueSampleCount);
        const minSampleRateSamplesResult = createMinSampleRateSamples(samples);

        if (!minSampleRateSamplesResult.success) {

            console.error(minSampleRateSamplesResult.error);
            showErrorDisplay('Failed to downsample audio.');

            return {
                success: false,
                error: minSampleRateSamplesResult.error
            };

        }

        playbackBufferLength = MIN_SAMPLE_RATE / getSampleRate() * displayLength;

    } else {

        samples = filterIndex !== FILTER_NONE ? filteredSamples : downsampledUnfilteredSamples;

    }

    const thresholdTypeIndex = getThresholdTypeIndex();

    // If playback mode is to skip thresholded periods, build an array of X axis locations which map to playback progress

    if (!useLowSampleRateProcessing && playbackMode === PLAYBACK_MODE_SKIP) {

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

    return {
        success: true,
        samples: samples,
        thresholdTypeIndex: useLowSampleRateProcessing ? THRESHOLD_TYPE_NONE : thresholdTypeIndex,
        playbackBufferLength: playbackBufferLength,
        playbackMode: useLowSampleRateProcessing ? PLAYBACK_MODE_ALL : playbackMode
    };

}

exportAudioButton.addEventListener('click', () => {

    const audioData = getAudioForExport(false);

    const playbackBufferLength = audioData.playbackBufferLength;
    const thresholdTypeIndex = audioData.thresholdTypeIndex;
    const samples = audioData.samples;
    const playbackMode = audioData.playbackMode;

    // Export audio as WAV file

    if (playbackBufferLength > 0) {

        let fileName = fileSpan.innerText;

        fileName = (fileName.toLowerCase().includes('.wav')) ? fileName : fileName + '.wav';

        exportAudio(samples, (thresholdTypeIndex === THRESHOLD_TYPE_GOERTZEL) ? samplesAboveGoertzelThreshold : samplesAboveThreshold, offset, displayLength, getSampleRate(), playbackMode, playbackBufferLength, fileName, handleExportAudioResult);

    } else {

        showErrorDisplay('File was not written. File length would be 0 samples.');

    }

});

exportVideoButton.addEventListener('click', () => {

    disableUI();

    // Replace video icon with spinner

    exportVideoIcon.style.display = 'none';
    exportVideoSpinner.style.display = '';

    // Create audio blob

    const exportAudioDataResult = getAudioForExport(getSampleRate() < MIN_SAMPLE_RATE);

    if (!exportAudioDataResult.success) {

        showErrorDisplay('File was not written. Failed to downsample audio.');

        reenableUI();

        exportVideoIcon.style.display = '';
        exportVideoSpinner.style.display = 'none';

        return;

    }

    const playbackBufferLength = exportAudioDataResult.playbackBufferLength;
    const thresholdTypeIndex = exportAudioDataResult.thresholdTypeIndex;
    const samples = exportAudioDataResult.samples;
    const playbackMode = exportAudioDataResult.playbackMode;

    if (playbackBufferLength <= 0) {

        // showErrorDisplay('File was not written. File length would be 0 samples.');

        reenableUI();

        exportVideoIcon.style.display = '';
        exportVideoSpinner.style.display = 'none';

        return;

    }

    // Prepare audio data

    const unthresholdedSamples = (thresholdTypeIndex === THRESHOLD_TYPE_GOERTZEL) ? samplesAboveGoertzelThreshold : samplesAboveThreshold;

    // If sample rate is below minimum, rescale values to match altered sample rate

    const minSampleRateMultiplier = MIN_SAMPLE_RATE / getSampleRate();

    const videoSampleRate = Math.max(MIN_SAMPLE_RATE, getSampleRate());
    const videoPlaybackMode = getSampleRate() < MIN_SAMPLE_RATE ? PLAYBACK_MODE_ALL : playbackMode;
    const videoDisplayLength = getSampleRate() < MIN_SAMPLE_RATE ? displayLength * minSampleRateMultiplier : displayLength;
    const videoOffset = getSampleRate() < MIN_SAMPLE_RATE ? offset * minSampleRateMultiplier : offset;

    const audioArray = createAudioArray(samples, unthresholdedSamples, videoOffset, videoDisplayLength, videoSampleRate, videoPlaybackMode, playbackBufferLength, getVolume(), getPlaybackRate());

    const header = new Uint8Array(audioArray[0]);

    const audioSamples = new Uint8Array(audioArray[1].buffer);

    // Build audio data object

    const audioFileArray = new Uint8Array(header.length + audioSamples.length);
    audioFileArray.set(header);
    audioFileArray.set(audioSamples, header.length);

    // Prepare image data

    const imageCanvas = createExportCanvas(createImageCanvas);

    // Prepare name for exported video

    const fileName = fileSpan.innerText.replace(/\.[^/.]+$/, '');

    // Calculate video length in samples

    let videoLengthSamples = displayLength;

    if (playbackMode === PLAYBACK_MODE_SKIP) {

        // If in skip mode, length of video is just the length of the unskipped period(s)

        videoLengthSamples = fillSkipArray();

    }

    // Calculate video length in milliseconds

    const videoLength = videoLengthSamples / sampleRate * 1000 / getPlaybackRate();

    // Create array of skipping x co-ordinates if needed

    let skipString = '-';

    if (playbackMode === PLAYBACK_MODE_SKIP && videoLineEnabled) {

        console.log('Creating skip array argument for ffmpeg.js');

        const percentageSkipArrayLength = 500;
        const percentageSkipArray = convertSkipArray(skippingXCoords, spectrogramPlaybackCanvas.width, percentageSkipArrayLength);

        skipString = percentageSkipArray.join('|');

    }

    // Process audio and image into video file

    exportVideo(imageCanvas, audioFileArray, videoLength, fileName, videoLineEnabled, fixedFpsEnabled, skipString, (succeeded) => {

        exportVideoIcon.style.display = '';
        exportVideoSpinner.style.display = 'none';

        console.log('-------');

        if (succeeded) {

            console.log('Finished exporting video file');

        } else {

            console.log('Failed to export video file');

            showErrorDisplay('Failed to export video file');

        }

        reenableUI();

    });

});

// Settings events

settingsModalButton.addEventListener('click', () => {

    settingsFileTimeCheckbox.checked = useFileTime;
    settingsDynamicColoursCheckbox.checked = useDynamicColours;
    settingsVideoLineCheckbox.checked = videoLineEnabled;
    settingsVideoFixedFPSCheckbox.checked = fixedFpsEnabled;
    settingsLowFrequencyCheckbox.checked = lowFrequencyEnabled;

    // Warn user that setting will do nothing to current file

    settingsFileTimeLabel.innerText = 'Display real time on x axis';

    if (fileTimestamp <= 0 || isTWAV()) {

        settingsFileTimeLabel.innerText += ' (timestamp not available for current file)';

    }

    settingsModal.show();

});

settingsApplyButton.addEventListener('click', () => {

    const changedUseFileTime = useFileTime !== settingsFileTimeCheckbox.checked;
    const changedUseDynamicColours = useDynamicColours !== settingsDynamicColoursCheckbox.checked;
    const changedColourMap = colourMapIndex !== parseInt(settingsMonochromeSelect.value);
    const changedLowFrequency = lowFrequencyEnabled !== settingsLowFrequencyCheckbox.checked;

    useFileTime = settingsFileTimeCheckbox.checked;
    useDynamicColours = settingsDynamicColoursCheckbox.checked;
    videoLineEnabled = settingsVideoLineCheckbox.checked;
    fixedFpsEnabled = settingsVideoFixedFPSCheckbox.checked;
    colourMapIndex = parseInt(settingsMonochromeSelect.value);
    lowFrequencyEnabled = settingsLowFrequencyCheckbox.checked;

    // If setting has been changed, update the relevant UI

    if (changedUseFileTime) {

        drawAxisLabels();
        drawAxisHeadings();

    }

    if (changedUseDynamicColours || changedColourMap) {

        setTimeout(() => {

            updatePlots(false, true, false, false, false);

        }, 0);

    }

    if (changedLowFrequency) {

        if (lowFrequencyEnabled) {

            showLowFrequencyTabs();

        } else {

            standardTabButton.click();
            hideLowFrequencyTabs();

        }

    }

    settingsModal.hide();

});

// Each new window needs a unique name so multiple windows can be opened

let popupCount = 0;

launchAppLink.addEventListener('click', () => {

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    const windowHeight = isSafari ? 816 : 790;

    const features = 'directories=no,menubar=no,status=no,titlebar=no,toolbar=no,width=1420,height=' + windowHeight;

    if (urlParams.get('dev')) {

        window.open('http://localhost:8000/?app=true', 'window' + popupCount++, features);

    } else {

        window.open('https://play.openacousticdevices.info/?app=true', 'window' + popupCount++, features);

    }

});

function loadPage () {

    // Start zoom and offset level on default values

    resetTransformations();
    updateNavigationUI();

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

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

    disabledFileButton.style.display = isChrome ? 'none' : '';
    fileButton.style.display = isChrome ? '' : 'none';

    if (!isChrome) {

        fileSelectionTitleDiv.classList.add('grey');
        fileSelectionTitleSpan.style.display = 'none';

        if (urlParams.get('app')) {

            browserErrorSpanApp.style.display = '';

        } else {

            browserErrorSpan.style.display = '';

        }

    }

    // Check for low frequency mode

    if (urlParams.get('infra')) {

        lowFrequencyEnabled = true;
        showLowFrequencyTabs();

    } else {

        hideLowFrequencyTabs();

    }

    // Check for dev mode

    instructionsContent.style.display = '';

    if (urlParams.get('dev')) {

        loadingSpan.style.display = 'none';
        spectrogramLoadingSVG.style.display = 'none';
        waveformLoadingSVG.style.display = 'none';

        fileButton.disabled = false;

    } else if (urlParams.get('app')) {

        console.log('APP MODE - Hiding instructions and link to app mode');
        instructionsContent.style.display = 'none';
        launchAppLink.style.display = 'none';

        loadingSpan.style.display = 'none';
        spectrogramLoadingSVG.style.display = 'none';
        waveformLoadingSVG.style.display = 'none';

        fileButton.disabled = false;

    } else {

        loadExampleFiles();

    }

}

window.addEventListener('load', () => {

    // Register service worker

    if (!('serviceWorker' in navigator)) {

        console.log('Service workers not supported');

        loadPage();

    } else {

        // Ensure service worker is updated

        navigator.serviceWorker.register('./worker.js').then(
            (registration) => {

                registration.update();

                registration.onupdatefound = () => {

                    const installingWorker = registration.installing;

                    installingWorker.onstatechange = () => {

                        if (installingWorker.state === 'installed') {

                            if (navigator.serviceWorker.controller) {

                                console.log('New or updated content is available.');

                            } else {

                                console.log('Content is now available offline!');

                            }

                        }

                    };

                };

            },
            (err) => {

                console.error('Service worker registration failed', err);

            }

        );

        navigator.serviceWorker.ready.then(() => {

            console.log('Ready');

            loadPage();

        });

    }

});

/* Check column tops match up and warn users to resize if needed */

document.addEventListener('DOMContentLoaded', checkColumnLayout);
window.addEventListener('resize', debounce(checkColumnLayout, 200));

function checkColumnLayout () {

    if (/Mobi|Android/i.test(navigator.userAgent) || resizeModalDontTellAgainCheckbox.checked) {

        return;

    }

    const column0 = document.getElementById('main-column0');
    const column1 = document.getElementById('main-column1');

    if (column0 && column1) {

        const column0Rect = column0.getBoundingClientRect();
        const column1Rect = column1.getBoundingClientRect();

        if (column0Rect.top !== column1Rect.top) {

            resizeModal.show();

        }

    }

}

function debounce (func, wait) {

    let timeout;

    return (...args) => {

        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);

    };

}
