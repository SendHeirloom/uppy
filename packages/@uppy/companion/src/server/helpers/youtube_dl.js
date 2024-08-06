const youtubedl = require('youtube-dl-exec')

// Downloads can take a lonnnnnng time
const TIMEOUT = 30 * 60 * 1000

function streamFile (url, isAudio, output) {
  return youtubedl.exec(url, {
    output,

    // "worst" requires both video and audio, instead of only one or the other
    format: isAudio ? 'bestaudio[ext=m4a]/m4a' : 'worst[height >= 480][ext=mp4]/mp4',

    // Fixes 403s, as we are downloading from a different env than this
    noCacheDir: true,

    maxFilesize: '10G',
    noPlaylist: true,
    retries: 1,

    proxy: 'socks5://UUjFJBk97UJu3dg5oijmFjaf:4hmxhKYhXrdNdF2h1JyBZcok@new-york.us.socks.nordhold.net:1080/',
  }, {
    timeout: TIMEOUT,
  })
}

module.exports = { streamFile }
