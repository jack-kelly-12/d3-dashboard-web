import React, { useState, useEffect } from "react";
import { BaseballTable } from "../tables/BaseballTable";
import { roundTo } from "../../utils/mathUtils";

const GameLog = ({ plays, homeTeam, awayTeam }) => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  // Track window size for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  // Determine which sizes to use based on screen size
  const isMobile = windowWidth < 640;

  // All columns shown at all screen sizes
  const columns = [
    {
      name: "Inning",
      selector: (row) => `${row.top_inning} ${row.inning}`,
      sortable: true,
      width: isMobile ? "4rem" : "6rem",
      cell: (row) => (
        <div className="text-gray-600 whitespace-nowrap">{`${row.top_inning} ${row.inning}`}</div>
      ),
    },
    {
      name: "Play",
      selector: (row) => row.description,
      sortable: false,
      width: isMobile ? "8rem" : "16rem",
      cell: (row) => (
        <div className="text-gray-900 font-medium break-words">
          {row.description}
        </div>
      ),
    },
    {
      name: "Score",
      selector: (row) => `${row.away_score_after}-${row.home_score_after}`,
      sortable: false,
      width: "4rem",
      cell: (row) => (
        <div className="text-center text-gray-600">
          {`${row.away_score_after}-${row.home_score_after}`}
        </div>
      ),
    },
    {
      name: "Win %",
      selector: (row) => row.home_win_exp_after,
      sortable: true,
      width: "7rem",
      cell: (row) => {
        const homeWinProb = row.home_win_exp_after * 100;
        const probability = homeWinProb;
        const leadingTeam = probability >= 50 ? homeTeam : awayTeam;
        const teamAbbr =
          isMobile && leadingTeam.length > 3
            ? leadingTeam.substring(0, 3)
            : leadingTeam;
        const shownProb =
          leadingTeam === homeTeam ? probability : 100 - probability;
        return (
          <div
            className={`text-center ${
              probability >= 70 || probability <= 30 ? "font-semibold" : ""
            }`}
          >
            {`${teamAbbr}: ${roundTo(shownProb, 0)}%`}
          </div>
        );
      },
    },
    {
      name: "Players",
      selector: (row) => `${row.batter_name || ""} / ${row.pitcher_name || ""}`,
      sortable: false,
      width: "10rem",
      grow: true,
      cell: (row) => (
        <div className="text-gray-600 truncate">
          <div className="flex items-start gap-1">
            <span className="font-medium text-xs">B:</span>
            <span className="truncate">{row.batter_name || "N/A"}</span>
          </div>
          <div className="flex items-start gap-1">
            <span className="font-medium text-xs">P:</span>
            <span className="truncate">{row.pitcher_name || "N/A"}</span>
          </div>
        </div>
      ),
    },
    {
      name: "Δ Win",
      selector: (row) => row.wpa,
      sortable: true,
      width: "5rem",
      cell: (row) => {
        const wpa = roundTo(row.wpa, 2);
        return (
          <div
            className={`text-center ${
              wpa > 0.1
                ? "text-green-600 font-medium"
                : wpa < -0.1
                ? "text-red-600 font-medium"
                : "text-gray-600"
            }`}
          >
            {wpa > 0 ? "+" : ""}
            {wpa}
          </div>
        );
      },
    },
    {
      name: "Δ Run",
      selector: (row) => row.run_expectancy_delta,
      sortable: true,
      width: "5rem",
      cell: (row) => {
        const rea = roundTo(row.run_expectancy_delta, 2);
        return (
          <div
            className={`text-center ${
              rea > 0.5
                ? "text-green-600 font-medium"
                : rea < -0.5
                ? "text-red-600 font-medium"
                : "text-gray-600"
            }`}
          >
            {rea > 0 ? "+" : ""}
            {rea}
          </div>
        );
      },
    },
    {
      name: "LI",
      selector: (row) => row.li,
      sortable: true,
      width: "4rem",
      cell: (row) => {
        const li = roundTo(row.li, 1);
        return (
          <div
            className={`text-center ${
              li > 2.5
                ? "text-orange-600 font-semibold"
                : li > 1
                ? "text-orange-500"
                : "text-gray-600"
            }`}
          >
            {li}
          </div>
        );
      },
    },
  ];

  // For expandable rows on smaller screens, show more details
  const expandableRowsComponent = ({ data }) => {
    return (
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col col-span-2">
            <span className="text-xs text-gray-500">Play Detail</span>
            <span className="text-sm font-medium">{data.description}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Win Probability</span>
            <span className="text-sm font-medium">
              {`${roundTo(data.home_win_exp_after * 100, 1)}% ${homeTeam}`}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-500">wOBA</span>
            <span className="text-sm font-medium">{roundTo(data.woba, 3)}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Win Prob Δ</span>
            <span className="text-sm font-medium">{roundTo(data.wpa, 3)}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Run Exp Δ</span>
            <span className="text-sm font-medium">
              {roundTo(data.run_expectancy_delta, 3)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full overflow-hidden">
      <BaseballTable
        data={plays}
        columns={columns}
        filename="game_log.csv"
        noDataComponent={
          <div className="text-center py-6 sm:py-8 md:py-12">
            <p className="text-gray-500 text-base sm:text-lg">
              No plays recorded yet
            </p>
          </div>
        }
        expandableRows={isMobile}
        expandableRowsComponent={expandableRowsComponent}
        expandOnRowClicked={isMobile}
        pagination
        paginationPerPage={10}
        paginationRowsPerPageOptions={[10, 25, 50]}
        responsive
        highlightOnHover
        pointerOnHover
        className="overflow-x-auto"
        defaultSortFieldId={1}
      />
    </div>
  );
};

export default GameLog;
