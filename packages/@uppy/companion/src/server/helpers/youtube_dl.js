const youtubedl = require('youtube-dl-exec')

// Downloads can take a lonnnnnng time
const TIMEOUT = 30 * 60 * 1000

function streamFile (url, isAudio, output) {
  return youtubedl.exec(url, {
    output,
    format: isAudio ? 'bestaudio[ext=m4a]/m4a' : 'worstvideo[height >= 480][ext=mp4]+[ext=m4a]/mp4',

    // Fixes 403s, as we are downloading from a different env than this
    noCacheDir: true,
    rmCacheDir: true,

    maxFilesize: '10G',
    noPlaylist: true,
    retries: 1,
  }, {
    timeout: TIMEOUT,
  })
}

module.exports = { streamFile }
