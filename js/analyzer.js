import { dataService } from './data-service.js';
import { Utils } from './utils.js';
import { API_CONFIG } from './api-config.js';

export class MLBAnalyzer {
    constructor() {
        // Initialize services
        this.dataService = new DataService();
        
        // Cache DOM elements
        this.elements = {
            homeTeamSelect: document.getElementById('homeTeamSelect'),
            awayTeamSelect: document.getElementById('awayTeamSelect'),
            homePitcherSelect: document.getElementById('homePitcherSelect'),
            awayPitcherSelect: document.getElementById('awayPitcherSelect'),
            results: document.getElementById('results')
        };
        
        // Initialize state
        this.teamStats = {};
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Load initial data
        this.loadTeams();
    }

    initializeEventListeners() {
        // Team selection handlers
        this.elements.homeTeamSelect.addEventListener('change', () => this.handleTeamSelection('home'));
        this.elements.awayTeamSelect.addEventListener('change', () => this.handleTeamSelection('away'));
        
        // Add loading indicator methods
        this.showLoading = () => {
            // Add loading indicator logic here
            console.log('Loading...');
        };
        
        this.hideLoading = () => {
            // Remove loading indicator logic here
            console.log('Loading complete');
        };
        
        this.showError = (message) => {
            console.error(message);
            // Add error display logic here
        };
    }

