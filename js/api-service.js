class ApiService {
    constructor() {
        this.baseUrl = config.api.baseUrl;
        this.proxyUrl = config.api.proxyUrl;
        this.headers = config.api.headers;
        this.timeout = config.api.timeout;
        this.retryAttempts = config.api.retryAttempts;
        this.retryDelay = config.api.retryDelay;
        this.cache = new Map();
        this.errorHandler = new ErrorHandler();
        this.loadingHandler = new LoadingHandler();
    }

    /**
     * Make an API call with retries and error handling
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} - API response
     */
    async makeApiCall(endpoint, options = {}) {
        const cacheKey = this.getCacheKey(endpoint, options);
        
        // Check cache first
        if (config.cache.enabled) {
            const cachedData = this.getFromCache(cacheKey);
            if (cachedData) return cachedData;
        }

        let attempts = 0;
        let lastError = null;

        while (attempts < this.retryAttempts) {
            try {
                const response = await this.attemptApiCall(endpoint, options);
                
                // Cache successful response
                if (config.cache.enabled) {
                    this.setInCache(cacheKey, response);
                }
                
                return response;
            } catch (error) {
                lastError = error;
                attempts++;
                
                if (attempts < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempts);
                    continue;
                }
                
                throw error;
            }
        }

        this.errorHandler.handleApiError(lastError, `API call to ${endpoint}`);
        return this.getFallbackData(endpoint);
    }

    /**
     * Make a single API call attempt
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} - API response
     */
    async attemptApiCall(endpoint, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            // Try direct call first
            const directResponse = await this.makeDirectCall(endpoint, options, controller);
            if (directResponse.ok) {
                return await directResponse.json();
            }

            // If direct call fails, try proxy
            const proxyResponse = await this.makeProxyCall(endpoint, options, controller);
            if (proxyResponse.ok) {
                return await proxyResponse.json();
            }

            throw new Error(`Failed to fetch data from ${endpoint}`);
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Make a direct API call
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @param {AbortController} controller - Abort controller
     * @returns {Promise<Response>} - Fetch response
     */
    async makeDirectCall(endpoint, options, controller) {
        const url = `${this.baseUrl}${endpoint}`;
        return fetch(url, {
            ...options,
            headers: this.headers,
            signal: controller.signal,
            mode: 'cors',
            credentials: 'omit'
        });
    }

    /**
     * Make an API call through proxy
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @param {AbortController} controller - Abort controller
     * @returns {Promise<Response>} - Fetch response
     */
    async makeProxyCall(endpoint, options, controller) {
        const url = `${this.proxyUrl}${this.baseUrl}${endpoint}`;
        return fetch(url, {
            ...options,
            headers: {
                ...this.headers,
                'X-Requested-With': 'XMLHttpRequest'
            },
            signal: controller.signal
        });
    }

    /**
     * Get team statistics
     * @param {string} teamId - Team ID
     * @returns {Promise<Object>} - Team statistics
     */
    async getTeamStats(teamId) {
        const endpoint = `${config.api.endpoints.teams}/${teamId}/stats?stats=season&group=hitting,pitching&season=2024`;
        return this.makeApiCall(endpoint);
    }

    /**
     * Get team roster
     * @param {string} teamId - Team ID
     * @returns {Promise<Object>} - Team roster
     */
    async getTeamRoster(teamId) {
        const endpoint = `${config.api.endpoints.teams}/${teamId}/roster?rosterType=active`;
        return this.makeApiCall(endpoint);
    }

    /**
     * Get pitcher statistics
     * @param {string} pitcherId - Pitcher ID
     * @returns {Promise<Object>} - Pitcher statistics
     */
    async getPitcherStats(pitcherId) {
        const endpoint = `${config.api.endpoints.stats}?stats=season&group=pitching&season=2024&personId=${pitcherId}`;
        return this.makeApiCall(endpoint);
    }

    /**
     * Get head-to-head statistics
     * @param {string} teamId - Team ID
     * @param {string} opponentId - Opponent ID
     * @returns {Promise<Object>} - Head-to-head statistics
     */
    async getHeadToHead(teamId, opponentId) {
        const endpoint = `${config.api.endpoints.schedule}/?teamId=${teamId}&opponent=${opponentId}&season=2024`;
        return this.makeApiCall(endpoint);
    }

    /**
     * Get team injuries
     * @param {string} teamId - Team ID
     * @returns {Promise<Object>} - Team injuries
     */
    async getTeamInjuries(teamId) {
        const endpoint = `${config.api.endpoints.teams}/${teamId}/roster/injuries`;
        return this.makeApiCall(endpoint);
    }

    /**
     * Get venue information
     * @param {string} teamId - Team ID
     * @returns {Promise<Object>} - Venue information
     */
    async getVenueInfo(teamId) {
        const endpoint = `${config.api.endpoints.teams}/${teamId}/venue`;
        return this.makeApiCall(endpoint);
    }

    /**
     * Get from cache
     * @param {string} key - Cache key
     * @returns {Object|null} - Cached data or null
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > config.cache.duration) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Set in cache
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     */
    setInCache(key, data) {
        // Maintain cache size limit
        if (this.cache.size >= config.cache.maxSize) {
            const oldestKey = Array.from(this.cache.keys())[0];
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Get cache key
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {string} - Cache key
     */
    getCacheKey(endpoint, options) {
        return `${endpoint}:${JSON.stringify(options)}`;
    }

    /**
     * Get fallback data
     * @param {string} endpoint - API endpoint
     * @returns {Object} - Fallback data structure
     */
    getFallbackData(endpoint) {
        return {
            stats: [],
            injuries: [],
            roster: [],
            dates: [],
            venue: {},
            dimensions: {}
        };
    }

    /**
     * Delay execution
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiService };
} else {
    window.ApiService = ApiService;
} 