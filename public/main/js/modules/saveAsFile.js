// saveFile.js
import { canvas } from './canvasManagement.js';
// import { ErrorHandler, withErrorHandling } from './errorHandling.js';

// Helper function to check if canvas is empty
function isCanvasEmpty() {
  // Check if canvas exists
  if (!canvas) {
    return true;
  }
  
  // Get all objects on the canvas (excluding grid lines)
  const objects = canvas.getObjects().filter(obj => obj.type !== 'line');
  
  // Canvas is empty if there are no objects
  return objects.length === 0;
}

export async function saveAsPDF() {
    try {
        // First check if canvas is empty
        if (isCanvasEmpty()) {
            // Use more direct error approach if ErrorHandler is unavailable
            alert('Cannot export an empty canvas to PDF. Please add content before exporting.');
            return;
        }

        const { PDFDocument, rgb, PageSizes } = window.PDFLib;

        const canvasElement = document.getElementById('fabricCanvas');
        if (!canvasElement) {
            console.error('Canvas element not found.');
            alert('Canvas element not found.');
            return;
        }

        const canvasWidth = canvasElement.width;
        const canvasHeight = canvasElement.height;

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([canvasWidth, canvasHeight]); // Set page size to canvas dimensions

        const canvasDataURL = canvasElement.toDataURL('image/png');
        const canvasImageBytes = await fetch(canvasDataURL).then(res => res.arrayBuffer());
        const canvasImage = await pdfDoc.embedPng(canvasImageBytes);

        page.drawImage(canvasImage, {
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight,
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        download(blob, 'Certifcate.pdf', 'application/pdf');

    } catch (error) {
        console.error('Error saving as PDF:', error);
        alert('An error occurred while saving the design as a PDF.');
    }
}

export function saveDesign() {
    try {
        // Saving empty design JSON is valid, no need to check
        const jsonData = JSON.stringify(canvas.toJSON(['id', 'name', 'type', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'angle', 'fill', 'fontFamily', 'fontSize', 'text', 'src']), null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'design.json';
        link.click();
    } catch (error) {
        console.error('Error saving design:', error);
        alert('An error occurred while saving the design.');
    }
}

export function saveAsImage() {
    try {
        // First check if canvas is empty
        if (isCanvasEmpty()) {
            alert('Cannot export an empty canvas as image. Please add content before exporting.');
            return;
        }
        
        const format = 'png'; // You can make this configurable if needed.
        
        const dataURL = canvas.toDataURL({
            format: format,
            quality: 1,
            multiplier: 3, // Use multiplier to increase resolution.
        });
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `Certifcate.${format}`;
        link.click();
    } catch (error) {
        console.error('Error saving as image:', error);
        alert('An error occurred while saving the design as an image.');
    }
}