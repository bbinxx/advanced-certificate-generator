import { initExportImport } from './modules/exportImport.js';
import { initializeResizeDrag, dragMoveListener, handleDeleteKey } from './modules/dragResize.js';
import { addElement } from './modules/addElement.js';
import { initZoom } from './modules/zoom.js';
import { findElements, updateElements } from './modules/findElements.js';
import { initSavePrint } from './modules/savePrint.js';

document.addEventListener('DOMContentLoaded', () => {
    initExportImport('exportTemplateButton','importTemplateButton','certificate');
    initSavePrint('saveBtn', 'printBtn', 'certificate', 'certificate.pdf'); 
    initZoom('certificate', 'mainContent');
});

function updateCertificateFields() {
    const certificateFieldsSelect = $('#certificateFields');
    certificateFieldsSelect.empty();
    const { textElements, imageElements } = updateElements('#certificate');
    textElements.forEach(element => {
        const id = element.getAttribute('id');
        const label = id ? id.replace('preview-', '') : 'New Text Box';
        certificateFieldsSelect.append(`<option value="${id || 'new-text-box'}">${label}</option>`);
    });
}

document.getElementById('addTextButton').addEventListener("click", () => {
    addElement('text', 'certificate');
    initializeResizeDrag('.textBox');
    updateCertificateFields();
});

document.getElementById('addImageButton').addEventListener("click", () => {
    addElement('image', 'certificate');
    initializeResizeDrag('.imageBox');
    updateCertificateFields();
});
$(document).ready(function () {
    let currentIndex = 0;
    let csvData = [];
    let fieldMapping = {};
    let selectedCertificateFields = [];

    $('#dark-mode-toggle').on('click', function () {
        $('html').toggleClass('dark');
    });

    $('#uploadBtn').on('click', function () {
        const file = $('#csvFile')[0].files[0];
        if (!file) {
            alert('Please select a CSV file first!');
            return;
        }
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                csvData = results.data;
                populateTable(csvData);
                populateCertificateFields();
                updateMappingTable(Object.keys(csvData[0]));
                updatePreview(csvData[currentIndex]);
            },
        });
    });

    function populateTable(data) {
        const headers = Object.keys(data[0]);
        $('#csvHeader').empty();
        headers.forEach(header => {
            $('#csvHeader').append(`<th>${header}</th>`);
        });

        $('#csvBody').empty();
        data.forEach(row => {
            const rowHtml = headers.map(header => `<td>${row[header]}</td>`).join('');
            $('#csvBody').append(`<tr>${rowHtml}</tr>`);
        });
    }

    function populateCertificateFields() {
        const certificateFieldsSelect = $('#certificateFields');
        certificateFieldsSelect.empty();
        const { textElements, imageElements } = findElements('#certificate');
        textElements.forEach(element => {
            const id = element.getAttribute('id');
            const label = id ? id.replace('preview-', '') : 'New Text Box';
            certificateFieldsSelect.append(`<option value="${id || 'new-text-box'}">${label}</option>`);
        });
    }

    $('#certificateFields').on('change', function () {
        selectedCertificateFields = $(this).val();
        updateMappingTable(Object.keys(csvData[0]));
    });

    $('#certificateFields').on('focus', function () {
        const selectedValue = $(this).val();
        if (selectedValue) {
            const element = document.getElementById(selectedValue);
            if (element) {
                element.classList.add('highlight');
            }
        }
    }).on('blur', function () {
        const selectedValue = $(this).val();
        if (selectedValue) {
            const element = document.getElementById(selectedValue);
            if (element) {
                element.classList.remove('highlight');
            }
        }
    }).on('change', function () {
        const selectedValue = $(this).val();
        if (selectedValue) {
            const element = document.getElementById(selectedValue);
            if (element) {
                element.classList.add('highlight');
            }
        }
    });

    function updateMappingTable(csvFields) {
        const mappingBody = $('#mappingBody');
        mappingBody.empty();
        selectedCertificateFields.forEach(certField => {
            const csvField = fieldMapping[certField] || '';
            mappingBody.append(`
                <tr>
                    <td>${certField.replace('preview-', '')}</td>
                    <td>
                        <select class="csv-field-select" data-cert-field="${certField}">
                            <option value="">-- Select CSV Field --</option>
                            ${csvFields.map(field => `<option value="${field}" ${csvField === field ? 'selected' : ''}>${field}</option>`).join('')}
                        </select>
                    </td>
                </tr>
            `);
        });

        $('.csv-field-select').on('change', function () {
            const certField = $(this).data('certField');
            const csvField = $(this).val();
            fieldMapping[certField] = csvField;
            console.log('Field Mapping:', fieldMapping); // Debugging statement
            updatePreview(csvData[currentIndex]);
        });
    }

    function updatePreview(row) {
        $('.editable').each(function () {
            const field = fieldMapping[$(this).attr('id')];
            console.log('Element ID:', $(this).attr('id'), 'Mapped Field:', field, 'CSV Value:', row[field]); // Debugging statement
            if (field && row[field]) {
                $(this).text(row[field]);
            }
        });
    }

    $('#nextBtn').on('click', function () {
        if (currentIndex < csvData.length - 1) {
            currentIndex++;
            updatePreview(csvData[currentIndex]);
        }
    });

    $('#prevBtn').on('click', function () {
        if (currentIndex > 0) {
            currentIndex--;
            updatePreview(csvData[currentIndex]);
        }
    });

    $('#downloadBtn').on('click', function () {
        html2canvas($('#certificate')[0], { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height],
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save('certificate.pdf');
        });
    });

    function initDragResize() {
        const { textElements, imageElements } = findElements('#certificate');

        textElements.forEach(element => {
            initializeResizeDrag(element);
        });

        imageElements.forEach(image => {
            initializeResizeDrag(image);
            image.addEventListener('dblclick', function () {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.addEventListener('change', function (event) {
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function (e) {
                            image.src = e.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                });
                input.click();
            });
        });
    }

    function updateCertificateFields() {
        const certificateFieldsSelect = $('#certificateFields');
        certificateFieldsSelect.empty();
        const { textElements, imageElements } = updateElements('#certificate');
        textElements.forEach(element => {
            const id = element.getAttribute('id');
            const label = id ? id.replace('preview-', '') : 'New Text Box';
            certificateFieldsSelect.append(`<option value="${id || 'new-text-box'}">${label}</option>`);
        });
    }
});
