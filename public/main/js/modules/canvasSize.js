//canvasSize.js
import { setCanvasSize } from './canvasManagement.js';
import { saveState } from './stateManagement.js';

let canvasSizeModal = document.getElementById('canvasSizeModal');

export function showCanvasSizeModal() {
    if (canvasSizeModal) {
        canvasSizeModal.style.display = 'block';
    }
}

export function hideCanvasSizeModal() {
    if (canvasSizeModal) {
        canvasSizeModal.style.display = 'none';
    }
}

export { setCanvasSize };
