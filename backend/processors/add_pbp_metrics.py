import pandas as pd
import numpy as np


class BaseballDataProcessor:
    def __init__(self, year):
        self.year = year
        self.base_state_map = {
            '_ _ _': 0, '___': 0, 'Empty': 0,
            '1 _ _': 1, '1__': 1, '1B Only': 1, '1B only': 1,
            '_ 2 _': 2, '_2_': 2, '2B Only': 2, '2B only': 2,
            '_ _ 3': 4, '__3': 4, '3B Only': 4, '3B only': 4,
            '1 2 _': 3, '12_': 3, '1B & 2B': 3,
            '1 _ 3': 5, '1_3': 5, '1B & 3B': 5,
            '_ 2 3': 6, '_23': 6, '2B & 3B': 6,
            '123': 7, '1 2 3': 7, 'Loaded': 7,
            '1B 2B': 4, '1B 3B': 5, '2B 3B': 6, 'Bases Loaded': 7
        }

    def load_data(self, filepath):
        df = pd.read_csv(filepath)
        df = df.drop_duplicates(['game_id', 'inning', 'outs_before', 'away_score',
                                 'home_score', 'away_text', 'home_text'])
        if 'Unnamed: 0' in df.columns:
            df = df.drop(columns=['Unnamed: 0'])
        df['description'] = np.where(
            df['away_text'].isna(), df['home_text'], df['away_text'])
        return df

    def process_pitchers(self, df):
        df = df.copy()
        df['bat_team'] = np.where(
            df['top_inning'], df['away_team'], df['home_team'])
        df['pitch_team'] = np.where(
            df['top_inning'], df['home_team'], df['away_team'])
        df['pitcher'] = None
        df['times_through_order'] = None
        df['p_change_fl'] = 0

        mask = df['bat_order'].notna()
        df.loc[mask, 'bat_name'] = df.loc[mask,
                                          'description'].str.split().str[:2].str.join(' ')

        pitcher_changes = df['description'].str.contains('to p for', na=False)
        df.loc[pitcher_changes, 'p_change_fl'] = 1
        df['new_pitcher'] = None
        df['old_pitcher'] = None

        change_mask = df['description'].str.contains('to p for', na=False)
        if change_mask.any():
            changes = df.loc[change_mask, 'description'].str.split('to p for')
            df.loc[change_mask, 'new_pitcher'] = changes.str[0].str.strip()
            df.loc[change_mask, 'old_pitcher'] = changes.str[1].str.strip()

        results = []
        for _, game_df in df.groupby('game_id'):
            game_df = self._process_game_pitchers(game_df)
            results.append(game_df)

        result_df = pd.concat(results)
        result_df = result_df.sort_index()
        result_df = result_df.drop(['new_pitcher', 'old_pitcher'], axis=1)
        result_df.pitcher = result_df.pitcher.replace({None: 'Starter'})

        return result_df

    def _process_game_pitchers(self, game_df):
        game_df = game_df.copy()

        for team in game_df['pitch_team'].unique():
            team_mask = game_df['pitch_team'] == team
            team_data = game_df[team_mask].copy()

            if len(team_data) > 0:
                team_data = self._process_team_pitchers(team_data)
                game_df.loc[team_mask] = team_data

        return game_df

    def _process_team_pitchers(self, team_data):
        first_change = team_data[team_data['old_pitcher'].notna(
        )].iloc[0] if team_data['old_pitcher'].notna().any() else None

        if first_change is not None:
            initial_pitcher = first_change['old_pitcher']
            team_data.loc[:first_change.name, 'pitcher'] = initial_pitcher

        pitcher_changes = team_data['new_pitcher'].notna()
        team_data.loc[pitcher_changes,
                      'pitcher'] = team_data.loc[pitcher_changes, 'new_pitcher']
        team_data['pitcher'] = team_data['pitcher'].ffill()

        pitcher_stints = team_data['new_pitcher'].notna().cumsum()
        for _, stint_df in team_data.groupby(pitcher_stints):
            valid_at_bats = stint_df['bat_order'].notna()
            if valid_at_bats.any():
                team_data = self._process_pitcher_stint(
                    team_data, stint_df, valid_at_bats)

        return team_data

    def _process_pitcher_stint(self, team_data, stint_df, valid_at_bats):
        batter_appearances = {}
        for idx, row in stint_df[valid_at_bats].iterrows():
            batter = row['bat_name']
            batter_appearances[batter] = batter_appearances.get(batter, 0) + 1
            stint_df.loc[idx,
                         'times_through_order'] = batter_appearances[batter]

        team_data.loc[stint_df.index,
                      'times_through_order'] = stint_df['times_through_order']
        return team_data

    def calculate_woba(self, group):
        lw = pd.read_csv(f'../data/linear_weights_{self.year}.csv')
        weights = lw.set_index('events')['normalized_weight'].to_dict()

        event_counts = {
            'walk': (group['event_cd'] == 14).sum(),
            'hit_by_pitch': (group['event_cd'] == 16).sum(),
            'single': (group['event_cd'] == 20).sum(),
            'double': (group['event_cd'] == 21).sum(),
            'triple': (group['event_cd'] == 22).sum(),
            'home_run': (group['event_cd'] == 23).sum()
        }

        outs = group['event_cd'].isin([2, 3, 19]).sum()
        errors = (group['event_cd'] == 18).sum()
        ab = sum([event_counts[evt] for evt in [
                 'single', 'double', 'triple', 'home_run']]) + outs + errors
        sf = (group['sf_fl'] == 1).sum()
        denom = (ab + event_counts['walk'] + sf + event_counts['hit_by_pitch'])

        if denom == 0:
            return 0

        woba = sum(weights.get(evt, 0) * count for evt,
                   count in event_counts.items()) / denom
        return woba

    def extend_baseball_metrics(self, we, le):
        win_expectancy, leverage_melted = self._extend_metrics_core(we, le)
        win_expectancy['Runners'] = win_expectancy['Runners'].replace(
            self.base_state_map)
        leverage_melted['Runners'] = leverage_melted['Runners'].replace(
            self.base_state_map)
        return win_expectancy, leverage_melted

    def _extend_metrics_core(self, we, le):
        we_melted = self._melt_and_prepare_df(
            we, ['Runners', 'Outs', 'Inn', 'Top/Bot'])
        le_melted = self._melt_and_prepare_df(
            le, ['Runners', 'Outs', 'Inning', 'Top/Bot'])

        self._process_win_expectancy(we_melted)
        self._process_leverage_index(le_melted)

        return we_melted, le_melted

    def _melt_and_prepare_df(self, df, id_vars, score_range=range(-100, 101)):
        for i in score_range:
            if str(i) not in df.columns:
                df[str(i)] = None

        melted = pd.melt(df, id_vars=id_vars,
                         value_vars=[str(i) for i in score_range],
                         var_name='score_diff', value_name='metric_value')
        melted['score_diff'] = pd.to_numeric(melted['score_diff'])
        return melted

    def _process_win_expectancy(self, we_melted):
        for group_key, group in we_melted.groupby(['Runners', 'Outs', 'Inn', 'Top/Bot']):
            mask = self._create_metric_mask(we_melted, group_key)
            we_melted.loc[mask, 'metric_value'] = self._calculate_win_expectancy(
                group, group_key[2], group_key[3] == 'Top'
            )
        we_melted.rename(
            columns={'metric_value': 'win_expectancy'}, inplace=True)

    def _process_leverage_index(self, le_melted):
        for group_key, group in le_melted.groupby(['Runners', 'Outs', 'Inning', 'Top/Bot']):
            mask = self._create_metric_mask(le_melted, group_key)
            le_melted.loc[mask, 'metric_value'] = self._calculate_leverage(
                group)
        le_melted.rename(
            columns={'metric_value': 'leverage_index'}, inplace=True)

    def _create_metric_mask(self, df, group_key):
        return (df['Runners'] == group_key[0]) & \
               (df['Outs'] == group_key[1]) & \
               (df[df.columns[2]] == group_key[2]) & \
               (df['Top/Bot'] == group_key[3])

    def _calculate_win_expectancy(self, group, Inn, is_top):
        minus_4_value = group[group['score_diff']
                              == -4]['metric_value'].iloc[0]
        plus_4_value = group[group['score_diff'] == 4]['metric_value'].iloc[0]

        effective_inning = min(Inn, 9)
        inn_weight = min((effective_inning / 9) ** 1.5, 1.0)

        score_diffs = group['score_diff'].values
        win_exp = group['metric_value'].values.copy()

        self._adjust_extreme_values(
            score_diffs, win_exp, minus_4_value, plus_4_value, inn_weight)
        return np.clip(win_exp, 0, 1)

    def _calculate_leverage(self, group):
        minus_4_value = group[group['score_diff']
                              == -4]['metric_value'].iloc[0]
        plus_4_value = group[group['score_diff'] == 4]['metric_value'].iloc[0]

        score_diffs = group['score_diff'].values
        leverage = group['metric_value'].values.copy()

        self._adjust_extreme_values(
            score_diffs, leverage, minus_4_value, plus_4_value, 1.0, divider=6)
        return np.clip(leverage, 0, None)

    def _adjust_extreme_values(self, score_diffs, values, minus_4_value, plus_4_value, weight, divider=11):
        mask_low = score_diffs < -4
        if any(mask_low):
            approach_rate = (abs(score_diffs[mask_low] + 4) / divider) * weight
            values[mask_low] = minus_4_value * (1 - approach_rate)

        mask_high = score_diffs > 4
        if any(mask_high):
            approach_rate = (
                abs(score_diffs[mask_high] - 4) / divider) * weight
            values[mask_high] = plus_4_value + \
                ((1 - plus_4_value) * approach_rate)

    def merge_baseball_stats(self, df, leverage_melted, win_expectancy):
        df_copy = df.copy()
        df_copy['effective_inning'] = df_copy['inning'].clip(upper=9)

        merged_df = self._merge_leverage(df_copy, leverage_melted)
        merged_df = self._merge_win_expectancy(merged_df, win_expectancy)

        return merged_df.drop_duplicates(['game_id', 'inning', 'home_score_after',
                                          'away_score_after', 'home_text', 'away_text'])

    def _merge_leverage(self, df, leverage_melted):
        return df.merge(
            leverage_melted,
            left_on=['score_diff_before', 'outs_before', 'base_cd_before',
                     'effective_inning', 'top_inning'],
            right_on=['score_diff', 'Outs', 'Runners', 'Inning', 'Top/Bot'],
            how='left'
        ).drop(columns=['Outs', 'Runners', 'Inning', 'Top/Bot', 'score_diff']
               ).rename(columns={'leverage_index': 'li'})

    def _merge_win_expectancy(self, df, win_expectancy):
        return df.merge(
            win_expectancy,
            left_on=['score_diff_before', 'outs_before', 'base_cd_before',
                     'effective_inning', 'top_inning'],
            right_on=['score_diff', 'Outs', 'Runners', 'Inn', 'Top/Bot'],
            how='left'
        ).drop(columns=['Outs', 'Runners', 'Inn', 'Top/Bot', 'score_diff', 'effective_inning']
               ).rename(columns={'win_expectancy': 'home_win_exp_before'})


