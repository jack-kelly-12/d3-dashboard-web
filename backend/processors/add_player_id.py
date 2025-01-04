import pandas as pd
import numpy as np
from typing import List, Dict, Set, Tuple
from collections import defaultdict
import glob


class PlayerMatcher:
    def __init__(self, division: str):
        """
        Initialize PlayerMatcher for a specific division.

        Args:
            division (str): Division identifier (e.g., 'd1', 'd2', 'd3')
        """
        self.division = division.lower()
        self.reset_state()

    def reset_state(self):
        self.next_id = 1
        self.player_info = defaultdict(list)
        self.decisions = []
        self.used_ids = set()

    def _generate_id(self) -> str:
        while True:
            new_id = f"{self.division}-playerid-{self.next_id}"
            self.next_id += 1
            if new_id not in self.used_ids:
                self.used_ids.add(new_id)
                return new_id

    def _clean_name(self, names: pd.Series) -> pd.Series:
        return names.str.strip().str.upper()

    def _is_valid_year_progression(self, years: List[int], yr_values: List[str]) -> bool:
        if len(years) <= 1:
            return True

        yr_map = {'FR': 1, 'SO': 2, 'JR': 3, 'SR': 4}
        numeric_years = [yr_map.get(yr, 0) for yr in yr_values]

        year_pairs = list(zip(sorted(years), sorted(numeric_years)))
        for i in range(len(year_pairs)-1):
            curr_year, curr_yr = year_pairs[i]
            next_year, next_yr = year_pairs[i+1]

            if next_year != curr_year + 1:
                return False

            if next_yr < curr_yr:
                return False

        return True

    def process_files(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Process batting and pitching files for the specified division.

        Args:
            batting_files: List of batting data file paths
            pitching_files: List of pitching data file paths

        Returns:
            Tuple of processed batting and pitching DataFrames
        """
        self.reset_state()

        batting_dfs = []
        pitching_dfs = []

        batting_files = glob.glob(
            f'../data/*/{self.division}_batting_2*.csv')
        pitching_files = glob.glob(
            f'../data/*/{self.division}_pitching_2*.csv')

        for file in sorted(batting_files):
            df = pd.read_csv(file)
            year = int(file.split('_')[-1].split('.')[0])
            df['year'] = year
            df['data_type'] = 'batting'
            df['original_id'] = df.index
            batting_dfs.append(df)

        for file in sorted(pitching_files):
            df = pd.read_csv(file)
            year = int(file.split('_')[-1].split('.')[0])
            df['year'] = year
            df['data_type'] = 'pitching'
            df['original_id'] = df.index
            pitching_dfs.append(df)

        if not batting_dfs or not pitching_dfs:
            raise ValueError(
                f"No data files found for division {self.division}")

        batting_df = pd.concat(batting_dfs, ignore_index=True)
        pitching_df = pd.concat(pitching_dfs, ignore_index=True)

        batting_df['clean_name'] = self._clean_name(batting_df['player_name'])
        pitching_df['clean_name'] = self._clean_name(
            pitching_df['player_name'])

        self._match_players(batting_df, pitching_df)

        batting_output = self._create_output_dataframe(batting_df)
        pitching_output = self._create_output_dataframe(pitching_df)

        return batting_output, pitching_output

    def _are_positions_compatible(self, positions: np.ndarray) -> bool:
        positions = [str(pos).upper() for pos in positions if pd.notna(pos)]

        if 'P' in positions:
            return True

        position_groups = {
            'infield': {'IF', '1B', '2B', '3B', 'SS'},
            'outfield': {'OF', 'LF', 'CF', 'RF'},
            'battery': {'C', 'P'},
            'utility': {'DH', 'UT', 'PR', 'PH'}
        }

        player_groups = set()
        for pos in positions:
            for group, valid_pos in position_groups.items():
                if pos in valid_pos:
                    player_groups.add(group)

        if 'utility' in player_groups:
            return True

        return len(player_groups - {'utility'}) <= 1

    def _match_players(self, batting_df: pd.DataFrame, pitching_df: pd.DataFrame):
        combined_df = pd.concat([batting_df, pitching_df], ignore_index=True)

        for (name, school), group in combined_df.groupby(['clean_name', 'team_name']):
            years = sorted(group['year'].unique())
            yr_values = group['Yr'].unique()

            if self._is_valid_year_progression(years, yr_values):
                self._assign_same_id(group, confidence='high')
                continue

            if self._are_positions_compatible(group['Pos'].unique()):
                self._assign_same_id(group, confidence='medium')
            else:
                for _, subgroup in group.groupby('data_type'):
                    self._assign_new_id(subgroup, confidence='low')

    def _get_unmatched(self, df: pd.DataFrame) -> pd.DataFrame:
        matched_ids = {season['original_id']
                       for seasons in self.player_info.values() for season in seasons}
        return df[~df['original_id'].isin(matched_ids)]

    def _assign_new_id(self, group: pd.DataFrame, confidence: str):
        internal_id = self._generate_id()
        for _, row in group.iterrows():
            self.player_info[internal_id].append(row.to_dict())
            self.decisions.append({
                'internal_id': internal_id,
                'original_id': row['original_id'],
                'decision': 'new_id',
                'confidence': confidence
            })

    def _assign_same_id(self, group: pd.DataFrame, confidence: str):
        internal_id = self._generate_id()
        for _, row in group.iterrows():
            self.player_info[internal_id].append(row.to_dict())
            self.decisions.append({
                'internal_id': internal_id,
                'original_id': row['original_id'],
                'decision': 'matched',
                'confidence': confidence
            })

    def _create_output_dataframe(self, df_type: pd.DataFrame) -> pd.DataFrame:
        mapped_records = []
        df_type = df_type.drop(columns=['player_id'])
        original_columns = df_type.columns.tolist()
        data_type = df_type['data_type'].iloc[0]

        for internal_id, seasons in self.player_info.items():
            for season in seasons:
                if season['data_type'] == data_type:
                    filtered_season = {
                        k: v for k, v in season.items() if k in original_columns}
                    filtered_season['player_id'] = internal_id
                    mapped_records.append(filtered_season)

        result_df = pd.DataFrame(mapped_records)

        columns_to_keep = [col for col in original_columns if col not in [
            'clean_name', 'original_id', 'data_type']] + ['player_id']
        return result_df[columns_to_keep]


if __name__ == '__main__':
    # Create a matcher for D1
    d1_matcher = PlayerMatcher('d1')
    d1_batting, d1_pitching = d1_matcher.process_files()

    # Create a matcher for D2
    d2_matcher = PlayerMatcher('d2')
    d2_batting, d2_pitching = d2_matcher.process_files()
