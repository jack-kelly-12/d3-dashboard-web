import sqlite3
import pandas as pd
import numpy as np


class BaseballStats:
    def __init__(self, db_path='../ncaa.db', data_dir='../data'):
        self.db_path = db_path
        self.data_dir = data_dir
        self.position_adjustments = {
            'SS': 1.85, 'C': 3.09, '2B': 0.62, '3B': 0.62, 'UT': 0.62,
            'CF': 0.62, 'INF': 0.62, 'LF': -1.85, 'RF': -1.85, '1B': -3.09,
            'DH': -3.09, 'OF': 0.25, 'PH': -0.74, 'PR': -0.74, 'P': 0.62,
            'RP': 0.62, 'SP': 0.62, '': 0
        }
        self.batting_columns = [
            'Player', 'Pos', 'Team', 'Conference', 'Yr', 'R/PA', 'GP',
            'BB', 'CS', 'GS', 'HBP', 'IBB', 'K', 'RBI', 'SF', 'AB',
            'PA', 'H', '2B', '3B', 'HR', 'R', 'SB', 'OPS+', 'Picked',
            'Sac', 'BA', 'SlgPct', 'OBPct', 'ISO', 'wOBA', 'K%', 'BB%',
            'SB%', 'wRC+', 'wRC', 'Batting', 'Baserunning', 'Adjustment', 'WAR', 'player_id', 'player_url'
        ]
        self.pitching_columns = [
            'Player', 'Team', 'Conference', 'App', 'GS', 'ERA', 'IP', 'H', 'R', 'ER',
            'BB', 'SO', 'HR-A', '2B-A', '3B-A', 'HB', 'BF', 'FO', 'GO', 'Pitches',
            'gmLI', 'K9', 'BB9', 'HR9', 'RA9', 'H9', 'IR-A%', 'K%', 'BB%', 'K-BB%', 'HR/FB', 'FIP',
            'xFIP', 'ERA+', 'WAR', 'Season', 'Yr', 'Inh Run', 'Inh Run Score', 'player_id', 'player_url'
        ]
        self.team_pitching_agg = {
            'App': 'sum', 'Conference': 'first', 'IP': 'sum', 'H': 'sum',
            '2B-A': 'sum', '3B-A': 'sum', 'Inh Run': 'sum', 'Inh Run Score': 'sum',
            'HR-A': 'sum', 'R': 'sum', 'ER': 'sum', 'WAR': 'sum',
            'FO': 'sum', 'BB': 'sum', 'HB': 'sum', 'SO': 'sum',
            'BF': 'sum', 'Pitches': 'sum'
        }
        self.team_batting_agg = {
            'GP': 'max', 'Conference': 'first', 'AB': 'sum', 'BB': 'sum',
            'IBB': 'sum', 'SF': 'sum', 'HBP': 'sum', 'PA': 'sum', 'H': 'sum',
            '2B': 'sum', '3B': 'sum', 'HR': 'sum', 'R': 'sum', 'SB': 'sum',
            'Picked': 'sum', 'Sac': 'sum', 'wRC': 'sum', 'Batting': 'sum',
            'Baserunning': 'sum', 'Adjustment': 'sum', 'WAR': 'sum',
            'K': 'sum', 'CS': 'sum', 'RBI': 'sum', 'GS': 'max'
        }
        self.gdp_run_value = -.5

    def get_connection(self):
        return sqlite3.connect(self.db_path)

    def calculate_pitching_metrics(self, df):
        lg_era = (df['ER'].sum() * 9) / df['IP'].sum()
        fip_components = ((13 * df['HR-A'].sum() + 3 * (df['BB'].sum() + df['HB'].sum()) -
                          2 * df['SO'].sum()) / df['IP'].sum())
        f_constant = lg_era - fip_components

        fip = f_constant + ((13 * df['HR-A'] + 3 * (df['BB'] + df['HB']) -
                            2 * df['SO']) / df['IP'])
        lg_hr_fb_rate = df['HR-A'].sum() / (df['HR-A'].sum() + df['FO'].sum())
        xfip = f_constant + ((13 * ((df['FO'] + df['HR-A']) * lg_hr_fb_rate) +
                             3 * (df['BB'] + df['HB']) - 2 * df['SO']) / df['IP'])

        return fip, xfip

    def process_pitching_stats(self, df, pbp_df, runs_df):
        if df.empty:
            return df

        df = df[df['App'] > 0].copy()
        df = df[df['ERA'].notna()]

        fill_cols = ['HR-A', 'FO', 'IP', 'BB',
                     'SO', 'SV', 'GS', 'HB', 'BF', 'H', 'R']
        df[fill_cols] = df[fill_cols].fillna(0)
        df.loc[df['IP'] == 0, 'IP'] = 0.0000001

        df['RA9'] = (df['R'] / df['IP']) * 9
        df['IR-A%'] = ((df['Inh Run Score'] / df['Inh Run']) * 100).fillna(0)
        df['K9'] = (df['SO'] / df['IP']) * 9
        df['H9'] = (df['H'] / df['IP']) * 9
        df['BB9'] = (df['BB'] / df['IP']) * 9
        df['HR9'] = (df['HR-A'] / df['IP']) * 9
        df['BB%'] = (df['BB'] / df['BF']) * 100
        df['K%'] = (df['SO'] / df['BF']) * 100
        df['K-BB%'] = df['K%'] - df['BB%']
        df['HR/FB'] = (df['HR-A'] / (df['HR-A'] + df['FO'])) * 100

        df['FIP'], df['xFIP'] = self.calculate_pitching_metrics(df)
        df['iPF'] = df['team_name'].map(runs_df.set_index('team_name')['iPF'])
        df['PF'] = ((1 - (1 - df.iPF) * .4) * 100).fillna(100)

        return self.compute_pitching_war(df, pbp_df)

    def compute_pitching_war(self, df, pbp_df):
        if df.empty:
            return df

        # Calculate gmLI for relievers
        gmli = (pbp_df[pbp_df['description'].str.contains('to p for', na=False)]
                .groupby(['pitcher_standardized', 'pitch_team'])
                .agg({'li': 'mean'})
                .reset_index()
                .rename(columns={'li': 'gmLI', 'pitch_team': 'Team'}))

        # Merge gmLI data
        df = df.merge(gmli, how='left',
                      left_on=['player_name', 'team_name'],
                      right_on=['pitcher_standardized', 'Team'])
        df['gmLI'] = df['gmLI'].fillna(0.0)
        df = df.drop('pitcher_standardized', axis=1, errors='ignore')

        def calculate_if_fip_constant(group_df):
            lg_ip = group_df['IP'].sum()
            lg_hr = group_df['HR-A'].sum()
            lg_bb = group_df['BB'].sum()
            lg_hbp = group_df['HB'].sum()
            lg_k = group_df['SO'].sum()
            lg_era = (group_df['ER'].sum() / lg_ip) * 9

            numerator = ((13 * lg_hr) + (3 * (lg_bb + lg_hbp)) - (2 * lg_k))
            return lg_era - (numerator / lg_ip)

        # Calculate ifFIP for each pitcher
        def calculate_player_if_fip(row, constant):
            numerator = ((13 * row['HR-A']) + (3 * (row['BB'] + row['HB'])) -
                         (2 * row['SO']))
            return (numerator / row['IP']) + constant

        # Calculate FIP constants and ifFIP by conference
        if_fip_constants = df.groupby('conference').apply(
            calculate_if_fip_constant).reset_index()
        if_fip_constants.columns = ['conference', 'if_fip_constant']
        df = df.merge(if_fip_constants, on='conference', how='left')

        # Calculate individual ifFIP
        df['ifFIP'] = df.apply(lambda row: calculate_player_if_fip(
            row, row['if_fip_constant']), axis=1)

        # Calculate RA9-ERA adjustment
        lgRA9 = (df['R'].sum() / df['IP'].sum()) * 9
        lgERA = (df['ER'].sum() / df['IP'].sum()) * 9
        adjustment = lgRA9 - lgERA

        # Calculate individual FIPR9 and park adjust it
        df['FIPR9'] = df['ifFIP'] + adjustment
        df['PF'] = df['PF'].fillna(100)
        df['pFIPR9'] = df['FIPR9'] / (df['PF'] / 100)

        def calculate_league_adjustments(group_df):
            # Get league totals
            lg_ip = group_df['IP'].sum()
            lg_hr = group_df['HR-A'].sum()
            lg_bb = group_df['BB'].sum()
            lg_hbp = group_df['HB'].sum()
            lg_k = group_df['SO'].sum()

            # Calculate league ifFIP
            lg_ifFIP = ((13 * lg_hr) + (3 * (lg_bb + lg_hbp)) -
                        (2 * lg_k)) / lg_ip + group_df['if_fip_constant'].iloc[0]

            # Get RA9-ERA adjustment
            lgRA9 = (group_df['R'].sum() / lg_ip) * 9
            lgERA = (group_df['ER'].sum() / lg_ip) * 9
            adjustment = lgRA9 - lgERA

            # League FIPR9 is league ifFIP plus adjustment
            return lg_ifFIP + adjustment

        league_adjustments = df.groupby('conference').apply(
            calculate_league_adjustments).reset_index()
        league_adjustments.columns = ['conference', 'conf_fipr9']
        df = df.merge(league_adjustments, on='conference', how='left')

        # Calculate runs above average per 9
        df['RAAP9'] = df['conf_fipr9'] - df['pFIPR9']

        # Calculate IP/G and dynamic runs per win
        df['IP/G'] = df['IP'] / df['App']
        df['dRPW'] = (((18 - df['IP/G']) * df['conf_fipr9'] +
                       df['IP/G'] * df['pFIPR9']) / 18 + 2) * 1.5

        # Convert to wins per game
        df['WPGAA'] = df['RAAP9'] / df['dRPW']

        # Calculate replacement level
        df['gs/g'] = df['GS'] / df['App']
        df['replacement_level'] = (
            0.03 * (1 - df['gs/g'])) + (0.12 * df['gs/g'])

        # Calculate WPGAR and initial WAR
        df['WPGAR'] = df['WPGAA'] + df['replacement_level']
        df['WAR'] = df['WPGAR'] * (df['IP'] / 9)

        relief_mask = df['GS'] <= 2
        df.loc[relief_mask, 'WAR'] *= (1 + df.loc[relief_mask, 'gmLI']) / 2

        # Apply final correction
        warip = -0.0010
        df['WAR'] += warip * df['IP']

        df['ERA+'] = 100 * \
            (2 - (df.ERA / ((df.ER.sum() / df.IP.sum()) * 9)) * (1 / (df.PF / 100)))

        return df.dropna(subset=['WAR'])

    def calculate_wgdp(self, pbp_df):
        gdp_opps = pbp_df[(pbp_df['r1_name'] != '') & (
            pbp_df['outs_before'].astype(int) < 2)].copy()

        gdp_events = gdp_opps[gdp_opps['description'].str.contains('into double play',
                                                                   case=False,
                                                                   na=False)]

        gdp_stats = pd.DataFrame({
            'GDP_opps': gdp_opps.groupby('batter_standardized').size(),
            'GDP': gdp_events.groupby('batter_standardized').size()
        }).fillna(0)

        lg_gdp_rate = gdp_stats['GDP'].sum() / gdp_stats['GDP_opps'].sum()

        gdp_stats['wGDP'] = (
            (gdp_stats['GDP_opps'] * lg_gdp_rate - gdp_stats['GDP']) *
            self.gdp_run_value
        )

        return gdp_stats

    def process_batting_stats(self, df, weights_df, runs_df, pbp_df):
        if df.empty:
            return df

        df = df.copy()
        df['Pos'] = df['Pos'].apply(lambda x: '' if pd.isna(
            x) else str(x).split('/')[0].upper())

        gdp_stats = self.calculate_wgdp(pbp_df)
        df = df.merge(
            gdp_stats,
            left_on='player_name',
            right_index=True,
            how='left'
        )
        df[['wGDP', 'GDP_opps', 'GDP']] = df[[
            'wGDP', 'GDP_opps', 'GDP']].fillna(0)

        fill_cols = ['HR', 'R', 'GP', 'GS', '2B', '3B', 'H', 'CS', 'BB', 'K',
                     'SB', 'IBB', 'RBI', 'Picked', 'SH', 'AB', 'HBP', 'SF']
        df[fill_cols] = df[fill_cols].fillna(0)

        df['GP'] = pd.to_numeric(
            df['GP'], errors='coerce').fillna(0).astype(int)
        df['GS'] = pd.to_numeric(
            df['GS'], errors='coerce').fillna(0).astype(int)
        df = df[df['AB'] > 0]

        df['iPF'] = df['team_name'].map(runs_df.set_index('team_name')['iPF'])
        df['PF'] = ((1 - (1 - df.iPF) * .4) * 100).fillna(100)
        df['1B'] = df['H'] - df['HR'] - df['3B'] - df['2B']
        df['PA'] = df['AB'] + df['BB'] + df['IBB'] + df['HBP'] + df['SF']

        df['SB%'] = (df['SB'] / (df['SB'] + df['CS'])) * 100
        df['BB%'] = (df['BB'] / df['PA']) * 100
        df['K%'] = (df['K'] / df['PA']) * 100
        df['ISO'] = df['SlgPct'] - df['BA']
        lg_obp = (df['H'].sum() + df['BB'].sum() + df['HBP'].sum()) / \
            (df['AB'].sum() + df['BB'].sum() + df['HBP'].sum() + df['SF'].sum())
        lg_slg = (df['1B'].sum() + df['2B'].sum() * 2 +
                  df['3B'].sum() * 3 + df['HR'].sum() * 4) / df['AB'].sum()

        df['OPS+'] = 100 * (df['OBPct'] / lg_obp +
                            df['SlgPct'] / lg_slg - 1)
        df['R/PA'] = df['R'] / df['PA']

        numerator = (weights_df['wBB'] * df['BB'] +
                     weights_df['wHBP'] * df['HBP'] +
                     weights_df['w1B'] * df['1B'] +
                     weights_df['w2B'] * df['2B'] +
                     weights_df['w3B'] * df['3B'] +
                     weights_df['wHR'] * df['HR'])
        denominator = df['AB'] + df['BB'] - df['IBB'] + df['SF'] + df['HBP']
        df['wOBA'] = numerator / denominator

        return self._compute_batting_war(df, weights_df)

    def _compute_batting_war(self, df, weights):
        df['PF'].fillna(100, inplace=True)
        pf = df['PF'] / 100

        league_woba = weights['wOBA']
        league_rpa = (df['R'].sum() / df['PA'].sum())
        pa = df['PA']
        woba = df['wOBA']
        woba_scale = weights['wOBAScale']
        rpw = weights['runsWin']
        runs_per_out = weights['runsOut']
        runCS = -1 * (2 * runs_per_out + 0.075)
        runSB = 0.2

        conf_wrc = {}
        for conf in df['conference'].unique():
            conf_df = df[df['conference'] == conf]
            if len(conf_df) > 0:
                conf_wrc[conf] = conf_df['R'].sum() / conf_df['PA'].sum()

        def calculate_batting_runs(row):
            pf = row['PF'] / 100
            conf_rpa = conf_wrc.get(row['conference'], league_rpa)

            return (row['wRAA'] +
                    (league_rpa - (pf * league_rpa)) * row['PA'] +
                    (league_rpa - conf_rpa) * row['PA'])

        df['wRC'] = (((woba - league_woba) / woba_scale) + league_rpa) * pa
        league_wrcpa = (df['wRC'].sum() / df['PA'].sum())
        df['wRAA'] = ((woba - league_woba) / woba_scale) * pa
        df['batting_runs'] = df.apply(calculate_batting_runs, axis=1)

        lgwSB = ((df['SB'].sum() * runSB + df['CS'].sum() * runCS) /
                 (df['1B'].sum() + df['BB'].sum() + df['HBP'].sum() - df['IBB'].sum()))

        df['wSB'] = (df['SB'] * runSB + df['CS'] * runCS -
                     lgwSB * (df['1B'] + df['BB'] + df['HBP'] - df['IBB']))

        team_count = len(df['team_name'].unique())
        games_played = (df['GS'].sum() / 9) / team_count
        replacement_constant = ((team_count / 2) * games_played -
                                (team_count * games_played * 0.294))
        df['replacement_level_runs'] = replacement_constant * \
            (rpw / pa.sum()) * rpw
        df['baserunning'] = df['wSB'] + df['wGDP']
        df['Adjustment'] = (df['Pos'].map(self.position_adjustments).fillna(0) *
                            (df['GP'] / games_played))

        conf_adjustments = {}
        for conf in df['conference'].unique():
            conf_df = df[df['conference'] == conf]
            if len(conf_df) > 0:
                lg_batting = conf_df['batting_runs'].sum()
                lg_baserunning = conf_df['wSB'].sum()
                lg_positional = conf_df['Adjustment'].sum()
                lg_pa = conf_df['PA'].sum()
                if lg_pa > 0:
                    conf_adjustments[conf] = (-1 * (lg_batting +
                                                    lg_baserunning + lg_positional) / lg_pa)

        df['league_adjustment'] = df.apply(
            lambda x: conf_adjustments.get(x['conference'], 0) * x['PA'], axis=1
        )

        df['WAR'] = ((df['batting_runs'] + df['replacement_level_runs'] +
                      df['baserunning'] + df['Adjustment'] +
                      df['league_adjustment']) / rpw)

        wraa_pa = df['wRAA'] / df['PA']
        league_wrcpa = (df['wRC'].sum() / df['PA'].sum())
        df['wRC+'] = (((wraa_pa + league_rpa) +
                       (league_rpa - pf * league_rpa)) / league_wrcpa) * 100

        return df.dropna(subset=['WAR'])

    def get_data(self):
        conn = self.get_connection()
        pitching, batting, pbp = [], [], []

        try:
            for year in [2021, 2022, 2023, 2024]:
                pitching_df = pd.read_sql(
                    f"SELECT * FROM pitching_{year}", conn)
                pitching.append(pitching_df)

                batting_df = pd.read_sql(f"SELECT * FROM batting_{year}", conn)
                batting.append(batting_df)

                pbp_df = pd.read_csv(
                    f'{self.data_dir}/parsed_pbp_new_{year}.csv')
                pbp.append(pbp_df)

            park_factors = pd.read_csv(f'{self.data_dir}/park_factors.csv')
            guts = pd.read_csv(f'{self.data_dir}/guts_constants.csv')

            return batting, pitching, pbp, guts, park_factors
        finally:
            conn.close()

    def create_team_war_table(self, df, year, agg_dict):
        team_war = df.groupby('Team').agg(agg_dict).reset_index()
        team_war['Season'] = year
        return team_war

    def create_batting_team_war_table(self, df, year):
        team_war = self.create_team_war_table(df, year, self.team_batting_agg)

        team_war['BA'] = team_war['H'] / team_war['AB']
        team_war['SlgPct'] = (team_war['H'] + team_war['2B'] +
                              2 * team_war['3B'] + 3 * team_war['HR']) / team_war['AB']
        team_war['OBPct'] = (team_war['H'] + team_war['BB'] + team_war['HBP'] +
                             team_war['IBB']) / (team_war['AB'] + team_war['BB'] +
                                                 team_war['IBB'] + team_war['HBP'] + team_war['SF'])

        return self.add_batting_cols_team(team_war, self.park_factors, self.guts, year)

    def create_pitching_team_war_table(self, df, year):
        team_war = self.create_team_war_table(df, year, self.team_pitching_agg)
        team_war['ERA'] = (team_war['ER'] * 9) / team_war['IP']
        team_war = self.add_pitching_cols_team(team_war)
        return team_war.replace({np.inf: 0, -np.inf: 0})

    def add_batting_cols_team(self, df, park_factors, guts, year):
        df['iPF'] = df['Team'].map(
            park_factors.set_index('team_name')['iPF'])
        df['PF'] = ((1 - (1 - df.iPF) * .4) * 100).fillna(100)
        df['1B'] = df['H'] - df['HR'] - df['3B'] - df['2B']
        df['PA'] = df['AB'] + df['BB'] + df['IBB'] + df['HBP'] + df['SF']

        df['SB%'] = (df['SB'] / (df['SB'] + df['CS'])) * 100
        df['BB%'] = (df['BB'] / df['PA']) * 100
        df['K%'] = (df['K'] / df['PA']) * 100
        df['ISO'] = df['SlgPct'] - df['BA']
        lg_obp = (df['H'].sum() + df['BB'].sum() + df['HBP'].sum()) / \
            (df['AB'].sum() + df['BB'].sum() + df['HBP'].sum() + df['SF'].sum())
        lg_slg = (df['1B'].sum() + df['2B'].sum() * 2 +
                  df['3B'].sum() * 3 + df['HR'].sum() * 4) / df['AB'].sum()

        df['OPS+'] = 100 * (df['OBPct'] / lg_obp +
                            df['SlgPct'] / lg_slg - 1)
        df['R/PA'] = df['R'] / df['PA']

        year_guts = guts[guts['Year'] == year]
        year_guts = year_guts.iloc[0]

        numerator = (year_guts['wBB'] * df['BB'] +
                     year_guts['wHBP'] * df['HBP'] +
                     year_guts['w1B'] * df['1B'] +
                     year_guts['w2B'] * df['2B'] +
                     year_guts['w3B'] * df['3B'] +
                     year_guts['wHR'] * df['HR'])
        denominator = df['AB'] + df['BB'] - df['IBB'] + df['SF'] + df['HBP']
        df['wOBA'] = numerator / denominator

        return df

    def add_pitching_cols_team(self, df):
        df['IR-A%'] = ((df['Inh Run Score'] / df['Inh Run']) * 100).fillna(0)
        df['RA9'] = (df['R'] / df['IP']) * 9
        df['K9'] = (df['SO'] / df['IP']) * 9
        df['H9'] = (df['H'] / df['IP']) * 9
        df['BB9'] = (df['BB'] / df['IP']) * 9
        df['HR9'] = (df['HR-A'] / df['IP']) * 9
        df['BB%'] = (df['BB'] / df['BF']) * 100
        df['K%'] = (df['SO'] / df['BF']) * 100
        df['K-BB%'] = df['K%'] - df['BB%']
        df['HR/FB'] = (df['HR-A'] / (df['HR-A'] + df['FO'])) * 100

        fip, xfip = self.calculate_pitching_metrics(df)
        df['FIP'] = fip
        df['xFIP'] = xfip

        df['iPF'] = df['Team'].map(
            self.park_factors.set_index('team_name')['iPF'])
        df['PF'] = ((1 - (1 - df.iPF) * .4) * 100).fillna(100)

        df['ERA+'] = 100 * \
            (2 - (df.ERA / ((df.ER.sum() / df.IP.sum()) * 9)) * (1 / (df.PF / 100)))

        return df

    def process_and_save_stats(self, start_year=2021, end_year=2024):
        conn = self.get_connection()
        try:
            batting, pitching, pbp, self.guts, self.park_factors = self.get_data()
            self.guts = self.guts.reset_index(drop=True)

            for i, year in enumerate(range(start_year, end_year + 1)):
                if i >= len(batting):
                    continue

                year_guts = self.guts[self.guts['Year'] == year]
                if len(year_guts) == 0:
                    year_guts = self.guts[self.guts['Year'] <= year].iloc[-1:]
                if len(year_guts) == 0:
                    year_guts = self.guts.iloc[-1:]
                year_guts = year_guts.iloc[0]

                bat_war = self.process_batting_stats(batting[i], year_guts,
                                                     self.park_factors, pbp[i])
                bat_war = bat_war.rename(columns={
                    'player_name': 'Player',
                    'team_name': 'Team', 'SH': 'Sac',
                    'batting_runs': 'Batting', 'baserunning': 'Baserunning',
                    'conference': 'Conference'
                })
                bat_war = bat_war[self.batting_columns]
                bat_war['Season'] = year
                bat_war['SB%'] = bat_war['SB%'].fillna(0)

                bat_war.to_sql(f'batting_war_{year}', conn, if_exists='replace',
                               index=False)
                bat_team_war = self.create_batting_team_war_table(
                    bat_war, year)
                bat_team_war.to_sql(f'batting_team_war_{year}', conn,
                                    if_exists='replace', index=False)
                bat_war.to_csv(
                    f'../data/batting_war_{year}.csv', index=False)

                if i < len(pitching):
                    pitch_war = self.process_pitching_stats(pitching[i], pbp[i],
                                                            self.park_factors)

                    pitch_war = pitch_war.fillna(0)
                    pitch_war['ERA+'] = pitch_war['ERA+'].replace(
                        {np.inf: 0, -np.inf: 0})

                    if 'Team' in pitch_war.columns and 'team_name' in pitch_war.columns:
                        pitch_war = pitch_war.drop('Team', axis=1)

                    pitch_war = pitch_war.rename(columns={
                        'player_name': 'Player',
                        'conference': 'Conference',
                        'team_name': 'Team'
                    })

                    pitch_war['Season'] = year

                    pitch_war = pitch_war[self.pitching_columns]

                    pitch_war.to_sql(f'pitching_war_{year}', conn,
                                     if_exists='replace', index=False)
                    pitch_war.to_csv(
                        f'../data/pitching_war_{year}.csv', index=False)
                    pitch_team_war = self.create_pitching_team_war_table(pitch_war,
                                                                         year)
                    pitch_team_war.to_sql(f'pitching_team_war_{year}', conn,
                                          if_exists='replace', index=False)
        finally:
            conn.close()


def main():
    stats = BaseballStats()
    stats.process_and_save_stats()


if __name__ == "__main__":
    main()
