const fs = require('fs')
const tmp = require('tmp')
const youtubedl = require('youtube-dl-progress-improved')

// Downloads can take a lonnnnnng time
const TIMEOUT = 30 * 60 * 1000

async function streamFile (url) {
  const tmpFile = tmp.fileSync()

  await youtubedl.download(url, {
    format: 'worstvideo[height >= 480][ext=mp4]+[ext=m4a]/mp4',

    // We stream the file as it's written, so it's nice when it only has one name
    noPart: true,

    // Fixes 403s, as we are downloading from a different env than this
    noCacheDir: true,
    rmCacheDir: true,

    maxFilesize: '10G',
    noPlaylist: true,
    retries: 1,

    output: tmpFile.name,
  }, {
    timeout: TIMEOUT,
  })

  return fs.createReadStream(tmpFile.name)
}

module.exports = { streamFile }
