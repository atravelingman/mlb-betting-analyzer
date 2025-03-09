import pandas as pd
import numpy as np
from pybaseball import statcast, team_batting, team_pitching
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import warnings
warnings.filterwarnings('ignore')

class MLBBettingAnalyzer:
    def __init__(self):
        self.current_year = datetime.now().year
        self.scaler = StandardScaler()
        self.spread_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.totals_model = RandomForestRegressor(n_estimators=100, random_state=42)
        
    def get_team_stats(self):
        """Fetch current team batting and pitching stats"""
        try:
            # Get the current year's stats
            batting_stats = team_batting(self.current_year).reset_index()
            pitching_stats = team_pitching(self.current_year).reset_index()
            
            # Select relevant features that are available
            batting_features = ['Team', 'AVG', 'OBP', 'SLG', 'OPS']
            pitching_features = ['Team', 'ERA', 'WHIP', 'SO9', 'BB9']
            
            batting_stats = batting_stats[batting_features]
            pitching_stats = pitching_stats[pitching_features]
            
            # Clean team names to match input format
            batting_stats['Team'] = batting_stats['Team'].str.upper()
            pitching_stats['Team'] = pitching_stats['Team'].str.upper()
            
            return batting_stats, pitching_stats
        except Exception as e:
            print(f"Error fetching team stats: {e}")
            return None, None

    def calculate_run_expectancy(self, team_stats):
        """Calculate expected runs based on team offensive metrics"""
        # Simplified run expectancy formula using OPS
        team_stats['ExpectedRuns'] = (
            team_stats['OPS'] * 5.5  # OPS correlation with runs
        )
        return team_stats

    def analyze_matchup(self, home_team, away_team):
        """Analyze a specific matchup between two teams"""
        batting_stats, pitching_stats = self.get_team_stats()
        if batting_stats is None or pitching_stats is None:
            return None

        # Get team specific stats
        home_batting = batting_stats[batting_stats['Team'] == home_team]
        home_pitching = pitching_stats[pitching_stats['Team'] == home_team]
        away_batting = batting_stats[batting_stats['Team'] == away_team]
        away_pitching = pitching_stats[pitching_stats['Team'] == away_team]

        # Calculate expected runs
        home_exp_runs = self.calculate_run_expectancy(home_batting)['ExpectedRuns'].values[0]
        away_exp_runs = self.calculate_run_expectancy(away_batting)['ExpectedRuns'].values[0]

        # Adjust for pitching
        home_runs_allowed = float(home_pitching['ERA'].values[0]) / 9 * 9  # Convert ERA to runs per game
        away_runs_allowed = float(away_pitching['ERA'].values[0]) / 9 * 9

        # Final projected scores
        home_projected = (home_exp_runs + away_runs_allowed) / 2
        away_projected = (away_exp_runs + home_runs_allowed) / 2

        # Calculate projected spread and total
        projected_spread = home_projected - away_projected
        projected_total = home_projected + away_projected

        return {
            'home_projected': round(home_projected, 2),
            'away_projected': round(away_projected, 2),
            'projected_spread': round(projected_spread, 2),
            'projected_total': round(projected_total, 2)
        }

    def find_value(self, home_team, away_team, market_spread, market_total):
        """
        Find value in betting lines compared to projected outcomes
        
        Parameters:
        - home_team: Home team name
        - away_team: Away team name
        - market_spread: Current market spread (positive for home team underdog)
        - market_total: Current market total (over/under)
        
        Returns: Dictionary with value opportunities
        """
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
    # Example usage
    analyzer = MLBBettingAnalyzer()
    
    # Example matchup
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