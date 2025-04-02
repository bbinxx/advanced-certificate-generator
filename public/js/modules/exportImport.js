// importDesign.js
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

                if (!designData.objects || !Array.isArray(designData.objects)) {
                    throw new Error('Invalid design data format: objects array is missing or not an array');
                }

                canvas.clear(); // Clear the canvas
                canvas.loadFromJSON(designData, () => {
                    canvas.getObjects().forEach(element => {
                        setupElementEvents(element); // Set up event listeners for each element
                    });
                    canvas.renderAll(); // Render the canvas
                    updateLayerList(); // Update the layer list
                });
            } catch (error) {
                console.error('Error importing design:', error);
            }
        };
        reader.readAsText(file);
    }
}