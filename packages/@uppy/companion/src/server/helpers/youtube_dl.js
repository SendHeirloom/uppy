const fs = require('fs')
const tmp = require('tmp')
const youtubedl = require('youtube-dl-progress-improved')
const Stream = require('stream')

// Downloads can take a lonnnnnng time
const TIMEOUT = 30 * 60 * 1000

let SIZE_CACHE = {}

function streamFile(url) {
  return initDownload(url, false)
}

function getMetadata(url) {
  if (SIZE_CACHE[url]) {
    return Promise.resolve({size: SIZE_CACHE[url]})
  }

  return initDownload(url, true)
    .promise
    .then((metadata) => {
      if (Object.keys(SIZE_CACHE).length > 1000) {
        SIZE_CACHE = {}
      }
      SIZE_CACHE[url] = metadata.totalSizeBytes

      return {
        size: metadata.totalSizeBytes,
      }
    })
}

function initDownload(url, justMetadata) {
  const tmpFile = tmp.fileSync()

  const promise = new Promise((resolve, reject) => {
    // TODO This method almost certainly doesn't work in situations where
    // youtube-dl is merging files together. To support that, we probably
    // should do more extensive modification to allow progress to be updated
    // using Youtube DL's output, while the actual stream isn't processed
    // until it's done.
    console.log("YouTubeDL: Starting download", url, justMetadata ? 'for metadata' : '')
    const dl = youtubedl.download(url, {
      format: 'worstvideo[height >= 480][ext=mp4]+[ext=m4a]/mp4',

      // We stream the file as it's written, so it's nice when it only has one name
      noPart: true,

      // Fixes 403s, as we are downloading from a different env than this
      noCacheDir: true,
      rmCacheDir: true,

      maxFilesize: '10G',
      noPlaylist: true,
      retries: 1,

      // https://github.com/yt-dlp/yt-dlp/issues/947#issuecomment-941702119
      output: justMetadata ? '%(filesize,filesize_approx)s' : tmpFile.name,
    }, {
      timeout: justMetadata ? 30 * 1000 : TIMEOUT,
    })

    dl.then((foo) => {
      console.log(foo)
      resolve(fs.createReadStream(tmpFile.name))

      // fs.unlinkSync(tmpFile.name)
    })

    dl.catch((err) => {
      if (!dl.cancelled) {
        reject(err)
      }
    })
  })

  return {
    promise,
  }
}

module.exports = { streamFile, getMetadata }
