//importDesign.js
import { setupElementEvents } from './elementManagement.js';
import { updateLayerList } from './stateManagement.js';
import { canvas } from './canvasManagement.js';

export function importDesign(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const designData = JSON.parse(e.target.result);
                console.log('Design data:', designData);

                if (!designData.elements || !Array.isArray(designData.elements)) {
                    throw new Error('Invalid design data format: elements array is missing or not an array');
                }

                canvas.clear(); // Clear the canvas
                designData.elements.forEach(elementData => {
                    if (!elementData.type || !elementData.attributes) {
                        console.error('Invalid element data:', elementData);
                        return;
                    }

                    let element;
                    switch (elementData.type) {
                        case 'rect':
                            element = new fabric.Rect(elementData.attributes);
                            break;
                        case 'circle':
                            element = new fabric.Circle(elementData.attributes);
                            break;
                        case 'line':
                            element = new fabric.Line(elementData.attributes.points, elementData.attributes);
                            break;
                        case 'text':
                            element = new fabric.Text(elementData.content, elementData.attributes);
                            break;
                        case 'image':
                            fabric.Image.fromURL(elementData.content, function(img) {
                                element = img.set(elementData.attributes);
                                canvas.add(element);
                                setupElementEvents(element);
                            });
                            return; // Skip the rest of the loop for image elements
                        default:
                            console.error('Unsupported element type:', elementData.type);
                            return;
                    }
                    element.set(elementData.style);
                    canvas.add(element);
                    setupElementEvents(element);
                });
                canvas.setBackgroundColor(designData.canvasStyle.backgroundColor, canvas.renderAll.bind(canvas));
                updateLayerList();
            } catch (error) {
                console.error('Error importing design:', error);
            }
        };
        reader.readAsText(file);
    }
}
