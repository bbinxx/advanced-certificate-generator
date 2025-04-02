// main.js

// Import necessary modules
import { initCanvas, showCanvasSizeModal, hideCanvasSizeModal, setCanvasSize } from './modules/canvasManagement.js';
import { addText, addImageInput, addShape, setupElementEvents, selectElement } from './modules/elementManagement.js';
import { formatText, changeFont, changeTextColor, changeFontSize, populateFonts } from './modules/textFormatting.js';
import { alignElement } from './modules/alignment.js';
import { changeBackground, changeBgImage } from './modules/background.js';
import { saveAsPDF, saveDesign, saveAsImage } from './modules/saveAsFile.js';
import { saveState, undo, redo, updateLayerList } from './modules/stateManagement.js';
import { openCSVUploadInterface, closeCSVUploadInterface, parseCSV, displayCSVData, displayTextBoxesForMapping, updateCanvasWithCurrentRecord, nextRecord, previousRecord, generateCertificates, updateMappingState } from './modules/csvHandling.js';
import { makeDraggable } from './modules/draggable.js';
import { addQRCode, addVerifyLink } from './modules/verification.js';
import { importDesign } from './modules/importDesign.js';
import { openModal } from './modules/modalManagement.js';
import { ErrorHandler, withErrorHandling, withAsyncErrorHandling, validateParam } from './modules/errorHandling.js';
import { createLoadingScreen, updateLoadingProgress } from './modules/uiUtils.js';
import { TemplateManager } from './modules/templateManager.js';
import { initializeSidebar } from './modules/sidebarManager.js';
import { DynamicToolbar } from './modules/dynamicToolbar.js';
import { googleFonts } from './modules/fontList.js';
import { setupDraggableModals } from './modules/draggable.js';

// Export AppState so other modules can import it
export const AppState = {
  initialized: false,
  currentTemplate: null,
  unsavedChanges: false,
  processingBatch: false,
  batchProgress: 0,
  totalBatch: 0,
  templates: [], // Add templates array
  canvas: null, // Add canvas reference
  selectedElement: null,
  activePanel: null,
  ready: false // Add new ready state flag
};

// Add this near the start of your initialization code
function initializeCanvas() {
    const canvas = new fabric.Canvas('fabricCanvas', {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff'
    });
    
    AppState.canvas = canvas; // Store canvas in AppState
    return canvas;
}

// Ensure DOM is loaded before running scripts
document.addEventListener('DOMContentLoaded', async function() {
  const loadingScreen = createLoadingScreen();
  document.body.appendChild(loadingScreen);

  try {
    // Add check for required dependencies
    if (typeof fabric === 'undefined') {
      throw new Error('Fabric.js library not loaded');
    }

    // Initialize canvas first
    const canvas = await initCanvas();
    if (!canvas) {
      throw new Error('Canvas initialization failed');
    }
    
    AppState.canvas = canvas;
    window.certificateCanvas = canvas; // Make canvas globally accessible if needed

    // Initialize other modules after canvas is ready
    await initializeApplicationWithProgress([
      { 
        task: () => ErrorHandler.init(), 
        message: 'Initializing error handling...',
        critical: true 
      },
      { task: setupEventListeners, message: 'Setting up event listeners...' },
      { task: async () => {
          await TemplateManager.loadTemplates();
        }, 
        message: 'Loading templates...' 
      },
      { 
        task: async () => {
            await initializeSidebar();
        },
        message: 'Setting up sidebar interactions...'
      },
      {
        task: setupDraggableModals,
        message: 'Setting up draggable modals...'
      }
    ]);
    
    AppState.initialized = true;
    AppState.ready = true; // Set ready state to true
    
    // Dispatch event that canvas is ready
    document.dispatchEvent(new CustomEvent('canvasReady', { detail: { canvas } }));
  } catch (error) {
    ErrorHandler.handleError(error, 'applicationStartup', ErrorHandler.LEVELS.FATAL, true);
    alert('Failed to initialize application. Please refresh the page.');
  } finally {
    // Change opacity to display none
    loadingScreen.classList.add('hidden');
    setTimeout(() => loadingScreen.remove(), 300);
  }
});

