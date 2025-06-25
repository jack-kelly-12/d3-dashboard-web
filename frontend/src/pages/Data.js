import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BaseballTable } from "../components/tables/BaseballTable";
import InfoBanner from "../components/data/InfoBanner";
import DataControls from "../components/data/DataControls";
import { fetchAPI } from "../config/api";
import { getDataColumns } from "../config/tableColumns";
import TeamLogo from "../components/data/TeamLogo";
import { useSearchParams } from "react-router-dom";
import debounce from "lodash/debounce";
import { useSubscription } from "../contexts/SubscriptionContext";
import PlayerListManager from "../managers/PlayerListManager";
import ErrorDisplay from "../components/alerts/ErrorDisplay";
import { getErrorMessage, isPremiumAccessError } from "../utils/errorUtils";

const MemoizedTable = React.memo(({ data, dataType, filename }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
    <BaseballTable
      data={data}
      columns={getDataColumns(dataType)}
      filename={filename}
      stickyColumns={[0, 1]}
    />
  </div>
));

const Data = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPremiumUser, isLoading: isSubscriptionLoading } = useSubscription();

  const [state, setState] = useState({
    dataType: searchParams.get("dataType") || "player_hitting",
    selectedYears: searchParams.get("years")?.split(",").map(Number) || [2025],
    searchTerm: searchParams.get("search") || "",
    minPA: Number(searchParams.get("minPA")) || 50,
    minIP: Number(searchParams.get("minIP")) || 10,
    selectedConference: searchParams.get("conference") || "",
    division: Number(searchParams.get("division")) || 3,
    selectedListId: searchParams.get("listId") || "",
  });

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conferences, setConferences] = useState([]);
  const [selectedListPlayerIds, setSelectedListPlayerIds] = useState([]);
  const [isLoadingPlayerList, setIsLoadingPlayerList] = useState(false);

  useEffect(() => {
    if (isPremiumUser) {
      setState((prev) => ({
        ...prev,
        division: searchParams.get("division")
          ? Number(searchParams.get("division"))
          : prev.division,
      }));
    }
  }, [isPremiumUser, searchParams]);

  // Fetch player list IDs when selectedListId changes
  useEffect(() => {
    const fetchPlayerList = async () => {
      if (!state.selectedListId || !state.dataType.includes("player")) {
        setSelectedListPlayerIds([]);
        return;
      }

      try {
        setIsLoadingPlayerList(true);
        const list = await PlayerListManager.getPlayerListById(
          state.selectedListId
        );
        if (list && list.playerIds) {
          setSelectedListPlayerIds(list.playerIds);
        } else {
          setSelectedListPlayerIds([]);
        }
      } catch (err) {
        console.error("Error fetching player list:", err);
        setSelectedListPlayerIds([]);
      } finally {
        setIsLoadingPlayerList(false);
      }
    };

    fetchPlayerList();
  }, [state.selectedListId, state.dataType]);

  const endpointMap = useMemo(
    () => ({
      player_hitting: (year) =>
        `/api/batting_war/${year}?division=${state.division}`,
      player_pitching: (year) =>
        `/api/pitching_war/${year}?division=${state.division}`,
      team_hitting: (year) =>
        `/api/batting_team_war/${year}?division=${state.division}`,
      team_pitching: (year) =>
        `/api/pitching_team_war/${year}?division=${state.division}`,
    }),
    [state.division]
  );

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const response = await fetchAPI(
          `/conferences?division=${state.division}`
        );
        setConferences(response.sort());
      } catch (err) {
        console.error("Error fetching conferences:", err);
      }
    };
    fetchConferences();
  }, [state.division]);

  const updateSearchParams = useCallback(
    (newState) => {
      const debouncedUpdate = debounce((state) => {
        const params = {
          dataType: state.dataType,
          years: state.selectedYears.join(","),
          search: state.searchTerm,
          minPA: state.minPA.toString(),
          minIP: state.minIP.toString(),
          conference: state.selectedConference,
        };

        if (isPremiumUser) {
          params.division = state.division.toString();
        }

        if (state.selectedListId && state.dataType.includes("player")) {
          params.listId = state.selectedListId;
        }

        setSearchParams(params);
      }, 300);
      debouncedUpdate(newState);
    },
    [setSearchParams, isPremiumUser]
  );

  const transformData = useCallback(
    (row) => ({
      ...row,
      renderedTeam: (
        <div className="flex items-center gap-2">
          <TeamLogo
            teamId={row.prev_team_id}
            conferenceId={row.conference_id}
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
    }),
    []
  );

  const fetchData = useCallback(async () => {
    if (!state.selectedYears.length || isSubscriptionLoading) return;
    setIsLoading(true);

    try {
      const results = await Promise.all(
        state.selectedYears.map((year) =>
          fetchAPI(endpointMap[state.dataType](year)).catch((err) => {
            // Use the new error utility for consistent error handling
            const errorMessage = getErrorMessage(err, { 
              division: state.division, 
              dataType: state.dataType 
            });
            throw new Error(errorMessage);
          })
        )
      );

      const combinedData = results.flat();
      if (combinedData.length === 0) {
        setError("No data found for the selected years and filters.");
        return;
      }

      setData(combinedData.map(transformData));
      setError(null);
    } catch (err) {
      setError(err.message);
      // Only auto-switch to Division 3 for premium-related errors
      if (isPremiumAccessError(err) && state.division !== 3) {
        setState((prev) => ({ ...prev, division: 3 }));
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    state.dataType,
    state.selectedYears,
    state.division,
    endpointMap,
    transformData,
    isSubscriptionLoading,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    // Start with the basic filtering
    let filtered = data.filter((item) => {
      const searchStr = state.searchTerm.toLowerCase();
      const name = item.Player?.toLowerCase() || item.Team?.toLowerCase() || "";
      const team = item.Team?.toLowerCase() || "";
      const meetsQualifier =
        state.dataType === "player_pitching"
          ? item.IP >= state.minIP
          : state.dataType === "player_hitting"
          ? item.PA >= state.minPA
          : true;
      const meetsConference = state.selectedConference
        ? item.Conference === state.selectedConference
        : true;

      return (
        meetsQualifier &&
        meetsConference &&
        (name.includes(searchStr) || team.includes(searchStr))
      );
    });

    // Apply player list filtering if a list is selected
    if (
      state.selectedListId &&
      selectedListPlayerIds.length > 0 &&
      state.dataType.includes("player")
    ) {
      filtered = filtered.filter((item) => {
        // The player ID in the data might be "d3d-123" or just 123
        const playerId = item.player_id || item.Player_ID;
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
  }, [data, state, selectedListPlayerIds]);

  useEffect(() => {
    updateSearchParams(state);
  }, [state, updateSearchParams]);

  const handleStateChange = useCallback((key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isPageLoading =
    isSubscriptionLoading || isLoading || isLoadingPlayerList;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-full lg:max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <InfoBanner dataType={state.dataType} />
        <DataControls
          {...state}
          setDataType={(val) => handleStateChange("dataType", val)}
          setSelectedYears={(val) => handleStateChange("selectedYears", val)}
          setMinPA={(val) => handleStateChange("minPA", val)}
          setMinIP={(val) => handleStateChange("minIP", val)}
          setSearchTerm={(val) => handleStateChange("searchTerm", val)}
          setConference={(val) => handleStateChange("selectedConference", val)}
          setDivision={(val) => handleStateChange("division", val)}
          setSelectedListId={(val) => handleStateChange("selectedListId", val)}
          conferences={conferences}
          isPremiumUser={isPremiumUser}
          // Export functionality
          exportData={!isPageLoading && !error && filteredData.length > 0 ? filteredData : null}
          exportFilename={`${state.dataType}_${state.selectedYears.join("-")}${
            state.selectedListId ? `_list_${state.selectedListId}` : ""
          }.csv`}
          showExportButton={!isPageLoading && !error && filteredData.length > 0}
        />

        {isPageLoading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">
              {isLoadingPlayerList
                ? "Loading player list..."
                : "Loading data..."}
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <ErrorDisplay
              error={{ message: error, status: error.includes("Premium subscription required") ? 403 : 0 }}
              context={{ division: state.division, dataType: state.dataType }}
              onRetry={fetchData}
              onSwitchToDivision3={() => setState(prev => ({ ...prev, division: 3 }))}
            />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-gray-600 mb-4">
              No data found for the current filters.
            </p>
            {state.selectedListId && (
              <p className="text-gray-500 text-sm">
                {selectedListPlayerIds.length === 0
                  ? "The selected player list is empty."
                  : "None of the players in the selected list match the current filters."}
              </p>
            )}
          </div>
        ) : (
          <div>
            {state.selectedListId && (
              <div className="mb-2 px-2 py-1 bg-blue-50 text-blue-700 rounded-md inline-flex items-center text-sm">
                <span className="font-medium">Filtered: </span>
                <span className="ml-2">
                  Showing {filteredData.length} players from selected list
                </span>
              </div>
            )}
            <MemoizedTable
              data={filteredData}
              dataType={state.dataType}
              filename={`${state.dataType}_${state.selectedYears.join("-")}${
                state.selectedListId ? `_list_${state.selectedListId}` : ""
              }.csv`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Data);
