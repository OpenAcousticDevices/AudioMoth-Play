/****************************************************************************
 * worker.js
 * openacousticdevices.info
 * July 2024
 *****************************************************************************/

/* global self, caches, fetch */

const VERSION = '11';
const cacheName = 'audiomothplay-v' + VERSION;

self.addEventListener('install', (e) => {

    console.log('Caching assets for offline use');

    e.waitUntil((async () => {

        const cache = await caches.open(cacheName);

        try {

            await cache.addAll(['./index.html',
                './scripts/index.js',
                './scripts/amplitudeThreshold.js',
                './scripts/butterworth.js',
                './scripts/constants.js',
                './scripts/downsampler.js',
                './scripts/drawSVG.js',
                './scripts/exportAudio.js',
                './scripts/exportImages.js',
                './scripts/exportVideo.js',
                './scripts/goertzelFilter.js',
                './scripts/labelBuilding.js',
                './scripts/lowFrequency.js',
                './scripts/playAudio.js',
                './scripts/resampler.js',
                './scripts/sampleRateControl.js',
                './scripts/sliderControl.js',
                './scripts/spectrogram.js',
                './scripts/stft.js',
                './scripts/uiFiltering.js',
                './scripts/waveform.js',
                './scripts/wavPreviewer.js',
                './scripts/wavReader.js',
                './scripts/wavWriter.js',
                './scripts/external/bootstrap-slider.min.js',
                './scripts/external/bootstrap.bundle.min.js',
                './scripts/external/bootstrap.bundle.min.js.map',
                './scripts/external/complex.min.js',
                './scripts/external/ffmpeg-worker-mp4.js',
                './scripts/external/FreeSans-normal.js',
                './scripts/external/jquery-3.6.0.slim.min.js',
                './scripts/external/jspdf.umd.min.js',
                './scripts/external/jspdf.umd.min.js.map',
                './css/index.css',
                './css/loadingAnimation.css',
                './css/external/bootstrap-slider.css',
                './css/external/bootstrap.min.css',
                './css/external/bootstrap.min.css.map',
                './assets/BAT.WAV',
                './assets/camera-video.svg',
                './assets/camera.svg',
                './assets/chevron-double-left.svg',
                './assets/chevron-double-right.svg',
                './assets/chevron-left.svg',
                './assets/chevron-right.svg',
                './assets/download.svg',
                './assets/favicon.png',
                './assets/gear.svg',
                './assets/GitHub-Mark-32px.png',
                './assets/house.svg',
                './assets/icon.png',
                './assets/METRONOME.WAV',
                './assets/play.svg',
                './assets/stop.svg',
                './assets/SWEEP.WAV',
                './assets/zoom-in.svg',
                './assets/zoom-out.svg'
            ]);

        } catch (error) {

            console.error(error);

        }

    })());

});

self.addEventListener('fetch', (e) => {

    e.respondWith((async () => {

        const r = await caches.match(e.request);

        if (r) {

            return r;

        }

        const response = await fetch(e.request);
        const cache = await caches.open(cacheName);

        cache.put(e.request, response.clone());

        return response;

    })());

});

self.addEventListener('activate', (e) => {

    e.waitUntil(caches.keys().then((keyList) => {

        return Promise.all(keyList.map((key) => {

            if (key === cacheName) {

                return 0;

            }

            return caches.delete(key);

        }));

    }));

});
