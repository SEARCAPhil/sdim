import clc from "cli-color"
import Tesseract from 'tesseract.js'
import { providers } from './OCRProviders/index.js'

export class OCRProcessor {
  constructor () {
    this.provider_proc_res = []
    this.results = []
    this.providerClasses = []
    this.debug = false
    this.providerLoaded = false
  }

  __runRegex (providerClassInstance, regex, text) { 
    return new Promise((resolve, reject) => {
      // set global alias
      if(!this.provider_proc_res[providerClassInstance.ALIAS]) this.provider_proc_res[providerClassInstance.ALIAS] = []
      // set regexs for that alias
      if(!this.provider_proc_res[providerClassInstance.ALIAS][regex.expression]) this.provider_proc_res[providerClassInstance.ALIAS][regex.expression] = []
      this.provider_proc_res[providerClassInstance.ALIAS][regex.expression] = text.match(regex.expression)
      resolve({
        regex : regex.expression, 
        filter: regex.filter, 
        data: this.provider_proc_res[providerClassInstance.ALIAS][regex.expression]
      })
    }).then(async(res) => {
      if(res.filter) { 
        let filteredData = (await res.filter(res.data))
        res.filtered = filteredData
      } 

      return res
    }).catch(err => {
      console.log(clc.red(err))
      return err
    })
  }

  __parse (providerAlias, provider, text) {
    let providerClassInstance = new provider.default()
    let regex_res = []
    // parsed text based on given expressions
    return this.runRegex(providerClassInstance, text).then(regex_res => { 
      // add statistics per word
      regex_res.forEach((el, index) => {
        el.stat = el.stat || []
        el.data = el.data || []
        el.data.forEach((word, index) => {
          // set default sampling
          if(!el.stat[word])  el.stat[word] = {
            count: 0,
            letterCount : 0,
            percentage : 0
          }
          // get actual stat
          let occurence = this.countOccurence (word, text)
          el.stat[word] = {
            count: el.stat[word].count + occurence.count,
            letterCount : el.stat[word].letterCount + occurence.letterCount,
            percentage : el.stat[word].percentage + occurence.percentage
          }
        })
      })
        
      return regex_res

    }).then(res => {  
      let results = {}
      results.name = providerClassInstance.ALIAS
      results.classInstance = providerClassInstance
      results.data = res
      results.percentage = 0.0


      res.forEach((el, index) => {
        for(let x in el.stat) {
          results.percentage += el.stat[x].percentage
        }
      })

      return results
    }).then(res => { 

      res.data.forEach((el, index) => {
       // console.log(el.stat)
      })
      //this.provider_proc.callback(this.text, res)
      return res
    })
  }

  setProviders (providers = []) {
    this.provider_proc_list = providers
  }

  setDebug (isDebug) {
    this.debug = isDebug
  }

  async run (dataURL, filename = null, page = 1) {
    // load required modules  
    let worker = new Tesseract.TesseractWorker();
    if(!this.providerLoaded) {
      this.providerLoaded = true
      this.providerClasses = await this.loadProviders()
    }
    // start parsing
   return worker.recognize(dataURL).progress(progress => {
      if( this.debug) console.log(`${clc.magentaBright(`${filename}[${page}]` || 'progress')}`, progress);
    }).then(result => { 
      // OCR
      this.text = result.text
      worker.terminate();
      return this.parse(result.text, filename, page)
    }).catch(err => {
      console.log(err)
    })
  }

  runRegex (providerClassInstance, text) {
    return new Promise((resolve, reject) => {
      let res = [];
      providerClassInstance.REGEX.forEach(async(el, index) => {
        res.push(await this.__runRegex (providerClassInstance, el, text))
        resolve(res)
      })
    }).catch(err => {
      reject(err)
    })
  }


  countOccurence (needle, haystack) {
    let letterCount = 0
    let matches = haystack.match(new RegExp(`${needle}`, 'gi'))

    matches.forEach((el, index) => {
      letterCount+=el.length
    })

    let percentage = (letterCount / haystack.length) * 100
    return {
      count: matches.length,
      letterCount,
      percentage
    }
  }

  loadProviders () {
    console.log(clc.blackBright('Loading providers . . .'))

    let __providers = []
    return new Promise(async (resolve, reject) => {
      await this.provider_proc_list.forEach(async (el, index) => {
        await __providers.push(import(`./OCRProviders/${providers[el]}`))
      })
      Promise.all(__providers).then(prov => {
        console.log(clc.green('Providers successfully loaded.'))
        resolve(prov)
      })
    })

  }

  async parse (text, filename = null, page = 0) {
    return new Promise(async(resolve, reject) => {
      let results = []
      let parsedPromise = []
      results[filename] = results[filename] || {}
      
      await this.providerClasses.forEach((providerClass, index) => {
        parsedPromise.push(this.__parse('',providerClass, text))
      })

      Promise.all(parsedPromise).then(promises => { 
        results[filename][page] = promises
        resolve(results)
      })
      
    })
  }
}