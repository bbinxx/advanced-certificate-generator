import { ErrorHandler } from './errorHandling.js';
import { AppState } from '../main.js';
import { addText, addShape } from './elementManagement.js';
import { changeBackground } from './background.js';

export const TemplateManager = {
  templates: [],

  async loadTemplates() {
    try {
      // First try to load templates from localStorage
      const savedTemplates = localStorage.getItem('templates');
      if (savedTemplates) {
        try {
          AppState.templates = JSON.parse(savedTemplates);
        } catch (parseError) {
          console.warn('Error parsing templates from localStorage:', parseError);
          localStorage.removeItem('templates'); // Remove invalid data
        }
      } else {
        AppState.templates = []; // Initialize if no templates in localStorage
      }

      try {
        const response = await fetch('/api/templates');
        const serverTemplates = await response.json();
        AppState.templates = [...AppState.templates, ...serverTemplates];
      } catch (serverError) {
        console.warn('Could not load templates from server:', serverError);
      }

      this.renderTemplateGallery();
      this.updateTemplateSelector();
    } catch (error) {
      ErrorHandler.handleError(error, 'templateLoading');
    }
  },

  renderTemplateGallery() {
    const gallery = document.getElementById('template-gallery');
    if (!gallery) return;

    gallery.innerHTML = AppState.templates.map(template => `
      <div class="group relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
        <img src="${template.thumbnail || 'default_thumbnail_url'}" alt="${template.name}" class="w-full h-48 object-cover">
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
          <button 
            onclick="TemplateManager.loadTemplate('${template.id}')"
            class="bg-white text-gray-800 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
          >
            Use Template
          </button>
        </div>
      </div>
    `).join('');
  },

  async loadTemplate(templateId) {
    try {
      const template = AppState.templates.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      if (!AppState.canvas) {
        throw new Error('Canvas not initialized');
      }

      AppState.canvas.loadFromJSON(template.canvasState, () => {
        AppState.canvas.renderAll();
        console.log('Template loaded successfully');
      });
    } catch (error) {
      ErrorHandler.handleError(error, 'loadTemplate');
    }
  },

  async applyTemplateToCanvas(template) {
    try {
      // Apply template settings to canvas
      if (template.background) {
        await changeBackground(template.background);
      }
      if (template.elements) {
        for (const element of template.elements) {
          await this.addElementToCanvas(element);
        }
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'applyTemplate');
    }
  },

  async addElementToCanvas(element) {
    try {
      switch (element.type) {
        case 'text':
          await addText(element.tag, element.text, element.properties);
          break;
        case 'image':
          await addImageInput(element.properties);
          break;
        case 'shape':
          await addShape(element.shapeType, element.properties);
          break;
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'addElement');
    }
  },

  updateTemplateSelector() {
    const selector = document.getElementById('templateSelector');
    if (!selector) return;

    selector.innerHTML = `
      <option value="">Select a template...</option>
      ${AppState.templates.map(template => `
        <option value="${template.id}">${template.name}</option>
      `).join('')}
    `;
  },

  async saveTemplate() {
    try {
      if (!AppState.canvas) {
        throw new Error('Canvas not initialized');
      }

      const templateData = {
        id: `template_${Date.now()}`,
        name: prompt('Enter template name:') || 'Untitled Template',
        timestamp: Date.now(),
        canvasState: AppState.canvas.toJSON(['id', 'name', 'type', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'angle', 'fill', 'fontFamily', 'fontSize', 'text', 'src'])
      };

      // Save to localStorage
      const templates = JSON.parse(localStorage.getItem('templates') || '[]');
      templates.push(templateData);
      localStorage.setItem('templates', JSON.stringify(templates));

      // Update AppState
      AppState.templates.push(templateData);
      
      // Update UI
      this.updateTemplateSelector();
      
      return templateData;
    } catch (error) {
      ErrorHandler.handleError(error, 'saveTemplate');
      return null;
    }
  },

  exportTemplate() {
    try {
      const currentTemplate = {
        id: `template_${Date.now()}`,
        name: prompt('Enter template name:') || 'Exported Template',
        timestamp: Date.now(),
        canvasState: AppState.canvas.toJSON()
      };

      const blob = new Blob([JSON.stringify(currentTemplate)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentTemplate.name}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      ErrorHandler.handleError(error, 'exportTemplate');
    }
  },

  async importTemplate(file) {
    try {
      const text = await file.text();
      const template = JSON.parse(text);
      
      if (!template.canvasState) {
        throw new Error('Invalid template file format');
      }

      // Add to templates list
      AppState.templates.push(template);
      
      // Save to localStorage
      const templates = JSON.parse(localStorage.getItem('templates') || '[]');
      templates.push(template);
      localStorage.setItem('templates', JSON.stringify(templates));
      
      // Update UI
      this.updateTemplateSelector();
      
      // Load the template
      this.loadTemplate(template.id);
    } catch (error) {
      ErrorHandler.handleError(error, 'importTemplate');
    }
  }
};