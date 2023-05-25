const logger = require('../logger')
const youtubedl = require('../helpers/youtube_dl')
const { validateURL } = require('../helpers/utils')
const { startDownUpload } = require('../helpers/upload')

// size of 0 forces Uploader to download stream first
const getSize = () => 0

/**
 * @param {object} req
 * @param {object} res
 */
async function youtube (req, res) {
  logger.debug('URL file import handler running', null, req.id)

  const { url } = req.body
  const { debug } = req.companion.options

  if (!validateURL(url, debug)) {
    logger.debug('Invalid request body detected. Exiting url import handler.', null, req.id)
    res.status(400).json({ error: 'Invalid URL' })
    return
  }

  const onUnhandledError = err => {
    logger.error(err, 'controller.youtube.error', req.id)
    res.status(400).json({ message: 'Failed to download video' })
  }

  const download = async () => {
    const { promise } = youtubedl.streamFile(url)
    return promise
  }

  startDownUpload({ req, res, getSize, download, onUnhandledError })
}

module.exports = youtube