/**
 * Initialize application with progress tracking
 * @param {Array} tasks - Array of initialization tasks
 */
async function initializeApplicationWithProgress(tasks) {
  const totalTasks = tasks.length;
  
  for (let i = 0; i < tasks.length; i++) {
    const { task, message, critical = false } = tasks[i];
    
    try {
      updateLoadingProgress(message, (i / totalTasks) * 100);
      await task();
    } catch (error) {
      if (critical) {
        throw new Error(`Critical initialization failed: ${error.message}`);
      }
      ErrorHandler.handleError(error, `initialization-${i}`, ErrorHandler.LEVELS.WARNING);
    }
  }
}

/**
 * Initialize core application components
 */
async function initializeApplication() {
    try {
        const canvas = new fabric.Canvas('fabricContainer', {
            width: 800,
            height: 600,
            backgroundColor: '#ffffff'
        });
        
        // Store canvas in AppState
        AppState.canvas = canvas;
        
        // Export canvas to window for global access if needed
        window.certificateCanvas = canvas;
        
        // Initialize modules after canvas is ready
        await Promise.all([
            setupEventListeners(),
            setupElementEvents(canvas),
            // Initialize other modules that need canvas reference
        ]);
        
        // Dispatch event that canvas is ready
        document.dispatchEvent(new CustomEvent('canvasReady', { 
            detail: { canvas } 
        }));
        
    } catch (error) {
        ErrorHandler.handleError(error, 'initializeApplication', ErrorHandler.LEVELS.CRITICAL);
    }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.formatting').style.display = 'none';
});

/**
 * Sets up all event listeners for the application
 */
function setupEventListeners() {
  // Group event listeners by functionality for better organization
  setupCSVManagementListeners();
  setupModalManagementListeners();
  setupCanvasManagementListeners();
  setupTextFormattingListeners();
  setupElementAdditionListeners();
  setupAlignmentListeners();
  setupSidebarListeners(); // Add this line

  // Update export button event listener
  safeAddEventListener('exportButton', 'click', () => {
    if (!AppState.canvas) {
      ErrorHandler.handleError(
        new Error('Canvas not initialized'), 
        'exportImage', 
        ErrorHandler.LEVELS.ERROR
      );
      return;
    }
    saveAsImage('png');
  }, 'exportImage');
}

/**
 * Helper to safely add event listeners with error handling
 * @param {string} id - Element ID
 * @param {string} event - Event name
 * @param {Function} callback - Event callback
 * @param {string} context - Error context description
 */
function safeAddEventListener(id, event, callback, context) {
  const element = document.getElementById(id);
  if (element) {
    // Create error-handled version of the callback
    const safeCallback = withErrorHandling(
      function(...args) {
        return callback.apply(this, args);
      },
      context || `${id}-${event}`,
      true
    );
    
    element.addEventListener(event, safeCallback);
  } else {
    console.warn(`Element with ID "${id}" not found.`);
  }
}

/**
 * Set up CSV management related event listeners
 */
function setupCSVManagementListeners() {
  safeAddEventListener('importInput', 'change', importDesign, 'importDesign');
  safeAddEventListener('exportButton', 'click', saveAsImage, 'exportImage');
  safeAddEventListener('uploadCSVButton', 'click', openCSVUploadInterface, 'openCSVUpload');
  safeAddEventListener('parseCSVButton', 'click', parseCSV, 'parseCSV');
  safeAddEventListener('closeCSVUploadInterfaceButton', 'click', closeCSVUploadInterface, 'closeCSVUpload');
  safeAddEventListener('previousRecordButton', 'click', previousRecord, 'previousRecord');
  safeAddEventListener('nextRecordButton', 'click', nextRecord, 'nextRecord');
  safeAddEventListener('generateCertificatesButton', 'click', generateCertificates, 'generateCertificates');
  safeAddEventListener('fieldMappingContainer', 'change', updateMappingState, 'updateMapping');
}


/**
 * Set up modal management related event listeners
 */
