const fs = require('fs')
const tmp = require('tmp')
const GrowingFile = require('growing-file')
const youtubedl = require('youtube-dl-progress-improved')

// Downloads can take a lonnnnnng time
const TIMEOUT = 30 * 60 * 1000

// How many similar size values do we need to get from YTDL before we believe it
// YouTube DL has a tendency to grow the size value as it downloads.
const CONSEC_SIZE_SAMPLES = 30

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
  const stream = GrowingFile.open(tmpFile.name, {
    timeout: TIMEOUT,
    interval: 250,
  })

  const promise = new Promise((resolve, reject) => {
    // TODO This method almost certainly doesn't work in situations where
    // youtube-dl is merging files together. To support that, we probably
    // should do more extensive modification to allow progress to be updated
    // using Youtube DL's output, while the actual stream isn't processed
    // until it's done.
    console.log("YouTubeDL: Starting download", url, justMetadata ? 'for metadata' : '')
    const dl = youtubedl.download(url, {
      format: 'worst[height >= 480]/worstvideo[height >= 480][ext=mp4]+bestaudio[ext=m4a]/best',

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
      timeout: justMetadata ? 30 * 1000 : TIMEOUT,
    })

    Promise.allSettled([dl]).then(() => {
      // We want to stop the streaming, but there's no easy way to
      // know if GrowingFile has reached the end of the file and can
      // be destroyed, so we cheat and use the internal API.
      stream._ended = true

      // Just sort of guess when the last chunk will be done streaming. Even if it's
      // not, as long as GrowingFile has a handle to the file this shouldn't
      // do much:
      setTimeout(() => {
        fs.unlinkSync(tmpFile.name)
      }, 1000)
    })

    // If the client just wants metadata, we wait for the first
    // progress call, and resolve with that information.
    if (justMetadata) {
      let consecSimilarSizes = 0
      let lastSize = 0
      dl.progress((value) => {
        if (dl.cancelled) {
          return
        }

        if (lastSize !== 0 && Math.abs((value.totalSizeBytes - lastSize) / lastSize) < 0.1) {
          consecSimilarSizes++
        } else {
          consecSimilarSizes = 0
          lastSize = value.totalSizeBytes
        }

        if (consecSimilarSizes > CONSEC_SIZE_SAMPLES) {
          // It can take a while for YouTube DL to figure out the actual size
          dl.cancel()

          resolve(value)
        }

        return
      })

      dl.catch((err) => {
        if (!dl.cancelled) {
          reject(err)
        }
      })
    } else {
      resolve(dl)
    }
  })

  return {
    stream,
    promise,
  }
}

module.exports = { streamFile, getMetadata }
