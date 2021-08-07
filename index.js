function fetching() {
    let filelist = document.getElementById('avatar').files;

    // Loaded via <script> tag, create shortcut to access PDF.js exports.
    let pdfjsLib = window['pdfjs-dist/build/pdf'];

    // The workerSrc property shall be specified.
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.js';

    let fileReader = new FileReader();

    fileReader.onload = function () {

        let typedarray = new Uint8Array(this.result);
        const loadingTask = pdfjsLib.getDocument(typedarray);

        // Get Document
        pdfjsLib.getDocument(typedarray).then(function (pdf) {

            let pdfDoc = pdf;
            let pagesPromises = [];
            // for(let i = 0; i < pdf.numPages; i++){
            //     //Convert to string
            //     //console.log()
            //         pagesPromises.push(getPageText(pageNumber, pdfDocument));       
            // }
            console.log(pdf.numPages);
        });
        pdfjsLib.getDocument(typedarray).promise.catch(function (err) {

            //Display error
            const div = pdfjsLib.createElement('div');
            div.className = 'error';
            div.appendChild(pdfjsLib.createTextNode(err.message));
            pdfjsLib.querySelector('body').insertBefore(div, canvas);

        });

        function getPageText(pageNum, PDFDocumentInstance) {
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
    }
}