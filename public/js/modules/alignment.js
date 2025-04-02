// alignment.js
import { selectedElement } from './elementManagement.js';
import { saveState } from './stateManagement.js';
import { canvas } from './canvasManagement.js';

export function alignElement(alignment) {
    if (!selectedElement) return;

    const stageWidth = canvas.width;
    const stageHeight = canvas.height;

    const elementWidth = selectedElement.width * selectedElement.scaleX;
    const elementHeight = selectedElement.height * selectedElement.scaleY;

    let x, y;

    switch (alignment) {
        case 'left':
            x = 0;
            y = selectedElement.top;
            break;
        case 'center':
            x = (stageWidth - elementWidth) / 2;
            y = selectedElement.top;
            break;
        case 'right':
            x = stageWidth - elementWidth;
            y = selectedElement.top;
            break;
        case 'top-left':
            x = 0;
            y = 0;
            break;
        case 'top-center':
            x = (stageWidth - elementWidth) / 2;
            y = 0;
            break;
        case 'top-right':
            x = stageWidth - elementWidth;
            y = 0;
            break;
        case 'bottom-left':
            x = 0;
            y = stageHeight - elementHeight;
            break;
        case 'bottom-center':
            x = (stageWidth - elementWidth) / 2;
            y = stageHeight - elementHeight;
            break;
        case 'bottom-right':
            x = stageWidth - elementWidth;
            y = stageHeight - elementHeight;
            break;
        case 'vertical-center':
            x = selectedElement.left;
            y = (stageHeight - elementHeight) / 2;
            break;
        case 'horizontal-center':
            x = (stageWidth - elementWidth) / 2;
            y = selectedElement.top;
            break;
        case 'center-both':
            x = (stageWidth - elementWidth) / 2;
            y = (stageHeight - elementHeight) / 2;
            break;
    }

    selectedElement.set({ left: x, top: y });
    canvas.requestRenderAll();
    saveState();
}

export function alignElements(elements, alignment) {
    if (!elements || elements.length === 0) return;

    const stageWidth = canvas.width;
    const stageHeight = canvas.height;

    elements.forEach(element => {
        const elementWidth = element.width * element.scaleX;
        const elementHeight = element.height * element.scaleY;

        let x, y;

        switch (alignment) {
            case 'left':
                x = 0;
                y = element.top;
                break;
            case 'center':
                x = (stageWidth - elementWidth) / 2;
                y = element.top;
                break;
            case 'right':
                x = stageWidth - elementWidth;
                y = element.top;
                break;
            case 'top-left':
                x = 0;
                y = 0;
                break;
            case 'top-center':
                x = (stageWidth - elementWidth) / 2;
                y = 0;
                break;
            case 'top-right':
                x = stageWidth - elementWidth;
                y = 0;
                break;
            case 'bottom-left':
                x = 0;
                y = stageHeight - elementHeight;
                break;
            case 'bottom-center':
                x = (stageWidth - elementWidth) / 2;
                y = stageHeight - elementHeight;
                break;
            case 'bottom-right':
                x = stageWidth - elementWidth;
                y = stageHeight - elementHeight;
                break;
            case 'vertical-center':
                x = element.left;
                y = (stageHeight - elementHeight) / 2;
                break;
            case 'horizontal-center':
                x = (stageWidth - elementWidth) / 2;
                y = element.top;
                break;
            case 'center-both':
                x = (stageWidth - elementWidth) / 2;
                y = (stageHeight - elementHeight) / 2;
                break;
        }

        element.set({ left: x, top: y });
    });

    canvas.requestRenderAll();
    saveState();
}