def encode_bases(r1, r2, r3):
    state = ''
    state += '1 ' if pd.notna(r1) else '_ '
    state += '2 ' if pd.notna(r2) else '_ '
    state += '3' if pd.notna(r3) else '_'
    return state


def process_season(year, input_path, output_path):
    processor = BaseballDataProcessor(year)

    # Load and process initial data
    df = processor.load_data(input_path)
    df = processor.process_pitchers(df)

    # Load supplementary data
    le = pd.read_csv('../data/leverage_index.csv')
    we = pd.read_csv('../data/win_expectancy.csv').rename(columns={'Tie': '0'})

    # Process metrics
    win_expectancy, leverage_melted = processor.extend_baseball_metrics(we, le)

    # Prepare base state and score differentials
    df['base_cd_after'] = df.apply(lambda x: encode_bases(
        x['r1_name'], x['r2_name'], x['r3_name']), axis=1)
    df['score_diff_before'] = df['home_score_before'] - df['away_score_before']
    df['score_diff_after'] = df['home_score_after'] - df['away_score_after']
    df['top_inning'] = df['top_inning'].map({1: 'Top', 0: 'Bottom'})
    df['outs_before'] = df['outs_after'] - df['outs_on_play']

    # Map base states
    df['base_cd_after'] = df['base_cd_after'].replace(processor.base_state_map)

    # Merge statistics
    merged_df = processor.merge_baseball_stats(
        df, leverage_melted, win_expectancy)

    # Save processed data
    merged_df.to_csv(output_path, index=False)
    return merged_df


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(
        description='Process baseball play-by-play data for a given year')
    parser.add_argument('year', type=int, help='Year to process')
    parser.add_argument('--input-path', type=str, default='../data/parsed_pbp_{year}.csv',
                        help='Path to input CSV file (default: ../data/parsed_pbp_{year}.csv)')
    parser.add_argument('--output-path', type=str, default='../data/parsed_pbp_new_{year}.csv',
                        help='Path to output CSV file (default: ../data/parsed_pbp_new_{year}.csv)')

    args = parser.parse_args()

    input_path = args.input_path.format(year=args.year)
    output_path = args.output_path.format(year=args.year)

    process_season(args.year, input_path, output_path)
