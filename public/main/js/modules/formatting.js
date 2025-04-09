//formatting.js
let selectedElement = null;

const fontList = [
    'Arial',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Georgia',
    'Palatino',
    'Garamond',
    'Bookman',
    'Comic Sans MS',
    'Trebuchet MS',
    'Arial Black',
    'Impact'
];

export function initFormatting(divName, buttonClass) {
    // Select the specified div
    const parentDiv = document.querySelector(divName);

    if (!parentDiv) {
        console.error(`Div with name ${divName} not found.`);
        return;
    }

    // Add an event listener for focus events within the specified div
    parentDiv.addEventListener('focus', (event) => {
        // Get the target element that gained focus
        const focusedElement = event.target;

        // Log the details of the focused element
        console.log('Focused Element:', focusedElement);

        // Store the selected element in the selectedElement variable
        selectedElement = focusedElement;

        // Check the type of the focused element and apply formatting
        if (isTextElement(focusedElement)) {
            // Do not set default alignment here
        } else if (isImageElement(focusedElement)) {
            applyImageFormatting(focusedElement, parentDiv);
        }
    }, true); // Use capture phase to ensure the event is caught

    // Populate the font family select element
    const fontFamilySelect = document.querySelector(`select[data-action="fontFamily"]`);
    if (fontFamilySelect) {
        fontList.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font;
            option.style.fontFamily = font;
            fontFamilySelect.appendChild(option);
        });
    } else {
        console.error('Font family select element not found.');
    }

    // Add event listeners for font size increment and decrement buttons
    const incrementButton = document.querySelector(`.${buttonClass}[data-action="incrementFontSize"]`);
    const decrementButton = document.querySelector(`.${buttonClass}[data-action="decrementFontSize"]`);

    if (incrementButton) {
        incrementButton.addEventListener('click', () => {
            if (selectedElement && isTextElement(selectedElement)) {
                const currentSize = parseFloat(window.getComputedStyle(selectedElement).fontSize);
                selectedElement.style.fontSize = `${currentSize + 2}px`;
            }
        });
    } else {
        console.error('Increment font size button not found.');
    }

    if (decrementButton) {
        decrementButton.addEventListener('click', () => {
            if (selectedElement && isTextElement(selectedElement)) {
                const currentSize = parseFloat(window.getComputedStyle(selectedElement).fontSize);
                selectedElement.style.fontSize = `${currentSize - 2}px`;
            }
        });
    } else {
        console.error('Decrement font size button not found.');
    }
}

function isTextElement(element) {
    return element.tagName === 'P' || element.tagName === 'SPAN' || element.tagName === 'DIV' || element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
}

function isImageElement(element) {
    return element.tagName === 'IMG';
}

function applyImageFormatting(element, parentDiv) {
    // Example image formatting functions
    console.log('Applying image formatting to:', element);
    // You can add more image formatting functions here
    // For example, aligning image with respect to the parent div
    element.style.display = 'block'; // Ensure the image is a block element
    element.style.margin = '0 auto'; // Center align image within the parent div
}

export function getSelectedElement() {
    return selectedElement;
}

export function addButtonListeners(buttonClass) {
    const buttons = document.querySelectorAll(`.${buttonClass}`);
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            if (selectedElement && isTextElement(selectedElement)) {
                applyButtonAction(button.dataset.action, selectedElement);
            }
        });
    });

    // Add event listeners for select and input elements
    const selects = document.querySelectorAll(`select.${buttonClass}`);
    selects.forEach(select => {
        select.addEventListener('change', () => {
            if (selectedElement && isTextElement(selectedElement)) {
                applyButtonAction(select.dataset.action, selectedElement, select.value);
            }
        });
    });

    const inputs = document.querySelectorAll(`input.${buttonClass}`);
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            if (selectedElement && isTextElement(selectedElement)) {
                applyButtonAction(input.dataset.action, selectedElement, input.value);
            }
        });
    });
}

function applyButtonAction(action, element, value = null) {
    try {
        switch (action) {
            case 'fontSize':
                element.style.fontSize = value;
                break;
            case 'fontStyle':
                element.style.fontStyle = element.style.fontStyle === 'italic' ? 'normal' : 'italic';
                break;
            case 'fontColor':
                element.style.color = value;
                break;
            case 'fontFamily':
                element.style.fontFamily = value;
                break;
            case 'textAlignLeft':
                element.style.textAlign = 'left';
                break;
            case 'textAlignCenter':
                element.style.textAlign = 'center';
                break;
            case 'textAlignRight':
                element.style.textAlign = 'right';
                break;
            case 'subscript':
                element.style.verticalAlign = element.style.verticalAlign === 'sub' ? 'baseline' : 'sub';
                break;
            case 'strikeThrough':
                element.style.textDecoration = element.style.textDecoration.includes('line-through')
                    ? element.style.textDecoration.replace('line-through', '').trim()
                    : `${element.style.textDecoration} line-through`.trim();
                break;
            case 'underline':
                element.style.textDecoration = element.style.textDecoration.includes('underline')
                    ? element.style.textDecoration.replace('underline', '').trim()
                    : `${element.style.textDecoration} underline`.trim();
                break;
            case 'bold':
                element.style.fontWeight = element.style.fontWeight === 'bold' ? 'normal' : 'bold';
                break;
            case 'incrementFontSize':
                const currentSize = parseFloat(window.getComputedStyle(element).fontSize);
                element.style.fontSize = `${currentSize + 2}px`;
                break;
            case 'decrementFontSize':
                const currentSizeDec = parseFloat(window.getComputedStyle(element).fontSize);
                element.style.fontSize = `${currentSizeDec - 2}px`;
                break;
            default:
                console.error('Unknown action:', action);
        }
    } catch (error) {
        console.error('Error applying action:', action, error);
    }
}
