/**
 * MLB Game Selector Component
 * Handles game selection and triggers comprehensive data extraction
 */

import { gameDataExtractor } from './game-data-extractor.js';
import { dataService } from './data-service.js';
import { Utils } from './utils.js';

export class GameSelector {
    constructor() {
        this.selectedGameId = null;
        this.selectedDate = null;
        this.gameData = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Date picker listener
        const datePicker = document.getElementById('gameDatePicker');
        if (datePicker) {
            datePicker.addEventListener('change', (e) => {
                this.handleDateSelection(e.target.value);
            });
        }

        // Game selector listener
        const gameSelect = document.getElementById('gameSelect');
        if (gameSelect) {
            gameSelect.addEventListener('change', (e) => {
                this.handleGameSelection(e.target.value);
            });
        }

        // Initialize with today's date
        this.initializeDefaultDate();
    }

    initializeDefaultDate() {
        const datePicker = document.getElementById('gameDatePicker');
        if (datePicker) {
            const today = new Date().toISOString().split('T')[0];
            datePicker.value = today;
            this.handleDateSelection(today);
        }
    }

    async handleDateSelection(date) {
        this.selectedDate = date;
        this.selectedGameId = null;
        
        try {
            this.showLoading('Loading games for selected date...');
            const games = await dataService.getGamesByDate(date);
            this.populateGameSelector(games);
            this.clearGameData();
        } catch (error) {
            console.error('Error loading games:', error);
            this.showError('Error loading games for selected date');
        } finally {
            this.hideLoading();
        }
    }

