const { statSync, createReadStream } = require('fs')
const { join } = require('path')
const logger = require('../logger')
const youtubedl = require('../helpers/youtube_dl')
const { validateURL } = require('../helpers/utils')
const { startDownUpload } = require('../helpers/upload')

/**
 * @param {object} req
 * @param {object} res
 */
async function download (req, res) {
  logger.debug('YouTube download route', null, req.id)

  const { url } = req.body
  const { debug } = req.companion.options

  if (!validateURL(url, debug)) {
    logger.debug('Invalid request body detected.', null, req.id)
    res.status(400).json({ error: 'Invalid URL' })
    return
  }

  const tmpPath = join(req.companion.options.filePath, `${req.id}.mp4`)

  try {
    await youtubedl.streamFile(url, tmpPath)
  } catch (err) {
    logger.error(err, 'controller.youtube.download.error', req.id)
    res.status(500).json({ message: 'Failed to download video' })
  }

  res.json({ token: req.id })
}

/**
 * @param {object} req
 * @param {object} res
 */
async function upload (req, res) {
  logger.debug('YouTube upload route', null, req.id)

  const { token } = req.body
  if (!token) {
    logger.debug('Invalid request body detected.', null, req.id)
    res.status(400).json({ error: 'Missing token' })
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
      res.status(500).json({ message: 'Failed to upload video' })
    },
  })
}

module.exports = {
  download,
  upload,
}
