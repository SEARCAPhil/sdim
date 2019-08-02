import  commander from 'commander'
import fs from 'fs'
import path from 'path'
import clc from "cli-color"
import { FileReader } from './FileReader.js'
import { OCRProcessor } from './OCRProcessor.js'
import { RecognitionProcessor } from './RecognitionProcessor.js'

class CLIProcessor{
  constructor (opt = {}) {
    this.program = new commander.Command ();
    this.fileReader = new FileReader ()
    this.ocrProcessor = new OCRProcessor ()
    this.recognitionProcessor = new RecognitionProcessor ()
    this.setOptions()
  }

  setOptions () {
    this.program.version('0.0.1');
    // set option
    this.program
      .option('-v, --version', 'output extra debugging')
      .option('-d, --directory <type>', 'target directory')
      .option('-f, --filename <type>', 'absoulte target file')
      .option('-p, --provider <type>', 'name of OCR Provider')
      .option('-D, --verbose', 'show progress log')
    // enable options
    this.program.parse(process.argv);
    this.executeOptions ()
  }

  executeOptions () {
    if (this.program.verbose) this.setOCRDebug(true)
    if (this.program.provider) this.setOCRProviders (this.program.provider)
    if (this.program.version) this.showversion()
    if (this.program.directory) this.setDir()

  }

  showversion () {
    return this.program.version
  }

  async setDir () { 
    // check if path exists and there is a file to be read
    try {
      await fs.promises.access(this.program.directory);
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
          this.fileReader.readPDF.bind(this)
          this.fileReader.readPDF(path.join(dir,file.name), file).then(dataURL => {
            // read per file name
            let results = []
            let a = (async () => {
              for(let x in dataURL) {
                // read per page
                await dataURL[x].forEach(async(data, index) => { 
                  this.recognitionProcessor.recognize(await this.ocrProcessor.run(data, file.name, index))
                  /*this.ocrProcessor.run(data, file.name, index).then(res => {
                    this.recognitionProcessor.inspect(res)
                  })*/
                })
              }
            })()

          }).catch(err => {
            console.log(clc.red(err.name))
          })
        }
      })
    })
  }

  setOCRProviders (providers = []) { 
    this.ocrProcessor.setProviders(providers.split(','))
  }

  setOCRDebug (isDebug) {
    this.ocrProcessor.setDebug(isDebug) 
  }
}

const cli = new CLIProcessor()