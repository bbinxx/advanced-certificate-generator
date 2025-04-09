// main.js
import { initCanvas, showCanvasSizeModal, hideCanvasSizeModal, setCanvasSize, toggleGrid } from './modules/canvasManagement.js';
import { addText, addImageInput, addShape, setupElementEvents, selectElement } from './modules/elementManagement.js';
import { formatText, changeFont, changeTextColor, changeFontSize, populateFonts, initTextFormatting } from './modules/textFormatting.js';
import { alignElement } from './modules/alignment.js';
import { changeBackground, changeBgImage } from './modules/background.js';
import { saveAsPDF, saveDesign ,saveAsImage} from './modules/saveAsFile.js';
import { saveState, undo, redo, updateLayerList } from './modules/stateManagement.js';
import { openCSVUploadInterface, closeCSVUploadInterface, parseCSV, displayCSVData, displayTextBoxesForMapping, updateCanvasWithCurrentRecord, nextRecord, previousRecord, generateCertificates,updateMappingState } from './modules/csvHandling.js';
import { makeDraggable } from './modules/draggable.js';
import { addQRCode, addVerifyLink } from './modules/verification.js';
import { importDesign } from './modules/importDesign.js';
import { handleError } from './modules/errorHandling.js';

document.addEventListener('DOMContentLoaded', function() {
    try {
        // Wrap all initialization code in try-catch
        initializeApp();
    } catch (error) {
        handleError(error, 'App Initialization');
    }
    initTextFormatting();
    populateFonts();
});

function initializeApp() {
    initCanvas();
    setupEventListeners();
}

function setupEventListeners() {
    // Event listeners will only be added if the elements exist
    const elements = {
        'importInput': importDesign,
        'exportButton': saveAsImage,
        'addTitleButton': () => addText('h1', 'Certificate of Achievement'),
        'addRectangleButton': () => addShape('rectangle'),
        'addCircleButton': () => addShape('circle'),
        'addLineButton': () => addShape('line'),
        'toggleGridButton': toggleGrid,
        'saveAsPDFButton': saveAsPDF,
        'setCanvasSizeButton': showCanvasSizeModal,
        'bgColor': changeBackground,
        'setBgImageButton': changeBgImage,
        // ...similar for other buttons...
    };
    

    Object.entries(elements).forEach(([id, handler]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
        }
    });

    // Initialize other UI components
    initializeSidebarItems();
    initializeHeaderItems();
    populateFonts();

    // Modal handling
    const modal = document.getElementById('modal');
    const closeModalBtn = document.getElementById('closeModal');
    
    if (modal && closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Remove this event listener as it's causing issues
    document.getElementById('csvUploadInterface').removeEventListener('click', openCSVUploadInterface);

    // Initialize draggable functionality
    const draggableModal = document.getElementById('draggableModal');
    if (draggableModal) {
        interact('#draggableModal').draggable({
            listeners: {
                move(event) {
                    const target = event.target;
                    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                    target.style.transform = `translate(${x}px, ${y}px)`;
                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);
                }
            }
        });
    }

    const uploadCSVButton = document.getElementById('uploadCSVButton');
    const csvUploadInterface = document.getElementById('csvUploadInterface');
    const csvFileInput = document.getElementById('csvFileInput');
    const parseCSVButton = document.getElementById('parseCSVButton');
    const closeCSVUploadInterfaceButton = document.getElementById('closeCSVUploadInterfaceButton');
    const mappingSection = document.getElementById('mapping');

    // Setup CSV button handlers
    if (uploadCSVButton) {
        uploadCSVButton.addEventListener('click', openCSVUploadInterface);
    }

    // Move close button handler outside the main conditional block
    if (closeCSVUploadInterfaceButton) {
        closeCSVUploadInterfaceButton.addEventListener('click', () => {
            console.log('Close button clicked');  // Debug log
            if (csvUploadInterface) {
                csvUploadInterface.style.display = 'none';
            }
        });
    }

    if (parseCSVButton) {
        parseCSVButton.addEventListener('click', async () => {
            try {
                const file = csvFileInput.files[0];
                if (!file) {
                    alert('Please select a CSV file');
                    return;
                }

                const parsedData = await parseCSV(file);
                displayCSVData(parsedData);

                if (mappingSection) {
                    mappingSection.style.display = 'block';
                }

                displayTextBoxesForMapping();
                
                if (csvUploadInterface) {
                    csvUploadInterface.style.display = 'none';
                }
            } catch (error) {
                console.error('Error parsing CSV:', error);
                alert('Failed to parse CSV file');
            }
        });
    }
}

function initializeSidebarItems() {
    const sidebarItems = document.querySelectorAll('.sidebar li');
    if (sidebarItems.length > 0) {
        sidebarItems.forEach(item => {
            item.addEventListener('click', function(event) {
                if (item.contains(event.target)) {
                    event.stopPropagation();
                    item.classList.toggle('active');
                    sidebarItems.forEach(otherItem => {
                        if (otherItem !== item) {
                            otherItem.classList.remove('active');
                        }
                    });
                }
            });
        });
    }
}

function initializeHeaderItems() {
    const headerItems = document.querySelectorAll('.header-menu li');
    if (headerItems.length > 0) {
        headerItems.forEach(item => {
            item.addEventListener('click', function(event) {
                if (item.contains(event.target)) {
                    event.stopPropagation();
                    item.classList.toggle('active');
                    headerItems.forEach(otherItem => {
                        if (otherItem !== item) {
                            otherItem.classList.remove('active');
                        }
                    });
                }
            });
        });
    }
}

// Add global error handler
window.addEventListener('error', function(event) {
    handleError(event.error, 'Global Error');
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    handleError(event.reason, 'Unhandled Promise Rejection');
});

