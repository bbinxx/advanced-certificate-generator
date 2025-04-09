import { canvas } from './canvasManagement.js';
import { generateQRCode } from './verification.js';
import { saveAsPDF } from './saveAsFile.js';

let csvData = [];
let currentRecordIndex = 0;
let mappingState = JSON.parse(localStorage.getItem('csvMappingState')) || {};

export function closeCSVUploadInterface() {
    const csvUploadInterface = document.getElementById('csvUploadInterface');
    if (csvUploadInterface) {
        csvUploadInterface.style.display = 'none';
        console.log('CSV interface closed'); // Debug log
    }
}

export function parseCSV() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    if (!file) {
        showError('Please select a CSV file first');
        return;
    }

    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        error: function(error) {
            showError('Error parsing CSV file: ' + error.message);
        },
        complete: function (results) {
            if (results.errors.length > 0) {
                showError('CSV parsing had errors: ' + results.errors[0].message);
                return;
            }
            
            if (results.data.length === 0) {
                showError('CSV file is empty');
                return;
            }

            csvData = results.data;
            currentRecordIndex = 0;
            displayCSVData(csvData);
            displayTextBoxesForMapping();
            
            showSuccess('CSV file successfully loaded with ' + csvData.length + ' records');
        }
    });
}

export function openMappingPanel() {
    const panel = document.getElementById('sidebarMappingPanel');
    if (panel) {
        panel.style.display = 'block';
        displayTextBoxesForMapping();
        updateCanvasWithCurrentRecord();
    }
}

export function closeMappingPanel() {
    const panel = document.getElementById('sidebarMappingPanel');
    if (panel) {
        panel.style.display = 'none';
    }
}

export function openCSVUploadInterface() {
    const csvUploadInterface = document.getElementById('csvUploadInterface');
    const table = document.getElementById('csvDataTable');
    
    if (csvUploadInterface) {
        csvUploadInterface.style.display = 'block';
    }

    if (table) {
        let thead = table.querySelector('thead');
        let tbody = table.querySelector('tbody');

        if (!thead) {
            thead = document.createElement('thead');
            table.appendChild(thead);
        }
        if (!tbody) {
            tbody = document.createElement('tbody');
            table.appendChild(tbody);
        }

        thead.innerHTML = '';
        tbody.innerHTML = '';
    } else {
        console.error('CSV Data Table not found');
    }

    const fileInput = document.getElementById('csvFileInput');
    if (fileInput) {
        fileInput.value = '';
    }
}

export function displayCSVData(data) {
    const table = document.getElementById('csvDataTable');
    if (!table) {
        console.error('CSV Data Table not found');
        return;
    }

    let thead = table.querySelector('thead');
    let tbody = table.querySelector('tbody');

    if (!thead) {
        thead = document.createElement('thead');
        table.appendChild(thead);
    }
    if (!tbody) {
        tbody = document.createElement('tbody');
        table.appendChild(tbody);
    }

    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (!data || data.length === 0 || !data[0] || typeof data[0] !== 'object') {
        console.error('Invalid or empty CSV data');
        return;
    }

    const headers = Object.keys(data[0]);
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    data.slice(0, 10).forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] !== undefined ? String(row[header]) : '';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    if (data.length > 10) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = headers.length;
        td.textContent = `... and ${data.length - 10} more rows`;
        td.style.textAlign = 'center';
        td.style.fontStyle = 'italic';
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    console.log('CSV data displayed successfully');
}

export function toggleFieldMappingPanel() {
    const panel = document.getElementById('sidebarMappingPanel');
    if (panel) {
        if (panel.style.display === 'none' || panel.style.display === '') {
            panel.style.display = 'block';
            displayTextBoxesForMapping();
            updateCanvasWithCurrentRecord();
        } else {
            panel.style.display = 'none';
        }
    }
}

