import { saveState, updateLayerList } from './stateManagement.js';
import { canvas } from './canvasManagement.js';

export let selectedElement = null;
let elementIdCounter = 0;
let transformer;
let textarea;

export function addText(type, defaultText = '') {
    try {
        console.log('Adding text:', defaultText);
        const text = new fabric.IText(defaultText, {
            fontSize: 16,
            fontFamily: 'Arial',
            fill: 'black',
            left: 100,
            top: 100,
            id: `textBox${elementIdCounter++}`,
        });

        setupElementEvents(text);
        canvas.add(text);
        canvas.requestRenderAll(); // Ensure the canvas is rendered
        updateLayerList();
        saveState();
        console.log('Text added to canvas');
    } catch (error) {
        console.error('Error adding text:', error);
    }
}

export function addImageInput() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    addImage(event.target.result);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    } catch (error) {
        console.error('Error adding image input:', error);
    }
}

export function addImage(src) {
    try {
        fabric.Image.fromURL(src, function(img) {
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();
            const imgWidth = img.width;
            const imgHeight = img.height;

            let scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
            img.set({
                left: (canvasWidth - imgWidth * scale) / 2,
                top: (canvasHeight - imgHeight * scale) / 2,
                scaleX: scale,
                scaleY: scale,
                id: `imageBox${elementIdCounter++}`,
            });

            setupElementEvents(img);
            canvas.add(img);
            canvas.requestRenderAll(); // Ensure the canvas is rendered
            updateLayerList();
            saveState();
            console.log('Image added to canvas');
        });
    } catch (error) {
        console.error('Error adding image:', error);
    }
}

export function addShape(type) {
    try {
        let shape;
        if (type === 'rectangle') {
            shape = new fabric.Rect({
                width: 100,
                height: 100,
                fill: 'lightgray',
                left: 100,
                top: 100,
                id: `shapeBox${elementIdCounter++}`,
            });
        } else if (type === 'circle') {
            shape = new fabric.Circle({
                radius: 50,
                fill: 'lightgray',
                left: 100,
                top: 100,
                id: `shapeBox${elementIdCounter++}`,
            });
        } else if (type === 'line') {
            shape = new fabric.Line([0, 0, 100, 0], {
                stroke: 'black',
                strokeWidth: 2,
                left: 100,
                top: 100,
                id: `shapeBox${elementIdCounter++}`,
            });
        }

        if (shape) {
            setupElementEvents(shape);
            canvas.add(shape);
            canvas.requestRenderAll(); // Ensure the canvas is rendered
            updateLayerList();
            saveState();
            console.log('Shape added to canvas');
        } else {
            console.error('Invalid shape type:', type);
        }
    } catch (error) {
        console.error('Error adding shape:', error);
    }
}

export function setupElementEvents(element) {
    try {
        element.on('moving', () => {
           // console.log('Element moving:', element);
            saveState();
        });

        element.on('scaling', () => {
          //  console.log('Element scaling:', element);
            saveState();
        });

        element.on('rotating', () => {
          //  console.log('Element rotating:', element);
            saveState();
        });

        element.on('selected', () => {
          //  console.log('Element selected:', element);
            selectElement(element);
        });

        element.on('deselected', () => {
          //  console.log('Element deselected:', element);
            deselectElement();
        });
    } catch (error) {
        console.error('Error setting up element events:', error);
    }
}

export function selectElement(element) {
    try {
        if (selectedElement) {
            selectedElement.set('selected', false);
        }
        selectedElement = element;
        selectedElement.set('selected', true);
        canvas.requestRenderAll();
        console.log('Element selected:', element);

        const textFormatPanel = document.querySelector('.text-format-panel');
        if (textFormatPanel) {
            if (element.type === 'i-text' || element.type === 'text') {
                textFormatPanel.style.display = 'block';
            } else {
                textFormatPanel.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error selecting element:', error);
    }
}

export function deselectElement() {
    try {
        if (selectedElement) {
            selectedElement.set('selected', false);
            selectedElement = null;
            canvas.requestRenderAll();
            console.log('Element deselected');

            const textFormatPanel = document.querySelector('.text-format-panel');
            if (textFormatPanel) {
                textFormatPanel.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error deselecting element:', error);
    }
}

export function deleteSelectedElement() {
    try {
        if (selectedElement) {
            canvas.remove(selectedElement);
            selectedElement = null;
            updateLayerList();
            saveState();
            canvas.requestRenderAll(); // Ensure the canvas is rendered
            console.log('Element deleted');
        }
    } catch (error) {
        console.error('Error deleting element:', error);
    }
}

document.addEventListener('keydown', function(event) {
    try {
        if (event.key === 'Delete' || event.key === 'Backspace') {
            deleteSelectedElement();
        }
    } catch (error) {
        console.error('Error handling keydown event:', error);
    }
});

export function hideTransformer() {
    try {
        if (transformer) {
            transformer.set('visible', false);
            canvas.requestRenderAll(); // Ensure the canvas is rendered
            console.log('Transformer hidden');
        }
    } catch (error) {
        console.error('Error hiding transformer:', error);
    }
}

export function showTransformer() {
    try {
        if (transformer) {
            transformer.set('visible', true);
            canvas.requestRenderAll(); // Ensure the canvas is rendered
            console.log('Transformer shown');
        }
    } catch (error) {
        console.error('Error showing transformer:', error);
    }
}

export function startEditing(textNode) {
    try {
        initTextarea();
        textarea.value = textNode.text;
        textarea.style.width = textNode.width + 'px';
        textarea.style.height = textNode.height + 'px';
        textarea.style.left = textNode.left + 'px';
        textarea.style.top = textNode.top + 'px';
        textarea.style.display = 'block';
        textarea.focus();
        console.log('Started editing text:', textNode);
    } catch (error) {
        console.error('Error starting text editing:', error);
    }
}

export function finishEditing() {
    try {
        const textNode = selectedElement;
        if (textNode && textNode instanceof fabric.Text) {
            textNode.set('text', textarea.value);
            canvas.requestRenderAll(); // Ensure the canvas is rendered
            textarea.style.display = 'none';
            saveState();
            console.log('Finished editing text:', textNode);
        }
    } catch (error) {
        console.error('Error finishing text editing:', error);
    }
}

function initTextarea() {
    if (!textarea) {
        textarea = document.createElement('textarea');
        textarea.style.position = 'absolute';
        textarea.style.display = 'none';
        textarea.style.border = '1px solid black';
        textarea.style.padding = '5px';
        textarea.style.zIndex = 1000;
        document.body.appendChild(textarea);

        textarea.addEventListener('blur', finishEditing);
        textarea.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                finishEditing();
            }
        });
    }
}
