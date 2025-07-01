# MLB Betting Analyzer - Usage Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Usage Workflows](#basic-usage-workflows)
3. [Advanced Features](#advanced-features)
4. [Integration Examples](#integration-examples)
5. [Troubleshooting](#troubleshooting)
6. [Performance Optimization](#performance-optimization)
7. [Customization Guide](#customization-guide)

## Getting Started

### Prerequisites

Before using the MLB Betting Analyzer, ensure you have:

- Modern web browser (Chrome 88+, Firefox 85+, Safari 14+)
- Internet connection for API access
- Python 3.8+ (for Python components)
- Required Python packages (see `requirements.txt`)

### Installation

#### JavaScript Components (Frontend)
```bash
# Install dependencies
npm install

# Serve the application
npm start
# or simply open index.html in a browser
```

#### Python Components (Backend Analysis)
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the Python analyzer
python mlb_betting_algorithm.py
```

### Initial Setup

1. **Configure API Settings** (if needed):
```javascript
// Modify js/config.js for custom API endpoints
const config = {
    api: {
        baseUrl: 'https://statsapi.mlb.com/api/v1',
        timeout: 30000,
        retryAttempts: 3
    }
};
```

2. **Verify Connectivity**:
```javascript
// Test API connection
const apiService = new ApiService();
await apiService.makeApiCall('/teams').then(data => {
    console.log('API connected successfully');
}).catch(error => {
    console.error('API connection failed:', error);
});
```

---

## Basic Usage Workflows

### 1. Complete Web-Based Analysis

This is the primary workflow for analyzing MLB matchups through the web interface.

#### Step-by-Step Process

1. **Open the Application**
   - Launch `index.html` in your browser
   - Wait for the team dropdown menus to populate

2. **Select Teams**
```javascript
// Programmatic team selection (optional)
document.getElementById('homeTeamSelect').value = '147'; // Yankees
document.getElementById('awayTeamSelect').value = '111'; // Red Sox

// Or use the dropdown menus in the UI
```

3. **Enter Market Data**
```javascript
// Set betting market information
document.getElementById('marketSpread').value = '-1.5';
document.getElementById('marketTotal').value = '8.5';
document.getElementById('weather').value = 'normal';
```

4. **Run Analysis**
```javascript
// Trigger the analysis
const analyzer = new MLBAnalyzer();
await analyzer.analyzeMatchup();
```

5. **Review Results**
   - View projected scores in the results section
   - Check value recommendations
   - Review confidence levels

#### Complete Example
```javascript
// Complete workflow function
async function runCompleteAnalysis() {
    try {
        // Initialize analyzer
        const analyzer = new MLBAnalyzer();
        
        // Wait for initialization
        await analyzer.updateTeamStats();
        
        // Set up matchup
        document.getElementById('homeTeamSelect').value = '147';
        document.getElementById('awayTeamSelect').value = '111';
        document.getElementById('marketSpread').value = '-1.5';
        document.getElementById('marketTotal').value = '8.5';
        
        // Trigger team data loading
        await analyzer.handleTeamSelection('home', '147');
        await analyzer.handleTeamSelection('away', '111');
        
        // Run analysis
        await analyzer.analyzeMatchup();
        
        console.log('Analysis complete - check results in UI');
        
    } catch (error) {
        console.error('Analysis failed:', error);
    }
}

// Execute the analysis
runCompleteAnalysis();
```

### 2. Python Statistical Analysis

Use the Python components for advanced statistical modeling.

#### Basic Python Workflow

```python
from mlb_betting_algorithm import MLBBettingAnalyzer

# Initialize analyzer
analyzer = MLBBettingAnalyzer()

# Analyze a specific matchup
home_team = "NYY"
away_team = "BOS"
market_spread = -1.5
market_total = 8.5

# Get value analysis
value_opportunities = analyzer.find_value(
    home_team, 
    away_team, 
    market_spread, 
    market_total
)

# Display results
if value_opportunities:
    print("\n=== VALUE ANALYSIS RESULTS ===")
    print(f"Spread Value: {value_opportunities['spread_value']} runs")
    print(f"Total Value: {value_opportunities['total_value']} runs")
    
    print("\nRecommended Bets:")
    for rec in value_opportunities['recommendations']:
        print(f"- {rec}")
else:
    print("No value opportunities found")
```

#### Manual Team Data Analysis

```python
from mlb_manual_analyzer import MLBManualAnalyzer

# Initialize manual analyzer
analyzer = MLBManualAnalyzer()

# Add team statistics manually
# Format: (avg, obp, slg, era, whip)
analyzer.add_team_stats("NYY", 0.265, 0.330, 0.445, 3.85, 1.23)
analyzer.add_team_stats("BOS", 0.270, 0.340, 0.435, 4.05, 1.28)

# Analyze matchup
result = analyzer.analyze_matchup("NYY", "BOS")

print("\n=== MATCHUP ANALYSIS ===")
print(f"Home Team (NYY) Projected: {result['home_projected']} runs")
print(f"Away Team (BOS) Projected: {result['away_projected']} runs")
print(f"Projected Spread: {result['projected_spread']} runs")
print(f"Projected Total: {result['projected_total']} runs")

# Find value against market
value = analyzer.find_value("NYY", "BOS", -1.5, 8.5)
print(f"\nValue vs Market:")
print(f"Spread Value: {value['spread_value']} runs")
print(f"Total Value: {value['total_value']} runs")
```

### 3. API-Only Usage

Use the JavaScript APIs without the full UI for custom integrations.

```javascript
// Direct API usage for custom applications
class CustomMLBAnalyzer {
    constructor() {
        this.apiService = new ApiService();
        this.errorHandler = new ErrorHandler();
    }
    
    async getTeamComparison(homeTeamId, awayTeamId) {
        try {
            // Fetch team data
            const [homeStats, awayStats] = await Promise.all([
                this.apiService.getTeamStats(homeTeamId),
                this.apiService.getTeamStats(awayTeamId)
            ]);
            
            // Process statistics
            const homeProcessed = this.processTeamStats(homeStats);
            const awayProcessed = this.processTeamStats(awayStats);
            
            return {
                home: homeProcessed,
                away: awayProcessed,
                comparison: this.compareTeams(homeProcessed, awayProcessed)
            };
            
        } catch (error) {
            this.errorHandler.handleApiError(error, 'Team comparison');
            return null;
        }
    }
    
    processTeamStats(rawStats) {
        // Extract relevant statistics
        const hitting = rawStats.stats.find(s => s.group.displayName === 'hitting');
        const pitching = rawStats.stats.find(s => s.group.displayName === 'pitching');
        
        return {
            offense: {
                avg: hitting.splits[0].stat.avg,
                obp: hitting.splits[0].stat.obp,
                slg: hitting.splits[0].stat.slg,
                ops: hitting.splits[0].stat.ops
            },
            pitching: {
                era: pitching.splits[0].stat.era,
                whip: pitching.splits[0].stat.whip,
                k9: pitching.splits[0].stat.strikeoutsPer9Inn,
                bb9: pitching.splits[0].stat.walksPer9Inn
            }
        };
    }
    
    compareTeams(home, away) {
        return {
            offensiveAdvantage: this.calculateAdvantage(home.offense, away.offense),
            pitchingAdvantage: this.calculateAdvantage(away.pitching, home.pitching),
            overallEdge: this.calculateOverallEdge(home, away)
        };
    }
}

// Usage
const customAnalyzer = new CustomMLBAnalyzer();
const comparison = await customAnalyzer.getTeamComparison('147', '111');
console.log(comparison);
```

---

## Advanced Features

### 1. Real-Time Data Updates

Implement live data updates for active games.

```javascript
class RealTimeAnalyzer extends MLBAnalyzer {
    constructor() {
        super();
        this.updateInterval = null;
        this.isRealTimeActive = false;
    }
    
    startRealTimeUpdates(intervalMs = 60000) {
        if (this.isRealTimeActive) return;
        
        this.isRealTimeActive = true;
        this.updateInterval = setInterval(async () => {
            try {
                await this.refreshCurrentData();
                this.addUpdate('Real-time', 'Data refreshed automatically');
            } catch (error) {
                console.error('Real-time update failed:', error);
            }
        }, intervalMs);
        
        console.log('Real-time updates started');
    }
    
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            this.isRealTimeActive = false;
            console.log('Real-time updates stopped');
        }
    }
    
    async refreshCurrentData() {
        const homeTeam = document.getElementById('homeTeamSelect')?.value;
        const awayTeam = document.getElementById('awayTeamSelect')?.value;
        
        if (homeTeam && awayTeam) {
            await Promise.all([
                this.fetchTeamStats('home'),
                this.fetchTeamStats('away'),
                this.fetchHeadToHead(homeTeam, awayTeam)
            ]);
        }
    }
}

// Usage
const realTimeAnalyzer = new RealTimeAnalyzer();
realTimeAnalyzer.startRealTimeUpdates(30000); // Update every 30 seconds
```

### 2. Custom Analysis Algorithms

Extend the analysis with custom algorithms.

```javascript
class CustomAnalysisEngine {
    constructor() {
        this.customWeights = {
            recentForm: 0.4,
            seasonStats: 0.3,
            headToHead: 0.2,
            situational: 0.1
        };
    }
    
    calculateCustomProjection(homeTeam, awayTeam, weather = 'normal') {
        // Custom projection algorithm
        const homeOffense = this.calculateOffensiveRating(homeTeam);
        const awayOffense = this.calculateOffensiveRating(awayTeam);
        const homePitching = this.calculatePitchingRating(homeTeam);
        const awayPitching = this.calculatePitchingRating(awayTeam);
        
        // Apply weather adjustments
        const weatherMultipliers = config.weather[weather];
        
        const homeProjected = (homeOffense * weatherMultipliers.runs) - (awayPitching * 0.8);
        const awayProjected = (awayOffense * weatherMultipliers.runs) - (homePitching * 0.8);
        
        return {
            homeProjected: Math.max(2, Math.min(12, homeProjected)),
            awayProjected: Math.max(2, Math.min(12, awayProjected)),
            totalProjected: homeProjected + awayProjected,
            spreadProjected: homeProjected - awayProjected
        };
    }
    
    calculateOffensiveRating(team) {
        const stats = team.stats.batting;
        const weights = {
            avg: 0.2,
            obp: 0.3,
            slg: 0.3,
            iso: 0.2
        };
        
        return (
            stats.avg * weights.avg +
            stats.obp * weights.obp +
            stats.slg * weights.slg +
            stats.iso * weights.iso
        ) * 10; // Scale to runs
    }
}

// Integration with main analyzer
MLBAnalyzer.prototype.runCustomAnalysis = function() {
    const customEngine = new CustomAnalysisEngine();
    const homeTeam = this.getTeamData('home');
    const awayTeam = this.getTeamData('away');
    const weather = document.getElementById('weather')?.value || 'normal';
    
    return customEngine.calculateCustomProjection(homeTeam, awayTeam, weather);
};
```

### 3. Batch Analysis

Analyze multiple games simultaneously.

```python
# Python batch analysis
class BatchAnalyzer(MLBBettingAnalyzer):
    def __init__(self):
        super().__init__()
        self.results = []
    
    def analyze_daily_slate(self, games_list):
        """
        Analyze multiple games from a daily slate
        games_list: [{'home': 'NYY', 'away': 'BOS', 'spread': -1.5, 'total': 8.5}, ...]
        """
        self.results = []
        
        for game in games_list:
            try:
                value = self.find_value(
                    game['home'], 
                    game['away'], 
                    game['spread'], 
                    game['total']
                )
                
                result = {
                    'matchup': f"{game['away']} @ {game['home']}",
                    'market_spread': game['spread'],
                    'market_total': game['total'],
                    'value_analysis': value,
                    'recommendations': value['recommendations'] if value else []
                }
                
                self.results.append(result)
                
            except Exception as e:
                print(f"Error analyzing {game['away']} @ {game['home']}: {e}")
        
        return self.results
    
    def get_best_bets(self, min_value_threshold=1.5):
        """Get the best betting opportunities from the analyzed games"""
        best_bets = []
        
        for result in self.results:
            if result['value_analysis']:
                spread_value = abs(result['value_analysis']['spread_value'])
                total_value = abs(result['value_analysis']['total_value'])
                
                if spread_value >= min_value_threshold or total_value >= min_value_threshold:
                    best_bets.append({
                        'game': result['matchup'],
                        'spread_value': spread_value,
                        'total_value': total_value,
                        'recommendations': result['recommendations']
                    })
        
        # Sort by highest value
        best_bets.sort(key=lambda x: max(x['spread_value'], x['total_value']), reverse=True)
        return best_bets

# Usage example
analyzer = BatchAnalyzer()

# Daily slate
games = [
    {'home': 'NYY', 'away': 'BOS', 'spread': -1.5, 'total': 8.5},
    {'home': 'LAD', 'away': 'SF', 'spread': -2.0, 'total': 9.0},
    {'home': 'HOU', 'away': 'SEA', 'spread': -1.0, 'total': 8.0}
]

# Analyze all games
results = analyzer.analyze_daily_slate(games)

# Get best opportunities
best_bets = analyzer.get_best_bets(min_value_threshold=1.0)

print("=== BEST BETTING OPPORTUNITIES ===")
for bet in best_bets:
    print(f"\n{bet['game']}")
    print(f"Spread Value: {bet['spread_value']}")
    print(f"Total Value: {bet['total_value']}")
    for rec in bet['recommendations']:
        print(f"- {rec}")
```

---

## Integration Examples

### 1. Discord Bot Integration

Create a Discord bot for automated analysis.

```javascript
// Discord bot example (requires discord.js)
const Discord = require('discord.js');
const { MLBAnalyzer } = require('./analyzer.js');

class MLBDiscordBot {
    constructor(token) {
        this.client = new Discord.Client();
        this.analyzer = new MLBAnalyzer();
        this.token = token;
    }
    
    async start() {
        this.client.on('message', async (message) => {
            if (message.content.startsWith('!mlb analyze')) {
                await this.handleAnalysisCommand(message);
            }
        });
        
        await this.client.login(this.token);
    }
    
    async handleAnalysisCommand(message) {
        // Parse command: !mlb analyze NYY BOS -1.5 8.5
        const args = message.content.split(' ');
        
        if (args.length !== 6) {
            message.reply('Usage: !mlb analyze [HOME] [AWAY] [SPREAD] [TOTAL]');
            return;
        }
        
        const [, , , homeTeam, awayTeam, spread, total] = args;
        
        try {
            message.reply('Analyzing matchup... ⚾');
            
            // Run analysis (pseudo-code, needs adaptation for Node.js)
            const results = await this.analyzer.analyzeMatchupData(
                homeTeam, awayTeam, parseFloat(spread), parseFloat(total)
            );
            
            const embed = new Discord.MessageEmbed()
                .setTitle(`${awayTeam} @ ${homeTeam} Analysis`)
                .addField('Projected Score', `${results.awayProjected} - ${results.homeProjected}`)
                .addField('Spread Value', `${results.spreadValue} runs`)
                .addField('Total Value', `${results.totalValue} runs`)
                .addField('Recommendations', results.recommendations.join('\n') || 'No value found')
                .setColor('#1a237e');
            
            message.reply(embed);
            
        } catch (error) {
            message.reply(`Analysis failed: ${error.message}`);
        }
    }
}

// Usage
const bot = new MLBDiscordBot('YOUR_BOT_TOKEN');
bot.start();
```

### 2. REST API Wrapper

Create a REST API for the analysis engine.

```javascript
// Express.js API wrapper
const express = require('express');
const cors = require('cors');
const { MLBAnalyzer } = require('./analyzer.js');

const app = express();
const analyzer = new MLBAnalyzer();

app.use(cors());
app.use(express.json());

// Analyze specific matchup
app.post('/api/analyze', async (req, res) => {
    try {
        const { homeTeam, awayTeam, marketSpread, marketTotal, weather } = req.body;
        
        // Validate input
        if (!homeTeam || !awayTeam) {
            return res.status(400).json({ error: 'Missing team information' });
        }
        
        // Run analysis
        const results = await analyzer.analyzeMatchupData(
            homeTeam, awayTeam, marketSpread, marketTotal, weather
        );
        
        res.json({
            success: true,
            data: results,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get team statistics
app.get('/api/teams/:teamId/stats', async (req, res) => {
    try {
        const { teamId } = req.params;
        const stats = await analyzer.apiService.getTeamStats(teamId);
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`MLB Analyzer API running on port ${PORT}`);
});

// Usage examples for the API:
// POST /api/analyze
// {
//   "homeTeam": "147",
//   "awayTeam": "111", 
//   "marketSpread": -1.5,
//   "marketTotal": 8.5,
//   "weather": "normal"
// }
```

### 3. Scheduled Analysis

Set up automated daily analysis.

```python
# Automated daily analysis script
import schedule
import time
import json
from datetime import datetime, timedelta
from mlb_betting_algorithm import MLBBettingAnalyzer

class ScheduledAnalyzer:
    def __init__(self):
        self.analyzer = MLBBettingAnalyzer()
        self.results_file = 'daily_analysis.json'
    
    def get_daily_games(self):
        """Get today's games (mock implementation)"""
        # In real implementation, fetch from MLB API
        return [
            {'home': 'NYY', 'away': 'BOS', 'spread': -1.5, 'total': 8.5, 'time': '19:05'},
            {'home': 'LAD', 'away': 'SF', 'spread': -2.0, 'total': 9.0, 'time': '22:10'},
        ]
    
    def run_daily_analysis(self):
        """Run analysis for all today's games"""
        print(f"Running daily analysis at {datetime.now()}")
        
        games = self.get_daily_games()
        results = []
        
        for game in games:
            try:
                value = self.analyzer.find_value(
                    game['home'], 
                    game['away'], 
                    game['spread'], 
                    game['total']
                )
                
                result = {
                    'matchup': f"{game['away']} @ {game['home']}",
                    'game_time': game['time'],
                    'market_data': {
                        'spread': game['spread'],
                        'total': game['total']
                    },
                    'analysis': value,
                    'timestamp': datetime.now().isoformat()
                }
                
                results.append(result)
                
            except Exception as e:
                print(f"Error analyzing {game['away']} @ {game['home']}: {e}")
        
        # Save results
        self.save_results(results)
        self.send_notifications(results)
    
    def save_results(self, results):
        """Save analysis results to file"""
        with open(self.results_file, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"Results saved to {self.results_file}")
    
    def send_notifications(self, results):
        """Send notifications for high-value opportunities"""
        high_value_games = [
            r for r in results 
            if r['analysis'] and (
                abs(r['analysis']['spread_value']) >= 2.0 or 
                abs(r['analysis']['total_value']) >= 3.0
            )
        ]
        
        if high_value_games:
            print(f"\n=== HIGH VALUE OPPORTUNITIES ({len(high_value_games)}) ===")
            for game in high_value_games:
                print(f"{game['matchup']} at {game['game_time']}")
                for rec in game['analysis']['recommendations']:
                    print(f"  - {rec}")
    
    def start_scheduler(self):
        """Start the scheduled analysis"""
        # Run daily at 2 PM
        schedule.every().day.at("14:00").do(self.run_daily_analysis)
        
        # Run hourly during game time (6 PM - 11 PM)
        for hour in range(18, 24):
            schedule.every().day.at(f"{hour:02d}:00").do(self.run_daily_analysis)
        
        print("Scheduler started - waiting for scheduled times...")
        
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute

# Usage
if __name__ == "__main__":
    scheduler = ScheduledAnalyzer()
    
    # Run once immediately for testing
    scheduler.run_daily_analysis()
    
    # Start scheduler
    # scheduler.start_scheduler()
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. API Connection Problems

**Problem**: Network errors or timeouts when fetching data.

**Solutions**:
```javascript
// Check API connectivity
async function diagnoseApiConnection() {
    const apiService = new ApiService();
    
    try {
        // Test basic connectivity
        const response = await fetch('https://statsapi.mlb.com/api/v1/teams');
        console.log('Direct API access:', response.status === 200 ? 'OK' : 'Failed');
        
        // Test through proxy
        const proxyResponse = await fetch('https://cors-anywhere.herokuapp.com/https://statsapi.mlb.com/api/v1/teams');
        console.log('Proxy API access:', proxyResponse.status === 200 ? 'OK' : 'Failed');
        
    } catch (error) {
        console.error('Connection diagnosis failed:', error);
        
        // Suggest solutions
        console.log('Suggested solutions:');
        console.log('1. Check internet connection');
        console.log('2. Try using a different CORS proxy');
        console.log('3. Check if MLB API is down');
    }
}

// Alternative proxy configuration
config.api.proxyUrl = 'https://api.allorigins.win/raw?url=';
```

#### 2. Data Loading Issues

**Problem**: Team statistics or other data not loading properly.

**Solutions**:
```javascript
// Debug data loading
async function debugDataLoading(teamId) {
    const apiService = new ApiService();
    const errorHandler = new ErrorHandler();
    
    try {
        console.log(`Testing data load for team ${teamId}`);
        
        // Test each data source
        const tests = [
            { name: 'Team Stats', fn: () => apiService.getTeamStats(teamId) },
            { name: 'Team Roster', fn: () => apiService.getTeamRoster(teamId) },
            { name: 'Venue Info', fn: () => apiService.getVenueInfo(teamId) }
        ];
        
        for (const test of tests) {
            try {
                const result = await test.fn();
                console.log(`✓ ${test.name}: Success`);
                console.log('  Sample data:', JSON.stringify(result).substring(0, 100) + '...');
            } catch (error) {
                console.error(`✗ ${test.name}: Failed`, error.message);
            }
        }
        
    } catch (error) {
        errorHandler.handleApiError(error, 'Data loading debug');
    }
}

// Clear cache if data seems stale
apiService.clearCache();
```

#### 3. Performance Issues

**Problem**: Slow loading or unresponsive interface.

**Solutions**:
```javascript
// Performance monitoring
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
    }
    
    startTiming(operation) {
        this.metrics[operation] = performance.now();
    }
    
    endTiming(operation) {
        if (this.metrics[operation]) {
            const duration = performance.now() - this.metrics[operation];
            console.log(`${operation} took ${duration.toFixed(2)}ms`);
            delete this.metrics[operation];
            return duration;
        }
    }
    
    measureApiCall(apiFunction) {
        return async (...args) => {
            this.startTiming('API Call');
            try {
                const result = await apiFunction(...args);
                this.endTiming('API Call');
                return result;
            } catch (error) {
                this.endTiming('API Call');
                throw error;
            }
        };
    }
}

// Usage
const monitor = new PerformanceMonitor();
const monitoredApiService = {
    getTeamStats: monitor.measureApiCall(apiService.getTeamStats.bind(apiService))
};

// Optimize loading
const optimizedAnalyzer = {
    async fastTeamLoad(teamId) {
        // Load only essential data first
        const essentialData = await apiService.getTeamStats(teamId);
        
        // Update UI immediately
        updateTeamStatsTable('home', processTeamStats(essentialData));
        
        // Load additional data in background
        setTimeout(async () => {
            const [injuries, bullpen] = await Promise.all([
                apiService.getTeamInjuries(teamId),
                apiService.getBullpenStatus(teamId)
            ]);
            updateAdditionalData(injuries, bullpen);
        }, 100);
    }
};
```

#### 4. Python Environment Issues

**Problem**: Python dependencies or module import errors.

**Solutions**:
```bash
# Check Python environment
python --version  # Should be 3.8+

# Install missing packages
pip install pandas numpy scikit-learn pybaseball requests python-dotenv statsmodels

# Alternative installation with conda
conda install pandas numpy scikit-learn requests python-dotenv
pip install pybaseball statsmodels

# Fix import issues
python -c "import pandas, numpy, pybaseball; print('All imports successful')"
```

```python
# Handle import errors gracefully
try:
    from pybaseball import statcast, team_batting, team_pitching
    PYBASEBALL_AVAILABLE = True
except ImportError:
    print("Warning: pybaseball not available, using mock data")
    PYBASEBALL_AVAILABLE = False
    
    # Mock implementations
    def team_batting(year):
        return pd.DataFrame({
            'Team': ['NYY', 'BOS'],
            'AVG': [0.265, 0.270],
            'OBP': [0.330, 0.340],
            'SLG': [0.445, 0.435]
        })
```

---

## Performance Optimization

### 1. Caching Strategies

```javascript
// Advanced caching with expiration and persistence
class AdvancedCache {
    constructor() {
        this.cache = new Map();
        this.localStorage = window.localStorage;
        this.loadFromPersistentStorage();
    }
    
    set(key, data, ttl = 300000) { // 5 minutes default
        const expiresAt = Date.now() + ttl;
        const cacheItem = { data, expiresAt };
        
        this.cache.set(key, cacheItem);
        
        // Persist to localStorage
        try {
            this.localStorage.setItem(`mlb_cache_${key}`, JSON.stringify(cacheItem));
        } catch (error) {
            console.warn('Failed to persist cache item:', error);
        }
    }
    
    get(key) {
        let item = this.cache.get(key);
        
        // Try localStorage if not in memory
        if (!item) {
            try {
                const stored = this.localStorage.getItem(`mlb_cache_${key}`);
                if (stored) {
                    item = JSON.parse(stored);
                    this.cache.set(key, item);
                }
            } catch (error) {
                console.warn('Failed to load from localStorage:', error);
            }
        }
        
        if (item && Date.now() < item.expiresAt) {
            return item.data;
        }
        
        // Clean up expired item
        if (item) {
            this.delete(key);
        }
        
        return null;
    }
    
    delete(key) {
        this.cache.delete(key);
        this.localStorage.removeItem(`mlb_cache_${key}`);
    }
    
    loadFromPersistentStorage() {
        for (let i = 0; i < this.localStorage.length; i++) {
            const key = this.localStorage.key(i);
            if (key.startsWith('mlb_cache_')) {
                const cacheKey = key.replace('mlb_cache_', '');
                try {
                    const item = JSON.parse(this.localStorage.getItem(key));
                    if (Date.now() < item.expiresAt) {
                        this.cache.set(cacheKey, item);
                    } else {
                        this.localStorage.removeItem(key);
                    }
                } catch (error) {
                    this.localStorage.removeItem(key);
                }
            }
        }
    }
}
```

### 2. Batch Processing

```javascript
// Batch API requests to reduce network overhead
class BatchProcessor {
    constructor(apiService) {
        this.apiService = apiService;
        this.batchQueue = [];
        this.batchTimeout = null;
        this.batchDelay = 100; // 100ms batch window
    }
    
    addToBatch(operation) {
        return new Promise((resolve, reject) => {
            this.batchQueue.push({ operation, resolve, reject });
            
            if (this.batchTimeout) {
                clearTimeout(this.batchTimeout);
            }
            
            this.batchTimeout = setTimeout(() => {
                this.processBatch();
            }, this.batchDelay);
        });
    }
    
    async processBatch() {
        if (this.batchQueue.length === 0) return;
        
        const currentBatch = [...this.batchQueue];
        this.batchQueue = [];
        
        try {
            // Group similar operations
            const grouped = this.groupOperations(currentBatch);
            
            // Process each group
            for (const [type, operations] of Object.entries(grouped)) {
                await this.processOperationGroup(type, operations);
            }
            
        } catch (error) {
            // Reject all operations in batch
            currentBatch.forEach(item => item.reject(error));
        }
    }
    
    groupOperations(batch) {
        const grouped = {};
        
        batch.forEach(item => {
            const { operation } = item;
            const type = operation.type;
            
            if (!grouped[type]) {
                grouped[type] = [];
            }
            
            grouped[type].push(item);
        });
        
        return grouped;
    }
    
    async processOperationGroup(type, operations) {
        switch (type) {
            case 'teamStats':
                await this.batchTeamStats(operations);
                break;
            case 'pitcherStats':
                await this.batchPitcherStats(operations);
                break;
            default:
                // Process individually
                for (const op of operations) {
                    try {
                        const result = await this.apiService[op.operation.method](...op.operation.args);
                        op.resolve(result);
                    } catch (error) {
                        op.reject(error);
                    }
                }
        }
    }
}
```

### 3. Memory Management

```javascript
// Memory-efficient data handling
class MemoryManager {
    constructor() {
        this.dataStore = new WeakMap();
        this.sizeLimit = 50 * 1024 * 1024; // 50MB limit
        this.currentSize = 0;
    }
    
    store(key, data) {
        const serialized = JSON.stringify(data);
        const size = new Blob([serialized]).size;
        
        if (this.currentSize + size > this.sizeLimit) {
            this.cleanup();
        }
        
        this.dataStore.set(key, { data, size });
        this.currentSize += size;
    }
    
    retrieve(key) {
        const stored = this.dataStore.get(key);
        return stored ? stored.data : null;
    }
    
    cleanup() {
        // Implement LRU cleanup or other strategies
        console.log('Memory cleanup triggered');
        // Reset size tracking
        this.currentSize = 0;
    }
}
```

---

## Customization Guide

### 1. Custom Analysis Parameters

```javascript
// Customize analysis weights and thresholds
const customConfig = {
    analysis: {
        weights: {
            // Batting weights
            avg: 0.15,
            obp: 0.25,
            slg: 0.30,
            iso: 0.20,
            babip: 0.10,
            
            // Pitching weights
            era: 0.30,
            whip: 0.25,
            k9: 0.25,
            bb9: 0.20
        },
        
        thresholds: {
            spread: 1.5,      // Lower threshold for spread value
            total: 2.5,       // Lower threshold for total value
            confidence: 0.65  // Minimum confidence level
        },
        
        // Custom park factors
        parkFactors: {
            'coors_field': { runs: 1.2, hr: 1.4 },
            'petco_park': { runs: 0.9, hr: 0.8 },
            'fenway_park': { runs: 1.1, hr: 1.2 }
        }
    }
};

// Apply custom configuration
Object.assign(config.analysis, customConfig.analysis);
```

### 2. Custom UI Themes

```css
/* Custom dark theme */
.dark-theme {
    --primary-color: #4fc3f7;
    --secondary-color: #f48fb1;
    --bg-primary: #121212;
    --bg-secondary: #1e1e1e;
    --text-primary: #ffffff;
    --text-secondary: #b0b0b0;
}

.dark-theme .team-stats table {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
}

.dark-theme .form-control {
    background-color: var(--bg-secondary);
    border-color: #444;
    color: var(--text-primary);
}

/* Custom team colors */
.team-yankees { --team-color: #132448; }
.team-redsox { --team-color: #bd3039; }
.team-dodgers { --team-color: #005a9c; }

.team-stats.team-yankees .recent-stat {
    color: var(--team-color);
}
```

### 3. Custom Data Sources

```javascript
// Integrate additional data sources
class CustomDataProvider {
    constructor() {
        this.weatherApi = 'https://api.openweathermap.org/data/2.5';
        this.injuryApi = 'https://custom-injury-api.com';
    }
    
    async getWeatherData(venueLocation) {
        try {
            const response = await fetch(
                `${this.weatherApi}/weather?q=${venueLocation}&appid=YOUR_API_KEY`
            );
            const data = await response.json();
            
            return {
                temperature: data.main.temp,
                windSpeed: data.wind.speed,
                windDirection: data.wind.deg,
                humidity: data.main.humidity,
                conditions: data.weather[0].main
            };
        } catch (error) {
            console.error('Weather data fetch failed:', error);
            return null;
        }
    }
    
    async getAdvancedInjuryData(teamId) {
        try {
            const response = await fetch(`${this.injuryApi}/teams/${teamId}/injuries`);
            const data = await response.json();
            
            return data.map(injury => ({
                ...injury,
                impactScore: this.calculateInjuryImpact(injury),
                estimatedReturn: this.estimateReturnDate(injury)
            }));
        } catch (error) {
            console.error('Advanced injury data fetch failed:', error);
            return [];
        }
    }
    
    calculateInjuryImpact(injury) {
        // Custom impact calculation
        const positionWeights = {
            'Pitcher': 0.8,
            'Catcher': 0.7,
            'First Baseman': 0.5,
            'Shortstop': 0.6
        };
        
        const severityWeights = {
            'Day-to-Day': 0.2,
            '15-Day IL': 0.6,
            '60-Day IL': 0.9
        };
        
        const position = injury.player.position.name;
        const severity = injury.status;
        
        return (positionWeights[position] || 0.4) * (severityWeights[severity] || 0.3);
    }
}

// Integration with main analyzer
MLBAnalyzer.prototype.customDataProvider = new CustomDataProvider();

MLBAnalyzer.prototype.getEnhancedAnalysis = async function(homeTeam, awayTeam) {
    const [basicAnalysis, weather, injuries] = await Promise.all([
        this.analyzeMatchup(),
        this.customDataProvider.getWeatherData('New York, NY'),
        this.customDataProvider.getAdvancedInjuryData(homeTeam.id)
    ]);
    
    return {
        ...basicAnalysis,
        weather,
        injuries,
        enhancedProjections: this.calculateEnhancedProjections(basicAnalysis, weather, injuries)
    };
};
```

This comprehensive usage guide provides developers and users with detailed instructions for implementing, customizing, and extending the MLB Betting Analyzer for their specific needs. The examples cover everything from basic usage to advanced integrations and performance optimizations.