const youtubedl = require('youtube-dl-progress-improved')

// Downloads can take a lonnnnnng time
const TIMEOUT = 30 * 60 * 1000

function streamFile (url, output) {
  return youtubedl.download(url, {
    output,
    format: 'worstvideo[height >= 480][ext=mp4]+[ext=m4a]/mp4',

    // We stream the file as it's written, so it's nice when it only has one name
    noPart: true,

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
