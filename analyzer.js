class MLBAnalyzer {
    constructor() {
        this.SPREAD_THRESHOLD = 2.0;
        this.TOTAL_THRESHOLD = 3.0;
        // Using MLB Stats API
        this.API_BASE_URL = 'https://statsapi.mlb.com/api/v1';
        
        this.API_HEADERS = {
            'Accept': 'application/json',
            'User-Agent': 'MLBBettingAnalyzer/1.0'
        };
        this.teamStats = {};
        
        // Weather adjustment factors
        this.WEATHER_FACTORS = {
            normal: { runs: 1.0, hr: 1.0 },
            wind_out: { runs: 1.15, hr: 1.3 },
            wind_in: { runs: 0.85, hr: 0.7 },
            rain: { runs: 0.9, hr: 0.85 },
            hot: { runs: 1.1, hr: 1.15 },
            cold: { runs: 0.9, hr: 0.8 },
            dome: { runs: 1.0, hr: 1.0 }
        };

        // Add update history tracking
        this.updateHistory = [];
        this.previousStats = {};

        this.initializeEventListeners();
    }

    async initializeEventListeners() {
        // Existing listeners
        document.getElementById('homeTeam').addEventListener('change', () => this.fetchTeamStats('home'));
        document.getElementById('awayTeam').addEventListener('change', () => this.fetchTeamStats('away'));
        
        // New listeners for additional features
        document.getElementById('homeTeam').addEventListener('change', () => {
            this.fetchBallparkInfo();
            this.fetchInjuryReport('home');
            this.fetchBullpenStatus('home');
        });
        
        document.getElementById('awayTeam').addEventListener('change', () => {
            this.fetchInjuryReport('away');
            this.fetchBullpenStatus('away');
        });

        // Update H2H when both teams are selected
        ['homeTeam', 'awayTeam'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                const homeTeam = document.getElementById('homeTeam').value;
                const awayTeam = document.getElementById('awayTeam').value;
                if (homeTeam && awayTeam) {
                    this.fetchHeadToHead(homeTeam, awayTeam);
                }
            });
        });
    }

    async fetchTeamStats(teamId) {
        try {
            const loadingDiv = document.getElementById('loading');
            loadingDiv.style.display = 'block';

            this.addUpdate('Fetching Stats', `Getting latest statistics for ${teamId}`);
            
            // Get team stats
            const teamStatsUrl = `${this.API_BASE_URL}/teams/${teamId}/stats?stats=season&group=hitting,pitching&season=2024&sportIds=1`;
            console.log('Fetching team stats:', teamStatsUrl);
            const statsResponse = await fetch(teamStatsUrl);
            
            if (!statsResponse.ok) {
                throw new Error(`Failed to fetch team stats: ${statsResponse.status}`);
            }
            
            const statsData = await statsResponse.json();
            
            // Extract hitting stats
            const hittingStats = statsData.stats.find(stat => stat.group.displayName === 'hitting')?.splits[0]?.stat || {};
            const battingStats = {
                avg: Number(hittingStats.avg || 0).toFixed(3),
                obp: Number(hittingStats.obp || 0).toFixed(3),
                slg: Number(hittingStats.slg || 0).toFixed(3),
                iso: Number((hittingStats.slg || 0) - (hittingStats.avg || 0)).toFixed(3),
                babip: Number(hittingStats.babip || 0).toFixed(3)
            };

            // Extract pitching stats
            const pitchingStats = statsData.stats.find(stat => stat.group.displayName === 'pitching')?.splits[0]?.stat || {};
            const pitchingStatsFormatted = {
                era: Number(pitchingStats.era || 0).toFixed(2),
                whip: Number(pitchingStats.whip || 0).toFixed(2)
            };

            // Get team roster for pitchers
            const rosterUrl = `${this.API_BASE_URL}/teams/${teamId}/roster?rosterType=active`;
            console.log('Fetching roster:', rosterUrl);
            const rosterResponse = await fetch(rosterUrl);
            
            if (!rosterResponse.ok) {
                throw new Error(`Failed to fetch roster: ${rosterResponse.status}`);
            }
            
            const rosterData = await rosterResponse.json();
            const pitchers = rosterData.roster
                .filter(player => player.position.code === '1')
                .map(player => ({
                    id: player.person.id,
                    name: player.person.fullName
                }));

            console.log('Found pitchers:', pitchers);

            // Get stats for each pitcher
            const pitcherStats = await Promise.all(
                pitchers.map(async pitcher => {
                    try {
                        const pitcherStatsUrl = `${this.API_BASE_URL}/people/${pitcher.id}/stats?stats=season&group=pitching&season=2024&sportIds=1`;
                        console.log('Fetching pitcher stats:', pitcherStatsUrl);
                        const statsResponse = await fetch(pitcherStatsUrl);
                        
                        if (!statsResponse.ok) {
                            console.warn(`Failed to fetch stats for pitcher ${pitcher.name}`);
                            return { ...pitcher, stats: null };
                        }
                        
                        const statsData = await statsResponse.json();
                        const stats = statsData.stats[0]?.splits[0]?.stat || {};
                        
                        return {
                            ...pitcher,
                            stats: {
                                era: Number(stats.era || 0).toFixed(2),
                                whip: Number(stats.whip || 0).toFixed(2),
                                k9: Number((stats.strikeOuts || 0) * 9 / (stats.inningsPitched || 1)).toFixed(1),
                                bb9: Number((stats.baseOnBalls || 0) * 9 / (stats.inningsPitched || 1)).toFixed(1)
                            }
                        };
                    } catch (error) {
                        console.error(`Error processing pitcher ${pitcher.name}:`, error);
                        return { ...pitcher, stats: null };
                    }
                })
            );

            const stats = {
                batting: battingStats,
                pitching: pitchingStatsFormatted,
                pitchers: pitcherStats.filter(p => p.stats !== null)
            };

            // Add tracking for the new stats
            this.trackStatChanges({ id: teamId, side: teamId.startsWith('home') ? 'home' : 'away' }, stats);
            this.addUpdate('Stats Updated', `Updated ${teamId.startsWith('home') ? 'home' : 'away'} team statistics`);

            loadingDiv.style.display = 'none';

            return stats;

        } catch (error) {
            console.error('Error fetching team stats:', error);
            this.addUpdate('Error', `Failed to fetch team statistics: ${error.message}`);
            document.getElementById('loading').style.display = 'none';
            showError(`Error fetching team statistics: ${error.message}`);
            return null;
        }
    }

    calculateAggregateStats(gameStats, teamId) {
        let battingStats = {
            atBats: 0,
            hits: 0,
            doubles: 0,
            triples: 0,
            homeRuns: 0,
            walks: 0,
            hitByPitch: 0,
            sacFlies: 0
        };

        let pitchingStats = {
            inningsPitched: 0,
            earnedRuns: 0,
            hits: 0,
            walks: 0,
            hitByPitch: 0
        };

        // Aggregate stats from each game
        gameStats.forEach(game => {
            const teamStats = game.teams.home.team.id === teamId ? 
                game.teams.home : game.teams.away;

            // Batting stats
            const batting = teamStats.teamStats.batting;
            battingStats.atBats += batting.atBats || 0;
            battingStats.hits += batting.hits || 0;
            battingStats.doubles += batting.doubles || 0;
            battingStats.triples += batting.triples || 0;
            battingStats.homeRuns += batting.homeRuns || 0;
            battingStats.walks += batting.walks || 0;
            battingStats.hitByPitch += batting.hitByPitch || 0;
            battingStats.sacFlies += batting.sacFlies || 0;

            // Pitching stats
            const pitching = teamStats.teamStats.pitching;
            pitchingStats.inningsPitched += this.convertInningsPitched(pitching.inningsPitched || '0');
            pitchingStats.earnedRuns += pitching.earnedRuns || 0;
            pitchingStats.hits += pitching.hits || 0;
            pitchingStats.walks += pitching.walks || 0;
            pitchingStats.hitByPitch += pitching.hitByPitch || 0;
        });

        // Calculate derived statistics
        const avg = battingStats.atBats > 0 ? battingStats.hits / battingStats.atBats : 0;
        const obp = this.calculateOBP(battingStats);
        const slg = this.calculateSLG(battingStats);
        const iso = slg - avg;
        const babip = this.calculateBABIP(battingStats);
        const era = this.calculateERA(pitchingStats);
        const whip = this.calculateWHIP(pitchingStats);

        return {
            batting: {
                avg: avg.toFixed(3),
                obp: obp.toFixed(3),
                slg: slg.toFixed(3),
                iso: iso.toFixed(3),
                babip: babip.toFixed(3)
            },
            pitching: {
                era: era.toFixed(2),
                whip: whip.toFixed(2)
            }
        };
    }

    convertInningsPitched(ip) {
        const [whole, partial = 0] = ip.toString().split('.');
        return parseInt(whole) + (parseInt(partial) || 0) / 3;
    }

    calculateOBP(stats) {
        const plateAppearances = stats.atBats + stats.walks + stats.hitByPitch + stats.sacFlies;
        if (plateAppearances === 0) return 0;
        return (stats.hits + stats.walks + stats.hitByPitch) / plateAppearances;
    }

    calculateSLG(stats) {
        if (stats.atBats === 0) return 0;
        const totalBases = stats.hits + stats.doubles + (2 * stats.triples) + (3 * stats.homeRuns);
        return totalBases / stats.atBats;
    }

    calculateBABIP(stats) {
        const ballsInPlay = stats.atBats - stats.homeRuns - stats.strikeouts + stats.sacFlies;
        if (ballsInPlay === 0) return 0;
        return (stats.hits - stats.homeRuns) / ballsInPlay;
    }

    calculateERA(stats) {
        if (stats.inningsPitched === 0) return 0;
        return (9 * stats.earnedRuns) / stats.inningsPitched;
    }

    calculateWHIP(stats) {
        if (stats.inningsPitched === 0) return 0;
        return (stats.hits + stats.walks + stats.hitByPitch) / stats.inningsPitched;
    }

    calculatePitcherStats(starts) {
        if (!starts || starts.length === 0) return null;

        let totalIP = 0;
        let totalER = 0;
        let totalH = 0;
        let totalBB = 0;
        let totalK = 0;

        starts.forEach(start => {
            const ip = this.convertInningsPitched(start.stat.inningsPitched);
            totalIP += ip;
            totalER += start.stat.earnedRuns || 0;
            totalH += start.stat.hits || 0;
            totalBB += start.stat.baseOnBalls || 0;
            totalK += start.stat.strikeOuts || 0;
        });

        return {
            era: (9 * totalER / totalIP).toFixed(2),
            whip: ((totalH + totalBB) / totalIP).toFixed(2),
            k9: (9 * totalK / totalIP).toFixed(1),
            bb9: (9 * totalBB / totalIP).toFixed(1)
        };
    }

    async updateTeamStats() {
        const homeTeamSelect = document.getElementById('homeTeamSelect');
        const awayTeamSelect = document.getElementById('awayTeamSelect');
        
        const mlbTeams = [
            { id: 109, name: "Arizona Diamondbacks" },
            { id: 144, name: "Atlanta Braves" },
            { id: 110, name: "Baltimore Orioles" },
            { id: 111, name: "Boston Red Sox" },
            { id: 112, name: "Chicago Cubs" },
            { id: 145, name: "Chicago White Sox" },
            { id: 113, name: "Cincinnati Reds" },
            { id: 114, name: "Cleveland Guardians" },
            { id: 115, name: "Colorado Rockies" },
            { id: 116, name: "Detroit Tigers" },
            { id: 117, name: "Houston Astros" },
            { id: 118, name: "Kansas City Royals" },
            { id: 108, name: "Los Angeles Angels" },
            { id: 119, name: "Los Angeles Dodgers" },
            { id: 146, name: "Miami Marlins" },
            { id: 158, name: "Milwaukee Brewers" },
            { id: 142, name: "Minnesota Twins" },
            { id: 121, name: "New York Mets" },
            { id: 147, name: "New York Yankees" },
            { id: 133, name: "Oakland Athletics" },
            { id: 143, name: "Philadelphia Phillies" },
            { id: 134, name: "Pittsburgh Pirates" },
            { id: 135, name: "San Diego Padres" },
            { id: 137, name: "San Francisco Giants" },
            { id: 136, name: "Seattle Mariners" },
            { id: 138, name: "St. Louis Cardinals" },
            { id: 139, name: "Tampa Bay Rays" },
            { id: 140, name: "Texas Rangers" },
            { id: 141, name: "Toronto Blue Jays" },
            { id: 120, name: "Washington Nationals" }
        ];

        // Sort teams alphabetically
        mlbTeams.sort((a, b) => a.name.localeCompare(b.name));

        // Update home team dropdown
        homeTeamSelect.innerHTML = '<option value="">Select a team...</option>';
        mlbTeams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            homeTeamSelect.appendChild(option);
        });

        // Update away team dropdown
        awayTeamSelect.innerHTML = '<option value="">Select a team...</option>';
        mlbTeams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            awayTeamSelect.appendChild(option);
        });

        // Add event listeners for team selection
        homeTeamSelect.addEventListener('change', async (e) => {
            if (e.target.value) {
                document.getElementById('loading').style.display = 'block';
                const stats = await this.fetchTeamStats(e.target.value);
                if (stats) {
                    this.updateTeamFields({ id: e.target.value, side: 'home' }, stats);
                }
                document.getElementById('loading').style.display = 'none';
            }
        });

        awayTeamSelect.addEventListener('change', async (e) => {
            if (e.target.value) {
                document.getElementById('loading').style.display = 'block';
                const stats = await this.fetchTeamStats(e.target.value);
                if (stats) {
                    this.updateTeamFields({ id: e.target.value, side: 'away' }, stats);
                }
                document.getElementById('loading').style.display = 'none';
            }
        });

        // Store team data
        this.teamStats = mlbTeams.reduce((acc, team) => {
            acc[team.id] = {
                name: team.name,
                abbreviation: team.id,
                stats: null
            };
            return acc;
        }, {});
    }

    updateTeamFields(team, stats) {
        if (!stats) return;

        const side = team.side;
        console.log(`Updating ${side} team fields:`, stats);

        // Update form fields with fetched stats
        if (stats.batting) {
            document.getElementById(`${side}AVG`).value = stats.batting.avg;
            document.getElementById(`${side}OBP`).value = stats.batting.obp;
            document.getElementById(`${side}SLG`).value = stats.batting.slg;
            document.getElementById(`${side}BABIP`).value = stats.batting.babip;
            document.getElementById(`${side}ISO`).value = stats.batting.iso;
        }

        if (stats.pitching) {
            document.getElementById(`${side}ERA`).value = stats.pitching.era;
            document.getElementById(`${side}WHIP`).value = stats.pitching.whip;
        }

        // Update pitcher dropdown and stats
        if (stats.pitchers) {
            const select = document.getElementById(`${side}PitcherSelect`);
            
            // Clear existing options
            select.innerHTML = '<option value="">Select pitcher...</option>';
            
            // Add new options
            stats.pitchers.forEach(pitcher => {
                const option = document.createElement('option');
                option.value = pitcher.id;
                option.textContent = pitcher.name;
                select.appendChild(option);
            });

            // Store pitcher stats for later use
            select.pitcherStats = stats.pitchers;

            // Add/update event listener
            select.onchange = (e) => {
                if (e.target.value) {
                    const selectedPitcher = stats.pitchers.find(p => p.id.toString() === e.target.value);
                    if (selectedPitcher && selectedPitcher.stats) {
                        this.updatePitcherStats(side, selectedPitcher.stats);
                    }
                }
            };
        }
    }

    updatePitcherStats(side, stats) {
        document.getElementById(`${side}StarterERA`).value = stats.era;
        document.getElementById(`${side}StarterWHIP`).value = stats.whip;
        document.getElementById(`${side}StarterK9`).value = stats.k9;
        document.getElementById(`${side}StarterBB9`).value = stats.bb9;
    }

    calculateRunExpectancy(stats, weather = 'normal') {
        // Get weather adjustment factors
        const weatherFactor = this.WEATHER_FACTORS[weather] || this.WEATHER_FACTORS.normal;
        
        // Get starter stats
        const starterERA = parseFloat(document.getElementById(`${stats.side}StarterERA`).value) || stats.era;
        const starterWHIP = parseFloat(document.getElementById(`${stats.side}StarterWHIP`).value) || stats.whip;
        const starterK9 = parseFloat(document.getElementById(`${stats.side}StarterK9`).value) || 0;
        
        // Base run expectancy calculation with starter impact
        const baseExpectedRuns = (
            stats.ops * 4.0 + // OPS factor (reduced weight)
            (1 - starterWHIP) * 2.5 + // Starting pitcher WHIP factor (increased weight)
            (stats.babip || 0) * 1.5 + // Batting average on balls in play
            (stats.iso || 0) * 2.0 + // Isolated power
            ((starterERA - 4.5) * 0.2) + // ERA impact
            ((starterK9 - 8.5) * -0.1) // Strikeout impact (negative means better)
        );

        // Apply weather adjustments
        const weatherAdjustedRuns = baseExpectedRuns * weatherFactor.runs;
        
        // Additional HR factor adjustment for extreme weather
        const hrAdjustment = (stats.iso || 0) * (weatherFactor.hr - 1) * 0.5;
        
        // Return weather-adjusted run expectancy, bounded between 2 and 8 runs
        return Math.max(2, Math.min(8, weatherAdjustedRuns + hrAdjustment));
    }

    analyzeMatchup(homeTeam, awayTeam, weather = 'normal') {
        // Calculate OPS
        homeTeam.ops = homeTeam.obp + homeTeam.slg;
        awayTeam.ops = awayTeam.obp + awayTeam.slg;

        // Calculate expected runs with weather effects
        const homeExpRuns = this.calculateRunExpectancy(homeTeam, weather);
        const awayExpRuns = this.calculateRunExpectancy(awayTeam, weather);

        // Calculate projected spread and total
        const projectedSpread = homeExpRuns - awayExpRuns;
        const projectedTotal = homeExpRuns + awayExpRuns;

        return {
            homeProjected: homeExpRuns.toFixed(2),
            awayProjected: awayExpRuns.toFixed(2),
            projectedSpread: projectedSpread.toFixed(2),
            projectedTotal: projectedTotal.toFixed(2)
        };
    }

    findValue(homeTeam, awayTeam, marketSpread, marketTotal, weather = 'normal') {
        try {
            const projections = this.analyzeMatchup(homeTeam, awayTeam, weather);
            
            const spreadValue = parseFloat(projections.projectedSpread) - (marketSpread || 0);
            const totalValue = parseFloat(projections.projectedTotal) - (marketTotal || 0);

            const recommendations = [];

            // Weather-specific commentary
            if (weather !== 'normal' && weather !== 'dome') {
                recommendations.push(`Weather Impact: ${weather.replace('_', ' ')} conditions affecting projections`);
            }

            // Spread value analysis
            if (Math.abs(spreadValue) >= this.SPREAD_THRESHOLD) {
                if (spreadValue > 0) {
                    recommendations.push(`Value on ${homeTeam.name} spread ${marketSpread}`);
                } else {
                    recommendations.push(`Value on ${awayTeam.name} spread ${-marketSpread}`);
                }
            }

            // Total value analysis with weather consideration
            if (Math.abs(totalValue) >= this.TOTAL_THRESHOLD) {
                const weatherImpact = this.WEATHER_FACTORS[weather].runs;
                if (totalValue > 0) {
                    recommendations.push(`Value on OVER ${marketTotal}${weatherImpact > 1 ? ' (supported by weather conditions)' : ''}`);
                } else {
                    recommendations.push(`Value on UNDER ${marketTotal}${weatherImpact < 1 ? ' (supported by weather conditions)' : ''}`);
                }
            }

            return {
                projections: {
                    homeProjected: Number(projections.homeProjected || 0).toFixed(2),
                    awayProjected: Number(projections.awayProjected || 0).toFixed(2),
                    projectedSpread: Number(projections.projectedSpread || 0).toFixed(2),
                    projectedTotal: Number(projections.projectedTotal || 0).toFixed(2)
                },
                spreadValue: Number(spreadValue || 0).toFixed(2),
                totalValue: Number(totalValue || 0).toFixed(2),
                recommendations: recommendations
            };
        } catch (error) {
            console.error('Error in findValue:', error);
            return {
                projections: {
                    homeProjected: '0.00',
                    awayProjected: '0.00',
                    projectedSpread: '0.00',
                    projectedTotal: '0.00'
                },
                spreadValue: '0.00',
                totalValue: '0.00',
                recommendations: ['Unable to calculate values due to insufficient data']
            };
        }
    }

    async fetchBallparkInfo() {
        const homeTeam = document.getElementById('homeTeam').value;
        if (!homeTeam) return;

        try {
            const response = await fetch(`${this.API_BASE_URL}/teams/${homeTeam}/venue`);
            const data = await response.json();
            
            // Update ballpark dimensions
            document.getElementById('lfDistance').textContent = data.dimensions?.leftField || 'N/A';
            document.getElementById('cfDistance').textContent = data.dimensions?.centerField || 'N/A';
            document.getElementById('rfDistance').textContent = data.dimensions?.rightField || 'N/A';
            
            // Update park factors
            const parkFactors = await this.fetchParkFactors(homeTeam);
            document.getElementById('runIndex').textContent = parkFactors.runIndex;
            document.getElementById('hrIndex').textContent = parkFactors.hrIndex;
            document.getElementById('xbhIndex').textContent = parkFactors.xbhIndex;
        } catch (error) {
            console.error('Error fetching ballpark info:', error);
        }
    }

    async fetchInjuryReport(team) {
        const teamId = document.getElementById(`${team}Team`).value;
        if (!teamId) return;

        try {
            const response = await fetch(`${this.API_BASE_URL}/teams/${teamId}/roster/injuries`);
            const data = await response.json();
            
            const tableBody = document.getElementById(`${team}InjuryTable`);
            tableBody.innerHTML = ''; // Clear existing entries
            
            data.injuries.forEach(injury => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${injury.player.fullName}</td>
                    <td class="status-${this.getInjuryStatusClass(injury.status)}">${injury.status}</td>
                    <td>${this.calculateImpact(injury)}</td>
                    <td>${injury.player.primaryPosition}</td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error(`Error fetching ${team} team injuries:`, error);
        }
    }

    async fetchHeadToHead(homeTeam, awayTeam) {
        try {
            // Fetch season series
            const seasonResponse = await fetch(`${this.API_BASE_URL}/schedule/games/?teamId=${homeTeam}&opponent=${awayTeam}&season=2024`);
            const seasonData = await seasonResponse.json();
            
            // Update season record
            const record = this.calculateH2HRecord(seasonData.dates, homeTeam);
            document.getElementById('seasonRecord').textContent = `${record.wins}-${record.losses}`;
            
            // Update last 5 games
            const lastFiveTable = document.getElementById('lastFiveGames');
            lastFiveTable.innerHTML = ''; // Clear existing entries
            
            const last5Games = seasonData.dates.slice(-5);
            for (const game of last5Games) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${game.date}</td>
                    <td>${game.games[0].score}</td>
                    <td>${game.games[0].pitchers.join(' vs ')}</td>
                `;
                lastFiveTable.appendChild(row);
            }
            
            // Update pitcher vs team stats
            await this.fetchPitcherVsTeamStats();
        } catch (error) {
            console.error('Error fetching head-to-head data:', error);
        }
    }

    async fetchBullpenStatus(team) {
        const teamId = document.getElementById(`${team}Team`).value;
        if (!teamId) return;

        try {
            // Fetch recent games to analyze bullpen usage
            const response = await fetch(`${this.API_BASE_URL}/teams/${teamId}/stats/pitching?group=bullpen&season=2024&gameType=R&lastGames=3`);
            const data = await response.json();
            
            const tableBody = document.getElementById(`${team}BullpenTable`);
            tableBody.innerHTML = ''; // Clear existing entries
            
            data.stats.forEach(pitcher => {
                const row = document.createElement('tr');
                const fatigue = this.calculatePitcherFatigue(pitcher);
                row.innerHTML = `
                    <td>${pitcher.name}</td>
                    <td>${pitcher.recentGames.join(', ')}</td>
                    <td><span class="fatigue-indicator" style="background-color: ${fatigue.color}"></span>${fatigue.level}</td>
                    <td>${fatigue.available ? 'Yes' : 'No'}</td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error(`Error fetching ${team} bullpen status:`, error);
        }
    }

    // Helper methods
    getInjuryStatusClass(status) {
        const statusMap = {
            'Active': 'green',
            'Day-to-Day': 'yellow',
            '10-Day IL': 'orange',
            '60-Day IL': 'red'
        };
        return statusMap[status] || 'green';
    }

    calculateImpact(injury) {
        // Logic to determine player impact based on position, stats, etc.
        return 'High'; // Placeholder
    }

    calculateH2HRecord(games, homeTeamId) {
        // Logic to calculate head-to-head record
        return { wins: 0, losses: 0 }; // Placeholder
    }

    calculatePitcherFatigue(pitcher) {
        // Logic to determine pitcher fatigue level
        return {
            level: 'Low',
            color: '#00ff00',
            available: true
        }; // Placeholder
    }

    // Add new method to track updates
    addUpdate(updateType, details) {
        const update = {
            timestamp: new Date(),
            type: updateType,
            details: details
        };
        this.updateHistory.unshift(update);
        this.displayUpdates();
    }

    // Add new method to track stat changes
    trackStatChanges(team, newStats) {
        const teamKey = `${team.side}_${team.id}`;
        const oldStats = this.previousStats[teamKey] || {};
        const changes = [];

        // Compare batting stats
        if (newStats.batting) {
            Object.entries(newStats.batting).forEach(([key, value]) => {
                if (oldStats.batting && oldStats.batting[key] !== value) {
                    changes.push({
                        metric: `${team.side.toUpperCase()} ${key.toUpperCase()}`,
                        previous: oldStats.batting[key],
                        current: value,
                        change: (value - oldStats.batting[key]).toFixed(3)
                    });
                }
            });
        }

        // Compare pitching stats
        if (newStats.pitching) {
            Object.entries(newStats.pitching).forEach(([key, value]) => {
                if (oldStats.pitching && oldStats.pitching[key] !== value) {
                    changes.push({
                        metric: `${team.side.toUpperCase()} ${key.toUpperCase()}`,
                        previous: oldStats.pitching[key],
                        current: value,
                        change: (value - oldStats.pitching[key]).toFixed(2)
                    });
                }
            });
        }

        // Store new stats as previous for next comparison
        this.previousStats[teamKey] = JSON.parse(JSON.stringify(newStats));

        // Display changes
        this.displayStatChanges(changes);
    }

    // Add new method to display updates
    displayUpdates() {
        const updateHistoryDiv = document.getElementById('updateHistory');
        updateHistoryDiv.innerHTML = this.updateHistory
            .slice(0, 10) // Show last 10 updates
            .map(update => `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${update.type}</h6>
                        <small>${update.timestamp.toLocaleTimeString()}</small>
                    </div>
                    <p class="mb-1">${update.details}</p>
                </div>
            `)
            .join('');
    }

    // Add new method to display stat changes
    displayStatChanges(changes) {
        const statsChangesBody = document.getElementById('statsChangesBody');
        
        // Add new changes at the top
        changes.forEach(change => {
            const row = document.createElement('tr');
            const changeValue = parseFloat(change.change);
            const changeClass = changeValue > 0 ? 'text-success' : changeValue < 0 ? 'text-danger' : '';
            
            row.innerHTML = `
                <td>${change.metric}</td>
                <td>${change.previous}</td>
                <td>${change.current}</td>
                <td class="${changeClass}">${changeValue > 0 ? '+' : ''}${change.change}</td>
            `;
            
            statsChangesBody.insertBefore(row, statsChangesBody.firstChild);
        });

        // Keep only last 20 rows
        while (statsChangesBody.children.length > 20) {
            statsChangesBody.removeChild(statsChangesBody.lastChild);
        }
    }

    // Modify analyzeMatchup to track updates
    async analyzeMatchup() {
        try {
            this.addUpdate('Analysis Started', 'Beginning matchup analysis');
            
            const homeTeam = document.getElementById('homeTeam').value;
            const awayTeam = document.getElementById('awayTeam').value;
            const weather = document.getElementById('weather').value;
            const spread = parseFloat(document.getElementById('spread').value);
            const total = parseFloat(document.getElementById('total').value);

            // Fetch all necessary data
            const [homeStats, awayStats, ballparkFactors, injuries, h2hData, bullpenStatus] = await Promise.all([
                this.fetchTeamStats('home'),
                this.fetchTeamStats('away'),
                this.fetchBallparkInfo(),
                this.fetchInjuryReport('both'),
                this.fetchHeadToHead(homeTeam, awayTeam),
                this.fetchBullpenStatus('both')
            ]);

            // Calculate adjustments based on additional factors
            const ballparkMultiplier = this.calculateBallparkMultiplier(ballparkFactors);
            const injuryAdjustment = this.calculateInjuryAdjustment(injuries);
            const h2hAdvantage = this.calculateH2HAdvantage(h2hData);
            const bullpenFactor = this.calculateBullpenFactor(bullpenStatus);

            // Apply all factors to final projection
            const projection = this.calculateFinalProjection(
                homeStats,
                awayStats,
                weather,
                ballparkMultiplier,
                injuryAdjustment,
                h2hAdvantage,
                bullpenFactor
            );

            this.addUpdate('Analysis Complete', 'Matchup analysis finished successfully');
            
            // Update UI with results
            this.updateUIWithResults(projection, spread, total);
        } catch (error) {
            console.error('Error analyzing matchup:', error);
            this.addUpdate('Error', `Analysis failed: ${error.message}`);
            document.getElementById('results').innerHTML = 'Error analyzing matchup. Please try again.';
        }
    }
}

