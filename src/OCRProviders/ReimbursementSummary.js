export default class {
  constructor () { 
    this.ALIAS = 'rs'
    this.REGEX = [
      {
        expression: /BILLING/gi,
      }
    ]
  }

  callback (text, res) {
    return {
      name : this.constructor.name,
      labels : this.label(res)
    }
  }

  payeeFilter (data = []) {
    let dataCopy = [...data]
    return new Promise((resolve, reject) => {
      // "/RFP[0-9]+-[0-9]+/
      dataCopy.forEach((el, index) => {
        let match = el.match(/Payee: \w*\s/i)
        if(match.length) match[index] = match[0].replace(' ', '--')
        dataCopy[index] = match[0]
      })

      resolve(dataCopy)
    })
  }

  paymentFilter (data = []) {
    let dataCopy = [...data]
    return new Promise((resolve, reject) => {
      // "/RFP[0-9]+-[0-9]+/
      dataCopy.forEach((el, index) => {
        let match = el.match(/PAYMENT/i)
        if(match.length) dataCopy[index] = match[0].replace('P', '--')
      })
      resolve(dataCopy)
    })
  }

  label (res) { //console.log(res)
    /*let filtered_results = [];
    this.REGEX_FILTER.forEach((el, index) => {
      results.forEach((el2, index2) => { console.log(typeof(el))
        if(typeof(el) === 'array') {

        } else {

        }
      })
    })*/
  }

}