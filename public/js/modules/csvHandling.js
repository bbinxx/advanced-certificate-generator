//csvHandling.js
// dataManagement.js
import { canvas } from './canvasManagement.js';
import { generateQRCode } from './verification.js';
import { saveAsPDF } from './saveAsFile.js';

let csvData = [];
let currentRecordIndex = 0;
let mappingState = JSON.parse(localStorage.getItem('mappingState')) || {};

export function openCSVUploadInterface() {
    const csvUploadInterface = document.getElementById('csvUploadInterface');
    if (csvUploadInterface) {
        csvUploadInterface.classList.add('visible');
        // Clear previous data
        const table = document.getElementById('csvDataTable');
        if (table) {
            table.querySelector('thead').innerHTML = '';
            table.querySelector('tbody').innerHTML = '';
        }
        // Reset file input
        const fileInput = document.getElementById('csvFileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    }
}

export function closeCSVUploadInterface() {
    const csvUploadInterface = document.getElementById('csvUploadInterface');
    if (csvUploadInterface) {
        csvUploadInterface.classList.remove('visible');
    }
    const mapping = document.getElementById('mapping');
    if (mapping) {
        mapping.style.display = 'block';
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
            displayCSVData(csvData);
            displayTextBoxesForMapping();
            
            // Show success feedback
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

export function displayCSVData(data) {
    const table = document.getElementById('csvDataTable');
    if (!table || !data || data.length === 0) return;

    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Create header row
    const headers = Object.keys(data[0]);
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Create data rows
    data.slice(0, 10).forEach(row => { // Show only first 10 rows in preview
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '';
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
    const textBoxes = canvas.getObjects().filter(obj => obj.type === 'i-text');
    const fieldMappingContainer = document.getElementById('fieldMappingContainer');
    if (!fieldMappingContainer || !window.csvData || !window.csvData[0]) return;

    console.log('Text Boxes:', textBoxes);
    console.log('CSV Data:', window.csvData);

    fieldMappingContainer.innerHTML = '';
    textBoxes.forEach((textBox, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'mapping-row';

        const label = document.createElement('label');
        label.textContent = `Text Box ${index + 1}: `;

        const select = document.createElement('select');
        select.dataset.textBoxId = textBox.id;

        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '-- Select Field --';
        select.appendChild(emptyOption);

        const fields = Object.keys(window.csvData[0]);
        fields.forEach(field => {
            const option = document.createElement('option');
            option.value = field;
            option.textContent = field;
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
}

export function updateCanvasWithCurrentRecord() {
    if (!csvData || !csvData[currentRecordIndex]) return;

    const currentRecord = csvData[currentRecordIndex];
    const textBoxes = canvas.getObjects().filter(obj => obj.type === 'i-text');

    console.log('Updating canvas with current record:', currentRecord);
    console.log('Text Boxes:', textBoxes);

    textBoxes.forEach(textBox => {
        const csvField = mappingState[textBox.id];
        if (csvField && currentRecord[csvField] !== undefined) {
            textBox.set('text', String(currentRecord[csvField]));
            console.log(`Updated textBox ${textBox.id} with ${currentRecord[csvField]}`);
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
    if (!csvData || !canvas) return;

    const textBoxes = canvas.getObjects().filter(obj => obj.type === 'i-text');
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    try {
        for (let index = 0; index < csvData.length; index++) {
            const row = csvData[index];

            textBoxes.forEach(textBox => {
                const csvField = mappingState[textBox.id];
                if (csvField && row[csvField] !== undefined) {
                    textBox.set('text', String(row[csvField]));
                }
            });

            canvas.requestRenderAll();

            await delay(100);

            saveAsPDF()
        }
    } catch (error) {
        console.error('Error generating certificates:', error);
        alert('An error occurred while generating certificates.');
    }
}

// export async function saveCertificate(index, row) {
   

//         const containerWidth = container.offsetWidth;
//         const containerHeight = container.offsetHeight;

//         const canvasElement = document.createElement('canvas');
//         const context = canvasElement.getContext('2d');

//         canvasElement.width = containerWidth;
//         canvasElement.height = containerHeight;

//         context.fillStyle = 'white';
//         context.fillRect(0, 0, canvasElement.width, canvasElement.height);

//         canvas.renderAll(context);

//         // const qrCodeUrl = await generateQRCode(`http://localhost:3000/verify?certificateId=${row.ID}`);
//         // const qrCodeImg = new Image();

//         // qrCodeImg.onload = function () {
//         //     context.drawImage(qrCodeImg, 10, 10, 100, 100);

//         //     const finalDataURL = canvasElement.toDataURL('image/jpeg', 1.0);
//         //     const link = document.createElement('a');
//         //     link.href = finalDataURL;
//         //     link.download = `certificate_${index + 1}.jpg`;
//         //     link.click();
//         // };

//         // qrCodeImg.onerror = function(error) {
//         //     console.error('Error loading QR code image:', error);
//         //     alert('Error loading QR code image.');
//         // };

//         // qrCodeImg.src = qrCodeUrl;

    
// }

export function saveMappingState() {
    localStorage.setItem('mappingState', JSON.stringify(mappingState));
}

export function updateMappingState() {
    document.querySelectorAll('#fieldMappingContainer select').forEach(select => {
        const textBoxId = select.dataset.textBoxId;
        const csvField = select.value;
        mappingState[textBoxId] = csvField;
    });
}

function showError(message) {
    // Implementation depends on your UI, but could be a toast or alert
    console.error(message);
    alert(message); // Replace with better UI feedback
}

function showSuccess(message) {
    // Implementation depends on your UI, but could be a toast or alert
    console.log(message);
}