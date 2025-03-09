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
    }

    async fetchTeamStats(teamId) {
        try {
            const loadingDiv = document.getElementById('loading');
            loadingDiv.style.display = 'block';

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

            loadingDiv.style.display = 'none';

            return {
                batting: battingStats,
                pitching: pitchingStatsFormatted,
                pitchers: pitcherStats.filter(p => p.stats !== null)
            };

        } catch (error) {
            console.error('Error fetching team stats:', error);
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

        const results = analyzer.findValue(homeTeam, awayTeam, marketSpread, marketTotal, weather);
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

// Add this test function at the bottom of the file
function runTest() {
    const analyzer = new MLBAnalyzer();
    
    // Test Case 1: Yankees vs Red Sox
    const testCase1 = {
        homeTeam: {
            name: "NYY",
            avg: 0.265,
            obp: 0.330,
            slg: 0.445,
            era: 3.85,
            whip: 1.23,
            babip: 0.300,
            iso: 0.180
        },
        awayTeam: {
            name: "BOS",
            avg: 0.270,
            obp: 0.340,
            slg: 0.435,
            era: 4.05,
            whip: 1.28,
            babip: 0.305,
            iso: 0.175
        },
        marketSpread: -1.5,
        marketTotal: 8.5
    };

    // Test Case 2: Dodgers vs Giants
    const testCase2 = {
        homeTeam: {
            name: "LAD",
            avg: 0.275,
            obp: 0.345,
            slg: 0.465,
            era: 3.55,
            whip: 1.15,
            babip: 0.310,
            iso: 0.190
        },
        awayTeam: {
            name: "SFG",
            avg: 0.255,
            obp: 0.325,
            slg: 0.415,
            era: 3.95,
            whip: 1.25,
            babip: 0.295,
            iso: 0.170
        },
        marketSpread: -2.0,
        marketTotal: 7.5
    };

    // Test Case 3: High-scoring vs Low-scoring teams
    const testCase3 = {
        homeTeam: {
            name: "ATL",  // Atlanta Braves (high-scoring)
            avg: 0.285,
            obp: 0.365,
            slg: 0.495,
            era: 4.15,
            whip: 1.30,
            babip: 0.320,
            iso: 0.225
        },
        awayTeam: {
            name: "CLE",  // Cleveland (pitching-focused)
            avg: 0.245,
            obp: 0.310,
            slg: 0.385,
            era: 3.25,
            whip: 1.12,
            babip: 0.285,
            iso: 0.145
        },
        marketSpread: -1.0,
        marketTotal: 9.0
    };

    console.log("=== Test Case 1: Yankees vs Red Sox ===");
    const results1 = analyzer.findValue(testCase1.homeTeam, testCase1.awayTeam, testCase1.marketSpread, testCase1.marketTotal);
    console.log("Projections:", results1.projections);
    console.log("Spread Value:", results1.spreadValue);
    console.log("Total Value:", results1.totalValue);
    console.log("Recommendations:", results1.recommendations);

    console.log("\n=== Test Case 2: Dodgers vs Giants ===");
    const results2 = analyzer.findValue(testCase2.homeTeam, testCase2.awayTeam, testCase2.marketSpread, testCase2.marketTotal);
    console.log("Projections:", results2.projections);
    console.log("Spread Value:", results2.spreadValue);
    console.log("Total Value:", results2.totalValue);
    console.log("Recommendations:", results2.recommendations);

    console.log("\n=== Test Case 3: High-scoring vs Low-scoring ===");
    const results3 = analyzer.findValue(testCase3.homeTeam, testCase3.awayTeam, testCase3.marketSpread, testCase3.marketTotal);
    console.log("Projections:", results3.projections);
    console.log("Spread Value:", results3.spreadValue);
    console.log("Total Value:", results3.totalValue);
    console.log("Recommendations:", results3.recommendations);

    // Populate form with test data
    function populateTestCase1() {
        document.getElementById('homeTeam').value = testCase1.homeTeam.name;
        document.getElementById('homeAVG').value = testCase1.homeTeam.avg;
        document.getElementById('homeOBP').value = testCase1.homeTeam.obp;
        document.getElementById('homeSLG').value = testCase1.homeTeam.slg;
        document.getElementById('homeERA').value = testCase1.homeTeam.era;
        document.getElementById('homeWHIP').value = testCase1.homeTeam.whip;
        document.getElementById('homeBABIP').value = testCase1.homeTeam.babip;
        document.getElementById('homeISO').value = testCase1.homeTeam.iso;

        document.getElementById('awayTeam').value = testCase1.awayTeam.name;
        document.getElementById('awayAVG').value = testCase1.awayTeam.avg;
        document.getElementById('awayOBP').value = testCase1.awayTeam.obp;
        document.getElementById('awaySLG').value = testCase1.awayTeam.slg;
        document.getElementById('awayERA').value = testCase1.awayTeam.era;
        document.getElementById('awayWHIP').value = testCase1.awayTeam.whip;
        document.getElementById('awayBABIP').value = testCase1.awayTeam.babip;
        document.getElementById('awayISO').value = testCase1.awayTeam.iso;

        document.getElementById('marketSpread').value = testCase1.marketSpread;
        document.getElementById('marketTotal').value = testCase1.marketTotal;
    }

    // Add function to populate Test Case 3
    function populateTestCase3() {
        document.getElementById('homeTeam').value = testCase3.homeTeam.name;
        document.getElementById('homeAVG').value = testCase3.homeTeam.avg;
        document.getElementById('homeOBP').value = testCase3.homeTeam.obp;
        document.getElementById('homeSLG').value = testCase3.homeTeam.slg;
        document.getElementById('homeERA').value = testCase3.homeTeam.era;
        document.getElementById('homeWHIP').value = testCase3.homeTeam.whip;
        document.getElementById('homeBABIP').value = testCase3.homeTeam.babip;
        document.getElementById('homeISO').value = testCase3.homeTeam.iso;

        document.getElementById('awayTeam').value = testCase3.awayTeam.name;
        document.getElementById('awayAVG').value = testCase3.awayTeam.avg;
        document.getElementById('awayOBP').value = testCase3.awayTeam.obp;
        document.getElementById('awaySLG').value = testCase3.awayTeam.slg;
        document.getElementById('awayERA').value = testCase3.awayTeam.era;
        document.getElementById('awayWHIP').value = testCase3.awayTeam.whip;
        document.getElementById('awayBABIP').value = testCase3.awayTeam.babip;
        document.getElementById('awayISO').value = testCase3.awayTeam.iso;

        document.getElementById('marketSpread').value = testCase3.marketSpread;
        document.getElementById('marketTotal').value = testCase3.marketTotal;

        // Set some additional factors
        document.getElementById('weather').value = 'normal';
        document.getElementById('h2hRecord').value = '6-4';
        document.getElementById('injuriesImpact').value = '0';
    }

    // Update test buttons
    const testButtons = document.createElement('div');
    testButtons.className = 'mt-3 text-center';
    testButtons.innerHTML = `
        <button class="btn btn-info me-2" onclick="runTest()">Run All Tests</button>
        <button class="btn btn-info me-2" onclick="populateTestCase1()">Load NYY vs BOS</button>
        <button class="btn btn-info" onclick="populateTestCase3()">Load ATL vs CLE</button>
    `;
    document.querySelector('.container').insertBefore(testButtons, document.querySelector('.row'));
}

// Run tests when page loads
document.addEventListener('DOMContentLoaded', () => {
    const analyzer = new MLBAnalyzer();
    analyzer.updateTeamStats();
    runTest();
}); 