# MLB Betting Analyzer

A sophisticated web-based tool for analyzing MLB matchups and identifying betting value. The analyzer combines real-time team statistics, starting pitcher performance, weather conditions, and advanced analytics to provide data-driven betting recommendations.

![MLB Betting Analyzer](https://raw.githubusercontent.com/atravelingman/mlb-betting-analyzer/main/screenshot.png)

## 🌟 Features

### Real-Time Statistics
- **Team Performance Metrics**
  - Batting Average (AVG)
  - On-base Percentage (OBP)
  - Slugging Percentage (SLG)
  - Isolated Power (ISO)
  - BABIP (Batting Average on Balls in Play)
  - Team ERA
  - Team WHIP

- **Starting Pitcher Analysis**
  - ERA (Last 3 starts)
  - WHIP (Last 3 starts)
  - K/9 (Strikeouts per 9 innings)
  - BB/9 (Walks per 9 innings)

### Advanced Analytics

#### Ballpark Analysis
- Detailed dimensions for all fields
- Park-specific run scoring factors
- Home run index
- Weather impact considerations

#### Head-to-Head Analysis
- Season series record
- Last 5 matchups
- Pitcher vs. Team performance
- Historical matchup trends

#### Bullpen Status
- Recent usage tracking
- Fatigue indicators
- Performance metrics
- Availability status

#### Injury Impact
- Real-time injury updates
- Impact assessment
- Position-specific analysis
- Roster depth evaluation

### Weather Impact Analysis

| Condition | Run Impact | HR Impact | Details |
|-----------|------------|-----------|----------|
| Normal | 1.0x | 1.0x | Baseline conditions |
| Wind Out | 1.15x | 1.3x | Increased scoring potential |
| Wind In | 0.85x | 0.7x | Reduced scoring potential |
| Rain | 0.9x | 0.85x | Slightly suppressed scoring |
| Hot (85°F+) | 1.1x | 1.15x | Enhanced scoring conditions |
| Cold (<50°F) | 0.9x | 0.8x | Reduced scoring potential |
| Dome | 1.0x | 1.0x | Controlled environment |

## 🚀 Getting Started

### Prerequisites
- Modern web browser
- Internet connection for real-time data

### Installation

1. Clone the repository:
```bash
git clone https://github.com/atravelingman/mlb-betting-analyzer.git
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the local server:
```bash
python -m http.server 8000
```

4. Open in your browser:
```
http://localhost:8000
```

## 📊 How to Use

1. **Select Teams**
   - Choose home and away teams from the dropdowns
   - Statistics automatically populate

2. **Choose Pitchers**
   - Select starting pitchers for both teams
   - View their recent performance metrics

3. **Set Conditions**
   - Select weather conditions
   - Input current market lines
   - Review ballpark factors

4. **Analyze Results**
   - Click "Analyze Matchup"
   - Review projected scores
   - Check value recommendations
   - Consider additional factors

## 🧮 Analysis Methodology

### Run Expectancy Calculation
The analyzer uses a sophisticated formula incorporating:
- Team OPS (4.0x weight)
- Starting Pitcher WHIP (2.5x weight)
- Team BABIP (1.5x weight)
- Isolated Power (2.0x weight)
- Starting Pitcher ERA impact
- K/9 impact
- Weather adjustments

### Value Detection Thresholds
- Spread value: 2.0 runs
- Total value: 3.0 runs

## 📱 Modern UI Features

- Responsive design for all devices
- Real-time updates
- Interactive statistics display
- Clear visual indicators
- Tooltips for advanced metrics
- Historical tracking
- Status updates

## ⚠️ Disclaimer

This tool is for educational and entertainment purposes only. Please gamble responsibly and in accordance with your local laws and regulations. Past performance does not guarantee future results.

## 🔄 Updates

The analyzer is regularly updated with:
- Latest MLB statistics
- New analytical features
- UI improvements
- Bug fixes
- Performance optimizations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- MLB Stats API for real-time data
- Bootstrap for UI components
- Community contributors
- MLB statistical community

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers directly.

---
Made with ❤️ for baseball analytics enthusiasts
