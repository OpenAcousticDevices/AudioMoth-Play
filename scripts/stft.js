/****************************************************************************
 * stft.js
 * openacousticdevices.info
 * August 2021
 *****************************************************************************/

'use strict';

function STFT (pixelWidth, pixelHeight) {

    // Check the input values

    this._pixelWidth = pixelWidth | 0;

    this._pixelHeight = pixelHeight | 0;

    if (this._pixelHeight < 1 || ((this._pixelHeight + 1) & this._pixelHeight) !== 0) {

        throw new Error('Pixel height must be one less than a power of two and greater than zero.');

    }

    if (this._pixelWidth < 1) {

        throw new Error('Pixel width must be greater than zero.');

    }

    // Determine real and complex FFT size

    this._size = (this._pixelHeight + 1) << 1;

    this._csize = this._size << 1;

    // Generate internal ouput arrays

    this._out = new Array(this._csize);

    // Generate trig table

    const table = new Array(this._size * 2);

    for (let i = 0; i < table.length; i += 2) {

        const angle = Math.PI * i / this._size;

        table[i] = Math.cos(angle);

        table[i + 1] = -Math.sin(angle);

    }

    this._table = table;

    // Generate Hann window coefficients

    const coefficients = new Array(this._size);

    for (let i = 0; i < coefficients.length; i += 1) {

        coefficients[i] = Math.sin(Math.PI * i / (coefficients.length - 1));

    }

    this._coefficients = coefficients;

    // Find size in power of twos

    let power = 0;

    for (let t = 1; this._size > t; t <<= 1) {

        power++;

    }

    this._width = power % 2 === 0 ? power - 1 : power;

    // Generate bit-reversal patterns

    this._bitrev = new Array(1 << this._width);

    for (let j = 0; j < this._bitrev.length; j++) {

        this._bitrev[j] = 0;

        for (let shift = 0; shift < this._width; shift += 2) {

            const revShift = this._width - shift - 2;

            this._bitrev[j] |= ((j >>> shift) & 3) << revShift;

        }

    }

}

STFT.prototype.calculate = function calculateSync (data, offset, length, out) {

    this._data = data;

    const samplesPerPixel = length / this._pixelWidth;

    const FFTCount = Math.ceil(samplesPerPixel / this._size);

    for (let i = 0; i < this._pixelWidth; i += 1) {

        for (let j = 0; j < FFTCount; j += 1) {

            const start = Math.round(offset + (i + 0.5) * samplesPerPixel + (j - FFTCount / 2) * this._size);

            const constrainedStart = Math.max(0, Math.min(data.length - this._size, start));

            this._start = constrainedStart;

            this._realTransform4();

            for (let k = 0; k < this._pixelHeight; k += 1) {

                const index = 2 * (k + 1);

                const real = this._out[index];
                const imag = this._out[index + 1];

                const magnitude = 2 / this._size * Math.sqrt(real * real + imag * imag);

                const sonogramIndex = (this._pixelHeight - 1 - k) * this._pixelWidth + i;

                const existingValue = j === 0 ? 0 : out[sonogramIndex];

                out[sonogramIndex] = Math.max(magnitude, existingValue);

            }

        }

    }

    this._data = null;

};

