/****************************************************************************
 * wavReader.js
 * openacousticdevices.info
 * June 2021
 *****************************************************************************/

/* global UINT16_LENGTH, UINT32_LENGTH, RIFF_ID_LENGTH, LENGTH_OF_WAV_HEADER, MAXIMUM_LENGTH_OF_WAV_HEADER */
/* global PCM_WAV_FORMAT, EXTENSIBLE_WAV_FORMAT, NUMBER_OF_CHANNELS, NUMBER_OF_BITS_IN_SAMPLE, NUMBER_OF_BYTES_IN_SAMPLE, LENGTH_OF_WAV_FORMAT, VALID_RESAMPLE_RATES, VALID_AUDIOMOTH_SAMPLE_RATES */
/* global resampleOutputLength, resample */

const MAXIMUM_FILE_DURATION = 60;

/* WAV header component read functions */

/* WAV header base component read functions */

function readString (state, length) {

    if (state.buffer.length - state.index < length) throw new Error('WAVE header exceeded buffer length.');

    const utf8decoder = new TextDecoder();

    const bufferSplit = state.buffer.slice(state.index, state.index + length);

    const intBuffer = new Uint8Array(bufferSplit);
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

        const formatValid = header.wavFormat.format === PCM_WAV_FORMAT || header.wavFormat.format === EXTENSIBLE_WAV_FORMAT;

        if (!formatValid || header.wavFormat.numberOfChannels !== NUMBER_OF_CHANNELS || header.wavFormat.bytesPerSecond !== NUMBER_OF_BYTES_IN_SAMPLE * header.wavFormat.samplesPerSecond || header.wavFormat.bytesPerCapture !== NUMBER_OF_BYTES_IN_SAMPLE || header.wavFormat.bitsPerSample !== NUMBER_OF_BITS_IN_SAMPLE) {

            return {
                success: false,
                error: 'File format is not supported.'
            };

        }

        let sampleRateAcceptable = false;

        for (let i = 0; i < VALID_AUDIOMOTH_SAMPLE_RATES.length; i += 1) sampleRateAcceptable ||= (header.wavFormat.samplesPerSecond === VALID_AUDIOMOTH_SAMPLE_RATES[i]);

        for (let i = 0; i < VALID_RESAMPLE_RATES.length; i += 1) sampleRateAcceptable ||= (header.wavFormat.samplesPerSecond === VALID_RESAMPLE_RATES[i]);

        if (sampleRateAcceptable === false) {

            return {
                success: false,
                error: 'Sample rate is not supported.'
            };

        }

        state.index += header.fmt.size - LENGTH_OF_WAV_FORMAT;

        /* Find the data chunk */

        while (true) {

            const id = readString(state, RIFF_ID_LENGTH);

            if (id === 'INFO') continue;

            const size = readUInt32LE(state);

            if (id === 'ICMT') {

                header.icmt = {id: id, size: size};

                header.icmt.comment = readString(state, size);

            } else if (id === 'IART') {

                header.iart = {id: id, size: size};

                header.iart.artist = readString(state, size);

            } else if (id === 'data') {

                header.data = {id: id, size: size};

                header.size = state.index;

                if (header.data.size + header.size > fileSize) {

                    console.log('WAVE READER: DATA chunk size exceeds file size.');

                    header.data.size = NUMBER_OF_BYTES_IN_SAMPLE * Math.floor((fileSize - header.size) / NUMBER_OF_BYTES_IN_SAMPLE);

                }

                if (header.data.size + header.size < fileSize) {

                    console.log('WAVE READER: DATA chunk is followed by additional header information.');

                }

                return {
                    success: true,
                    header: header
                };

            } else if (id !== 'LIST') {

                state.index += size;

            }

            state.index += size & 0x01 ? 1 : 0;

        }

    } catch (e) {

        /* An error has occurred */

        console.error(e.message);

        return {
            success: false,
            error: 'An error occurred whilst reading the WAV file.'
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

        if (header.wavFormat.format !== PCM_WAV_FORMAT || header.wavFormat.numberOfChannels !== NUMBER_OF_CHANNELS || header.wavFormat.bytesPerSecond !== NUMBER_OF_BYTES_IN_SAMPLE * header.wavFormat.samplesPerSecond || header.wavFormat.bytesPerCapture !== NUMBER_OF_BYTES_IN_SAMPLE || header.wavFormat.bitsPerSample !== NUMBER_OF_BITS_IN_SAMPLE) {

            return {
                success: false,
                error: 'Unexpected WAVE format.'
            };

        }

        let sampleRateAcceptable = false;

        for (let i = 0; i < VALID_AUDIOMOTH_SAMPLE_RATES.length; i += 1) sampleRateAcceptable ||= (header.wavFormat.samplesPerSecond === VALID_AUDIOMOTH_SAMPLE_RATES[i]);

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

function readSamples (header, samples, originalDataSize) {

    const sampleRate = header.wavFormat.samplesPerSecond;

    /* Check for samples */

    if (originalDataSize === 0) {

        return {
            success: false,
            error: 'Input file has no audio samples.'
        };

    }

    /* Check if resampling is necessary */

    let resampled = false;

    for (let i = 0; i < VALID_RESAMPLE_RATES.length; i += 1) resampled ||= (sampleRate === VALID_RESAMPLE_RATES[i]);

    /* Read the samples */

    let resampleRate;

    let resampledSamples;

    if (resampled) {

        for (let i = 0; i < VALID_AUDIOMOTH_SAMPLE_RATES.length; i += 1) {

            resampleRate = VALID_AUDIOMOTH_SAMPLE_RATES[i];

            if (resampleRate > sampleRate) break;

        }

        const resampledSampleCount = resampleOutputLength(samples.length, sampleRate, resampleRate);

        resampledSamples = new Int16Array(resampledSampleCount);

        resample(samples, sampleRate, resampledSamples, resampleRate);

    }

    return {
        success: true,
        samples: resampled ? resampledSamples : samples,
        sampleRate: resampled ? resampleRate : sampleRate,
        resampled: resampled,
        comment: header.icmt ? header.icmt.comment : '',
        artist: header.iart ? header.iart.artist : '',
        originalDataSize: originalDataSize,
        originalSampleRate: sampleRate
    };

}

function readExampleWav (contents) {

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

    const sampleCount = Math.floor(header.data.size / NUMBER_OF_BYTES_IN_SAMPLE);

    if (sampleCount === 0) {

        return {
            success: false,
            error: 'Input file has no audio samples.'
        };

    }

    /* Read the samples */

    const samples = new Int16Array(contents, header.size, sampleCount);

    return readSamples(header, samples, header.data.size);

}

async function readWav (fileHandler, start, length) {

    let file, fileSize;

    try {

        file = await fileHandler.getFile();
        fileSize = file.size;

    } catch (e) {

        return {
            success: false,
            error: 'Could not read input file.'
        };

    }

    if (fileSize === 0) {

        return {
            success: false,
            error: 'Input file has zero size.'
        };

    }

    /* Check header */

    const headerBlob = file.slice(0, MAXIMUM_LENGTH_OF_WAV_HEADER);

    const buffer = await headerBlob.arrayBuffer();

    const headerResult = readGeneralHeader(buffer, fileSize);

    if (headerResult.success === false) {

        return {
            success: false,
            error: headerResult.error
        };

    }

    const header = headerResult.header;

    const headerLength = header.size;

    /* Check different sizes */

    const dataLength = header.data.size;

    const sampleRate = header.wavFormat.samplesPerSecond;

    /* Slice out relevant part of file */

    start = (start === undefined) ? 0 : start;

    const recordingLength = dataLength / UINT16_LENGTH / sampleRate - start;

    if (recordingLength > MAXIMUM_FILE_DURATION) {

        length = MAXIMUM_FILE_DURATION;

    }

    const startBytes = headerLength + (start * sampleRate * UINT16_LENGTH);
    const lengthBytes = length * sampleRate * UINT16_LENGTH;

    const fileSlice = length ? file.slice(startBytes, startBytes + lengthBytes) : file.slice(startBytes, startBytes + dataLength);
    const contents = await fileSlice.arrayBuffer();

    const samples = new Int16Array(contents);

    return readSamples(header, samples, header.data.size);

}

async function checkHeader (fileHandler) {

    const file = await fileHandler.getFile();
    const fileSize = file.size;

    const blob = file.slice(0, MAXIMUM_LENGTH_OF_WAV_HEADER);

    const buffer = await blob.arrayBuffer();

    return readGeneralHeader(buffer, fileSize);

}
