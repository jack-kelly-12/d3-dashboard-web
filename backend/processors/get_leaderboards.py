import pandas as pd
import sqlite3
import numpy as np


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

    def __init__(self, pbp_df, year, division, weights_path='C:/Users/kellyjc/Desktop/d3_pipeline/data/miscellaneous/d{}_linear_weights_{}.csv'):
        self.original_df = pbp_df.copy()
        self.year = year
        self.weights_path = weights_path
        self.situations = None
        self.weights = None
        self.division = division
        self.right_pattern = r'to right|to 1b|rf line|to rf|right side|by 1b|by first base|to first base|1b line|by rf|by right field'
        self.left_pattern = r'to left|to 3b|lf line|left side|to lf|by 3b|by third base|to third base|down the 3b line|by lf|by left field'

        self.fly_pattern = r'fly|flied|homered|tripled to (?:left|right|cf|center)|doubled to (?:right|rf)'
        self.lined_pattern = r'tripled (?:to second base|,)|singled to (?:center|cf)|doubled down the (?:lf|rf) line|lined|doubled|singled to (?:left|right|rf|lf)'
        self.popped_pattern = r'fouled (?:into|out)|popped'
        self.ground_pattern = (
            r'tripled to (?:catcher|first base)|'
            r'tripled(?:,\s*(?:scored|out))|'
            r'singled to catcher|'
            r'singled(?:\s*(?:\([^)]+\))?\s*(?:,\s*|\s*;\s*|\s*3a\s*|\s*:\s*|\s+up\s+the\s+middle))|'
            r'hit into (?:double|triple) play|'
            r'reached (?:first )?on (?:an?)|'
            r'fielder\'s choice|fielding error|'
            r'(?:singled|tripled) through the (?:left|right) side|'
            r'error by (?:1b|2b|ss|3b|first|second|short|third)|'
            r'ground|'
            r'down the (?:1b|rf|3b|lf) line|'
            r'singled to (?:p|3b|1b|2b|ss|third|first|second|short)'
        )

    def load_weights(self):
        try:
            lw = pd.read_csv(self.weights_path.format(
                self.division, self.year))
            self.weights = lw.set_index(
                'events')['normalized_weight'].to_dict()
        except FileNotFoundError:
            raise FileNotFoundError(
                f"Linear weights file for year {self.year} not found")
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

    def prepare_batted_ball(self):
        self.df = self.original_df.copy()
        self.df = self.df[~self.df['hit_type'].isin(['K', 'B'])]
        self.df = self.df[~self.df['event_cd'].isin(
            [14, 16, 9, 17, 4, 6, 10, 8, 11])]
        self.df = self.df.dropna(subset=['batter_hand', 'bat_order'])

        direction_patterns = {
            'right': ['by right field', 'by rf', 'by 1b', 'by first base', 'to right field', 'through the right side', 'to rf', 'down the rf line', 'down the 1b line', 'to first base', 'to 1b'],
            'left': ['by left field', 'by lf', 'by third base', 'by 3b', 'to left field', 'through the left side', 'down the lf line', 'to lf', 'down the 3b line', 'to third base', 'to 3b', 'by third base', 'by 3b'],
            'middle': ['to ss', 'to 2b', 'by 2b', 'by p', 'by pitcher', 'by c', 'by catcher', 'by shortstop', 'by ss', 'by 2b', 'by second base', 'to shortstop', 'to second base', 'to c', 'to cf', 'ss to 2b', '2b to ss', 'to center', 'up the middle', 'to right center', 'to left center', 'to p']
        }

        hit_type_patterns = {
            'ground': [
                'ground',
                'hit into double play',
                'hit into triple play',
                'reached on error',
                "fielder's choice",
                'singled to catcher',
                'singled to p',
                'singled to 3b',
                'singled to 1b',
                'singled to 2b',
                'singled to ss',
                'down the 1b line',
                'down the 3b line',
                'down the rf line',
                'down the lf line',
                'through the left side',
                'through the right side'
            ],
            'fly': [
                'fly',
                'flied',
                'homered',
                'to rf',
                'to lf',
                'to cf'
            ],
            'lined': [
                'lined',
                'doubled down',
                'doubled to'
            ],
            'popped': [
                'popped',
                'fouled out',
                'fouled into'
            ]
        }

        descriptions = self.df['description'].str.lower()
        batter_hands = self.df['batter_hand']

        # Direction classification
        self.df['is_pull'] = False
        self.df['is_oppo'] = False
        self.df['is_middle'] = False

        for pattern_list, field in [(direction_patterns['right'], 'right'),
                                    (direction_patterns['left'], 'left'),
                                    (direction_patterns['middle'], 'middle')]:
            mask = descriptions.str.contains(
                '|'.join(pattern_list), regex=True, na=False)
            if field == 'right':
                self.df.loc[mask & (batter_hands == 'L'), 'is_pull'] = True
                self.df.loc[mask & (batter_hands == 'R'), 'is_oppo'] = True
            elif field == 'left':
                self.df.loc[mask & (batter_hands == 'R'), 'is_pull'] = True
                self.df.loc[mask & (batter_hands == 'L'), 'is_oppo'] = True
            else:
                self.df.loc[mask, 'is_middle'] = True

        self.df['direction_sum'] = self.df['is_pull'].astype(
            int) + self.df['is_middle'].astype(int) + self.df['is_oppo'].astype(int)
        self.df = self.df[self.df['direction_sum'] == 1]

        # Hit type classification
        self.df['is_ground'] = False
        self.df['is_fly'] = False
        self.df['is_lined'] = False
        self.df['is_popped'] = False

        for hit_type, patterns in hit_type_patterns.items():
            mask = descriptions.str.contains(
                '|'.join(patterns), regex=True, na=False)
            # Only set True for rows that haven't been classified yet
            unclassified = ~(self.df['is_ground'] | self.df['is_fly']
                             | self.df['is_lined'] | self.df['is_popped'])
            if hit_type == 'ground':
                self.df.loc[mask & unclassified, 'is_ground'] = True
            elif hit_type == 'fly':
                self.df.loc[mask & unclassified, 'is_fly'] = True
            elif hit_type == 'lined':
                self.df.loc[mask & unclassified, 'is_lined'] = True
            elif hit_type == 'popped':
                self.df.loc[mask & unclassified, 'is_popped'] = True

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
                'RE24': 0,
                'SLG': np.nan,
                'OBP': np.nan
            })

        # Calculate batting average
        hits = (events['SINGLE'] + events['DOUBLE'] +
                events['TRIPLE'] + events['HOME_RUN'])
        ba = hits / ab if ab > 0 else np.nan

        # Calculate run expectancy delta
        rea = group['rea'].sum()

        # Calculate wOBA using raw events
        woba_numerator = (
            self.weights.get('walk', 0) * events['WALK'] +
            self.weights.get('hit_by_pitch', 0) * events['HBP'] +
            self.weights.get('single', 0) * events['SINGLE'] +
            self.weights.get('double', 0) * events['DOUBLE'] +
            self.weights.get('triple', 0) * events['TRIPLE'] +
            self.weights.get('home_run', 0) * events['HOME_RUN']
        )

        woba = woba_numerator / \
            (ab + events['WALK'] + sf + events['HBP'])
        slg = (events['SINGLE'] + 2 * events['DOUBLE'] + 3 *
               events['TRIPLE'] + 4 * events['HOME_RUN']) / ab if ab > 0 else np.nan
        obp = (hits + events['WALK'] + sf + events['HBP']) / \
            (ab + events['WALK'] + sf + events['HBP'])

        return pd.Series({
            'wOBA': woba,
            'BA': ba,
            'PA': pa,
            'RE24': rea,
            'SLG': slg,
            'OBP': obp
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
            grouped = (data.groupby(['batter_id', 'batter_standardized', 'bat_team'])
                       .apply(self.calculate_metrics, include_groups=False)
                       .reset_index())
            grouped['Situation'] = name
            results.append(grouped)

        return pd.concat(results, axis=0).reset_index(drop=True)

    def get_pivot_results(self):
        """Generate pivoted results for easy comparison"""
        final_df = self.analyze_situations()

        pivot = final_df.pivot(
            index=['batter_id', 'batter_standardized', 'bat_team'],
            columns='Situation',
            values=['wOBA', 'BA', 'PA', 'RE24', 'OBP', 'SLG']
        )

        # Clean up column names
        pivot.columns = [f"{stat}_{sit}" for stat, sit in pivot.columns]
        return pivot.reset_index()

    def calc_batted_ball_stats(self):
        self.prepare_batted_ball()
        stats = self.df.groupby('batter_standardized').agg({
            'batter_id': 'first',
            'bat_team': 'first',
            'batter_hand': 'first',
            'description': 'count',
            'is_pull': lambda x: (x == True).sum(),
            'is_oppo': lambda x: (x == True).sum(),
            'is_middle': lambda x: (x == True).sum(),
            'is_ground': lambda x: (x == True).sum(),
            'is_fly': lambda x: (x == True).sum(),
            'is_lined': lambda x: (x == True).sum(),
            'is_popped': lambda x: (x == True).sum(),
        })

        total = stats['description']

        # Calculate metrics
        stats['pull_pct'] = (stats['is_pull'] / total) * 100
        stats['oppo_pct'] = (stats['is_oppo'] / total) * 100
        stats['middle_pct'] = (stats['is_middle'] / total) * 100
        stats['gb_pct'] = (stats['is_ground'] / total) * 100
        stats['fb_pct'] = (stats['is_fly'] / total) * 100
        stats['ld_pct'] = (stats['is_lined'] / total) * 100
        stats['pop_pct'] = (stats['is_popped'] / total) * 100

        pull_air = self.df[(self.df['is_fly']) & self.df['is_pull']].groupby(
            'batter_standardized').size()
        oppo_gb = self.df[(self.df['is_ground']) & self.df['is_oppo']].groupby(
            'batter_standardized').size()
        stats['pull_air_pct'] = (pull_air / total * 100).fillna(0)
        stats['oppo_gb_pct'] = (oppo_gb / total * 100).fillna(0)
        stats = stats.reset_index()

        return stats[[
            'batter_standardized', 'bat_team', 'batter_id', 'batter_hand', 'description',
            'pull_pct', 'middle_pct', 'oppo_pct',
            'gb_pct', 'fb_pct', 'ld_pct', 'pop_pct',
            'pull_air_pct', 'oppo_gb_pct'
        ]].rename(columns={'description': 'count'}).sort_values('count', ascending=False).fillna(0)

    def analyze_splits(self):
        """Analyze performance splits vs LHP and RHP"""
        splits_list = [
            ('vs LHP',
             self.original_df[self.original_df['pitcher_hand'] == 'L']),
            ('vs RHP',
             self.original_df[self.original_df['pitcher_hand'] == 'R']),
            ('Overall',
             self.original_df),
        ]

        results = []
        for name, data in splits_list:
            if not data.empty:
                grouped = (data.groupby(['batter_id', 'batter_standardized', 'bat_team'])
                           .apply(self.calculate_metrics, include_groups=False)
                           .reset_index())
                grouped['Split'] = name
                results.append(grouped)

        if not results:
            return pd.DataFrame()

        return pd.concat(results, axis=0).reset_index(drop=True)

    def get_splits_results(self):
        """Generate pivoted results for platoon splits"""
        final_df = self.analyze_splits()

        if final_df.empty:
            # Return empty DataFrame with expected columns
            cols = ['batter_id', 'batter_standardized', 'bat_team']
            cols.extend([f"{stat}_vs {hand}" for stat in ['wOBA', 'BA', 'PA', 'RE24', 'OBP', 'SLG']
                        for hand in ['LHP', 'RHP']])
            return pd.DataFrame(columns=cols)

        pivot = final_df.pivot(
            index=['batter_id', 'batter_standardized', 'bat_team'],
            columns='Split',
            values=['wOBA', 'BA', 'PA', 'RE24', 'OBP', 'SLG']
        )

        # Clean up column names
        pivot.columns = [f"{stat}_{sit}" for stat, sit in pivot.columns]
        return pivot.reset_index()


def run_analysis(pbp_df, year, division):
    try:
        analytics = BaseballAnalytics(pbp_df, year, division)
        situational = analytics.get_pivot_results()
        batted_ball = analytics.calc_batted_ball_stats()
        splits = analytics.get_splits_results()
        return situational, batted_ball, splits
    except Exception as e:
        print(f"Error running analysis: {str(e)}")
        return None, None, None


def get_data(year, division):
    pbp_df = pd.read_csv(
        f'C:/Users/kellyjc/Desktop/d3_pipeline/data/play_by_play/d{division}_parsed_pbp_new_{year}.csv')
    bat_war = pd.read_csv(
        f'C:/Users/kellyjc/Desktop/d3_pipeline/data/war/d{division}_batting_war_{year}.csv').rename(columns={'WAR': 'bWAR'})
    rosters = pd.read_csv(
        f'C:/Users/kellyjc/Desktop/d3_pipeline/data/rosters/d{division}_rosters_{year}.csv')
    pitch_war = pd.read_csv(
        f'C:/Users/kellyjc/Desktop/d3_pipeline/data/war/d{division}_pitching_war_{year}.csv')

    bat_war['B/T'] = bat_war['B/T'].replace('0', np.nan).astype(str)
    pitch_war['B/T'] = pitch_war['B/T'].replace('0', np.nan).astype(str)

    roster_b_map = rosters.set_index('player_id')['bats'].to_dict()
    roster_p_map = rosters.set_index('player_id')['throws'].to_dict()
    batting_map = bat_war.set_index(
        'player_id')['B/T'].str.split('/').str[0].to_dict()
    pitching_map = pitch_war.set_index(
        'player_id')['B/T'].str.split('/').str[1].to_dict()

    combined_b_map = {id: batting_map.get(id) or roster_b_map.get(id)
                      for id in set(roster_b_map) | set(batting_map)}
    combined_p_map = {id: pitching_map.get(id) or roster_p_map.get(id)
                      for id in set(roster_p_map) | set(pitching_map)}

    combined_b_map = {k: standardize_hand(v)
                      for k, v in combined_b_map.items()}
    combined_p_map = {k: standardize_hand(v)
                      for k, v in combined_p_map.items()}

    pbp_df['batter_hand'] = pbp_df['batter_id'].map(combined_b_map)
    pbp_df['pitcher_hand'] = pbp_df['pitcher_id'].map(combined_p_map)

    return pbp_df, bat_war


def standardize_hand(x):
    if pd.isna(x) or x == '0':
        return np.nan
    x = str(x).upper()
    if x in ['L', 'LEFT']:
        return 'L'
    elif x in ['R', 'RIGHT']:
        return 'R'
    elif x in ['S', 'SWITCH', 'B']:
        return 'S'
    return np.nan


def main():
    db_file = '../ncaa.db'
    conn = sqlite3.connect(db_file)

    all_situational = []
    all_baserunning = []
    all_batted_ball = []
    all_splits = []
    year = 2025

    for division in range(1, 4):
        print(f'Processing data for {year} D{division}')
        try:
            pbp_df, bat_war = get_data(year, division)
            situational, batted_ball, splits = run_analysis(
                pbp_df, year, division)

            if all(result is not None for result in [situational, batted_ball, splits]):
                # Add year and division to each dataset
                for df, lst in [(situational, all_situational),
                                (batted_ball, all_batted_ball),
                                (splits, all_splits)]:
                    df['Year'] = year
                    df['Division'] = division
                    lst.append(df)

                # Get baserunning data
                baserun = bat_war[['Player', 'player_id', 'Team', 'Conference', 'SB%', 'wSB',
                                   'wGDP', 'wTEB', 'Baserunning', 'EBT', 'OutsOB', 'Opportunities',
                                   'CS', 'SB', 'Picked']].sort_values('Baserunning')
                baserun['Year'] = year
                baserun['Division'] = division
                all_baserunning.append(baserun)

        except Exception as e:
            print(f"Error processing {year} D{division}: {e}")
            continue

    data_sets = {
        'situational': (all_situational, ['batter_id', 'batter_standardized', 'bat_team', 'Year', 'Division']),
        'baserunning': (all_baserunning, ['player_id', 'Team', 'Year', 'Division']),
        'batted_ball': (all_batted_ball, ['batter_id', 'batter_standardized', 'bat_team', 'Year', 'Division']),
        'splits': (all_splits, ['batter_id', 'batter_standardized', 'bat_team', 'Year', 'Division'])
    }

    for name, (data_list, dedup_cols) in data_sets.items():
        if data_list:
            combined_df = pd.concat(data_list, ignore_index=True)
            combined_df = combined_df.drop_duplicates(subset=dedup_cols)

            combined_df.to_sql(name, conn, if_exists='replace', index=False)
            combined_df.to_csv(
                f'C:/Users/kellyjc/Desktop/d3_pipeline/data/leaderboards/{name}.csv', index=False)

    conn.close()
    print("Processing complete!")


if __name__ == '__main__':
    main()
