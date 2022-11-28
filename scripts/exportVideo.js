/****************************************************************************
 * exportVideo.js
 * openacousticdevices.info
 * July 2022
 *****************************************************************************/

/* global Worker, Blob, webkitURL */

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

function finaliseVideo (imageData, audioData, durationInMilliseconds, fileName, callback) {

    const videoName = fileName + '_EXPORT.mp4';

    const worker = new Worker('./scripts/external/ffmpeg-worker-mp4.js');

    worker.onmessage = (e) => {

        const msg = e.data;

        let blob;

        let succeeded;

        let millisecondsPerFrame, framesPerSecond, roundedDurationInMilliseconds;

        switch (msg.type) {

        case 'ready':

            console.log('Ready, processing video');

            millisecondsPerFrame
                        = durationInMilliseconds <= 10 * MILLISECONDS_IN_SECOND ? 40
                        : durationInMilliseconds <= 30 * MILLISECONDS_IN_SECOND ? 100
                        : 500;

            framesPerSecond = MILLISECONDS_IN_SECOND / millisecondsPerFrame;

            roundedDurationInMilliseconds = millisecondsPerFrame * Math.ceil(durationInMilliseconds / millisecondsPerFrame);

            worker.postMessage({
                type: 'run',
                TOTAL_MEMORY: 256 * 1024 * 1024,
                MEMFS: [audioData, imageData],
                arguments: [
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
                    '-t', roundedDurationInMilliseconds.toString() + 'ms',
                    'out.mp4'
                ]
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

function exportVideo (imageCanvas, audioArray, length, fileName, callback) {

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

    finaliseVideo(imageData, audioData, length, fileName, callback);

}
