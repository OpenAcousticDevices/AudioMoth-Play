/****************************************************************************
 * folderSelection.js
 * openacousticdevices.info
 * April 2025
 *****************************************************************************/

/* global bootstrap */

/* global checkHeader, formatFileSize */

/* global triggerTabButton, lowFrequencyTabButton, standardTab, lowFrequencyTab */
/* global loadFile, showErrorDisplay */
/* global offset, displayLength */

// File/folder settings

let displayFileFolderModal = true;
let fileFolderMode = true; // true = file, false = folder

let rememberTransformations = true;

const fileFolderModal = new bootstrap.Modal(document.getElementById('file-folder-modal'));
const fileFolderSelectButton = document.getElementById('file-folder-select-button');

const filesTabButton = document.getElementById('files-tab-button');
const filesTab = document.getElementById('files-tab');
const extraSettingsDiv = document.getElementById('extra-settings-div');

let previousTabIndex = 0; // 0 = trigger settings, 1 = low frequency, 2 = files

const fileFolderDontAskAgainCheckbox = document.getElementById('file-folder-dont-ask-again-checkbox');

const folderNameSpan = document.getElementById('folder-name-span');
const fileCountSpan = document.getElementById('file-count-span');
const fileSSpan = document.getElementById('file-s-span');
const fileList = document.getElementById('file-list');

const fileNameSpan = document.getElementById('file-name-span');
const fileDateSpan = document.getElementById('file-date-span');
const fileTimeSpan = document.getElementById('file-time-span');
const fileSizeSpan = document.getElementById('file-size-span');
const fileLengthSpan = document.getElementById('file-length-span');
const fileSampleRateSpan = document.getElementById('file-sample-rate-span');

let folderFiles = [];
let fileInformation = [];

const openFileFromFolderButton = document.getElementById('open-file-from-folder-button');

let fileOffsets = [];
let fileDisplayLengths = [];

let displayedFileIndex = -1;

function setDisplayFileFolderModal (newValue) {

    displayFileFolderModal = newValue;

}

function getDisplayFileFolderModal () {

    return displayFileFolderModal;

}

function setRememberTransformations (newValue) {

    rememberTransformations = newValue;

}

function getRememberTransformations () {

    return rememberTransformations;

}

filesTabButton.addEventListener('click', () => {

    if (filesTabButton.classList.contains('active')) {

        return;

    }

    previousTabIndex = triggerTabButton.classList.contains('active') ? 0 : 1; // 0 = standard, 1 = low frequency

    filesTabButton.classList.add('active');
    triggerTabButton.classList.remove('active');
    lowFrequencyTabButton.classList.remove('active');

    filesTab.style.display = '';
    standardTab.style.display = 'none';
    lowFrequencyTab.style.display = 'none';

    extraSettingsDiv.style.display = 'none';

});

function resetFileInformationPanel () {

    fileNameSpan.innerText = 'No file selected';
    fileNameSpan.title = '';
    fileDateSpan.innerText = '--/--/----';
    fileTimeSpan.innerText = '--:--:--';
    fileSizeSpan.innerText = '-';
    fileLengthSpan.innerText = '-';
    fileSampleRateSpan.innerText = '-';

}

async function updateFileInformationPanel (index) {

    resetFileInformationPanel();

    const f = fileInformation[index];

    const maxDisplayNameLength = 30;
    const startLength = 10;

    let displayName = '-';

    if (f.name) {

        displayName = f.name;

        if (f.name.length > maxDisplayNameLength) {

            const start = f.name.substring(0, startLength);
            const end = f.name.substring(f.name.length - (maxDisplayNameLength - startLength - 3));
            displayName = `${start}...${end}`;

        }

    }

    fileNameSpan.innerText = displayName;
    fileNameSpan.title = f.name ? f.name : ''; // Set full name as hover-over text
    fileDateSpan.innerText = f.date ? f.date : '--/--/----';
    fileTimeSpan.innerText = f.time ? f.time : '--:--:--';
    fileSizeSpan.innerText = f.size ? f.size : '-';

    const formattedLength = formatTime(f.hours, f.minutes, f.seconds, f.milliseconds);
    fileLengthSpan.innerText = formattedLength;

    fileSampleRateSpan.innerText = f.sampleRate
        ? (f.sampleRate % 1000 === 0
            ? `${f.sampleRate / 1000} kHz`
            : `${(f.sampleRate / 1000).toFixed(1)} kHz`)
        : '-';

}

