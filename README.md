# MLB Betting Analyzer

A sophisticated tool for analyzing MLB matchups and identifying betting value, incorporating team statistics, starting pitcher performance, and weather conditions.

## Features

### Team Statistics
- Batting Statistics:
  - AVG (Batting Average)
  - OBP (On-base Percentage)
  - SLG (Slugging Percentage)
  - ISO (Isolated Power)
  - BABIP (Batting Average on Balls in Play)

- Pitching Statistics:
  - ERA (Earned Run Average)
  - WHIP (Walks + Hits per Inning Pitched)

### Starting Pitcher Analysis
- Individual Pitcher Statistics:
  - ERA (Last 3 starts)
  - WHIP (Last 3 starts)
  - K/9 (Strikeouts per 9 innings)
  - BB/9 (Walks per 9 innings)

### Weather Impact Factors
The analyzer incorporates detailed weather analysis that can significantly impact game outcomes. Each weather condition affects both overall run scoring and home run probability through specific physical effects on ball flight and player performance.

| Weather Condition | Runs Factor | HR Factor | Detailed Impact Analysis |
|------------------|-------------|------------|-------------------------|
| Normal (65-75°F) | 1.0 | 1.0 | Baseline conditions with moderate temperature and minimal wind. Ideal for normal baseball performance. |
| Wind Out (10+ mph) | 1.15 | 1.3 | - Increases ball carry distance by 15-25 feet on average\n- Particularly impacts fly balls and potential home runs\n- Most significant in stadiums with shorter fences\n- Greater effect when blowing out to center field |
| Wind In (10+ mph) | 0.85 | 0.7 | - Reduces ball carry distance by 15-20 feet\n- Turns potential home runs into warning track outs\n- More pronounced effect on fly balls than line drives\n- Creates advantage for ground ball pitchers |
| Rain | 0.9 | 0.85 | - Heavier baseball reduces ball flight distance\n- Wet field slows ground balls\n- Reduced visibility affects hitting\n- Pitchers may struggle with grip\n- Higher likelihood of errors |
| Hot (85°F+) | 1.1 | 1.15 | - Air density decreases, increasing ball carry\n- Pitcher fatigue increases more rapidly\n- Baseball becomes more elastic\n- Breaking balls less effective\n- Particularly impactful in day games |
| Cold (Below 50°F) | 0.9 | 0.8 | - Denser air reduces ball flight\n- Broken bats more common\n- Reduced ball elasticity\n- More painful contact for hitters\n- Pitchers may struggle with grip and feel |
| Dome | 1.0 | 1.0 | - Controlled environment eliminates weather variables\n- Consistent temperature and humidity\n- No wind effects\n- Optimal visibility\n- Some domes may have specific effects based on their design |

#### Additional Weather Considerations:
- **Humidity**: High humidity can slightly increase scoring as the baseball becomes less dense
- **Altitude**: Higher elevation parks (like Coors Field) see increased scoring due to thinner air
- **Time of Day**: Day games in hot weather show higher scoring than night games
- **Wind Direction**: Cross-winds can affect pitch movement and fielding
- **Precipitation**: Even light rain can impact pitcher grip and defensive performance

#### How Weather Factors Are Applied:
1. Base run expectancy is calculated using team and pitcher statistics
2. Weather factors are applied as multipliers to both runs and home run projections
3. Multiple weather conditions may be combined (e.g., cold and wind in)
4. Dome games ignore all weather factors except altitude effects
5. Weather impacts are weighted more heavily for teams with:
   - High fly ball rates
   - Power-hitting lineups
   - Extreme park factors

### Run Expectancy Calculation
The analyzer uses a sophisticated formula that incorporates:
1. Team OPS (weighted at 4.0)
2. Starting Pitcher WHIP impact (weighted at 2.5)
3. Team BABIP (weighted at 1.5)
4. Isolated Power (weighted at 2.0)
5. Starting Pitcher ERA impact
6. Starting Pitcher K/9 impact
7. Weather adjustments

### Value Detection
The analyzer identifies betting value by comparing projected scores to market lines:
- Spread threshold: 2.0 runs
- Total threshold: 3.0 runs

## How to Use

1. Select home and away teams from the dropdowns
2. Wait for team statistics to auto-populate
3. Select starting pitchers for both teams
4. Choose the weather condition for the game
5. Enter the market spread and total
6. Click "Analyze Matchup" to get:
   - Projected scores
   - Spread value
   - Total value
   - Betting recommendations

## Technical Details

The analyzer uses the MLB Stats API to fetch:
- Current season team statistics
- Active roster information
- Individual pitcher statistics
- Recent performance metrics

All projections are bounded between 2 and 8 runs per team to maintain realistic expectations.

## Installation

1. Clone this repository
2. Install required packages:
```bash
pip install -r requirements.txt
```

## Usage

The algorithm can be used by running the main script:

```bash
python mlb_betting_algorithm.py
```

To analyze a specific matchup, modify the parameters in the `main()` function:

```python
home_team = "NYY"  # Home team abbreviation
away_team = "BOS"  # Away team abbreviation
market_spread = -1.5  # Negative means home team is favored
market_total = 8.5  # Over/under total for the game
```

## How It Works

1. **Data Collection**: The algorithm fetches current season statistics for all MLB teams using the `pybaseball` package.

2. **Run Expectancy**: Calculates expected runs for each team based on:
   - Offensive metrics (OPS, wRC+)
   - Pitching performance (ERA, FIP, WHIP)

3. **Value Analysis**: Compares projected outcomes to market lines:
   - Spread value threshold: 2.0 runs
   - Total value threshold: 3.0 runs

4. **Recommendations**: Provides betting recommendations when the projected difference exceeds thresholds.

## Output

The algorithm outputs:
- Spread value (in runs)
- Total value (in runs)
- Specific betting recommendations when value is found

## Important Notes

- This is a mathematical model and should be used as one of many tools for betting analysis
- Always consider other factors like:
  - Recent team performance
  - Starting pitchers
  - Weather conditions
  - Injuries
  - Head-to-head history

## Disclaimer

This tool is for educational purposes only. Please gamble responsibly and in accordance with your local laws and regulations.
