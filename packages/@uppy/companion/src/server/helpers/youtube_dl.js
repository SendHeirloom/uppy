const youtubedl = require('youtube-dl-exec')

// Downloads can take a lonnnnnng time
const TIMEOUT = 30 * 60 * 1000

async function getFileName (url, isAudio) {
  const info = await youtubedl(url, {
    dumpSingleJson: true, // returns JSON info
    format: getFormat(isAudio),
  })

  return `${info.extractor}-${info.id}.${info.ext}`
}

function streamFile (url, isAudio, output) {
  return youtubedl.exec(url, {
    output,
    format: getFormat(isAudio),

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

function getFormat (isAudio) {
  return isAudio ? 'bestaudio[ext=m4a]/m4a' : 'worstvideo[height >= 480][ext=mp4]+[ext=m4a]/mp4'
}

module.exports = { getFileName, streamFile }
