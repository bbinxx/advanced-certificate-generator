// background.js
import { saveState } from './stateManagement.js';
import { canvas } from './canvasManagement.js';

export function changeBackground() {
    canvas.backgroundColor = document.getElementById('bgColor').value;
    canvas.requestRenderAll();
    saveState();
}

export function changeBgImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadstart = function () {
                console.log("Loading image");
            };
            reader.onload = function (event) {
                try {
                    const img = new Image();
                    img.onload = function () {
                        const canvasWidth = canvas.getWidth();
                        const canvasHeight = canvas.getHeight();

                        // Calculate scale to cover the canvas
                        const scaleX = canvasWidth / img.width;
                        const scaleY = canvasHeight / img.height;
                        const scale = Math.max(scaleX, scaleY); // Cover the canvas

                        // Calculate scaled dimensions
                        const scaledWidth = img.width * scale;
                        const scaledHeight = img.height * scale;

                        // Calculate offsets to center the image
                        const left = (canvasWidth - scaledWidth) / 2;
                        const top = (canvasHeight - scaledHeight) / 2;

                        canvas.setBackgroundImage(event.target.result, canvas.renderAll.bind(canvas), {
                            scaleX: scale,
                            scaleY: scale,
                            originX: 'left',
                            originY: 'top',
                            left: left,
                            top: top,
                        });
                        canvas.renderAll(); // Ensure the change is immediately visible.
                    };
                    img.src = event.target.result;

                } catch (error) {
                    console.error("Error setting background image:", error);
                    // Show error message to user.
                } finally {
                    console.log("Image loaded or error");
                }
            };
            reader.onerror = function () {
                console.error("Error reading file");
                // Show error message to user.
            };

            reader.readAsDataURL(file);
        }
        input.remove(); // Remove input element.
    };
    input.click();
    saveState();
}