function setupModalManagementListeners() {
  // Modal opening
  safeAddEventListener('addAuth', 'click', () => {
    openModal('addAuth');
    setupDraggableModals(); // Reinitialize for new modals
  }, 'openAuthModal');
  safeAddEventListener('csvPanel', 'click', () => openModal('csvPanel'), 'openCSVPanelModal');
  safeAddEventListener('authDetails', 'click', () => openModal('authDetails'), 'openAuthDetailsModal');

  // Modal closing
  safeAddEventListener('closeModal', 'click', () => {
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'none';
  }, 'closeModal');
  
  const modal = document.getElementById('modal');
  if (modal) {
    modal.addEventListener('click', withErrorHandling(
      (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      }, 
      'modalOutsideClick'
    ));
  }

  // Initialize draggable modals
  setupDraggableModals();
}

/**
 * Set up canvas management related event listeners
 */
function setupCanvasManagementListeners() {
    safeAddEventListener('setCanvasSizeButton', 'click', showCanvasSizeModal, 'showCanvasSizeModal');
    safeAddEventListener('saveAsPDFButton', 'click', saveAsPDF, 'saveAsPDF');
    safeAddEventListener('saveButton', 'click', saveDesign, 'saveDesign');
    safeAddEventListener('importButton', 'click', () => {
        const importInput = document.getElementById('importInput');
        if (importInput) importInput.click();
    }, 'triggerImport');
    safeAddEventListener('bgColor', 'change', changeBackground, 'changeBackground');
    safeAddEventListener('setBgImageButton', 'click', changeBgImage, 'changeBgImage');

    // Canvas Size Modal
    safeAddEventListener('setCanvasSizeModalButton', 'click', () => {
        try {
            const width = document.getElementById('canvasWidth')?.value;
            const height = document.getElementById('canvasHeight')?.value;

            validateParam(parseInt(width), 'number', 'canvas width');
            validateParam(parseInt(height), 'number', 'canvas height');

            setCanvasSize(width, height);
            hideCanvasSizeModal();
        } catch (error) {
            ErrorHandler.handleError(error, 'setCanvasSize', ErrorHandler.LEVELS.WARNING);
        }
    }, 'applyCanvasSize');

    safeAddEventListener('hideCanvasSizeModalButton', 'click', hideCanvasSizeModal, 'hideCanvasSizeModal');
}

/**
 * Set up text formatting related event listeners
 */
function setupTextFormattingListeners() {
  safeAddEventListener('boldButton', 'click', () => formatText('bold'), 'formatTextBold');
  safeAddEventListener('italicButton', 'click', () => formatText('italic'), 'formatTextItalic');
  safeAddEventListener('underlineButton', 'click', () => formatText('underline'), 'formatTextUnderline');
  safeAddEventListener('fontFamily', 'change', changeFont, 'changeFont');
  safeAddEventListener('textColor', 'change', changeTextColor, 'changeTextColor');
  safeAddEventListener('fontSize', 'change', changeFontSize, 'changeFontSize');
}

/**
 * Set up alignment related event listeners
 */
function setupAlignmentListeners() {
  const alignments = [
    'Left', 'Center', 'Right', 
    'TopLeft', 'TopCenter', 'TopRight', 
    'BottomLeft', 'BottomCenter', 'BottomRight'
  ];
  
  alignments.forEach((align) => {
    const formattedAlign = align.toLowerCase()
      .replace('top', 'top-')
      .replace('bottom', 'bottom-');
      
    safeAddEventListener(
      `align${align}Button`, 
      'click', 
      () => alignElement(formattedAlign), 
      `align${align}`
    );
  });
}

/**
 * Set up element addition related event listeners
 */
