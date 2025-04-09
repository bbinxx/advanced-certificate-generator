// stateManagement.js
import { canvas } from './canvasManagement.js';

let history = [];
let redoHistory = [];
let currentStateIndex = -1;
let layerList = document.getElementById('layerList');

export function saveState() {
    const state = canvas.toJSON(['id', 'name', 'type', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'angle', 'fill', 'fontFamily', 'fontSize', 'text', 'src']);
    if (currentStateIndex < history.length - 1) {
        history = history.slice(0, currentStateIndex + 1);
        redoHistory = [];
    }
    history.push(state);
    currentStateIndex = history.length - 1;
}

export function undo() {
    if (currentStateIndex > 0) {
        currentStateIndex--;
        canvas.loadFromJSON(history[currentStateIndex], () => {
            canvas.renderAll();
            updateLayerList();
        });
        redoHistory.push(history.pop());
    }
}

export function redo() {
    if (redoHistory.length > 0) {
        history.push(redoHistory.pop());
        currentStateIndex = history.length - 1;
        canvas.loadFromJSON(history[currentStateIndex], () => {
            canvas.renderAll();
            updateLayerList();
        });
    }
}

export function updateLayerList() {
    layerList.innerHTML = '';
    const elements = canvas.getObjects();
    elements.forEach((element, index) => {
        const layerItem = document.createElement('div');
        layerItem.className = 'layer-item';

        const layerName = document.createElement('input');
        layerName.type = 'text';
        layerName.value = `Layer ${index + 1}`;
        layerName.addEventListener('change', () => {
            element.set('name', layerName.value);
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
            canvas.remove(element);
            updateLayerList();
            saveState();
        });

        layerItem.appendChild(layerName);
        layerItem.appendChild(deleteButton);

        layerItem.addEventListener('click', () => {
            selectElement({ target: element });
        });

        layerList.appendChild(layerItem);
    });
}