/**
 * MLB Game Data Extractor
 * Extracts and populates comprehensive game data when a user selects an MLB game
 */

import { Utils } from './utils.js';
import { dataService } from './data-service.js';

export class GameDataExtractor {
    constructor() {
        this.gameData = null;
        this.teamAbbreviations = {
            "109": "AZ", "144": "ATL", "110": "BAL", "111": "BOS", "112": "CHC",
            "145": "CWS", "113": "CIN", "114": "CLE", "115": "COL", "116": "DET",
            "117": "HOU", "118": "KC", "108": "LAA", "119": "LAD", "146": "MIA",
            "158": "MIL", "142": "MIN", "121": "NYM", "147": "NYY", "133": "OAK",
            "143": "PHI", "134": "PIT", "135": "SD", "137": "SF", "136": "SEA",
            "138": "STL", "139": "TB", "140": "TEX", "141": "TOR", "120": "WSH"
        };
    }

    /**
     * Extract comprehensive game data for a selected MLB game
     * @param {string} gameId - The selected game ID
     * @param {string} date - Game date (YYYY-MM-DD)
     * @returns {Object} Formatted game data
     */
    async extractGameData(gameId, date) {
        try {
            // Fetch all required data sources in parallel
            const [
                gameInfo,
                oddsData,
                weatherData,
                injuryData,
                lineupData,
                propData,
                lineMovementData,
                betSplitsData
            ] = await Promise.all([
                this.fetchGameInfo(gameId, date),
                this.fetchOddsData(gameId),
                this.fetchWeatherData(gameId),
                this.fetchInjuryData(gameId),
                this.fetchLineupData(gameId),
                this.fetchPlayerProps(gameId),
                this.fetchLineMovement(gameId),
                this.fetchBetSplits(gameId)
            ]);

            // Extract and format all required fields
            const extractedData = {
                // 1. Game Date & Time
                game_id: this.generateGameId(gameInfo),
                date_time_et: this.formatDateTime(gameInfo.gameDate, gameInfo.gameTime),

                // 2. Teams
                teams: this.extractTeams(gameInfo),

                // 3. Starting Pitchers
                pitchers: this.extractPitchers(gameInfo),

                // 4-6. Odds Data
                odds: this.extractOdds(oddsData),

                // 7-9. Implied Probabilities
                probabilities: this.calculateImpliedProbabilities(oddsData),

                // 10. Line Movement
                line_movement: this.extractLineMovement(lineMovementData),

                // 11. Bet Splits
                bet_splits: this.extractBetSplits(betSplitsData),

                // 12. Weather & Ballpark
                weather: this.extractWeatherAndBallpark(weatherData, gameInfo),

                // 13. Injury/Lineup Updates
                injuries: this.extractInjuryUpdates(injuryData, lineupData),

                // 14. Win Probability Model
                model: this.calculateWinProbability(gameInfo, oddsData),

                // 15. Player Props
                props: this.extractPlayerProps(propData)
            };

            // Validate and clean the data
            return this.validateAndCleanData(extractedData);

        } catch (error) {
            console.error('Error extracting game data:', error);
            throw new Error(`Failed to extract game data: ${error.message}`);
        }
    }

    /**
     * Generate consistent game ID
     */
    generateGameId(gameInfo) {
        const date = gameInfo.gameDate.split('T')[0];
        const awayTeam = this.teamAbbreviations[gameInfo.teams.away.id] || 'UNK';
        const homeTeam = this.teamAbbreviations[gameInfo.teams.home.id] || 'UNK';
        return `${date}-${awayTeam}-${homeTeam}`;
    }

    /**
     * Format date and time to ET
     */
    formatDateTime(gameDate, gameTime) {
        try {
            const dateObj = new Date(`${gameDate}T${gameTime || '19:05:00'}`);
            return dateObj.toISOString().replace('Z', '');
        } catch (error) {
            return null;
        }
    }

