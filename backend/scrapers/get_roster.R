library(dplyr)
library(purrr)
library(collegebaseball)
library(DBI)
library(RSQLite)

ncaa_roster <- function(team_id = NULL, year, ...){
  if (is.null(team_id)) {
    cli::cli_abort("Enter valid team_id")
  }
  if (is.null(year)) {
    cli::cli_abort("Enter valid year between 2010-2025 as a number (YYYY)")
  }
  
  url <- paste0("https://stats.ncaa.org/teams/", team_id, "/roster")
  payload <- xml2::read_html(url)
  data_read <- payload
  payload1 <- (data_read |>
                 rvest::html_elements("table"))[[1]] |>
    rvest::html_elements("tr")
  table <- (data_read |>
              rvest::html_elements("table"))[[1]] |>
    rvest::html_table(trim=T)
  roster <- table
  
  extractor <- function(x){
    data.frame(url_slug = ifelse(
      is.null(
        (x |>
           rvest::html_elements("td"))[4] |>
          rvest::html_element("a")),
      NA_character_,
      (x |>
         rvest::html_elements("td"))[4] |>
        rvest::html_element("a")  |>
        rvest::html_attr("href")
    ))
  }
  
  url_slug <- lapply(payload1, extractor) |>
    dplyr::bind_rows() |> 
    tail(-1)
  
  roster <- table |>
    dplyr::bind_cols(url_slug)
  
  season_ids <- baseballr::load_ncaa_baseball_season_ids()
  ncaa_teams_lookup <- baseballr:::rds_from_url("https://raw.githubusercontent.com/robert-frey/college-baseball/main/ncaa_team_lookup.rds")
  school_info <- ncaa_teams_lookup |>
    dplyr::filter(.data$team_id == {{team_id}} & .data$year == {{year}}) |>
    dplyr::distinct()
  
  roster <- roster |>
    dplyr::mutate(
      season = {{year}},
      player_id = gsub(".*\\/players\\/", "", url_slug),
      player_url = ifelse(is.na(player_id), NA, paste0("https://stats.ncaa.org", url_slug))
    )
  
  # Get all possible column names
  all_columns <- c("Name", "Class", "Position", "GP", "GS", "#", 
                   "Height", "Bats", "Throws", "Hometown", "High School")
  
  # Add missing columns with NA values
  for (col in all_columns) {
    if (!col %in% names(roster)) {
      roster[[col]] <- NA
    }
  }
  
  # Select and rename columns
  roster <- roster |>
    dplyr::select(
      "player_name" = "Name",
      "class" = "Class",
      "position" = "Position",
      "games_played" = "GP",
      "games_started" = "GS",
      "number" = "#",
      "height" = "Height",
      "bats" = "Bats",
      "throws" = "Throws",
      "hometown" = "Hometown",
      "high_school" = "High School",
      "player_id",
      "player_url"
    )
  
  school_info <- school_info |>
    dplyr::slice(rep(1:n(), each = nrow(roster)))
  
  roster <- roster |>
    dplyr::bind_cols(school_info)
  
  return(roster)
}

ncaa_roster_bulk <- function(year, divisions = 3) {
  if (year < 2013) {
    stop('Year must be greater than or equal to 2013')
  }
  
  teams_lookup <- baseballr:::rds_from_url(
    "https://raw.githubusercontent.com/robert-frey/college-baseball/main/ncaa_team_lookup.rds"
  ) %>%
    dplyr::filter(year == !!year,
                  division %in% !!divisions) %>%
    distinct(team_id, .keep_all = TRUE)
  
  total_teams <- nrow(teams_lookup)
  cli::cli_alert_info(paste("Retrieving rosters for", total_teams, "teams"))
  
  safe_ncaa_roster <- purrr::safely(ncaa_roster)
  
  results <- purrr::map(
    seq_len(nrow(teams_lookup)),
    function(i) {
      team <- teams_lookup[i,]
      
      if (i %% 10 == 0) {
        cli::cli_alert_info(paste("Processing team", i, "of", total_teams))
      }
      
      result <- safe_ncaa_roster(
        team_id = team$team_id,
        year = year
      )
      
      if (!is.null(result$error)) {
        cli::cli_alert_warning(paste("Error processing team_id:", team$team_id))
        return(NULL)
      }
      
      return(result$result)
    }
  )
  
  combined_rosters <- results %>%
    purrr::compact() %>%
    dplyr::bind_rows()
  
  cli::cli_alert_success(paste("Retrieved rosters for", 
                               nrow(combined_rosters), 
                               "players across",
                               length(unique(combined_rosters$team_id)),
                               "teams"))
  
  return(combined_rosters)
}

main <- function() {
  year <- 2025
  setwd('C:/Users/kellyjc/Desktop/d3_pipeline/scrapers')

  for (division in 1:3) {
    cli::cli_alert_info(paste("Processing division:", division))
    
    rosters <- ncaa_roster_bulk(year = year, divisions = division)
    
    div_name <- switch(division,
                        "1" = "d1",
                        "2" = "d2",
                        "3" = "d3"
    )
    
    output_path <- paste0("C:/Users/kellyjc/Desktop/d3_pipeline/data/", 
                          div_name, "_rosters_", year, ".csv")
    write.csv(rosters, output_path, row.names = FALSE)
    cli::cli_alert_success(paste("Saved CSV:", output_path))
    
    con <- dbConnect(SQLite(), "C:/Users/kellyjc/Desktop/d3_app_improved/backend/ncaa.db")
    
    safe_dbWriteTable <- function(conn, table_name, data, overwrite = TRUE) {
      data <- data %>%
        mutate(across(where(is.character), as.character),
                across(where(is.numeric), as.numeric),
                across(where(is.integer), as.integer))
      
      dbWriteTable(conn, table_name, data, overwrite = overwrite)
      
      row_count <- dbGetQuery(conn, sprintf("SELECT COUNT(*) as count FROM %s", table_name))
      cli::cli_alert_success(sprintf("Wrote %d rows to table %s", row_count$count, table_name))
    }
    
    table_name <- paste0(div_name, "_rosters_", year)
    safe_dbWriteTable(con, table_name, rosters)
    
    dbDisconnect(con)
  }
}

main()