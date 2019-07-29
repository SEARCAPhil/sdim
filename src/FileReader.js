import  commander from 'commander'
import PDFJS from 'pdfjs-dist';
import fs from 'fs'
import path from 'path'
import clc from "cli-color"
import Canvas from 'canvas'
import Tesseract from 'tesseract.js'
import { RFP } from './OCRProviders/RFP.js'


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
    this.program = new commander.Command();
    this.worker = []
    this.setOptions()
    this.dir = ''
    this.preResults = []
    
  }

  setOptions () {
    this.program.version('0.0.1');
    // set option
    this.program
      .option('-v, --version', 'output extra debugging')
      .option('-d, --directory <type>', 'target directory')
      .option('-f, --filename <type>', 'absoulte target file')
      .option('-p, --provider <type>', 'name of OCR Provider')
    // enable options
    this.program.parse(process.argv);
    this.executeOptions ()
  }

  executeOptions () {
    if (this.program.version) this.showversion()
    if (this.program.directory) this.setDir()
    
  }

  showversion () {
    return this.program.version
  }

  async setDir () { 
    // check if path exists and there is a file to be read
    try {
      let path = await fs.promises.access(this.program.directory);
      this.readDir(this.program.directory)
    } catch (error) {
      // The check failed
      throw new Error(clc.red('Path does not exists')) 
    }
  }

  async readDir (dir) {
    fs.readdir(dir, {withFileTypes: true}, (err, files) => {
      files.forEach(file => {
        // read pdf file from root directory using pdf.js
        if(!file.isDirectory()) { 
          this.readPDF.bind(this)
          this.readPDF(path.join(dir,file.name), file)
        }
      })
    })
  }

  readPDF (pdf, file) {

    // Read the PDF file into a typed array so PDF.js can load it
    let rawData = new Uint8Array(fs.readFileSync(pdf));

    PDFJS.getDocument(rawData).promise.then((doc) => {

      // READING
      console.log('reading '+clc.yellowBright(`${file.name} ...`))


      // Request a first page
      return doc.getPage(1).then((pdfPage) => {
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
          let dataURL = canvasAndContext.canvas.toDataURL({pixelRatio: 3});
          let worker = new Tesseract.TesseractWorker();
          worker.recognize(dataURL).progress(progress => {
            console.log('progress', progress);
          }).then(result => { 
            // run internal regex
            this.runRegex(result.text).then(regex_res=> { 
              let regex_stat = []
              for(let regex in regex_res) {
                if(!regex_stat[regex])  regex_stat[regex] = []
                regex_res[regex].forEach((word, index) => {

                  /* Sample result
                    regex_stat['\A-Z\gi']['hi'] = {
                      'count' : 0, 
                      'letterCount' : 0, 
                      'percentage' : 0
                    }
                  */
                  if(!regex_stat[regex][word])  regex_stat[regex][word] = {
                    count: 0,
                    letterCount : 0,
                    percentage : 0
                  }

                })
              }
              console.log(regex_stat)
            })
            
            worker.terminate();
          }).catch(err => {
            console.log(err)
          })
                       
        }).catch(err => {
          console.log(clc.red(err))
        })
      })
    }).catch(err => {
      console.log(err)
    })
  }

  runRegex (text) {
    let provider_proc = new RFP ()
    let provider_proc_res = []
    return new Promise((resolve, reject) => {
      provider_proc.REGEX.forEach((el, index) => {
        if(!provider_proc_res[el]) provider_proc_res[el] = []
        provider_proc_res[el] = text.match(el)
        resolve(provider_proc_res)
      })
    })


    return this
  }

  percentile () {

  }

  countOccurence () {

  }

}



let PDFReader =  new FileReader() 
export { PDFReader  }