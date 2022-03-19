const fs = require('fs')
const tmp = require('tmp')
const GrowingFile = require('growing-file')
const youtubedl = require('youtube-dl-progress-improved')

const TIMEOUT = 60 * 1000

function streamFile(url) {
  return initDownload(url, false)
}

function getMetadata(url) {
  return initDownload(url, true)
    .promise
    .then((metadata) => {
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
      format: 'best[height <=? 480]',

      // We stream the file as it's written, so it's nice when it only has one name
      noPart: true,

      maxFilesize: '10G',
      noPlaylist: true,
      retries: 1,

      output: tmpFile.name,
    }, {
      timeout: justMetadata ? 10 * 1000 : TIMEOUT,
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
      dl.progress((value) => {
        dl.cancel()

        resolve(value)

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
