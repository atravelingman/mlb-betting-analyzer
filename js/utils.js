class Utils {
    /**
     * Format a number to a specific number of decimal places
     * @param {number} value - The number to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} - Formatted number
     */
    static formatNumber(value, decimals = 3) {
        if (isNaN(value)) return '0.000';
        return Number(value).toFixed(decimals);
    }

    /**
     * Format a date string to a specific format
     * @param {string} dateString - The date string to format
     * @param {string} format - The desired format (e.g., 'MM/DD/YYYY')
     * @returns {string} - Formatted date string
     */
    static formatDate(dateString, format = config.ui.dateFormat) {
        try {
            const date = new Date(dateString);
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            };
            return date.toLocaleDateString(undefined, options);
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    }

    /**
     * Calculate the weighted average of an array of numbers
     * @param {Array<number>} values - Array of numbers
     * @param {Array<number>} weights - Array of weights
     * @returns {number} - Weighted average
     */
    static calculateWeightedAverage(values, weights) {
        if (values.length !== weights.length) {
            throw new Error('Values and weights arrays must have the same length');
        }

        const sum = values.reduce((acc, val, i) => acc + (val * weights[i]), 0);
        const weightSum = weights.reduce((acc, val) => acc + val, 0);

        return sum / weightSum;
    }

    /**
     * Deep clone an object
     * @param {Object} obj - The object to clone
     * @returns {Object} - Cloned object
     */
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Generate a unique ID
     * @returns {string} - Unique ID
     */
    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Debounce a function
     * @param {Function} func - The function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} - Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle a function
     * @param {Function} func - The function to throttle
     * @param {number} limit - Limit in milliseconds
     * @returns {Function} - Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Convert innings pitched from string format to decimal
     * @param {string} ip - Innings pitched in string format (e.g., "6.2")
     * @returns {number} - Decimal innings pitched
     */
    static convertInningsPitched(ip) {
        if (!ip) return 0;
        const [whole, partial = 0] = ip.toString().split('.');
        return parseInt(whole) + (parseInt(partial) || 0) / 3;
    }

    /**
     * Calculate park factors based on dimensions
     * @param {Object} dimensions - Ballpark dimensions object
     * @returns {Object} - Park factors object
     */
    static calculateParkFactors(dimensions) {
        const { leftField, centerField, rightField } = dimensions;
        const avgDistance = (leftField + centerField + rightField) / 3;
        
        return {
            overall: avgDistance < 380 ? 1.1 : avgDistance > 400 ? 0.9 : 1.0,
            leftField: leftField < 330 ? 1.15 : leftField > 350 ? 0.85 : 1.0,
            centerField: centerField < 400 ? 1.1 : centerField > 420 ? 0.9 : 1.0,
            rightField: rightField < 330 ? 1.15 : rightField > 350 ? 0.85 : 1.0
        };
    }

    /**
     * Calculate confidence level based on multiple factors
     * @param {Object} factors - Object containing confidence factors
     * @returns {string} - Confidence level ('High', 'Medium', or 'Low')
     */
    static calculateConfidence(factors) {
        const weights = {
            spreadValue: 0.3,
            totalValue: 0.3,
            offensiveAdvantage: 0.2,
            pitchingAdvantage: 0.2
        };

        const weightedScore = Object.entries(factors).reduce((score, [key, value]) => {
            return score + (value * (weights[key] || 0));
        }, 0);

        if (weightedScore >= 0.7) return 'High';
        if (weightedScore >= 0.4) return 'Medium';
        return 'Low';
    }

    /**
     * Format a score string
     * @param {Object} score - Score object with home and away runs
     * @returns {string} - Formatted score string
     */
    static formatScore(score) {
        if (!score || !score.home || !score.away) return 'N/A';
        return `${score.away} - ${score.home}`;
    }

    /**
     * Calculate statistical significance
     * @param {number} value - The value to test
     * @param {number} mean - Population mean
     * @param {number} stdDev - Population standard deviation
     * @returns {boolean} - Whether the value is statistically significant
     */
    static isStatisticallySignificant(value, mean, stdDev) {
        const zScore = Math.abs((value - mean) / stdDev);
        return zScore > 1.96; // 95% confidence level
    }

    /**
     * Format a pitcher's name and stats for display
     * @param {Object} pitcher - Pitcher object with name and stats
     * @returns {string} - Formatted pitcher string
     */
    static formatPitcherDisplay(pitcher) {
        if (!pitcher || !pitcher.name) return 'TBD';
        const stats = pitcher.stats || {};
        return `${pitcher.name} (${stats.era || '0.00'} ERA, ${stats.whip || '0.00'} WHIP)`;
    }

    /**
     * Calculate run expectancy delta
     * @param {number} actual - Actual runs scored
     * @param {number} expected - Expected runs
     * @returns {string} - Formatted delta with sign
     */
    static calculateRunExpectancyDelta(actual, expected) {
        const delta = actual - expected;
        const sign = delta > 0 ? '+' : '';
        return `${sign}${delta.toFixed(2)}`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Utils };
} else {
    window.Utils = Utils;
} 