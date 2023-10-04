/****************************************************************************
 * exportVideo.js
 * openacousticdevices.info
 * July 2022
 *****************************************************************************/

/* global Worker, Blob, webkitURL */

const plotX = 70 + 1;
const plot0Y = 45 + 1;
const plot1Y = 325 + 1;

const plotW = 748 - 2;
const plot0H = 238 - 2;
const plot1H = 255 - 2;

const lineCol = 'red';

const MILLISECONDS_IN_SECOND = 1000;

function convertDataURIToBinary (dataURI) {

    const base64 = dataURI.replace(/^data[^,]+,/, '');
    const raw = window.atob(base64);
    const rawLength = raw.length;

    const array = new Uint8Array(new ArrayBuffer(rawLength));

    for (let i = 0; i < rawLength; i++) {

        array[i] = raw.charCodeAt(i);

    }

    return array;

}

function done (output, name) {

    const url = webkitURL.createObjectURL(output);

    // Download the file

    const link = document.createElement('a');
    link.download = name;
    link.href = url;
    link.click();
    link.remove();

}

function finaliseVideo (imageData, audioData, durationInMilliseconds, fileName, lineEnabled, fixedFpsEnabled, skipString, callback) {

    const videoName = fileName + '_EXPORT.mp4';

    const worker = new Worker('./scripts/external/ffmpeg-worker-mp4.js');

    worker.onmessage = (e) => {

        const msg = e.data;

        let blob;

        let succeeded;

        let millisecondsPerFrame, framesPerSecond, roundedDurationInMilliseconds, numberOfFrames;

        let vfString0, vfString1;

        let args;

        switch (msg.type) {

        case 'ready':

            console.log('Ready, processing video');

            millisecondsPerFrame
                        = durationInMilliseconds <= 10 * MILLISECONDS_IN_SECOND ? 40
                        : (durationInMilliseconds <= 30 * MILLISECONDS_IN_SECOND || fixedFpsEnabled) ? 100
                        : 500;

            framesPerSecond = MILLISECONDS_IN_SECOND / millisecondsPerFrame;

            numberOfFrames = Math.floor(durationInMilliseconds / millisecondsPerFrame);

            roundedDurationInMilliseconds = millisecondsPerFrame * numberOfFrames;

            args = [
                '-loop', '1',
                '-y',
                '-r', framesPerSecond.toString(),
                '-i', 'IMG.JPG',
                '-i', 'AUDIO.WAV',
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-tune', 'stillimage',
                '-rc-lookahead', '2',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-pix_fmt', 'yuv420p',
                '-t', roundedDurationInMilliseconds.toString() + 'ms'
            ];

            if (lineEnabled) {

                vfString0 = 'audiomothanimation=';
                vfString0 += 'x=' + plotX;
                vfString0 += ':y=' + plot0Y;
                vfString0 += ':w=' + plotW;
                vfString0 += ':h=' + plot0H;
                vfString0 += ':color=' + lineCol;
                vfString0 += ':framecount=' + numberOfFrames;
                vfString0 += ':skip=' + skipString;

                vfString1 = 'audiomothanimation=';
                vfString1 += 'x=' + plotX;
                vfString1 += ':y=' + plot1Y;
                vfString1 += ':w=' + plotW;
                vfString1 += ':h=' + plot1H;
                vfString1 += ':color=' + lineCol;
                vfString1 += ':framecount=' + numberOfFrames;
                vfString1 += ':skip=' + skipString;

                args.push('-vf', vfString0 + ',' + vfString1);

            }

            args.push('out.mp4');

            worker.postMessage({
                type: 'run',
                TOTAL_MEMORY: 256 * 1024 * 1024,
                MEMFS: [audioData, imageData],
                arguments: args
            });

            break;

        case 'stdout':
        case 'stderr':

            console.log(msg.data);

            break;

        case 'exit':

            console.log('Exiting');

            succeeded = msg.data === 0;
            callback(succeeded);

            break;

        case 'done':

            if (msg.data.MEMFS[0].data.length === 0) {

                break;

            }

            // Export mp4

            console.log('Saving video');

            blob = new Blob([msg.data.MEMFS[0].data], {type: 'video/mp4'});
            done(blob, videoName);

            break;

        }

    };

}

function exportVideo (imageCanvas, audioArray, length, fileName, lineEnabled, fixedFpsEnabled, skipString, callback) {

    const mimeType = 'image/jpeg';
    const imageString = imageCanvas.toDataURL(mimeType, 1);
    const imageArray = convertDataURIToBinary(imageString);

    const imageData = {
        name: 'IMG.JPG',
        data: imageArray
    };

    const audioData = {
        name: 'AUDIO.WAV',
        data: audioArray
    };

    finaliseVideo(imageData, audioData, length, fileName, lineEnabled, fixedFpsEnabled, skipString, callback);

}
