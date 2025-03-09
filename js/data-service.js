import { API_CONFIG, RATE_LIMIT, API_ERRORS } from './api-config.js';
import { Utils } from './utils.js';

const MLB_TEAMS = [
    { id: 110, name: "Baltimore Orioles", abbreviation: "BAL" },
    { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
    { id: 147, name: "New York Yankees", abbreviation: "NYY" },
    { id: 139, name: "Tampa Bay Rays", abbreviation: "TB" },
    { id: 141, name: "Toronto Blue Jays", abbreviation: "TOR" },
    { id: 145, name: "Chicago White Sox", abbreviation: "CWS" },
    { id: 114, name: "Cleveland Guardians", abbreviation: "CLE" },
    { id: 116, name: "Detroit Tigers", abbreviation: "DET" },
    { id: 118, name: "Kansas City Royals", abbreviation: "KC" },
    { id: 142, name: "Minnesota Twins", abbreviation: "MIN" },
    { id: 117, name: "Houston Astros", abbreviation: "HOU" },
    { id: 108, name: "Los Angeles Angels", abbreviation: "LAA" },
    { id: 133, name: "Oakland Athletics", abbreviation: "OAK" },
    { id: 136, name: "Seattle Mariners", abbreviation: "SEA" },
    { id: 140, name: "Texas Rangers", abbreviation: "TEX" },
    { id: 144, name: "Atlanta Braves", abbreviation: "ATL" },
    { id: 146, name: "Miami Marlins", abbreviation: "MIA" },
    { id: 121, name: "New York Mets", abbreviation: "NYM" },
    { id: 143, name: "Philadelphia Phillies", abbreviation: "PHI" },
    { id: 120, name: "Washington Nationals", abbreviation: "WSH" },
    { id: 112, name: "Chicago Cubs", abbreviation: "CHC" },
    { id: 113, name: "Cincinnati Reds", abbreviation: "CIN" },
    { id: 158, name: "Milwaukee Brewers", abbreviation: "MIL" },
    { id: 134, name: "Pittsburgh Pirates", abbreviation: "PIT" },
    { id: 138, name: "St. Louis Cardinals", abbreviation: "STL" },
    { id: 109, name: "Arizona Diamondbacks", abbreviation: "ARI" },
    { id: 115, name: "Colorado Rockies", abbreviation: "COL" },
    { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" },
    { id: 135, name: "San Diego Padres", abbreviation: "SD" },
    { id: 137, name: "San Francisco Giants", abbreviation: "SF" }
];

class DataService {
    constructor() {
        this.cache = new Map();
        this.requestCount = 0;
        this.lastResetTime = Date.now();
    }

    async fetchData(endpoint, params = {}) {
        const cacheKey = this.getCacheKey(endpoint, params);
        const cachedData = this.getFromCache(cacheKey);
        
        if (cachedData) {
            return cachedData;
        }

        await this.checkRateLimit();
        
        let attempts = 0;
        while (attempts < API_CONFIG.RETRY_ATTEMPTS) {
            try {
                const url = this.buildUrl(endpoint, params);
                const response = await this.makeRequest(url);
                const data = await response.json();
                
                this.setInCache(cacheKey, data);
                return data;
            } catch (error) {
                attempts++;
                if (attempts === API_CONFIG.RETRY_ATTEMPTS) {
                    throw new Error(API_ERRORS.NETWORK_ERROR);
                }
                await this.delay(API_CONFIG.RETRY_DELAY * attempts);
            }
        }
    }

    async getTeams() {
        // Return static team data instead of making API call
        return MLB_TEAMS;
    }

    async getTeamStats(teamId) {
        try {
            const endpoint = API_CONFIG.ENDPOINTS.TEAM_STATS.replace('{teamId}', teamId);
            const data = await this.fetchData(endpoint);
            
            // Check if data exists and has the expected structure
            if (!data || !data.stats || !Array.isArray(data.stats)) {
                console.error('Invalid team stats data structure:', data);
                throw new Error('Invalid team stats data received');
            }

            // Find hitting and pitching stats
            const hittingStats = data.stats.find(stat => stat.group === 'hitting' || stat.group.displayName === 'hitting');
            const pitchingStats = data.stats.find(stat => stat.group === 'pitching' || stat.group.displayName === 'pitching');

            if (!hittingStats?.splits?.[0]?.stat || !pitchingStats?.splits?.[0]?.stat) {
                console.error('Missing hitting or pitching stats:', { hittingStats, pitchingStats });
                throw new Error('Missing team statistics');
            }

            const hitting = hittingStats.splits[0].stat;
            const pitching = pitchingStats.splits[0].stat;

            return {
                batting: {
                    avg: Utils.formatNumber(hitting.avg || 0, 3),
                    obp: Utils.formatNumber(hitting.obp || 0, 3),
                    slg: Utils.formatNumber(hitting.slg || 0, 3),
                    ops: Utils.formatNumber(hitting.ops || 0, 3),
                    iso: Utils.formatNumber((hitting.slg || 0) - (hitting.avg || 0), 3),
                    babip: Utils.formatNumber(hitting.babip || 0, 3)
                },
                pitching: {
                    era: Utils.formatNumber(pitching.era || 0, 2),
                    whip: Utils.formatNumber(pitching.whip || 0, 2),
                    k9: Utils.formatNumber(pitching.strikeoutsPer9Inn || 0, 1),
                    bb9: Utils.formatNumber(pitching.walksPer9Inn || 0, 1)
                }
            };
        } catch (error) {
            console.error('Error fetching team stats:', error);
            throw new Error(`Failed to fetch team stats: ${error.message}`);
        }
    }

    async getPitcherStats(pitcherId) {
        // Mock pitcher stats for testing
        return {
            aggregate: {
                era: "3.45",
                whip: "1.15",
                k9: "9.5",
                bb9: "2.8"
            }
        };
    }

    async getBallparkInfo(teamId) {
        // Find team from static data
        const team = MLB_TEAMS.find(t => t.id.toString() === teamId.toString());
        // Mock ballpark data
        return {
            name: `${team ? team.name : 'Unknown'} Ballpark`,
            dimensions: {
                leftField: "330",
                centerField: "400",
                rightField: "330"
            }
        };
    }

    async loadRoster(teamId) {
        // Mock pitcher data for testing
        const mockPitchers = [
            { person: { id: 1, fullName: "Ace Pitcher" } },
            { person: { id: 2, fullName: "Reliable Starter" } },
            { person: { id: 3, fullName: "Solid Veteran" } },
            { person: { id: 4, fullName: "Young Prospect" } }
        ];
        return mockPitchers;
    }

    // Helper methods
    async checkRateLimit() {
        const now = Date.now();
        if (now - this.lastResetTime >= RATE_LIMIT.COOLDOWN_PERIOD) {
            this.requestCount = 0;
            this.lastResetTime = now;
        }

        if (this.requestCount >= RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) {
            throw new Error(API_ERRORS.RATE_LIMIT);
        }

        this.requestCount++;
    }

    buildUrl(endpoint, params) {
        const url = new URL(API_CONFIG.BASE_URL + endpoint);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
        return url.toString();
    }

    async makeRequest(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            // Use proxy URL for all requests to avoid CORS issues
            const proxyUrl = API_CONFIG.PROXY_URL + encodeURIComponent(url);
            
            console.log('Fetching:', proxyUrl);
            
            const response = await fetch(proxyUrl, {
                headers: {
                    ...API_CONFIG.HEADERS,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                signal: controller.signal,
                mode: 'cors'
            });

            if (!response.ok) {
                console.error('API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: proxyUrl
                });
                throw new Error(`${API_ERRORS.DATA_ERROR} (Status: ${response.status})`);
            }

            return response;
        } catch (error) {
            console.error('Request Error:', error);
            if (error.name === 'AbortError') {
                throw new Error(API_ERRORS.TIMEOUT);
            }
            throw new Error(`${API_ERRORS.NETWORK_ERROR}: ${error.message}`);
        } finally {
            clearTimeout(timeoutId);
        }
    }

    processTeamStats(data) {
        const stats = data.stats[0].splits[0].stat;
        return {
            batting: {
                avg: Utils.formatNumber(stats.avg, 3),
                obp: Utils.formatNumber(stats.obp, 3),
                slg: Utils.formatNumber(stats.slg, 3),
                ops: Utils.formatNumber(stats.ops, 3),
                iso: Utils.formatNumber(stats.slg - stats.avg, 3),
                babip: Utils.formatNumber(stats.babip, 3)
            },
            pitching: {
                era: Utils.formatNumber(stats.era, 2),
                whip: Utils.formatNumber(stats.whip, 2),
                k9: Utils.formatNumber(stats.strikeoutsPer9Inn, 1),
                bb9: Utils.formatNumber(stats.walksPer9Inn, 1)
            }
        };
    }

    processPitcherStats(data) {
        const recentGames = data.stats[0].splits.slice(0, 3);
        return {
            lastThree: recentGames.map(game => ({
                date: Utils.formatDate(game.date),
                ip: game.stat.inningsPitched,
                er: game.stat.earnedRuns,
                so: game.stat.strikeOuts,
                bb: game.stat.baseOnBalls,
                era: Utils.formatNumber(game.stat.era, 2),
                whip: Utils.formatNumber(game.stat.whip, 2)
            })),
            aggregate: this.calculatePitcherAggregate(recentGames)
        };
    }

    processBallparkData(data) {
        return {
            name: data.venue.name,
            dimensions: {
                leftField: data.venue.dimensions?.leftField || 'N/A',
                centerField: data.venue.dimensions?.centerField || 'N/A',
                rightField: data.venue.dimensions?.rightField || 'N/A'
            },
            surface: data.venue.fieldInfo?.surface || 'N/A',
            roof: data.venue.fieldInfo?.roofType || 'N/A'
        };
    }

    calculatePitcherAggregate(games) {
        const totalIP = games.reduce((sum, game) => sum + parseFloat(game.stat.inningsPitched), 0);
        const totalER = games.reduce((sum, game) => sum + game.stat.earnedRuns, 0);
        const totalBB = games.reduce((sum, game) => sum + game.stat.baseOnBalls, 0);
        const totalH = games.reduce((sum, game) => sum + game.stat.hits, 0);
        const totalSO = games.reduce((sum, game) => sum + game.stat.strikeOuts, 0);

        return {
            era: Utils.formatNumber((totalER * 9) / totalIP, 2),
            whip: Utils.formatNumber((totalBB + totalH) / totalIP, 2),
            k9: Utils.formatNumber((totalSO * 9) / totalIP, 1),
            bb9: Utils.formatNumber((totalBB * 9) / totalIP, 1)
        };
    }

    getCacheKey(endpoint, params) {
        return endpoint + JSON.stringify(params);
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < API_CONFIG.CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }

    setInCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const dataService = new DataService(); 