import pandas as pd
import sqlite3
import os
from typing import Dict, Tuple


def process_stats_with_rosters(year: int, division: int) -> Dict[str, int]:
    div_name = f"d{division}"
    base_path = "C:/Users/kellyjc/Desktop/d3_app_improved/backend"

    rosters = pd.read_csv(f"{base_path}/data/{div_name}_rosters_{year}.csv")
    batting = pd.read_csv(
        f"{base_path}/data/stats/{div_name}_batting_{year}.csv")
    pitching = pd.read_csv(
        f"{base_path}/data/stats/{div_name}_pitching_{year}.csv")

    if 'player_id' in batting.columns:
        batting = batting.drop(columns=['player_id'])
    if 'player_id' in pitching.columns:
        pitching = pitching.drop(columns=['player_id'])

    def prepare_for_merge(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df['match_name'] = df['player_name'].str.strip().str.lower()
        df['match_team'] = df['team_name'].str.strip().str.lower()
        return df

    rosters = prepare_for_merge(rosters)
    batting = prepare_for_merge(batting)
    pitching = prepare_for_merge(pitching)

    # Merge using lowercase columns for matching
    batting_with_ids = batting.merge(
        rosters[['match_name', 'match_team', 'player_id']],
        on=['match_name', 'match_team'],
        how='left'
    )

    pitching_with_ids = pitching.merge(
        rosters[['match_name', 'match_team', 'player_id']],
        on=['match_name', 'match_team'],
        how='left'
    )

    # Remove temporary matching columns
    batting_with_ids = batting_with_ids.drop(
        columns=['match_name', 'match_team'])
    pitching_with_ids = pitching_with_ids.drop(
        columns=['match_name', 'match_team'])

    # Save to database
    conn = sqlite3.connect(f"{base_path}/ncaa.db")

    def safe_to_sql(df: pd.DataFrame, table_name: str):
        df.to_sql(table_name, conn, if_exists='replace', index=False)
        row_count = pd.read_sql(
            f"SELECT COUNT(*) as count FROM {table_name}", conn)['count'].iloc[0]
        print(f"Wrote {row_count} rows to table {table_name}")

    safe_to_sql(batting_with_ids, f"{div_name}_batting_{year}")
    safe_to_sql(pitching_with_ids, f"{div_name}_pitching_{year}")

    conn.close()

    # Save CSV files
    batting_with_ids.to_csv(
        f"{base_path}/data/stats/{div_name}_batting_{year}.csv", index=False)
    pitching_with_ids.to_csv(
        f"{base_path}/data/stats/{div_name}_pitching_{year}.csv", index=False)

    # Return match statistics
    return {
        'batting_total': len(batting),
        'batting_matched': batting_with_ids['player_id'].notna().sum(),
        'pitching_total': len(pitching),
        'pitching_matched': pitching_with_ids['player_id'].notna().sum()
    }


def main():
    for year in range(2021, 2025):
        print(f"Processing year: {year}")

        for division in range(1, 4):
            print(f"Processing division: {division}")

            results = process_stats_with_rosters(year, division)

            print(f"Division {division} results:")
            batting_pct = 100 * \
                results['batting_matched'] / results['batting_total']
            pitching_pct = 100 * \
                results['pitching_matched'] / results['pitching_total']
            print(
                f"Batting: matched {results['batting_matched']} of {results['batting_total']} players ({batting_pct:.1f}%)")
            print(
                f"Pitching: matched {results['pitching_matched']} of {results['pitching_total']} players ({pitching_pct:.1f}%)")


if __name__ == '__main__':
    main()