function setupElementAdditionListeners() {
  // Text elements
  const textElements = [
    { id: 'addTitleButton', tag: 'h1', text: 'Certificate of Achievement' },
    { id: 'addSubtitleButton', tag: 'h2', text: 'In Recognition of Outstanding Performance' },
    { id: 'addRecipientNameButton', tag: 'div', text: 'Recipient Name' },
    { id: 'addAwardingOrgButton', tag: 'div', text: 'Awarding Organization' },
    { id: 'addDateButton', tag: 'div', text: 'Date' },
    { id: 'addDescriptionButton', tag: 'p', text: 'Description' },
    { id: 'addSignatureLineButton', tag: 'div', text: '_________________________' },
    { id: 'addSignatureNameButton', tag: 'div', text: 'Signature Name' },
    { id: 'addSignatureTitleButton', tag: 'div', text: 'Signature Title' }
  ];
  
  textElements.forEach(({ id, tag, text }) => {
    safeAddEventListener(
      id, 
      'click', 
      () => addText(tag, text), 
      `addText-${id}`
    );
  });
  
  // Shapes
  safeAddEventListener('addRectangleButton', 'click', () => addShape('rectangle'), 'addRectangle');
  safeAddEventListener('addCircleButton', 'click', () => addShape('circle'), 'addCircle');
  safeAddEventListener('addLineButton', 'click', () => addShape('line'), 'addLine');
  
  // Images
  ['Logo', 'Seal', 'SignatureImage', 'DecorativeElement'].forEach((type) => {
    safeAddEventListener(`add${type}Button`, 'click', addImageInput, `addImage-${type}`);
  });
}

/**
 * Set up sidebar and header menu listeners
 */
function setupSidebarListeners() {
    try {
        const sidebarItems = document.querySelectorAll('.sidebar li');
        
        // Close panels when clicking outside
        document.addEventListener('click', (event) => {
            const isClickInsideSidebar = event.target.closest('.sidebar li, .floating-panel');
            if (!isClickInsideSidebar) {
                sidebarItems.forEach(item => {
                    item.classList.remove('active');
                });
            }
        });

        // Add click handler for each sidebar item
        sidebarItems.forEach(item => {
            item.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent document click from immediately closing
                
                // Remove active class from all items
                sidebarItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Toggle active class on clicked item
                item.classList.toggle('active');
            });
        });
        
        // Prevent floating panel clicks from closing the panel
        const floatingPanels = document.querySelectorAll('.floating-panel');
        floatingPanels.forEach(panel => {
            panel.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        });

    } catch (error) {
        ErrorHandler.handleError(error, 'setupSidebarListeners', ErrorHandler.LEVELS.WARNING);
    }
}

/**
 * Setup draggable elements
 */
function setupDraggableElements() {
  try {
    if (typeof interact !== 'undefined') {
      interact('#draggableModal').draggable({
        listeners: {
          move(event) {
            const target = event.target;
            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
          },
        },
      });
    } else {
      ErrorHandler.handleError(
        new Error('Interact.js not loaded'), 
        'setupDraggableElements', 
        ErrorHandler.LEVELS.WARNING
      );
    }
  } catch (error) {
    ErrorHandler.handleError(error, 'setupDraggableElements', ErrorHandler.LEVELS.WARNING);
  }
}

/**
 * Open the mapping panel and display field mappings
 */
const openMappingPanel = withErrorHandling(function() {
  const panel = document.getElementById('mapFieldsItem');
  if (panel) {
    panel.style.display = 'block';
    displayTextBoxesForMapping();
    updateCanvasWithCurrentRecord();
  }
}, 'openMappingPanel');

/**
 * Close the mapping panel
 */
const closeMappingPanel = withErrorHandling(function() {
  const panel = document.getElementById('mapFieldsItem');
  if (panel) {
    panel.style.display = 'none';
  }
}, 'closeMappingPanel');

/**
 * Populate the font select dropdown with Google Fonts
 */
function populateFontSelect() {
  const fontSelect = document.getElementById('fontFamily');
  if (!fontSelect) return;

  // Clear existing options
  fontSelect.innerHTML = '';

  // Add default option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select Font';
  fontSelect.appendChild(defaultOption);

  // Add Google Fonts
  googleFonts.forEach(font => {
    const option = document.createElement('option');
    option.value = font;
    option.textContent = font;
    option.style.fontFamily = font;
    fontSelect.appendChild(option);
  });

  // Load Google Fonts stylesheet
  const fontsLink = document.createElement('link');
  fontsLink.rel = 'stylesheet';
  fontsLink.href = `https://fonts.googleapis.com/css2?family=${googleFonts.map(font => font.replace(/ /g, '+')).join('&family=')}&display=swap`;
  document.head.appendChild(fontsLink);
}

// Export functions that might be used by other modules
export { openMappingPanel, closeMappingPanel };