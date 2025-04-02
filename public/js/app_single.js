import { initExportImport } from './modules/exportImport.js';
import { initZoom } from './modules/zoom.js';
import { initSavePrint } from './modules/savePrint.js';

document.addEventListener('DOMContentLoaded', () => {
    function resetZoom() {
        document.body.style.zoom = '100%';
    }

    // Add event listeners to detect zoom changes
    window.addEventListener('resize', resetZoom);
    window.addEventListener('mousewheel', resetZoom);
    window.addEventListener('DOMMouseScroll', resetZoom); // For Firefox
 
    initExportImport('exportTemplateButton', 'importTemplateButton', 'certificate');
    initZoom('certificate', 'mainContent');
    initSavePrint('saveBtn', 'printBtn', 'certificate', 'certificate.pdf'); 
    
});
document.getElementById('dark-mode-toggle').addEventListener('click', function() {
    document.documentElement.classList.toggle('dark', !document.documentElement.classList.contains('dark'));
});