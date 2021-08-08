// called when a file is uploaded; parses the text and sends requests to the apis
function start() {

  let buttonElement = document.getElementById('display-text');
  buttonElement.innerHTML = 'Processing...';

  let filelist = document.getElementById('avatar').files;
  let pdfjsLib = window['pdfjs-dist/build/pdf'];
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.js';

  let fileReader = new FileReader();
  fileReader.onload = function () {
    let typedarray = new Uint8Array(this.result);
    const loadingTask = pdfjsLib.getDocument(typedarray);
    loadingTask.promise.then(pdf => {

      var pagesPromises = [];

      for (var i = 0; i < pdf.numPages; i++) {
        // Required to prevent that i is always the total of pages
        (function (pageNumber) {
          pagesPromises.push(getPageText(pageNumber, pdf));
        })(i + 1);
      }
      Promise.all(pagesPromises).then(async function (pagesText) {
        // join page strings
        pagesText = pagesText.join(' ');
        pagesText = cleanText(pagesText);

        // Display text of all the pages in the console
        // console.log(pagesText);

        // TODO: call question api

        // call relevance api
        let result = post("https://xhacks-2021.herokuapp.com/is-relevant", testQuestions);
        result.then(data => {
          const maxQuestions = Math.min(document.getElementById('max-questions').value, data.length);
          console.log("Success: ", tocsv(filterQuestions(data, maxQuestions)));
          download("questions.csv", tocsv(filterQuestions(data, maxQuestions)));
          buttonElement.innerHTML = 'Upload';
        }).catch(err => {
          console.log("Error: ", err);
          buttonElement.innerHTML = 'Upload';
        });
      });

    }, function (reason) {
      // PDF loading error
      console.error(reason);
      buttonElement.innerHTML = 'Upload';
    });
  }
  fileReader.readAsArrayBuffer(filelist[0]);
}


/**
 * Retrieves the text of a specif page within a PDF Document obtained through pdf.js 
 * 
 * @param {Integer} pageNum Specifies the number of the page 
 * @param {PDFDocument} PDFDocumentInstance The PDF document obtained 
 **/
function getPageText(pageNum, PDFDocumentInstance) {
  // Return a Promise that is solved once the text of the page is retrieven
  return new Promise(function (resolve, reject) {
    PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
      // The main trick to obtain the text of the PDF page, use the getTextContent method
      pdfPage.getTextContent().then(function (textContent) {
        var textItems = textContent.items;
        var finalString = "";

        // Concatenate the string of the item to the final string
        for (var i = 0; i < textItems.length; i++) {
          var item = textItems[i];

          finalString += item.str + " ";
        }

        // Solve promise with the text retrieven from the page
        resolve(finalString);
      });
    });
  });
}

// cleans text: removes double spaces
function cleanText(text) {
  text.replace(/\s{2,}/g, ' ');
  return text;
}

// filters the list of questions to contain the top n relevant questions
function filterQuestions(questions, n) {
  return {
    length: n,
    relevances: questions['relevances'].slice(0, n)
  }
}

// sends a post request using an endpoint and json body
function post(endpoint, body) {
  return new Promise((resolve, reject) => {
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    .then(response => response.json())
    .then(data => {
      resolve(data);
    })
    .catch(error => {
      reject(error);
    });
  })
}

// converts json to csv
function tocsv(json) {
  return json['relevances'].reduce((acc, {question, answer}) => {
    return acc + question + ',' + answer + '\r\n';
  }, '');
}

// downloads a text file
// Credit: https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
