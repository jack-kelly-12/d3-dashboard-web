from fuzzywuzzy import fuzz, process
import pandas as pd
import numpy as np
import sqlite3


def get_data(year, division):
    batting = pd.read_csv(f'../data/stats/d{division}_batting_{year}.csv')
    pitching = pd.read_csv(f'../data/stats/d{division}_pitching_{year}.csv')
    pbp_df = pd.read_csv(
        f'../data/play_by_play/d{division}_parsed_pbp_{year}.csv')
    roster = pd.read_csv(
        f'../data/rosters/d{division}_rosters_{year}.csv')

    pbp_df['top_inning'] = pbp_df.top_inning.replace({0: 'Bottom', 1: 'Top'})

    pbp_df['description'] = np.where(
        pbp_df['away_text'].isna(), pbp_df['home_text'], pbp_df['away_text'])
    pbp_df['bat_team'] = np.where(
        pbp_df['top_inning'] == 'Top', pbp_df['away_team'], pbp_df['home_team'])
    pbp_df['pitch_team'] = np.where(
        pbp_df['top_inning'] == 'Top', pbp_df['home_team'], pbp_df['away_team'])
    pbp_df['play_id'] = pbp_df.groupby('game_id').cumcount() + 1

    pbp_df = pbp_df.sort_values(['game_id',
                                 'play_id'], ascending=True)

    le = pd.read_csv('../data/miscellaneous/leverage_index.csv')
    we = pd.read_csv(
        '../data/miscellaneous/win_expectancy.csv').rename(columns={'Tie': '0'})
    re = pd.read_csv(f'../data/miscellaneous/d{division}_er_matrix_{year}.csv')

    return pbp_df.dropna(subset=['description']), le, we, re, roster


def standardize_names(pbp_df, roster, threshold=30):
    def format_name(name):
        if pd.isna(name):
            return name
        if ',' in name:
            last, first = name.split(',', 1)
            return f"{first.strip()} {last.strip()}"
        return name

    # Format names in roster
    roster = roster.copy()
    roster['player_name'] = roster['player_name'].apply(format_name)
    pbp_df['bat_name'] = pbp_df['bat_name'].apply(format_name)
    pbp_df['pitcher'] = pbp_df['pitcher'].apply(format_name)

    roster_lookup = {
        team: group.set_index('player_name')['player_id'].to_dict()
        for team, group in roster.groupby('team_name')
    }

    pbp_df['player'] = pbp_df.apply(
        extract_player_from_description, axis=1)
    pbp_df['player'] = pbp_df['player'].fillna(pbp_df['bat_name'])

    def match_players(df, lookup, player_col, team_col, id_col, standardized_col):
        results = []
        for team, name in zip(df[team_col], df[player_col]):
            if pd.isna(name) or pd.isna(team):
                results.append((None, None))
                continue

            team_dict = lookup.get(team, {})
            if not team_dict:
                results.append((None, None))
                continue

            team_players = list(team_dict.keys())
            try:
                matches = process.extractOne(
                    name,
                    team_players,
                    scorer=fuzz.token_sort_ratio,
                    score_cutoff=threshold
                )
                if matches:
                    standardized_name = matches[0]
                    player_id = team_dict[standardized_name]
                    results.append((standardized_name, player_id))
                else:
                    results.append((None, None))
            except Exception:
                results.append((None, None))

        df[standardized_col], df[id_col] = zip(*results)

    pbp_df = pbp_df.copy()

    match_players(pbp_df, roster_lookup, 'pitcher',
                  'pitch_team', 'pitcher_id', 'pitcher_standardized')
    match_players(pbp_df, roster_lookup, 'bat_name',
                  'bat_team', 'batter_id', 'batter_standardized')
    match_players(pbp_df, roster_lookup, 'player',
                  'bat_team', 'player_id', 'player_standardized')

    pbp_df['times_through_order'] = pbp_df.groupby(
        ['game_id', 'pitcher', 'bat_name', 'bat_order']).cumcount() + 1
    pbp_df['pitcher_standardized'] = pbp_df['pitcher_standardized'].fillna(
        pbp_df['pitcher'])
    pbp_df['pitcher_standardized'] = pbp_df['pitcher_standardized'].fillna(
        'Starter')

    return pbp_df


