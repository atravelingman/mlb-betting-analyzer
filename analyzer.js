class MLBAnalyzer {
    constructor() {
        // Initialize services
        this.apiService = new ApiService();
        this.errorHandler = new ErrorHandler();
        this.loadingHandler = new LoadingHandler();

        // Initialize configuration
        this.config = config;
        this.teamStats = {};
        this.pitcherStats = {};
        this.updateHistory = [];
        this.previousStats = {};

        // Initialize event listeners
        this.initializeEventListeners();
    }

    async initializeEventListeners() {
        try {
            // Team selection listeners
            const homeTeamSelect = document.getElementById('homeTeamSelect');
            const awayTeamSelect = document.getElementById('awayTeamSelect');

            if (!this.errorHandler.validateElement('homeTeamSelect', 'Team Selection') ||
                !this.errorHandler.validateElement('awayTeamSelect', 'Team Selection')) {
                return;
            }

            // Initialize tables with default content
            this.initializeTables();

            // Add team selection event listeners
            homeTeamSelect.addEventListener('change', Utils.debounce(async () => {
                try {
                    if (homeTeamSelect.value) {
                        await this.handleTeamSelection('home', homeTeamSelect.value);
                    }
                } catch (error) {
                    this.errorHandler.handleApiError(error, 'Home team selection');
                }
            }, 300));

            awayTeamSelect.addEventListener('change', Utils.debounce(async () => {
                try {
                    if (awayTeamSelect.value) {
                        await this.handleTeamSelection('away', awayTeamSelect.value);
                    }
                } catch (error) {
                    this.errorHandler.handleApiError(error, 'Away team selection');
                }
            }, 300));

            // Update H2H when both teams are selected
            [homeTeamSelect, awayTeamSelect].forEach(select => {
                select.addEventListener('change', Utils.debounce(async () => {
                    try {
                        const homeTeam = homeTeamSelect.value;
                        const awayTeam = awayTeamSelect.value;
                        if (homeTeam && awayTeam) {
                            await this.fetchHeadToHead(homeTeam, awayTeam);
                        }
                    } catch (error) {
                        this.errorHandler.handleApiError(error, 'Head to head update');
                    }
                }, 300));
            });

            // Initialize teams
            await this.updateTeamStats();

            console.log('Event listeners initialized successfully');
        } catch (error) {
            this.errorHandler.logError(error, 'Event listener initialization');
            this.errorHandler.showMessage('Failed to initialize application', 5000, 'error');
        }
    }

    initializeTables() {
        ['home', 'away'].forEach(side => {
            const injuryTable = document.getElementById(`${side}InjuryTable`);
            const bullpenTable = document.getElementById(`${side}BullpenTable`);
            
            if (injuryTable) {
                injuryTable.innerHTML = '<tr><td colspan="4">Select a team to view injuries</td></tr>';
            }
            if (bullpenTable) {
                bullpenTable.innerHTML = '<tr><td colspan="4">Select a team to view bullpen status</td></tr>';
            }
        });

        // Initialize ballpark info
        ['lfDistance', 'cfDistance', 'rfDistance'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = 'N/A';
            }
        });
    }

    async handleTeamSelection(side, teamId) {
        this.loadingHandler.showLoading(`${side}TeamLoad`, `Loading ${side} team data...`);
        
        try {
            await Promise.all([
                this.fetchTeamStats(side),
                this.fetchBallparkInfo(),
                this.fetchInjuryReport(side),
                this.fetchBullpenStatus(side)
            ]);
        } catch (error) {
            this.errorHandler.handleApiError(error, `${side} team data load`);
        } finally {
            this.loadingHandler.hideLoading(`${side}TeamLoad`);
        }
    }

    async updateTeamStats() {
        const mlbTeams = [
            { id: "109", name: "Arizona Diamondbacks" },
            { id: "144", name: "Atlanta Braves" },
            { id: "110", name: "Baltimore Orioles" },
            { id: "111", name: "Boston Red Sox" },
            { id: "112", name: "Chicago Cubs" },
            { id: "145", name: "Chicago White Sox" },
            { id: "113", name: "Cincinnati Reds" },
            { id: "114", name: "Cleveland Guardians" },
            { id: "115", name: "Colorado Rockies" },
            { id: "116", name: "Detroit Tigers" },
            { id: "117", name: "Houston Astros" },
            { id: "118", name: "Kansas City Royals" },
            { id: "108", name: "Los Angeles Angels" },
            { id: "119", name: "Los Angeles Dodgers" },
            { id: "146", name: "Miami Marlins" },
            { id: "158", name: "Milwaukee Brewers" },
            { id: "142", name: "Minnesota Twins" },
            { id: "121", name: "New York Mets" },
            { id: "147", name: "New York Yankees" },
            { id: "133", name: "Oakland Athletics" },
            { id: "143", name: "Philadelphia Phillies" },
            { id: "134", name: "Pittsburgh Pirates" },
            { id: "135", name: "San Diego Padres" },
            { id: "137", name: "San Francisco Giants" },
            { id: "136", name: "Seattle Mariners" },
            { id: "138", name: "St. Louis Cardinals" },
            { id: "139", name: "Tampa Bay Rays" },
            { id: "140", name: "Texas Rangers" },
            { id: "141", name: "Toronto Blue Jays" },
            { id: "120", name: "Washington Nationals" }
        ];

        // Sort teams alphabetically
        mlbTeams.sort((a, b) => a.name.localeCompare(b.name));

        // Update dropdowns
        ['home', 'away'].forEach(side => {
            const select = document.getElementById(`${side}TeamSelect`);
            if (select) {
                select.innerHTML = '<option value="">Select a team...</option>' +
                    mlbTeams.map(team => 
                        `<option value="${team.id}">${team.name}</option>`
                    ).join('');
            }
        });

        // Store team data
        this.teamStats = mlbTeams.reduce((acc, team) => {
            acc[team.id] = {
                name: team.name,
                id: team.id,
                stats: null
            };
            return acc;
        }, {});

        console.log('Team stats initialized:', this.teamStats);
    }

    async fetchTeamStats(side) {
        try {
            const teamSelect = document.getElementById(`${side}TeamSelect`);
            if (!teamSelect?.value) {
                throw new Error(`No team selected for ${side}`);
            }

            const teamId = teamSelect.value;
            const teamName = teamSelect.options[teamSelect.selectedIndex]?.text;

            this.addUpdate('Fetching Stats', `Getting latest statistics for ${teamName}`);
            
            const statsData = await this.apiService.getTeamStats(teamId);
            const rosterData = await this.apiService.getTeamRoster(teamId);

            // Process hitting stats
            const hittingStats = this.processHittingStats(statsData);
            
            // Process pitching stats
            const pitchingStats = this.processPitchingStats(statsData);
            
            // Process pitcher stats
            const pitcherStats = await this.processPitcherStats(rosterData, teamId);

            const stats = {
                batting: hittingStats,
                pitching: pitchingStats,
                pitchers: pitcherStats
            };

            // Store and track stats
            this.teamStats[teamId] = {
                name: teamName,
                stats: stats
            };

            this.trackStatChanges({ id: teamId, side: side }, stats);
            this.addUpdate('Stats Updated', `Updated ${teamName} statistics`);

            // Update UI
            await this.updateTeamFields({ id: teamId, side: side }, stats);

            return stats;
        } catch (error) {
            this.errorHandler.handleApiError(error, 'Team stats fetch');
            return null;
        }
    }

    processHittingStats(statsData) {
        const hittingStats = statsData.stats.find(stat => 
            stat.group.displayName === 'hitting'
        )?.splits[0]?.stat || {};

        return {
            avg: Utils.formatNumber(hittingStats.avg, 3),
            obp: Utils.formatNumber(hittingStats.obp, 3),
            slg: Utils.formatNumber(hittingStats.slg, 3),
            iso: Utils.formatNumber((hittingStats.slg || 0) - (hittingStats.avg || 0), 3),
            babip: Utils.formatNumber(hittingStats.babip, 3)
        };
    }

    processPitchingStats(statsData) {
        const pitchingStats = statsData.stats.find(stat => 
            stat.group.displayName === 'pitching'
        )?.splits[0]?.stat || {};

        return {
            era: Utils.formatNumber(pitchingStats.era, 2),
            whip: Utils.formatNumber(pitchingStats.whip, 2)
        };
    }

    async processPitcherStats(rosterData, teamId) {
        const pitchers = rosterData.roster
            .filter(player => player.position.code === '1')
            .map(player => ({
                id: player.person.id,
                name: player.person.fullName
            }));

        const pitcherStats = await Promise.all(
            pitchers.map(async pitcher => {
                try {
                    const statsData = await this.apiService.getPitcherStats(pitcher.id);
                    const stats = statsData.stats[0]?.splits[0]?.stat || {};
                    
                    return {
                        ...pitcher,
                        stats: {
                            era: Utils.formatNumber(stats.era, 2),
                            whip: Utils.formatNumber(stats.whip, 2),
                            k9: Utils.formatNumber((stats.strikeOuts || 0) * 9 / (stats.inningsPitched || 1), 1),
                            bb9: Utils.formatNumber((stats.baseOnBalls || 0) * 9 / (stats.inningsPitched || 1), 1)
                        }
                    };
                } catch (error) {
                    console.error(`Error processing pitcher ${pitcher.name}:`, error);
                    return { ...pitcher, stats: null };
                }
            })
        );

        return pitcherStats.filter(p => p.stats !== null);
    }

    async fetchBallparkInfo() {
        try {
            const homeTeam = document.getElementById('homeTeamSelect')?.value;
            if (!homeTeam) {
                console.warn('No home team selected for ballpark info');
                return;
            }

            const data = await this.apiService.getVenueInfo(homeTeam);
            
            const elements = {
                'lfDistance': data?.dimensions?.leftField,
                'cfDistance': data?.dimensions?.centerField,
                'rfDistance': data?.dimensions?.rightField
            };

            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value || 'N/A';
                }
            });
        } catch (error) {
            this.errorHandler.handleApiError(error, 'Ballpark info fetch');
        }
    }

    async fetchInjuryReport(team) {
        try {
            const teamSelect = document.getElementById(`${team}TeamSelect`);
            const tableBody = document.getElementById(`${team}InjuryTable`);
            
            if (!this.errorHandler.validateElement(`${team}TeamSelect`, 'Injury Report') ||
                !this.errorHandler.validateElement(`${team}InjuryTable`, 'Injury Report')) {
                return;
            }

            const data = await this.apiService.getTeamInjuries(teamSelect.value);
            
            if (!data?.injuries?.length) {
                tableBody.innerHTML = '<tr><td colspan="4">No injuries reported</td></tr>';
                return;
            }

            tableBody.innerHTML = data.injuries.map(injury => `
                <tr>
                    <td>${injury?.player?.fullName || 'Unknown'}</td>
                    <td class="${this.getInjuryStatusClass(injury?.status)}">${injury?.status || 'Unknown'}</td>
                    <td>${this.calculateImpact(injury) || 'N/A'}</td>
                    <td>${injury?.player?.primaryPosition?.name || 'Unknown'}</td>
                </tr>
            `).join('');
        } catch (error) {
            this.errorHandler.handleApiError(error, 'Injury report fetch');
            const tableBody = document.getElementById(`${team}InjuryTable`);
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="4">Error loading injury report</td></tr>';
            }
        }
    }

    async fetchBullpenStatus(team) {
        try {
            const teamSelect = document.getElementById(`${team}TeamSelect`);
            const tableBody = document.getElementById(`${team}BullpenTable`);
            
            if (!this.errorHandler.validateElement(`${team}TeamSelect`, 'Bullpen Status') ||
                !this.errorHandler.validateElement(`${team}BullpenTable`, 'Bullpen Status')) {
                return;
            }

            const data = await this.apiService.makeApiCall(
                `${this.config.api.endpoints.teams}/${teamSelect.value}/stats/pitching?group=bullpen&season=2024&gameType=R&lastGames=3`
            );

            if (!data?.stats?.length) {
                tableBody.innerHTML = '<tr><td colspan="4">No bullpen data available</td></tr>';
                return;
            }

            tableBody.innerHTML = data.stats.map(pitcher => {
                const fatigue = this.calculatePitcherFatigue(pitcher);
                return `
                    <tr>
                        <td>${pitcher?.name || 'Unknown'}</td>
                        <td>${(pitcher?.recentGames || []).join(', ') || 'N/A'}</td>
                        <td><span class="fatigue-indicator" style="background-color: ${fatigue?.color || '#gray'}"></span>${fatigue?.level || 'Unknown'}</td>
                        <td>${fatigue?.available ? 'Yes' : 'No'}</td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            this.errorHandler.handleApiError(error, 'Bullpen status fetch');
            const tableBody = document.getElementById(`${team}BullpenTable`);
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="4">Error loading bullpen status</td></tr>';
            }
        }
    }

    async fetchHeadToHead(homeTeam, awayTeam) {
        try {
            if (!homeTeam || !awayTeam) {
                console.warn('Missing team IDs for head-to-head comparison');
                this.updateH2HDisplay('0-0', '<tr><td colspan="3">No data available</td></tr>');
                return;
            }

            const data = await this.apiService.getHeadToHead(homeTeam, awayTeam);

            if (!data?.dates?.length) {
                this.updateH2HDisplay('0-0', '<tr><td colspan="3">No recent games found</td></tr>');
                return;
            }

            const record = this.calculateH2HRecord(data.dates, homeTeam);
            this.updateH2HDisplay(
                `${record.wins}-${record.losses}`,
                this.formatLastGames(data.dates.slice(-5))
            );
        } catch (error) {
            this.errorHandler.handleApiError(error, 'Head-to-head fetch');
            this.updateH2HDisplay('Error', '<tr><td colspan="3">Error loading head-to-head data</td></tr>');
        }
    }

    async analyzeMatchup() {
        try {
            const formData = {
                homeTeam: document.getElementById('homeTeamSelect')?.value,
                awayTeam: document.getElementById('awayTeamSelect')?.value,
                marketSpread: parseFloat(document.getElementById('marketSpread')?.value),
                marketTotal: parseFloat(document.getElementById('marketTotal')?.value),
                weather: document.getElementById('weather')?.value || 'normal'
            };

            const validation = this.errorHandler.validateFormData(formData);
            if (!validation.isValid) {
                this.errorHandler.handleValidationError(validation.errors);
                return;
            }

            const homeTeam = this.getTeamData('home');
            const awayTeam = this.getTeamData('away');

            const results = this.findValue(
                homeTeam,
                awayTeam,
                formData.marketSpread,
                formData.marketTotal,
                formData.weather
            );

            if (results) {
                updateUIWithResults(results);
                const lastUpdateElement = document.getElementById('lastUpdate');
                if (lastUpdateElement) {
                    lastUpdateElement.textContent = new Date().toLocaleString();
                }
            }
        } catch (error) {
            this.errorHandler.handleApiError(error, 'Matchup analysis');
        }
    }

    // ... rest of the methods remain the same ...
}

// Initialize on DOM load
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.analyzer = new MLBAnalyzer();
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MLBAnalyzer };
} 