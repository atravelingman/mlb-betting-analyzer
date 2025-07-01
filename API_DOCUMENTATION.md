# MLB Betting Analyzer - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [JavaScript APIs](#javascript-apis)
3. [Python APIs](#python-apis)
4. [Configuration](#configuration)
5. [Error Handling](#error-handling)
6. [Usage Examples](#usage-examples)
7. [Best Practices](#best-practices)

## Overview

The MLB Betting Analyzer is a comprehensive web-based tool for analyzing MLB matchups and identifying betting value. It consists of:

- **Frontend JavaScript modules** for data fetching, UI management, and real-time analysis
- **Python algorithms** for statistical analysis and betting value calculation
- **Configuration system** for API endpoints and analysis parameters
- **Error handling** for robust operation

---

## JavaScript APIs

### 1. MLBAnalyzer Class

The main application controller that orchestrates all analysis functionality.

#### Constructor
```javascript
new MLBAnalyzer()
```

Creates a new analyzer instance with initialized services and event listeners.

**Example:**
```javascript
const analyzer = new MLBAnalyzer();
```

#### Public Methods

##### `updateTeamStats()`
```javascript
async updateTeamStats()
```

Initializes and populates team data for all MLB teams.

**Returns:** `Promise<void>`

**Example:**
```javascript
await analyzer.updateTeamStats();
```

##### `analyzeMatchup()`
```javascript
async analyzeMatchup()
```

Performs complete matchup analysis using form data.

**Example:**
```javascript
// Ensure form fields are populated first
document.getElementById('homeTeamSelect').value = '147'; // Yankees
document.getElementById('awayTeamSelect').value = '111'; // Red Sox
document.getElementById('marketSpread').value = '-1.5';
document.getElementById('marketTotal').value = '8.5';

await analyzer.analyzeMatchup();
```

##### `fetchTeamStats(side)`
```javascript
async fetchTeamStats(side)
```

Fetches and processes team statistics.

**Parameters:**
- `side` (string): Either 'home' or 'away'

**Returns:** `Promise<Object>` - Processed team statistics

**Example:**
```javascript
const homeStats = await analyzer.fetchTeamStats('home');
console.log(homeStats.batting.avg); // "0.275"
```

##### `fetchHeadToHead(homeTeam, awayTeam)`
```javascript
async fetchHeadToHead(homeTeam, awayTeam)
```

Retrieves head-to-head matchup data.

**Parameters:**
- `homeTeam` (string): Home team ID
- `awayTeam` (string): Away team ID

**Example:**
```javascript
await analyzer.fetchHeadToHead('147', '111'); // Yankees vs Red Sox
```

---

### 2. ApiService Class

Handles all external API communications with retry logic and caching.

#### Constructor
```javascript
new ApiService()
```

#### Public Methods

##### `makeApiCall(endpoint, options)`
```javascript
async makeApiCall(endpoint, options = {})
```

Generic API call method with retry and caching.

**Parameters:**
- `endpoint` (string): API endpoint URL
- `options` (Object): Request options

**Returns:** `Promise<Object>` - API response data

**Example:**
```javascript
const apiService = new ApiService();
const data = await apiService.makeApiCall('/teams/147/stats');
```

##### `getTeamStats(teamId)`
```javascript
async getTeamStats(teamId)
```

Fetches team statistics for hitting and pitching.

**Parameters:**
- `teamId` (string): MLB team ID

**Returns:** `Promise<Object>` - Team statistics

**Example:**
```javascript
const stats = await apiService.getTeamStats('147');
// Returns: { stats: [...] }
```

##### `getTeamRoster(teamId)`
```javascript
async getTeamRoster(teamId)
```

Retrieves active team roster.

**Parameters:**
- `teamId` (string): MLB team ID

**Example:**
```javascript
const roster = await apiService.getTeamRoster('147');
```

##### `getPitcherStats(pitcherId)`
```javascript
async getPitcherStats(pitcherId)
```

Gets individual pitcher statistics.

**Parameters:**
- `pitcherId` (string): Player ID

**Example:**
```javascript
const pitcherData = await apiService.getPitcherStats('123456');
```

##### `getHeadToHead(teamId, opponentId)`
```javascript
async getHeadToHead(teamId, opponentId)
```

Fetches head-to-head game history.

**Parameters:**
- `teamId` (string): Primary team ID
- `opponentId` (string): Opponent team ID

##### `clearCache()`
```javascript
clearCache()
```

Clears all cached API responses.

---

### 3. DataService Class

Extended data processing and team management.

#### Constructor
```javascript
new DataService()
```

#### Public Methods

##### `getTeams()`
```javascript
async getTeams()
```

Returns complete MLB team data.

**Returns:** `Promise<Array>` - Array of team objects

**Example:**
```javascript
const teams = await dataService.getTeams();
// Returns: [{ id: 110, name: "Baltimore Orioles", abbreviation: "BAL" }, ...]
```

##### `getTeamStats(teamId)`
```javascript
async getTeamStats(teamId)
```

Advanced team statistics with season and recent performance.

**Returns:** `Promise<Object>` - Comprehensive team stats

**Example:**
```javascript
const stats = await dataService.getTeamStats('147');
console.log(stats.batting.avg);     // Current performance
console.log(stats.season.batting.avg); // Season average
```

##### `getBallparkInfo(teamId)`
```javascript
async getBallparkInfo(teamId)
```

Retrieves ballpark dimensions and characteristics.

**Returns:** `Promise<Object>` - Ballpark information

**Example:**
```javascript
const ballpark = await dataService.getBallparkInfo('147');
// Returns: { name: "Yankee Stadium", dimensions: { leftField: "318", ... } }
```

---

### 4. Utils Class

Static utility functions for data processing and formatting.

#### Static Methods

##### `formatNumber(value, decimals)`
```javascript
static formatNumber(value, decimals = 2)
```

Formats numbers to specified decimal places.

**Parameters:**
- `value` (number): Number to format
- `decimals` (number): Decimal places (default: 2)

**Returns:** `string` - Formatted number

**Example:**
```javascript
Utils.formatNumber(0.12345, 3); // "0.123"
Utils.formatNumber(4.567);      // "4.57"
```

##### `formatDate(dateString)`
```javascript
static formatDate(dateString)
```

Formats date strings for display.

**Example:**
```javascript
Utils.formatDate('2024-03-15'); // "Mar 15, 2024"
```

##### `debounce(func, wait)`
```javascript
static debounce(func, wait)
```

Creates a debounced function.

**Parameters:**
- `func` (Function): Function to debounce
- `wait` (number): Wait time in milliseconds

**Example:**
```javascript
const debouncedSave = Utils.debounce(() => {
    console.log('Saving...');
}, 300);
```

##### `calculateWeightedAverage(values, weights)`
```javascript
static calculateWeightedAverage(values, weights)
```

Calculates weighted average of values.

**Parameters:**
- `values` (Array<number>): Array of values
- `weights` (Array<number>): Array of weights

**Example:**
```javascript
const avg = Utils.calculateWeightedAverage([10, 20, 30], [1, 2, 3]);
// Returns weighted average
```

##### `calculateParkFactors(dimensions)`
```javascript
static calculateParkFactors(dimensions)
```

Calculates park factor effects on offense.

**Parameters:**
- `dimensions` (Object): Ballpark dimensions

**Example:**
```javascript
const factors = Utils.calculateParkFactors({
    leftField: 310,
    centerField: 400,
    rightField: 325
});
// Returns: { overall: 1.1, leftField: 1.15, ... }
```

---

### 5. ErrorHandler Class

Centralized error management and user feedback.

#### Constructor
```javascript
new ErrorHandler()
```

#### Public Methods

##### `showMessage(message, duration, type)`
```javascript
showMessage(message, duration = 5000, type = 'error')
```

Displays user messages.

**Parameters:**
- `message` (string): Message to display
- `duration` (number): Display duration in ms
- `type` (string): Message type ('error', 'warning', 'info')

**Example:**
```javascript
const errorHandler = new ErrorHandler();
errorHandler.showMessage('Team data updated successfully', 3000, 'info');
```

##### `handleApiError(error, context)`
```javascript
handleApiError(error, context)
```

Handles API errors with appropriate user feedback.

**Parameters:**
- `error` (Error): Error object
- `context` (string): Error context description

**Example:**
```javascript
try {
    await apiCall();
} catch (error) {
    errorHandler.handleApiError(error, 'Team stats fetch');
}
```

##### `validateFormData(formData)`
```javascript
validateFormData(formData)
```

Validates form input data.

**Returns:** `Object` - Validation result

**Example:**
```javascript
const validation = errorHandler.validateFormData({
    homeTeam: '147',
    awayTeam: '111',
    marketSpread: -1.5
});

if (!validation.isValid) {
    console.log(validation.errors);
}
```

---

### 6. LoadingHandler Class

Manages loading states and UI feedback.

#### Constructor
```javascript
new LoadingHandler()
```

#### Public Methods

##### `showLoading(context, message)`
```javascript
showLoading(context, message = 'Loading...')
```

Shows loading indicator for specific context.

**Parameters:**
- `context` (string): Loading context identifier
- `message` (string): Loading message

**Example:**
```javascript
const loadingHandler = new LoadingHandler();
loadingHandler.showLoading('teamStats', 'Fetching team statistics...');
```

##### `hideLoading(context)`
```javascript
hideLoading(context)
```

Hides loading indicator for context.

**Example:**
```javascript
loadingHandler.hideLoading('teamStats');
```

##### `createLoadingWrapper(asyncFn, context, loadingMessage)`
```javascript
createLoadingWrapper(asyncFn, context, loadingMessage)
```

Wraps async functions with loading states.

**Returns:** `Function` - Wrapped function

**Example:**
```javascript
const wrappedFetch = loadingHandler.createLoadingWrapper(
    fetchTeamData,
    'teamFetch',
    'Loading team data...'
);
```

---

## Python APIs

### 1. MLBBettingAnalyzer Class

Advanced statistical analysis and betting value calculation.

#### Constructor
```python
MLBBettingAnalyzer()
```

Initializes analyzer with machine learning models.

**Example:**
```python
analyzer = MLBBettingAnalyzer()
```

#### Public Methods

##### `get_team_stats()`
```python
def get_team_stats()
```

Fetches current season team statistics.

**Returns:** `tuple` - (batting_stats, pitching_stats) DataFrames

**Example:**
```python
batting, pitching = analyzer.get_team_stats()
print(batting[['Team', 'AVG', 'OBP', 'SLG']])
```

##### `analyze_matchup(home_team, away_team)`
```python
def analyze_matchup(home_team, away_team)
```

Analyzes specific team matchup.

**Parameters:**
- `home_team` (str): Home team abbreviation
- `away_team` (str): Away team abbreviation

**Returns:** `dict` - Matchup analysis results

**Example:**
```python
result = analyzer.analyze_matchup('NYY', 'BOS')
print(f"Projected spread: {result['projected_spread']}")
print(f"Projected total: {result['projected_total']}")
```

##### `find_value(home_team, away_team, market_spread, market_total)`
```python
def find_value(home_team, away_team, market_spread, market_total)
```

Identifies betting value opportunities.

**Parameters:**
- `home_team` (str): Home team abbreviation
- `away_team` (str): Away team abbreviation  
- `market_spread` (float): Current market spread
- `market_total` (float): Current market total

**Returns:** `dict` - Value analysis with recommendations

**Example:**
```python
value = analyzer.find_value('NYY', 'BOS', -1.5, 8.5)
print(f"Spread value: {value['spread_value']} runs")
for rec in value['recommendations']:
    print(f"- {rec}")
```

##### `calculate_run_expectancy(team_stats)`
```python
def calculate_run_expectancy(team_stats)
```

Calculates expected runs for team.

**Parameters:**
- `team_stats` (DataFrame): Team offensive statistics

**Returns:** `DataFrame` - Stats with expected runs

---

### 2. MLBManualAnalyzer Class

Manual team statistics management and analysis.

#### Constructor
```python
MLBManualAnalyzer()
```

#### Public Methods

##### `add_team_stats(team_name, avg, obp, slg, era, whip)`
```python
def add_team_stats(team_name, avg, obp, slg, era, whip)
```

Manually adds team statistics.

**Parameters:**
- `team_name` (str): Team name/abbreviation
- `avg` (float): Batting average
- `obp` (float): On-base percentage
- `slg` (float): Slugging percentage
- `era` (float): Team ERA
- `whip` (float): Team WHIP

**Example:**
```python
analyzer = MLBManualAnalyzer()
analyzer.add_team_stats('NYY', 0.265, 0.330, 0.445, 3.85, 1.23)
```

##### `calculate_run_expectancy(team_name)`
```python
def calculate_run_expectancy(team_name)
```

Calculates expected runs for team.

**Returns:** `float` - Expected runs per game

**Example:**
```python
expected_runs = analyzer.calculate_run_expectancy('NYY')
print(f"Expected runs: {expected_runs}")
```

##### `analyze_matchup(home_team, away_team)`
```python
def analyze_matchup(home_team, away_team)
```

Analyzes matchup using manual stats.

**Example:**
```python
matchup = analyzer.analyze_matchup('NYY', 'BOS')
print(f"Home projected: {matchup['home_projected']}")
print(f"Away projected: {matchup['away_projected']}")
```

---

## Configuration

### Main Configuration Object

The `config` object contains all application settings:

```javascript
// API Configuration
config.api.baseUrl          // MLB Stats API base URL
config.api.timeout          // Request timeout (30000ms)
config.api.retryAttempts    // Number of retry attempts (3)
config.api.endpoints        // API endpoint definitions

// Analysis Thresholds
config.analysis.thresholds.spread    // Spread value threshold (2.0)
config.analysis.thresholds.total     // Total value threshold (3.0)

// Weather Impact Factors
config.weather.wind_out    // Wind blowing out effects
config.weather.wind_in     // Wind blowing in effects
config.weather.dome        // Dome environment effects

// UI Settings
config.ui.updateInterval   // Auto-update interval (60000ms)
config.ui.colors           // Color scheme definitions
```

### Environment Configuration

Development vs production settings:

```javascript
// Development mode
if (process.env.NODE_ENV === 'development') {
    config.debug.enabled = true;
    config.cache.duration = 60000; // Shorter cache
}
```

---

## Error Handling

### Error Types

The system handles various error types:

1. **Network Errors** - Connection issues, timeouts
2. **API Errors** - Rate limits, invalid responses
3. **Validation Errors** - Invalid input data
4. **Processing Errors** - Data parsing failures

### Error Response Format

```javascript
{
    type: 'error_type',
    message: 'Human readable message',
    code: 'ERROR_CODE',
    details: { /* additional error details */ }
}
```

### Custom Error Handling

```javascript
try {
    await apiService.getTeamStats('147');
} catch (error) {
    if (error.code === 'RATE_LIMIT') {
        // Handle rate limiting
        await new Promise(resolve => setTimeout(resolve, 60000));
        // Retry request
    } else {
        errorHandler.handleApiError(error, 'Team stats fetch');
    }
}
```

---

## Usage Examples

### Complete Matchup Analysis

```javascript
// Initialize analyzer
const analyzer = new MLBAnalyzer();

// Set up matchup
document.getElementById('homeTeamSelect').value = '147'; // Yankees
document.getElementById('awayTeamSelect').value = '111'; // Red Sox
document.getElementById('marketSpread').value = '-1.5';
document.getElementById('marketTotal').value = '8.5';
document.getElementById('weather').value = 'normal';

// Run analysis
await analyzer.analyzeMatchup();

// Results will be displayed in UI automatically
```

### Manual Python Analysis

```python
from mlb_betting_algorithm import MLBBettingAnalyzer

# Initialize
analyzer = MLBBettingAnalyzer()

# Analyze specific matchup
value_analysis = analyzer.find_value('NYY', 'BOS', -1.5, 8.5)

# Display results
print("Value Analysis Results:")
print(f"Spread Value: {value_analysis['spread_value']} runs")
print(f"Total Value: {value_analysis['total_value']} runs")

for recommendation in value_analysis['recommendations']:
    print(f"- {recommendation}")
```

### Custom Team Data Entry

```python
from mlb_manual_analyzer import MLBManualAnalyzer

# Initialize manual analyzer
analyzer = MLBManualAnalyzer()

# Add custom team stats
analyzer.add_team_stats("NYY", 0.265, 0.330, 0.445, 3.85, 1.23)
analyzer.add_team_stats("BOS", 0.270, 0.340, 0.435, 4.05, 1.28)

# Analyze with custom data
result = analyzer.analyze_matchup("NYY", "BOS")
```

### Error Handling Example

```javascript
const errorHandler = new ErrorHandler();
const loadingHandler = new LoadingHandler();

async function safeTeamStatsFetch(teamId) {
    const context = `team-${teamId}`;
    
    try {
        loadingHandler.showLoading(context, 'Fetching team data...');
        
        const stats = await apiService.getTeamStats(teamId);
        
        errorHandler.showMessage('Team data loaded successfully', 2000, 'info');
        return stats;
        
    } catch (error) {
        errorHandler.handleApiError(error, 'Team statistics');
        return null;
    } finally {
        loadingHandler.hideLoading(context);
    }
}
```

---

## Best Practices

### 1. API Usage

- **Always use error handling** around API calls
- **Implement retry logic** for failed requests
- **Cache responses** to reduce API load
- **Respect rate limits** (60 requests per minute)

### 2. Data Validation

- **Validate all inputs** before processing
- **Use type checking** for function parameters
- **Sanitize user inputs** to prevent errors

### 3. Performance

- **Use debouncing** for user input handlers
- **Implement loading states** for better UX
- **Cache computed results** when possible
- **Minimize DOM manipulations**

### 4. Error Recovery

- **Provide fallback data** when APIs fail
- **Show meaningful error messages** to users
- **Log errors** for debugging
- **Gracefully degrade** functionality

### 5. Code Organization

- **Use consistent naming** conventions
- **Document all public APIs** with JSDoc
- **Separate concerns** into focused modules
- **Keep functions small** and single-purpose

### 6. Testing

```javascript
// Example test structure
describe('ApiService', () => {
    test('should fetch team stats successfully', async () => {
        const apiService = new ApiService();
        const stats = await apiService.getTeamStats('147');
        expect(stats).toBeDefined();
        expect(stats.stats).toBeInstanceOf(Array);
    });
});
```

### 7. Configuration Management

- **Use environment variables** for sensitive data
- **Centralize configuration** in config files
- **Provide defaults** for all settings
- **Document configuration options**

---

## API Reference Quick Guide

### JavaScript Classes
- `MLBAnalyzer` - Main application controller
- `ApiService` - API communication
- `DataService` - Data processing
- `Utils` - Utility functions
- `ErrorHandler` - Error management
- `LoadingHandler` - Loading states

### Python Classes
- `MLBBettingAnalyzer` - Statistical analysis
- `MLBManualAnalyzer` - Manual data entry

### Key Configuration
- `config.api` - API settings
- `config.analysis` - Analysis parameters
- `config.ui` - UI configuration

For detailed implementation examples, see the individual module files and test cases.