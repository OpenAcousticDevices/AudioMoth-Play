/****************************************************************************
 * butterworth.js
 * openacousticdevices.info
 * June 2021
 *****************************************************************************/

/* global Complex */

const LOW_PASS_FILTER = 0;
const BAND_PASS_FILTER = 1;
const HIGH_PASS_FILTER = 2;

const sPoles = [Complex.ZERO, Complex.ZERO];
const sZeroes = [Complex.ZERO, Complex.ZERO];

const zPoles = [Complex.ZERO, Complex.ZERO];
const zZeroes = [Complex.ZERO, Complex.ZERO];

let topCoeffs = [Complex.ZERO, Complex.ZERO, Complex.ZERO];
let botCoeffs = [Complex.ZERO, Complex.ZERO, Complex.ZERO];

function blt (pz) {

    const two = new Complex(2.0, 0.0);
    const a = two.add(pz);
    const b = two.sub(pz);
    return a.div(b);

}

function expand (pz, npz, coeffs) {

    coeffs[0] = Complex.ONE;

    for (let i = 0; i < npz; i++) {

        coeffs[i + 1] = Complex.ZERO;

    }

    for (let i = 0; i < npz; i++) {

        const minusOne = new Complex(-1.0, 0.0);
        const nw = minusOne.mul(pz[i]);

        for (let j = npz; j >= 1; j--) {

            const temp = nw.mul(coeffs[j]);
            coeffs[j] = temp.add(coeffs[j - 1]);

        }

        coeffs[0] = nw.mul(coeffs[0]);

    }

    return coeffs;

}

function bwEval (coeffs, npz, z) {

    let sum = Complex.ZERO;

    for (let i = npz; i >= 0; i--) {

        sum = sum.mul(z).add(coeffs[i]);

    }

    return sum;

}

function evaluate (topCo, nz, botCo, np, z) {

    return bwEval(topCo, nz, z).div(bwEval(botCo, np, z));

}

function designFilter (filterType, sampleRate, freq1, freq2) {

    const filterCoefficients = {
        gain: 0,
        yc: [0, 0, 0]
    };

    // Normalise frequencies
    const alpha1 = freq1 / sampleRate;
    const alpha2 = freq2 / sampleRate;

    const warpedAlpha1 = Math.tan(Math.PI * alpha1) / Math.PI;
    const warpedAlpha2 = Math.tan(Math.PI * alpha2) / Math.PI;

    if (filterType === LOW_PASS_FILTER) {

        // Calculate S poles

        sPoles[0] = new Complex(-1.0, 0.0);

        // Normalise S plane - 1 pole and 0 zero

        const temp = new Complex(2.0 * Math.PI * warpedAlpha1);
        sPoles[0] = sPoles[0].mul(temp);

        // Calculate Z plane - 1 pole and 1 zero

        zPoles[0] = blt(sPoles[0]);
        zZeroes[0] = -1.0;

        // Calculate top and bottom coefficients

        topCoeffs = expand(zZeroes, 1, topCoeffs);
        botCoeffs = expand(zPoles, 1, botCoeffs);

        // Calculate Y coefficients

        filterCoefficients.yc[0] = -1.0 * (botCoeffs[0].re / botCoeffs[1].re);

        // Calculate gain

        const dcGain = evaluate(topCoeffs, 1, botCoeffs, 1, Complex.ONE);

        filterCoefficients.gain = 1.0 / Math.hypot(dcGain.re, dcGain.im);

    } else if (filterType === HIGH_PASS_FILTER) {

        // Calculate S poles

        sPoles[0] = new Complex(-1.0, 0.0);

        // Normalise S plane - 1 pole and 1 zero

        const temp = new Complex(2.0 * Math.PI * warpedAlpha1);
        sPoles[0] = temp.div(sPoles[0]);
        sZeroes[0] = 0.0;

        // Calculate Z plane - 1 pole and 1 zero

        zPoles[0] = blt(sPoles[0]);
        zZeroes[0] = blt(sZeroes[0]);

        // Calculate top and bottom coefficients

        topCoeffs = expand(zZeroes, 1, topCoeffs);
        botCoeffs = expand(zPoles, 1, botCoeffs);

        // Calculate Y coefficients

        filterCoefficients.yc[0] = -1.0 * (botCoeffs[0].re / botCoeffs[1].re);

        // Calculate gain

        const hfGain = evaluate(topCoeffs, 1, botCoeffs, 1, new Complex(-1.0, 0.0));

        filterCoefficients.gain = 1.0 / Math.hypot(hfGain.re, hfGain.im);

    } else if (filterType === BAND_PASS_FILTER) {

        // Calculate S poles

        sPoles[0] = new Complex(-1.0, 0.0);

        // Normalise S plane - 2 poles and 1 zero

        const w1 = new Complex(2.0 * Math.PI * warpedAlpha1);
        const w2 = new Complex(2.0 * Math.PI * warpedAlpha2);

        let w0 = w1.mul(w2);
        w0 = w0.sqrt();

        const bw = w2.sub(w1);

        let temp1 = new Complex(0.5);
        temp1 = temp1.mul(bw);
        const hba = sPoles[0].mul(temp1);

        let temp2 = w0.div(hba);
        temp2 = temp2.mul(temp2);
        let temp3 = Complex.ONE.sub(temp2);
        temp3 = temp3.sqrt();

        const a = Complex.ONE.add(temp3);
        const b = Complex.ONE.sub(temp3);
        sPoles[0] = hba.mul(a);
        sPoles[1] = hba.mul(b);

        sZeroes[0] = Complex.ZERO;

        // Calculate Z plane - 2 poles and 2 zeroes

        zPoles[0] = blt(sPoles[0]);
        zPoles[1] = blt(sPoles[1]);

        zZeroes[0] = blt(sZeroes[0]);
        zZeroes[1] = new Complex(-1.0, 0.0);

        // Calculate top and bottom coefficients

        topCoeffs = expand(zZeroes, 2, topCoeffs);
        botCoeffs = expand(zPoles, 2, botCoeffs);

        // Calculate Y coefficients

        filterCoefficients.yc[0] = -1.0 * (botCoeffs[0].re / botCoeffs[2].re);
        filterCoefficients.yc[1] = -1.0 * (botCoeffs[1].re / botCoeffs[2].re);

        // Calculate gain

        const theta = Math.PI * (alpha1 + alpha2);

        const expTheta = new Complex(Math.cos(theta), Math.sin(theta));

        const fcGain = evaluate(topCoeffs, 2, botCoeffs, 2, expTheta);

        filterCoefficients.gain = 1.0 / Math.hypot(fcGain.re, fcGain.im);

    }

    return filterCoefficients;

}