    async handleGameSelection(gameId) {
        if (!gameId) {
            this.clearGameData();
            return;
        }

        this.selectedGameId = gameId;
        
        try {
            this.showLoading('Extracting comprehensive game data...');
            
            // Extract all comprehensive game data
            this.gameData = await gameDataExtractor.extractGameData(gameId, this.selectedDate);
            
            // Populate all the UI fields with extracted data
            await this.populateGameDataFields(this.gameData);
            
            // Display the extracted data for verification
            this.displayExtractedData(this.gameData);
            
            console.log('Complete game data extracted:', this.gameData);
            
        } catch (error) {
            console.error('Error extracting game data:', error);
            this.showError('Error extracting game data: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    populateGameSelector(games) {
        const gameSelect = document.getElementById('gameSelect');
        if (!gameSelect) return;

        if (!games || games.length === 0) {
            gameSelect.innerHTML = '<option value="">No games available for this date</option>';
            return;
        }

        const options = games.map(game => {
            const awayTeam = game.teams?.away?.name || 'Away Team';
            const homeTeam = game.teams?.home?.name || 'Home Team';
            const gameTime = game.gameDate ? new Date(game.gameDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBD';
            
            return `<option value="${game.gamePk}">${awayTeam} @ ${homeTeam} - ${gameTime}</option>`;
        }).join('');

        gameSelect.innerHTML = '<option value="">Select a game...</option>' + options;
    }

    async populateGameDataFields(gameData) {
        // 1. Game Date & Time
        this.setFieldValue('gameDateTime', this.formatDisplayDateTime(gameData.date_time_et));
        this.setFieldValue('gameId', gameData.game_id);

        // 2. Teams
        this.setFieldValue('awayTeamName', `${gameData.teams.away.name} (${gameData.teams.away.abbreviation})`);
        this.setFieldValue('homeTeamName', `${gameData.teams.home.name} (${gameData.teams.home.abbreviation})`);

        // 3. Starting Pitchers
        this.setFieldValue('awayPitcher', gameData.pitchers.away);
        this.setFieldValue('homePitcher', gameData.pitchers.home);

        // 4. Moneyline Odds
        this.setFieldValue('awayMoneyline', this.formatOdds(gameData.odds?.moneyline?.away));
        this.setFieldValue('homeMoneyline', this.formatOdds(gameData.odds?.moneyline?.home));

        // 5. Run Line
        this.setFieldValue('runLineValue', gameData.odds?.runline?.value);
        this.setFieldValue('runLineAwayOdds', this.formatOdds(gameData.odds?.runline?.away_odds));
        this.setFieldValue('runLineHomeOdds', this.formatOdds(gameData.odds?.runline?.home_odds));

        // 6. Total Runs
        this.setFieldValue('totalLine', gameData.odds?.total?.line);
        this.setFieldValue('overOdds', this.formatOdds(gameData.odds?.total?.over_odds));
        this.setFieldValue('underOdds', this.formatOdds(gameData.odds?.total?.under_odds));

        // 7. Implied Win Probabilities
        this.setFieldValue('awayWinProb', this.formatPercentage(gameData.probabilities?.ml_away));
        this.setFieldValue('homeWinProb', this.formatPercentage(gameData.probabilities?.ml_home));

        // 8. Run Line Implied Probabilities
        this.setFieldValue('runLineAwayProb', this.formatPercentage(gameData.probabilities?.rl_away));
        this.setFieldValue('runLineHomeProb', this.formatPercentage(gameData.probabilities?.rl_home));

        // 9. Over/Under Implied Probabilities
        this.setFieldValue('overProb', this.formatPercentage(gameData.probabilities?.over));
        this.setFieldValue('underProb', this.formatPercentage(gameData.probabilities?.under));

        // 10. Line Movement
        this.populateLineMovement(gameData.line_movement);

        // 11. Bet Splits
        this.populateBetSplits(gameData.bet_splits);

        // 12. Weather & Ballpark
        this.populateWeatherAndBallpark(gameData.weather);

        // 13. Injury/Lineup Updates
        this.populateInjuryUpdates(gameData.injuries);

        // 14. Win Probability Model
        this.populateModelOutput(gameData.model);

        // 15. Player Props
        this.populatePlayerProps(gameData.props);
    }

    populateLineMovement(lineMovement) {
        if (!lineMovement) return;

        // Moneyline movement
        this.setFieldValue('mlAwayOpen', this.formatOdds(lineMovement.moneyline?.away?.open));
        this.setFieldValue('mlAwayCurrent', this.formatOdds(lineMovement.moneyline?.away?.current));
        this.setFieldValue('mlHomeOpen', this.formatOdds(lineMovement.moneyline?.home?.open));
        this.setFieldValue('mlHomeCurrent', this.formatOdds(lineMovement.moneyline?.home?.current));

        // Run line movement
        this.setFieldValue('rlValueOpen', lineMovement.runline?.value_open);
        this.setFieldValue('rlValueCurrent', lineMovement.runline?.value_current);
        this.setFieldValue('rlOddsOpen', this.formatOdds(lineMovement.runline?.odds_open));
        this.setFieldValue('rlOddsCurrent', this.formatOdds(lineMovement.runline?.odds_current));

        // Total movement
        this.setFieldValue('totalOpen', lineMovement.total?.line_open);
        this.setFieldValue('totalCurrent', lineMovement.total?.line_current);
        this.setFieldValue('overOpen', this.formatOdds(lineMovement.total?.over_open));
        this.setFieldValue('overCurrent', this.formatOdds(lineMovement.total?.over_current));
    }

    populateBetSplits(betSplits) {
        if (!betSplits) return;

        // Moneyline splits
        this.setFieldValue('mlPublicAway', this.formatPercentage(betSplits.moneyline?.public_away));
        this.setFieldValue('mlPublicHome', this.formatPercentage(betSplits.moneyline?.public_home));
        this.setFieldValue('mlSharpAway', this.formatPercentage(betSplits.moneyline?.sharp_away));
        this.setFieldValue('mlSharpHome', this.formatPercentage(betSplits.moneyline?.sharp_home));

        // Run line splits
        this.setFieldValue('rlPublicAway', this.formatPercentage(betSplits.runline?.public_away));
        this.setFieldValue('rlPublicHome', this.formatPercentage(betSplits.runline?.public_home));
        this.setFieldValue('rlSharpAway', this.formatPercentage(betSplits.runline?.sharp_away));
        this.setFieldValue('rlSharpHome', this.formatPercentage(betSplits.runline?.sharp_home));

        // Total splits
        this.setFieldValue('totalPublicOver', this.formatPercentage(betSplits.total?.public_over));
        this.setFieldValue('totalPublicUnder', this.formatPercentage(betSplits.total?.public_under));
        this.setFieldValue('totalSharpOver', this.formatPercentage(betSplits.total?.sharp_over));
        this.setFieldValue('totalSharpUnder', this.formatPercentage(betSplits.total?.sharp_under));
    }

    populateWeatherAndBallpark(weather) {
        if (!weather) return;

        this.setFieldValue('temperature', weather.temperature ? `${weather.temperature}°F` : 'N/A');
        this.setFieldValue('windSpeed', weather.wind_speed ? `${weather.wind_speed} mph` : 'N/A');
        this.setFieldValue('windDirection', weather.wind_direction || 'N/A');
        this.setFieldValue('humidity', weather.humidity ? `${weather.humidity}%` : 'N/A');
        this.setFieldValue('conditions', weather.conditions || 'N/A');

        // Ballpark info
        if (weather.ballpark) {
            this.setFieldValue('ballparkName', weather.ballpark.name);
            this.setFieldValue('parkFactor', weather.ballpark.park_factor);
            this.setFieldValue('leftFieldDistance', weather.ballpark.dimensions?.left_field || 'N/A');
            this.setFieldValue('centerFieldDistance', weather.ballpark.dimensions?.center_field || 'N/A');
            this.setFieldValue('rightFieldDistance', weather.ballpark.dimensions?.right_field || 'N/A');
        }
    }

    populateInjuryUpdates(injuries) {
        const container = document.getElementById('injuryUpdates');
        if (!container) return;

        if (!injuries || injuries.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No recent injury or lineup updates</div>';
            return;
        }

        const injuryHtml = injuries.map(update => `
            <div class="alert alert-${update.type === 'injury' ? 'warning' : 'info'} mb-2">
                <strong>${update.player}</strong> - 
                ${update.type === 'injury' ? `${update.status}: ${update.description}` : update.change}
                ${update.timestamp ? `<small class="text-muted"> (${new Date(update.timestamp).toLocaleString()})</small>` : ''}
            </div>
        `).join('');

        container.innerHTML = injuryHtml;
    }

    populateModelOutput(model) {
        if (!model) return;

        this.setFieldValue('modelAwayWinPct', this.formatPercentage(model.away_win_pct));
        this.setFieldValue('modelHomeWinPct', this.formatPercentage(model.home_win_pct));
        this.setFieldValue('modelConfidence', model.confidence);
        this.setFieldValue('modelName', model.model_name);
    }

    populatePlayerProps(props) {
        const container = document.getElementById('playerProps');
        if (!container) return;

        if (!props || props.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No player props available</div>';
            return;
        }

        const propsHtml = `
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Prop Type</th>
                            <th>Line</th>
                            <th>Over Odds</th>
                            <th>Under Odds</th>
                            <th>Over %</th>
                            <th>Under %</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${props.map(prop => `
                            <tr>
                                <td>${prop.player}</td>
                                <td>${prop.type}</td>
                                <td>${prop.line || 'N/A'}</td>
                                <td>${this.formatOdds(prop.over_odds)}</td>
                                <td>${this.formatOdds(prop.under_odds)}</td>
                                <td>${this.formatPercentage(prop.implied_prob_over)}</td>
                                <td>${this.formatPercentage(prop.implied_prob_under)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = propsHtml;
    }

    displayExtractedData(gameData) {
        const container = document.getElementById('extractedDataDisplay');
        if (!container) return;

        const jsonString = JSON.stringify(gameData, null, 2);
        container.innerHTML = `
            <div class="card mt-4">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="fas fa-code me-2"></i>Extracted Game Data (JSON)
                    </h5>
                </div>
                <div class="card-body">
                    <pre><code class="language-json">${jsonString}</code></pre>
                </div>
            </div>
        `;
    }

    // Utility methods
    setFieldValue(fieldId, value) {
        const element = document.getElementById(fieldId);
        if (element) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = value !== null && value !== undefined ? value : 'N/A';
            } else {
                element.textContent = value !== null && value !== undefined ? value : 'N/A';
            }
        }
    }

    formatOdds(odds) {
        if (odds === null || odds === undefined) return 'N/A';
        return odds > 0 ? `+${odds}` : `${odds}`;
    }

    formatPercentage(value) {
        if (value === null || value === undefined) return 'N/A';
        return `${value}%`;
    }

    formatDisplayDateTime(dateTime) {
        if (!dateTime) return 'N/A';
        try {
            const date = new Date(dateTime);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
            });
        } catch (error) {
            return 'N/A';
        }
    }

