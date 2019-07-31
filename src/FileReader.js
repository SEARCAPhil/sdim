
import PDFJS from 'pdfjs-dist';
import fs from 'fs'
import clc from "cli-color"
import Canvas from 'canvas'


// Canvas factory
function NodeCanvasFactory() {}
NodeCanvasFactory.prototype = {
  create: function NodeCanvasFactory_create(width, height) {
    // assert(width > 0 && height > 0, 'Invalid canvas size');
    var canvas = Canvas.createCanvas(width, height);
    var context = canvas.getContext("2d");
    return {
      canvas: canvas,
      context: context
    };
  },

  reset: function NodeCanvasFactory_reset(canvasAndContext, width, height) {
    // assert(canvasAndContext.canvas, 'Canvas is not specified');
    // assert(width > 0 && height > 0, 'Invalid canvas size');
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  },

  destroy: function NodeCanvasFactory_destroy(canvasAndContext) {
    // assert(canvasAndContext.canvas, 'Canvas is not specified');
    // Zeroing the width and height cause Firefox to release graphics
    // resources immediately, which can greatly reduce memory consumption.
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}



class FileReader{
  constructor (opt = {}) {
    this.worker = []
    this.dir = ''
    this.results = {}
  }

  readPDF (pdf, file) {
    let page = 1
    return new Promise((resolve, reject) => {
      // Read the PDF file into a typed array so PDF.js can load it
      let rawData = new Uint8Array(fs.readFileSync(pdf));
      let renderedPages = []

      PDFJS.getDocument(rawData).promise.then(async (doc) => {
        // READING
        renderedPages[file.name] = renderedPages[file.name] || []
        console.log('reading '+clc.yellowBright(`${file.name}[${page}] ...`))
        // render all pages
        for(let x = 0; x < doc.numPages; x++) {
          renderedPages[file.name][x] = await this.renderPage (doc, page)
        }

        resolve(renderedPages)
  
      }).catch(err => {
        // get document err
        reject(err)
      })
    })
  }

  renderPage (doc, page) {
    return new Promise((resolve, reject) => {
      doc.getPage(page).then((pdfPage) => {
        // Display page on the existing canvas with 100% scale.
        var viewport = pdfPage.getViewport({ scale: 1.5 });
        var canvas = Canvas.createCanvas(viewport.width, viewport.height)

        // create canvas factory which is required for nodeJS
        const canvasFactory = new NodeCanvasFactory();
        var canvasAndContext = canvasFactory.create(viewport.width, viewport.height)

        // render
        var renderTask = pdfPage.render({
          canvasContext: canvasAndContext.context,
          viewport: viewport,
          canvasFactory
        })

        renderTask.promise.then(() => {
          // transform to image to be processed by OCR
          resolve(canvasAndContext.canvas.toDataURL({pixelRatio: 3}))          
        }).catch(err => {
          console.log(clc.red(err))
          reject(err)
        })

      }).catch(err => {
        // getpage error
        console.log(clc.red(err))
        reject(err)
      })
    })
  }
}

export { FileReader }
