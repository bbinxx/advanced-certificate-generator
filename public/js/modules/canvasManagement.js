//canvasManagement.js
import { saveState } from './stateManagement.js';

let canvas;
let gridVisible = false;
let originalWidth;
let originalHeight;
let aspectRatio;
let scale = 1;
let canvasSizeModal = document.getElementById('canvasSizeModal');

export function initCanvas() {
    const container = document.getElementById('fabricContainer');
    if (container) {
        // Set initial dimensions
        originalWidth = container.offsetWidth;
        originalHeight = container.offsetHeight;
        aspectRatio = originalWidth / originalHeight;

        canvas = new fabric.Canvas('fabricCanvas', {
            width: originalWidth,
            height: originalHeight,
            preserveObjectStacking: true,
            backgroundColor: '#ffffff' // Set white background
        });

        // Set the canvas viewport
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

        // Initial grid drawing
        if (gridVisible) {
            drawGrid();
        }

        // Handle window resize
        window.addEventListener('resize', debounce(() => {
            resizeCanvas();
        }, 250));

        console.log('Canvas initialized with dimensions:', originalWidth, originalHeight);
        
        return canvas; // Add this line to return the canvas object
    } else {
        console.error('fabricContainer not found in the DOM');
        return null;
    }
}

function resizeCanvas() {
    const container = document.getElementById('fabricContainer');
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    
    // Calculate the scale to fit the container while maintaining aspect ratio
    const scaleX = containerWidth / originalWidth;
    const scaleY = containerHeight / originalHeight;
    scale = Math.min(scaleX, scaleY);

    // Calculate dimensions that maintain the original aspect ratio
    const scaledWidth = originalWidth * scale;
    const scaledHeight = originalHeight * scale;

    // Update canvas size
    canvas.setWidth(scaledWidth);
    canvas.setHeight(scaledHeight);

    // Center the canvas in the container
    const leftOffset = (containerWidth - scaledWidth) / 2;
    const topOffset = (containerHeight - scaledHeight) / 2;
    
    // Position the canvas element
    canvas.wrapperEl.style.position = 'absolute';
    canvas.wrapperEl.style.left = `${leftOffset}px`;
    canvas.wrapperEl.style.top = `${topOffset}px`;

    // Update the viewport transform to maintain object positions
    canvas.setViewportTransform([
        scale, 0,
        0, scale,
        0, 0
    ]);

    // Scale the grid if visible
    if (gridVisible) {
        drawGrid();
    }

    canvas.renderAll();
    saveState();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function drawGrid() {
    // Remove existing grid lines
    const existingLines = canvas.getObjects().filter(obj => obj.type === 'line');
    existingLines.forEach(line => canvas.remove(line));

    const width = originalWidth;
    const height = originalHeight;
    const gridSize = 20; // Fixed grid size relative to original dimensions

    // Draw vertical lines
    for (let x = 0; x < width; x += gridSize) {
        const line = new fabric.Line([x, 0, x, height], {
            stroke: 'lightgray',
            strokeWidth: 1 / scale, // Adjust stroke width based on scale
            selectable: false,
            evented: false,
            excludeFromExport: true
        });
        canvas.add(line);
    }

    // Draw horizontal lines
    for (let y = 0; y < height; y += gridSize) {
        const line = new fabric.Line([0, y, width, y], {
            stroke: 'lightgray',
            strokeWidth: 1 / scale, // Adjust stroke width based on scale
            selectable: false,
            evented: false,
            excludeFromExport: true
        });
        canvas.add(line);
    }

    // Send grid lines to back
    const gridLines = canvas.getObjects().filter(obj => obj.type === 'line');
    gridLines.forEach(line => canvas.sendToBack(line));
}

export function addElement(element) {
    canvas.add(element);
    saveState();
}

export function removeElement(element) {
    canvas.remove(element);
    saveState();
}

export function toggleGrid() {
    gridVisible = !gridVisible;
    if (gridVisible) {
        drawGrid();
    } else {
        const gridLines = canvas.getObjects().filter(obj => obj.type === 'line');
        gridLines.forEach(line => canvas.remove(line));
    }
    canvas.renderAll();
}

export function setCanvasSize(width, height) {
    originalWidth = width;
    originalHeight = height;
    aspectRatio = width / height;
    resizeCanvas();
}

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

export { canvas };