import { AppState } from '../main.js';
import { ErrorHandler } from './errorHandler.js';
import { listAllShortcuts, testShortcut } from './modules/shortcuts.js';

export function initializeShortcuts() {
  const shortcuts = {
    'ctrl+s': {
      action: saveDesign,
      description: 'Save design'
    },
    'ctrl+z': {
      action: undo,
      description: 'Undo'
    },
    'ctrl+y': {
      action: redo,
      description: 'Redo'
    },
    'ctrl+b': {
      action: () => formatText('bold'),
      description: 'Toggle bold'
    },
    'ctrl+i': {
      action: () => formatText('italic'),
      description: 'Toggle italic'
    },
    'ctrl+u': {
      action: () => formatText('underline'),
      description: 'Toggle underline'
    },
    'delete': {
      action: deleteSelectedElement,
      description: 'Delete selected element'
    },
    'backspace': {
      action: deleteSelectedElement,
      description: 'Delete selected element'
    },
    'escape': {
      action: closeActiveModal,
      description: 'Close active modal'
    }
  };

  document.addEventListener('keydown', (e) => {
    try {
      // Check if app is ready
      if (!AppState.ready) return;

      // Check if user is typing in an input field
      if (isInputField(e.target)) return;

      const key = generateKeyString(e);
      const shortcut = shortcuts[key];

      if (shortcut) {
        e.preventDefault();
        e.stopPropagation();
        shortcut.action();
      }
    } catch (error) {
      ErrorHandler.handle(error);
    }
  });
}

function isInputField(element) {
  return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
}

function generateKeyString(e) {
  return `${e.ctrlKey ? 'ctrl+' : ''}${e.key.toLowerCase()}`;
}

// Add these functions to help with debugging
export function listAllShortcuts() {
  console.table(
    Object.entries(shortcuts).map(([key, { description }]) => ({
      Shortcut: key,
      Description: description
    }))
  );
}

export function testShortcut(shortcutKey) {
  if (shortcuts[shortcutKey]) {
    console.log(`Testing shortcut: ${shortcutKey}`);
    shortcuts[shortcutKey].action();
  } else {
    console.warn(`Shortcut '${shortcutKey}' not found`);
  }
}

listAllShortcuts(); // Shows all available shortcuts
testShortcut('ctrl+b'); // Tests a specific shortcut