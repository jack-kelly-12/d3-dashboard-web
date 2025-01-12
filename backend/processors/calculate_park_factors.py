import pandas as pd
import os
import sqlite3


def calculate_park_factors(schedules):
    # Filter valid games
    valid_games = schedules[
        schedules['neutral_site'].isna() &
        schedules['home_team_score'].notna() &
        schedules['away_team_score'].notna() &
        (schedules['home_team_id'] != 0) &
        (schedules['away_team_id'] != 0)
    ]

    # Calculate home stats
    home_stats = valid_games.groupby(['home_team_id', 'home_team']).agg({
        'home_team_score': ['sum', 'size']  # Sum of runs and count of games
    }).reset_index()

    # Flatten column names
    home_stats.columns = ['team_id', 'team_name', 'home_runs', 'home_games']

    # Calculate away stats
    away_stats = valid_games.groupby(['away_team_id', 'away_team']).agg({
        'away_team_score': ['sum', 'size']  # Sum of runs and count of games
    }).reset_index()

    # Flatten column names
    away_stats.columns = ['team_id', 'team_name', 'away_runs', 'away_games']

    # Merge home and away stats
    combined_stats = pd.merge(
        home_stats,
        away_stats,
        on=['team_id', 'team_name'],
        how='outer'
    )

    # Fill any missing values with 0
    combined_stats = combined_stats.fillna(0)

    # Calculate total number of teams for PF adjustment
    T = len(combined_stats)

    # Calculate park factors
    park_factors = combined_stats.assign(
        H=lambda x: x['home_runs'] / x['home_games'],  # Runs per game at home
        R=lambda x: x['away_runs'] / x['away_games'],  # Runs per game on road
        raw_PF=lambda x: (x['H'] * T) / ((T - 1) * \
                                         x['R'] + x['H']),  # Raw park factor
        PF=lambda x: (x['raw_PF'] + 1) / 2,  # Regressed park factor
        total_home_games=lambda x: x['home_games'],
        total_away_games=lambda x: x['away_games'],
        Years='2021-2024'  # Add year range
    ).sort_values('PF', ascending=False)

    # Select and order final columns
    final_columns = [
        'team_id', 'team_name', 'Years', 'PF', 'H', 'R',
        'total_home_games', 'total_away_games'
    ]

    return park_factors[final_columns]


# Create directory for park factors if it doesn't exist
os.makedirs('data/park_factors', exist_ok=True)

# Process each division
for division in [1, 2]:
    division_schedules = pd.DataFrame()

    # Read and combine schedules for years 2021-2024
    for year in range(2021, 2025):
        file_path = f'C:/Users/kellyjc/Desktop/d3_app_improved/backend/data/schedules/d{division}_{year}_schedules.csv'

        if os.path.exists(file_path):
            year_schedule = pd.read_csv(file_path)
            division_schedules = pd.concat(
                [division_schedules, year_schedule], ignore_index=True)

    if not division_schedules.empty:
        # Calculate park factors
        park_factors = calculate_park_factors(division_schedules)

        # Save to CSV
        output_path = f'C:/Users/kellyjc/Desktop/d3_app_improved/backend/data/park_factors/d{division}_park_factors.csv'
        park_factors.to_csv(output_path, index=False)
        print(f"Saved park factors for Division {division} to CSV")

        # Save to SQLite
        db_path = '../ncaa.db'
        table_name = f'd{division}_park_factors'

        with sqlite3.connect(db_path) as conn:
            park_factors.to_sql(
                table_name, conn, if_exists='replace', index=False)
            print(
                f"Saved park factors for Division {division} to SQLite table '{table_name}'")
    else:
        print(f"No schedule data found for Division {division}")
