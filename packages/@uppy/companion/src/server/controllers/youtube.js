const { statSync, createReadStream } = require('fs')
const { join } = require('path')
const logger = require('../logger')
const youtubedl = require('../helpers/youtube_dl')
const { validateURL } = require('../helpers/utils')
const { startDownUpload } = require('../helpers/upload')

const FB_PERM_ERROR_REGEX = /\[facebook\].*registered users/

/**
 * @param {object} req
 * @param {object} res
 */
async function download (req, res) {
  logger.debug('YouTube download route', null, req.id)

  const { url } = req.body
  const { debug } = req.companion.options

  if (!validateURL(url, debug)) {
    res.json({ error: 'Invalid URL' })
    return
  }

  const tmpPath = join(req.companion.options.filePath, `${req.id}.mp4`)

  let size = 0
  try {
    await youtubedl.streamFile(url, tmpPath)

    const stats = statSync(tmpPath)
    size = stats.size
  } catch (err) {
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

/**
 * @param {object} req
 * @param {object} res
 */
async function upload (req, res) {
  logger.debug('YouTube upload route', null, req.id)

  const { token } = req.body
  if (!token) {
    res.json({ error: 'Missing token' })
    return
  }

  const tmpPath = join(req.companion.options.filePath, `${token}.mp4`)

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
