//savePrint.js
export function saveAsPdf(elementId, fileName) {
    const element = document.getElementById(elementId);
    const opt = {
        margin: 0.5,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save();
}

export function printElement(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id ${elementId} not found`);
        return;
    }

    // Clone the element to print
    const printContainer = element.cloneNode(true);

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    printWindow.document.write('<html><head><title>Print</title></head><body>');
    printWindow.document.write(printContainer.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();

    // Print the new window
    printWindow.print();
    printWindow.onafterprint = function() {
        printWindow.close();
    };
}

export function initSavePrint(saveButtonId, printButtonId, elementId, pdfFileName) {
    document.getElementById(saveButtonId).addEventListener('click', async function () {
        saveAsPdf(elementId, pdfFileName);
    });

    document.getElementById(printButtonId).addEventListener('click', function () {
        printElement(elementId);
    });
}
