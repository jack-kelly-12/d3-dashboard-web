import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useDeferredValue } from "react";
import { columnsValueLeaderboard } from "../config/valueColumns";
import { columnsSituationalBatters, columnsSituationalPitchers } from "../config/situationalColumns";
import { columnsBaserunningLeaderboard } from "../config/baserunningColumns";
import { columnsSplitsBatters, columnsSplitsPitchers } from "../config/splitsColumns";
import { columnsBattedBall } from "../config/battedBallColumns";
import { columnsRollingLeaderboard } from "../config/rollingColumns";
import RollingLeaderboard from "../components/tables/RollingLeaderboard";
import PlayerListManager from "../managers/PlayerListManager";
import { getErrorMessage } from "../utils/errorUtils";
import { fetchAPI } from "../config/api";
import { BaseballTable } from "../components/tables/BaseballTable";
import DataControls from "../components/data/DataControls";
import ErrorDisplay from "../components/alerts/ErrorDisplay";
import debounce from "lodash/debounce";

const DEFAULT_YEAR = 2025;
const DEFAULT_MIN_PA = 50;
const DEFAULT_DIVISION = 3;

const LEADERBOARD_TYPES = [
  { id: "value", label: "Value" },
  { id: "situational", label: "Situational" },
  { id: "baserunning", label: "Baserunning" },
  { id: "splits", label: "Splits" },
  { id: "battedball", label: "Batted Ball" },
  { id: "rolling", label: "Rolling" },
];

const ENDPOINT_MAP = {
  value: "/api/leaderboards/value",
  situational: "/api/leaderboards/situational",
  baserunning: "/api/leaderboards/baserunning",
  splits: "/api/leaderboards/splits",
  battedball: "/api/leaderboards/batted_ball",
  rolling: "/api/leaderboards/rolling",
};

const COLUMN_MAP = {
  value: columnsValueLeaderboard,
  situational: columnsSituationalBatters,
  baserunning: columnsBaserunningLeaderboard,
  splits: columnsSplitsBatters,
  battedball: columnsBattedBall,
  rolling: columnsRollingLeaderboard,
};

