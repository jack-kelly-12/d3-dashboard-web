library(dplyr)

calculate_park_factors <- function(schedules) {
  valid_games <- schedules %>%
    filter(is.na(neutral_site)) %>%
    filter(!is.na(home_team_score) & !is.na(away_team_score)) %>%
    filter(home_team_id != 0 & away_team_id != 0)
  
  
  home_stats <- valid_games %>%
    group_by(home_team_id, home_team) %>%
    summarize(
      home_runs = sum(home_team_score),
      home_games = n(),
      .groups = 'drop'
    )
  
  away_stats <- valid_games %>%
    group_by(away_team_id, away_team) %>%
    summarize(
      away_runs = sum(away_team_score),
      away_games = n(),
      .groups = 'drop'
    )
  
  combined_stats <- merge(
    home_stats,
    away_stats,
    by.x = c("home_team_id", "home_team"),
    by.y = c("away_team_id", "away_team"),
    all = TRUE
  ) %>%
    rename(team_id = home_team_id, team_name = home_team)
  
  combined_stats[is.na(combined_stats)] <- 0

  T <- nrow(combined_stats)
  park_factors <- combined_stats %>%
    mutate(
      H = home_runs / home_games,
      R = away_runs / away_games,
      raw_PF = (H * T) / ((T - 1) * R + H),
      iPF = (raw_PF + 1) / 2
    ) %>%
    arrange(desc(iPF))
  
  return(park_factors)
}

dir.create("C:/Users/kellyjc/Desktop/d3_app_improved/backend/data/park_factors", showWarnings = FALSE)


for (division in c(1, 2)) {
  division_schedules <- data.frame()
  
  for (year in 2021:2024) {
    file_path <- sprintf("C:/Users/kellyjc/Desktop/d3_app_improved/backend/data/schedules/d%d_%d_schedules.csv", division, year)
    
    if (file.exists(file_path)) {
      year_schedule <- read.csv(file_path)
      division_schedules <- bind_rows(division_schedules, year_schedule)
    }
  }
  
  if (nrow(division_schedules) > 0) {
    park_factors <- calculate_park_factors(division_schedules)
    output_path <- sprintf("C:/Users/kellyjc/Desktop/d3_app_improved/backend/data/park_factors/d%d_park_factors.csv", division)
    write.csv(park_factors, output_path, row.names = FALSE)
    message(sprintf("Saved park factors for Division %d", division))
  } else {
    message(sprintf("No schedule data found for Division %d", division))
  }
}