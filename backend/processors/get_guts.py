import pandas as pd
import sqlite3
from pathlib import Path
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class BaseballConfig:
    """Configuration class for baseball statistics processing"""
    database_path: str
    data_directory: Path
    years: List[int]
    division: int = 3


class BaseballStatsProcessor:
    """Class for processing and analyzing baseball statistics"""

    def __init__(self, config: BaseballConfig):
        """Initialize the processor with configuration"""
        self.config = config
        self.setup_logging()
        self.combined_data: Dict[str, pd.DataFrame] = {}

    def setup_logging(self):
        """Configure logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

    def load_csv_file(self, file_path: Path, year: int) -> Optional[pd.DataFrame]:
        """Load a CSV file and add year column"""
        try:
            df = pd.read_csv(file_path)
            df['season'] = year
            return df
        except FileNotFoundError:
            self.logger.warning(f"File not found: {file_path}")
        except pd.errors.EmptyDataError:
            self.logger.warning(f"Empty file: {file_path}")
        except Exception as e:
            self.logger.error(f"Error loading {file_path}: {e}")
        return None

    def load_sql_table(self, conn: sqlite3.Connection, table: str, year: int) -> Optional[pd.DataFrame]:
        """Load a SQL table with year column"""
        try:
            query = f"SELECT *, {year} as season FROM {table}_{year}"
            df = pd.read_sql(query, conn)
            return df
        except sqlite3.OperationalError as e:
            self.logger.warning(f"SQL error loading {table} for {year}: {e}")
        except Exception as e:
            self.logger.error(f"Error loading {table} for {year}: {e}")
        return None

    def load_data(self) -> Dict[str, pd.DataFrame]:
        """Load all data sources and combine them"""
        pbp_list, lw_list, pitching_list, batting_list = [], [], [], []

        with sqlite3.connect(self.config.database_path) as conn:
            for year in self.config.years:
                # Load CSV files
                pbp_df = self.load_csv_file(
                    self.config.data_directory / f'parsed_pbp_new_{year}.csv',
                    year
                )
                lw_df = self.load_csv_file(
                    self.config.data_directory / f'linear_weights_{year}.csv',
                    year
                )

                if pbp_df is not None:
                    pbp_list.append(pbp_df)
                if lw_df is not None:
                    lw_list.append(lw_df)

                # Load SQL tables
                pitching_df = self.load_sql_table(conn, 'pitching_war', year)
                batting_df = self.load_sql_table(conn, 'batting_war', year)

                if pitching_df is not None:
                    pitching_list.append(pitching_df)
                if batting_df is not None:
                    batting_df['1B'] = batting_df['H'] - \
                        batting_df['2B'] - batting_df['3B'] - batting_df['HR']
                    batting_list.append(batting_df)

        self.combined_data = {
            'play_by_play': pd.concat(pbp_list, ignore_index=True) if pbp_list else pd.DataFrame(),
            'linear_weights': pd.concat(lw_list, ignore_index=True) if lw_list else pd.DataFrame(),
            'pitching': pd.concat(pitching_list, ignore_index=True) if pitching_list else pd.DataFrame(),
            'batting': pd.concat(batting_list, ignore_index=True) if batting_list else pd.DataFrame()
        }

        return self.combined_data

    def calculate_woba_constants(self, linear_weights_df: pd.DataFrame, batting_df: pd.DataFrame,
                                 year: int) -> Dict[str, float]:
        """Calculate wOBA constants for a given year"""
        year_data = linear_weights_df[linear_weights_df['season'] == year].copy(
        )
        year_stats = batting_df[batting_df['season'] == year]

        try:
            woba_scale = year_data[year_data['events'] ==
                                   'wOBA scale']['normalized_weight'].iloc[0]

            events_weights = {
                'walk': 'BB',
                'hit_by_pitch': 'HBP',
                'single': '1B',
                'double': '2B',
                'triple': '3B',
                'home_run': 'HR'
            }

            weights = {f'w{stat}': year_data[year_data['events'] == event]['normalized_weight'].iloc[0]
                       for event, stat in events_weights.items()}

            woba_numerator = sum(
                year_stats[stat].sum() * weights[f'w{stat}']
                for event, stat in events_weights.items()
            )

            woba_denominator = (
                year_stats['AB'].sum() +
                year_stats['BB'].sum() +
                year_stats['HBP'].sum() +
                year_stats['SF'].sum()
            )

            wOBA = woba_numerator / woba_denominator if woba_denominator > 0 else 0

            return {
                'wOBA': round(wOBA, 3),
                'wOBAScale': woba_scale,
                **weights
            }

        except Exception as e:
            self.logger.error(
                f"Error calculating wOBA constants for {year}: {e}")
            return {}

    def calculate_fconstant(self, df: pd.DataFrame) -> float:
        """Calculate FIP constant"""
        try:
            lgERA = (df['ER'].sum() * 9) / df['IP'].sum()

            fip_components = (
                (13 * df['HR-A'].sum() + 3 * (df['BB'].sum() + df['HB'].sum()) -
                 2 * df['SO'].sum()) / df['IP'].sum()
            )

            return lgERA - fip_components
        except Exception as e:
            self.logger.error(f"Error calculating FIP constant: {e}")
            return 0.0

    def calculate_baserunning_constants(self, pbp_df: pd.DataFrame) -> Dict[str, float]:
        """Calculate baserunning constants"""
        try:
            runsOut = pbp_df['runs_on_play'].sum() / \
                pbp_df['outs_on_play'].sum()

            runSB = 0.2
            runCS = -(2 * runsOut + 0.075)

            cs_attempts = len(pbp_df[pbp_df['event_cd'] == 6])
            sb_attempts = len(pbp_df[pbp_df['event_cd'] == 4])

            csRate = cs_attempts / \
                (cs_attempts + sb_attempts) if (cs_attempts + sb_attempts) > 0 else 0

            return {
                'runSB': runSB,
                'runCS': runCS,
                'csRate': round(csRate, 3)
            }
        except Exception as e:
            self.logger.error(f"Error calculating baserunning constants: {e}")
            return {}

    def calculate_run_constants(self, pbp_df: pd.DataFrame) -> Dict[str, float]:
        """Calculate run-related constants"""
        try:
            runsPA = pbp_df['runs_on_play'].sum(
            ) / len(pbp_df[~pbp_df['bat_order'].isna()])
            runsOut = pbp_df['runs_on_play'].sum() / \
                pbp_df['outs_on_play'].sum()
            runsWin = pbp_df.groupby('game_id')['runs_on_play'].sum().mean()

            return {
                'runsPA': runsPA,
                'runsOut': runsOut,
                'runsWin': runsWin,
            }
        except Exception as e:
            self.logger.error(f"Error calculating run constants: {e}")
            return {}

    def calculate_guts_constants(self, year: int) -> Dict[str, float]:
        """Calculate all GUTS constants for a given year"""
        try:
            year_data = {
                key: df[df['season'] == year]
                for key, df in self.combined_data.items()
            }

            woba_constants = self.calculate_woba_constants(
                year_data['linear_weights'],
                year_data['batting'],
                year
            )

            baserunning_constants = self.calculate_baserunning_constants(
                year_data['play_by_play'])
            run_constants = self.calculate_run_constants(
                year_data['play_by_play'])
            cFIP = self.calculate_fconstant(year_data['pitching'])

            return {
                'Year': year,
                'Division': self.config.division,
                **woba_constants,
                **baserunning_constants,
                **run_constants,
                'cFIP': cFIP
            }
        except Exception as e:
            self.logger.error(
                f"Error calculating GUTS constants for {year}: {e}")
            return {}

    def create_guts_constants(self) -> pd.DataFrame:
        """Create GUTS constants for all configured years"""
        constants_list = []

        for year in self.config.years:
            constants = self.calculate_guts_constants(year)
            if constants:
                constants_list.append(constants)

        return pd.DataFrame(constants_list).sort_values('Year', ascending=False)


def main():
    config = BaseballConfig(
        database_path='../ncaa.db',
        data_directory=Path('../data'),
        years=[2021, 2022, 2023, 2024]
    )

    processor = BaseballStatsProcessor(config)
    processor.load_data()
    guts_constants = processor.create_guts_constants()

    # Save to database
    try:
        with sqlite3.connect(config.database_path) as conn:
            # Save to SQL database
            guts_constants.to_sql('guts_constants', conn,
                                  if_exists='replace', index=False)

            # Also save to CSV as backup
            guts_constants.to_csv(config.data_directory /
                                  'guts_constants.csv', index=False)

            print(
                f"Successfully saved {len(guts_constants)} rows to guts_constants table")
            print(
                f"Data also backed up to {config.data_directory / 'guts_constants.csv'}")

    except Exception as e:
        print(f"Error saving to database: {e}")

    return guts_constants


if __name__ == '__main__':
    guts_constants = main()
