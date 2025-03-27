# MLB Betting Analyzer

A sophisticated web application for analyzing MLB matchups and providing data-driven betting insights. This tool combines real-time statistics, advanced analytics, and machine learning to help users make informed betting decisions.

## Features

- **Real-time Team Statistics**
  - Batting averages, OBP, SLG, ISO, and BABIP
  - Team ERA, WHIP, and other pitching metrics
  - Starting pitcher performance analysis
  - Bullpen status and fatigue tracking

- **Advanced Analytics**
  - Run expectancy calculations
  - Weather impact analysis
  - Ballpark factor adjustments
  - Head-to-head matchup history

- **Comprehensive Analysis**
  - Spread value calculations
  - Over/under recommendations
  - Team advantage assessments
  - Confidence ratings for predictions

- **Additional Information**
  - Injury reports
  - Bullpen availability
  - Recent performance trends
  - Venue-specific statistics

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mlb-betting-analyzer.git
cd mlb-betting-analyzer
```

2. Open `index.html` in your web browser or set up a local server:
```bash
python -m http.server 8000
# Then visit http://localhost:8000
```

3. Select teams and input market values to begin analysis.

## Usage

1. **Team Selection**
   - Choose home and away teams from the dropdown menus
   - Statistics will automatically populate

2. **Pitcher Selection**
   - Select starting pitchers for both teams
   - View detailed pitcher statistics

3. **Market Values**
   - Enter current betting spread
   - Input over/under total
   - Select weather conditions

4. **Analysis**
   - Click "Analyze Matchup" for comprehensive results
   - Review confidence ratings and recommendations
   - Check injury reports and bullpen status

## Technical Details

### Dependencies
- Bootstrap 5.3.0
- Font Awesome 6.0.0
- MLB Stats API

### Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### API Usage
The application uses the MLB Stats API for real-time data. Please note:
- API calls are rate-limited
- Some data may be delayed by up to 15 minutes
- CORS proxy may be required for certain endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Development

### Setup
1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Testing
```bash
npm test
```

## Code Style

Follow the style guide in `style-guide.md` for consistent development. Key points:
- Use semantic HTML
- Follow BEM naming convention
- Maintain responsive design principles
- Implement proper error handling

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- MLB Stats API for providing real-time baseball statistics
- Bootstrap team for the responsive framework
- Font Awesome for the comprehensive icon set

## Support

For support, please:
1. Check the [FAQ](docs/FAQ.md)
2. Search existing [Issues](https://github.com/yourusername/mlb-betting-analyzer/issues)
3. Create a new issue if needed

## Roadmap

- [ ] Add historical betting trends
- [ ] Implement machine learning predictions
- [ ] Add player prop analysis
- [ ] Include live game tracking
- [ ] Develop mobile app version

## Authors

- Your Name - Initial work - [YourGitHub](https://github.com/yourusername)

## Version History

* 1.0.0
    * Initial Release
    * Basic analysis functionality
    * Team and pitcher statistics
* 1.1.0
    * Added weather impact analysis
    * Improved confidence ratings
    * Enhanced UI/UX

## Contact

