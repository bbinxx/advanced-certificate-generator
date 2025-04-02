import { ErrorHandler } from './errorHandling.js';
// Removed unused AppState import

export function initializeSidebar() {
    try {
        const sidebarItems = document.querySelectorAll('.sidebar li');
        let activeItem = null;

        // Close panels when clicking outside
        document.addEventListener('click', (event) => {
            const isClickInsideSidebar = event.target.closest('.sidebar li, .floating-panel');
            if (!isClickInsideSidebar && activeItem) {
                activeItem.classList.remove('active');
                const panel = activeItem.querySelector('.floating-panel');
                if (panel) {
                    panel.style.display = 'none';
                }
                activeItem = null;
            }
        });

        // Handle sidebar item clicks
        sidebarItems.forEach(item => {
            item.addEventListener('click', (event) => {
                event.stopPropagation();

                // If clicking the same item, close it
                if (activeItem === item) {
                    item.classList.remove('active');
                    const panel = item.querySelector('.floating-panel');
                    if (panel) {
                        panel.style.display = 'none';
                    }
                    activeItem = null;
                    return;
                }

                // Close previously active item
                if (activeItem) {
                    activeItem.classList.remove('active');
                    const previousPanel = activeItem.querySelector('.floating-panel');
                    if (previousPanel) {
                        previousPanel.style.display = 'none';
                    }
                }

                // Open clicked item
                item.classList.add('active');
                const panel = item.querySelector('.floating-panel');
                if (panel) {
                    panel.style.display = 'block';
                    positionPanel(panel, item);
                }
                activeItem = item;
            });
        });

        // Prevent panel clicks from closing
        const panels = document.querySelectorAll('.floating-panel');
        panels.forEach(panel => {
            panel.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        });

    } catch (error) {
        ErrorHandler.handleError(error, 'initializeSidebar');
    }
}

function positionPanel(panel, item) {
    const itemRect = item.getBoundingClientRect();
    const sidebarRect = item.closest('.sidebar').getBoundingClientRect();
    
    panel.style.position = 'fixed';
    panel.style.left = `${sidebarRect.right + 10}px`;
    panel.style.top = `${itemRect.top}px`;
    // Check for horizontal overflow
    const panelRight = sidebarRect.right + 10 + panel.offsetWidth;
    const windowWidth = window.innerWidth;
    if (panelRight > windowWidth) {
        panel.style.left = `${windowWidth - panel.offsetWidth - 10}px`;
    }

    // Check for vertical overflow
    const panelBottom = itemRect.top + panel.offsetHeight;
    const windowHeight = window.innerHeight;
    if (panelBottom > windowHeight) {
        panel.style.top = `${windowHeight - panel.offsetHeight - 10}px`;
    }
}