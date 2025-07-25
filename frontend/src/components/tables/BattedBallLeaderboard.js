import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BaseballTable } from "./BaseballTable";
import { fetchAPI } from "../../config/api";
import { Search, FileBox } from "lucide-react";
import TeamLogo from "../data/TeamLogo";
import debounce from "lodash/debounce";
import AuthManager from "../../managers/AuthManager";
import SubscriptionManager from "../../managers/SubscriptionManager";
import { roundTo } from "../../utils/mathUtils";
import { columnsBatted } from "../../config/tableColumns";
import ErrorDisplay from "../alerts/ErrorDisplay";
import { getErrorMessage, isPremiumAccessError } from "../../utils/errorUtils";
import ExportButton from "../buttons/ExportButton";

const PERCENTAGE_COLUMNS = [
  "oppo_pct",
  "middle_pct",
  "pull_pct",
  "gb_pct",
  "ld_pct",
  "pop_pct",
  "fb_pct",
  "pull_air_pct",
  "oppo_gb_pct",
];

const BattedBallLeaderboard = ({
  isPremiumUserProp,
  selectedListId,
  selectedListPlayerIds,
  isLoadingPlayerList,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startYear, setStartYear] = useState(2025);
  const [endYear, setEndYear] = useState(2025);
  const [selectedConference, setSelectedConference] = useState("");
  const [conferences, setConferences] = useState([]);
  const [division, setDivision] = useState(3);
  const [isPremiumUser, setIsPremiumUser] = useState(
    isPremiumUserProp || false
  );
  const [minBBCount, setMinBBCount] = useState(50);

  const yearOptions = useMemo(() => [2025, 2024, 2023, 2022, 2021], []);
  const bbCountOptions = useMemo(
    () => [
      { value: 1, label: "Min 1 BB" },
      { value: 25, label: "Min 25 BB" },
      { value: 50, label: "Min 50 BB" },
      { value: 100, label: "Min 100 BB" },
      { value: 150, label: "Min 150 BB" },
    ],
    []
  );

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
    let isMounted = true;

    // If isPremiumUserProp is provided, use it
    if (isPremiumUserProp !== undefined) {
      setIsPremiumUser(isPremiumUserProp);
      setIsAuthReady(true);
      return () => {
        isMounted = false;
      };
    }

    // Otherwise, fetch the subscription status
    const initializeAuth = async () => {
      const unsubscribeAuth = AuthManager.onAuthStateChanged(async (user) => {
        if (!isMounted) return;

        if (user) {
          const initialSubscription =
            await SubscriptionManager.getUserSubscription(user.uid);
          if (isMounted) {
            setIsPremiumUser(initialSubscription?.isActive || false);

            if (initialSubscription?.isActive) {
              const urlParams = new URLSearchParams(window.location.search);
              const divisionParam = urlParams.get("division");
              if (divisionParam) {
                setDivision(Number(divisionParam));
              }
            }
          }

          SubscriptionManager.listenToSubscriptionUpdates(
            user.uid,
            (subscription) => {
              if (isMounted) {
                setIsPremiumUser(subscription?.isActive || false);
              }
            }
          );
        } else {
          if (isMounted) {
            setIsPremiumUser(false);
          }
        }

        if (isMounted) {
          setIsAuthReady(true);
        }
      });

      return unsubscribeAuth;
    };

    const cleanup = initializeAuth();

    return () => {
      isMounted = false;
      if (cleanup) {
        cleanup.then((unsubscribe) => unsubscribe && unsubscribe());
      }
      SubscriptionManager.stopListening();
    };
  }, [isPremiumUserProp]);

  useEffect(() => {
    if (isPremiumUser) {
      const url = new URL(window.location);
      url.searchParams.set("division", division.toString());
      window.history.replaceState({}, "", url);
    }
  }, [division, isPremiumUser]);

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
      const rawData = await fetchAPI(
        `/api/leaderboards/batted_ball?start_year=${startYear}&end_year=${endYear}&division=${division}&min_bb=${minBBCount}`
      );

      // Sort the data by batted ball count in descending order
      const sortedData = [...rawData].sort((a, b) => b.count - a.count);

      // Assign ranks based on the sorted order
      const transformedData = sortedData.map((row, index) => ({
        ...row,
        rank: index + 1,
        ...Object.fromEntries(
          PERCENTAGE_COLUMNS.map((key) => [key, roundTo(row[key], 1)])
        ),
        renderedTeam: (
          <div className="flex items-center gap-2">
            <TeamLogo
              teamId={row.prev_team_id}
              conferenceId={row.conference_id}
              teamName={row.Team}
              className="h-8 w-8"
            />
          </div>
        ),
        renderedConference: (
          <div className="flex items-center gap-2">
            <TeamLogo
              teamId={row.conference_id}
              conferenceId={row.conference_id}
              teamName={row.Team}
              className="h-8 w-8"
            />
          </div>
        ),
      }));

      setData(transformedData);
    } catch (err) {
      console.error("Error fetching data:", err);
      const errorMessage = getErrorMessage(err, { division });
      setError(errorMessage);
      if (isPremiumAccessError(err)) {
        setDivision(3);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    startYear,
    endYear,
    division,
    minBBCount,
    isAuthReady,
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
    // First apply the standard filters (search and conference)
    let filtered = data.filter((player) => {
      const searchStr = searchTerm.toLowerCase();
      const nameMatch = player.Player?.toLowerCase().includes(searchStr);
      const teamMatch = player.Team?.toLowerCase().includes(searchStr);
      const conferenceMatch = selectedConference
        ? player.Conference === selectedConference
        : true;
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

  // Generate a filename for export that includes list information if present
  const generateFilename = () => {
    let filename = `batted_ball_${startYear}`;
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

  return (
    <div className="container max-w-full lg:max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Explanation Banner */}
      <div className="bg-white border-l-4 border-blue-500 rounded-lg p-4 lg:p-6 mb-6">
        <h3 className="text-xs lg:text-base font-semibold text-blue-800 mb-2">
          What is the Batted Ball Leaderboard?
        </h3>
        <p className="text-xs lg:text-sm text-gray-700 mt-1 leading-relaxed">
          This leaderboard shows the distribution of batted balls for each
          hitter. Some BIP were dropped from dataset due to ambiguity. Using
          play-by-play level descriptions, we can get a good idea of the type of
          hitter each player is. This can be useful for scouting, player
          development, and game planning.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="p-4 space-y-4">
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
                value={minBBCount}
                onChange={(e) => setMinBBCount(Number(e.target.value))}
                className="w-full lg:w-36 px-2 py-1.5 border border-gray-200 rounded-md text-xs lg:text-sm
                  focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {bbCountOptions.map((option) => (
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
        </div>
      </div>

      {/* Leaderboard Table */}
      {error ? (
        <div className="text-center py-12">
          <ErrorDisplay
            error={{ message: error, status: error.includes("Premium subscription required") ? 403 : 0 }}
            context={{ division }}
            onRetry={fetchData}
            onSwitchToDivision3={() => setDivision(3)}
          />
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
            columns={columnsBatted}
            defaultSortField="count"
            defaultSortAsc={false}
            stickyColumns={[0, 1]}
            filename={generateFilename()}
          />
        </div>
      )}
    </div>
  );
};

export default BattedBallLeaderboard;