export function displayTextBoxesForMapping() {
    if (!canvas || !csvData || csvData.length === 0) {
        console.error('Canvas or CSV data not available');
        return;
    }

    const textBoxes = canvas.getObjects().filter(obj => obj.type === 'i-text');
    const fieldMappingContainer = document.getElementById('fieldMappingContainer');
    if (!fieldMappingContainer) {
        console.error('Field mapping container not found');
        return;
    }

    fieldMappingContainer.innerHTML = '';
    const csvHeaders = Object.keys(csvData[0]);

    textBoxes.forEach((textBox, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'mapping-row flex items-center mb-2';

        const label = document.createElement('label');
        label.textContent = `Text Box ${index + 1}: `;
        label.className = 'mr-2';

        const select = document.createElement('select');
        select.dataset.textBoxId = textBox.id;
        select.className = 'border rounded p-1 flex-grow';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Select Field --';
        select.appendChild(defaultOption);

        csvHeaders.forEach(header => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            select.appendChild(option);
        });

        if (mappingState[textBox.id]) {
            select.value = mappingState[textBox.id];
        }

        select.addEventListener('change', () => {
            updateMappingState();
            updateCanvasWithCurrentRecord();
        });

        wrapper.appendChild(label);
        wrapper.appendChild(select);
        fieldMappingContainer.appendChild(wrapper);
    });

    const navigationButtons = document.createElement('div');
    navigationButtons.className = 'flex justify-between mt-4';
    
    const previousButton = document.createElement('button');
    previousButton.textContent = 'Previous';
    previousButton.className = 'bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2';
    previousButton.addEventListener('click', previousRecord);

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.className = 'bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2';
    nextButton.addEventListener('click', nextRecord);

    const generateButton = document.createElement('button');
    generateButton.textContent = 'Generate Certificates';
    generateButton.className = 'bg-blue-500 text-white px-4 py-2 rounded';
    generateButton.addEventListener('click', generateCertificates);

    navigationButtons.appendChild(previousButton);
    navigationButtons.appendChild(nextButton);
    navigationButtons.appendChild(generateButton);

    fieldMappingContainer.appendChild(navigationButtons);
    updateCanvasWithCurrentRecord();
}

export function updateMappingState() {
    const fieldMappingContainer = document.getElementById('fieldMappingContainer');
    if (!fieldMappingContainer) return;

    const selects = fieldMappingContainer.querySelectorAll('select');
    selects.forEach(select => {
        const textBoxId = select.dataset.textBoxId;
        mappingState[textBoxId] = select.value;
    });

    localStorage.setItem('csvMappingState', JSON.stringify(mappingState));
}

export function updateCanvasWithCurrentRecord() {
    if (!csvData || !csvData[currentRecordIndex]) return;

    const currentRecord = csvData[currentRecordIndex];
    const textBoxes = canvas.getObjects().filter(obj => obj.type === 'i-text');

    textBoxes.forEach(textBox => {
        const csvField = mappingState[textBox.id];
        if (csvField && currentRecord[csvField] !== undefined) {
            textBox.set('text', String(currentRecord[csvField]));
        }
    });

    canvas.requestRenderAll();
}

export function nextRecord() {
    if (currentRecordIndex < csvData.length - 1) {
        currentRecordIndex++;
        updateCanvasWithCurrentRecord();
    }
}

export function previousRecord() {
    if (currentRecordIndex > 0) {
        currentRecordIndex--;
        updateCanvasWithCurrentRecord();
    }
}

export async function generateCertificates() {
    if (!csvData || csvData.length === 0) {
        showError('No CSV data available');
        return;
    }

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    try {
        for (let i = 0; i < csvData.length; i++) {
            currentRecordIndex = i;
            updateCanvasWithCurrentRecord();
            await delay(100);
            await saveAsPDF();
        }
        showSuccess(`Generated ${csvData.length} certificates`);
    } catch (error) {
        console.error('Error generating certificates:', error);
        showError('An error occurred while generating certificates');
    }
}

function showError(message) {
    console.error(message);
    alert(message);
}

function showSuccess(message) {
    console.log(message);
    alert(message);
}