def extract_player_from_description(row):
    desc = row['description']
    if pd.isna(desc):
        return None

    if pd.notna(row['bat_name']):
        return row['bat_name']

    action_words = [
        'stole',
        'advanced',
        'scored',
        'picked off',
        'out at',
        'caught stealing'
    ]

    for action in action_words:
        if action in desc:
            name = desc.split(action)[0].strip()
            return name

    return None


def process_pitchers(df):
    """
    Process pitchers with backfill when "to p for" appears in description.
    Vectorized version for improved performance.
    """
    df = df.copy()

    # Create pitcher changes mask
    pitcher_changes = df['description'].str.contains('to p for', na=False)

    # Create initial pitcher column
    df['pitcher'] = pd.Series(dtype='string')

    # Set pitcher values at change points
    df.loc[pitcher_changes, 'pitcher'] = df.loc[pitcher_changes,
                                                'sub_in'].astype(str)

    # Group by game and pitch team
    grouped = df.groupby(['game_id', 'pitch_team'])

    # Process each group vectorized
    def process_group(group):
        # Get indices of pitcher changes
        change_idx = group.index[pitcher_changes[group.index]]

        if len(change_idx) > 0:
            # Set exiting pitchers
            for i in range(len(change_idx)):
                start = change_idx[i-1] if i > 0 else group.index[0]
                end = change_idx[i]

                # Backfill exiting pitcher
                mask = (group.index >= start) & (group.index < end)
                group.loc[mask, 'pitcher'] = str(group.loc[end, 'sub_out'])

        # Forward fill remaining gaps
        group['pitcher'] = group['pitcher'].ffill()
        return group

    # Apply processing to each group
    result = grouped.apply(process_group)

    df = result.reset_index(drop=True)

    return df


def calculate_woba(df, year, division):
    lw = pd.read_csv(
        f'../data/miscellaneous/d{division}_linear_weights_{year}.csv')
    weights = lw.set_index('events')['normalized_weight'].to_dict()

    df = df.copy()

    df['woba'] = 0.0

    # Set wOBA values based on event codes
    df.loc[df['event_cd'] == 14, 'woba'] = weights.get('walk', 0)  # BB
    df.loc[df['event_cd'] == 16, 'woba'] = weights.get(
        'hit_by_pitch', 0)  # HBP
    df.loc[df['event_cd'] == 20, 'woba'] = weights.get('single', 0)  # 1B
    df.loc[df['event_cd'] == 21, 'woba'] = weights.get('double', 0)  # 2B
    df.loc[df['event_cd'] == 22, 'woba'] = weights.get('triple', 0)  # 3B
    df.loc[df['event_cd'] == 23, 'woba'] = weights.get('home_run', 0)  # HR

    return df


def melt_run_expectancy(df):
    df = df.copy()

    df['base_state'] = df['Unnamed: 0']
    df.loc[0, 'base_state'] = '___'
    df = df[['base_state', '0', '1', '2']]

    melted = pd.melt(
        df,
        id_vars=['base_state'],
        value_vars=['0', '1', '2'],
        var_name='outs',
        value_name='run_expectancy'
    )

    melted['outs'] = melted['outs'].astype(int)
    melted = melted[['base_state', 'outs', 'run_expectancy']]

    return melted


def encode_bases(r1, r2, r3):
    state = ''
    state += '1 ' if pd.notna(r1) else '_ '
    state += '2 ' if pd.notna(r2) else '_ '
    state += '3' if pd.notna(r3) else '_'
    return state


