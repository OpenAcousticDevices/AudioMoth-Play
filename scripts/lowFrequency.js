/****************************************************************************
 * lowFrequency.js
 * openacousticdevices.info
 * December 2024
 *****************************************************************************/

/* global LOW_FREQUENCY_SAMPLE_RATES */

const lowFrequencyTabs = document.getElementById('low-frequency-tabs');

const thresholdSelection = document.getElementById('threshold-selection');

const standardInformationPanel = document.getElementById('size-information-panel');
const lowFrequencyInformationPanel = document.getElementById('low-frequency-information-panel');

const standardTabButton = document.getElementById('standard-tab-button');
const lowFrequencyTabButton = document.getElementById('low-frequency-tab-button');

const standardTab = document.getElementById('standard-tab');
const lowFrequencyTab = document.getElementById('low-frequency-tab');

const lowFrequencyRadioButtons = document.getElementsByName('low-frequency-sample-rate-radio');
const disabledInfrasoundRadioButtons = document.getElementsByName('low-frequency-disabled-sample-rate-radio');

const lowFrequencySampleRateHolder = document.getElementById('low-frequency-sample-rate-holder');
const lowFrequencyDisabledSampleRateHolder = document.getElementById('low-frequency-disabled-sample-rate-holder');

let displayingLowFrequencyUI = false;

function disableLowFrequencyControls () {

    lowFrequencySampleRateHolder.style.display = 'none';
    lowFrequencyDisabledSampleRateHolder.style.display = '';

}

function enableLowFrequencyControls () {

    lowFrequencySampleRateHolder.style.display = '';
    lowFrequencyDisabledSampleRateHolder.style.display = 'none';

}

function getLowFrequencySampleRate () {

    const selectedRadioButtonIndex = parseInt(document.querySelector('input[name="low-frequency-sample-rate-radio"]:checked').value, 10);
    return LOW_FREQUENCY_SAMPLE_RATES[selectedRadioButtonIndex];

}

function isLowFrequencyTabEnabled () {

    return displayingLowFrequencyUI;

}

function showLowFrequencyTabs () {

    lowFrequencyTabs.style.display = '';

}

function hideLowFrequencyTabs () {

    lowFrequencyTabs.style.display = 'none';

}

function addLowFrequencyRadioButtonListeners (listener) {

    for (let i = 0; i < lowFrequencyRadioButtons.length; i++) {

        const lowFrequencyRadioButton = lowFrequencyRadioButtons[i];

        lowFrequencyRadioButton.addEventListener('change', () => {

            disabledInfrasoundRadioButtons[i].checked = true;

            listener(LOW_FREQUENCY_SAMPLE_RATES[i]);

        });

    }

}

function addLowFrequencyTabCloseListener (listener) {

    // Listener will reset the sample rate back to what it was before

    standardTabButton.addEventListener('click', () => {

        if (standardTabButton.classList.contains('active')) {

            return;

        }

        thresholdSelection.style.display = '';

        lowFrequencyInformationPanel.style.display = 'none';
        standardInformationPanel.style.display = '';

        standardTabButton.classList.add('active');
        lowFrequencyTabButton.classList.remove('active');

        standardTab.style.display = '';
        lowFrequencyTab.style.display = 'none';

        displayingLowFrequencyUI = false;

        listener();

    });

}

function addLowFrequencyTabOpenListener (listener) {

    lowFrequencyTabButton.addEventListener('click', () => {

        if (lowFrequencyTabButton.classList.contains('active')) {

            return;

        }

        thresholdSelection.style.display = 'none';

        standardInformationPanel.style.display = 'none';
        lowFrequencyInformationPanel.style.display = '';

        lowFrequencyRadioButtons[lowFrequencyRadioButtons.length - 1].checked = true;
        disabledInfrasoundRadioButtons[disabledInfrasoundRadioButtons.length - 1].checked = true;

        lowFrequencyTabButton.classList.add('active');
        standardTabButton.classList.remove('active');

        lowFrequencyTab.style.display = '';
        standardTab.style.display = 'none';

        displayingLowFrequencyUI = true;

        listener();

    });

}
