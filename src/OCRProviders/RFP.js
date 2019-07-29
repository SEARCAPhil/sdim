export class RFP {
  constructor () { 
    this.NAME = 'RFP';
    this.REGEX = [
      /Payee: \w*\s/gi,
    ];
  
    this.REGEX_FILTER = [
      {
        "/RFP[0-9]+-[0-9]+/" : 'RFPNumberFilterCallback'
      }
    ];
  
  }

  callback (text, results) {
    return {
      name : NAME,
      labels : this.filter($results.results)
    }
  }

  filter (results) {
    let filtered_results = [];
    this.REGEX_FILTER.forEach((el, index) => {
      results.forEach((el2, index2) => { console.log(typeof(el))
        if(typeof(el) === 'array') {

        } else {

        }
      })
    })
  }

}