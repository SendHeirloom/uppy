const logger = require('../logger')
const youtubedl = require('../helpers/youtube_dl')
const { validateURL } = require('../helpers/utils')
const { startDownUpload } = require('../helpers/upload')

/**
 * @param {object} req
 * @param {object} res
 */
async function youtube (req, res) {
  logger.debug('YouTube route', null, req.id)

  const { url } = req.body
  const { debug } = req.companion.options

  if (!validateURL(url, debug)) {
    logger.debug('Invalid request body detected.', null, req.id)
    res.status(400).json({ error: 'Invalid URL' })
    return
  }

  startDownUpload({
    req,
    res,
    getSize: () => 0, // forces Uploader to download stream first
    download: () => youtubedl.streamFile(url),
    onUnhandledError: err => {
      logger.error(err, 'controller.youtube.error', req.id)
      res.status(500).json({ message: 'Failed to download video' })
    },
  })
}

module.exports = youtube
