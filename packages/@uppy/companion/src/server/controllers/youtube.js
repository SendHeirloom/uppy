const { statSync, createReadStream, promises: { unlink } } = require('fs')
const { join } = require('path')
const logger = require('../logger')
const youtubedl = require('../helpers/youtube_dl')
const { validateURL } = require('../helpers/utils')
const { startDownUpload } = require('../helpers/upload')

const UNSUPPORTED_URL_ERROR_REGEX = /\[generic\].*Unsupported URL/s
const FB_PERM_ERROR_REGEX = /\[facebook\].*registered users/
const YOUTUBE_UNAVAILABLE_REGEX = /\[youtube\].*Video unavailable/
const YOUTUBE_BOT_REGEX = /(403: Forbidden.*\[youtube\])|(\[youtube\].*Sign in)/s
const MAX_YOUTUBE_RETRIES = 3

const download = (isAudio, retryCount = 0) => async (req, res) => {
  logger.debug('YouTube download route', null, req.id)

  const { url } = req.body
  const { debug } = req.companion.options

  if (!validateURL(url, debug)) {
    res.json({ error: 'Invalid URL' })
    return
  }

  let size = 0
  try {
    const output = join(req.companion.options.filePath, req.id)
    await youtubedl.streamFile(url, isAudio, output)

    const stats = statSync(output)
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

    if (err.message.match(YOUTUBE_UNAVAILABLE_REGEX)) {
      res.json({ error: 'Video was not found or is no longer available' })
      return
    }

    if (err.message.match(YOUTUBE_BOT_REGEX) && retryCount < MAX_YOUTUBE_RETRIES) {
      logger.warn('retrying YT download', 'controller.youtube.download.error', req.id)
      return download(isAudio, retryCount + 1)(req, res)
    }

    logger.error(err, 'controller.youtube.download.error', req.id)
    res.status(500).send('Failed to download video')
    return
  }

  res.json({ token: req.id, size })
}

const upload = (req, res) => {
  logger.debug('YouTube upload route', null, req.id)

  const { token } = req.body
  if (!token) {
    res.json({ error: 'Missing token' })
    return
  }

  // isAudio not needed because "token" is a filename that includes extension
  const tmpPath = join(req.companion.options.filePath, token)

  startDownUpload({
    req,
    res,
    getSize: () => {
      const { size } = statSync(tmpPath)
      return size
    },
    download: () => createReadStream(tmpPath),
    cleanup: () => unlink(tmpPath).catch(() => {}),
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
