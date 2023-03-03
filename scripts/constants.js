/****************************************************************************
 * constants.js
 * openacousticdevices.info
 * June 2022
 *****************************************************************************/

/* Regex used to extract timestamp from header comment */

const DATE_REGEX = /^Recorded at (\d\d):(\d\d):(\d\d) (\d\d)\/(\d\d)\/(\d\d\d\d) \(UTC(((\+|\-)\d{1,2}(:\d{1,2})?)?)?\)/;

/* Number of seconds in 24 hours */

const SECONDS_IN_DAY = 24 * 60 * 60;

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

const MAXIMUM_LENGTH_OF_WAV_HEADER = 32 * 1024;

/* WAV format constants */

const PCM_WAV_FORMAT = 1;
const EXTENSIBLE_WAV_FORMAT = 65534;

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

const VALID_RESAMPLE_RATES = [44100, 125000, 312500];

const VALID_AUDIOMOTH_SAMPLE_RATES = [8000, 16000, 32000, 48000, 96000, 192000, 250000, 384000];

const DISPLAYED_TIME_AMOUNTS = [
    {
        amount: 3600,
        labelIncrement: 900,
        precision: 0
    },
    {
        amount: 1800,
        labelIncrement: 600,
        precision: 0
    },
    {
        amount: 900,
        labelIncrement: 300,
        precision: 0
    },
    {
        amount: 600,
        labelIncrement: 120,
        precision: 0
    },
    {
        amount: 300,
        labelIncrement: 60,
        precision: 0
    },
    {
        amount: 60,
        labelIncrement: 15,
        precision: 0
    },
    {
        amount: 30,
        labelIncrement: 5,
        precision: 0
    },
    {
        amount: 20,
        labelIncrement: 4,
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
    }
];

const STATIC_COLOUR_MIN = 2.0;
const STATIC_COLOUR_MAX = 15.0;
