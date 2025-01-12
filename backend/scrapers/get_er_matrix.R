library(data.table)
library(tidyverse)
library(RSQLite)

get_expected_runs_matrix <- function(base_cd, outs, runs_rest_of_inn) {
  ER <- data.table(base_cd, outs, runs_rest_of_inn)[
    !is.na(base_cd) & !is.na(outs) & !is.na(runs_rest_of_inn)
  ]
  
  ER <- ER[, .(
    ERV = mean(runs_rest_of_inn, na.rm = TRUE),
    count = .N
  ), by = .(base_cd, outs)]
  
  ER_matrix <- matrix(0, nrow = 8, ncol = 3)
  for (i in 1:nrow(ER)) {
    row <- as.numeric(ER$base_cd[i]) + 1
    col <- as.numeric(ER$outs[i]) + 1
    ER_matrix[row, col] <- ER$ERV[i]
  }
  
  rownames(ER_matrix) <- c('_ _ _', '1B _ _', '_ 2B _', '1B 2B _', '_ _ 3B', '1B _ 3B', '_ 2B 3B', '1B 2B 3B')
  colnames(ER_matrix) <- c('0', '1', '2')
  
  return(round(ER_matrix, 3))
}
calculate_college_linear_weights <- function(pbp_data, re24_matrix) {
  setDT(pbp_data)
  
  get_re <- Vectorize(function(base_cd, outs) {
    if (is.na(base_cd) || is.na(outs)) return(0)
    re24_matrix[min(max(base_cd + 1, 1), 8), min(max(outs + 1, 1), 3)]
  })
  
  pbp_data[, `:=`(
    base_cd_next = shift(base_cd_before, -1),
    outs_next = shift(outs_before, -1)
  )]
  
  pbp_data[, `:=`(
    re_start = get_re(base_cd_before, outs_before),
    re_end = get_re(base_cd_next, outs_next)
  )]
  
  pbp_data[inn_end == 1 | is.na(re_end), re_end := 0]
  pbp_data[, re24 := re_end - re_start + runs_on_play]
  
  event_mapping <- c(
    "2" = "out", "3" = "out", "6" = "out",
    "14" = "walk", "15" = "walk",
    "16" = "hit_by_pitch",
    "19" = "out",
    "8" = "out",
    "20" = "single",
    "21" = "double",
    "22" = "triple",
    "23" = "home_run"
  )
  
  linear_weights <- pbp_data[
    as.character(event_cd) %in% names(event_mapping),
    .(
      count = .N,
      total_re24 = sum(re24, na.rm = TRUE)
    ),
    by = .(events = event_mapping[as.character(event_cd)])
  ][
    , linear_weights_above_average := round(total_re24 / count, 3)
  ][
    , linear_weights_above_outs := linear_weights_above_average - 
      linear_weights_above_average[events == "out"]
  ][
    order(-linear_weights_above_average)
  ]
  
  return(as_tibble(linear_weights))
}

calculate_normalized_linear_weights <- function(linear_weights, stats) {
  required_columns <- c("events", "linear_weights_above_outs", "count")
  if (!all(required_columns %in% names(linear_weights))) {
    stop("linear_weights must contain columns: events, linear_weights_above_outs, and count")
  }
  
  if ("wOBA scale" %in% linear_weights$events) {
    linear_weights <- linear_weights[linear_weights$events != "wOBA scale", ]
  }
  
  stats[is.na(stats)] <- 0
  league_obp <- (sum(stats$H) + sum(stats$BB) + sum(stats$HBP)) / 
    (sum(stats$AB) + sum(stats$BB) + sum(stats$HBP) + sum(stats$SF))
  
  runs_per_pa <- sum(linear_weights$linear_weights_above_outs * linear_weights$count) / 
    sum(linear_weights$count)
  
  woba_scale <- league_obp / runs_per_pa
  
  normalized_weights <- linear_weights %>%
    mutate(
      normalized_weight = linear_weights_above_outs * woba_scale,
      normalized_weight = round(normalized_weight, 3)
    )

  woba_scale_row <- tibble(
    events = "wOBA scale",
    linear_weights_above_outs = NA,
    count = NA,
    normalized_weight = round(woba_scale, 3)
  )
  
  result <- bind_rows(normalized_weights, woba_scale_row)
  
  return(result)
}

for (division in c(1, 2)) {
  for (year in 2021:2024) {
    file_path <- sprintf("C:/Users/kellyjc/Desktop/d3_app_improved/backend/data/play_by_play/d%d_parsed_pbp_%d.csv", division, year)
    message(sprintf("Processing Division %d, Year %d", division, year))
    
    pbp_data <- fread(file_path)
    
    er_matrix <- get_expected_runs_matrix(
      pbp_data$base_cd_before,
      pbp_data$outs_before,
      pbp_data$runs_roi
    )
    linear_weights <- calculate_college_linear_weights(pbp_data, er_matrix)
    
    con <- dbConnect(SQLite(), "C:/Users/kellyjc/Desktop/d3_app_improved/backend/ncaa.db")
    stats <- dbReadTable(con, sprintf("d%d_batting_%d", division, year))
    dbDisconnect(con)
    
    linear_weights <- calculate_normalized_linear_weights(linear_weights, stats)
    lw_fp <- sprintf('C:/Users/kellyjc/Desktop/d3_app_improved/backend/data/miscellaneous/d%d_linear_weights_%d.csv', division, year)
    er_fp <- sprintf('C:/Users/kellyjc/Desktop/d3_app_improved/backend/data/miscellaneous/d%d_er_matrix_%d.csv', division, year)
    
    write.csv(linear_weights, lw_fp)
    write.csv(er_matrix, er_fp)
    
    message(sprintf("Saved data for %d in year %d", division, year))
  }
  dbDisconnect(con)
}