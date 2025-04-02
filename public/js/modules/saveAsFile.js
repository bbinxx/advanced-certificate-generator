// saveFile.js
import { canvas } from './canvasManagement.js';

export async function saveAsPDF() {
    try {
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
        download(blob, 'canvas.pdf', 'application/pdf');

    } catch (error) {
        console.error('Error saving as PDF:', error);
        alert('An error occurred while saving the design as a PDF.');
    }
}




export function saveDesign() {
    try {
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
    const format = 'png'; // You can make this configurable if needed.
    
    try {
        const dataURL = canvas.toDataURL({
            format: format,
            quality: 1,
            multiplier: 3, // Use multiplier to increase resolution.
        });
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `canvas.${format}`;
        link.click();
    } catch (error) {
        console.error('Error saving as image:', error);
        alert('An error occurred while saving the design as an image.');
    }
}