    clearGameData() {
        this.gameData = null;
        // Clear all data fields
        const fieldsTolear = [
            'gameDateTime', 'gameId', 'awayTeamName', 'homeTeamName',
            'awayPitcher', 'homePitcher', 'awayMoneyline', 'homeMoneyline',
            'runLineValue', 'totalLine', 'awayWinProb', 'homeWinProb'
        ];
        
        fieldsTolear.forEach(fieldId => this.setFieldValue(fieldId, ''));
        
        // Clear containers
        ['injuryUpdates', 'playerProps', 'extractedDataDisplay'].forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) container.innerHTML = '';
        });
    }

    showLoading(message = 'Loading...') {
        console.log(message);
        // Implement loading indicator
    }

    hideLoading() {
        // Hide loading indicator
    }

    showError(message) {
        console.error(message);
        // Implement error display
    }

    // Public API methods
    getSelectedGameData() {
        return this.gameData;
    }

    getFormattedGameData() {
        if (!this.gameData) return null;
        
        // Return the data in the exact format specified in the requirements
        return {
            game_id: this.gameData.game_id,
            date_time_et: this.gameData.date_time_et,
            teams: {
                away: this.gameData.teams.away.abbreviation,
                home: this.gameData.teams.home.abbreviation
            },
            pitchers: {
                away: this.gameData.pitchers.away,
                home: this.gameData.pitchers.home
            },
            odds: this.gameData.odds,
            probabilities: this.gameData.probabilities,
            line_movement: this.gameData.line_movement,
            bet_splits: this.gameData.bet_splits,
            weather: this.gameData.weather,
            injuries: this.gameData.injuries,
            model: this.gameData.model,
            props: this.gameData.props
        };
    }
}

export const gameSelector = new GameSelector();