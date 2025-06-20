import React, { useState, useEffect } from "react";
import { BaseballTable } from "./BaseballTable";
import { roundTo } from "../../utils/mathUtils.js";
import { columnsRankings } from "../../config/tableColumns";

const RankingsTable = ({
  data,
  division,
  searchTerm = "",
  onSearchChange = null,
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState("");

  // Use prop search term if provided, otherwise use local state
  const effectiveSearchTerm = onSearchChange ? searchTerm : localSearchTerm;
  const handleSearchChange = (value) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setLocalSearchTerm(value);
    }
  };

  // Process data with rounded values
  const processedData = data.map((row) => ({
    ...row,
    off_rating: roundTo(row.off_rating, 2),
    def_rating: roundTo(row.def_rating, 2),
    net_rating: roundTo(row.net_rating, 2),
    sos_off: roundTo(row.sos_off, 2),
    sos_def: roundTo(row.sos_def, 2),
    sos_rating: roundTo(row.sos_rating, 2),
    adj_off: roundTo(row.adj_off, 2),
    adj_def: roundTo(row.adj_def, 2),
    adj_net: roundTo(row.adj_net, 2),
    hfa: roundTo(row.hfa, 2),
    avg_opponent_rating: roundTo(row.avg_opponent_rating, 2),
    top_opponent_rating: roundTo(row.top_opponent_rating, 2),
    sos_percentile: roundTo(row.sos_percentile, 1),
    top_sos_percentile: roundTo(row.top_sos_percentile, 1),
    blended_sos: roundTo(row.blended_sos, 2),
    sos_adjustment: roundTo(row.sos_adjustment, 2),
    adjusted_rating: roundTo(row.adjusted_rating, 2),
    wins: row.wins,
    losses: row.losses,
    win_pct: row.win_pct,
  }));

  // Filter data based on search term with null/undefined check
  const filteredData = processedData.filter((row) => {
    // Safe handling of potentially undefined team name fields
    const teamName = (row.team_name || row.team || row.name || "").toString();
    return teamName
      .toLowerCase()
      .includes((effectiveSearchTerm || "").toLowerCase());
  });

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const filename = `d${division}_rankings.csv`;

  const searchComponent = (
    <input
      type="text"
      placeholder="Search team..."
      value={effectiveSearchTerm}
      onChange={(e) => handleSearchChange(e.target.value)}
      className={`px-3 py-1 border rounded-md text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
        isMobile ? "text-xs w-full md:w-auto" : "text-sm"
      }`}
    />
  );

  return (
    <div>
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-sm md:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {`Kelly Rankings`}
          </h2>
          <div className={`${isMobile ? "w-32" : ""}`}>{searchComponent}</div>
        </div>
      </div>
      <BaseballTable
        data={filteredData}
        columns={columnsRankings}
        filename={filename}
        initialSortColumn="adjusted_rank"
      />
    </div>
  );
};

export default RankingsTable;
