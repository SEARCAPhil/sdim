import clc from "cli-color" 

export class RecognitionProcessor {
  constructor () { }

  async recognize (OCRObject) {
    for(let obj in OCRObject) {
      this.processOCRProviderObject(OCRObject[obj]).then(res => {
        for(let y in res) {
          let a = (async () => {
            for (let x = 0; x < res[y].OCRProviderResults.length; x++) {
              let label = await this.asyncProcessFilteredData (res[y].OCRProviderResults[x].data)
              if(label.length) {
                console.log(obj, clc.magentaBright(`[${y}][${res[y].OCRProviderResults[x].name}]`), label)
                break
              }
            }
            
          })()
        }
      })
    }
  }

  asyncProcessFilteredData (OCRProviderResults) {
    let filteredData = []
    return new Promise(async(resolve, reject) => {
      for(let x = 0; x < OCRProviderResults.length; x++) {
        if(OCRProviderResults[x].filtered) {
          if(OCRProviderResults[x].filtered.length) filteredData = [...filteredData, ...OCRProviderResults[x].filtered]
        } 
        await filteredData
      }
      
      resolve(filteredData)
    })
  }

  async processOCRProviderObject (OCRObjectPage) {
    let OCRObjectList = {}
    return new Promise(async (resolve,reject)=> {
      // ocr per page
      for(let ocrProv in OCRObjectPage) {
        OCRObjectList[ocrProv] = OCRObjectList[ocrProv] || {}
        OCRObjectList[ocrProv].OCRProviderResults = await this.sort(OCRObjectPage[ocrProv])
        //await this.processOCRProviderObject(OCRObject[obj][ocrProv])
      }

      resolve(OCRObjectList)
    })
  }

  sort (OCRObjectPageData) {
    let OCRObjectPageDataValues = [...OCRObjectPageData]
    return new Promise(async (resolve, reject) => {
      for(let x = 0; x < OCRObjectPageDataValues.length; x++) {
        let left = x - 1
        let middle = x
  
        // must have a valid left value
        if(left >= 0) {
          // from current to left most
          for(let i = middle; i > 0; i--) {
            // swap if current is greater than the left node
            if(OCRObjectPageDataValues[i].percentage > OCRObjectPageDataValues[i-1].percentage) {
              let newLeft = OCRObjectPageDataValues[i]
              let newMiddle = OCRObjectPageDataValues[i-1]
              OCRObjectPageDataValues[i] = newMiddle
              OCRObjectPageDataValues[i-1] = newLeft
            } else {
              break
            }
          }
        }
      }
      resolve(OCRObjectPageDataValues)
    })
  }

  inspect (OCRObject) {
    for(let obj in OCRObject) {
      for(let y in OCRObject[obj]) {
        for(let x in OCRObject[obj]) {
          y,OCRObject[obj][x].forEach((el, ind) => {
            console.log(el)
          })
        }
      }
    }
  }

  

}