    /**
     * Extract team information
     */
    extractTeams(gameInfo) {
        return {
            away: {
                id: gameInfo.teams?.away?.id || null,
                name: gameInfo.teams?.away?.name || 'N/A',
                abbreviation: this.teamAbbreviations[gameInfo.teams?.away?.id] || 'N/A'
            },
            home: {
                id: gameInfo.teams?.home?.id || null,
                name: gameInfo.teams?.home?.name || 'N/A',
                abbreviation: this.teamAbbreviations[gameInfo.teams?.home?.id] || 'N/A'
            }
        };
    }

    /**
     * Extract starting pitcher information
     */
    extractPitchers(gameInfo) {
        return {
            away: gameInfo.teams?.away?.probablePitcher?.fullName || 'TBD',
            home: gameInfo.teams?.home?.probablePitcher?.fullName || 'TBD',
            away_id: gameInfo.teams?.away?.probablePitcher?.id || null,
            home_id: gameInfo.teams?.home?.probablePitcher?.id || null
        };
    }

    /**
     * Extract comprehensive odds data
     */
    extractOdds(oddsData) {
        const odds = {
            moneyline: {
                away: this.parseOdds(oddsData?.moneyline?.away),
                home: this.parseOdds(oddsData?.moneyline?.home)
            },
            runline: {
                value: oddsData?.runline?.value || null,
                away_odds: this.parseOdds(oddsData?.runline?.away_odds),
                home_odds: this.parseOdds(oddsData?.runline?.home_odds),
                implied_pct: null
            },
            total: {
                line: oddsData?.total?.line || null,
                over_odds: this.parseOdds(oddsData?.total?.over_odds),
                under_odds: this.parseOdds(oddsData?.total?.under_odds)
            }
        };

        // Calculate runline implied probability
        if (odds.runline.away_odds && odds.runline.home_odds) {
            const avgOdds = (Math.abs(odds.runline.away_odds) + Math.abs(odds.runline.home_odds)) / 2;
            odds.runline.implied_pct = this.oddsToImpliedProbability(avgOdds);
        }

        return odds;
    }

    /**
     * Calculate implied probabilities from odds
     */
    calculateImpliedProbabilities(oddsData) {
        const probabilities = {};

        // Moneyline probabilities
        if (oddsData?.moneyline?.away) {
            probabilities.ml_away = this.oddsToImpliedProbability(oddsData.moneyline.away);
        }
        if (oddsData?.moneyline?.home) {
            probabilities.ml_home = this.oddsToImpliedProbability(oddsData.moneyline.home);
        }

        // Runline probabilities
        if (oddsData?.runline?.away_odds) {
            probabilities.rl_away = this.oddsToImpliedProbability(oddsData.runline.away_odds);
        }
        if (oddsData?.runline?.home_odds) {
            probabilities.rl_home = this.oddsToImpliedProbability(oddsData.runline.home_odds);
        }

        // Over/Under probabilities
        if (oddsData?.total?.over_odds) {
            probabilities.over = this.oddsToImpliedProbability(oddsData.total.over_odds);
        }
        if (oddsData?.total?.under_odds) {
            probabilities.under = this.oddsToImpliedProbability(oddsData.total.under_odds);
        }

        return probabilities;
    }

    /**
     * Extract line movement data
     */
    extractLineMovement(lineMovementData) {
        if (!lineMovementData) return null;

        return {
            moneyline: {
                away: {
                    open: this.parseOdds(lineMovementData.moneyline?.away?.open),
                    current: this.parseOdds(lineMovementData.moneyline?.away?.current),
                    timestamp: lineMovementData.moneyline?.away?.timestamp || null
                },
                home: {
                    open: this.parseOdds(lineMovementData.moneyline?.home?.open),
                    current: this.parseOdds(lineMovementData.moneyline?.home?.current),
                    timestamp: lineMovementData.moneyline?.home?.timestamp || null
                }
            },
            runline: {
                value_open: lineMovementData.runline?.value_open || null,
                value_current: lineMovementData.runline?.value_current || null,
                odds_open: this.parseOdds(lineMovementData.runline?.odds_open),
                odds_current: this.parseOdds(lineMovementData.runline?.odds_current)
            },
            total: {
                line_open: lineMovementData.total?.line_open || null,
                line_current: lineMovementData.total?.line_current || null,
                over_open: this.parseOdds(lineMovementData.total?.over_open),
                over_current: this.parseOdds(lineMovementData.total?.over_current)
            }
        };
    }