function getFormValue(id) {
    const value = document.getElementById(id).value;
    return value ? parseFloat(value) : null;
}

async function analyzeMatchup() {
    try {
        const analyzer = new MLBAnalyzer();
        
        // Get form values
        const homeTeam = {
            id: document.getElementById('homeTeamSelect').value,
            name: document.getElementById('homeTeamSelect').options[document.getElementById('homeTeamSelect').selectedIndex].text,
            side: 'home',
            avg: getFormValue('homeAVG'),
            obp: getFormValue('homeOBP'),
            slg: getFormValue('homeSLG'),
            era: getFormValue('homeERA'),
            whip: getFormValue('homeWHIP'),
            babip: getFormValue('homeBABIP'),
            iso: getFormValue('homeISO')
        };

        const awayTeam = {
            id: document.getElementById('awayTeamSelect').value,
            name: document.getElementById('awayTeamSelect').options[document.getElementById('awayTeamSelect').selectedIndex].text,
            side: 'away',
            avg: getFormValue('awayAVG'),
            obp: getFormValue('awayOBP'),
            slg: getFormValue('awaySLG'),
            era: getFormValue('awayERA'),
            whip: getFormValue('awayWHIP'),
            babip: getFormValue('awayBABIP'),
            iso: getFormValue('awayISO')
        };

        const marketSpread = getFormValue('marketSpread');
        const marketTotal = getFormValue('marketTotal');
        const weather = document.getElementById('weather').value;

        // Validate team selection
        if (!homeTeam.id || !awayTeam.id) {
            showError('Please select both teams');
            return;
        }

        // Validate that teams are different
        if (homeTeam.id === awayTeam.id) {
            showError('Please select different teams');
            return;
        }

        // Show loading indicator
        document.getElementById('loading').style.display = 'block';

        // Fetch latest stats if available
        if (homeTeam.id) {
            console.log('Fetching home team stats...');
            const homeStats = await analyzer.fetchTeamStats(homeTeam.id);
            if (homeStats) {
                analyzer.updateTeamFields(homeTeam, homeStats);
            }
        }
        if (awayTeam.id) {
            console.log('Fetching away team stats...');
            const awayStats = await analyzer.fetchTeamStats(awayTeam.id);
            if (awayStats) {
                analyzer.updateTeamFields(awayTeam, awayStats);
            }
        }

        // Hide loading indicator
        document.getElementById('loading').style.display = 'none';

        // Get updated form values after stats have been populated
        homeTeam.avg = getFormValue('homeAVG');
        homeTeam.obp = getFormValue('homeOBP');
        homeTeam.slg = getFormValue('homeSLG');
        homeTeam.era = getFormValue('homeERA');
        homeTeam.whip = getFormValue('homeWHIP');
        homeTeam.babip = getFormValue('homeBABIP');
        homeTeam.iso = getFormValue('homeISO');

        awayTeam.avg = getFormValue('awayAVG');
        awayTeam.obp = getFormValue('awayOBP');
        awayTeam.slg = getFormValue('awaySLG');
        awayTeam.era = getFormValue('awayERA');
        awayTeam.whip = getFormValue('awayWHIP');
        awayTeam.babip = getFormValue('awayBABIP');
        awayTeam.iso = getFormValue('awayISO');

        const results = await analyzer.analyzeMatchup();
        updateUIWithResults(results);

        // Update last update timestamp
        document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
    } catch (error) {
        console.error('Error analyzing matchup:', error);
        document.getElementById('loading').style.display = 'none';
        showError(`Error analyzing matchup: ${error.message}`);
    }
}

