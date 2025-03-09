# MLB Betting Value Algorithm

This algorithm analyzes MLB baseball games to find potential value in spreads and totals by comparing projected outcomes to market lines.

## Features

- Team performance analysis using advanced metrics (OPS, wRC+, ERA, FIP, etc.)
- Run expectancy calculations based on offensive and pitching metrics
- Value identification for both spreads and totals
- Configurable thresholds for value betting opportunities

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