import { canvas } from './canvasManagement.js';
import { googleFonts } from './fontList.js';
import { ErrorHandler, withErrorHandling } from './errorHandling.js';

export class DynamicToolbar {
    static canvas = null;
    static toolbar = null;
    static textControls = null;
    static shapeControls = null;

    static init(canvas) {
        this.canvas = canvas;
        this.toolbar = document.getElementById('dynamicToolbar');
        this.textControls = document.getElementById('textFormatControls');
        this.shapeControls = document.getElementById('shapeFormatControls');

        if (!this.toolbar || !this.textControls || !this.shapeControls) {
            console.error('Dynamic toolbar elements not found');
            return;
        }

        this.setupFontList();
        this.setupEventListeners();
        console.log('Dynamic toolbar initialized'); // Debug log
    }

    static setupFontList() {
        const fontSelect = document.getElementById('dynFontFamily');
        googleFonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font;
            option.style.fontFamily = font;
            fontSelect.appendChild(option);
        });
    }

    static show(obj) {
        if (!obj || !this.toolbar) return;
        
        console.log('Showing toolbar for object type:', obj.type); // Debug log

        this.toolbar.classList.remove('hidden');
        
        if (obj.type === 'text' || obj.type === 'i-text') {
            this.showTextControls(obj);
        } else if (['rect', 'circle', 'line'].includes(obj.type)) {
            this.showShapeControls(obj);
        }
    }

    static hide() {
        if (!this.toolbar) return;
        
        this.toolbar.classList.add('hidden');
        this.textControls?.classList.add('hidden');
        this.shapeControls?.classList.add('hidden');
    }

    static showTextControls(textObj) {
        this.textControls.classList.remove('hidden');
        this.shapeControls.classList.add('hidden');

        // Update controls to match selected object
        document.getElementById('dynFontFamily').value = textObj.fontFamily || '';
        document.getElementById('dynTextColor').value = textObj.fill || '#000000';
        document.getElementById('dynFontSize').value = textObj.fontSize || 16;
        
        document.getElementById('dynBoldBtn').classList.toggle('active', textObj.fontWeight === 'bold');
        document.getElementById('dynItalicBtn').classList.toggle('active', textObj.fontStyle === 'italic');
        document.getElementById('dynUnderlineBtn').classList.toggle('active', textObj.textDecoration === 'underline');
    }

    static showShapeControls(shapeObj) {
        this.textControls.classList.add('hidden');
        this.shapeControls.classList.remove('hidden');

        document.getElementById('dynFillColor').value = shapeObj.fill || '#000000';
        document.getElementById('dynStrokeColor').value = shapeObj.stroke || '#000000';
        document.getElementById('dynStrokeWidth').value = shapeObj.strokeWidth || 1;
    }

    static setupEventListeners() {
        // Text formatting
        document.getElementById('dynBoldBtn')?.addEventListener('click', () => this.formatText('bold'));
        document.getElementById('dynItalicBtn')?.addEventListener('click', () => this.formatText('italic'));
        document.getElementById('dynUnderlineBtn')?.addEventListener('click', () => this.formatText('underline'));
        document.getElementById('dynFontFamily')?.addEventListener('change', (e) => this.updateTextProperty('fontFamily', e.target.value));
        document.getElementById('dynTextColor')?.addEventListener('change', (e) => this.updateTextProperty('fill', e.target.value));
        document.getElementById('dynFontSize')?.addEventListener('change', (e) => this.updateTextProperty('fontSize', parseInt(e.target.value)));

        // Shape formatting
        document.getElementById('dynFillColor')?.addEventListener('change', (e) => this.updateShapeProperty('fill', e.target.value));
        document.getElementById('dynStrokeColor')?.addEventListener('change', (e) => this.updateShapeProperty('stroke', e.target.value));
        document.getElementById('dynStrokeWidth')?.addEventListener('change', (e) => this.updateShapeProperty('strokeWidth', parseInt(e.target.value)));
    }

    static formatText(style) {
        const obj = this.canvas.getActiveObject();
        if (!obj) return;

        switch (style) {
            case 'bold':
                obj.set('fontWeight', obj.fontWeight === 'bold' ? 'normal' : 'bold');
                break;
            case 'italic':
                obj.set('fontStyle', obj.fontStyle === 'italic' ? 'normal' : 'italic');
                break;
            case 'underline':
                obj.set('textDecoration', obj.textDecoration === 'underline' ? '' : 'underline');
                break;
        }
        this.canvas.renderAll();
    }

    static updateTextProperty(property, value) {
        const obj = this.canvas.getActiveObject();
        if (!obj) return;
        
        obj.set(property, value);
        this.canvas.renderAll();
    }

    static updateShapeProperty(property, value) {
        const obj = this.canvas.getActiveObject();
        if (!obj) return;
        
        obj.set(property, value);
        this.canvas.renderAll();
    }
}