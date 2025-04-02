// Filename: modalManagement.js
import { applyVerificationChoice, addCertificate } from './verification.js';
import { currentRecordIndex } from './csvHandling.js';
import { 
  displayTextBoxesForMapping, 
  nextRecord, 
  updateCertificateDetails, 
  previousRecord, 
  generateCertificates,
  saveMappingState,
  resetMappingState
} from './csvHandling.js';

// Open the modal and add content
export function openModal(buttonId) {
  try {
    const modal = document.getElementById('modal');

    if (!modal) {
      console.error('Modal element not found in the HTML.');
      alert('Error: Modal element not found. Please check the HTML structure.');
      return;
    }

    modal.style.display = 'flex';
    const modalBody = modal.querySelector('.p-4');
    if (!modalBody) {
      console.error('Modal body not found inside the modal.');
      alert('Error: Modal body not found. Please check the HTML structure.');
      return;
    }

    if (buttonId === 'addAuth') {
      // Verification choice modal
      modalBody.innerHTML = createVerificationChoiceModalContent();
    
      const applyButton = document.getElementById('applyButton');
      if (applyButton) {
        applyButton.addEventListener('click', () => applyVerificationChoice(buttonId));
      } else {
        console.error('Apply button not found after modal content creation');
      }
    }
    
    else if (buttonId === 'authDetails') {
      // Authentication details modal
      try {
        const hasCSV = window.csvData?.length > 0;
        modalBody.innerHTML = `
          <p class="text-lg font-semibold">Add Certificate Details</p>
          ${['name', 'certificateId', 'date', 'issuer'].map(field => `
            <label class="block mt-2">${field.charAt(0).toUpperCase() + field.slice(1)}:</label>
            ${hasCSV ? `
              <select id="${field}Select" class="border rounded p-2 w-full">
                <option value="custom">Custom Input</option>
                ${Object.keys(window.csvData[0] || {}).map(csvField => `<option value="${csvField}">${csvField}</option>`).join('')}
              </select>
            ` : ''}
            <input type="text" id="${field}Input" class="border rounded p-2 w-full mt-2" placeholder="Enter ${field}" />
          `).join('')}

          <button type="submit" id="submitAuthDetails" class="mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 w-full">Add Certificate</button>
        `;

        if (hasCSV) {
          // Manage CSV field selection and input update
          ['name', 'certificateId', 'date', 'issuer'].forEach(field => {
            const select = document.getElementById(`${field}Select`);
            const input = document.getElementById(`${field}Input`);

            if (select && input) {
              select.addEventListener('change', () => {
                if (select.value === 'custom') {
                  input.value = '';
                } else {
                  input.value = window.csvData[currentRecordIndex]?.[select.value] || '';
                }
              });
            }
          });
        }

        const submitButton = document.getElementById('submitAuthDetails');
        if (submitButton) {
          submitButton.addEventListener('click', async () => {
            try {
              const data = ['name', 'certificateId', 'date', 'issuer'].reduce((acc, field) => {
                const select = document.getElementById(`${field}Select`);
                const input = document.getElementById(`${field}Input`);
                acc[field] = select?.value === 'custom' || !select ? input.value : window.csvData?.[currentRecordIndex]?.[select?.value] || input?.value;
                return acc;
              }, {});

              if (Object.values(data).some(value => !value)) {
                alert('Please fill in all fields.');
                return;
              }

              console.log('Certificate Details:', data);
              
              try {
                // Add certificate to server using the new function
                const verificationLink = await addCertificate(data.name, data.certificateId, data.date, data.issuer);
                
                if (verificationLink) {
                  alert(`Certificate Added Successfully!\nVerification Link: ${verificationLink}`);
                } else {
                  alert('Certificate added but no verification link was generated.');
                }
              } catch (apiError) {
                console.error('API Error:', apiError);
                alert(`Error connecting to certificate server: ${apiError.message}`);
              }
              
              modal.style.display = 'none';
            } catch (formError) {
              console.error('Form Processing Error:', formError);
              alert(`Error processing form data: ${formError.message}`);
            }
          });
        } else {
          console.error('Submit button not found after modal content creation');
        }
      } catch (modalError) {
        console.error('Error creating authentication details modal:', modalError);
        alert(`Error creating modal content: ${modalError.message}`);
      }
    } else if (buttonId === "csvPanel") {
      try {
        const hasCSV = window.csvData?.length > 0;
      
        modalBody.innerHTML = `
          <p class="text-lg font-semibold">CSV Mapping and Certificate Details</p>
          <div class="flex gap-8">
            <!-- Left: Map CSV Fields -->
            <div class="w-1/2 overflow-y-auto max-h-[70vh]" style="padding: 20px;">
              <p class="text-lg font-semibold mb-4">Map CSV Fields to Canvas Elements</p>
              <div id="sidebarMappingPanel" class="sidebar-panel">
                <div id="fieldMappingContainer"></div>
              </div>
              
              <!-- Save/Reset Mapping Buttons -->
              <div class="flex space-x-2 mt-4">
                <button id="saveMappingButton" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">Save Mapping</button>
                <button id="resetMappingButton" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">Reset Mapping</button>
              </div>
            </div>
      
            <!-- Right: Add Certificate Details & Verification -->
            <div class="w-1/2 overflow-y-auto max-h-[70vh]" style="padding: 20px;">
              <p class="text-lg font-semibold mb-4">Add Certificate Details</p>
              ${['name', 'certificateId', 'date', 'issuer'].map(field => `
                <label class="block mt-2">${field.charAt(0).toUpperCase() + field.slice(1)}:</label>
                ${hasCSV ? `
                  <select id="${field}Select" class="border rounded p-2 w-full">
                    <option value="custom">Custom Input</option>
                    ${Object.keys(window.csvData[0] || {}).map(csvField => `<option value="${csvField}">${csvField}</option>`).join('')}
                  </select>
                ` : ''}
                <input type="text" id="${field}Input" class="border rounded p-2 w-full mt-2" placeholder="Enter ${field}" />
              `).join('')}
            </div>
          </div>
      
          <!-- Navigation Buttons -->
          <div class="flex justify-between mt-4">
            <button id="previousRecordButton" class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">Previous</button>
            <button id="generateCertificatesButton" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Generate Certificates</button>
            <button id="nextRecordButton" class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">Next</button>
          </div>
        `;
      
        // Display mapping panel
        const sidebarPanel = document.getElementById('sidebarMappingPanel');
        if (sidebarPanel) {
          sidebarPanel.style.display = 'block';
        } else {
          console.warn('Sidebar mapping panel not found');
        }
        
        // Call display function, wrapped in try-catch
        try {
          displayTextBoxesForMapping();
        } catch (mappingError) {
          console.error('Error displaying textboxes for mapping:', mappingError);
        }
      
        // Event Listeners with error handling
        const previousButton = document.getElementById("previousRecordButton");
        const nextButton = document.getElementById("nextRecordButton");
        const generateButton = document.getElementById("generateCertificatesButton");
        const saveMappingButton = document.getElementById("saveMappingButton");
        const resetMappingButton = document.getElementById("resetMappingButton");
        
        if (previousButton) {
          previousButton.addEventListener("click", () => {
            try {
              previousRecord();
            } catch (error) {
              console.error('Error handling previous record navigation:', error);
              alert(`Navigation error: ${error.message}`);
            }
          });
        } else {
          console.warn('Previous record button not found');
        }
        
        if (nextButton) {
          nextButton.addEventListener("click", () => {
            try {
              nextRecord();
            } catch (error) {
              console.error('Error handling next record navigation:', error);
              alert(`Navigation error: ${error.message}`);
            }
          });
        } else {
          console.warn('Next record button not found');
        }
        
        if (generateButton) {
          generateButton.addEventListener("click", async () => {
            try {
              await generateCertificates();
            } catch (error) {
              console.error('Error generating certificates:', error);
              alert(`Certificate generation error: ${error.message}`);
            }
          });
        } else {
          console.warn('Generate certificates button not found');
        }
        
        // New Save Mapping button event listener
        if (saveMappingButton) {
          saveMappingButton.addEventListener("click", () => {
            try {
              saveMappingState();
              alert("Mapping saved successfully!");
            } catch (error) {
              console.error('Error saving mapping state:', error);
              alert(`Save error: ${error.message}`);
            }
          });
        } else {
          console.warn('Save mapping button not found');
        }
        
        // New Reset Mapping button event listener
        if (resetMappingButton) {
          resetMappingButton.addEventListener("click", () => {
            try {
              if (confirm("Are you sure you want to reset the mapping? This cannot be undone.")) {
                resetMappingState();
                alert("Mapping reset successfully!");
                // Refresh the mapping display
                displayTextBoxesForMapping();
              }
            } catch (error) {
              console.error('Error resetting mapping state:', error);
              alert(`Reset error: ${error.message}`);
            }
          });
        } else {
          console.warn('Reset mapping button not found');
        }
      
        if (hasCSV) {
          // Handle Certificate Details on record navigation
          ['name', 'certificateId', 'date', 'issuer'].forEach(field => {
            const select = document.getElementById(`${field}Select`);
            const input = document.getElementById(`${field}Input`);
            
            if (select && input) {
              select.addEventListener('change', () => {
                try {
                  if (select.value === 'custom') {
                    input.value = '';
                  } else {
                    input.value = window.csvData[currentRecordIndex]?.[select.value] || '';
                  }
                } catch (error) {
                  console.error(`Error updating ${field} input:`, error);
                }
              });
            } else {
              console.warn(`Elements for field ${field} not found`);
            }
          });
        
          // Ensure fields update when moving records
          try {
            updateCertificateDetails();
          } catch (error) {
            console.error('Error updating certificate details:', error);
          }
        }
      } catch (csvPanelError) {
        console.error('Error creating CSV panel:', csvPanelError);
        alert(`Error creating CSV panel: ${csvPanelError.message}`);
      }
    }
  } catch (error) {
    console.error('Fatal error in openModal function:', {
      message: error.message,
      stack: error.stack,
      buttonId: buttonId
    });
    alert(`A critical error occurred: ${error.message}`);
  }
}

// Close Modal
export function closeModal() {
  try {
    const modal = document.getElementById('modal');
    if (modal) {
      modal.style.display = 'none';
      console.log('Modal closed successfully');
    } else {
      console.warn('Modal element not found when attempting to close');
    }
  } catch (error) {
    console.error('Error closing modal:', {
      message: error.message,
      stack: error.stack
    });
  }
}

function createVerificationChoiceModalContent() {
  return `
    <p class="text-lg font-semibold">Select verification method:</p>
    <label class="block mt-2"><input type="radio" name="verificationType" value="link" checked> Add Link</label>
    <label class="block"><input type="radio" name="verificationType" value="qr"> Add QR Code</label>
    <label class="block"><input type="radio" name="verificationType" value="both"> Both</label>
    <button id="applyButton" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Apply</button>
  `;
}