import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Tus from '@uppy/tus'
import canvasToBlob from '@uppy/utils/lib/canvasToBlob'

const endpoint = 'http://localhost:1081'

let id = 0
window.setup = function setup (options) {
  id += 1

  // Initialise Uppy with Drag & Drop
  const uppy = new Uppy({ id: `uppy${id}`, debug: true })

  uppy.use(Dashboard, { inline: true, target: '#dash' })
  uppy.use(Tus, {
    endpoint: `${endpoint}/files/`,
    limit: options.limit,
  })
  uppy.on('file-added', (file) => {
    randomColorImage().then((blob) => {
      uppy.setFileState(file.id, {
        // eslint-disable-next-line compat/compat
        preview: URL.createObjectURL(blob),
      })
    })
  })

  return uppy
}

function randomColorImage () {
  const canvas = document.createElement('canvas')
  canvas.width = 140
  canvas.height = 140
  const context = canvas.getContext('2d')
  context.fillStyle = '#xxxxxx'.replace(/x/g, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)])
  context.fillRect(0, 0, 140, 140)
  return canvasToBlob(canvas)
}
