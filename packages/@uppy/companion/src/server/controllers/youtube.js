const { statSync, createReadStream } = require('fs')
const { join } = require('path')
const logger = require('../logger')
const youtubedl = require('../helpers/youtube_dl')
const { validateURL } = require('../helpers/utils')
const { startDownUpload } = require('../helpers/upload')

const UNSUPPORTED_URL_ERROR_REGEX = /\[generic\].*Unsupported URL/s
const FB_PERM_ERROR_REGEX = /\[facebook\].*registered users/

const download = (isAudio) => async (req, res) => {
  logger.debug('YouTube download route', null, req.id)

  const { url } = req.body
  const { debug } = req.companion.options

  if (!validateURL(url, debug)) {
    res.json({ error: 'Invalid URL' })
    return
  }

  const ext = isAudio ? 'm4a' : 'mp4'
  const tmpPath = join(req.companion.options.filePath, `${req.id}.${ext}`)

  let size = 0
  try {
    await youtubedl.streamFile(url, isAudio, tmpPath)

    const stats = statSync(tmpPath)
    size = stats.size
  } catch (err) {
    if (err.message.match(UNSUPPORTED_URL_ERROR_REGEX)) {
      res.json({ error: 'No video found on URL' })
      return
    }

    if (err.message.match(FB_PERM_ERROR_REGEX)) {
      res.json({ error: 'Video is private and cannot be accessed' })
      return
    }

    logger.error(err, 'controller.youtube.download.error', req.id)
    res.status(500).send('Failed to download video')
    return
  }

  res.json({ token: req.id, size })
}

const upload = (isAudio) => (req, res) => {
  logger.debug('YouTube upload route', null, req.id)

  const { token } = req.body
  if (!token) {
    res.json({ error: 'Missing token' })
    return
  }

  const ext = isAudio ? 'm4a' : 'mp4'
  const tmpPath = join(req.companion.options.filePath, `${token}.${ext}`)

  startDownUpload({
    req,
    res,
    getSize: () => {
      const { size } = statSync(tmpPath)
      return size
    },
    download: () => createReadStream(tmpPath),
    onUnhandledError: err => {
      logger.error(err, 'controller.youtube.upload.error', req.id)
      res.send('Failed to upload video')
    },
  })
}

module.exports = {
  download,
  upload,
}
