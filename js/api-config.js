const API_CONFIG = {
    BASE_URL: 'https://statsapi.mlb.com/api/v1',
    PROXY_URL: 'https://corsproxy.io/?',
    ENDPOINTS: {
        TEAMS: '/teams?sportId=1',
        TEAM_STATS: '/teams/{teamId}/stats?stats=statsSingleSeason,statsSplits7Days&group=hitting,pitching&season=2024',
        SCHEDULE: '/schedule/games/?sportId=1',
        PITCHER_STATS: '/people/{pitcherId}/stats?stats=gameLog&group=pitching',
        ROSTER: '/teams/{teamId}/roster/Active',
        STANDINGS: '/standings?leagueId=103,104',
        BALLPARK: '/teams/{teamId}/venue',
        WEATHER: '/weather?venueId={venueId}'
    },
    CACHE_DURATION: 300000, // 5 minutes in milliseconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
    HEADERS: {
        'User-Agent': 'Addy N Friends MLB Analyzer/1.0',
        'Accept': 'application/json',
        'Origin': window.location.origin
    }
};

// Add rate limiting settings
const RATE_LIMIT = {
    MAX_REQUESTS_PER_MINUTE: 50,
    COOLDOWN_PERIOD: 60000 // 1 minute
};

// Add error messages
const API_ERRORS = {
    NETWORK_ERROR: 'Unable to connect to MLB Stats API. Please check your internet connection.',
    RATE_LIMIT: 'Too many requests. Please try again in a minute.',
    DATA_ERROR: 'Error processing MLB data. Please try again.',
    TIMEOUT: 'Request timed out. Please try again.'
};

// Export configurations
export { API_CONFIG, RATE_LIMIT, API_ERRORS }; 