async function getWavFilesFromDirectory (directoryHandle) {

    const files = [];

    for await (const [name, handle] of directoryHandle.entries()) {

        if (handle.kind === 'file' && name.toUpperCase().endsWith('.WAV')) {

            files.push(handle);

        }

    }

    files.sort((a, b) => a.name.localeCompare(b.name));

    return files;

}

function formatTime (hours, minutes, seconds, milliseconds) {

    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return milliseconds ? `${formattedTime}.${String(milliseconds).padStart(3, '0')}` : formattedTime;

}

async function loadFolder () {

    let folderHandler;

    // Display folder picker

    try {

        folderHandler = await window.showDirectoryPicker({startIn: 'desktop'});

    } catch (error) {

        console.error('Request was aborted.');
        console.error(error);
        return;

    }

    // If no file was selected, return

    if (!folderHandler) {

        console.error('No folder selected.');
        return;

    }

    getWavFilesFromDirectory(folderHandler).then(async (files) => {

        folderNameSpan.innerText = folderHandler.name;

        if (files.length === 0) {

            console.error('No files found in folder.');
            return;

        }

        folderFiles = files;
        fileInformation = [];

        fileOffsets = [];
        fileDisplayLengths = [];

        displayedFileIndex = -1;

        // Switch to Files tab

        filesTabButton.style.display = '';
        filesTabButton.click();

        let i = 0;

        fileList.innerHTML = '';

        const regex = /^\d{8}_\d{6}.*\.wav$/i;

        const formattedLengths = []; // Array to store formatted lengths

        for (const file of folderFiles) {

            const newFileInformation = {
                name: file.name
            };

            const checkResult = await checkHeader(file);

            if (!checkResult.success) {

                console.error(file, checkResult.error);
                continue;

            } else {

                const header = checkResult.header;

                const sampleRate = header.wavFormat.samplesPerSecond;
                const lengthSamples = header.data.size / header.wavFormat.bytesPerCapture;

                const length = lengthSamples / sampleRate;

                console.log('File:', file.name, 'Length in seconds:', length);

                // Convert length to HH:MM:SS format
                const hours = Math.floor(length / 3600);
                const minutes = Math.floor((length % 3600) / 60);
                const seconds = Math.floor(length % 60);

                // If milliseconds are needed, calculate them
                let milliseconds = Math.floor((length % 1) * 1000);
                milliseconds = milliseconds > 0 ? milliseconds : false;

                newFileInformation.sampleRate = sampleRate;
                newFileInformation.hours = hours;
                newFileInformation.minutes = minutes;
                newFileInformation.seconds = seconds;
                newFileInformation.milliseconds = milliseconds;

            }

            fileOffsets.push(-1);
            fileDisplayLengths.push(-1);

            const f = await file.getFile();

            if (regex.test(file.name)) {

                const [datePart, timePart] = file.name.split('_');
                const year = parseInt(datePart.substring(0, 4), 10);
                const month = parseInt(datePart.substring(4, 6), 10) - 1;
                const day = parseInt(datePart.substring(6, 8), 10);
                const hours = parseInt(timePart.substring(0, 2), 10);
                const minutes = parseInt(timePart.substring(2, 4), 10);
                const seconds = parseInt(timePart.substring(4, 6), 10);

                const creationDate = new Date(year, month, day, hours, minutes, seconds);
                const testDate = new Date(year, month, day, 0, 0, 0);

                newFileInformation.date = testDate.getTime() <= 0 ? '--/--/----' : creationDate.toLocaleDateString();
                newFileInformation.time = creationDate.toLocaleTimeString();

                // console.log('Reading date/time from file name:', file.name, '=>', creationDate.toLocaleDateString(), creationDate.toLocaleTimeString());

            } else {

                // console.log('Reading date/time from file header:', f.lastModifiedDate.toLocaleDateString(), f.lastModifiedDate.toLocaleTimeString());

                newFileInformation.date = f.lastModifiedDate.toLocaleDateString();
                newFileInformation.time = f.lastModifiedDate.toLocaleTimeString();

            }

            const fileSizeInBytes = f.size;

            newFileInformation.size = formatFileSize(fileSizeInBytes);

            const formattedLength = formatTime(newFileInformation.hours, newFileInformation.minutes, newFileInformation.seconds);
            formattedLengths.push(formattedLength);

            const listItem = document.createElement('option');
            let displayName = file.name;
            if (file.name.length > 42) {

                const start = file.name.substring(0, 20);
                const end = file.name.substring(file.name.length - (42 - 23)); // 23 = 20 (start) + 3 ("...")
                displayName = `${start}...${end}`;

            }
            listItem.innerHTML = displayName;
            listItem.value = i;

            fileList.appendChild(listItem);

            fileInformation.push(newFileInformation);

            i++;

        }

        fileCountSpan.innerText = i.toString();
        fileSSpan.style.display = i === 1 ? 'none' : '';

        openFileFromFolderButton.disabled = i === 0;

        // Adjust padding and align formatted lengths
        const paddingRight = parseInt(window.getComputedStyle(fileList).paddingRight, 10) || 0;

        // Dynamically calculate the width of a character
        const testSpan = document.createElement('span');
        testSpan.style.font = window.getComputedStyle(fileList).font;
        testSpan.style.visibility = 'hidden';
        testSpan.innerText = 'A'; // Use a representative character
        document.body.appendChild(testSpan);
        const averageCharWidth = testSpan.getBoundingClientRect().width;
        document.body.removeChild(testSpan);

        const charW = Math.floor((fileList.clientWidth - paddingRight) / averageCharWidth);

        Array.from(fileList.options).forEach((listItem, index) => {

            const fileSizeLength = formattedLengths[index] ? formattedLengths[index].length : 8;

            const padding = charW - listItem.innerHTML.length - fileSizeLength - 1;

            for (let j = 0; j < padding; j++) {

                listItem.innerHTML += '&nbsp;';

            }

            listItem.innerHTML += formattedLengths[index] ? formattedLengths[index] : '--:--:--';

        });

        fileList.addEventListener('change', () => {

            const index = parseInt(fileList.value);
            updateFileInformationPanel(index);

        });

    });

}

