-- batting
CREATE INDEX IF NOT EXISTS idx_batting_div_year_war          ON batting(division, year, war DESC);
CREATE INDEX IF NOT EXISTS idx_batting_player_year_div       ON batting(player_id, year, division);
CREATE INDEX IF NOT EXISTS idx_batting_team_year_div_war     ON batting(team_name, year, division, war DESC);
CREATE INDEX IF NOT EXISTS idx_batting_div_year_conf_pa      ON batting(division, year, conference, pa);

-- pitching
CREATE INDEX IF NOT EXISTS idx_pitching_div_year_war         ON pitching(division, year, war DESC);
CREATE INDEX IF NOT EXISTS idx_pitching_player_year_div      ON pitching(player_id, year, division);
CREATE INDEX IF NOT EXISTS idx_pitching_team_year_div_war    ON pitching(team_name, year, division, war DESC);
CREATE INDEX IF NOT EXISTS idx_pitching_div_year_conf_ip     ON pitching(division, year, conference, ip);

-- rosters (search, latest-year joins, team/org lookups, conferences)
CREATE INDEX IF NOT EXISTS idx_rosters_player_year_div       ON rosters(player_id, year, division);
CREATE INDEX IF NOT EXISTS idx_rosters_team_year_div         ON rosters(team_name, year, division);
CREATE INDEX IF NOT EXISTS idx_rosters_div_year_conf         ON rosters(division, year, conference);
CREATE INDEX IF NOT EXISTS idx_rosters_player_name_nocase    ON rosters(player_name COLLATE NOCASE);

-- pbp (games, rolling, spraychart)
CREATE INDEX IF NOT EXISTS idx_pbp_date_div                  ON pbp(date, division);
CREATE INDEX IF NOT EXISTS idx_pbp_contest_year              ON pbp(contest_id, year);
CREATE INDEX IF NOT EXISTS idx_pbp_batter_year               ON pbp(batter_id, year);
CREATE INDEX IF NOT EXISTS idx_pbp_pitcher_year              ON pbp(pitcher_id, year);

-- schedules (games by contest/year/division)
CREATE INDEX IF NOT EXISTS idx_schedules_contest_year_div    ON schedules(contest_id, year, division);

-- expected runs, park factors
CREATE INDEX IF NOT EXISTS idx_expected_runs_div_year        ON expected_runs(division, year);
CREATE INDEX IF NOT EXISTS idx_park_factors_div              ON park_factors(division);

-- splits (leaderboards)
CREATE INDEX IF NOT EXISTS idx_splits_batting_div_year_pa    ON splits_batting(division, year, pa_overall);
CREATE INDEX IF NOT EXISTS idx_splits_batting_player_year_div ON splits_batting(player_id, year, division);
CREATE INDEX IF NOT EXISTS idx_splits_pitching_div_year_pa   ON splits_pitching(division, year, pa_overall);
CREATE INDEX IF NOT EXISTS idx_splits_pitching_player_year_div ON splits_pitching(player_id, year, division);

-- situational (leaderboards)
CREATE INDEX IF NOT EXISTS idx_situational_bat_div_year_pa   ON situational_batting(division, year, pa_overall);
CREATE INDEX IF NOT EXISTS idx_situational_bat_player_year_div ON situational_batting(player_id, year, division);
CREATE INDEX IF NOT EXISTS idx_situational_pit_div_year_pa   ON situational_pitching(division, year, pa_overall);
CREATE INDEX IF NOT EXISTS idx_situational_pit_player_year_div ON situational_pitching(player_id, year, division);

-- batted ball (leaderboards)
CREATE INDEX IF NOT EXISTS idx_batted_ball_div_year_cnt      ON batted_ball(division, year, count);
CREATE INDEX IF NOT EXISTS idx_batted_ball_player_year_div   ON batted_ball(player_id, year, division);

-- rolling tables (leaderboards)
CREATE INDEX IF NOT EXISTS idx_rolling_batting_player        ON rolling_batting(player_id);
CREATE INDEX IF NOT EXISTS idx_rolling_pitching_player       ON rolling_pitching(player_id);

ANALYZE;
PRAGMA optimize;