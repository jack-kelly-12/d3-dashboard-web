import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BaseballTable } from "./BaseballTable";
import { fetchAPI } from "../../config/api";
import { Search, FileBox } from "lucide-react";
import TeamLogo from "../data/TeamLogo";
import debounce from "lodash/debounce";
import SubscriptionManager from "../../managers/SubscriptionManager";
import AuthManager from "../../managers/AuthManager";
import { columnsValue } from "../../config/tableColumns";
import ExportButton from "../buttons/ExportButton";

const ValueLeaderboard = ({
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

    if (isPremiumUserProp !== undefined) {
      setIsPremiumUser(isPremiumUserProp);
      setIsAuthReady(true);
      return () => {
        isMounted = false;
      };
    }

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

  // Update URL when division changes
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
        `/api/leaderboards/value?start_year=${startYear}&end_year=${endYear}&division=${division}`
      );

      const sortedData = rawData.sort((a, b) => b.WAR - a.WAR);
      const transformedData = sortedData.map((row, index) => ({
        ...row,
        rank: index + 1,
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
          <div className="w-full flex justify-center items-center gap-2">
            <TeamLogo
              teamId={row.prev_team_id}
              conferenceId={row.conference_id}
              teamName={row.Conference}
              showConference={true}
              className="h-8 w-8"
            />
          </div>
        ),
      }));
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
  }, [startYear, endYear, division, isAuthReady, isLoadingPlayerList]);

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

  const yearOptions = useMemo(() => [2025, 2024, 2023, 2022, 2021], []);

  // Generate a filename for export that includes list information if present
  const generateFilename = () => {
    let filename = `value_leaderboard_${startYear}`;
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
      <div className="bg-white border border-blue-200 rounded-lg p-4 lg:p-6 mb-6">
        <h3 className="text-xs lg:text-base font-semibold text-blue-800 mb-2">
          What is the Value Leaderboard?
        </h3>
        <p className="text-xs lg:text-sm text-gray-700 leading-relaxed">
          The Value Leaderboard displays Wins Above Replacement (WAR) for
          players across years, conferences, teams, and positions. WAR combines
          batting, baserunning, positional adjustment, and pitching to show run
          contributions. WAR is park-adjusted and strength-of-schedule adjusted
          to account for differences in ballparks and competition. Additional
          metrics include WPA (win probability added), and WPA/LI
          (context-neutral win probability added).
        </p>

        <blockquote className="text-xs lg:text-sm border-l-4 border-blue-400 pl-4 italic text-gray-600 mt-2">
          "Player X has a WAR of 3.8. In 2024, the number of runs per win was
          13.8. He accrued 3.35 from batting, .52 from baserunning, .02 from
          positional adjustment, and no runs from pitching."
        </blockquote>
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
            columns={columnsValue}
            defaultSortField="WAR"
            defaultSortAsc={false}
            stickyColumns={[0, 1]}
            filename={generateFilename()}
          />
        </div>
      )}
    </div>
  );
};

export default ValueLeaderboard;
