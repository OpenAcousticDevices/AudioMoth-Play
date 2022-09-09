/****************************************************************************
 * wavReader.js
 * openacousticdevices.info
 * June 2021
 *****************************************************************************/

/* global UINT16_LENGTH, UINT32_LENGTH, RIFF_ID_LENGTH */
/* global PCM_FORMAT, NUMBER_OF_CHANNELS, NUMBER_OF_BITS_IN_SAMPLE, NUMBER_OF_BYTES_IN_SAMPLE, VALID_GENERAL_SAMPLE_RATES, VALID_AUDIOMOTH_SAMPLE_RATES, CD_SAMPLE_RATE, RESAMPLED_CD_SAMPLE_RATE */
/* global resampleOutputLength, resample */

/* WAV header component read functions */

/* WAV header base component read functions */

function readString (state, length) {

    if (state.buffer.length - state.index < length) throw new Error('WAVE header exceeded buffer length.');

    const utf8decoder = new TextDecoder();

    const bufferSplit = state.buffer.slice(state.index, state.index + length);
    const intBuffer = new Uint16Array(bufferSplit);
    const result = utf8decoder.decode(intBuffer).replace(/\0/g, '');

    state.index += length;
    return result;

}

function readUInt32LE (state) {

    if (state.buffer.length - state.index < UINT32_LENGTH) throw new Error('WAVE header exceeded buffer length.');

    const bufferSplit = state.buffer.slice(state.index, state.index + UINT32_LENGTH);
    const dataView = new DataView(bufferSplit);
    const result = dataView.getUint32(0, true);

    state.index += UINT32_LENGTH;
    return result;

}

function readUInt16LE (state) {

    if (state.buffer.length - state.index < UINT16_LENGTH) throw new Error('WAVE header exceeded buffer length.');

    const bufferSplit = state.buffer.slice(state.index, state.index + UINT16_LENGTH);
    const dataView = new DataView(bufferSplit);
    const result = dataView.getUint16(0, true);

    state.index += UINT16_LENGTH;
    return result;

}

/* WAV header high-level component read functions */

function readID (state, id) {

    const result = readString(state, id.length);

    if (result !== id) throw new Error('Could not find ' + id + ' ID.');

    return result;

}

function readChunk (state, id) {

    const result = {};

    result.id = readString(state, RIFF_ID_LENGTH);

    if (result.id !== id) throw new Error('Could not find ' + id.replace(' ', '') + ' chunk ID.');

    result.size = readUInt32LE(state);

    return result;

}

/* WAV header read and write functions */

function readGeneralHeader (buffer, fileSize) {

    const header = {};

    const state = {buffer: buffer, index: 0};

    try {

        /* Read RIFF chunk */

        header.riff = readChunk(state, 'RIFF');

        if (header.riff.size + RIFF_ID_LENGTH + UINT32_LENGTH !== fileSize) {

            console.log('WAVE READER: RIFF chunk size does not match file size.');

        }

        /* Read WAVE ID */

        header.format = readID(state, 'WAVE');

        /* Find the FMT chunk */

        while (true) {

            const id = readString(state, RIFF_ID_LENGTH);

            const size = readUInt32LE(state);

            if (id === 'fmt ') {

                header.fmt = {id: 'fmt ', size: size};

                break;

            }

            state.index += size;

        }

        /* Read FMT chunk */

        header.wavFormat = {};
        header.wavFormat.format = readUInt16LE(state);
        header.wavFormat.numberOfChannels = readUInt16LE(state);
        header.wavFormat.samplesPerSecond = readUInt32LE(state);
        header.wavFormat.bytesPerSecond = readUInt32LE(state);
        header.wavFormat.bytesPerCapture = readUInt16LE(state);
        header.wavFormat.bitsPerSample = readUInt16LE(state);

        if (header.wavFormat.format !== PCM_FORMAT || header.wavFormat.numberOfChannels !== NUMBER_OF_CHANNELS || header.wavFormat.bytesPerSecond !== NUMBER_OF_BYTES_IN_SAMPLE * header.wavFormat.samplesPerSecond || header.wavFormat.bytesPerCapture !== NUMBER_OF_BYTES_IN_SAMPLE || header.wavFormat.bitsPerSample !== NUMBER_OF_BITS_IN_SAMPLE) {

            return {
                success: false,
                error: 'Unexpected WAVE format.'
            };

        }

        let sampleRateAcceptable = false;

        for (let i = 0; i < VALID_GENERAL_SAMPLE_RATES.length; i += 1) sampleRateAcceptable ||= (header.wavFormat.samplesPerSecond === VALID_GENERAL_SAMPLE_RATES[i]);

        if (sampleRateAcceptable === false) {

            return {
                success: false,
                error: 'Sample rate is not supported.'
            };

        }

        /* Find the data chunk */

        while (true) {

            const id = readString(state, RIFF_ID_LENGTH);

            const size = readUInt32LE(state);

            if (id === 'data') {

                header.data = {id: 'data', size: size};

                header.size = state.index;

                if (header.data.size + header.size > fileSize) {

                    console.log('WAVE READER: DATA chunk size exceeds file size.');

                    header.data.size = NUMBER_OF_BYTES_IN_SAMPLE * Math.floor((fileSize - header.size) / NUMBER_OF_BYTES_IN_SAMPLE);

                }

                return {
                    success: true,
                    header: header
                };

            }

            state.index += size;

        }

    } catch (e) {

        /* An error has occurred */

        return {
            success: false,
            error: e.message
        };

    }

}

