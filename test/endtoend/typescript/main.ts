import {
  Core,
  Dashboard,
  Instagram,
  Dropbox,
  GoogleDrive,
  Box,
  Url,
  Webcam,
  Tus,
  Form,
} from 'uppy'

const TUS_ENDPOINT = 'http://localhost:1080/files/'

const uppy = new Core({
  debug: true,
  meta: {
    username: 'John',
    license: 'Creative Commons',
  },
})
  .use(Dashboard, {
    target: document.body,
    trigger: '#pick-files',
    metaFields: [
      { id: 'license', name: 'License', placeholder: 'specify license' },
      { id: 'caption', name: 'Caption', placeholder: 'add caption' },
    ],
    showProgressDetails: true,
    proudlyDisplayPoweredByUppy: true,
    note: '2 files, images and video only',
  })
  .use(GoogleDrive, { target: Dashboard, companionUrl: 'http://localhost:3020' })
  .use(Instagram, { target: Dashboard, companionUrl: 'http://localhost:3020' })
  .use(Dropbox, { target: Dashboard, companionUrl: 'http://localhost:3020' })
  .use(Box, { target: Dashboard, companionUrl: 'http://localhost:3020' })
  .use(Url, { target: Dashboard, companionUrl: 'http://localhost:3020' })
  .use(Webcam, { target: Dashboard })
  .use(Tus, { endpoint: TUS_ENDPOINT })
  .use(Form, { target: '#upload-form' })
  // .use(GoldenRetriever, {serviceWorker: true})

uppy.on('complete', (result) => {
  if (result.failed.length === 0) {
    console.log('Upload successful 😀')
  } else {
    console.warn('Upload failed 😞')
  }
  console.log('successful files:', result.successful)
  console.log('failed files:', result.failed)
})