    /**
     * Extract betting splits data
     */
    extractBetSplits(betSplitsData) {
        if (!betSplitsData) return null;

        return {
            moneyline: {
                public_away: betSplitsData.moneyline?.public_away || null,
                public_home: betSplitsData.moneyline?.public_home || null,
                sharp_away: betSplitsData.moneyline?.sharp_away || null,
                sharp_home: betSplitsData.moneyline?.sharp_home || null
            },
            runline: {
                public_away: betSplitsData.runline?.public_away || null,
                public_home: betSplitsData.runline?.public_home || null,
                sharp_away: betSplitsData.runline?.sharp_away || null,
                sharp_home: betSplitsData.runline?.sharp_home || null
            },
            total: {
                public_over: betSplitsData.total?.public_over || null,
                public_under: betSplitsData.total?.public_under || null,
                sharp_over: betSplitsData.total?.sharp_over || null,
                sharp_under: betSplitsData.total?.sharp_under || null
            }
        };
    }

    /**
     * Extract weather and ballpark information
     */
    extractWeatherAndBallpark(weatherData, gameInfo) {
        return {
            temperature: weatherData?.temperature || null,
            wind_speed: weatherData?.wind?.speed || null,
            wind_direction: weatherData?.wind?.direction || null,
            humidity: weatherData?.humidity || null,
            conditions: weatherData?.conditions || 'N/A',
            ballpark: {
                name: gameInfo?.venue?.name || 'N/A',
                park_factor: this.calculateParkFactor(gameInfo?.venue?.id),
                dimensions: {
                    left_field: gameInfo?.venue?.fieldInfo?.leftLine || null,
                    center_field: gameInfo?.venue?.fieldInfo?.center || null,
                    right_field: gameInfo?.venue?.fieldInfo?.rightLine || null
                }
            }
        };
    }

    /**
     * Extract injury and lineup updates
     */
    extractInjuryUpdates(injuryData, lineupData) {
        const updates = [];

        // Process injury data
        if (injuryData?.injuries) {
            injuryData.injuries.forEach(injury => {
                updates.push({
                    type: 'injury',
                    player: injury.player?.fullName || 'Unknown',
                    status: injury.status || 'Unknown',
                    description: injury.description || 'N/A'
                });
            });
        }

        // Process lineup changes
        if (lineupData?.changes) {
            lineupData.changes.forEach(change => {
                updates.push({
                    type: 'lineup_change',
                    player: change.player?.fullName || 'Unknown',
                    change: change.description || 'N/A',
                    timestamp: change.timestamp || null
                });
            });
        }

        return updates.length > 0 ? updates : null;
    }

    /**
     * Calculate win probability using multiple models
     */
    calculateWinProbability(gameInfo, oddsData) {
        const model = {
            away_win_pct: null,
            home_win_pct: null,
            confidence: null,
            model_name: 'Composite Model'
        };

        // Use moneyline odds as base probability
        if (oddsData?.moneyline?.away && oddsData?.moneyline?.home) {
            const awayProb = this.oddsToImpliedProbability(oddsData.moneyline.away);
            const homeProb = this.oddsToImpliedProbability(oddsData.moneyline.home);
            
            // Normalize probabilities to remove vig
            const total = awayProb + homeProb;
            model.away_win_pct = Utils.formatNumber((awayProb / total) * 100, 1);
            model.home_win_pct = Utils.formatNumber((homeProb / total) * 100, 1);
            
            // Calculate confidence based on odds difference
            const oddsSpread = Math.abs(oddsData.moneyline.away - oddsData.moneyline.home);
            model.confidence = Utils.formatNumber(Math.min(oddsSpread / 500, 1), 2);
        }

        return model;
    }

