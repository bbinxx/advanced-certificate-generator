// textFormatting.js
import { saveState } from './stateManagement.js';
import { selectedElement } from './elementManagement.js';
import { googleFonts } from './fontList.js';
import { canvas } from './canvasManagement.js';

// Track formatting state
const textState = {
  bold: false,
  italic: false,
  underline: false,
  fontFamily: 'Arial',
  fontSize: 16,
  textAlign: 'left',
  fill: '#000000'
};

// Core text property setter
function setTextProperty(property, value) {
  if (!selectedElement || !isTextObject(selectedElement)) return;
  
  selectedElement.set(property, value);
  canvas.renderAll();
  saveState();
  
  // Update state
  textState[property] = value;
}

// Text formatting functions
export function formatText(style) {
  if (!selectedElement || !isTextObject(selectedElement)) return;

  switch (style) {
    case 'bold':
      textState.bold = !textState.bold;
      setTextProperty('fontWeight', textState.bold ? 'bold' : 'normal');
      break;
      
    case 'italic':
      textState.italic = !textState.italic; 
      setTextProperty('fontStyle', textState.italic ? 'italic' : 'normal');
      break;
      
    case 'underline':
      textState.underline = !textState.underline;
      setTextProperty('textDecoration', textState.underline ? 'underline' : '');
      break;
  }
}

// Font family change handler
export function changeFont(fontFamily) {
  if (!fontFamily) return;
  textState.fontFamily = fontFamily;
  setTextProperty('fontFamily', fontFamily);
}

// Font size handler
export function changeFontSize(size) {
  if (!size || isNaN(size)) return;
  textState.fontSize = parseInt(size);
  setTextProperty('fontSize', textState.fontSize);
}

// Text color handler 
export function changeTextColor(color) {
  if (!color) return;
  textState.fill = color;
  setTextProperty('fill', color);
}

// Text alignment handler
export function setTextAlignment(alignment) {
  if (!alignment) return;
  textState.textAlign = alignment;
  setTextProperty('textAlign', alignment);
}

// Font loader
export function populateFonts() {
  const fontSelect = document.getElementById('fontFamily');
  if (!fontSelect || fontSelect.children.length > 0) return;

  // Load Google Fonts
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${googleFonts.map(f => 
    f.replace(/ /g, '+')).join('&family=')}&display=swap`;
  document.head.appendChild(link);

  // Populate select
  googleFonts.forEach(font => {
    const option = document.createElement('option');
    option.value = font;
    option.textContent = font;
    option.style.fontFamily = font;
    fontSelect.appendChild(option);
  });
}

// Helper function to check if object is text
function isTextObject(obj) {
  return obj && (obj.type === 'i-text' || obj.type === 'text');
}

// Initialize event listeners
export function initTextFormatting() {
  // Font controls
  document.getElementById('fontFamily')?.addEventListener('change', e => 
    changeFont(e.target.value));
  
  document.getElementById('fontSize')?.addEventListener('input', e =>
    changeFontSize(e.target.value));
    
  document.getElementById('textColor')?.addEventListener('input', e =>
    changeTextColor(e.target.value));

  // Style buttons
  document.getElementById('boldButton')?.addEventListener('click', () => 
    formatText('bold'));
    
  document.getElementById('italicButton')?.addEventListener('click', () =>
    formatText('italic')); 
    
  document.getElementById('underlineButton')?.addEventListener('click', () =>
    formatText('underline'));

  // Alignment buttons
  document.getElementById('alignLeftButton')?.addEventListener('click', () =>
    setTextAlignment('left'));
    
  document.getElementById('alignCenterButton')?.addEventListener('click', () =>
    setTextAlignment('center'));
    
  document.getElementById('alignRightButton')?.addEventListener('click', () =>
    setTextAlignment('right'));
}