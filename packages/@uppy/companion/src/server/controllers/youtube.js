const logger = require('../logger')
const youtubedl = require('../helpers/youtube_dl')
const { validateURL } = require('../helpers/utils')

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
    res.status(400).json({ error: 'Invalid request body' })
    return
  }

  const { promise } = youtubedl.streamFile(url)

  promise.then(content => {
    logger.debug('YouTubeDL: Download complete', null, req.id)

    // TODO: hook into startDownUpload?
    res.send(content)
  }, err => {
    logger.error(err, 'YouTubeDL: Download failed.', null, req.id)
    res.status(500).json({ error: 'Invalid request body' })
  })
}

module.exports = youtube
