class MLBManualAnalyzer:
    def __init__(self):
        self.team_stats = {}
    
    def add_team_stats(self, team_name, avg, obp, slg, era, whip):
        """Add or update team statistics manually"""
        self.team_stats[team_name] = {
            'AVG': avg,
            'OBP': obp,
            'SLG': slg,
            'OPS': obp + slg,
            'ERA': era,
            'WHIP': whip
        }
    
    def calculate_run_expectancy(self, team_name):
        """Calculate expected runs for a team"""
        stats = self.team_stats[team_name]
        # Basic run expectancy formula
        expected_runs = (
            stats['OPS'] * 4.5 +  # OPS factor
            (1 - stats['WHIP']) * 2.0  # Pitching factor
        )
        return max(2, min(8, expected_runs))  # Clamp between 2 and 8 runs
    
    def analyze_matchup(self, home_team, away_team):
        """Analyze a specific matchup between two teams"""
        if home_team not in self.team_stats or away_team not in self.team_stats:
            return None
        
        # Calculate expected runs
        home_exp_runs = self.calculate_run_expectancy(home_team)
        away_exp_runs = self.calculate_run_expectancy(away_team)
        
        # Calculate projected spread and total
        projected_spread = home_exp_runs - away_exp_runs
        projected_total = home_exp_runs + away_exp_runs
        
        return {
            'home_projected': round(home_exp_runs, 2),
            'away_projected': round(away_exp_runs, 2),
            'projected_spread': round(projected_spread, 2),
            'projected_total': round(projected_total, 2)
        }
    
    def find_value(self, home_team, away_team, market_spread, market_total):
        """Find value in betting lines compared to projected outcomes"""
        projections = self.analyze_matchup(home_team, away_team)
        if not projections:
            return None
        
        spread_value = projections['projected_spread'] - market_spread
        total_value = projections['projected_total'] - market_total
        
        # Define value thresholds
        SPREAD_THRESHOLD = 2.0
        TOTAL_THRESHOLD = 3.0
        
        value_bets = {
            'spread_value': round(spread_value, 2),
            'total_value': round(total_value, 2),
            'recommendations': []
        }
        
        # Spread value analysis
        if abs(spread_value) >= SPREAD_THRESHOLD:
            if spread_value > 0:
                value_bets['recommendations'].append(f"Value on {home_team} spread {market_spread}")
            else:
                value_bets['recommendations'].append(f"Value on {away_team} spread {-market_spread}")
        
        # Total value analysis
        if abs(total_value) >= TOTAL_THRESHOLD:
            if total_value > 0:
                value_bets['recommendations'].append(f"Value on OVER {market_total}")
            else:
                value_bets['recommendations'].append(f"Value on UNDER {market_total}")
        
        return value_bets

def main():
    # Create analyzer instance
    analyzer = MLBManualAnalyzer()
    
    # Add example team stats
    # Team stats format: (AVG, OBP, SLG, ERA, WHIP)
    analyzer.add_team_stats("NYY", 0.265, 0.330, 0.445, 3.85, 1.23)
    analyzer.add_team_stats("BOS", 0.270, 0.340, 0.435, 4.05, 1.28)
    
    # Analyze matchup
    home_team = "NYY"
    away_team = "BOS"
    market_spread = -1.5  # Yankees favored by 1.5
    market_total = 8.5
    
    value_opportunities = analyzer.find_value(home_team, away_team, market_spread, market_total)
    
    if value_opportunities:
        print("\nValue Analysis Results:")
        print(f"Spread Value: {value_opportunities['spread_value']} runs")
        print(f"Total Value: {value_opportunities['total_value']} runs")
        print("\nRecommended Bets:")
        for rec in value_opportunities['recommendations']:
            print(f"- {rec}")

if __name__ == "__main__":
    main() 