/****************************************************************************
 * lowFrequency.js
 * openacousticdevices.info
 * December 2024
 *****************************************************************************/

/* global LOW_FREQUENCY_SAMPLE_RATES */
/* global filesTabButton, filesTab, extraSettingsDiv, previousTabIndex */

const thresholdSelection = document.getElementById('threshold-selection');

const standardInformationPanel = document.getElementById('size-information-panel');
const lowFrequencyInformationPanel = document.getElementById('low-frequency-information-panel');

const triggerTabButton = document.getElementById('trigger-tab-button');
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

function showLowFrequencyTabButton () {

    lowFrequencyTabButton.style.display = '';

}

function hideLowFrequencyTabButton () {

    lowFrequencyTabButton.style.display = 'none';

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

    triggerTabButton.addEventListener('click', () => {

        if (triggerTabButton.classList.contains('active')) {

            return;

        }

        const previousButtonWasFiles = filesTabButton.classList.contains('active');

        filesTabButton.classList.remove('active');
        filesTab.style.display = 'none';

        extraSettingsDiv.style.display = '';

        thresholdSelection.style.display = '';

        lowFrequencyInformationPanel.style.display = 'none';
        standardInformationPanel.style.display = '';

        triggerTabButton.classList.add('active');
        lowFrequencyTabButton.classList.remove('active');

        standardTab.style.display = '';
        lowFrequencyTab.style.display = 'none';

        displayingLowFrequencyUI = false;

        // If the previous tab was Files, then check if the tab before it was Trigger Settings or Low Frequency

        if (!previousButtonWasFiles) {

            listener();

        } else if (previousTabIndex === 2) {

            listener();

        }

    });

}

function addLowFrequencyTabOpenListener (listener) {

    lowFrequencyTabButton.addEventListener('click', () => {

        if (lowFrequencyTabButton.classList.contains('active')) {

            return;

        }

        const previousButtonWasFiles = filesTabButton.classList.contains('active');

        filesTabButton.classList.remove('active');
        filesTab.style.display = 'none';

        extraSettingsDiv.style.display = '';

        thresholdSelection.style.display = 'none';

        standardInformationPanel.style.display = 'none';
        lowFrequencyInformationPanel.style.display = '';

        lowFrequencyRadioButtons[lowFrequencyRadioButtons.length - 1].checked = true;
        disabledInfrasoundRadioButtons[disabledInfrasoundRadioButtons.length - 1].checked = true;

        lowFrequencyTabButton.classList.add('active');
        triggerTabButton.classList.remove('active');

        lowFrequencyTab.style.display = '';
        standardTab.style.display = 'none';

        displayingLowFrequencyUI = true;

        // If the previous tab was Files, then check if the tab before it was Trigger Settings or Low Frequency

        if (!previousButtonWasFiles) {

            listener();

        } else if (previousTabIndex === 1) {

            listener();

        }

    });

}
