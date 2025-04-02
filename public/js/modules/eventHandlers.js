<script type="module" src="../js/main.js"></script>
import { ErrorHandler } from './errorHandling.js';
import { AppState } from '../main.js';
import { TemplateManager } from './templateManager.js';
import { addText, addImage, addShape } from './elementManagement.js';
import { saveAsPDF, saveDesign, saveAsImage } from './saveAsFile.js';
import { toggleGrid, showCanvasSizeModal, hideCanvasSizeModal } from './canvasManagement.js';

export function setupEventListeners() {
  try {
    // Template controls
    const templateSelector = document.getElementById('templateSelector');
    if (templateSelector) {
      templateSelector.addEventListener('change', async (e) => {
        if (e.target.value) {
          await TemplateManager.loadTemplate(e.target.value);
        }
      });
    }

    // Canvas controls
    setupButton('toggleGridButton', toggleGrid);
    setupButton('saveAsPDFButton', saveAsPDF);
    setupButton('setCanvasSizeButton', showCanvasSizeModal);
    setupButton('exportButton', saveAsImage);
    setupButton('saveButton', saveDesign);
    
    // Import/Export
    setupFileInput('importInput', 'json', async (file) => {
      try {
        const text = await file.text();
        const design = JSON.parse(text);
        await TemplateManager.loadTemplate(design);
      } catch (error) {
        ErrorHandler.handleError(error, 'importDesign');
      }
    });

  } catch (error) {
    ErrorHandler.handleError(error, 'setupEventListeners');
  }
}

function setupButton(id, handler) {
  const button = document.getElementById(id);
  if (button) {
    button.addEventListener('click', async (e) => {
      try {
        await handler(e);
      } catch (error) {
        ErrorHandler.handleError(error, `button-${id}`);
      }
    });
  }
}

function setupFileInput(id, accept, handler) {
  const input = document.getElementById(id);
  if (input) {
    input.accept = accept;
    input.addEventListener('change', async (e) => {
      try {
        if (e.target.files?.[0]) {
          await handler(e.target.files[0]);
        }
      } catch (error) {
        ErrorHandler.handleError(error, `fileInput-${id}`);
      }
    });
  }
}