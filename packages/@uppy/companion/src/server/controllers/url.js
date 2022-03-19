const router = require('express').Router
const request = require('request')
const { URL } = require('url')
const validator = require('validator')

const { startDownUpload } = require('../helpers/upload')
const youtubedl = require('../helpers/youtube_dl')
const { getURLMeta, getRedirectEvaluator, getProtectedHttpAgent } = require('../helpers/request')
const logger = require('../logger')

/**
 * Validates that the download URL is secure
 *
 * @param {string} url the url to validate
 * @param {boolean} debug whether the server is running in debug mode
 */
const validateURL = (url, debug) => {
  if (!url) {
    return false
  }

  const validURLOpts = {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: !debug,
  }
  if (!validator.isURL(url, validURLOpts)) {
    return false
  }

  return true
}

/**
 * @callback downloadCallback
 * @param {Error} err
 * @param {string | Buffer | Buffer[]} chunk
 */

/**
 * Downloads the content in the specified url, and passes the data
 * to the callback chunk by chunk.
 *
 * @param {string} url
 * @param {boolean} blockLocalIPs
 * @param {string} traceId
 * @returns {Promise}
 */
const downloadURL = async (url, blockLocalIPs, traceId) => {
  const opts = {
    uri: url,
    method: 'GET',
    followRedirect: getRedirectEvaluator(url, blockLocalIPs),
    agentClass: getProtectedHttpAgent((new URL(url)).protocol, blockLocalIPs),
  }

  return new Promise((resolve, reject) => {
    const req = request(opts)
      .on('response', (resp) => {
        if (resp.statusCode >= 300) {
          req.abort() // No need to keep request
          reject(new Error(`URL server responded with status: ${resp.statusCode}`))
          return
        }

        // Don't allow any more data to flow yet.
        // https://github.com/request/request/issues/1990#issuecomment-184712275
        resp.pause()
        resolve(resp)
      })
      .on('error', (err) => {
        logger.error(err, 'controller.url.download.error', traceId)
        reject(err)
      })
  })
}

const downloadWithYoutubeDL = async (url) => {
  return new Promise((resolve, reject) => {
    const { stream, promise } = youtubedl.streamFile(url)

    promise.then(() => {
      console.log("YouTubeDL: Download complete")
    }, (e) => {
      console.log("YouTubeDL: Download failed", e)
    })

    resolve(stream)
  })
}

/**
 * Fteches the size and content type of a URL
 *
 * @param {object} req expressJS request object
 * @param {object} res expressJS response object
 */
const meta = async (req, res) => {
  try {
    logger.debug('URL file import handler running', null, req.id)
    const { debug } = req.companion.options
    if (!validateURL(req.body.url, debug)) {
      logger.debug('Invalid request body detected. Exiting url meta handler.', null, req.id)
      return res.status(400).json({ error: 'Invalid request body' })
    }

    const { size } = await youtubedl.getMetadata(req.body.url)
    // TODO: Figure out how to get the content type from YoutubeDL
    return res.json({type: "video/mp4", size})
  } catch (err) {
    logger.error(err, 'controller.url.meta.error', req.id)
    // @todo send more meaningful error message and status code to client if possible
    return res.status(err.status || 500).json({ message: 'failed to fetch URL metadata' })
  }
}

/**
 * Handles the reques of import a file from a remote URL, and then
 * subsequently uploading it to the specified destination.
 *
 * @param {object} req expressJS request object
 * @param {object} res expressJS response object
 */
const get = async (req, res) => {
  logger.debug('URL file import handler running', null, req.id)
  const { debug } = req.companion.options
  if (!validateURL(req.body.url, debug)) {
    logger.debug('Invalid request body detected. Exiting url import handler.', null, req.id)
    res.status(400).json({ error: 'Invalid request body' })
    return
  }

  async function getSize () {
    const { size } = await youtubedl.getMetadata(req.body.url)
    return size
  }

  async function download () {
    return downloadWithYoutubeDL(req.body.url)//, !debug, req.id)
  }

  function onUnhandledError (err) {
    console.log(err.stack)
    logger.error(err, 'controller.url.error', req.id)
    // @todo send more meaningful error message and status code to client if possible
    res.status(err.status || 500).json({ message: 'failed to fetch URL metadata' })
  }

  startDownUpload({ req, res, getSize, download, onUnhandledError })
}

module.exports = () => router()
  .post('/meta', meta)
  .post('/get', get)
