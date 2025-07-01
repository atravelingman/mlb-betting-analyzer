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
                this.updateUIWithResults(results);
                const lastUpdateElement = document.getElementById('lastUpdate');
                if (lastUpdateElement) {
                    lastUpdateElement.textContent = new Date().toLocaleString();
                }
            }
        } catch (error) {
            this.errorHandler.handleApiError(error, 'Matchup analysis');
        }
    }

    // Missing methods implementation

    async updateTeamFields(team, stats) {
        try {
            const side = team.side;
            
            // Update batting stats
            const battingStats = stats.batting || {};
            document.getElementById(`${side}AVG`).value = battingStats.avg || '0.000';
            document.getElementById(`${side}OBP`).value = battingStats.obp || '0.000';
            document.getElementById(`${side}SLG`).value = battingStats.slg || '0.000';
            document.getElementById(`${side}ISO`).value = battingStats.iso || '0.000';
            document.getElementById(`${side}BABIP`).value = battingStats.babip || '0.000';

            // Update pitching stats
            const pitchingStats = stats.pitching || {};
            document.getElementById(`${side}ERA`).value = pitchingStats.era || '0.00';
            document.getElementById(`${side}WHIP`).value = pitchingStats.whip || '0.00';

            // Update pitcher dropdown
            const pitcherSelect = document.getElementById(`${side}PitcherSelect`);
            if (pitcherSelect && stats.pitchers) {
                pitcherSelect.innerHTML = '<option value="">Select pitcher...</option>' +
                    stats.pitchers.map(pitcher => 
                        `<option value="${pitcher.id}">${pitcher.name}</option>`
                    ).join('');

                // Add event listener for pitcher selection
                pitcherSelect.addEventListener('change', () => {
                    const selectedPitcher = stats.pitchers.find(p => p.id == pitcherSelect.value);
                    if (selectedPitcher?.stats) {
                        document.getElementById(`${side}StarterERA`).value = selectedPitcher.stats.era || '0.00';
                        document.getElementById(`${side}StarterWHIP`).value = selectedPitcher.stats.whip || '0.00';
                        document.getElementById(`${side}StarterK9`).value = selectedPitcher.stats.k9 || '0.0';
                        document.getElementById(`${side}StarterBB9`).value = selectedPitcher.stats.bb9 || '0.0';
                    }
                });
            }

        } catch (error) {
            console.error('Error updating team fields:', error);
            this.errorHandler.handleApiError(error, 'Team fields update');
        }
    }

    getTeamData(side) {
        try {
            const teamSelect = document.getElementById(`${side}TeamSelect`);
            const teamId = teamSelect?.value;
            
            if (!teamId) {
                throw new Error(`No ${side} team selected`);
            }

            return this.teamStats[teamId] || null;
        } catch (error) {
            console.error(`Error getting ${side} team data:`, error);
            return null;
        }
    }

    findValue(homeTeam, awayTeam, marketSpread, marketTotal, weather) {
        try {
            if (!homeTeam?.stats || !awayTeam?.stats) {
                throw new Error('Team statistics not available');
            }

            // Calculate offensive and pitching advantages
            const homeOffensive = parseFloat(homeTeam.stats.batting.obp) + parseFloat(homeTeam.stats.batting.slg);
            const awayOffensive = parseFloat(awayTeam.stats.batting.obp) + parseFloat(awayTeam.stats.batting.slg);
            const homePitching = parseFloat(homeTeam.stats.pitching.era);
            const awayPitching = parseFloat(awayTeam.stats.pitching.era);

            const offensiveAdvantage = homeOffensive - awayOffensive;
            const pitchingAdvantage = awayPitching - homePitching;

            // Calculate projected runs with weather adjustment
            const weatherFactor = config.weather[weather] || config.weather.normal;
            const projectedHomeRuns = (homeOffensive * 4.5 + (pitchingAdvantage * 0.5)) * weatherFactor.runs;
            const projectedAwayRuns = (awayOffensive * 4.5 + (-pitchingAdvantage * 0.5)) * weatherFactor.runs;
            const projectedTotal = projectedHomeRuns + projectedAwayRuns;
            const projectedSpread = projectedHomeRuns - projectedAwayRuns;

            // Calculate value
            const spreadValue = Math.abs(projectedSpread - marketSpread);
            const totalValue = Math.abs(projectedTotal - marketTotal);

            return {
                homeTeam: homeTeam.name,
                awayTeam: awayTeam.name,
                projectedHomeRuns: projectedHomeRuns.toFixed(1),
                projectedAwayRuns: projectedAwayRuns.toFixed(1),
                projectedTotal: projectedTotal.toFixed(1),
                projectedSpread: projectedSpread.toFixed(1),
                marketSpread: marketSpread,
                marketTotal: marketTotal,
                spreadValue: spreadValue.toFixed(2),
                totalValue: totalValue.toFixed(2),
                offensiveAdvantage: offensiveAdvantage.toFixed(3),
                pitchingAdvantage: pitchingAdvantage.toFixed(2),
                confidence: Utils.calculateConfidence({
                    spreadValue: spreadValue / 5,
                    totalValue: totalValue / 5,
                    offensiveAdvantage: Math.abs(offensiveAdvantage),
                    pitchingAdvantage: Math.abs(pitchingAdvantage) / 5
                }),
                weather: weather
            };
        } catch (error) {
            console.error('Error calculating value:', error);
            this.errorHandler.handleApiError(error, 'Value calculation');
            return null;
        }
    }

    addUpdate(title, message) {
        const timestamp = new Date().toLocaleTimeString();
        this.updateHistory.unshift({
            title,
            message,
            timestamp
        });
        
        // Keep only last 10 updates
        if (this.updateHistory.length > 10) {
            this.updateHistory = this.updateHistory.slice(0, 10);
        }
        
        console.log(`[${timestamp}] ${title}: ${message}`);
    }

    trackStatChanges(team, newStats) {
        const key = `${team.id}_${team.side}`;
        const previousStats = this.previousStats[key];
        
        if (previousStats) {
            // Compare and log changes
            const changes = this.compareStats(previousStats, newStats);
            if (changes.length > 0) {
                this.addUpdate('Stats Changed', `${team.side} team stats updated: ${changes.join(', ')}`);
            }
        }
        
        this.previousStats[key] = Utils.deepClone(newStats);
    }

    compareStats(oldStats, newStats) {
        const changes = [];
        
        // Compare batting stats
        if (oldStats.batting && newStats.batting) {
            Object.keys(newStats.batting).forEach(key => {
                if (oldStats.batting[key] !== newStats.batting[key]) {
                    changes.push(`${key.toUpperCase()}: ${oldStats.batting[key]} → ${newStats.batting[key]}`);
                }
            });
        }
        
        return changes;
    }

    updateH2HDisplay(record, gamesHtml) {
        const recordElement = document.getElementById('seasonRecord');
        const gamesTableBody = document.getElementById('lastFiveGames');
        
        if (recordElement) {
            recordElement.textContent = record;
        }
        
        if (gamesTableBody) {
            gamesTableBody.innerHTML = gamesHtml;
        }
    }

    calculateH2HRecord(games, homeTeamId) {
        let wins = 0;
        let losses = 0;
        
        games.forEach(gameDate => {
            gameDate.games.forEach(game => {
                if (game.teams?.home?.team?.id == homeTeamId) {
                    const homeScore = game.teams.home.score || 0;
                    const awayScore = game.teams.away.score || 0;
                    
                    if (homeScore > awayScore) wins++;
                    else if (awayScore > homeScore) losses++;
                }
            });
        });
        
        return { wins, losses };
    }

    formatLastGames(games) {
        if (!games?.length) {
            return '<tr><td colspan="3">No recent games found</td></tr>';
        }
        
        return games.map(gameDate => {
            return gameDate.games.map(game => {
                const date = Utils.formatDate(game.gameDate);
                const homeTeam = game.teams?.home?.team?.name || 'Unknown';
                const awayTeam = game.teams?.away?.team?.name || 'Unknown';
                const homeScore = game.teams?.home?.score || 0;
                const awayScore = game.teams?.away?.score || 0;
                const homePitcher = game.teams?.home?.probablePitcher?.fullName || 'TBD';
                const awayPitcher = game.teams?.away?.probablePitcher?.fullName || 'TBD';
                
                return `
                    <tr>
                        <td>${date}</td>
                        <td>${awayTeam} ${awayScore} - ${homeScore} ${homeTeam}</td>
                        <td>${awayPitcher} vs ${homePitcher}</td>
                    </tr>
                `;
            }).join('');
        }).join('');
    }

    getInjuryStatusClass(status) {
        switch (status?.toLowerCase()) {
            case 'day-to-day':
                return 'status-yellow';
            case '10-day il':
            case '15-day il':
                return 'status-orange';
            case '60-day il':
            case 'out for season':
                return 'status-red';
            default:
                return 'status-green';
        }
    }

    calculateImpact(injury) {
        const position = injury?.player?.primaryPosition?.name?.toLowerCase();
        const status = injury?.status?.toLowerCase();
        
        if (status?.includes('60-day') || status?.includes('season')) {
            return 'High';
        } else if (status?.includes('15-day') || status?.includes('10-day')) {
            return 'Medium';
        } else {
            return 'Low';
        }
    }

    calculatePitcherFatigue(pitcher) {
        const recentGames = pitcher?.recentGames || [];
        const daysRest = pitcher?.daysRest || 0;
        
        if (daysRest === 0) {
            return { level: 'High', color: '#f44336', available: false };
        } else if (daysRest === 1) {
            return { level: 'Medium', color: '#ffc107', available: recentGames.length < 2 };
        } else {
            return { level: 'Low', color: '#4caf50', available: true };
        }
    }

    updateUIWithResults(results) {
        try {
            const resultsContainer = document.getElementById('results');
            if (!resultsContainer) {
                console.error('Results container not found');
                return;
            }

            const confidenceClass = results.confidence === 'High' ? 'success' : 
                                  results.confidence === 'Medium' ? 'warning' : 'secondary';

            const resultsHTML = `
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0"><i class="fas fa-chart-bar me-2"></i>Analysis Results</h5>
                            </div>
                            <div class="card-body">
                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <h6 class="mb-3">Matchup Overview</h6>
                                        <div class="team-comparison">
                                            <div class="text-center">
                                                <strong>${results.awayTeam}</strong><br>
                                                <small>Away Team</small>
                                            </div>
                                            <div class="vs-badge">VS</div>
                                            <div class="text-center">
                                                <strong>${results.homeTeam}</strong><br>
                                                <small>Home Team</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="mb-3">Confidence Level</h6>
                                        <span class="badge bg-${confidenceClass} fs-6 p-2">${results.confidence}</span>
                                        <p class="mt-2 mb-0 text-muted">
                                            Weather: ${results.weather.charAt(0).toUpperCase() + results.weather.slice(1)}
                                        </p>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-md-6 mb-4">
                                        <div class="card border-0 bg-light">
                                            <div class="card-body">
                                                <h6 class="card-title">Projected Totals</h6>
                                                <div class="row text-center">
                                                    <div class="col-6">
                                                        <div class="stat-value">${results.projectedHomeRuns}</div>
                                                        <div class="stat-label">Home Runs</div>
                                                    </div>
                                                    <div class="col-6">
                                                        <div class="stat-value">${results.projectedAwayRuns}</div>
                                                        <div class="stat-label">Away Runs</div>
                                                    </div>
                                                </div>
                                                <hr>
                                                <div class="text-center">
                                                    <div class="stat-value">${results.projectedTotal}</div>
                                                    <div class="stat-label">Total Runs</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-md-6 mb-4">
                                        <div class="card border-0 bg-light">
                                            <div class="card-body">
                                                <h6 class="card-title">Market Comparison</h6>
                                                <div class="row text-center">
                                                    <div class="col-6">
                                                        <div class="stat-value">${results.projectedSpread}</div>
                                                        <div class="stat-label">Proj. Spread</div>
                                                        <small class="text-muted">vs ${results.marketSpread}</small>
                                                    </div>
                                                    <div class="col-6">
                                                        <div class="stat-value">${results.projectedTotal}</div>
                                                        <div class="stat-label">Proj. Total</div>
                                                        <small class="text-muted">vs ${results.marketTotal}</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-12">
                                        <h6 class="mb-3">Value Analysis</h6>
                                        <div class="table-responsive">
                                            <table class="table table-sm stats-table">
                                                <thead>
                                                    <tr>
                                                        <th>Metric</th>
                                                        <th>Value</th>
                                                        <th>Interpretation</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td>Spread Value</td>
                                                        <td class="stat-value">${results.spreadValue}</td>
                                                        <td>${parseFloat(results.spreadValue) > 2 ? 'Strong value' : parseFloat(results.spreadValue) > 1 ? 'Moderate value' : 'Limited value'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Total Value</td>
                                                        <td class="stat-value">${results.totalValue}</td>
                                                        <td>${parseFloat(results.totalValue) > 3 ? 'Strong value' : parseFloat(results.totalValue) > 1.5 ? 'Moderate value' : 'Limited value'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Offensive Advantage</td>
                                                        <td class="stat-value">${results.offensiveAdvantage}</td>
                                                        <td>${Math.abs(parseFloat(results.offensiveAdvantage)) > 0.1 ? 'Significant' : 'Minimal'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Pitching Advantage</td>
                                                        <td class="stat-value">${results.pitchingAdvantage}</td>
                                                        <td>${Math.abs(parseFloat(results.pitchingAdvantage)) > 1 ? 'Significant' : 'Minimal'}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            resultsContainer.innerHTML = resultsHTML;
            
            // Scroll to results
            resultsContainer.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error updating UI with results:', error);
            this.errorHandler.handleApiError(error, 'Results display');
        }
    }
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