# MLB Game Data Extraction System

## Overview

This system provides comprehensive MLB game data extraction when a user selects a game on the analyzer page. It extracts and populates all 15 required fields as specified, with proper formatting and validation.

## Files Created/Modified

### New Files:
- `js/game-data-extractor.js` - Core data extraction engine
- `js/game-selector.js` - UI component for game selection
- `game-analyzer.html` - Complete interface for game data analysis
- `GAME_DATA_EXTRACTION.md` - This documentation

### Modified Files:
- `js/data-service.js` - Added new API methods for comprehensive data fetching

## Features Implemented

### 1. Game Selection Interface
- **Date Picker**: Select any date to view available games
- **Game Selector**: Dropdown showing all games for the selected date
- **Real-time Loading**: Shows loading indicators during data fetch

### 2. Data Extraction (15 Required Fields)

#### Basic Game Information
1. **Game Date & Time** - Formatted as `2025-07-01T19:05:00` (ET)
2. **Teams** - Full names and abbreviations for away/home teams
3. **Starting Pitchers** - Names and IDs for both teams

#### Odds & Probabilities
4. **Moneyline Odds** - Both teams with proper +/- formatting
5. **Run Line (Spread)** - Value (e.g., -1.5) and odds for both teams
6. **Total Runs (Over/Under)** - Line and odds for both sides
7. **Implied Win Probabilities** - Calculated from moneyline odds
8. **Run Line Implied Probabilities** - Calculated from run line odds
9. **Over/Under Implied Probabilities** - Calculated from total odds

#### Market Analysis
10. **Line Movement** - Opening vs current odds with timestamps
11. **Public vs Sharp Bet Splits** - Percentage breakdowns for each market

#### Environmental Factors
12. **Weather & Ballpark Factors** - Temperature, wind, humidity, park dimensions, and park factors

#### Team Updates
13. **Injury/Lineup Updates** - Real-time player status and lineup changes

#### Analytics
14. **Win Probability Model Output** - Calculated win percentages and confidence metrics
15. **Player Props Summary** - Strikeouts, hits, home runs with odds and probabilities

### 3. Data Format & Validation

#### JSON Output Format
```json
{
  "game_id": "2025-07-01-NYY-TOR",
  "date_time_et": "2025-07-01T19:05:00",
  "teams": {
    "away": {"name": "New York Yankees", "abbreviation": "NYY"},
    "home": {"name": "Toronto Blue Jays", "abbreviation": "TOR"}
  },
  "pitchers": {
    "away": "Gerrit Cole",
    "home": "Alek Manoah"
  },
  "odds": {
    "moneyline": {"away": -150, "home": +130},
    "runline": {"value": -1.5, "away_odds": +130, "home_odds": -150},
    "total": {"line": 8.5, "over_odds": -110, "under_odds": -110}
  },
  "probabilities": {
    "ml_away": "60.0%", "ml_home": "43.5%",
    "rl_away": "43.5%", "rl_home": "60.0%",
    "over": "52.4%", "under": "52.4%"
  },
  "line_movement": {
    "moneyline": {
      "away": {"open": -140, "current": -150, "timestamp": "2025-01-01T10:00:00Z"},
      "home": {"open": +120, "current": +130, "timestamp": "2025-01-01T10:00:00Z"}
    }
  },
  "bet_splits": {
    "moneyline": {"public_away": 65, "public_home": 35, "sharp_away": 45, "sharp_home": 55}
  },
  "weather": {
    "temperature": 72, "wind_speed": 8, "wind_direction": "SW",
    "ballpark": {"name": "Rogers Centre", "park_factor": 1.00}
  },
  "injuries": [
    {"type": "injury", "player": "Aaron Judge", "status": "Day-to-Day", "description": "Minor shoulder strain"}
  ],
  "model": {
    "away_win_pct": "57.8%", "home_win_pct": "42.2%", "confidence": 0.75
  },
  "props": [
    {"type": "Strikeouts", "player": "Gerrit Cole", "line": 6.5, "over_odds": -115, "under_odds": -105}
  ]
}
```

#### Data Validation
- **Numeric Fields**: All odds and probabilities are validated as numbers
- **Required Fields**: Game ID, teams, and pitchers are mandatory
- **Missing Data**: Marked as `null` or `N/A` with clear formatting
- **Odds Formatting**: Proper +/- signs for American odds format

## Usage Instructions

