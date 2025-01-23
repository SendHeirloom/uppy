const youtubedl = require('youtube-dl-exec')

// Downloads can take a lonnnnnng time
const TIMEOUT = 30 * 60 * 1000

function streamFile (url, isAudio, output) {
  return youtubedl.exec(url, {
    output,

    // "worst" requires both video and audio, instead of only one or the other
    format: isAudio ? 'bestaudio[ext=m4a]/m4a' : 'worst[height >= 480][ext=mp4]/mp4',

    // Fixes 403s, as we are downloading from a different env than this
    noCacheDir: true,

    maxFilesize: '10G',
    noPlaylist: true,
    retries: 1,

    extractorArgs: 'youtube:player-client=web;po_token=web+Mlt552_g95E1g3nfFzxcmN6s7-O6iK-v-8xobqGg7dzT14r-HolUYh8leS30ZJlEpCCGwY2easZbYkR7Da3AukQAyBG6V3C5q7vq7fpLNHoayHkh8nv0qrRXS5Ww',
    cookies: '~/uppy/cookies.txt',
    proxy: 'http://sendheirloom_Gc208:NzAXHfgt_JAfh5c@dc.oxylabs.io:8000/',
  }, {
    timeout: TIMEOUT,
  })
}

module.exports = { streamFile }