    /**
     * Extract player props data
     */
    extractPlayerProps(propData) {
        if (!propData?.props || !Array.isArray(propData.props)) {
            return null;
        }

        return propData.props.map(prop => ({
            type: prop.prop_type || 'Unknown',
            player: prop.player?.fullName || 'Unknown',
            line: prop.line || null,
            over_odds: this.parseOdds(prop.over_odds),
            under_odds: this.parseOdds(prop.under_odds),
            implied_prob_over: prop.over_odds ? this.oddsToImpliedProbability(prop.over_odds) : null,
            implied_prob_under: prop.under_odds ? this.oddsToImpliedProbability(prop.under_odds) : null
        })).filter(prop => prop.player !== 'Unknown');
    }

    /**
     * Utility methods
     */
    parseOdds(odds) {
        if (odds === null || odds === undefined || odds === '') return null;
        const parsed = parseInt(odds);
        return isNaN(parsed) ? null : parsed;
    }

    oddsToImpliedProbability(odds) {
        if (!odds) return null;
        
        if (odds > 0) {
            return Utils.formatNumber(100 / (odds + 100) * 100, 1);
        } else {
            return Utils.formatNumber(Math.abs(odds) / (Math.abs(odds) + 100) * 100, 1);
        }
    }

    calculateParkFactor(venueId) {
        // Basic park factors - would be enhanced with real data
        const parkFactors = {
            '1': 1.05,   // Fenway Park
            '13': 1.12,  // Coors Field
            '3': 0.95,   // Yankee Stadium
            // Add more as needed
        };
        return parkFactors[venueId] || 1.00;
    }

    /**
     * Validate and clean extracted data
     */
    validateAndCleanData(data) {
        // Ensure all numeric fields are properly formatted
        if (data.odds?.moneyline) {
            Object.keys(data.odds.moneyline).forEach(team => {
                if (data.odds.moneyline[team] !== null && !isNaN(data.odds.moneyline[team])) {
                    data.odds.moneyline[team] = parseInt(data.odds.moneyline[team]);
                }
            });
        }

        // Validate required fields
        const requiredFields = ['game_id', 'teams', 'pitchers'];
        requiredFields.forEach(field => {
            if (!data[field]) {
                console.warn(`Missing required field: ${field}`);
                data[field] = 'N/A';
            }
        });

        return data;
    }

    /**
     * API call methods - these would be implemented to call actual data sources
     */
    async fetchGameInfo(gameId, date) {
        // This would call the MLB API or your data source
        return dataService.getGameInfo(gameId, date);
    }

    async fetchOddsData(gameId) {
        // This would call your sportsbook API
        return dataService.getOddsData(gameId);
    }

    async fetchWeatherData(gameId) {
        // This would call weather API
        return dataService.getWeatherData(gameId);
    }

    async fetchInjuryData(gameId) {
        // This would call injury report API
        return dataService.getInjuryData(gameId);
    }

    async fetchLineupData(gameId) {
        // This would call lineup API
        return dataService.getLineupData(gameId);
    }

    async fetchPlayerProps(gameId) {
        // This would call props API
        return dataService.getPlayerProps(gameId);
    }

    async fetchLineMovement(gameId) {
        // This would call line movement API
        return dataService.getLineMovement(gameId);
    }

    async fetchBetSplits(gameId) {
        // This would call bet splits API
        return dataService.getBetSplits(gameId);
    }
}

export const gameDataExtractor = new GameDataExtractor();