base_state_map = {
    '_ _ _': 0,
    '___': 0,
    'Empty': 0,
    '1 _ _': 1,
    '1__': 1,
    '1B Only': 1,
    '1B only': 1,
    '1B _ _': 1,
    '_ 2B _': 2,
    '_ 2 _': 2,
    '_2_': 2,
    '2B Only': 2,
    '2B only': 2,
    '1B 2B _': 3,
    '1 2 _': 3,
    '12_': 3,
    '1B & 2B': 3,
    '1B 2B': 3,
    '_ _ 3B': 4,
    '_ _ 3': 4,
    '__3': 4,
    '3B Only': 4,
    '3B only': 4,
    '1B _ 3B': 5,
    '1 _ 3': 5,
    '1_3': 5,
    '1B & 3B': 5,
    '1B 3B': 5,
    '2B 3B': 6,
    '_ 2B 3B': 6,
    '_ 2 3': 6,
    '_23': 6,
    '2B & 3B': 6,
    '1B 2B 3B': 7,
    '123': 7,
    '1 2 3': 7,
    'Loaded': 7,
    'Bases Loaded': 7,
}


def merge_baseball_stats(df, leverage_melted, win_expectancy, re_melted):
    df_copy = df.copy()
    df_copy['effective_inning'] = df_copy['inning'].clip(upper=9)

    # First merge - leverage index
    merged_df = df_copy.merge(
        leverage_melted,
        left_on=[
            'score_diff_before',
            'outs_before',
            'base_cd_before',
            'effective_inning',
            'top_inning'
        ],
        right_on=[
            'score_diff',
            'Outs',
            'Runners',
            'Inning',
            'Top/Bot'
        ],
        how='left'
    ).drop(columns=['Outs', 'Runners', 'Inning', 'Top/Bot', 'score_diff']).rename(columns={'leverage_index': 'li'})

    # Rest of merges remain the same
    merged_df = merged_df.merge(
        win_expectancy,
        left_on=[
            'score_diff_before',
            'outs_before',
            'base_cd_before',
            'effective_inning',
            'top_inning'
        ],
        right_on=[
            'score_diff',
            'Outs',
            'Runners',
            'Inn',
            'Top/Bot'
        ],
        how='left'
    ).drop(columns=['Outs', 'Runners', 'Inn', 'Top/Bot', 'score_diff']).rename(columns={'win_expectancy': 'home_win_exp_before'})

    merged_df = merged_df.merge(
        re_melted,
        left_on=[
            'outs_before',
            'base_cd_before'
        ],
        right_on=[
            'outs',
            'base_state'
        ],
        how='left'
    ).drop(columns=['outs', 'base_state']).rename(columns={'run_expectancy': 'run_expectancy_before'})

    merged_df.loc[abs(merged_df['score_diff_before']) >= 10, 'li'] = 0
    merged_df.loc[merged_df['score_diff_before']
                  >= 10, 'home_win_exp_before'] = 1
    merged_df.loc[merged_df['score_diff_before']
                  <= -10, 'home_win_exp_before'] = 0

    merged_df['outs_after_new'] = merged_df['outs_after'] % 3

    inning_transition = ((merged_df['inn_end'] == 1) & (
        merged_df['outs_after'] >= 3))
    game_transition = (merged_df['game_end'] == 1)

    merged_df['base_cd_after'] = np.where(
        inning_transition,
        0,
        merged_df['base_cd_after']
    )
    merged_df['top_inning_new'] = np.where(
        inning_transition,
        np.where(merged_df['top_inning'] == 'Top', 'Bottom', 'Top'),
        merged_df['top_inning']
    )
    merged_df['effective_inning_new'] = np.where(
        (inning_transition) & (merged_df['top_inning'] == 'Bottom'),
        merged_df['effective_inning'] + 1,
        merged_df['effective_inning']
    )
    merged_df['effective_inning_new'] = merged_df['effective_inning_new'].clip(
        upper=9)

    merged_df = merged_df.merge(
        re_melted,
        left_on=[
            'outs_after_new',
            'base_cd_after'
        ],
        right_on=[
            'outs',
            'base_state'
        ],
        how='left'
    ).drop(columns=['outs', 'base_state']).rename(columns={'run_expectancy': 'run_expectancy_after'})

    merged_df.loc[inning_transition, 'run_expectancy_after'] = 0
    merged_df.loc[game_transition, 'run_expectancy_after'] = 0

    merged_df = merged_df.merge(
        win_expectancy,
        left_on=[
            'score_diff_after',
            'outs_after_new',
            'base_cd_after',
            'effective_inning_new',
            'top_inning_new'
        ],
        right_on=[
            'score_diff',
            'Outs',
            'Runners',
            'Inn',
            'Top/Bot'
        ],
        how='left'
    ).drop(columns=['Outs', 'Runners', 'Inn', 'Top/Bot', 'score_diff']).rename(columns={'win_expectancy': 'home_win_exp_after'})

    # Also ensure high score differences after play have 0 leverage index
    merged_df.loc[merged_df['score_diff_after']
                  >= 10, 'home_win_exp_after'] = 1
    merged_df.loc[merged_df['score_diff_after']
                  <= -10, 'home_win_exp_after'] = 0
    merged_df.loc[abs(merged_df['score_diff_after']) >= 10, 'li'] = 0

    merged_df['game_end'] = np.where(
        (merged_df['score_diff_after'] > 0) &
        (merged_df['effective_inning'] == 9) &
        (merged_df['top_inning'] == 'Bottom'),
        1,
        merged_df.game_end
    )

    merged_df['game_end'] = np.where(
        (merged_df['score_diff_after'] > 0) &
        (merged_df['effective_inning'] == 9) &
        (merged_df['top_inning'] == 'Top') &
        (merged_df['outs_after'] == 3),
        1,
        merged_df.game_end
    )

    fix_all_game_ends(df)

    return merged_df


