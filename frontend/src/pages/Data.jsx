import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useDeferredValue } from "react";
import debounce from "lodash/debounce";
import { BaseballTable } from "../components/tables/BaseballTable";
import DataControls from "../components/data/DataControls";
import ErrorDisplay from "../components/alerts/ErrorDisplay";
import { fetchAPI } from "../config/api";
import { getBattingColumns } from "../config/battingColumns";
import { getPitchingColumns } from "../config/pitchingColumns";
import { getTeamBattingColumns } from "../config/teamBattingColumns";
import { getTeamPitchingColumns } from "../config/teamPitchingColumns";
import PlayerListManager from "../managers/PlayerListManager";
import { getErrorMessage } from "../utils/errorUtils";
import { DEFAULT_YEAR, DEFAULT_DIVISION } from "../config/constants";

const DEFAULT_MIN_PA = 50;

const ENDPOINT_MAP = {
  player_batting: "/api/batting",
  player_pitching: "/api/pitching",
  team_batting: "/api/batting_team",
  team_pitching: "/api/pitching_team",
};

const COLUMN_MAP = {
  player_batting: getBattingColumns,
  player_pitching: getPitchingColumns,
  team_batting: getTeamBattingColumns,
  team_pitching: getTeamPitchingColumns,
};

const Data = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialYears = useMemo(() => {
    const yearsParam = searchParams.get("years");
    if (yearsParam) {
      const years = yearsParam.split(',').map(Number).filter((y) => !Number.isNaN(y));
      if (years.length) return years;
    }
    const single = Number(searchParams.get("year"));
    return !Number.isNaN(single) && single ? [single] : [DEFAULT_YEAR];
  }, [searchParams]);

  const [dataType, setDataType] = useState(searchParams.get("dataType") || "player_batting");
  const [selectedYears, setSelectedYears] = useState(initialYears);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [minPA, setMinPA] = useState(Number(searchParams.get("minPA")) || DEFAULT_MIN_PA);
  const [minIP, setMinIP] = useState(Number(searchParams.get("minIP")) || 10);
  const [division, setDivision] = useState(Number(searchParams.get("division")) || DEFAULT_DIVISION);
  const [conference, setConference] = useState(searchParams.get("conference") || "");
  const [listId, setListId] = useState(searchParams.get("listId") || "");

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

  const updateParams = useMemo(
    () =>
      debounce((state) => {
        const params = new URLSearchParams();
        params.set("dataType", state.dataType);
        params.set("years", state.selectedYears.join(','));
        params.set("search", state.searchTerm);
        params.set("minPA", state.minPA.toString());
        params.set("minIP", state.minIP.toString());
        params.set("division", state.division.toString());
        if (state.conference) params.set("conference", state.conference);
        if (state.listId && state.dataType.includes("player")) params.set("listId", state.listId);

        const newParams = params.toString();
        const currentParams = searchParams.toString();

        if (newParams !== currentParams) {
          setSearchParams(params);
        }
      }, 300),
    [setSearchParams, searchParams]
  );

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    updateParams({ dataType, selectedYears, searchTerm, minPA, minIP, division, conference, listId });
  }, [dataType, selectedYears, searchTerm, minPA, minIP, division, conference, listId, updateParams]);

  const fetchPlayerList = useCallback(async () => {
    if (!listId || !dataType.includes("player")) {
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
  }, [listId, dataType]);

  useEffect(() => {
    fetchPlayerList();
  }, [fetchPlayerList]);

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
  }, [fetchConferences]);

  const fetchData = useCallback(async () => {
    if (!selectedYears.length) return;
    
    dataAbortRef.current?.abort();
    const controller = new AbortController();
    dataAbortRef.current = controller;
    
    setLoading(true);
    setError(null);
    setShowError(false);
    
    try {
      const params = new URLSearchParams();
      params.set("division", division.toString());
      params.set("years", selectedYears.join(','));
      
      const endpoint = ENDPOINT_MAP[dataType] || ENDPOINT_MAP.player_batting;
      const result = await fetchAPI(`${endpoint}?${params}`, { signal: controller.signal });
      const rows = Array.isArray(result?.items) ? result.items : Array.isArray(result) ? result : [];
      
      if (!controller.signal.aborted) {
        setData(rows);
        setError(null);
        setShowError(false);
      }
    } catch (err) {
      if (err.name !== "AbortError" && !controller.signal.aborted) {
        console.error('Error fetching data:', err);
        const errorMessage = getErrorMessage(err, { division, dataType });
        setError(errorMessage);
        setShowError(true);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [selectedYears, division, dataType]);

  useEffect(() => {
    if (!mounted.current || !isInitialized) return;
    fetchData();
  }, [fetchData, isInitialized]);

  useEffect(() => {
    return () => {
      dataAbortRef.current?.abort();
      conferencesAbortRef.current?.abort();
    };
  }, []);

  const filteredData = useMemo(() => {
    const s = deferredSearch.toLowerCase();
    return data.filter((item) => {
      if (!item || typeof item !== 'object') return false;
      
      const name = (item.player_name || item.Player || "").toLowerCase();
      const team = (item.team_name || item.Team || "").toLowerCase();
      
      const isPitching = dataType.includes("pitching");
      const isPlayerData = dataType.includes("player");
      
      if (isPlayerData) {
        const threshold = isPitching ? (item.ip ?? item.IP ?? 0) : (item.pa ?? item.PA ?? 0);
        const minThreshold = isPitching ? minIP : minPA;
        if (threshold < minThreshold) return false;
      }
      
      if (conference && (item.conference || item.Conference) !== conference) return false;
      if (!(name.includes(s) || team.includes(s))) return false;
      
      if (listId && listPlayerIds.length > 0 && dataType.includes("player")) {
        const pid = item.player_id || item.Player_ID;
        return pid && listPlayerIds.includes(pid.toString());
      }
      
      return true;
    });
  }, [data, deferredSearch, minPA, minIP, conference, listId, listPlayerIds, dataType]);

  const columns = useMemo(() => {
    const getColumns = COLUMN_MAP[dataType] || COLUMN_MAP.player_batting;
    return getColumns();
  }, [dataType]);

  const isPageLoading = loading || loadingList;
  const isInitializing = !isInitialized;

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
                <div className="text-sm sm:text-base font-semibold text-gray-800 mb-1 truncate">Stats & Data</div>
                <div className="text-xs sm:text-sm text-gray-600">Explore comprehensive player and team statistics across all divisions. Access up-to-date batting, pitching, and team performance data with advanced filtering and search capabilities.</div>
              </div>
            </div>
          </div>
        </div>
        
        <div id="controls" className="relative z-10 mb-6">
          <DataControls
              dataType={dataType}
              selectedYears={selectedYears}
              minPA={minPA}
              minIP={minIP}
              searchTerm={searchTerm}
              conference={conference}
              division={division}
              selectedListId={listId}
              setDataType={setDataType}
              setSelectedYears={setSelectedYears}
              setMinPA={setMinPA}
              setMinIP={setMinIP}
              setSearchTerm={setSearchTerm}
              setConference={setConference}
              setDivision={setDivision}
              setSelectedListId={setListId}
              conferences={conferences}
              allowedDataTypes={["player_batting", "player_pitching", "team_batting", "team_pitching"]}
              onApplyFilters={fetchData}
              currentData={filteredData}
              columns={columns}
            />
        </div>
        
        <div className="relative z-10">
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 min-h-[400px]">
            {isInitializing ? (
              <div className="flex flex-col justify-center items-center h-64">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm text-gray-600">Initializing...</p>
              </div>
            ) : error && showError ? (
              <div className="text-center py-16">
                <ErrorDisplay 
                  error={{ message: error, status: 0 }} 
                  context={{ division, dataType }} 
                  onRetry={fetchData} 
                  onSwitchToDivision3={null} 
                />
              </div>
            ) : (
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
                      filename={`${dataType}_${selectedYears.join("-")}.csv`} 
                      stickyColumns={[0, 1]} 
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Data);