function updateUIWithResults(results) {
    try {
        if (!results || !results.projections) {
            throw new Error('Invalid results data');
        }

        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5>Projected Scores</h5>
                    <div class="row mb-3">
                        <div class="col-6">
                            <p class="mb-1">Home Team:</p>
                            <h4>${Number(results.projections.homeProjected || 0).toFixed(2)}</h4>
                        </div>
                        <div class="col-6">
                            <p class="mb-1">Away Team:</p>
                            <h4>${Number(results.projections.awayProjected || 0).toFixed(2)}</h4>
                        </div>
                    </div>

                    <h5>Value Analysis</h5>
                    <div class="row mb-3">
                        <div class="col-6">
                            <p class="mb-1">Spread Value:</p>
                            <h4>${Number(results.spreadValue || 0).toFixed(2)}</h4>
                        </div>
                        <div class="col-6">
                            <p class="mb-1">Total Value:</p>
                            <h4>${Number(results.totalValue || 0).toFixed(2)}</h4>
                        </div>
                    </div>

                    <h5>Recommendations</h5>
                    <ul class="list-group">
                        ${(results.recommendations || ['No recommendations available']).map(rec => `
                            <li class="list-group-item">${rec}</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error updating UI:', error);
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="alert alert-warning">
                        Unable to display results. Please check your input data and try again.
                    </div>
                </div>
            </div>
        `;
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Initialize the analyzer when page loads
document.addEventListener('DOMContentLoaded', () => {
    const analyzer = new MLBAnalyzer();
    analyzer.updateTeamStats();
}); 