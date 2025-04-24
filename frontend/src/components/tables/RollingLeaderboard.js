import React, { useState, useEffect, useCallback, useMemo } from "react";
import { fetchAPI } from "../../config/api";
import TeamLogo from "../data/TeamLogo";
import {
  ArrowUp,
  ArrowDown,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const RollingLeaderboard = ({ isPremiumUser = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({});
  const [error, setError] = useState(null);
  const [division, setDivision] = useState(3);
  const [searchTerm, setSearchTerm] = useState("");
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("");
  const [expandedWindows, setExpandedWindows] = useState({});
  const [playerType, setPlayerType] = useState("batter");

  const windowSizes = useMemo(() => [25, 50, 100], []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const responses = await Promise.all(
        windowSizes.map((window) =>
          fetchAPI(
            `/api/leaderboards/rolling?division=${division}&window=${window}&player_type=${playerType}`
          )
        )
      );

      const combinedData = {};
      windowSizes.forEach((window, idx) => {
        combinedData[window] = responses[idx].items;
      });

      setData(combinedData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [division, playerType, windowSizes]);

  const fetchConferences = useCallback(async () => {
    try {
      const response = await fetchAPI(`/conferences?division=${division}`);
      setConferences(response.sort());
    } catch (err) {
      console.error("Error fetching conferences:", err);
    }
  }, [division]);

  useEffect(() => {
    fetchData();
    fetchConferences();
  }, [fetchData, fetchConferences]);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const toggleWindow = (window) => {
    setExpandedWindows((prev) => ({
      ...prev,
      [window]: !prev[window],
    }));
  };

  const handleViewTypeChange = (newViewType) => {
    setPlayerType(newViewType);
    setExpandedWindows({});
  };

  const renderLeaderboardSection = (window) => {
    if (!data[window]) return null;

    const filteredData = data[window].filter((player) => {
      const searchMatch =
        searchTerm === "" ||
        player.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (player.team &&
          player.team.toLowerCase().includes(searchTerm.toLowerCase()));

      const conferenceMatch =
        selectedConference === "" || player.conference === selectedConference;

      return searchMatch && conferenceMatch;
    });

    const sortedData = [...filteredData].sort((a, b) => {
      if (playerType === "pitcher") {
        return a.wobaChange - b.wobaChange; // Negative deltas first for pitchers
      } else {
        return b.wobaChange - a.wobaChange; // Positive deltas first for batters
      }
    });

    const improving =
      playerType === "pitcher"
        ? filteredData
            .filter((p) => p.wobaChange < 0)
            .sort((a, b) => a.wobaChange - b.wobaChange)
            .slice(0, 5)
        : filteredData
            .filter((p) => p.wobaChange > 0)
            .sort((a, b) => b.wobaChange - a.wobaChange)
            .slice(0, 5);

    const declining =
      playerType === "pitcher"
        ? filteredData
            .filter((p) => p.wobaChange > 0)
            .sort((a, b) => b.wobaChange - a.wobaChange)
            .slice(0, 5)
        : filteredData
            .filter((p) => p.wobaChange < 0)
            .sort((a, b) => a.wobaChange - b.wobaChange)
            .slice(0, 5);

    const isExpanded = expandedWindows[window];
    const displayData = isExpanded ? sortedData : null;

    // Helper function to determine text color for delta
    const getDeltaColor = (player) => {
      if (playerType === "pitcher") {
        return player.wobaChange < 0 ? "text-green-600" : "text-red-600";
      } else {
        return player.wobaChange > 0 ? "text-green-600" : "text-red-600";
      }
    };

    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">
            {window} {playerType === "pitcher" ? "BF" : "PA"} wOBA
          </h3>
          <button
            onClick={() => toggleWindow(window)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center"
          >
            {isExpanded ? (
              <>
                Show Top 5 <ChevronUp size={14} className="ml-1" />
              </>
            ) : (
              <>
                Show All <ChevronDown size={14} className="ml-1" />
              </>
            )}
          </button>
        </div>

        <div className="p-2">
          <div className="grid grid-cols-12 gap-0.5 text-xs font-medium bg-white text-gray-500 mb-1">
            <div className="col-span-6">PLAYER</div>
            <div className="text-center col-span-2">THEN</div>
            <div className="text-center col-span-2">NOW</div>
            <div className="text-center col-span-2">Δ</div>
          </div>

          {isExpanded ? (
            <div className="max-h-96 overflow-y-auto">
              {displayData.map((player) => (
                <div
                  key={`${window}-${player.player_id}-all`}
                  className="grid grid-cols-12 items-center py-1.5"
                >
                  <div className="flex items-center gap-1.5 col-span-6">
                    <TeamLogo
                      teamId={player.teamId}
                      conferenceId={player.conferenceId}
                      teamName={player.team}
                      className="h-6 w-6 flex-shrink-0"
                    />
                    {player.player_id.substring(0, 4) === "d3d-" ? (
                      <a
                        href={`/player/${player.player_id}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline truncate"
                      >
                        {player.playerName}
                      </a>
                    ) : (
                      <span className="text-xs font-medium truncate">
                        {player.playerName}
                      </span>
                    )}
                  </div>
                  <div className="text-center text-xs col-span-2">
                    {player.wobaThen}
                  </div>
                  <div className="text-center text-xs col-span-2">
                    {player.wobaNow}
                  </div>
                  <div
                    className={`text-center text-xs flex items-center justify-center col-span-2 ${getDeltaColor(
                      player
                    )}`}
                  >
                    {player.wobaChange}
                    {player.wobaChange > 0 ? (
                      <ArrowUp size={14} className="ml-1" />
                    ) : (
                      <ArrowDown size={14} className="ml-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Improving Players */}
              {improving.map((player) => (
                <div
                  key={`${window}-${player.player_id}-up`}
                  className="grid grid-cols-12 items-center py-1.5"
                >
                  <div className="flex items-center gap-1.5 col-span-6">
                    <TeamLogo
                      teamId={player.teamId}
                      conferenceId={player.conferenceId}
                      teamName={player.team}
                      className="h-6 w-6 flex-shrink-0"
                    />
                    {player.player_id.substring(0, 4) === "d3d-" ? (
                      <a
                        href={`/player/${player.player_id}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline truncate"
                      >
                        {player.playerName}
                      </a>
                    ) : (
                      <span className="text-xs font-medium truncate">
                        {player.playerName}
                      </span>
                    )}
                  </div>
                  <div className="text-center text-xs col-span-2">
                    {player.wobaThen}
                  </div>
                  <div className="text-center text-xs col-span-2">
                    {player.wobaNow}
                  </div>
                  <div className="text-center text-xs text-green-600 flex items-center justify-center col-span-2">
                    {player.wobaChange}
                    {playerType === "pitcher" ? (
                      <ArrowDown size={14} className="ml-1" />
                    ) : (
                      <ArrowUp size={14} className="ml-1" />
                    )}
                  </div>
                </div>
              ))}

              <div className="border-t border-gray-200 my-3"></div>

              {/* Declining Players */}
              {declining.map((player) => (
                <div
                  key={`${window}-${player.player_id}-down`}
                  className="grid grid-cols-12 items-center py-1.5"
                >
                  <div className="flex items-center gap-1.5 col-span-6">
                    <TeamLogo
                      teamId={player.teamId}
                      conferenceId={player.conferenceId}
                      teamName={player.team}
                      className="h-6 w-6 flex-shrink-0"
                    />
                    {player.player_id.substring(0, 4) === "d3d-" ? (
                      <a
                        href={`/player/${player.player_id}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline truncate"
                      >
                        {player.playerName}
                      </a>
                    ) : (
                      <span className="text-xs font-medium truncate">
                        {player.playerName}
                      </span>
                    )}
                  </div>
                  <div className="text-center text-xs col-span-2">
                    {player.wobaThen}
                  </div>
                  <div className="text-center text-xs col-span-2">
                    {player.wobaNow}
                  </div>
                  <div className="text-center text-xs text-red-600 flex items-center justify-center col-span-2">
                    {player.wobaChange}
                    {playerType === "pitcher" ? (
                      <ArrowUp size={14} className="ml-1" />
                    ) : (
                      <ArrowDown size={14} className="ml-1" />
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="container max-w-full lg:max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="bg-white border border-blue-200 rounded-lg p-4 lg:p-6 mb-6">
        <h3 className="text-xs lg:text-base font-semibold text-blue-800 mb-2">
          What is the Rolling Leaderboard?
        </h3>
        <p className="text-xs lg:text-sm text-gray-700 leading-relaxed">
          The Rolling Leaderboard tracks players' performance changes over
          recent{" "}
          {playerType === "batter" ? "plate appearances" : "batters faced"}.
          wOBA (weighted on-base average) measures{" "}
          {playerType === "batter"
            ? "a player's offensive value by weighting different hitting outcomes"
            : "a pitcher's effectiveness at preventing valuable offensive outcomes"}
          . This leaderboard highlights players experiencing significant
          improvement or decline over the last 25, 50, or 100{" "}
          {playerType === "batter" ? "plate appearances" : "batters faced"}{" "}
          compared to their previous performance.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="p-4 space-y-4">
          {/* Toggle View Type */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 font-medium">View:</span>
              <div className="inline-flex bg-gray-100 rounded-md" role="group">
                <button
                  type="button"
                  onClick={() => handleViewTypeChange("batter")}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md flex items-center ${
                    playerType === "batter"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Batters
                </button>
                <button
                  type="button"
                  onClick={() => handleViewTypeChange("pitcher")}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md flex items-center ${
                    playerType === "pitcher"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Pitchers
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="w-full lg:w-64 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search"
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-xs lg:text-sm
                        focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
              {isPremiumUser && (
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
              )}

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {windowSizes.map((window) => (
          <div key={window}>{renderLeaderboardSection(window)}</div>
        ))}
      </div>
    </div>
  );
};

export default RollingLeaderboard;
