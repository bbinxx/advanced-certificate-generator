// errorHandling.js - Centralized error handling with fixes

/**
 * Central error logging and handling system
 */
export const ErrorHandler = {
    // Error levels for different severities
    LEVELS: {
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error',
      FATAL: 'fatal'
    },
  
    // Keep track of errors for debugging
    errorLog: [],
    
    // Error messages that are shown to users
    activeUserErrors: new Set(),
    
    // Error notification element reference
    errorContainer: null,
    
    /**
     * Initialize the error handler
     * @returns {HTMLElement} - The error container element
     */
    init() {
      // Check if already initialized
      if (this.errorContainer) {
        return this.errorContainer;
      }

      try {
        this.errorContainer = document.createElement('div');
        this.errorContainer.className = 'error-container';
        this.errorContainer.style.position = 'fixed';
        this.errorContainer.style.top = '10px';
        this.errorContainer.style.right = '10px';
        this.errorContainer.style.zIndex = '9999';
        
        // Make sure document.body exists before appending
        if (document.body) {
          document.body.appendChild(this.errorContainer);
        } else {
          // If body doesn't exist yet, wait for DOM to be ready
          document.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(this.errorContainer);
          });
        }
        
        // Set up global error handler
        window.addEventListener('error', (event) => {
          this.handleError(event.error, 'Unhandled error', this.LEVELS.ERROR);
          event.preventDefault();
          return true;
        });
        
        // Handle promise rejections
        window.addEventListener('unhandledrejection', (event) => {
          this.handleError(event.reason, 'Unhandled promise rejection', this.LEVELS.ERROR);
          event.preventDefault();
          return true;
        });

        return this.errorContainer;
      } catch (initError) {
        console.error('Failed to initialize error handler:', initError);
        return null;
      }
    },
    
    /**
     * Ensure the error container is initialized
     */
    ensureInitialized() {
      if (!this.errorContainer) {
        this.init();
      }
    },
    
    /**
     * Handle an error with consistent logging and user feedback
     * @param {Error} error - Error object
     * @param {string} context - Description of where the error occurred
     * @param {string} level - Error severity level
     * @param {boolean} showToUser - Whether to display the error to the user
     * @returns {Error} - The error for chaining
     */
    handleError(error, context = '', level = 'error', showToUser = true) {
      try {
        // Ensure error handler is initialized
        this.ensureInitialized();
        
        // Create error entry
        const errorEntry = {
          timestamp: new Date(),
          error: error instanceof Error ? error : new Error(String(error)),
          context,
          level,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : new Error().stack,
        };
        
        // Log the error for debugging
        this.errorLog.push(errorEntry);
        
        // Console logging
        const logMethod = level === this.LEVELS.FATAL || level === this.LEVELS.ERROR ? 'error' : 
                          level === this.LEVELS.WARNING ? 'warn' : 'log';
        
        console[logMethod](`[${context}]`, errorEntry.message, error);
        
        // Display to user if required
        if (showToUser) {
          this.showUserError(errorEntry);
        }
        
        return errorEntry.error;
      } catch (handlerError) {
        // Fallback error handling if our handler fails
        console.error('Error handler failed:', handlerError, 'Original error:', error);
        return error instanceof Error ? error : new Error(String(error));
      }
    },
    
    /**
     * Display error to user in UI
     * @param {object} errorEntry - Error entry from handleError
     */
    showUserError(errorEntry) {
      try {
        // Ensure error handler is initialized
        this.ensureInitialized();
        
        // Safety check - if we still don't have an error container, log and exit
        if (!this.errorContainer) {
          console.error('Cannot show user error - error container not available');
          return;
        }
        
        const errorId = Date.now() + Math.random().toString(36).substring(2, 9);
        const userMessage = this.getUserFriendlyMessage(errorEntry);
        
        // Don't show duplicate error messages
        if (this.activeUserErrors.has(userMessage)) {
          return;
        }
        
        this.activeUserErrors.add(userMessage);
        
        // Create error notification
        const notification = document.createElement('div');
        notification.id = `error-${errorId}`;
        notification.className = `notification notification-${errorEntry.level}`;
        notification.style.backgroundColor = errorEntry.level === this.LEVELS.ERROR || errorEntry.level === this.LEVELS.FATAL ? '#f44336' : 
                                            errorEntry.level === this.LEVELS.WARNING ? '#ff9800' : '#2196F3';
        notification.style.color = 'white';
        notification.style.padding = '12px';
        notification.style.marginBottom = '10px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        notification.style.position = 'relative';
        notification.style.maxWidth = '300px';
        
        // Close button
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '5px';
        closeBtn.style.right = '5px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '18px';
        
        closeBtn.onclick = () => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
            this.activeUserErrors.delete(userMessage);
          }
        };
        
        notification.textContent = userMessage;
        notification.appendChild(closeBtn);
        this.errorContainer.appendChild(notification);
        
        // Auto-hide after 5 seconds for non-critical errors
        if (errorEntry.level !== this.LEVELS.ERROR && errorEntry.level !== this.LEVELS.FATAL) {
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
              this.activeUserErrors.delete(userMessage);
            }
          }, 5000);
        }
      } catch (showError) {
        console.error('Failed to show error notification:', showError);
      }
    },
    
    /**
     * Generate user-friendly error messages
     * @param {object} errorEntry - Error entry
     * @returns {string} - User-friendly message
     */
    getUserFriendlyMessage(errorEntry) {
      try {
        // Map technical errors to user-friendly messages
        const errorMap = {
          'TypeError': 'A type error occurred',
          'ReferenceError': 'A reference error occurred',
          'SyntaxError': 'A syntax error occurred',
          'RangeError': 'A range error occurred',
          'NetworkError': 'A network error occurred',
          'ImageError': 'Could not load the image',
          'CanvasError': 'Error rendering the canvas',
          'FileError': 'Error processing the file',
          'StorageError': 'Error with storage operations',
          'FormatError': 'Invalid data format'
        };
        
        // Specific error messages based on context
        const contextMap = {
          'addText': 'Error adding text to the canvas',
          'addImage': 'Error adding image to the canvas',
          'addShape': 'Error adding shape to the canvas',
          'deleteElement': 'Error deleting element',
          'saveState': 'Error saving the current state',
          'loadState': 'Error loading saved state',
          'canvasInitialization': 'Error initializing the canvas',
          'textFormatting': 'Error applying text formatting',
          'alignElement': 'Error aligning element',
          'backgroundChange': 'Error changing background',
          'exportError': 'Error exporting your design',
          'applicationStartup': 'Error starting the application'
        };
        
        // Get the context-specific message or use generic one
        const contextMessage = contextMap[errorEntry.context] || 
                              `Error in ${errorEntry.context || 'application'}`;
        
        // Get error type message if available
        const errorType = errorEntry.error.name;
        const typeMessage = errorMap[errorType] || '';
        
        // For Fatal errors, be more direct
        if (errorEntry.level === this.LEVELS.FATAL) {
          return `Critical Error: ${contextMessage}. Please reload the application.`;
        }
        
        return `${contextMessage}${typeMessage ? ': ' + typeMessage : ''}`;
      } catch (messageError) {
        return 'An error occurred';
      }
    },
    
    /**
     * Clear all displayed error notifications
     */
    clearAllErrors() {
      try {
        if (this.errorContainer) {
          this.errorContainer.innerHTML = '';
          this.activeUserErrors.clear();
        }
      } catch (clearError) {
        console.error('Failed to clear errors:', clearError);
      }
    },

    /**
     * Attempt to recover from an error
     * @param {Error} error - Error to recover from
     * @param {string} context - Error context
     * @returns {boolean} - Whether recovery was successful
     */
    attemptRecovery(error, context) {
        try {
            switch (context) {
                case 'canvasInitialization':
                    return this.recoverCanvas();
                case 'saveState':
                    return this.recoverState();
                case 'imageLoad':
                    return this.recoverImageLoad();
                default:
                    return false;
            }
        } catch (recoveryError) {
            console.error('Recovery failed:', recoveryError);
            return false;
        }
    },

    /**
     * Retry a failed operation
     * @param {Function} operation - Operation to retry
     * @param {number} maxAttempts - Maximum number of retry attempts
     * @param {number} delay - Delay between attempts in milliseconds
     * @returns {Promise} - Result of operation
     */
    async retryOperation(operation, maxAttempts = 3, delay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (attempt < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    },

    /**
     * Recover canvas state
     * @returns {boolean} - Whether recovery was successful
     */
    recoverCanvas() {
        try {
            const canvas = document.getElementById('fabricCanvas');
            if (canvas) {
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    },
    
    /**
     * Recover state (placeholder implementation)
     * @returns {boolean} - Whether recovery was successful
     */
    recoverState() {
        // Implementation for state recovery
        return false;
    },
    
    /**
     * Recover from image load failure (placeholder implementation)
     * @returns {boolean} - Whether recovery was successful
     */
    recoverImageLoad() {
        // Implementation for image load recovery
        return false;
    }
  };
  
  /**
   * Wraps a function with error handling
   * @param {Function} fn - Function to wrap
   * @param {string} context - Error context description
   * @param {boolean} showToUser - Whether to display errors to the user
   * @returns {Function} - Wrapped function with error handling
   */
  export function withErrorHandling(fn, context, showToUser = true) {
    return function(...args) {
      try {
        return fn.apply(this, args);
      } catch (error) {
        ErrorHandler.handleError(error, context, ErrorHandler.LEVELS.ERROR, showToUser);
        return null;
      }
    };
  }
  
  /**
   * Wraps an async function with error handling
   * @param {Function} fn - Async function to wrap
   * @param {string} context - Error context description
   * @param {boolean} showToUser - Whether to display errors to the user
   * @returns {Function} - Wrapped async function with error handling
   */
  export function withAsyncErrorHandling(fn, context, showToUser = true) {
    return async function(...args) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        ErrorHandler.handleError(error, context, ErrorHandler.LEVELS.ERROR, showToUser);
        return null;
      }
    };
  }
  
  /**
   * Data validation helper
   * @param {*} value - Value to validate
   * @param {string} type - Expected type
   * @param {string} name - Parameter name for error message
   * @param {boolean} required - Whether the value is required
   * @returns {boolean} - True if valid
   * @throws {Error} - If validation fails
   */
  export function validateParam(value, type, name, required = true) {
    // Check if required
    if (required && (value === undefined || value === null)) {
        throw new Error(`Parameter '${name}' is required but was ${value === undefined ? 'undefined' : 'null'}`);
    }
    
    // Skip type checking if not required and value is null/undefined
    if (!required && (value === undefined || value === null)) {
        return true;
    }
    
    // Type checking
    switch (type) {
        case 'string':
            if (typeof value !== 'string') {
                throw new TypeError(`Parameter '${name}' must be a string`);
            }
            break;
        case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
                throw new TypeError(`Parameter '${name}' must be a number`);
            }
            break;
        case 'boolean':
            if (typeof value !== 'boolean') {
                throw new TypeError(`Parameter '${name}' must be a boolean`);
            }
            break;
        case 'function':
            if (typeof value !== 'function') {
                throw new TypeError(`Parameter '${name}' must be a function`);
            }
            break;
        case 'object':
            if (typeof value !== 'object' || value === null) {
                throw new TypeError(`Parameter '${name}' must be an object`);
            }
            break;
        case 'array':
            if (!Array.isArray(value)) {
                throw new TypeError(`Parameter '${name}' must be an array`);
            }
            break;
        case 'fabricObject':
            if (!value || typeof value !== 'object' || !value.canvas || typeof value.set !== 'function') {
                throw new TypeError(`Parameter '${name}' must be a valid fabric.js canvas object with 'set' method and 'canvas' property`);
            }
            break;
        case 'element':
            if (!(value instanceof HTMLElement)) {
                throw new TypeError(`Parameter '${name}' must be an HTML element`);
            }
            break;
    }
    
    return true;
  }

// Export a function to explicitly initialize the error handler early in app startup
export function initializeErrorHandling() {
  ErrorHandler.init();
  console.log('Error handling system initialized');
}