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

    def __init__(self, pbp_df, year, division, weights_path='../data/miscellaneous/d{}_linear_weights_{}.csv'):
        self.original_df = pbp_df.copy()
        self.year = year
        self.weights_path = weights_path
        self.situations = None
        self.weights = None
        self.division = division

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

        # Calculate batting average
        hits = (events['SINGLE'] + events['DOUBLE'] +
                events['TRIPLE'] + events['HOME_RUN'])
        ba = hits / ab if ab > 0 else np.nan

        # Calculate run expectancy delta
        rea = group['rea'].sum()
        woba = group['woba'].sum()

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
            grouped = (data.groupby(['batter_id', 'batter_standardized', 'bat_team'])
                       .apply(self.calculate_metrics)
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


def get_data(year, division):
    pbp_df = pd.read_csv(
        f'../data/play_by_play/d{division}_parsed_pbp_new_{year}.csv')
    bat_war = pd.read_csv(
        f'../data/war/d{division}_batting_war_{year}.csv').rename(columns={'WAR': 'bWAR'})
    pitch_war = pd.read_csv(
        f'../data/war/d{division}_pitching_war_{year}.csv').rename(columns={'WAR': 'pWAR'})
    pitch_war['Pos'] = 'P'
    weights = pd.read_csv(
        f'../data/guts/guts_constants.csv').query(f'Year == {year}').query(f'Division == {division}')

    return pbp_df, bat_war, pitch_war, weights


def main():
    db_file = '../ncaa.db'
    conn = sqlite3.connect(db_file)

    for year in range(2021, 2025):
        for division in range(1, 4):
            print(f'Processing data for {year} D{division}')
            pbp_df, bat_war, pitch_war, weights = get_data(year, division)

            situational = run_analysis(pbp_df, year, division).fillna(0)
            baserun = bat_war[['Player', 'player_id', 'Team', 'Conference', 'SB%', 'wSB', 'wGDP', 'wTEB', 'Baserunning',
                               'EBT', 'OutsOB', 'Opportunities', 'CS', 'SB', 'Picked']].sort_values('Baserunning')

            db_file = f'../ncaa.db'

            situational.to_sql(f'd{division}_situational_{year}',
                               conn, if_exists='replace', index=False)
            situational.to_csv(f'd{division}_situational_{year}', index=False)
            baserun.to_sql(f'd{division}_baserunning_{year}', conn,
                           if_exists='replace', index=False)
            baserun.to_csv(f'd{division}_baserunning_{year}', index=False)

    conn.close()


if __name__ == '__main__':
    main()
