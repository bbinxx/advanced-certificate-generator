// textFormatting.js
import { saveState } from './stateManagement.js';
import { selectedElement } from './elementManagement.js';
import { googleFonts } from './fontList.js';
import { canvas } from './canvasManagement.js';

function setTextProperty(property, value) {
    if (!selectedElement) return;
    if (selectedElement.type !== 'i-text' && selectedElement.type !== 'text') return;

    selectedElement.set(property, value);
    canvas.renderAll(); // Re-render the canvas
    saveState();
}

export function formatText(style) {
    if (!selectedElement) return;
    if (selectedElement.type !== 'i-text' && selectedElement.type !== 'text') return;

    switch (style) {
        case 'bold':
            setTextProperty('fontWeight', selectedElement.fontWeight === 'bold' ? 'normal' : 'bold');
            break;
        case 'italic':
            setTextProperty('fontStyle', selectedElement.fontStyle === 'italic' ? 'normal' : 'italic');
            break;
        case 'underline':
            setTextProperty('textDecoration', selectedElement.textDecoration === 'underline' ? 'none' : 'underline');
            break;
        default:
            break;
    }
}

export function changeFont() {
    const fontFamily = document.getElementById('fontFamily').value;
    setTextProperty('fontFamily', fontFamily);
}

export function changeTextColor() {
    const textColor = document.getElementById('textColor').value;
    setTextProperty('fill', textColor);
}

export function changeFontSize() {
    const fontSize = document.getElementById('fontSize').value;
    setTextProperty('fontSize', fontSize);
}

let fontsLoaded = false;

export function populateFonts() {
    if (fontsLoaded) return;

    const fontFamilySelect = document.getElementById('fontFamily');
    if (!fontFamilySelect) {
        console.error('Font family select element not found.');
        return;
    }

    const fontsLink = document.createElement('link');
    fontsLink.rel = 'stylesheet';
    fontsLink.href = `https://fonts.googleapis.com/css2?family=${googleFonts.map(font => `${font.replace(/ /g, '+')}:wght@400;700`).join('&family=')}&display=swap`;

    fontsLink.onload = () => {
        googleFonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font;
            option.classList.add('font-option');
            fontFamilySelect.appendChild(option);
        });

        fontsLoaded = true;
    };

    fontsLink.onerror = () => {
        console.error('Failed to load Google Fonts.');
    };

    document.head.appendChild(fontsLink);
}

// Add event listeners for real-time updates
document.addEventListener('DOMContentLoaded', () => {
    const textColorInput = document.getElementById('textColor');
    const fontSizeInput = document.getElementById('fontSize');

    if (textColorInput) {
        textColorInput.addEventListener('input', changeTextColor);
    }

    if (fontSizeInput) {
        fontSizeInput.addEventListener('input', changeFontSize);
    }
});