const config = {
    // API Configuration
    api: {
        baseUrl: 'https://statsapi.mlb.com/api/v1',
        proxyUrl: 'https://cors-anywhere.herokuapp.com/',
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'MLBBettingAnalyzer/1.0',
            'Origin': window.location.origin
        },
        endpoints: {
            teams: '/teams',
            roster: '/roster',
            stats: '/stats',
            schedule: '/schedule/games',
            injuries: '/injuries',
            venue: '/venue'
        },
        timeout: 30000, // 30 seconds
        retryAttempts: 3,
        retryDelay: 1000 // 1 second
    },

    // Analysis Configuration
    analysis: {
        thresholds: {
            spread: 2.0,
            total: 3.0,
            offensiveAdvantage: 0.050,
            pitchingAdvantage: 1.0,
            highConfidence: 0.080
        },
        weights: {
            wOBA: 5.0,
            whip: 2.5,
            babip: 1.5,
            iso: 2.0,
            xFIP: 0.3,
            strikeouts: -0.15,
            walks: 0.1
        }
    },

    // Weather Impact Factors
    weather: {
        normal: { runs: 1.0, hr: 1.0 },
        wind_out: { runs: 1.15, hr: 1.3 },
        wind_in: { runs: 0.85, hr: 0.7 },
        rain: { runs: 0.9, hr: 0.85 },
        hot: { runs: 1.1, hr: 1.15 },
        cold: { runs: 0.9, hr: 0.8 },
        dome: { runs: 1.0, hr: 1.0 }
    },

    // UI Configuration
    ui: {
        updateInterval: 60000, // 1 minute
        errorDisplayDuration: 5000, // 5 seconds
        maxRecentGames: 5,
        dateFormat: 'MM/DD/YYYY',
        decimalPlaces: {
            batting: 3,
            pitching: 2,
            projections: 2
        },
        colors: {
            primary: '#1a237e',
            secondary: '#c62828',
            success: '#4caf50',
            warning: '#ffc107',
            danger: '#f44336',
            info: '#2196f3'
        }
    },

    // Status Classes
    status: {
        green: 'status-green',
        yellow: 'status-yellow',
        orange: 'status-orange',
        red: 'status-red'
    },

    // Validation Rules
    validation: {
        spread: {
            min: -20,
            max: 20,
            step: 0.5
        },
        total: {
            min: 5,
            max: 20,
            step: 0.5
        }
    },

    // Cache Configuration
    cache: {
        enabled: true,
        duration: 300000, // 5 minutes
        maxSize: 100 // Maximum number of items to cache
    },

    // Debug Configuration
    debug: {
        enabled: false,
        logLevel: 'warn', // 'debug' | 'info' | 'warn' | 'error'
        logToConsole: true,
        logToFile: false
    },

    // Feature Flags
    features: {
        advancedStats: true,
        weatherImpact: true,
        injuryTracking: true,
        bullpenAnalysis: true,
        historicalComparison: true
    }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
    config.debug.enabled = true;
    config.debug.logLevel = 'debug';
    config.cache.duration = 60000; // 1 minute in development
}

// Freeze the configuration to prevent modifications
Object.freeze(config);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { config };
} else {
    window.config = config;
} 