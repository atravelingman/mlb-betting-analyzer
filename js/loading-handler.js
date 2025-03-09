class LoadingHandler {
    constructor() {
        this.loadingSpinner = document.getElementById('loading');
        this.loadingStates = new Map();
        this.activeRequests = 0;
    }

    /**
     * Show the loading spinner with a specific message
     * @param {string} context - The context for this loading state
     * @param {string} message - Optional message to display
     */
    showLoading(context, message = 'Loading...') {
        if (!this.loadingSpinner) {
            console.warn('Loading spinner element not found');
            return;
        }

        this.loadingStates.set(context, true);
        this.activeRequests++;
        
        this.loadingSpinner.style.display = 'block';
        
        // Update loading message if element exists
        const messageElement = document.getElementById('loadingMessage');
        if (messageElement) {
            messageElement.textContent = message;
        }

        // Disable relevant form elements
        this.toggleFormElements(false);
    }

    /**
     * Hide the loading spinner for a specific context
     * @param {string} context - The context for this loading state
     */
    hideLoading(context) {
        if (!this.loadingSpinner) {
            return;
        }

        this.loadingStates.delete(context);
        this.activeRequests = Math.max(0, this.activeRequests - 1);

        if (this.activeRequests === 0) {
            this.loadingSpinner.style.display = 'none';
            // Re-enable form elements
            this.toggleFormElements(true);
        }
    }

    /**
     * Toggle form elements enabled/disabled state
     * @param {boolean} enabled - Whether to enable or disable elements
     */
    toggleFormElements(enabled) {
        const formElements = document.querySelectorAll('button, select, input');
        formElements.forEach(element => {
            element.disabled = !enabled;
        });
    }

    /**
     * Check if any loading state is active
     * @returns {boolean} - Whether any context is in a loading state
     */
    isLoading() {
        return this.activeRequests > 0;
    }

    /**
     * Get the current loading state for a specific context
     * @param {string} context - The context to check
     * @returns {boolean} - Whether the context is in a loading state
     */
    getLoadingState(context) {
        return this.loadingStates.get(context) || false;
    }

    /**
     * Create a loading wrapper for async functions
     * @param {Function} asyncFn - The async function to wrap
     * @param {string} context - The context for this loading state
     * @param {string} loadingMessage - Optional loading message
     * @returns {Function} - The wrapped function
     */
    createLoadingWrapper(asyncFn, context, loadingMessage) {
        return async (...args) => {
            try {
                this.showLoading(context, loadingMessage);
                const result = await asyncFn(...args);
                return result;
            } finally {
                this.hideLoading(context);
            }
        };
    }

    /**
     * Handle multiple concurrent loading states
     * @param {Array<{context: string, message: string}>} loadingStates - Array of loading states
     */
    handleMultipleLoadingStates(loadingStates) {
        loadingStates.forEach(state => {
            this.showLoading(state.context, state.message);
        });
    }

    /**
     * Clear all loading states
     */
    clearAllLoadingStates() {
        this.loadingStates.clear();
        this.activeRequests = 0;
        if (this.loadingSpinner) {
            this.loadingSpinner.style.display = 'none';
        }
        this.toggleFormElements(true);
    }

    /**
     * Update the loading message
     * @param {string} message - The new message to display
     */
    updateLoadingMessage(message) {
        const messageElement = document.getElementById('loadingMessage');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    /**
     * Add loading progress indicator
     * @param {number} progress - Progress percentage (0-100)
     */
    updateProgress(progress) {
        const progressBar = document.getElementById('loadingProgress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LoadingHandler };
} else {
    window.LoadingHandler = LoadingHandler;
} 