    async loadTeams() {
        try {
            this.showLoading();
            const teams = await this.dataService.getTeams();
            
            if (!teams || teams.length === 0) {
                throw new Error('No teams data available');
            }

            // Sort teams alphabetically
            teams.sort((a, b) => a.name.localeCompare(b.name));
            
            // Create dropdown options
            const options = teams.map(team => 
                `<option value="${team.id}">${team.name}</option>`
            ).join('');

            // Update both dropdowns
            this.elements.homeTeamSelect.innerHTML = '<option value="">Select Team...</option>' + options;
            this.elements.awayTeamSelect.innerHTML = '<option value="">Select Team...</option>' + options;
            
            console.log('Teams loaded successfully:', teams.length, 'teams');
        } catch (error) {
            console.error('Error loading teams:', error);
            this.showError('Error loading teams: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async handleTeamSelection(side) {
        const teamSelect = this.elements[`${side}TeamSelect`];
        
        if (!teamSelect.value) {
            this.clearTeamStats(side);
            return;
        }

        const loadingIndicator = document.getElementById(`${side}Loading`);
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }

        try {
            this.showLoading();
            const teamStats = await this.dataService.getTeamStats(teamSelect.value);
            
            // Update the UI with the team stats
            const prefix = side === 'home' ? 'home' : 'away';
            
            // Update batting stats
            document.getElementById(`${prefix}AVG`).value = teamStats.batting.avg;
            document.getElementById(`${prefix}OBP`).value = teamStats.batting.obp;
            document.getElementById(`${prefix}SLG`).value = teamStats.batting.slg;
            document.getElementById(`${prefix}ISO`).value = teamStats.batting.iso;
            document.getElementById(`${prefix}BABIP`).value = teamStats.batting.babip;
            
            // Update pitching stats
            document.getElementById(`${prefix}ERA`).value = teamStats.pitching.era;
            document.getElementById(`${prefix}WHIP`).value = teamStats.pitching.whip;
            document.getElementById(`${prefix}K9`).value = teamStats.pitching.k9;
            document.getElementById(`${prefix}BB9`).value = teamStats.pitching.bb9;

            // Store the stats for later use
            this.teamStats[teamSelect.value] = {
                name: teamSelect.options[teamSelect.selectedIndex].text,
                stats: teamStats
            };

            console.log(`Updated ${side} team stats:`, teamStats);
        } catch (error) {
            console.error(`Error loading ${side} team data:`, error);
            this.showError(`Error loading ${side} team data: ${error.message}`);
            this.clearTeamStats(side);
        } finally {
            this.hideLoading();
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
    }

    async handlePitcherSelection(side) {
        const pitcherSelect = this.elements[`${side}PitcherSelect`];
        
        if (!pitcherSelect.value) {
            this.clearPitcherStats(side);
            return;
        }

        try {
            this.showLoading();
            const stats = await dataService.getPitcherStats(pitcherSelect.value);
            this.updatePitcherStats(side, stats);
        } catch (error) {
            this.showError(`Error loading ${side} pitcher stats: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    async loadRoster(teamId) {
        try {
            const roster = await dataService.loadRoster(teamId);
            if (!roster || roster.length === 0) {
                throw new Error('No roster data available');
            }
            return roster;
        } catch (error) {
            console.error('Error loading roster:', error);
            this.showError('Error loading roster: ' + error.message);
            return [];
        }
    }

    updateTeamStats(side, stats) {
        const prefix = side === 'home' ? 'home' : 'away';
        
        // Update batting stats
        document.getElementById(`${prefix}AVG`).value = stats.batting.avg;
        document.getElementById(`${prefix}OBP`).value = stats.batting.obp;
        document.getElementById(`${prefix}SLG`).value = stats.batting.slg;
        document.getElementById(`${prefix}ISO`).value = stats.batting.iso;
        document.getElementById(`${prefix}BABIP`).value = stats.batting.babip;
        
        // Update pitching stats
        document.getElementById(`${prefix}ERA`).value = stats.pitching.era;
        document.getElementById(`${prefix}WHIP`).value = stats.pitching.whip;
    }

    updatePitcherSelect(side, roster) {
        const select = this.elements[`${side}PitcherSelect`];
        select.innerHTML = '<option value="">Select Pitcher...</option>' +
            roster.map(player => 
                `<option value="${player.person.id}">${player.person.fullName}</option>`
            ).join('');
    }

    updatePitcherStats(side, stats) {
        const prefix = side === 'home' ? 'home' : 'away';
        
        document.getElementById(`${prefix}StarterERA`).value = stats.aggregate.era;
        document.getElementById(`${prefix}StarterWHIP`).value = stats.aggregate.whip;
        document.getElementById(`${prefix}StarterK9`).value = stats.aggregate.k9;
        document.getElementById(`${prefix}StarterBB9`).value = stats.aggregate.bb9;
    }

    async updateBallparkInfo(teamId) {
        try {
            const ballpark = await dataService.getBallparkInfo(teamId);
            document.getElementById('lfDistance').textContent = ballpark.dimensions.leftField;
            document.getElementById('cfDistance').textContent = ballpark.dimensions.centerField;
            document.getElementById('rfDistance').textContent = ballpark.dimensions.rightField;
        } catch (error) {
            console.error('Error loading ballpark info:', error);
        }
    }

    clearTeamStats(side) {
        const prefix = side === 'home' ? 'home' : 'away';
        const stats = ['AVG', 'OBP', 'SLG', 'ISO', 'BABIP', 'ERA', 'WHIP'];
        stats.forEach(stat => {
            document.getElementById(`${prefix}${stat}`).value = '';
        });
        this.clearPitcherStats(side);
    }

    clearPitcherStats(side) {
        const prefix = side === 'home' ? 'home' : 'away';
        const stats = ['StarterERA', 'StarterWHIP', 'StarterK9', 'StarterBB9'];
        stats.forEach(stat => {
            document.getElementById(`${prefix}${stat}`).value = '';
        });
    }

    async analyzeMatchup() {
        if (!this.validateInputs()) {
            return;
        }

        try {
            this.showLoading();
            
            const homeTeamId = this.elements.homeTeamSelect.value;
            const awayTeamId = this.elements.awayTeamSelect.value;
            const homePitcherId = this.elements.homePitcherSelect.value;
            const awayPitcherId = this.elements.awayPitcherSelect.value;
            const weather = this.elements.weatherSelect.value;

            // Fetch all required data
            const [
                homeTeamStats,
                awayTeamStats,
                homePitcherStats,
                awayPitcherStats,
                ballparkInfo
            ] = await Promise.all([
                dataService.getTeamStats(homeTeamId),
                dataService.getTeamStats(awayTeamId),
                dataService.getPitcherStats(homePitcherId),
                dataService.getPitcherStats(awayPitcherId),
                dataService.getBallparkInfo(homeTeamId)
            ]);

            // Calculate advantages
            const advantages = this.calculateAdvantages(
                homeTeamStats, awayTeamStats,
                homePitcherStats, awayPitcherStats,
                weather, ballparkInfo
            );

            // Generate insights
            const insights = this.generateInsights(advantages);

            // Display results
            this.displayResults(advantages, insights);
            this.updateLastUpdate();

        } catch (error) {
            this.showError('Error analyzing matchup: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    validateInputs() {
        const requiredSelections = [
            { element: this.elements.homeTeamSelect, name: 'Home Team' },
            { element: this.elements.awayTeamSelect, name: 'Away Team' },
            { element: this.elements.homePitcherSelect, name: 'Home Pitcher' },
            { element: this.elements.awayPitcherSelect, name: 'Away Pitcher' }
        ];

        for (const { element, name } of requiredSelections) {
            if (!element.value) {
                this.showError(`Please select ${name}`);
                return false;
            }
        }

        if (this.elements.homeTeamSelect.value === this.elements.awayTeamSelect.value) {
            this.showError('Home and Away teams cannot be the same');
            return false;
        }

        return true;
    }

    calculateAdvantages(homeTeam, awayTeam, homePitcher, awayPitcher, weather, ballpark) {
        const advantages = {
            hitting: this.calculateHittingAdvantage(homeTeam, awayTeam),
            pitching: this.calculatePitchingAdvantage(homePitcher, awayPitcher),
            weather: this.calculateWeatherImpact(weather, ballpark),
            overall: 0
        };

        // Calculate overall advantage
        advantages.overall = (
            advantages.hitting * 0.4 +
            advantages.pitching * 0.4 +
            advantages.weather * 0.2
        );

        return advantages;
    }

    calculateHittingAdvantage(homeTeam, awayTeam) {
        const homeOPS = parseFloat(homeTeam.batting.ops);
        const awayOPS = parseFloat(awayTeam.batting.ops);
        const leagueAverageOPS = 0.728; // MLB average

        const homeAdvantage = ((homeOPS - leagueAverageOPS) / leagueAverageOPS) * 100;
        const awayAdvantage = ((awayOPS - leagueAverageOPS) / leagueAverageOPS) * 100;

        return homeAdvantage - awayAdvantage;
    }

    calculatePitchingAdvantage(homePitcher, awayPitcher) {
        const homeERA = parseFloat(homePitcher.aggregate.era);
        const awayERA = parseFloat(awayPitcher.aggregate.era);
        const leagueAverageERA = 4.25; // MLB average

        const homeAdvantage = ((leagueAverageERA - homeERA) / leagueAverageERA) * 100;
        const awayAdvantage = ((leagueAverageERA - awayERA) / leagueAverageERA) * 100;

        return homeAdvantage - awayAdvantage;
    }

    calculateWeatherImpact(weather, ballpark) {
        const weatherFactors = {
            normal: 0,
            wind_out: 15,
            wind_in: -15,
            rain: -10,
            hot: 10,
            cold: -10,
            dome: 0
        };

        return weatherFactors[weather] || 0;
    }

    generateInsights(advantages) {
        const insights = [];
        const homeTeamName = this.elements.homeTeamSelect.options[this.elements.homeTeamSelect.selectedIndex].text;
        const awayTeamName = this.elements.awayTeamSelect.options[this.elements.awayTeamSelect.selectedIndex].text;

        // Hitting insights
        if (Math.abs(advantages.hitting) > 10) {
            const betterTeam = advantages.hitting > 0 ? homeTeamName : awayTeamName;
            insights.push(`${betterTeam} has a significant offensive advantage`);
        }

        // Pitching insights
        if (Math.abs(advantages.pitching) > 10) {
            const betterTeam = advantages.pitching > 0 ? homeTeamName : awayTeamName;
            insights.push(`${betterTeam} has a significant pitching advantage`);
        }

        // Weather insights
        if (Math.abs(advantages.weather) > 5) {
            const impact = advantages.weather > 0 ? 'favorable' : 'unfavorable';
            insights.push(`Weather conditions are ${impact} for scoring`);
        }

        // Overall advantage
        if (Math.abs(advantages.overall) > 10) {
            const favoredTeam = advantages.overall > 0 ? homeTeamName : awayTeamName;
            insights.push(`${favoredTeam} has a significant overall advantage`);
        }

        return insights;
    }

    displayResults(advantages, insights) {
        const homeTeamName = this.elements.homeTeamSelect.options[this.elements.homeTeamSelect.selectedIndex].text;
        const awayTeamName = this.elements.awayTeamSelect.options[this.elements.awayTeamSelect.selectedIndex].text;

        const resultsHtml = `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="fas fa-chart-bar me-2"></i>Analysis Results
                    </h5>
                </div>
                <div class="card-body">
                    <div class="team-comparison mb-4">
                        <h6>${homeTeamName}</h6>
                        <span class="vs-badge">VS</span>
                        <h6>${awayTeamName}</h6>
                    </div>
                    
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <h6 class="mb-3">Advantages</h6>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <tr>
                                        <th>Hitting</th>
                                        <td class="${advantages.hitting > 0 ? 'text-success' : 'text-danger'}">
                                            ${Utils.formatNumber(Math.abs(advantages.hitting), 1)}% ${advantages.hitting > 0 ? 'Home' : 'Away'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Pitching</th>
                                        <td class="${advantages.pitching > 0 ? 'text-success' : 'text-danger'}">
                                            ${Utils.formatNumber(Math.abs(advantages.pitching), 1)}% ${advantages.pitching > 0 ? 'Home' : 'Away'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Weather Impact</th>
                                        <td class="${advantages.weather > 0 ? 'text-success' : 'text-danger'}">
                                            ${Utils.formatNumber(Math.abs(advantages.weather), 1)}%
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Overall</th>
                                        <td class="${advantages.overall > 0 ? 'text-success' : 'text-danger'}">
                                            ${Utils.formatNumber(Math.abs(advantages.overall), 1)}% ${advantages.overall > 0 ? 'Home' : 'Away'}
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <h6 class="mb-3">Key Insights</h6>
                            <ul class="list-unstyled">
                                ${insights.map(insight => `
                                    <li class="mb-2">
                                        <i class="fas fa-check-circle text-success me-2"></i>${insight}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.elements.results.innerHTML = resultsHtml;
    }
} 