function applyLowPassFilter (input, output, sampleRate, freq) {

    const length = input.length;

    const filterCoefficients = designFilter(LOW_PASS_FILTER, sampleRate, freq, 0);

    const filter = {
        xv: [0.0, 0.0, 0.0],
        yv: [0.0, 0.0, 0.0]
    };

    for (let i = 0; i < length; i += 1) {

        filter.xv[0] = filter.xv[1];
        filter.xv[1] = input[i] * filterCoefficients.gain;

        filter.yv[0] = filter.yv[1];
        filter.yv[1] = filter.xv[0] + filter.xv[1] + filterCoefficients.yc[0] * filter.yv[0];

        output[i] = filter.yv[1];

    }

}

function applyBandPassFilter (input, output, sampleRate, freq1, freq2) {

    const length = input.length;

    if (freq1 === freq2) {

        for (let i = 0; i < length; i += 1) {

            output[i] = 0;

        }

        return;

    }

    const filterCoefficients = designFilter(BAND_PASS_FILTER, sampleRate, freq1, freq2);

    const filter = {
        xv: [0.0, 0.0, 0.0],
        yv: [0.0, 0.0, 0.0]
    };

    for (let i = 0; i < length; i += 1) {

        filter.xv[0] = filter.xv[1];
        filter.xv[1] = filter.xv[2];
        filter.xv[2] = input[i] * filterCoefficients.gain;

        filter.yv[0] = filter.yv[1];
        filter.yv[1] = filter.yv[2];
        filter.yv[2] = filter.xv[2] - filter.xv[0] + filterCoefficients.yc[0] * filter.yv[0] + filterCoefficients.yc[1] * filter.yv[1];

        output[i] = filter.yv[2];

    }

}

function applyHighPassFilter (input, output, sampleRate, freq) {

    const length = input.length;

    const filterCoefficients = designFilter(HIGH_PASS_FILTER, sampleRate, freq, 0);

    const filter = {
        xv: [0.0, 0.0, 0.0],
        yv: [0.0, 0.0, 0.0]
    };

    for (let i = 0; i < length; i += 1) {

        filter.xv[0] = filter.xv[1];
        filter.xv[1] = input[i] * filterCoefficients.gain;

        filter.yv[0] = filter.yv[1];
        filter.yv[1] = filter.xv[1] - filter.xv[0] + filterCoefficients.yc[0] * filter.yv[0];

        output[i] = filter.yv[1];

    }

}