function readAudioMothHeader (buffer, fileSize) {

    const header = {};

    const state = {buffer: buffer, index: 0};

    try {

        /* Read RIFF chunk */

        header.riff = readChunk(state, 'RIFF');

        if (header.riff.size + RIFF_ID_LENGTH + UINT32_LENGTH !== fileSize) {

            return {
                success: false,
                error: 'RIFF chunk size does not match file size.'
            };

        }

        /* Read WAVE ID */

        header.format = readID(state, 'WAVE');

        /* Read FMT chunk */

        header.fmt = readChunk(state, 'fmt ');

        header.wavFormat = {};
        header.wavFormat.format = readUInt16LE(state);
        header.wavFormat.numberOfChannels = readUInt16LE(state);
        header.wavFormat.samplesPerSecond = readUInt32LE(state);
        header.wavFormat.bytesPerSecond = readUInt32LE(state);
        header.wavFormat.bytesPerCapture = readUInt16LE(state);
        header.wavFormat.bitsPerSample = readUInt16LE(state);

        if (header.wavFormat.format !== PCM_FORMAT || header.wavFormat.numberOfChannels !== NUMBER_OF_CHANNELS || header.wavFormat.bytesPerSecond !== NUMBER_OF_BYTES_IN_SAMPLE * header.wavFormat.samplesPerSecond || header.wavFormat.bytesPerCapture !== NUMBER_OF_BYTES_IN_SAMPLE || header.wavFormat.bitsPerSample !== NUMBER_OF_BITS_IN_SAMPLE) {

            return {
                success: false,
                error: 'Unexpected WAVE format.'
            };

        }

        let sampleRateAcceptable = false;

        for (let i = 0; i < VALID_AUDIOMOTH_SAMPLE_RATES.length; i += 1) sampleRateAcceptable ||= (header.wavFormat.samplesPerSecond === VALID_GENERAL_SAMPLE_RATES[i]);

        if (sampleRateAcceptable === false) {

            return {
                success: false,
                error: 'Sample rate is not acceptable.'
            };

        }

        /* Read LIST chunk */

        header.list = readChunk(state, 'LIST');

        /* Read INFO ID */

        header.info = readID(state, 'INFO');

        /* Read ICMT chunk */

        header.icmt = readChunk(state, 'ICMT');

        header.icmt.comment = readString(state, header.icmt.size);

        /* Read IART chunk */

        header.iart = readChunk(state, 'IART');

        header.iart.artist = readString(state, header.iart.size);

        /* Check LIST chunk size */

        if (header.list.size !== 3 * RIFF_ID_LENGTH + 2 * UINT32_LENGTH + header.iart.size + header.icmt.size) {

            return {
                success: false,
                error: 'LIST chunk size does not match total size of INFO, ICMT and IART chunks.'
            };

        }

        /* Read DATA chunk */

        header.data = readChunk(state, 'data');

        /* Set the header size and check DATA chunk size */

        header.size = state.index;

        if (header.data.size + header.size !== fileSize) {

            return {
                success: false,
                error: 'DATA chunk size does not match file size.'
            };

        }

        /* Success */

        return {
            success: true,
            header: header
        };

    } catch (e) {

        /* An error has occurred */

        return {
            success: false,
            error: e.message
        };

    }

}

function readWavContents (contents) {

    const fileSize = contents.byteLength;

    if (fileSize === 0) {

        return {
            success: false,
            error: 'Input file has zero size.'
        };

    }

    /* Check the header */

    const result = readGeneralHeader(contents, fileSize);

    if (result.success === false) {

        return {
            success: false,
            error: result.error
        };

    }

    const header = result.header;

    /* Check for samples */

    let sampleCount = Math.floor(header.data.size / NUMBER_OF_BYTES_IN_SAMPLE);

    if (sampleCount === 0) {

        return {
            success: false,
            error: 'Input file has no audio samples.'
        };

    }

    /* Check if resampling is necessary */

    const sampleRate = header.wavFormat.samplesPerSecond;

    const resampled = (sampleRate === CD_SAMPLE_RATE);

    /* Check if trimming is necessary */

    const MAXIMUM_FILE_DURATION = 60;

    const maximumSampleCount = sampleRate * MAXIMUM_FILE_DURATION;

    const trimmed = (sampleCount > maximumSampleCount);

    /* Read the samples */

    if (trimmed) sampleCount = maximumSampleCount;

    const samples = new Int16Array(contents, header.size, sampleCount);

    let resampledSamples;

    if (resampled) {

        const resampledSampleCount = resampleOutputLength(sampleCount, CD_SAMPLE_RATE, RESAMPLED_CD_SAMPLE_RATE);

        resampledSamples = new Int16Array(resampledSampleCount);

        resample(samples, CD_SAMPLE_RATE, resampledSamples, RESAMPLED_CD_SAMPLE_RATE);

    }

    return {
        success: true,
        samples: resampled ? resampledSamples : samples,
        sampleRate: resampled ? RESAMPLED_CD_SAMPLE_RATE : sampleRate,
        resampled: resampled,
        trimmed: trimmed
    };

}

async function readWav (fileHandler) {

    /* Open input file */

    let file, contents;

    try {

        file = await fileHandler.getFile();

        contents = await file.arrayBuffer();

    } catch (e) {

        return {
            success: false,
            error: 'Could not read input file.'
        };

    }

    return readWavContents(contents);

}
