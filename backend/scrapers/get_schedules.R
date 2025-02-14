library(baseballr)
library(collegebaseball)
library(dplyr)

get_schedules <- function(year = 2024, division = 1) {
  teams_df <- baseballr:::rds_from_url(
    "https://raw.githubusercontent.com/robert-frey/college-baseball/main/ncaa_team_lookup.rds"
  ) %>%
    dplyr::filter(year == !!year,
                  division %in% !!division) %>%
    distinct(team_name, .keep_all = TRUE)
  
  team_names <- teams_df$team_name
  team_ids <- data.frame(team_name = character(), team_id = numeric(), stringsAsFactors = FALSE)
  all_schedules <- data.frame()
  
  message(sprintf("Processing %d teams for year %d, division %d", length(team_names), year, division))
  
  for (team in team_names) {
    tryCatch({
      id_result <- ncaa_school_id_lookup(team_name = team, season = year)
      if (nrow(id_result) > 0) {
        team_ids <- rbind(team_ids, data.frame(team_name = team, team_id = id_result$team_id[1]))
        message(sprintf("Found ID for %s: %s", team, id_result$team_id[1]))
      }
    }, error = function(e) {
      message(sprintf("Error looking up ID for team %s: %s", team, e$message))
    })
  }
  
  for (id in team_ids$team_id) {
    tryCatch({
      schedule <- ncaa_schedule(team_id = id, year = year)
      if (!is.null(schedule) && nrow(schedule) > 0) {
        schedule$year <- year  # Add year column
        schedule$division <- division  # Add division column
        all_schedules <- rbind(all_schedules, schedule)
        message(sprintf("Got schedule for team ID %s with %d games", id, nrow(schedule)))
      }
    }, error = function(e) {
      message(sprintf("Error getting schedule for team ID %s: %s", id, e$message))
    })
  }
  
  return(all_schedules)
}

dir.create("C:/Users/kellyjc/Desktop/d3_pipeline/data/schedules", showWarnings = FALSE)

for (division in c(1, 2)) {
  division_schedules <- data.frame()
  
  year <- 2025
  file_path <- sprintf("C:/Users/kellyjc/Desktop/d3_pipeline/data/schedules/d%d_%d_schedules.csv", division, year)
  if (file.exists(file_path)) {
    next
  } 
  message(sprintf("Processing Division %d, Year %d", division, year))
  year_schedules <- get_schedules(year = year, division = division)
  
  if (nrow(year_schedules) > 0) {
    if ("contest_id" %in% names(year_schedules)) {
      year_schedules <- year_schedules %>% distinct(contest_id, .keep_all = TRUE)
    }
    
    write.csv(
      year_schedules,
      file_path,
      row.names = FALSE
    )
    
    division_schedules <- rbind(division_schedules, year_schedules)
    message(sprintf("Added %d games for Division %d, Year %d", 
                    nrow(year_schedules), division, year))
  } else {
    message(sprintf("No schedules found for Division %d, Year %d", division, year))
  }
}