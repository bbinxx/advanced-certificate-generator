export class CertificateError extends Error {
    constructor(message, code, origin = null) {
        super(message);
        this.name = 'CertificateError';
        this.code = code;
        this.origin = origin;
        this.timestamp = new Date();
    }
}

export const ErrorCodes = {
    CANVAS: {
        INIT_FAILED: 'CANVAS_INIT_FAILED',
        RENDER_FAILED: 'CANVAS_RENDER_FAILED',
        ELEMENT_ADD_FAILED: 'CANVAS_ELEMENT_ADD_FAILED'
    },
    FILE: {
        LOAD_FAILED: 'FILE_LOAD_FAILED',
        SAVE_FAILED: 'FILE_SAVE_FAILED',
        INVALID_FORMAT: 'FILE_INVALID_FORMAT'
    },
    CSV: {
        PARSE_ERROR: 'CSV_PARSE_ERROR',
        INVALID_DATA: 'CSV_INVALID_DATA',
        MAPPING_ERROR: 'CSV_MAPPING_ERROR'
    }
};

export function handleError(error, context = '') {
    console.error(`[${new Date().toISOString()}] ${context}:`, error);
    
    if (error instanceof CertificateError) {
        showErrorMessage(error.message);
        // Log to error tracking system if needed
        return;
    }

    // Handle unexpected errors
    const genericError = new CertificateError(
        'An unexpected error occurred. Please try again.',
        'UNKNOWN_ERROR',
        error
    );
    showErrorMessage(genericError.message);
}

export function showErrorMessage(message) {
    // Create error toast/notification
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
        <div class="error-content">
            <span class="error-icon">⚠️</span>
            <span class="error-message">${message}</span>
            <button class="error-close">×</button>
        </div>
    `;

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);

    // Allow manual close
    toast.querySelector('.error-close').onclick = () => toast.remove();
}