def fix_all_game_ends(df):
    # Get first occurrence of game_end=1 for each game_id
    first_ends = df[df['game_end'] == 1].groupby('game_id').first()

    # Create a mask for rows to drop
    rows_to_drop = []
    for idx, row in df.iterrows():
        game_id = row['game_id']
        if game_id in first_ends.index:
            # If there's an end marker for this game and current row is after it
            if idx > first_ends.loc[game_id].name:
                rows_to_drop.append(idx)

    # Drop the identified rows
    df.drop(rows_to_drop, inplace=True)


def calculate_dre_and_dwe(df):
    df = df.loc[:, ~df.columns.duplicated()]

    df['run_expectancy_after'] = df['run_expectancy_after'].copy()

    # Handle win expectancy for game ends
    game_end_mask = df['game_end'] == 1
    home_wins_mask = df['home_score_after'] > df['away_score_after']

    df.loc[game_end_mask & home_wins_mask, 'home_win_exp_after'] = 1
    df.loc[game_end_mask & ~home_wins_mask, 'home_win_exp_after'] = 0

    # Calculate deltas
    df['run_expectancy_delta'] = df['run_expectancy_after'] - \
        df['run_expectancy_before']
    df['delta_home_win_exp'] = df['home_win_exp_after'] - \
        df['home_win_exp_before']

    # Filter extreme win expectancy changes
    df = df[(df['delta_home_win_exp'] > -0.9) &
            (df['delta_home_win_exp'] < 0.9)]

    # Calculate REA
    df['rea'] = df['run_expectancy_delta'] + df['runs_on_play']

    # Calculate WPA and WPA/LI
    df['wpa'] = np.where(
        df['bat_team'] == df['home_team'],
        df['delta_home_win_exp'],
        -df['delta_home_win_exp']
    )
    df['wpa'] = df['wpa'].fillna(0)

    # Calculate WPA/LI
    df['wpa/li'] = df['wpa'] / df['li'].replace(0, np.nan)
    df['wpa/li'] = df['wpa/li'].fillna(0)

    return df


