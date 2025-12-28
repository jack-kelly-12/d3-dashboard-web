import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BaseballTable } from "./BaseballTable";
import { fetchAPI } from "../../config/api";
import { Search, Users, User, FileBox } from "lucide-react";
import debounce from "lodash/debounce";
import { columnsSplitsBatters, columnsSplitsPitchers } from "../../config/splitsColumns";
import ExportButton from "../buttons/ExportButton";
import { DEFAULT_YEAR, DEFAULT_DIVISION } from "../../config/constants";

const SplitsLeaderboard = ({
  selectedListId,
  selectedListPlayerIds,
  isLoadingPlayerList,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startYear, setStartYear] = useState(DEFAULT_YEAR);
  const [endYear, setEndYear] = useState(DEFAULT_YEAR);
  const [selectedConference, setSelectedConference] = useState("");
  const [minCount, setMinCount] = useState(50);
  const [conferences, setConferences] = useState([]);
  const [division, setDivision] = useState(DEFAULT_DIVISION);
  const [viewType, setViewType] = useState("batters");

  const fetchConferences = useCallback(async () => {
    if (!isAuthReady) return;

    try {
      const response = await fetchAPI(`/conferences?division=${division}`);
      setConferences(response.sort());
    } catch (err) {
      console.error("Error fetching conferences:", err);
    }
  }, [division, isAuthReady]);

  useEffect(() => {
    setIsAuthReady(true);
  }, []);

  useEffect(() => {
    if (isAuthReady) {
      fetchConferences();
    }
  }, [fetchConferences, isAuthReady]);

  const fetchData = useCallback(async () => {
    if (!isAuthReady || isLoadingPlayerList) return;

    setIsLoading(true);
    setError(null);
    try {
      const endpoint =
        viewType === "batters"
          ? `/api/leaderboards/splits`
          : `/api/leaderboards/splits_pitcher`;

      const countParam = viewType === "batters" ? "min_pa" : "min_bf";

      const rawData = await fetchAPI(
        `${endpoint}?start_year=${startYear}&end_year=${endYear}&${countParam}=${minCount}&division=${division}`
      );

      const sortField = "woba_overall";

      const sortedData = [...rawData].sort((a, b) => viewType === "batters" ? (b[sortField] ?? 0) - (a[sortField] ?? 0) : (a[sortField] ?? 0) - (b[sortField] ?? 0));

      const transformedData = sortedData.map((row, index) => ({ ...row, rank: index + 1 }));

      setData(transformedData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
      if (err.status === 403) {
        setDivision(3);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    startYear,
    endYear,
    minCount,
    division,
    isAuthReady,
    viewType,
    isLoadingPlayerList,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchChange = useMemo(
    () =>
      debounce((value) => {
        setSearchTerm(value);
      }, 300),
    []
  );

  const filteredData = useMemo(() => {
    let filtered = data.filter((player) => {
      const searchStr = searchTerm.toLowerCase();
      const nameMatch = player.player_name?.toLowerCase().includes(searchStr);
      const teamMatch = player.team_name?.toLowerCase().includes(searchStr);
      const conferenceMatch = selectedConference ? player.conference === selectedConference : true;
      return (nameMatch || teamMatch) && conferenceMatch;
    });

    // Then apply the player list filter if selected
    if (
      selectedListId &&
      selectedListPlayerIds &&
      selectedListPlayerIds.length > 0
    ) {
      filtered = filtered.filter((player) => {
        const playerId = player.player_id || player.Player_ID;
        if (!playerId) return false;

        // Check if the player ID is in the selected list
        // Handle both string and number comparisons
        return selectedListPlayerIds.some(
          (id) =>
            id === playerId.toString() ||
            id === playerId ||
            (playerId.toString().includes("d3d-") &&
              id === playerId.toString().replace("d3d-", ""))
        );
      });
    }

    return filtered;
  }, [
    data,
    searchTerm,
    selectedConference,
    selectedListId,
    selectedListPlayerIds,
  ]);

  const yearOptions = useMemo(() => [2025, 2024, 2023, 2022, 2021], []);
  const countOptions = useMemo(
    () => [
      { value: 1, label: viewType === "batters" ? "Min 1 PA" : "Min 1 BF" },
      { value: 25, label: viewType === "batters" ? "Min 25 PA" : "Min 25 BF" },
      { value: 50, label: viewType === "batters" ? "Min 50 PA" : "Min 50 BF" },
      {
        value: 100,
        label: viewType === "batters" ? "Min 100 PA" : "Min 100 BF",
      },
      {
        value: 150,
        label: viewType === "batters" ? "Min 150 PA" : "Min 150 BF",
      },
    ],
    [viewType]
  );

  const columns = viewType === "batters" ? columnsSplitsBatters : columnsSplitsPitchers;
  const defaultSortField = "woba_overall";
  const defaultSortAsc = viewType !== "batters";

  const handleViewTypeChange = (newViewType) => {
    setViewType(newViewType);
    setData([]);
    setIsLoading(true);
  };

  // Generate a filename for export that includes list information if present
  const generateFilename = () => {
    let filename = `splits_${viewType}_${startYear}`;
    if (startYear !== endYear) {
      filename += `-${endYear}`;
    }
    if (selectedListId) {
      filename += `_list_${selectedListId}`;
    }
    return `${filename}.csv`;
  };

  if (!isAuthReady || isLoading || isLoadingPlayerList) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const explanationText =
    viewType === "batters"
      ? "The Splits Leaderboard shows how batters perform against left-handed and right-handed pitchers. Key metrics include batting average (BA), on-base percentage (OBP), slugging (SLG), and weighted on-base average (wOBA). These statistics are broken down by pitcher handedness to reveal platoon advantages and help inform matchup decisions."
      : "The Pitcher Splits Leaderboard shows how pitchers perform against left-handed and right-handed batters. Key metrics include batting average against (BA), on-base percentage against (OBP), slugging against (SLG), and weighted on-base average against (wOBA). These statistics are broken down by batter handedness to reveal platoon disadvantages and help inform matchup decisions.";

  const exampleText =
    viewType === "batters"
      ? '"Player X has a .320 wOBA overall, but shows a significant platoon split with a .350 wOBA vs RHP and .280 wOBA vs LHP across 200+ plate appearances, suggesting he sees the ball better against righties."'
      : '"Pitcher Y has a .290 wOBA overall, but shows a significant platoon split with a .310 wOBA vs RHH and .260 wOBA vs LHH across 200+ plate appearances, suggesting he\'s more effective against left-handed hitters."';

  return (
    <div className="container max-w-full lg:max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Explanation Banner */}
      <div className="bg-white border border-blue-200 rounded-lg p-4 lg:p-6 mb-6">
        <h3 className="text-xs lg:text-base font-semibold text-blue-800 mb-2">
          What is the {viewType === "batters" ? "Splits" : "Pitcher Splits"}{" "}
          Leaderboard?
        </h3>
        <p className="text-xs lg:text-sm text-gray-700 leading-relaxed">
          {explanationText} The minimum{" "}
          {viewType === "batters" ? "plate appearance" : "batters faced"} filter
          ensures statistical significance.
        </p>

        <blockquote className="text-xs lg:text-sm border-l-4 border-blue-400 pl-4 italic text-gray-600 mt-2">
          {exampleText}
        </blockquote>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="p-4 space-y-4">
          {/* Toggle View Type and Search */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-2">
            {/* Toggle buttons */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 font-medium">View:</span>
              <div className="inline-flex bg-gray-100 rounded-md" role="group">
                <button
                  type="button"
                  onClick={() => handleViewTypeChange("batters")}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md flex items-center ${
                    viewType === "batters"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <User size={16} className="mr-1.5" />
                  Batters
                </button>
                <button
                  type="button"
                  onClick={() => handleViewTypeChange("pitchers")}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md flex items-center ${
                    viewType === "pitchers"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Users size={16} className="mr-1.5" />
                  Pitchers
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="w-full lg:w-64 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by name or team"
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-xs lg:text-sm
                    focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Player List Filter Status */}
            {selectedListId && (
              <div className="ml-auto px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-md text-xs lg:text-sm text-blue-700">
                Showing {filteredData.length} of {data.length} players
              </div>
            )}

            {/* Export Button */}
            <div className="ml-auto">
              <ExportButton
                data={filteredData}
                filename={generateFilename()}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
            <select
              value={division}
              onChange={(e) => setDivision(Number(e.target.value))}
              className="w-full lg:w-32 px-2 py-1.5 border border-gray-200 rounded-md text-xs lg:text-sm
                  focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value={1}>Division 1</option>
              <option value={2}>Division 2</option>
              <option value={3}>Division 3</option>
            </select>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <select
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="w-full lg:w-24 px-2 py-1.5 border border-gray-200 rounded-md text-xs lg:text-sm
                    focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <span className="text-xs lg:text-sm text-gray-500">to</span>
              <select
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className="w-full lg:w-24 px-2 py-1.5 border border-gray-200 rounded-md text-xs lg:text-sm
                    focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={minCount}
              onChange={(e) => setMinCount(Number(e.target.value))}
              className="w-full lg:w-36 px-2 py-1.5 border border-gray-200 rounded-md text-xs lg:text-sm
                  focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {countOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {conferences.length > 0 && (
              <select
                value={selectedConference}
                onChange={(e) => setSelectedConference(e.target.value)}
                className="w-full lg:w-44 px-2 py-1.5 border border-gray-200 rounded-md text-xs lg:text-sm
                    focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Conferences</option>
                {conferences.map((conf) => (
                  <option key={conf} value={conf}>
                    {conf}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-600 text-xs lg:text-sm">{error}</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-600 mb-4">
            No data found for the current filters.
          </p>
          {selectedListId && (
            <div className="mt-4 flex flex-col items-center">
              <FileBox size={32} className="text-blue-500 mb-2" />
              <p className="text-gray-500 text-sm">
                {selectedListPlayerIds.length === 0
                  ? "The selected player list is empty."
                  : "None of the players in the selected list match the current criteria."}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <BaseballTable
            data={filteredData}
            columns={columns}
            defaultSortField={defaultSortField}
            defaultSortAsc={defaultSortAsc}
            stickyColumns={[0, 1]}
            filename={generateFilename()}
          />
        </div>
      )}
    </div>
  );
};

export default SplitsLeaderboard;
