import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useDeferredValue } from "react";
import debounce from "lodash/debounce";
import { BaseballTable } from "../components/tables/BaseballTable";
import DataControls from "../components/data/DataControls";
import ErrorDisplay from "../components/alerts/ErrorDisplay";
import { fetchAPI } from "../config/api";
import { getGutsColumns } from "../config/gutsColumns";
import { getParkFactorsColumns } from "../config/parkFactorsColumns";
import { getExpectedRunsColumns } from "../config/expectedRunsColumns";
import { getErrorMessage } from "../utils/errorUtils";

const DEFAULT_DIVISION = 3;

const ENDPOINT_MAP = {
  guts: "/api/guts",
  park_factors: "/api/park_factors",
  expected_runs: "/api/expected_runs",
};

const COLUMN_MAP = {
  guts: getGutsColumns,
  park_factors: getParkFactorsColumns,
  expected_runs: getExpectedRunsColumns,
};

const Guts = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [dataType, setDataType] = useState(searchParams.get("dataType") || "guts");
  const [selectedYears, setSelectedYears] = useState([2025]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [division, setDivision] = useState(Number(searchParams.get("division")) || DEFAULT_DIVISION);

  const deferredSearch = useDeferredValue(searchTerm);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showError, setShowError] = useState(false);

  const dataAbortRef = useRef(null);
  const mounted = useRef(false);

  const updateParams = useMemo(
    () =>
      debounce((state) => {
        const params = new URLSearchParams();
        params.set("dataType", state.dataType);
        params.set("division", state.division.toString());
        params.set("search", state.searchTerm);

        const newParams = params.toString();
        const currentParams = searchParams.toString();

        if (newParams !== currentParams) {
          setSearchParams(params);
        }
      }, 300),
    [setSearchParams, searchParams]
  );

  const fetchData = useCallback(async () => {
    dataAbortRef.current?.abort();
    const controller = new AbortController();
    dataAbortRef.current = controller;
    
    setLoading(true);
    setError(null);
    setShowError(false);
    
    try {
      const params = new URLSearchParams();
      
      if (dataType === "park_factors") {
        params.set("division", division.toString());
      } else if (dataType === "expected_runs") {
        params.set("division", division.toString());
        params.set("year", selectedYears[0]?.toString() || "2025");
      }
      
      const endpoint = ENDPOINT_MAP[dataType] || ENDPOINT_MAP.guts;
      const url = params.toString() ? `${endpoint}?${params}` : endpoint;
      
      const result = await fetchAPI(url, { signal: controller.signal });
      const rows = Array.isArray(result) ? result : [];
      
      if (!controller.signal.aborted) {
        setData(rows);
        setError(null);
        setShowError(false);
        setIsInitialized(true);
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
  }, [division, dataType, selectedYears]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    updateParams({ dataType, division, searchTerm });
  }, [dataType, division, searchTerm, updateParams]);

  useEffect(() => {
    if (!mounted.current) return;
    fetchData();
  }, [dataType, division, searchTerm, selectedYears, fetchData]);

  useEffect(() => {
    return () => {
      dataAbortRef.current?.abort();
    };
  }, []);

  const filteredData = useMemo(() => {
    const s = deferredSearch.toLowerCase();
    return data.filter((item) => {
      if (!item || typeof item !== 'object') return false;
      
      const teamName = (item.team_name || item.team || item.name || "").toLowerCase();
      const year = (item.year || item.Year || "").toString();
      
      if (!(teamName.includes(s) || year.includes(s))) return false;
      
      return true;
    });
  }, [data, deferredSearch]);

  const columns = useMemo(() => {
    const getColumns = COLUMN_MAP[dataType] || COLUMN_MAP.guts;
    return getColumns();
  }, [dataType]);

  const isPageLoading = loading;
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
                <div className="text-sm sm:text-base font-semibold text-gray-800 mb-1 truncate">Advanced Analytics & Metrics</div>
                <div className="text-xs sm:text-sm text-gray-600">Explore comprehensive team and player analytics including division-level constants, park factors, and expected run matrices.</div>
              </div>
            </div>
          </div>
        </div>
        
        <div id="controls" className="relative z-10 mb-6">
          <DataControls
              dataType={dataType}
              selectedYears={selectedYears}
              minPA={0}
              minIP={0}
              searchTerm={searchTerm}
              conference=""
              division={division}
              selectedListId=""
              setDataType={setDataType}
              setSelectedYears={setSelectedYears}
              setMinPA={() => {}}
              setMinIP={() => {}}
              setSearchTerm={setSearchTerm}
              setConference={() => {}}
              setDivision={setDivision}
              setSelectedListId={() => {}}
              conferences={[]}
              allowedDataTypes={["guts", "park_factors", "expected_runs"]}
              onApplyFilters={() => {}}
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
                  context={{ division, dataType }} 
                  onRetry={fetchData} 
                  onSwitchToDivision3={null} 
                />
              </div>
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
              
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
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
                      filename={`${dataType}_${division}.csv`} 
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

export default React.memo(Guts);