class BaseballAnalytics:
    EVENT_CODES = {
        'WALK': 14,
        'HBP': 16,
        'SINGLE': 20,
        'DOUBLE': 21,
        'TRIPLE': 22,
        'HOME_RUN': 23,
        'OUT': [2, 3, 19],
        'ERROR': 18
    }

    def __init__(self, pbp_df, year, division, weights_path='../data/miscellaneous/d{}_linear_weights_{}.csv'):
        self.original_df = pbp_df.copy()
        self.year = year
        self.weights_path = weights_path
        self.division = division
        self.situations = None
        self.weights = None

    def load_weights(self):
        try:
            lw = pd.read_csv(self.weights_path.format(
                self.division, self.year))
            self.weights = lw.set_index(
                'events')['normalized_weight'].to_dict()
        except FileNotFoundError:
            raise FileNotFoundError(
                f"Linear weights file for year {self.year}, D{self.division} not found")
        except Exception as e:
            raise Exception(f"Error loading weights: {str(e)}")

    def prepare_situations(self):
        self.situations = self.original_df.copy()

        self.situations['RISP_fl'] = (
            ~self.situations['r2_name'].isna() |
            ~self.situations['r3_name'].isna()
        ).astype(int)

        self.situations['LI_HI_fl'] = (self.situations['li'] >= 2).astype(int)
        self.situations['LI_LO_fl'] = (
            self.situations['li'] <= 0.85).astype(int)

    def calculate_metrics(self, group):
        if self.weights is None:
            self.load_weights()

        # Count events
        events = {
            event: (group['event_cd'] == code).sum()
            if not isinstance(code, list)
            else group['event_cd'].isin(code).sum()
            for event, code in self.EVENT_CODES.items()
        }

        # Calculate plate appearances
        sf = (group['sf_fl'] == 1).sum()
        ab = (events['SINGLE'] + events['DOUBLE'] + events['TRIPLE'] +
              events['HOME_RUN'] + events['OUT'] + events['ERROR'])
        pa = ab + events['WALK'] + sf + events['HBP']

        if pa == 0:
            return pd.Series({
                'wOBA': np.nan,
                'BA': np.nan,
                'PA': 0,
                'rea': 0
            })

        # Calculate wOBA
        woba = (
            self.weights.get('walk', 0) * events['WALK'] +
            self.weights.get('hit_by_pitch', 0) * events['HBP'] +
            self.weights.get('single', 0) * events['SINGLE'] +
            self.weights.get('double', 0) * events['DOUBLE'] +
            self.weights.get('triple', 0) * events['TRIPLE'] +
            self.weights.get('home_run', 0) * events['HOME_RUN']
        ) / pa

        # Calculate batting average
        hits = (events['SINGLE'] + events['DOUBLE'] +
                events['TRIPLE'] + events['HOME_RUN'])
        ba = hits / ab if ab > 0 else np.nan

        # Calculate run expectancy delta
        rea = group['rea'].sum()

        return pd.Series({
            'wOBA': woba,
            'BA': ba,
            'PA': pa,
            'rea': rea
        })

    def analyze_situations(self):
        """Analyze performance across different situations"""
        if self.situations is None:
            self.prepare_situations()

        situations_list = [
            ('RISP', self.situations[self.situations['RISP_fl'] == 1]),
            ('High_Leverage',
             self.situations[self.situations['LI_HI_fl'] == 1]),
            ('Low_Leverage',
             self.situations[self.situations['LI_LO_fl'] == 1]),
            ('Overall', self.situations)
        ]

        results = []
        for name, data in situations_list:
            grouped = (data.groupby(['batter_standardized', 'bat_team'])
                       .apply(self.calculate_metrics, include_groups=False)
                       .reset_index())
            grouped['Situation'] = name
            results.append(grouped)

        return pd.concat(results, axis=0).reset_index(drop=True)

    def get_pivot_results(self):
        """Generate pivoted results for easy comparison"""
        final_df = self.analyze_situations()

        pivot = final_df.pivot(
            index=['batter_standardized', 'bat_team'],
            columns='Situation',
            values=['wOBA', 'BA', 'PA', 'rea']
        )

        # Clean up column names
        pivot.columns = [f"{stat}_{sit}" for stat, sit in pivot.columns]
        return pivot.reset_index()


def run_analysis(pbp_df, year, division):
    try:
        analytics = BaseballAnalytics(pbp_df, year, division)
        return analytics.get_pivot_results()
    except Exception as e:
        print(f"Error running analysis: {str(e)}")
        return None


