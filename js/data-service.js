import { API_CONFIG, RATE_LIMIT, API_ERRORS } from './api-config.js';
import { Utils } from './utils.js';

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
        const data = await this.fetchData(API_CONFIG.ENDPOINTS.TEAMS);
        return data.teams.map(team => ({
            id: team.id,
            name: team.name,
            abbreviation: team.abbreviation,
            venue: team.venue
        }));
    }

    async getTeamStats(teamId) {
        const data = await this.fetchData(API_CONFIG.ENDPOINTS.TEAM_STATS.replace('{teamId}', teamId));
        return this.processTeamStats(data);
    }

    async getPitcherStats(pitcherId) {
        const data = await this.fetchData(API_CONFIG.ENDPOINTS.PITCHER_STATS.replace('{pitcherId}', pitcherId));
        return this.processPitcherStats(data);
    }

    async getBallparkInfo(teamId) {
        const data = await this.fetchData(API_CONFIG.ENDPOINTS.BALLPARK.replace('{teamId}', teamId));
        return this.processBallparkData(data);
    }

    async loadRoster(teamId) {
        try {
            const data = await this.fetchData(API_CONFIG.ENDPOINTS.ROSTER.replace('{teamId}', teamId));
            return data.roster.filter(player => player.position.code === '1'); // Pitchers only
        } catch (error) {
            console.error('Error loading roster:', error);
            return [];
        }
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
            
            const response = await fetch(proxyUrl, {
                headers: API_CONFIG.HEADERS,
                signal: controller.signal,
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(API_ERRORS.DATA_ERROR);
            }

            return response;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(API_ERRORS.TIMEOUT);
            }
            throw error;
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