fileFolderSelectButton.addEventListener('click', () => {

    fileFolderMode = document.querySelector('input[name="file-folder-option"]:checked').value === 'file';

    setDisplayFileFolderModal(!fileFolderDontAskAgainCheckbox.checked);

    // Hide modal and run folder/file selection

    fileFolderModal.hide();

    if (fileFolderMode) {

        filesTabButton.style.display = 'none';

        if (previousTabIndex === 0) {

            triggerTabButton.click();

        } else {

            lowFrequencyTabButton.click();

        }

        try {

            loadFile();

        } catch (error) {

            showErrorDisplay('File could not be opened.');

        }

    } else {

        loadFolder();

    }

});

function getSelectedFileIndex () {

    return parseInt(fileList.value);

}

function getFolderFile () {

    return folderFiles[getSelectedFileIndex()];

}

function openFileFromFolder () {

    if (displayedFileIndex !== -1) {

        fileOffsets[displayedFileIndex] = offset;
        fileDisplayLengths[displayedFileIndex] = displayLength;

    }

    const selectedFileOffset = rememberTransformations ? fileOffsets[getSelectedFileIndex()] : -1;
    const selectedFileDisplayLength = rememberTransformations ? fileDisplayLengths[getSelectedFileIndex()] : -1;

    try {

        loadFile(null, null, getFolderFile(), selectedFileOffset, selectedFileDisplayLength);

        displayedFileIndex = getSelectedFileIndex();

    } catch (error) {

        showErrorDisplay('File could not be opened.');

    }

}

openFileFromFolderButton.addEventListener('click', openFileFromFolder);
fileList.addEventListener('dblclick', openFileFromFolder);
