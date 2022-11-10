/****************************************************************************
 * wavWriter.js
 * openacousticdevices.info
 * August 2022
 *****************************************************************************/

/* global UINT32_LENGTH, RIFF_ID_LENGTH, NUMBER_OF_BYTES_IN_SAMPLE, UINT16_LENGTH, LENGTH_OF_COMMENT, LENGTH_OF_ARTIST, NUMBER_OF_CHANNELS, NUMBER_OF_BITS_IN_SAMPLE, BYTES_PER_CAPTURE, LENGTH_OF_WAV_FORMAT */

/* WAV header component write functions */

function writeString (state, string, length, zeroTerminated) {

    const maximumWriteLength = zeroTerminated ? Math.min(string.length, length - 1) : Math.min(string.length, length);

    const utf8Encoder = new TextEncoder();
    const stringBytes = utf8Encoder.encode(string);

    const view = new DataView(state.buffer);

    for (let i = 0; i < maximumWriteLength; i++) {

        view.setUint8(state.index + i, stringBytes[i]);

    }

    state.index += length;

}

function writeUInt32LE (state, value) {

    const view = new DataView(state.buffer);
    view.setUint32(state.index, value, true);

    state.index += UINT32_LENGTH;

}

function writeUInt16LE (state, value) {

    const view = new DataView(state.buffer);
    view.setUint16(state.index, value, true);

    state.index += UINT16_LENGTH;

}

function writeChunk (state, chunk) {

    writeString(state, chunk.id, RIFF_ID_LENGTH, false);
    writeUInt32LE(state, chunk.size);

}

/* Functions to update header */

function updateDataSize (header, size) {

    header.riff.size = header.size + size - UINT32_LENGTH - RIFF_ID_LENGTH;

    header.data.size = size;

}

function updateSampleRate (header, sampleRate) {

    header.wavFormat.samplesPerSecond = sampleRate;

    header.wavFormat.bytesPerSecond = sampleRate * NUMBER_OF_BYTES_IN_SAMPLE;

}

function updateComment (header, comment) {

    header.icmt.comment = comment;

}

function overwriteComment (header, comment) {

    const length = Math.min(comment.length, header.icmt.size - 1);

    header.icmt.comment = comment.substr(0, length) + header.icmt.comment.substr(length);

}

function updateArtist (header, artist) {

    header.iart.artist = artist;

}

function writeAudioMothHeader (buffer, header) {

    const state = {buffer: buffer, index: 0};

    writeChunk(state, header.riff);

    writeString(state, header.format, RIFF_ID_LENGTH, false);

    writeChunk(state, header.fmt);

    writeUInt16LE(state, header.wavFormat.format);
    writeUInt16LE(state, header.wavFormat.numberOfChannels);
    writeUInt32LE(state, header.wavFormat.samplesPerSecond);
    writeUInt32LE(state, header.wavFormat.bytesPerSecond);
    writeUInt16LE(state, header.wavFormat.bytesPerCapture);
    writeUInt16LE(state, header.wavFormat.bitsPerSample);

    writeChunk(state, header.list);

    writeString(state, header.info, RIFF_ID_LENGTH, false);

    writeChunk(state, header.icmt);
    writeString(state, header.icmt.comment, header.icmt.size, true);

    writeChunk(state, header.iart);
    writeString(state, header.iart.artist, header.iart.size, true);

    writeChunk(state, header.data);

}

function createAudioMothHeader (numberOfSamples, sampleRate, comment, artist) {

    const header = {
        riff: {id: 'RIFF', size: 0},
        format: 'WAVE',
        fmt: {id: 'fmt ', size: LENGTH_OF_WAV_FORMAT},
        wavFormat: {format: PCM_WAV_FORMAT, numberOfChannels: NUMBER_OF_CHANNELS, samplesPerSecond: 0, bytesPerSecond: 0, bytesPerCapture: NUMBER_OF_BYTES_IN_SAMPLE, bitsPerSample: NUMBER_OF_BITS_IN_SAMPLE},
        list: {id: 'LIST', size: 3 * RIFF_ID_LENGTH + 2 * UINT32_LENGTH + LENGTH_OF_ARTIST + LENGTH_OF_COMMENT},
        info: 'INFO',
        icmt: {id: 'ICMT', size: LENGTH_OF_COMMENT, comment: ''},
        iart: {id: 'IART', size: LENGTH_OF_ARTIST, artist: ''},
        data: {id: 'data', size: 0},
        size: LENGTH_OF_WAV_HEADER
    };

    updateDataSize(header, numberOfSamples * NUMBER_OF_BYTES_IN_SAMPLE);

    updateSampleRate(header, sampleRate);

    updateComment(header, comment);

    updateArtist(header, artist);
 
    return header;

}
