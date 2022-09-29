/****************************************************************************
 * constants.js
 * openacousticdevices.info
 * June 2022
 *****************************************************************************/

/* Downsample constants */

const INT16_MIN = -32768;
const INT16_MAX = 32767;

const HERTZ_IN_KILOHERTZ = 1000;

/* Range of sample rates guaranteed to be supported by browsers */

const MIN_SAMPLE_RATE = 8000;
const MAX_SAMPLE_RATE = 96000;

/* Modes which dictate how amplitude thresholded periods are handled */

const PLAYBACK_MODE_ALL = 0; // Play all samples, ignoring the threshold
const PLAYBACK_MODE_SKIP = 1; // Skip over samples below the threshold, jumping to unthresholded periods
const PLAYBACK_MODE_MUTE = 2; // Play silence when at a sample below the threshold

/* WAV file constants */

const UINT16_LENGTH = 2;
const UINT32_LENGTH = 4;
const RIFF_ID_LENGTH = 4;

const LENGTH_OF_ARTIST = 32;
const LENGTH_OF_COMMENT = 384;
const LENGTH_OF_WAV_HEADER = 488;

/* WAV format constants */

const PCM_FORMAT = 1;
const NUMBER_OF_CHANNELS = 1;
const NUMBER_OF_BITS_IN_SAMPLE = 16;
const NUMBER_OF_BYTES_IN_SAMPLE = 2;
const LENGTH_OF_WAV_FORMAT = 16;

/* Maths constants */

const TWO_PI = 2.0 * Math.PI;

/* Number of samples compared to threshold before deciding if buffer is above or below the threshold - 32 KB buffer, 16-bit samples */

const GOERTZEL_THRESHOLD_BUFFER_LENGTH = 16384;
const AMPLITUDE_THRESHOLD_BUFFER_LENGTH = 16384;

/* Valid sample rate */

const VALID_RESAMPLE_RATES = [44100, 312500];

const VALID_AUDIOMOTH_SAMPLE_RATES = [8000, 16000, 32000, 48000, 96000, 192000, 250000, 384000];