### 1. Open the Game Analyzer
```bash
# Open game-analyzer.html in your browser
open game-analyzer.html
```

### 2. Select a Game
1. **Choose Date**: Use the date picker to select a game date
2. **Select Game**: Choose from available games in the dropdown
3. **View Data**: All 15 fields will be automatically populated

### 3. Access Extracted Data
```javascript
// Get the complete extracted data
const gameData = window.gameSelector.getSelectedGameData();

// Get formatted data matching the specification
const formattedData = window.gameSelector.getFormattedGameData();

console.log('Complete game data:', gameData);
```

## API Integration Points

### Current Implementation
The system currently uses mock data for demonstration, but is designed for easy integration with real APIs:

#### Sportsbook APIs
- **DraftKings API**: For odds and line movement
- **FanDuel API**: For additional odds comparison
- **Action Network**: For betting splits

#### Data Sources
- **MLB Stats API**: For game information and player data
- **Weather APIs**: For current conditions
- **Injury Reports**: For player status updates

### Integration Examples

#### Adding Real Odds Data
```javascript
// In js/data-service.js
async getOddsData(gameId) {
    const response = await fetch(`https://api.draftkings.com/game/${gameId}/odds`);
    return response.json();
}
```

#### Adding Weather Integration
```javascript
// In js/data-service.js
async getWeatherData(gameId) {
    const venue = await this.getVenueByGameId(gameId);
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${venue.lat}&lon=${venue.lon}&appid=${API_KEY}`);
    return response.json();
}
```

## Error Handling

### Graceful Degradation
- **Missing APIs**: Falls back to mock data
- **Network Errors**: Shows user-friendly error messages
- **Invalid Data**: Validates and sanitizes all inputs

### Logging
- **Console Logging**: Detailed logs for debugging
- **Error Tracking**: Comprehensive error reporting
- **Performance Monitoring**: Load time tracking

## Performance Optimization

### Parallel Data Fetching
All 8 data sources are fetched simultaneously:
```javascript
const [gameInfo, oddsData, weatherData, injuryData, lineupData, propData, lineMovementData, betSplitsData] = await Promise.all([
    this.fetchGameInfo(gameId, date),
    this.fetchOddsData(gameId),
    this.fetchWeatherData(gameId),
    // ... other data sources
]);
```

### Caching Strategy
- **API Response Caching**: Reduces redundant API calls
- **Local Storage**: Persists frequently accessed data
- **Rate Limiting**: Respects API rate limits

## Testing

### Manual Testing
1. Select different dates and verify game loading
2. Choose various games and verify data population
3. Check all 15 fields are properly formatted
4. Verify JSON output matches specification

### Automated Testing
```javascript
// Test data extraction
const testGameId = '12345';
const testDate = '2025-01-01';
const result = await gameDataExtractor.extractGameData(testGameId, testDate);

// Verify all required fields
assert(result.game_id, 'Game ID should be present');
assert(result.teams, 'Teams data should be present');
assert(result.odds, 'Odds data should be present');
// ... additional assertions
```

## Future Enhancements

### Planned Features
1. **Real-time Updates**: Live odds and line movement tracking
2. **Historical Data**: Compare current odds with historical trends
3. **Advanced Analytics**: Machine learning models for predictions
4. **Mobile Responsive**: Optimized mobile interface
5. **Export Functionality**: CSV/Excel export of extracted data

### Scalability Considerations
- **API Rate Limiting**: Intelligent request batching
- **Data Compression**: Efficient data storage and transfer
- **CDN Integration**: Fast global content delivery
- **Database Caching**: Persistent data storage for historical analysis

## Troubleshooting

### Common Issues

#### No Games Loading
- Check date format (YYYY-MM-DD)
- Verify API endpoints are accessible
- Check browser console for errors

#### Missing Data Fields
- Verify all API methods are implemented
- Check data source availability
- Review field mapping in `populateGameDataFields()`

#### Slow Loading
- Check network connectivity
- Review API response times
- Consider implementing progressive loading

### Debug Mode
```javascript
// Enable debug logging
window.gameSelector.debugMode = true;

// View current game data
console.log(window.gameSelector.getSelectedGameData());
```

## Support

For technical support or feature requests:
1. Check the browser console for error messages
2. Verify all required files are loaded correctly
3. Test with different games and dates
4. Review the extracted JSON data for completeness

The system is designed to be robust, scalable, and easily maintainable while providing comprehensive MLB game data extraction as specified.