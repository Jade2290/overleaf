import 'core-js/stable/global-this' // polyfill for globalThis (used by pdf.js)
import 'core-js/stable/promise/all-settled' // polyfill for Promise.allSettled (used by pdf.js)
import 'core-js/stable/structured-clone' // polyfill for global.StructuredClone (used by pdf.js)
import 'core-js/stable/array/at' // polyfill for Array.prototype.at (used by pdf.js)

import { createWorker } from '@/utils/worker'
import * as PDFJS from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api'

export { PDFJS }

createWorker(() => {
  PDFJS.GlobalWorkerOptions.workerPort = new Worker(
    new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url) // NOTE: .mjs extension
  )
})

export const imageResourcesPath = '/images/pdfjs-dist/'
const cMapUrl = '/js/pdfjs-dist/cmaps/'
const standardFontDataUrl = '/fonts/pdfjs-dist/'

const params = new URLSearchParams(window.location.search)
const disableFontFace = params.get('disable-font-face') === 'true'
const disableStream = process.env.NODE_ENV !== 'test'

export const loadPdfDocumentFromUrl = (
  url: string,
  options: Partial<DocumentInitParameters> = {}
) =>
  PDFJS.getDocument({
    url,
    cMapUrl,
    standardFontDataUrl,
    disableFontFace,
    disableAutoFetch: true, // only fetch the data needed for the displayed pages
    disableStream,
    isEvalSupported: false,
    enableXfa: false, // default is false (2021-10-12), but set explicitly to be sure
    ...options,
  })