const Leaderboards = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialYears = () => {
    const yearsParam = searchParams.get("years");
    if (yearsParam) {
      const years = yearsParam.split(',').map(Number).filter((y) => !Number.isNaN(y));
      if (years.length) return years;
    }
    const single = Number(searchParams.get("year"));
    return !Number.isNaN(single) && single ? [single] : [DEFAULT_YEAR];
  };

  const [leaderboardType, setLeaderboardType] = useState(searchParams.get("type") || "value");
  const [selectedYears, setSelectedYears] = useState(getInitialYears());
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [minPA, setMinPA] = useState(Number(searchParams.get("minPA")) || DEFAULT_MIN_PA);
  const [minIP, setMinIP] = useState(Number(searchParams.get("minIP")) || 10);
  const [division, setDivision] = useState(Number(searchParams.get("division")) || DEFAULT_DIVISION);
  const [conference, setConference] = useState(searchParams.get("conference") || "");
  const [listId, setListId] = useState(searchParams.get("listId") || "");
  const [playerType, setPlayerType] = useState(searchParams.get("pt") === "pitcher" ? "pitcher" : "batter");

  const deferredSearch = useDeferredValue(searchTerm);

  const [data, setData] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [listPlayerIds, setListPlayerIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showError, setShowError] = useState(false);

  const dataAbortRef = useRef(null);
  const conferencesAbortRef = useRef(null);
  const mounted = useRef(false);

  const updateParams = debounce((state) => {
    const params = new URLSearchParams();
    params.set("type", state.leaderboardType);
    params.set("years", state.selectedYears.join(','));
    params.set("search", state.searchTerm);
    params.set("minPA", state.minPA.toString());
    params.set("minIP", state.minIP.toString());
    params.set("division", state.division.toString());
    if (state.conference) params.set("conference", state.conference);
    if (state.listId) params.set("listId", state.listId);
    if (state.playerType) params.set("pt", state.playerType);

    const newParams = params.toString();
    const currentParams = searchParams.toString();

    if (newParams !== currentParams) {
      setSearchParams(params);
    }
  }, 300);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    updateParams({ leaderboardType, selectedYears, searchTerm, minPA, minIP, division, conference, listId, playerType });
  }, [leaderboardType, selectedYears, searchTerm, minPA, minIP, division, conference, listId, playerType, updateParams]);

  const fetchPlayerList = useCallback(async () => {
    if (!listId) {
      setListPlayerIds([]);
      return;
    }

    try {
      setLoadingList(true);
      const list = await PlayerListManager.getPlayerListById(listId);
      setListPlayerIds(list?.playerIds || []);
    } catch {
      setListPlayerIds([]);
    } finally {
      setLoadingList(false);
    }
  }, [listId]);

  useEffect(() => {
    fetchPlayerList();
  }, [listId, fetchPlayerList]);

  const fetchConferences = useCallback(async () => {
    conferencesAbortRef.current?.abort();
    const controller = new AbortController();
    conferencesAbortRef.current = controller;
    
    try {
      const yearsParam = selectedYears.join(',');
      const resp = await fetchAPI(`/conferences?division=${division}&years=${yearsParam}`, { 
        signal: controller.signal 
      });
      const confs = Array.isArray(resp) ? resp : [];
      
      if (!controller.signal.aborted) {
        const confNames = confs.map(conf => {
          if (typeof conf === 'string') return conf;
          if (typeof conf === 'object' && conf !== null) {
            return conf.conference || conf.name || conf.Conference || conf.Name || String(conf);
          }
          return String(conf);
        });
        
        const uniqueConfs = [...new Set(confNames)].sort();
        setConferences(uniqueConfs);
        setIsInitialized(true);
      }
    } catch (error) {
      if (error.name !== "AbortError" && !controller.signal.aborted) {
        console.error('Error fetching conferences:', error);
        setIsInitialized(true);
      }
    }
  }, [division, selectedYears]);

  useEffect(() => {
    fetchConferences();
  }, [division, selectedYears, fetchConferences]);

  const fetchData = useCallback(async () => {
    if (!selectedYears.length && leaderboardType !== 'rolling') return;
    
    dataAbortRef.current?.abort();
    const controller = new AbortController();
    dataAbortRef.current = controller;
    
    setLoading(true);
    setError(null);
    setShowError(false);
    
    try {
      const params = new URLSearchParams();
      params.set("division", division.toString());

      if (leaderboardType === 'rolling') {
        params.set("window", "25");
        params.set("sort_order", "desc");
        params.set("player_type", playerType);
      } else {
        if (selectedYears.length > 0) {
          const sortedYears = [...selectedYears].sort();
          params.set("start_year", sortedYears[0].toString());
          params.set("end_year", sortedYears[sortedYears.length - 1].toString());
        }
        if (leaderboardType === 'situational') {
          if (playerType === 'pitcher') {
            params.set("min_bf", Math.max(minIP, 0).toString());
          } else {
            params.set("min_pa", Math.max(minPA, 0).toString());
          }
        }
        if (leaderboardType === 'splits') {
          if (playerType === 'pitcher') {
            params.set("min_bf", Math.max(minIP, 0).toString());
          } else {
            params.set("min_pa", Math.max(minPA, 0).toString());
          }
        }
        
        if (leaderboardType === 'battedball') {
          params.set("min_bb", Math.max(minPA, 0).toString());
        }
      }
      
      let endpoint = ENDPOINT_MAP[leaderboardType] || ENDPOINT_MAP.value;
      if (leaderboardType === 'situational' && playerType === 'pitcher') {
        endpoint = '/api/leaderboards/situational_pitcher';
      }
      if (leaderboardType === 'splits' && playerType === 'pitcher') {
        endpoint = '/api/leaderboards/splits_pitcher';
      }
      const result = await fetchAPI(`${endpoint}?${params}`, { signal: controller.signal });
      
      const rows = Array.isArray(result) ? result : [];
      
      if (!controller.signal.aborted) {
        const rankedData = rows.map((row, index) => ({
          ...row,
          rank: index + 1
        }));
        setData(rankedData);
        setError(null);
        setShowError(false);
      }
    } catch (err) {
      if (err.name !== "AbortError" && !controller.signal.aborted) {
        console.error('Error fetching data:', err);
        const errorMessage = getErrorMessage(err, { division, leaderboardType });
        setError(errorMessage);
        setShowError(true);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [selectedYears, division, leaderboardType, minIP, minPA, playerType]);

  useEffect(() => {
    if (!mounted.current || !isInitialized) return;
    fetchData();
  }, [selectedYears, division, leaderboardType, minPA, isInitialized, fetchData]);

  useEffect(() => {
    return () => {
      dataAbortRef.current?.abort();
      conferencesAbortRef.current?.abort();
    };
  }, []);

  const getFilteredData = () => {
    const s = deferredSearch.toLowerCase();
    const filtered = data.filter((item) => {
      if (!item || typeof item !== 'object') return false;
      
      const name = (item.player_name || item.Player || "").toLowerCase();
      const team = (item.team_name || item.Team || "").toLowerCase();
      
      const isPitching = leaderboardType.includes("pitching") || ((leaderboardType === 'situational' || leaderboardType === 'splits') && playerType === 'pitcher');
      const isPlayerData = leaderboardType !== "team";
      const isBattedBall = leaderboardType === "battedball";
      const isBaserunning = leaderboardType === "baserunning";
      
      if (isPlayerData && !isBattedBall && !isBaserunning) {
        if (isPitching) {
          const threshold = item.ip ?? item.IP ?? item.pa_overall ?? 0;
          if (leaderboardType === 'value') {
            if (threshold < minIP) return false;
          } else {
            if (threshold < 1) return false;
          }
        } else {
          const threshold = item.pa ?? item.PA ?? item.pa_overall ?? 0;
          if (leaderboardType === 'value' && threshold < minPA) return false;
          if (leaderboardType !== 'value' && threshold < 1) return false;
        }
      }
      
      if (conference && (item.conference || item.Conference) !== conference) return false;
      if (!(name.includes(s) || team.includes(s))) return false;
      
      if (listId && listPlayerIds.length > 0) {
        const pid = item.player_id || item.Player_ID;
        return pid && listPlayerIds.includes(pid.toString());
      }
      
      return true;
    });
    
    return filtered;
  };

  const getColumns = () => {
    if (leaderboardType === 'situational') {
      return playerType === 'pitcher' ? columnsSituationalPitchers : columnsSituationalBatters;
    }
    if (leaderboardType === 'splits') {
      return playerType === 'pitcher' ? columnsSplitsPitchers : columnsSplitsBatters;
    }
    return COLUMN_MAP[leaderboardType] || COLUMN_MAP.value;
  };

  const isPageLoading = loading || loadingList;
  const isInitializing = !isInitialized;
  const filteredData = getFilteredData();
  const columns = getColumns();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[6%] right-[8%] w-[380px] h-[380px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[12%] left-[6%] w-[520px] h-[520px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-[48%] right-[28%] w-[300px] h-[300px] bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse delay-500" />
        <div className="absolute top-[18%] left-[18%] w-[220px] h-[220px] bg-gradient-to-r from-indigo-400/25 to-purple-400/25 rounded-full blur-xl animate-pulse delay-700" />
      </div>
      
      <div className="container max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 py-16">
        <div className="relative z-10 mb-6">
          <div className="relative overflow-hidden rounded-2xl border border-white/30 bg-white/60 backdrop-blur p-4 sm:p-5 shadow-xl">
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 blur-2xl" />
            <div className="relative z-10 flex items-start gap-3 sm:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex-shrink-0">
                i
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm sm:text-base font-semibold text-gray-800 mb-1 truncate">Stats & Rankings</div>
                <div className="text-xs sm:text-sm text-gray-600">Explore comprehensive player statistics and rankings across all divisions. Track performance metrics, situational stats, baserunning, and advanced analytics with up-to-date leaderboards.</div>
              </div>
            </div>
          </div>
        </div>

        <div id="controls" className="relative z-10 mb-6">
          <DataControls
              dataType={leaderboardType}
              selectedYears={selectedYears}
              minPA={minPA}
              minIP={minIP}
              playerType={playerType}
              searchTerm={searchTerm}
              conference={conference}
              division={division}
              selectedListId={listId}
              setDataType={setLeaderboardType}
              setSelectedYears={setSelectedYears}
              setMinPA={setMinPA}
              setMinIP={setMinIP}
              setPlayerType={setPlayerType}
              setSearchTerm={setSearchTerm}
              setConference={setConference}
              setDivision={setDivision}
              setSelectedListId={setListId}
              conferences={conferences}
              allowedDataTypes={LEADERBOARD_TYPES.map(t => t.id)}
              onApplyFilters={fetchData}
            />
        </div>

        <div className="relative z-10">
          {isInitializing ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600">Initializing...</p>
            </div>
          ) : error && showError ? (
            <div className="text-center py-12">
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6 max-w-2xl mx-auto">
                <ErrorDisplay 
                  error={{ message: error, status: 0 }} 
                  context={{ division, leaderboardType }} 
                  onRetry={fetchData} 
                  onSwitchToDivision3={null} 
                />
              </div>
            </div>
          ) : leaderboardType === 'rolling' ? (
            <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
              <RollingLeaderboard 
                division={division}
                conference={conference}
                searchTerm={searchTerm}
                selectedListId={listId}
                selectedListPlayerIds={listPlayerIds}
                isLoadingPlayerList={loadingList}
                playerType={playerType}
              />
            </div>
          ) : (
            <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="relative">
                {isPageLoading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center rounded-lg">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="text-sm text-gray-600">Loading data...</p>
                    </div>
                  </div>
                )}

                {filteredData.length === 0 && !isPageLoading ? (
                  <div className="text-center py-6 sm:py-12">
                    <p className="text-gray-500 text-base sm:text-lg">
                      No data found for the current filters.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <BaseballTable 
                      data={Array.isArray(filteredData) ? filteredData.filter(item => item && typeof item === 'object') : []} 
                      columns={columns} 
                      filename={`${leaderboardType}_${selectedYears.join("-")}.csv`} 
                      stickyColumns={[0, 1]} 
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboards;
