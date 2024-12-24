import React from "react";
import { BaseballTable } from "../tables/BaseballTable";
import { roundTo } from "../../utils/mathUtils";

const GameLog = ({ plays, homeTeam, awayTeam }) => {
  const columns = [
    {
      name: "Inning",
      selector: (row) => `${row.top_inning} ${row.inning}`,
      sortable: true,
      width: "7.5%",
      cell: (row) => (
        <div className="text-gray-600">{`${row.top_inning} ${row.inning}`}</div>
      ),
    },
    {
      name: "Pitcher",
      selector: (row) =>
        `${row.pitcher_standardized ? row.pitcher_standardized : "Starter"}`,
      sortable: true,
      width: "10%",
      cell: (row) => (
        <div className="text-gray-600">{`${
          row.pitcher_standardized ? row.pitcher_standardized : "Starter"
        }`}</div>
      ),
    },
    {
      name: "Player",
      selector: (row) =>
        `${row.player_standardized ? row.player_standardized : ""}`,
      sortable: true,
      width: "10%",
      cell: (row) => (
        <div className="text-gray-600">{`${
          row.player_standardized ? row.player_standardized : ""
        }`}</div>
      ),
    },
    {
      name: "Play",
      selector: (row) => row.description,
      sortable: false,
      width: "22.5%",
      cell: (row) => (
        <div className="text-gray-900 font-medium">{row.description}</div>
      ),
    },
    {
      name: "Score",
      selector: (row) => `${row.away_score_after}-${row.home_score_after}`,
      sortable: false,
      width: "10%",
      cell: (row) => (
        <div className="text-center text-gray-600">
          {`${row.away_score_after}-${row.home_score_after}`}
        </div>
      ),
    },
    {
      name: "Win Prob",
      selector: (row) => row.home_win_exp_after,
      sortable: true,
      width: "10%",
      cell: (row) => {
        const homeWinProb = row.home_win_exp_after * 100;
        const probability = homeWinProb;
        const leadingTeam = probability >= 50 ? homeTeam : awayTeam;
        const shownProb =
          leadingTeam == homeTeam ? probability : 100 - probability;
        return (
          <div className={`text-center`}>
            {`${leadingTeam}: ${roundTo(shownProb, 0)}%`}
          </div>
        );
      },
    },
    {
      name: "Delta Win Prob",
      selector: (row) => `${roundTo(row.WPA, 2)}`,
      sortable: false,
      width: "12.5%",
      cell: (row) => (
        <div className="text-center text-gray-600">{`${roundTo(
          row.WPA,
          2
        )}`}</div>
      ),
    },
    {
      name: "Delta Run Exp",
      selector: (row) => `${roundTo(row.run_expectancy_delta, 2)}`,
      sortable: false,
      width: "12.5%",
      cell: (row) => (
        <div className="text-center text-gray-600">{`${roundTo(
          row.run_expectancy_delta,
          2
        )}`}</div>
      ),
    },
    {
      name: "LI",
      selector: (row) => `${roundTo(row.li, 1)}`,
      sortable: false,
      width: "5%",
      cell: (row) => (
        <div className="text-center text-gray-600">{`${roundTo(
          row.li,
          1
        )}`}</div>
      ),
    },
  ];

  return (
    <BaseballTable
      data={plays}
      columns={columns}
      filename="game_log.csv"
      noDataComponent={
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No plays recorded yet</p>
        </div>
      }
    />
  );
};

export default GameLog;
