# MLB Betting Analyzer - Component Documentation

## Table of Contents

1. [UI Components Overview](#ui-components-overview)
2. [Form Components](#form-components)
3. [Data Display Components](#data-display-components)
4. [Interaction Components](#interaction-components)
5. [Status and Feedback Components](#status-and-feedback-components)
6. [Component Integration](#component-integration)
7. [Styling and Themes](#styling-and-themes)
8. [Accessibility](#accessibility)

## UI Components Overview

The MLB Betting Analyzer interface consists of several key component categories:

- **Form Controls** - Team selection, market input, weather settings
- **Data Tables** - Team statistics, injury reports, bullpen status
- **Analysis Displays** - Matchup results, value calculations, recommendations
- **Feedback Systems** - Loading indicators, error messages, status updates

---

## Form Components

### 1. Team Selection Component

Controls for selecting home and away teams for analysis.

#### HTML Structure
```html
<div class="team-selection">
    <div class="form-group">
        <label for="homeTeamSelect">Home Team</label>
        <select id="homeTeamSelect" class="form-control">
            <option value="">Select a team...</option>
            <!-- Options populated dynamically -->
        </select>
    </div>
    
    <div class="form-group">
        <label for="awayTeamSelect">Away Team</label>
        <select id="awayTeamSelect" class="form-control">
            <option value="">Select a team...</option>
            <!-- Options populated dynamically -->
        </select>
    </div>
</div>
```

#### JavaScript Integration
```javascript
// Team selection event handling
homeTeamSelect.addEventListener('change', Utils.debounce(async () => {
    if (homeTeamSelect.value) {
        await analyzer.handleTeamSelection('home', homeTeamSelect.value);
    }
}, 300));
```

#### Usage Example
```javascript
// Programmatically set team selection
document.getElementById('homeTeamSelect').value = '147'; // Yankees
document.getElementById('awayTeamSelect').value = '111'; // Red Sox

// Trigger change events
homeTeamSelect.dispatchEvent(new Event('change'));
awayTeamSelect.dispatchEvent(new Event('change'));
```

### 2. Market Input Component

Input fields for betting market data (spreads, totals).

#### HTML Structure
```html
<div class="market-inputs">
    <div class="form-row">
        <div class="form-group col-md-6">
            <label for="marketSpread">Market Spread</label>
            <input type="number" id="marketSpread" class="form-control" 
                   step="0.5" min="-20" max="20" placeholder="e.g., -1.5">
        </div>
        
        <div class="form-group col-md-6">
            <label for="marketTotal">Market Total</label>
            <input type="number" id="marketTotal" class="form-control" 
                   step="0.5" min="5" max="20" placeholder="e.g., 8.5">
        </div>
    </div>
</div>
```

#### Validation
```javascript
// Input validation example
function validateMarketInputs() {
    const spread = parseFloat(document.getElementById('marketSpread').value);
    const total = parseFloat(document.getElementById('marketTotal').value);
    
    if (isNaN(spread) || spread < -20 || spread > 20) {
        throw new Error('Spread must be between -20 and 20');
    }
    
    if (isNaN(total) || total < 5 || total > 20) {
        throw new Error('Total must be between 5 and 20');
    }
    
    return { spread, total };
}
```

### 3. Weather Selection Component

Dropdown for weather condition selection affecting analysis.

#### HTML Structure
```html
<div class="weather-selection">
    <label for="weather">Weather Conditions</label>
    <select id="weather" class="form-control">
        <option value="normal">Normal</option>
        <option value="wind_out">Wind Blowing Out</option>
        <option value="wind_in">Wind Blowing In</option>
        <option value="rain">Rain</option>
        <option value="hot">Hot Weather</option>
        <option value="cold">Cold Weather</option>
        <option value="dome">Dome</option>
    </select>
</div>
```

#### Weather Impact Integration
```javascript
// Weather effects on analysis
const weatherFactors = {
    normal: { runs: 1.0, hr: 1.0 },
    wind_out: { runs: 1.15, hr: 1.3 },
    wind_in: { runs: 0.85, hr: 0.7 },
    rain: { runs: 0.9, hr: 0.85 },
    hot: { runs: 1.1, hr: 1.15 },
    cold: { runs: 0.9, hr: 0.8 },
    dome: { runs: 1.0, hr: 1.0 }
};
```

---

## Data Display Components

### 1. Team Statistics Table

Displays comprehensive team batting and pitching statistics.

#### HTML Structure
```html
<div class="team-stats-container">
    <h3>Team Statistics</h3>
    
    <!-- Home Team Stats -->
    <div class="team-stats home-stats">
        <h4>Home Team</h4>
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Recent (7 days)</th>
                    <th>Season</th>
                    <th>League Rank</th>
                </tr>
            </thead>
            <tbody id="homeStatsTable">
                <!-- Stats populated dynamically -->
            </tbody>
        </table>
    </div>
    
    <!-- Away Team Stats -->
    <div class="team-stats away-stats">
        <h4>Away Team</h4>
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Recent (7 days)</th>
                    <th>Season</th>
                    <th>League Rank</th>
                </tr>
            </thead>
            <tbody id="awayStatsTable">
                <!-- Stats populated dynamically -->
            </tbody>
        </table>
    </div>
</div>
```

#### JavaScript Population
```javascript
// Populate team stats table
function updateTeamStatsTable(side, stats) {
    const tableBody = document.getElementById(`${side}StatsTable`);
    
    const statsRows = [
        { label: 'Batting Avg', recent: stats.batting.avg, season: stats.season.batting.avg },
        { label: 'On-Base %', recent: stats.batting.obp, season: stats.season.batting.obp },
        { label: 'Slugging %', recent: stats.batting.slg, season: stats.season.batting.slg },
        { label: 'ERA', recent: stats.pitching.era, season: stats.season.pitching.era },
        { label: 'WHIP', recent: stats.pitching.whip, season: stats.season.pitching.whip }
    ];
    
    tableBody.innerHTML = statsRows.map(row => `
        <tr>
            <td>${row.label}</td>
            <td class="recent-stat">${row.recent}</td>
            <td class="season-stat">${row.season}</td>
            <td class="rank-indicator"><!-- Rank populated separately --></td>
        </tr>
    `).join('');
}
```

### 2. Injury Report Component

Displays current team injuries and their impact assessment.

#### HTML Structure
```html
<div class="injury-report">
    <h4>Injury Report</h4>
    <table class="table table-sm">
        <thead>
            <tr>
                <th>Player</th>
                <th>Status</th>
                <th>Impact</th>
                <th>Position</th>
            </tr>
        </thead>
        <tbody id="homeInjuryTable">
            <!-- Injury data populated dynamically -->
        </tbody>
    </table>
</div>
```

#### Status Styling
```css
.injury-status-day-to-day { color: #ffc107; }
.injury-status-disabled { color: #dc3545; }
.injury-status-questionable { color: #fd7e14; }
.injury-status-probable { color: #28a745; }
```

#### JavaScript Integration
```javascript
// Injury impact assessment
function calculateInjuryImpact(injury) {
    const position = injury.player?.primaryPosition?.name;
    const status = injury.status;
    
    const impactLevels = {
        'Starting Pitcher': { disabled: 'High', questionable: 'Medium' },
        'Catcher': { disabled: 'High', questionable: 'Medium' },
        'First Baseman': { disabled: 'Medium', questionable: 'Low' },
        // ... other positions
    };
    
    return impactLevels[position]?.[status] || 'Low';
}
```

### 3. Bullpen Status Component

Shows relief pitcher availability and fatigue levels.

#### HTML Structure
```html
<div class="bullpen-status">
    <h4>Bullpen Status</h4>
    <table class="table table-sm">
        <thead>
            <tr>
                <th>Pitcher</th>
                <th>Recent Games</th>
                <th>Fatigue Level</th>
                <th>Available</th>
            </tr>
        </thead>
        <tbody id="homeBullpenTable">
            <!-- Bullpen data populated dynamically -->
        </tbody>
    </table>
</div>
```

#### Fatigue Indicators
```css
.fatigue-indicator {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 5px;
}

.fatigue-fresh { background-color: #28a745; }
.fatigue-available { background-color: #ffc107; }
.fatigue-tired { background-color: #fd7e14; }
.fatigue-unavailable { background-color: #dc3545; }
```

### 4. Ballpark Information Component

Displays venue details and dimensional factors.

#### HTML Structure
```html
<div class="ballpark-info">
    <h4>Ballpark Information</h4>
    <div class="ballpark-details">
        <div class="dimension-item">
            <label>Left Field:</label>
            <span id="lfDistance">N/A</span>
        </div>
        <div class="dimension-item">
            <label>Center Field:</label>
            <span id="cfDistance">N/A</span>
        </div>
        <div class="dimension-item">
            <label>Right Field:</label>
            <span id="rfDistance">N/A</span>
        </div>
    </div>
</div>
```

---

## Interaction Components

### 1. Analysis Trigger Button

Primary action button to start matchup analysis.

#### HTML Structure
```html
<div class="analysis-controls">
    <button id="analyzeBtn" class="btn btn-primary btn-lg" onclick="analyzer.analyzeMatchup()">
        <i class="fas fa-chart-line"></i>
        Analyze Matchup
    </button>
</div>
```

#### State Management
```javascript
// Button state control
function setAnalysisButtonState(enabled, text = 'Analyze Matchup') {
    const button = document.getElementById('analyzeBtn');
    button.disabled = !enabled;
    button.innerHTML = enabled ? 
        '<i class="fas fa-chart-line"></i> ' + text :
        '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
}
```

### 2. Update History Component

Shows recent data updates and their timestamps.

#### HTML Structure
```html
<div class="update-history">
    <h5>Recent Updates</h5>
    <div id="updateList" class="update-list">
        <!-- Updates populated dynamically -->
    </div>
    <div class="last-update">
        Last updated: <span id="lastUpdate">Never</span>
    </div>
</div>
```

#### Update Tracking
```javascript
// Add update to history
function addUpdateToHistory(type, message) {
    const updateList = document.getElementById('updateList');
    const timestamp = new Date().toLocaleTimeString();
    
    const updateItem = document.createElement('div');
    updateItem.className = 'update-item';
    updateItem.innerHTML = `
        <span class="update-type">${type}:</span>
        <span class="update-message">${message}</span>
        <span class="update-time">${timestamp}</span>
    `;
    
    updateList.insertBefore(updateItem, updateList.firstChild);
    
    // Keep only last 5 updates
    while (updateList.children.length > 5) {
        updateList.removeChild(updateList.lastChild);
    }
}
```

---

## Status and Feedback Components

### 1. Loading Indicators

Various loading states throughout the application.

#### HTML Structure
```html
<!-- Global loading overlay -->
<div id="loading" class="loading-overlay" style="display: none;">
    <div class="loading-content">
        <div class="spinner-border text-primary" role="status">
            <span class="sr-only">Loading...</span>
        </div>
        <p id="loadingMessage">Loading...</p>
    </div>
</div>

<!-- Contextual loading indicators -->
<div id="homeTeamLoad" class="loading-indicator" style="display: none;">
    <small class="text-muted">
        <i class="fas fa-spinner fa-spin"></i> Loading team data...
    </small>
</div>
```

#### CSS Styling
```css
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.loading-content {
    text-align: center;
    color: white;
}

.loading-indicator {
    padding: 5px 0;
}
```

### 2. Error Message Component

Centralized error display system.

#### HTML Structure
```html
<div id="error" class="alert alert-dismissible fade" style="display: none;">
    <span id="errorMessage"></span>
    <button type="button" class="close" onclick="errorHandler.hideMessage()">
        <span>&times;</span>
    </button>
</div>
```

#### Error Types and Styling
```css
.alert-error { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24; }
.alert-warning { background-color: #fff3cd; border-color: #ffeaa7; color: #856404; }
.alert-info { background-color: #d1ecf1; border-color: #bee5eb; color: #0c5460; }
.alert-success { background-color: #d4edda; border-color: #c3e6cb; color: #155724; }
```

### 3. Results Display Component

Shows analysis results and betting recommendations.

#### HTML Structure
```html
<div id="resultsContainer" class="results-container" style="display: none;">
    <h3>Analysis Results</h3>
    
    <div class="result-section">
        <h4>Projected Scores</h4>
        <div class="score-display">
            <div class="team-score">
                <span class="team-name" id="awayTeamName">Away Team</span>
                <span class="projected-score" id="awayProjected">0</span>
            </div>
            <div class="vs-separator">@</div>
            <div class="team-score">
                <span class="team-name" id="homeTeamName">Home Team</span>
                <span class="projected-score" id="homeProjected">0</span>
            </div>
        </div>
    </div>
    
    <div class="result-section">
        <h4>Value Opportunities</h4>
        <div id="valueRecommendations" class="recommendations">
            <!-- Recommendations populated dynamically -->
        </div>
    </div>
    
    <div class="result-section">
        <h4>Confidence Level</h4>
        <div class="confidence-display">
            <div id="confidenceLevel" class="confidence-badge">Medium</div>
            <div id="confidenceReason" class="confidence-reason"></div>
        </div>
    </div>
</div>
```

#### Results Population
```javascript
// Update results display
function updateResultsDisplay(results) {
    const container = document.getElementById('resultsContainer');
    
    // Update projected scores
    document.getElementById('homeProjected').textContent = results.homeProjected;
    document.getElementById('awayProjected').textContent = results.awayProjected;
    
    // Update recommendations
    const recommendationsContainer = document.getElementById('valueRecommendations');
    recommendationsContainer.innerHTML = results.recommendations.map(rec => `
        <div class="recommendation-item ${rec.type}">
            <i class="fas fa-arrow-up"></i>
            <span>${rec.text}</span>
            <span class="confidence">${rec.confidence}</span>
        </div>
    `).join('');
    
    // Update confidence
    document.getElementById('confidenceLevel').textContent = results.confidence.level;
    document.getElementById('confidenceLevel').className = `confidence-badge ${results.confidence.level.toLowerCase()}`;
    
    // Show results
    container.style.display = 'block';
}
```

---

## Component Integration

### 1. Event Flow

The component interaction follows this general flow:

```
User Input → Validation → API Call → Loading State → Data Processing → UI Update
```

#### Example Integration
```javascript
// Complete interaction flow
async function handleTeamSelectionFlow(side, teamId) {
    try {
        // 1. Show loading
        loadingHandler.showLoading(`${side}Team`, `Loading ${side} team data...`);
        
        // 2. Validate input
        if (!teamId) {
            throw new Error('Team selection required');
        }
        
        // 3. Fetch data
        const teamData = await apiService.getTeamStats(teamId);
        
        // 4. Process and validate
        const processedStats = processTeamStats(teamData);
        
        // 5. Update UI components
        updateTeamStatsTable(side, processedStats);
        updateInjuryTable(side, teamData.injuries);
        updateBullpenStatus(side, teamData.bullpen);
        
        // 6. Add to update history
        addUpdateToHistory('Team Data', `${side} team statistics updated`);
        
        // 7. Check if analysis can be run
        checkAnalysisReadiness();
        
    } catch (error) {
        errorHandler.handleApiError(error, `${side} team selection`);
    } finally {
        loadingHandler.hideLoading(`${side}Team`);
    }
}
```

### 2. State Management

Components share state through a centralized state object:

```javascript
const appState = {
    teams: {
        home: { id: null, name: null, stats: null },
        away: { id: null, name: null, stats: null }
    },
    market: {
        spread: null,
        total: null
    },
    weather: 'normal',
    lastAnalysis: null,
    isLoading: false,
    errors: []
};

// State update functions
function updateTeamState(side, data) {
    appState.teams[side] = { ...appState.teams[side], ...data };
    broadcastStateChange('team', side);
}

function updateMarketState(data) {
    appState.market = { ...appState.market, ...data };
    broadcastStateChange('market');
}
```

### 3. Component Communication

Components communicate through custom events:

```javascript
// Event dispatcher
class ComponentEventDispatcher extends EventTarget {
    dispatch(type, detail) {
        this.dispatchEvent(new CustomEvent(type, { detail }));
    }
}

const eventDispatcher = new ComponentEventDispatcher();

// Component listeners
eventDispatcher.addEventListener('teamUpdated', (event) => {
    const { side, data } = event.detail;
    updateDependentComponents(side, data);
});

eventDispatcher.addEventListener('analysisComplete', (event) => {
    updateResultsComponents(event.detail);
});
```

---

## Styling and Themes

### 1. CSS Custom Properties

The application uses CSS custom properties for theming:

```css
:root {
    --primary-color: #1a237e;
    --secondary-color: #c62828;
    --success-color: #4caf50;
    --warning-color: #ffc107;
    --danger-color: #f44336;
    --info-color: #2196f3;
    
    --bg-primary: #ffffff;
    --bg-secondary: #f8f9fa;
    --text-primary: #212529;
    --text-secondary: #6c757d;
    
    --border-radius: 4px;
    --box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    --transition: all 0.2s ease-in-out;
}
```

### 2. Component-Specific Styling

```css
/* Team selection styling */
.team-selection .form-group {
    margin-bottom: 1rem;
}

.team-selection select:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.2rem rgba(26, 35, 126, 0.25);
}

/* Statistics table styling */
.team-stats table {
    border-collapse: collapse;
    width: 100%;
}

.team-stats .recent-stat {
    font-weight: bold;
    color: var(--primary-color);
}

.team-stats .season-stat {
    color: var(--text-secondary);
}

/* Results display styling */
.results-container {
    background: var(--bg-secondary);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    margin-top: 2rem;
}

.confidence-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-weight: bold;
    text-transform: uppercase;
}

.confidence-badge.high { background-color: var(--success-color); color: white; }
.confidence-badge.medium { background-color: var(--warning-color); color: black; }
.confidence-badge.low { background-color: var(--danger-color); color: white; }
```

### 3. Responsive Design

```css
/* Mobile-first responsive design */
@media (max-width: 768px) {
    .team-stats {
        margin-bottom: 2rem;
    }
    
    .form-row {
        flex-direction: column;
    }
    
    .ballpark-details {
        display: block;
    }
    
    .score-display {
        flex-direction: column;
        text-align: center;
    }
}

@media (min-width: 769px) {
    .team-stats-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
    }
    
    .score-display {
        display: flex;
        justify-content: space-around;
        align-items: center;
    }
}
```

---

## Accessibility

### 1. ARIA Labels and Roles

```html
<!-- Accessible form controls -->
<label for="homeTeamSelect">Home Team</label>
<select id="homeTeamSelect" class="form-control" 
        aria-label="Select home team" 
        aria-describedby="homeTeamHelp">
    <!-- options -->
</select>
<small id="homeTeamHelp" class="form-text text-muted">
    Select the team playing at home
</small>

<!-- Accessible tables -->
<table class="table" role="table" aria-label="Team batting statistics">
    <caption class="sr-only">Team batting and pitching statistics comparison</caption>
    <thead>
        <tr role="row">
            <th scope="col">Metric</th>
            <th scope="col">Recent Performance</th>
            <th scope="col">Season Average</th>
        </tr>
    </thead>
</table>

<!-- Accessible loading states -->
<div id="loading" role="status" aria-live="polite" aria-label="Loading team data">
    <div class="spinner-border" aria-hidden="true"></div>
    <span class="sr-only">Loading...</span>
</div>
```

### 2. Keyboard Navigation

```javascript
// Keyboard navigation support
document.addEventListener('keydown', (event) => {
    // Escape key closes modals/overlays
    if (event.key === 'Escape') {
        closeActiveOverlays();
    }
    
    // Enter key triggers analysis if form is complete
    if (event.key === 'Enter' && isFormComplete()) {
        event.preventDefault();
        analyzer.analyzeMatchup();
    }
    
    // Tab navigation enhancement
    if (event.key === 'Tab') {
        manageFocusOrder(event);
    }
});

// Focus management
function manageFocusOrder(event) {
    const focusableElements = document.querySelectorAll(
        'button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
    
    if (event.shiftKey) {
        // Shift+Tab (previous)
        if (currentIndex === 0) {
            event.preventDefault();
            focusableElements[focusableElements.length - 1].focus();
        }
    } else {
        // Tab (next)
        if (currentIndex === focusableElements.length - 1) {
            event.preventDefault();
            focusableElements[0].focus();
        }
    }
}
```

### 3. Screen Reader Support

```css
/* Screen reader only content */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

/* Focus indicators */
button:focus,
select:focus,
input:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
}

/* High contrast support */
@media (prefers-contrast: high) {
    :root {
        --primary-color: #000000;
        --secondary-color: #000000;
        --bg-primary: #ffffff;
        --text-primary: #000000;
    }
    
    .table {
        border: 2px solid var(--text-primary);
    }
    
    .table th,
    .table td {
        border: 1px solid var(--text-primary);
    }
}
```

---

## Component Testing

### 1. Unit Testing Components

```javascript
// Example component tests
describe('Team Selection Component', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <select id="homeTeamSelect">
                <option value="">Select a team...</option>
                <option value="147">New York Yankees</option>
            </select>
        `;
    });
    
    test('should trigger team selection handler', async () => {
        const mockHandler = jest.fn();
        const select = document.getElementById('homeTeamSelect');
        
        select.addEventListener('change', mockHandler);
        select.value = '147';
        select.dispatchEvent(new Event('change'));
        
        expect(mockHandler).toHaveBeenCalled();
    });
    
    test('should display loading state during data fetch', async () => {
        const loadingHandler = new LoadingHandler();
        
        loadingHandler.showLoading('homeTeam', 'Loading team data...');
        
        const loadingElement = document.getElementById('loading');
        expect(loadingElement.style.display).toBe('block');
    });
});
```

### 2. Integration Testing

```javascript
// Full component integration tests
describe('Complete Analysis Flow', () => {
    test('should complete full analysis workflow', async () => {
        // Setup
        const analyzer = new MLBAnalyzer();
        
        // Set team selections
        document.getElementById('homeTeamSelect').value = '147';
        document.getElementById('awayTeamSelect').value = '111';
        document.getElementById('marketSpread').value = '-1.5';
        document.getElementById('marketTotal').value = '8.5';
        
        // Trigger analysis
        await analyzer.analyzeMatchup();
        
        // Verify results displayed
        const resultsContainer = document.getElementById('resultsContainer');
        expect(resultsContainer.style.display).toBe('block');
    });
});
```

This comprehensive component documentation provides developers with detailed information about all UI components, their structure, interactions, and best practices for implementation and maintenance.