STFT.prototype._realTransform4 = function _realTransform4 () {

    const out = this._out;
    const size = this._csize;
    const width = this._width;
    const table = this._table;

    let step = 1 << width;
    let len = (size / step) << 1;
    const bitrev = this._bitrev;

    if (len === 4) {

        for (let outOff = 0, t = 0; outOff < size; outOff += len, t++) {

            this._singleRealTransform2(outOff, bitrev[t] >>> 1, step >>> 1);

        }

    } else {

        for (let outOff = 0, t = 0; outOff < size; outOff += len, t++) {

            this._singleRealTransform4(outOff, bitrev[t] >>> 1, step >>> 1);

        }

    }

    for (step >>= 2; step >= 2; step >>= 2) {

        len = (size / step) << 1;

        const halfLen = len >>> 1;
        const quarterLen = halfLen >>> 1;
        const hquarterLen = quarterLen >>> 1;

        for (let outOff = 0; outOff < size; outOff += len) {

            for (let i = 0, k = 0; i <= hquarterLen; i += 2, k += step) {

                const A = outOff + i;
                const B = A + quarterLen;
                const C = B + quarterLen;
                const D = C + quarterLen;

                const Ar = out[A];
                const Ai = out[A + 1];
                const Br = out[B];
                const Bi = out[B + 1];
                const Cr = out[C];
                const Ci = out[C + 1];
                const Dr = out[D];
                const Di = out[D + 1];

                const MAr = Ar;
                const MAi = Ai;

                const tableBr = table[k];
                const tableBi = table[k + 1];
                const MBr = Br * tableBr - Bi * tableBi;
                const MBi = Br * tableBi + Bi * tableBr;

                const tableCr = table[2 * k];
                const tableCi = table[2 * k + 1];
                const MCr = Cr * tableCr - Ci * tableCi;
                const MCi = Cr * tableCi + Ci * tableCr;

                const tableDr = table[3 * k];
                const tableDi = table[3 * k + 1];
                const MDr = Dr * tableDr - Di * tableDi;
                const MDi = Dr * tableDi + Di * tableDr;

                const T0r = MAr + MCr;
                const T0i = MAi + MCi;
                const T1r = MAr - MCr;
                const T1i = MAi - MCi;
                const T2r = MBr + MDr;
                const T2i = MBi + MDi;
                const T3r = MBr - MDr;
                const T3i = MBi - MDi;

                const FAr = T0r + T2r;
                const FAi = T0i + T2i;

                const FBr = T1r + T3i;
                const FBi = T1i - T3r;

                out[A] = FAr;
                out[A + 1] = FAi;
                out[B] = FBr;
                out[B + 1] = FBi;

                if (i === 0) {

                    const FCr = T0r - T2r;
                    const FCi = T0i - T2i;
                    out[C] = FCr;
                    out[C + 1] = FCi;

                    continue;

                }

                if (i === hquarterLen) continue;

                const ST0r = T1r;
                const ST0i = -T1i;
                const ST1r = T0r;
                const ST1i = -T0i;
                const ST2r = -T3i;
                const ST2i = -T3r;
                const ST3r = -T2i;
                const ST3i = -T2r;

                const SFAr = ST0r + ST2r;
                const SFAi = ST0i + ST2i;

                const SFBr = ST1r + ST3i;
                const SFBi = ST1i - ST3r;

                const SA = outOff + quarterLen - i;
                const SB = outOff + halfLen - i;

                out[SA] = SFAr;
                out[SA + 1] = SFAi;
                out[SB] = SFBr;
                out[SB + 1] = SFBi;

            }

        }

    }

};

// Radix-2 implementation for len == 4

STFT.prototype._singleRealTransform2 = function _singleRealTransform2 (outOff, off, step) {

    const out = this._out;
    const data = this._data;

    const evenR = data[this._start + off] * this._coefficients[off];
    const oddR = data[this._start + off + step] * this._coefficients[off + step];

    const leftR = evenR + oddR;
    const rightR = evenR - oddR;

    out[outOff] = leftR;
    out[outOff + 1] = 0;
    out[outOff + 2] = rightR;
    out[outOff + 3] = 0;

};

// Radix-4 implementation for len == 8

STFT.prototype._singleRealTransform4 = function _singleRealTransform4 (outOff, off, step) {

    const out = this._out;
    const data = this._data;

    const Ar = data[this._start + off] * this._coefficients[off];
    const Br = data[this._start + off + step] * this._coefficients[off + step];
    const Cr = data[this._start + off + 2 * step] * this._coefficients[off + 2 * step];
    const Dr = data[this._start + off + 3 * step] * this._coefficients[off + 3 * step];

    const T0r = Ar + Cr;
    const T1r = Ar - Cr;
    const T2r = Br + Dr;
    const T3r = Br - Dr;

    const FAr = T0r + T2r;
    const FBr = T1r;
    const FBi = -T3r;
    const FCr = T0r - T2r;
    const FDr = T1r;
    const FDi = T3r;

    out[outOff] = FAr;
    out[outOff + 1] = 0;
    out[outOff + 2] = FBr;
    out[outOff + 3] = FBi;
    out[outOff + 4] = FCr;
    out[outOff + 5] = 0;
    out[outOff + 6] = FDr;
    out[outOff + 7] = FDi;

};
