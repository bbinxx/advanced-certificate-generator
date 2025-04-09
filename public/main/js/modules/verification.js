//verification.js
import { canvas } from './canvasManagement.js';

export function generateQRCode(text, options = {}) {
    return new Promise((resolve, reject) => {
        QRCode.toDataURL(text, options, (err, url) => {
            if (err) {
                reject(err);
            } else {
                resolve(url);
            }
        });
    });
}

export function addQRCode() {
    const qrCodePlaceholder = new fabric.Rect({
        width: 100,
        height: 100,
        fill: 'lightgray',
        left: 100,
        top: 100,
    });
    canvas.add(qrCodePlaceholder);
    canvas.requestRenderAll();
}

export function addVerifyLink() {
    const verifyLink = new fabric.Text('Verify Link', {
        fontSize: 16,
        fontFamily: 'Arial',
        fill: 'black',
        left: 100,
        top: 100,
    });
    canvas.add(verifyLink);
    canvas.requestRenderAll();
}
