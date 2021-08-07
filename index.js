// called when a file is uploaded; parses the text and sends requests to the apis
function start() {
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
      Promise.all(pagesPromises).then(function (pagesText) {
        // join page strings
        pagesText = pagesText.join(' ');

        // Display text of all the pages in the console
        console.log(pagesText);

        // TODO: call question api
        let questions = {
          "questions": [
            {
              "answer": "Immanuel Kant",
              "question": "Who is the central figure in modern philosophy?"
            },
            {
              "answer": "1724–1804",
              "question": "When was Immanuel Kant born?"
            },
            {
              "answer": "rationalism and empiricism",
              "question": "What did Kant synthesize in early modern philosophy?"
            }
          ],
          "text": "Immanuel Kant (1724–1804) is the central figure in modern philosophy. He synthesized early modern rationalism and empiricism, set the terms for much of nineteenth and twentieth century philosophy, and continues to exercise a significant influence today in metaphysics, epistemology, ethics, political philosophy, aesthetics, and other fields."
        };

        // call relevance api
        post("https://xhacks-2021.herokuapp.com/is-relevant", questions);
      });

    }, function (reason) {
      // PDF loading error
      console.error(reason);
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

// sends a post request using an endpoint and json body
function post(endpoint, body) {
  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}