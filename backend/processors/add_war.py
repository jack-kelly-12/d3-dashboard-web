import sqlite3
import pandas as pd
import numpy as np
from fuzzywuzzy import fuzz, process


class BaseballStats:
    def __init__(self, db_path='C:/Users/kellyjc/Desktop/d3_app_improved/backend/ncaa.db', data_dir='C:/Users/kellyjc/Desktop/d3_pipeline/data'):
        self.db_path = db_path
        self.data_dir = data_dir
        self.position_adjustments = {
            'SS': 1.85, 'C': 3.09, '2B': 0.62, '3B': 0.62, 'UT': 0.62,
            'CF': 0.62, 'INF': 0.62, 'LF': -1.85, 'RF': -1.85, '1B': -3.09,
            'DH': -3.09, 'OF': 0.25, 'PH': -0.74, 'PR': -0.74, 'P': 0.62,
            'RP': 0.62, 'SP': 0.62, '': 0
        }
        self.batting_columns = [
            'Player', 'Pos', 'B/T', 'player_id', 'Team', 'Conference', 'Yr', 'R/PA', 'GP',
            'BB', 'CS', 'GS', 'HBP', 'IBB', 'K', 'RBI', 'SF', 'AB',
            'PA', 'H', '2B', '3B', 'HR', 'R', 'SB', 'OPS+', 'Picked',
            'Sac', 'BA', 'SlgPct', 'OBPct', 'ISO', 'wOBA', 'K%', 'BB%',
            'SB%', 'wRC+', 'wRC', 'Batting', 'Baserunning', 'Adjustment', 'WAR',
            'Clutch', 'WPA', 'REA', 'WPA/LI', 'wSB', 'wGDP', 'wTEB', 'EBT', "Opportunities", 'OutsOB',
            'GDPOpps', 'GDP', 'Division', 'Season'
        ]
        self.pitching_columns = [
            'Player', 'player_id', 'B/T', 'Team', 'Conference', 'App', 'GS', 'ERA', 'IP', 'H', 'R', 'ER',
            'BB', 'SO', 'HR-A', '2B-A', '3B-A', 'HB', 'BF', 'FO', 'GO', 'Pitches',
            'gmLI', 'K9', 'BB9', 'HR9', 'RA9', 'H9', 'IR-A%', 'K%', 'BB%', 'K-BB%', 'HR/FB', 'FIP',
            'xFIP', 'ERA+', 'WAR', 'Yr', 'Inh Run', 'Inh Run Score',
            'Clutch', 'pWPA', 'pREA', 'pWPA/LI', 'Division', 'Season'
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
            'K': 'sum', 'CS': 'sum', 'RBI': 'sum', 'GS': 'max',
        }

        self.gdp_run_value = -.5

    def get_connection(self):
        return sqlite3.connect(self.db_path)

    def process_pitching_stats(self, df, pbp_df, runs_df, bat_war_total):
        if df.empty:
            return df

        df = df[df['App'] > 0].copy()
        df = df[df['ERA'].notna()]

        fill_cols = ['HR-A', 'FO', 'IP', 'BB',
                     'SO', 'SV', 'GS', 'HB', 'BF', 'H', 'R']
        df[fill_cols] = df[fill_cols].fillna(0)

        def safe_per_nine(numerator, ip):
            return np.where(ip > 0, (numerator / ip) * 9, 0)

        def safe_percentage(numerator, denominator):
            return np.where(denominator > 0, (numerator / denominator) * 100, 0)

        df['RA9'] = safe_per_nine(df['R'], df['IP'])
        df['K9'] = safe_per_nine(df['SO'], df['IP'])
        df['H9'] = safe_per_nine(df['H'], df['IP'])
        df['BB9'] = safe_per_nine(df['BB'], df['IP'])
        df['HR9'] = safe_per_nine(df['HR-A'], df['IP'])

        df['BB%'] = safe_percentage(df['BB'], df['BF'])
        df['K%'] = safe_percentage(df['SO'], df['BF'])
        df['K-BB%'] = df['K%'] - df['BB%']

        fb_total = df['HR-A'] + df['FO']
        df['HR/FB'] = safe_percentage(df['HR-A'], fb_total)

        df['IR-A%'] = safe_percentage(df['Inh Run Score'], df['Inh Run'])

        valid_ip_mask = df['IP'] > 0
        df.loc[valid_ip_mask, ['FIP', 'xFIP']
               ] = self.calculate_pitching_metrics(df[valid_ip_mask])
        df.loc[~valid_ip_mask, ['FIP', 'xFIP']] = np.nan

        df['iPF'] = df['team_name'].map(runs_df.set_index('team_name')['iPF'])
        df['PF'] = ((1 - (1 - df.iPF) * .6) * 100).fillna(100)

        lg_era = (df.loc[valid_ip_mask, 'ER'].sum() /
                  df.loc[valid_ip_mask, 'IP'].sum()) * 9
        df.loc[valid_ip_mask, 'ERA+'] = 100 * \
            (2 - (df.loc[valid_ip_mask, 'ERA'] / lg_era)
             * (1 / (df.loc[valid_ip_mask, 'PF'] / 100)))
        df.loc[~valid_ip_mask, 'ERA+'] = np.nan

        return self.compute_pitching_war(df, pbp_df, bat_war_total)

    def calculate_pitching_metrics(self, df):
        """Calculate FIP and xFIP for pitchers with IP > 0"""
        lg_era = (df['ER'].sum() * 9) / df['IP'].sum()

        fip_components = ((13 * df['HR-A'].sum() + 3 * (df['BB'].sum() + df['HB'].sum()) -
                           2 * df['SO'].sum()) / df['IP'].sum())
        f_constant = lg_era - fip_components

        fip = f_constant + ((13 * df['HR-A'] + 3 * (df['BB'] + df['HB']) -
                            2 * df['SO']) / df['IP'])

        lg_hr_fb_rate = df['HR-A'].sum() / (df['HR-A'].sum() + df['FO'].sum())

        xfip = f_constant + ((13 * ((df['FO'] + df['HR-A']) * lg_hr_fb_rate) +
                              3 * (df['BB'] + df['HB']) - 2 * df['SO']) / df['IP'])

        return pd.DataFrame({'FIP': fip, 'xFIP': xfip})

    def compute_pitching_war(self, df, pbp_df, bat_war_total):
        if df.empty:
            return df

        gmli = (pbp_df[pbp_df['description'].str.contains('to p for', na=False)]
                .groupby(['pitcher_id'])
                .agg({'li': 'mean'})
                .reset_index()
                .rename(columns={'li': 'gmLI', 'pitch_team': 'Team'}))

        df = df.merge(gmli, how='left',
                      left_on=['player_id'],
                      right_on=['pitcher_id'])
        df['gmLI'] = df['gmLI'].fillna(0.0)

        valid_ip_mask = df['IP'] > 0

        def calculate_if_fip_constant(group_df):
            group_df = group_df[group_df['IP'] > 0]
            if len(group_df) == 0:
                return np.nan

            lg_ip = group_df['IP'].sum()
            lg_hr = group_df['HR-A'].sum()
            lg_bb = group_df['BB'].sum()
            lg_hbp = group_df['HB'].sum()
            lg_k = group_df['SO'].sum()
            lg_era = (group_df['ER'].sum() / lg_ip) * 9

            numerator = ((13 * lg_hr) + (3 * (lg_bb + lg_hbp)) - (2 * lg_k))
            return lg_era - (numerator / lg_ip)

        def calculate_player_if_fip(row, constant):
            if row['IP'] == 0:
                return np.nan
            numerator = ((13 * row['HR-A']) + (3 *
                         (row['BB'] + row['HB'])) - (2 * row['SO']))
            return (numerator / row['IP']) + constant

        if_fip_constants = df[valid_ip_mask].groupby('conference').apply(
            calculate_if_fip_constant).reset_index()
        if_fip_constants.columns = ['conference', 'if_fip_constant']
        df = df.merge(if_fip_constants, on='conference', how='left')

        df['ifFIP'] = df.apply(lambda row: calculate_player_if_fip(
            row, row['if_fip_constant']), axis=1)

        valid_df = df[valid_ip_mask]
        if len(valid_df) > 0:
            lgRA9 = (valid_df['R'].sum() / valid_df['IP'].sum()) * 9
            lgERA = (valid_df['ER'].sum() / valid_df['IP'].sum()) * 9
            adjustment = lgRA9 - lgERA
        else:
            adjustment = 0

        df['FIPR9'] = np.where(valid_ip_mask, df['ifFIP'] + adjustment, np.nan)
        df['PF'] = df['PF'].fillna(100)
        df['pFIPR9'] = np.where(
            valid_ip_mask, df['FIPR9'] / (df['PF'] / 100), np.nan)

        def calculate_league_adjustments(group_df):
            valid_group = group_df[group_df['IP'] > 0]
            if len(valid_group) == 0:
                return np.nan

            lg_ip = valid_group['IP'].sum()
            lg_hr = valid_group['HR-A'].sum()
            lg_bb = valid_group['BB'].sum()
            lg_hbp = valid_group['HB'].sum()
            lg_k = valid_group['SO'].sum()

            lg_ifFIP = ((13 * lg_hr) + (3 * (lg_bb + lg_hbp)) -
                        (2 * lg_k)) / lg_ip + valid_group['if_fip_constant'].iloc[0]

            lgRA9 = (valid_group['R'].sum() / lg_ip) * 9
            lgERA = (valid_group['ER'].sum() / lg_ip) * 9
            adjustment = lgRA9 - lgERA

            return lg_ifFIP + adjustment

        league_adjustments = df[valid_ip_mask].groupby('conference').apply(
            calculate_league_adjustments).reset_index()
        league_adjustments.columns = ['conference', 'conf_fipr9']
        df = df.merge(league_adjustments, on='conference', how='left')

        # Calculate remaining stats only for valid IP
        df['RAAP9'] = np.where(
            valid_ip_mask, df['conf_fipr9'] - df['pFIPR9'], 0)
        df['IP/G'] = np.where(df['App'] > 0, df['IP'] / df['App'], 0)
        df['dRPW'] = np.where(valid_ip_mask,
                              (((18 - df['IP/G']) * df['conf_fipr9'] +
                               df['IP/G'] * df['pFIPR9']) / 18 + 2) * 1.5,
                              0)

        # Set WAR components to 0 for pitchers with no IP
        df['WPGAA'] = np.where(valid_ip_mask, df['RAAP9'] / df['dRPW'], 0)
        df['gs/g'] = np.where(df['App'] > 0, df['GS'] / df['App'], 0)
        df['replacement_level'] = (
            0.03 * (1 - df['gs/g'])) + (0.12 * df['gs/g'])
        df['WPGAR'] = np.where(
            valid_ip_mask, df['WPGAA'] + df['replacement_level'], 0)
        df['WAR'] = np.where(valid_ip_mask, df['WPGAR'] * (df['IP'] / 9), 0)

        # Apply relief pitcher adjustment
        relief_mask = df['GS'] < 3
        df.loc[relief_mask & valid_ip_mask,
               'WAR'] *= (1 + df.loc[relief_mask & valid_ip_mask, 'gmLI']) / 2

        total_pitching_war = df['WAR'].sum()
        target_pitching_war = (bat_war_total * 0.43) / 0.57  # 43% of total WAR
        war_adjustment = (target_pitching_war - total_pitching_war) / \
            df.loc[valid_ip_mask, 'IP'].sum()

        df.loc[valid_ip_mask, 'WAR'] += war_adjustment * \
            df.loc[valid_ip_mask, 'IP']

        return df

    def calculate_wgdp(self, pbp_df):
        gdp_opps = pbp_df[(pbp_df['r1_name'] != '') & (
            pbp_df['outs_before'].astype(int) < 2)].copy()

        gdp_events = gdp_opps[gdp_opps['description'].str.contains('double play',
                                                                   case=False,
                                                                   na=False)]

        gdp_stats = pd.DataFrame({
            'GDPOpps': gdp_opps.groupby('batter_standardized').size(),
            'GDP': gdp_events.groupby('batter_standardized').size()
        }).fillna(0)

        lg_gdp_rate = gdp_stats['GDP'].sum() / gdp_stats['GDPOpps'].sum()

        gdp_stats['wGDP'] = (
            (gdp_stats['GDPOpps'] * lg_gdp_rate - gdp_stats['GDP']) *
            self.gdp_run_value
        )

        return gdp_stats

    def calculate_extra_bases(self, df, roster, weights):
        extra_bases = {}
        opportunities = {}
        outs_on_bases = {}

        batting_lookup = {
            team: group.set_index('player_name')['player_id'].to_dict()
            for team, group in roster.groupby('team_name')
        }

        # Handle singles
        singles = df[df['event_cd'] == 20].copy()
        next_plays = singles.shift(-1)

        for idx, play in singles.iterrows():
            next_play = next_plays.loc[idx]
            team_dict = batting_lookup.get(play.bat_team, {})

            # Check first to third on single
            if pd.notna(play.r1_name) and team_dict:
                try:
                    matches = process.extractOne(
                        play.r1_name,
                        list(team_dict.keys()),
                        scorer=fuzz.token_sort_ratio,
                        score_cutoff=50
                    )
                    if matches:
                        standardized_r1 = matches[0]
                        # Count opportunity when runner starts on first
                        opportunities[standardized_r1] = opportunities.get(
                            standardized_r1, 0) + 1

                        if play.outs_on_play > 0 and play.r1_name not in [next_play.r1_name, next_play.r2_name, next_play.r3_name]:
                            # Runner was out on bases
                            outs_on_bases[standardized_r1] = outs_on_bases.get(
                                standardized_r1, 0) + 1
                        elif play.r1_name == next_play.r3_name:
                            # Runner advanced to third
                            extra_bases[standardized_r1] = extra_bases.get(
                                standardized_r1, 0) + 1
                except Exception:
                    pass

            # Check second to home on single
            if pd.notna(play.r2_name) and team_dict:
                try:
                    matches = process.extractOne(
                        play.r2_name,
                        list(team_dict.keys()),
                        scorer=fuzz.token_sort_ratio,
                        score_cutoff=50
                    )
                    if matches:
                        standardized_r2 = matches[0]
                        # Count opportunity when runner starts on second
                        opportunities[standardized_r2] = opportunities.get(
                            standardized_r2, 0) + 1

                        if play.outs_on_play > 0 and play.r2_name not in [next_play.r1_name, next_play.r2_name, next_play.r3_name]:
                            # Runner was out on bases
                            outs_on_bases[standardized_r2] = outs_on_bases.get(
                                standardized_r2, 0) + 1
                        elif (play.r2_name not in [next_play.r1_name, next_play.r2_name, next_play.r3_name] and
                              play.runs_on_play > 0):
                            # Runner scored
                            extra_bases[standardized_r2] = extra_bases.get(
                                standardized_r2, 0) + 1
                except Exception:
                    pass

        # Handle doubles
        doubles = df[df['event_cd'] == 21].copy()
        next_plays = doubles.shift(-1)

        for idx, play in doubles.iterrows():
            next_play = next_plays.loc[idx]
            team_dict = batting_lookup.get(play.bat_team, {})

            # Check first to home on double
            if pd.notna(play.r1_name) and team_dict:
                try:
                    matches = process.extractOne(
                        play.r1_name,
                        list(team_dict.keys()),
                        scorer=fuzz.token_sort_ratio,
                        score_cutoff=50
                    )
                    if matches:
                        standardized_r1 = matches[0]
                        # Count opportunity when runner starts on first
                        opportunities[standardized_r1] = opportunities.get(
                            standardized_r1, 0) + 1

                        if play.outs_on_play > 0 and play.r1_name not in [next_play.r1_name, next_play.r2_name, next_play.r3_name]:
                            # Runner was out on bases
                            outs_on_bases[standardized_r1] = outs_on_bases.get(
                                standardized_r1, 0) + 1
                        elif (play.r1_name not in [next_play.r1_name, next_play.r2_name, next_play.r3_name] and
                              play.runs_on_play > 0):
                            # Runner scored
                            extra_bases[standardized_r1] = extra_bases.get(
                                standardized_r1, 0) + 1
                except Exception:
                    pass

        results = pd.DataFrame({
            'EBT': pd.Series(extra_bases),
            'OutsOB': pd.Series(outs_on_bases),
            'Opportunities': pd.Series(opportunities)
        }).fillna(0)

        # Calculate Success Rate
        results['Success_Rate'] = (
            results['EBT'] / results['Opportunities']).round(3)

        # Calculate league average rates
        lg_teb_rate = results['EBT'].sum(
        ) / results['Opportunities'].sum()
        lg_out_rate = results['OutsOB'].sum() / \
            results['Opportunities'].sum()

        # Calculate weighted value
        run_extra_base = 0.3
        runs_per_out = weights['runsOut']
        run_out = -1 * (2 * runs_per_out + 0.075)

        results['wTEB'] = (
            (results['EBT'] * run_extra_base) +
            (results['OutsOB'] * run_out) -
            (results['Opportunities'] * (lg_teb_rate *
             run_extra_base + lg_out_rate * run_out))
        )

        return results.sort_values('EBT', ascending=False)

    def process_batting_stats(self, df, weights_df, runs_df, pbp_df, roster, division):
        if df.empty:
            return df

        df = df.copy()
        df['Pos'] = df['Pos'].apply(lambda x: '' if pd.isna(
            x) else str(x).split('/')[0].upper())

        gdp_stats = self.calculate_wgdp(pbp_df)
        teb_stats = self.calculate_extra_bases(pbp_df, roster, weights_df)

        df = df.merge(
            gdp_stats,
            left_on='player_name',
            right_index=True,
            how='left'
        )

        df = df.merge(
            teb_stats,
            left_on='player_name',
            right_index=True,
            how='left'
        )

        df[['wGDP', 'GDPOpps', 'GDP']] = df[[
            'wGDP', 'GDPOpps', 'GDP']].fillna(0)

        fill_cols = ['HR', 'R', 'GP', 'GS', '2B', '3B', 'H', 'CS', 'BB', 'K',
                     'SB', 'IBB', 'RBI', 'Picked', 'SH', 'AB', 'HBP', 'SF']
        df[fill_cols] = df[fill_cols].fillna(0)

        df['GP'] = pd.to_numeric(
            df['GP'], errors='coerce').fillna(0).astype(int)
        df['GS'] = pd.to_numeric(
            df['GS'], errors='coerce').fillna(0).astype(int)
        df = df[df['AB'] > 0]

        df['iPF'] = df['team_name'].map(runs_df.set_index('team_name')['iPF'])
        df['PF'] = ((1 - (1 - df.iPF) * .6) * 100).fillna(100)
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

        return self._compute_batting_war(df, weights_df, division=division)

    def _compute_batting_war(self, df, weights, division=3):
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
        df['baserunning'] = df['wSB'] + df['wGDP'] + df['wTEB']

        base_adjustments = df['Pos'].map(self.position_adjustments).fillna(0)
        division_scaling = np.where(division == 1, 1, 1.3)
        scaled_adjustments = base_adjustments * division_scaling
        df['Adjustment'] = scaled_adjustments * (df['GP'] / games_played)

        conf_adjustments = {}
        for conf in df['conference'].unique():
            conf_df = df[df['conference'] == conf]
            if len(conf_df) > 0:
                lg_batting = conf_df['batting_runs'].sum()
                lg_baserunning = conf_df['wSB'].sum()
                lg_positional = conf_df['Adjustment'].sum()
                lg_pa = conf_df['PA'].sum()
                if lg_pa > 0:
                    conf_adjustments[conf] = (-1 * (lg_batting + lg_baserunning +
                                                    lg_positional) / lg_pa)

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
        pitching, batting, pbp, rosters = [], [], [], []

        try:
            for division in range(1, 4):
                for year in [2021, 2022, 2023, 2024]:
                    pitching_df = pd.read_csv(
                        f'../data/stats/d{division}_pitching_{year}.csv')
                    pitching.append(pitching_df)

                    batting_df = pd.read_csv(
                        f'../data/stats/d{division}_batting_{year}.csv')
                    batting.append(batting_df)

                    roster_df = pd.read_sql(
                        f"SELECT * FROM rosters", conn).query(f'Year == {year}').query(f'Division == {division}')
                    rosters.append(roster_df)

                    pbp_df = pd.read_csv(
                        f'{self.data_dir}/play_by_play/d{division}_parsed_pbp_new_{year}.csv')
                    pbp.append(pbp_df)

                park_factors = pd.read_csv(
                    f'{self.data_dir}/park_factors/d{division}_park_factors.csv')
                guts = pd.read_csv(f'{self.data_dir}/guts/guts_constants.csv')
            return batting, pitching, pbp, guts, park_factors, rosters
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
        df['PF'] = ((1 - (1 - df.iPF) * .6) * 100).fillna(100)
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

        lg_era = (df['ER'].sum() * 9) / df['IP'].sum()
        fip_components = ((13 * df['HR-A'].sum() + 3 * (df['BB'].sum() + df['HB'].sum()) -
                           2 * df['SO'].sum()) / df['IP'].sum())
        f_constant = lg_era - fip_components
        fip = f_constant + ((13 * df['HR-A'] + 3 * (df['BB'] + df['HB']) -
                            2 * df['SO']) / df['IP'])
        lg_hr_fb_rate = df['HR-A'].sum() / (df['HR-A'].sum() + df['FO'].sum())
        xfip = f_constant + ((13 * ((df['FO'] + df['HR-A']) * lg_hr_fb_rate) +
                              3 * (df['BB'] + df['HB']) - 2 * df['SO']) / df['IP'])
        df['FIP'] = fip
        df['xFIP'] = xfip

        df['iPF'] = df['Team'].map(
            self.park_factors.set_index('team_name')['iPF'])
        df['PF'] = ((1 - (1 - df.iPF) * .6) * 100).fillna(100)

        df['ERA+'] = 100 * \
            (2 - (df.ERA / ((df.ER.sum() / df.IP.sum()) * 9)) * (1 / (df.PF / 100)))

        return df

    def get_clutch_stats(self, pbp_df):
        player_stats = pbp_df.groupby(['player_id']).agg({
            'rea': 'sum',
            'wpa': 'sum',
            'wpa/li': 'sum',
            'li': 'mean'
        }).reset_index().sort_values('wpa/li', ascending=False).reset_index(drop=True)

        player_stats = player_stats.rename(
            columns={'wpa': 'WPA', 'wpa/li': 'WPA/LI', 'rea': 'REA'})

        player_stats['Clutch'] = np.where(
            player_stats['li'] == 0,
            np.nan,
            (player_stats['WPA'] / player_stats['li']) - player_stats['WPA/LI']
        )

        team_stats = pbp_df.groupby('bat_team').agg({
            'rea': 'sum',
            'wpa': 'sum',
            'wpa/li': 'sum',
            'li': 'mean'
        }).reset_index().sort_values('wpa/li', ascending=False).reset_index(drop=True)

        team_stats = team_stats.rename(
            columns={'wpa': 'WPA', 'wpa/li': 'WPA/LI', 'rea': 'REA'})

        team_stats['Clutch'] = np.where(
            team_stats['li'] == 0,
            np.nan,
            (team_stats['WPA'] / team_stats['li']) - team_stats['WPA/LI']
        )

        return player_stats, team_stats

    def get_pitcher_clutch_stats(self, pbp_df):
        pbp_df['pREA'] = (-pbp_df['run_expectancy_delta'] -
                          pbp_df['runs_on_play'])
        pbp_df['pWPA'] = np.where(pbp_df['pitch_team'] == pbp_df['home_team'],
                                  pbp_df['delta_home_win_exp'],
                                  -pbp_df['delta_home_win_exp'])
        pbp_df['pWPA/LI'] = pbp_df['pWPA'].div(
            pbp_df['li'].replace(0, float('nan')))

        pitcher_stats = pbp_df.groupby(['pitcher_id']).agg({
            'pREA': 'sum',
            'pWPA': 'sum',
            'pWPA/LI': 'sum',
            'li': 'mean',
            'pitcher_standardized': 'first',
        }).reset_index().sort_values('pWPA/LI', ascending=False).reset_index(drop=True)

        pitcher_stats = pitcher_stats[pitcher_stats['pitcher_standardized'] != "Starter"]

        pitcher_stats['Clutch'] = np.where(
            pitcher_stats['li'] == 0,
            np.nan,
            (pitcher_stats['pWPA'] / pitcher_stats['li']) -
            pitcher_stats['pWPA/LI']
        )

        team_stats = pbp_df.groupby(['pitch_team']).agg({
            'pREA': 'sum',
            'pWPA': 'sum',
            'pWPA/LI': 'sum',
            'li': 'mean'
        }).reset_index().sort_values('pWPA/LI', ascending=False).reset_index(drop=True)

        team_stats['Clutch'] = np.where(
            team_stats['li'] == 0,
            np.nan,
            (team_stats['pWPA'] / team_stats['li']) -
            team_stats['pWPA/LI']
        )

        return pitcher_stats, team_stats

    def process_and_save_stats(self, start_year=2021, end_year=2024):
        conn = self.get_connection()
        try:
            batting, pitching, pbp, self.guts, self.park_factors, rosters = self.get_data()
            self.guts = self.guts.reset_index(drop=True)

            # Initialize lists to store all DataFrames
            all_batting_war = []
            all_pitching_war = []
            all_batting_team_war = []
            all_pitching_team_war = []

            data_index = 0
            for division in [1, 2, 3]:
                for year in range(start_year, end_year + 1):
                    print(f"Processing Division {division}, Year {year}")

                    current_index = data_index + (year - start_year)

                    if current_index >= len(batting):
                        continue

                    div_guts = self.guts.query(f'Division == {division}')
                    year_guts = div_guts[div_guts['Year'] == year]
                    if len(year_guts) == 0:
                        continue
                    year_guts = year_guts.iloc[0]

                    # Process batting stats
                    bat_war = self.process_batting_stats(
                        batting[current_index],
                        year_guts,
                        self.park_factors,
                        pbp[current_index],
                        rosters[current_index],
                        division
                    )
                    batting_war_total = bat_war.WAR.sum()

                    bat_war = bat_war.rename(columns={
                        'player_name': 'Player',
                        'team_name': 'Team',
                        'SH': 'Sac',
                        'batting_runs': 'Batting',
                        'baserunning': 'Baserunning',
                        'conference': 'Conference'
                    })

                    player_stats, team_stats = self.get_clutch_stats(
                        pbp[current_index])
                    bat_war = bat_war.merge(
                        player_stats,
                        left_on=['player_id'],
                        right_on=['player_id'],
                        how='left'
                    )

                    bat_war['Season'] = year
                    bat_war['Division'] = division

                    bat_war[['Player', 'Team', 'Conference', 'Yr']] = bat_war[
                        ['Player', 'Team', 'Conference', 'Yr']].fillna('-')
                    bat_war = bat_war.fillna(0)

                    bat_war = bat_war[self.batting_columns]

                    bat_war.to_csv(
                        f'C:/Users/kellyjc/Desktop/d3_pipeline/data/war/d{division}_batting_war_{year}.csv', index=False)

                    # Add to combined list
                    all_batting_war.append(bat_war)

                    # Process batting team stats
                    bat_team_war = self.create_batting_team_war_table(
                        bat_war, year)
                    bat_team_war = bat_team_war.merge(
                        team_stats,
                        left_on='Team',
                        right_on='bat_team',
                        how='left'
                    )
                    bat_team_war['Division'] = division
                    bat_team_war['Season'] = year

                    bat_team_war.to_csv(
                        f'C:/Users/kellyjc/Desktop/d3_pipeline/data/war/d{division}_batting_team_war_{year}.csv', index=False)

                    # Add to combined list
                    all_batting_team_war.append(bat_team_war)

                    # Process pitching stats if available
                    if current_index < len(pitching):
                        pitch_war = self.process_pitching_stats(
                            pitching[current_index],
                            pbp[current_index],
                            self.park_factors,
                            batting_war_total
                        )

                        if 'Team' in pitch_war.columns and 'team_name' in pitch_war.columns:
                            pitch_war = pitch_war.drop('Team', axis=1)

                        pitch_war = pitch_war.rename(columns={
                            'player_name': 'Player',
                            'conference': 'Conference',
                            'team_name': 'Team'
                        })

                        pitch_war['Season'] = year
                        pitch_war['Division'] = division

                        pitch_war[['Player', 'Team', 'Conference', 'Yr']] = pitch_war[
                            ['Player', 'Team', 'Conference', 'Yr']].fillna('-')
                        pitch_war = pitch_war.fillna(0)
                        pitch_war = pitch_war.replace({np.inf: 0, -np.inf: 0})

                        pitcher_stats, team_stats = self.get_pitcher_clutch_stats(
                            pbp[current_index])
                        pitch_war = pitch_war.merge(
                            pitcher_stats,
                            left_on=['player_id'],
                            right_on=['pitcher_id'],
                            how='left'
                        )

                        pitch_war = pitch_war[self.pitching_columns]
                        pitch_war.to_csv(
                            f'C:/Users/kellyjc/Desktop/d3_pipeline/data/war/d{division}_pitching_war_{year}.csv', index=False)
                        # Add to combined list
                        all_pitching_war.append(pitch_war)

                        pitch_team_war = self.create_pitching_team_war_table(
                            pitch_war, year)
                        pitch_team_war = pitch_team_war.merge(
                            team_stats,
                            left_on='Team',
                            right_on='pitch_team',
                            how='left'
                        )
                        pitch_team_war['Division'] = division
                        pitch_team_war['Season'] = year

                        pitch_team_war.to_csv(
                            f'C:/Users/kellyjc/Desktop/d3_pipeline/data/war/d{division}_pitching_team_war_{year}.csv', index=False)

                        # Add to combined list
                        all_pitching_team_war.append(pitch_team_war)

                data_index += (end_year - start_year + 1)

            # Combine and save all stats
            if all_batting_war:
                combined_batting = pd.concat(
                    all_batting_war, ignore_index=True)
                combined_batting.to_sql(
                    'batting_war', conn, if_exists='replace', index=False)

            if all_pitching_war:
                combined_pitching = pd.concat(
                    all_pitching_war, ignore_index=True)
                combined_pitching.to_sql(
                    'pitching_war', conn, if_exists='replace', index=False)

            if all_batting_team_war:
                combined_batting_team = pd.concat(
                    all_batting_team_war, ignore_index=True)
                combined_batting_team.to_sql(
                    'batting_team_war', conn, if_exists='replace', index=False)

            if all_pitching_team_war:
                combined_pitching_team = pd.concat(
                    all_pitching_team_war, ignore_index=True)
                combined_pitching_team.to_sql(
                    'pitching_team_war', conn, if_exists='replace', index=False)

        finally:
            conn.close()


def main():
    stats = BaseballStats()
    stats.process_and_save_stats()


if __name__ == "__main__":
    main()