def process_single_year(args):
    year, division = args
    try:
        pbp_df, leverage_melted, win_expectancy, re, roster = get_data(
            year, division)

        pbp_df['top_inning'] = np.where(
            pbp_df.away_team == pbp_df.bat_team, 'Top', 'Bottom')
    except FileNotFoundError as e:
        print(f"Error loading data for {year}: {e}")
        return None  # Return None if data loading fails

    # Initial processing
    pbp_processed = process_pitchers(pbp_df)
    pbp_processed = standardize_names(pbp_processed, roster)
    pbp_processed = calculate_woba(pbp_processed, year, division)

    # Base states and scoring
    pbp_processed['base_cd_after'] = pbp_processed.groupby(
        'game_id')['base_cd_before'].shift(-1)
    pbp_processed['base_cd_after'] = pbp_processed['base_cd_after'].fillna(0)

    pbp_processed['score_diff_before'] = pbp_processed['home_score_before'] - \
        pbp_processed['away_score_before']
    pbp_processed['score_diff_after'] = pbp_processed['home_score_after'] - \
        pbp_processed['away_score_after']

    pbp_processed = pbp_processed.dropna(subset=['top_inning'])
    pbp_processed['outs_before'] = pbp_processed['outs_after'] - \
        pbp_processed['outs_on_play']

    # Process expectancy matrices
    re_melted = melt_run_expectancy(re)

    # Map base states
    leverage_melted['Runners'] = pd.to_numeric(
        leverage_melted['Runners'].replace(base_state_map), errors='ignore')
    win_expectancy['Runners'] = pd.to_numeric(
        win_expectancy['Runners'].replace(base_state_map), errors='ignore')
    re_melted['base_state'] = pd.to_numeric(
        re_melted['base_state'].replace(base_state_map), errors='ignore')
    pbp_processed['base_cd_after'] = pd.to_numeric(pbp_processed['base_cd_after'].replace(
        base_state_map), errors='ignore')

    merged_df = merge_baseball_stats(pbp_processed, leverage_melted, win_expectancy, re_melted).drop_duplicates(
        ['game_id', 'inning', 'home_score_after', 'away_score_after', 'home_text', 'away_text']).dropna(subset=['description'])
    merged_df = merged_df[~((merged_df['top_inning_new'] == 'Bottom') & (merged_df['score_diff_after'] > 0) & (
        merged_df['effective_inning'] == 9) & (merged_df['game_end'] == 0))]
    merged_df = calculate_dre_and_dwe(merged_df)

    merged_df.sort_values(['game_id',
                           'play_id'], ascending=True)

    merged_df.to_csv(
        f'../data/play_by_play/d{division}_parsed_pbp_new_{year}.csv', index=False)

    columns = [
        'home_team', 'away_team', 'home_score', 'away_score', 'date',
        'inning', 'top_inning', 'game_id', 'description',
        'home_win_exp_before', 'wpa', 'run_expectancy_delta', 'woba', 'home_win_exp_after',
        'player_id', 'pitcher_id', 'batter_id', 'li', 'home_score_after',
        'away_score_after', 'event_cd', 'times_through_order', 'base_cd_before', 'base_cd_after',
        'hit_type'
    ]

    final_df = merged_df[columns].copy()
    final_df['year'] = year
    final_df['division'] = division

    return final_df


def main():
    divisions = range(1, 4)
    all_pbp_data = []

    for division in divisions:
        for year in range(2021, 2025):
            processed_data = process_single_year((year, division))
            if processed_data is not None:
                all_pbp_data.append(processed_data)
                print(f"Successfully processed data for D{division} {year}")

    if all_pbp_data:
        combined_pbp = pd.concat(all_pbp_data, ignore_index=True)

        conn = sqlite3.connect(
            'C:/Users/kellyjc/Desktop/d3_app_improved/backend/ncaa.db')
        combined_pbp.to_sql('pbp', conn, if_exists='replace', index=False)
        conn.close()

        print("All data successfully combined and saved to database!")
    else:
        print("No data to process!")


if __name__ == '__main__':
    main()
