class ErrorHandler {
    constructor() {
        this.errorContainer = document.getElementById('error');
        this.errorMessageElement = document.getElementById('errorMessage');
        this.errorTimeout = null;
    }

    /**
     * Show an error message to the user
     * @param {string} message - The error message to display
     * @param {number} duration - How long to show the message (in ms)
     * @param {'error'|'warning'|'info'} type - The type of message
     */
    showMessage(message, duration = 5000, type = 'error') {
        if (!this.errorContainer || !this.errorMessageElement) {
            console.error('Error container elements not found');
            return;
        }

        // Clear any existing timeout
        if (this.errorTimeout) {
            clearTimeout(this.errorTimeout);
        }

        // Update message and styling
        this.errorMessageElement.textContent = message;
        this.errorContainer.className = `alert alert-${type} alert-dismissible fade show`;
        this.errorContainer.style.display = 'block';

        // Auto-hide after duration
        this.errorTimeout = setTimeout(() => {
            this.hideMessage();
        }, duration);
    }

    /**
     * Hide the current error message
     */
    hideMessage() {
        if (this.errorContainer) {
            this.errorContainer.style.display = 'none';
        }
    }

    /**
     * Handle API errors and show appropriate messages
     * @param {Error} error - The error object
     * @param {string} context - The context where the error occurred
     */
    handleApiError(error, context) {
        console.error(`API Error in ${context}:`, error);

        if (error.name === 'AbortError') {
            this.showMessage('Request timed out. Please try again.', 5000, 'warning');
            return;
        }

        if (error.response) {
            switch (error.response.status) {
                case 401:
                    this.showMessage('Authentication failed. Please refresh the page.', 5000, 'error');
                    break;
                case 403:
                    this.showMessage('Access denied. Please check API permissions.', 5000, 'error');
                    break;
                case 404:
                    this.showMessage('Requested data not found.', 5000, 'warning');
                    break;
                case 429:
                    this.showMessage('Too many requests. Please wait a moment.', 8000, 'warning');
                    break;
                case 500:
                    this.showMessage('Server error. Please try again later.', 5000, 'error');
                    break;
                default:
                    this.showMessage('An unexpected error occurred.', 5000, 'error');
            }
        } else if (error.request) {
            this.showMessage('Network error. Please check your connection.', 5000, 'warning');
        } else {
            this.showMessage(`Error: ${error.message}`, 5000, 'error');
        }
    }

    /**
     * Handle validation errors
     * @param {Object} validationErrors - Object containing validation errors
     */
    handleValidationError(validationErrors) {
        const errorMessages = Object.entries(validationErrors)
            .map(([field, message]) => `${field}: ${message}`)
            .join('\n');

        this.showMessage(errorMessages, 5000, 'warning');
    }

    /**
     * Log errors for debugging
     * @param {Error} error - The error object
     * @param {string} context - The context where the error occurred
     * @param {Object} additionalData - Any additional data to log
     */
    logError(error, context, additionalData = {}) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            context,
            message: error.message,
            stack: error.stack,
            additionalData
        };

        console.error('Error Log:', errorLog);

        // Here you could also send the error to a logging service
        // this.sendToLoggingService(errorLog);
    }

    /**
     * Check if an element exists and is valid
     * @param {string} elementId - The ID of the element to check
     * @param {string} context - The context where the check is performed
     * @returns {boolean} - Whether the element is valid
     */
    validateElement(elementId, context) {
        const element = document.getElementById(elementId);
        if (!element) {
            this.showMessage(`Required element "${elementId}" not found in ${context}`, 5000, 'error');
            return false;
        }
        return true;
    }

    /**
     * Validate form data
     * @param {Object} formData - The form data to validate
     * @returns {Object} - Validation result {isValid: boolean, errors: Object}
     */
    validateFormData(formData) {
        const errors = {};

        // Validate team selections
        if (!formData.homeTeam) {
            errors.homeTeam = 'Home team must be selected';
        }
        if (!formData.awayTeam) {
            errors.awayTeam = 'Away team must be selected';
        }
        if (formData.homeTeam === formData.awayTeam) {
            errors.teams = 'Home and away teams must be different';
        }

        // Validate market values
        if (formData.marketSpread !== undefined && isNaN(formData.marketSpread)) {
            errors.marketSpread = 'Spread must be a valid number';
        }
        if (formData.marketTotal !== undefined && isNaN(formData.marketTotal)) {
            errors.marketTotal = 'Total must be a valid number';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorHandler };
} else {
    window.ErrorHandler = ErrorHandler;
} 