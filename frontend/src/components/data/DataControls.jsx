import React, { useCallback, useMemo, useState, useEffect } from "react";
import debounce from "lodash/debounce";
import { Search, Check, X, Plus, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PlayerListManager from "../../managers/PlayerListManager";
import DatePicker from "./DatePicker";
import { DATA_TYPES, DIVISIONS, YEARS, getDataTypeConfig } from "../../config/dataControlsConfig";

const DataControls = ({
  dataType,
  setDataType,
  selectedYears = [],
  setSelectedYears = () => {},
  startYear = null,
  endYear = null,
  setStartYear = () => {},
  setEndYear = () => {},
  yearSelectionMode = "multi", // "multi" | "range"
  currentDate = null,
  setCurrentDate = () => {},
  minPA = 0,
  setMinPA = () => {},
  minIP = 0,
  setMinIP = () => {},
  playerType = "batter",
  setPlayerType = () => {},
  searchTerm = "",
  setSearchTerm = () => {},
  conference = "",
  setConference = () => {},
  conferences = [],
  division = 3,
  setDivision = () => {},
  selectedListId = "",
  setSelectedListId = () => {},
  allowedDataTypes = null,
  onApplyFilters = () => {},
  currentData = [],
  onAddToPlayerList = () => {},
  columns = [],
}) => {
  const navigate = useNavigate();
  const [tempYears, setTempYears] = useState(selectedYears);
  const [tempStartYear, setTempStartYear] = useState(startYear);
  const [tempEndYear, setTempEndYear] = useState(endYear);
  const [tempDivision, setTempDivision] = useState(division);
  const [tempConference, setTempConference] = useState(conference);
  const [tempMinPA, setTempMinPA] = useState(minPA === 0 ? "" : minPA);
  const [tempMinIP, setTempMinIP] = useState(minIP === 0 ? "" : minIP);
  const [tempPlayerType, setTempPlayerType] = useState(playerType);
  const [playerLists, setPlayerLists] = useState([]);
  const [loadingPlayerLists, setLoadingPlayerLists] = useState(false);

  const filteredDataTypes = useMemo(() => {
    if (!allowedDataTypes) return DATA_TYPES;
    return DATA_TYPES.filter(type => allowedDataTypes.includes(type.id));
  }, [allowedDataTypes]);

  const dataTypeConfig = useMemo(() => {
    return getDataTypeConfig(dataType);
  }, [dataType]);

  useEffect(() => {
    const fetchPlayerLists = async () => {
      if (!dataTypeConfig.hasPlayerList) return;
      
      setLoadingPlayerLists(true);
      try {
        const lists = await PlayerListManager.getUserPlayerLists();
        setPlayerLists(lists);
      } catch (error) {
        console.error('Error fetching player lists:', error);
        setPlayerLists([]);
      } finally {
        setLoadingPlayerLists(false);
      }
    };

    fetchPlayerLists();
  }, [dataTypeConfig.hasPlayerList]);

  const handleDataTypeChange = useCallback((typeId) => {
    setDataType(typeId);
    if (!typeId.includes("player")) {
      setSelectedListId("");
    }
    const newConfig = getDataTypeConfig(typeId);
    if (!newConfig.hasSearch) {
      setSearchTerm("");
    }
  }, [setDataType, setSelectedListId, setSearchTerm]);

  const handleYearToggle = useCallback((year) => {
    let newYears;
    if (dataTypeConfig.multiYear) {
      newYears = tempYears.includes(year)
        ? tempYears.filter((y) => y !== year)
        : [...tempYears, year];
      if (newYears.length > 0) {
        setTempYears(newYears);
        if (!dataTypeConfig.hasApplyFilters) {
          setSelectedYears(newYears);
        }
      }
    } else {
      newYears = [year];
      setTempYears(newYears);
      if (!dataTypeConfig.hasApplyFilters) {
        setSelectedYears(newYears);
      }
    }
  }, [tempYears, dataTypeConfig.multiYear, dataTypeConfig.hasApplyFilters, setSelectedYears]);

  const handleStartYearChange = useCallback((e) => {
    const y = Number(e.target.value);
    setTempStartYear(y);
    if (!dataTypeConfig.hasApplyFilters) {
      setStartYear(y);
    }
  }, [dataTypeConfig.hasApplyFilters, setStartYear]);

  const handleEndYearChange = useCallback((e) => {
    const y = Number(e.target.value);
    setTempEndYear(y);
    if (!dataTypeConfig.hasApplyFilters) {
      setEndYear(y);
    }
  }, [dataTypeConfig.hasApplyFilters, setEndYear]);

  const handleApplyFilters = useCallback(() => {
    if (yearSelectionMode === "range") {
      setStartYear(tempStartYear);
      setEndYear(tempEndYear);
    } else {
      setSelectedYears(tempYears);
    }
    setDivision(tempDivision);
    setConference(tempConference);
    setMinPA(tempMinPA === "" ? 0 : tempMinPA);
    setMinIP(tempMinIP === "" ? 0 : tempMinIP);
    setPlayerType(tempPlayerType);
    onApplyFilters();
  }, [yearSelectionMode, tempStartYear, tempEndYear, tempYears, tempDivision, tempConference, tempMinPA, tempMinIP, tempPlayerType, setStartYear, setEndYear, setSelectedYears, setDivision, setConference, setMinPA, setMinIP, setPlayerType, onApplyFilters]);

  const handleReset = useCallback(() => {
    setTempYears(selectedYears);
    setTempStartYear(startYear);
    setTempEndYear(endYear);
    setTempDivision(division);
    setTempConference(conference);
    setTempMinPA(minPA === 0 ? "" : minPA);
    setTempMinIP(minIP === 0 ? "" : minIP);
    setTempPlayerType(playerType);
  }, [selectedYears, startYear, endYear, division, conference, minPA, minIP, playerType]);

  const hasChanges = useMemo(() => {
    const normalizedTempMinPA = tempMinPA === "" ? 0 : tempMinPA;
    const normalizedTempMinIP = tempMinIP === "" ? 0 : tempMinIP;
    if (tempDivision !== division || tempConference !== conference || 
        normalizedTempMinPA !== minPA || normalizedTempMinIP !== minIP || tempPlayerType !== playerType) {
      return true;
    }
    if (yearSelectionMode === "range") {
      if (tempStartYear !== startYear || tempEndYear !== endYear) return true;
      return false;
    }
    if (tempYears.length !== selectedYears.length) {
      return true;
    }
    const sortedTemp = [...tempYears].sort();
    const sortedSelected = [...selectedYears].sort();
    return sortedTemp.some((year, index) => year !== sortedSelected[index]);
  }, [yearSelectionMode, tempStartYear, startYear, tempEndYear, endYear, tempYears, selectedYears, tempDivision, division, tempConference, conference, tempMinPA, minPA, tempMinIP, minIP, tempPlayerType, playerType]);

  const [localSearch, setLocalSearch] = useState(searchTerm);

  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  const debouncedSetSearch = useMemo(
    () => debounce((value) => setSearchTerm(value), 200),
    [setSearchTerm]
  );

  useEffect(() => {
    return () => {
      if (debouncedSetSearch.cancel) debouncedSetSearch.cancel();
    };
  }, [debouncedSetSearch]);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setLocalSearch(value);
    debouncedSetSearch(value);
  }, [debouncedSetSearch]);

  const handleDivisionChange = useCallback((e) => {
    const newDivision = Number(e.target.value);
    setTempDivision(newDivision);
    if (!dataTypeConfig.hasApplyFilters) {
      setDivision(newDivision);
    }
  }, [dataTypeConfig.hasApplyFilters, setDivision]);

  const handleDateChange = useCallback((date) => {
    setCurrentDate(date);
  }, [setCurrentDate]);

  const handleConferenceChange = useCallback((e) => {
    setTempConference(e.target.value);
  }, []);

  const handleMinPAChange = useCallback((e) => {
    const value = e.target.value;
    if (value === "") {
      setTempMinPA("");
    } else {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        setTempMinPA(numValue);
      }
    }
  }, []);

  const handleMinIPChange = useCallback((e) => {
    const value = e.target.value;
    if (value === "") {
      setTempMinIP("");
    } else {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        setTempMinIP(numValue);
      }
    }
  }, []);

  const handleListIdChange = useCallback((e) => {
    setSelectedListId(e.target.value);
  }, [setSelectedListId]);

  const handleExport = useCallback(() => {
    if (!currentData || currentData.length === 0 || !columns || columns.length === 0) return;

    // Filter columns that have selectors and names (skip action columns)
    const exportableColumns = columns.filter(col => col.selector && col.name && col.name.trim() !== "");

    if (exportableColumns.length === 0) return;

    // Helper function to extract field name from selector function
    const getFieldName = (selector) => {
      if (typeof selector !== 'function') return null;
      
      // Convert function to string and try to extract the field name
      const funcStr = selector.toString();
      
      // Match patterns like: (row) => row.field_name, row => row.field_name, (row) => row.field_name?.something
      const match = funcStr.match(/=>\s*row\.(\w+)/) || funcStr.match(/row\.(\w+)/);
      if (match && match[1]) {
        return match[1];
      }
      
      // Fallback: try to find property access patterns
      const propertyMatch = funcStr.match(/\[['"](\w+)['"]\]/) || funcStr.match(/\.(\w+)(?:[^.]|$)/);
      if (propertyMatch && propertyMatch[1]) {
        return propertyMatch[1];
      }
      
      return null;
    };

    // Create CSV headers using actual field names
    const headers = exportableColumns.map(col => {
      const fieldName = getFieldName(col.selector);
      return fieldName || col.name.toLowerCase().replace(/\s+/g, '_');
    });

    // Create CSV rows using selectors
    const rows = currentData.map(row => 
      exportableColumns.map(col => {
        try {
          const value = col.selector(row);
          // Handle null/undefined values
          if (value === null || value === undefined) return '';
          // Handle strings that might contain commas or quotes
          if (typeof value === 'string') {
            return `"${value.replace(/"/g, '""')}"`;
          }
          // Handle numbers and other types
          return String(value);
        } catch (error) {
          console.error(`Error exporting column ${col.name}:`, error);
          return '';
        }
      })
    );

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const filename = `${dataType}_${selectedYears.join("-") || new Date().getFullYear()}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [currentData, columns, dataType, selectedYears]);

  // derived flag not used here; computing it triggers warnings. Remove unused.

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 space-y-4 mb-4">
      {filteredDataTypes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:-mx-4 sm:px-4 sm:pb-2 md:mx-0 md:px-0 md:pb-0 scrollbar-hide">
          {filteredDataTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleDataTypeChange(type.id)}
              className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0
                ${
                  dataType === type.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      )}

      {dataTypeConfig.hasYears && (
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
            <span className="text-xs lg:text-sm font-medium text-gray-700">
              {dataTypeConfig.yearLabel}
            </span>
            {yearSelectionMode === "range" ? (
              <div className="flex items-center gap-2">
                <select
                  value={tempStartYear ?? ""}
                  onChange={handleStartYearChange}
                  className="px-2 py-1.5 bg-white border border-gray-200 rounded-md text-xs lg:text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-colors"
                >
                  {YEARS.map((y) => (
                    <option key={`start-${y}`} value={y}>{y}</option>
                  ))}
                </select>
                <span className="text-gray-500 text-sm">to</span>
                <select
                  value={tempEndYear ?? ""}
                  onChange={handleEndYearChange}
                  className="px-2 py-1.5 bg-white border border-gray-200 rounded-md text-xs lg:text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-colors"
                >
                  {YEARS.map((y) => (
                    <option key={`end-${y}`} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:-mx-4 sm:px-4 sm:pb-2 md:mx-0 md:px-0 md:pb-0 scrollbar-hide">
                {YEARS.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearToggle(year)}
                    className={`px-3 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors flex-shrink-0 ${
                      tempYears.includes(year)
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {dataTypeConfig.hasSearch && (
          <div className="w-full flex gap-2">
            <div className="relative w-200">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={localSearch}
                onChange={handleSearchChange}
                placeholder={dataTypeConfig.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm text-gray-700
                  focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                  hover:border-gray-300 transition-colors"
              />
            </div>
            {dataTypeConfig.hasDivision && (
            <div className="flex items-center gap-2">
              <label className="text-xs lg:text-sm font-medium text-gray-700 whitespace-nowrap hidden sm:block">
                Division:
              </label>
              <select
                  value={tempDivision}
                  onChange={handleDivisionChange}
                className="px-2 py-1.5 bg-white border border-gray-200 rounded-md text-xs lg:text-sm text-gray-700
                  focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                  hover:border-gray-300 transition-colors"
              >
                  {DIVISIONS.map((div) => (
                  <option key={div.value} value={div.value}>
                    {div.label}
                  </option>
                ))}
              </select>
            </div>
            )}
             <button
               onClick={() => navigate('/player-lists')}
               className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
             >
               <Plus size={14} className="text-gray-600" />
               <span className="hidden sm:inline">Create player list</span>
             </button>
             {currentData && currentData.length > 0 && columns && columns.length > 0 && (
               <button
                 onClick={handleExport}
                 className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                 title="Export data to CSV"
               >
                 <Download size={14} className="text-gray-600" />
                 <span className="hidden sm:inline">Export</span>
               </button>
             )}
           </div>
         )}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {dataTypeConfig.hasPlayerType && (
          <div className="flex items-center gap-2">
            <label className="text-xs lg:text-sm font-medium text-gray-700 whitespace-nowrap">
              View:
            </label>
            <div className="inline-flex bg-gray-100 rounded-md" role="group">
              <button
                type="button"
                onClick={() => setTempPlayerType("batter")}
                className={`px-3 py-1.5 text-xs lg:text-sm font-medium rounded-l-md ${
                  tempPlayerType === "batter" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Batters
              </button>
              <button
                type="button"
                onClick={() => setTempPlayerType("pitcher")}
                className={`px-3 py-1.5 text-xs lg:text-sm font-medium rounded-r-md ${
                  tempPlayerType === "pitcher" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pitchers
              </button>
            </div>
          </div>
          )}
          {dataTypeConfig.hasDate && (
            <DatePicker
              value={currentDate}
              onChange={handleDateChange}
              label={dataTypeConfig.dateLabel || "Date:"}
            />
          )}
          {dataTypeConfig.hasDivision && !dataTypeConfig.hasSearch && (
          <div className="flex items-center gap-2">
            <label className="text-xs lg:text-sm font-medium text-gray-700 whitespace-nowrap">
              Division:
            </label>
            <select
                value={tempDivision}
                onChange={handleDivisionChange}
              className="px-2 py-1.5 bg-white border border-gray-200 rounded-md text-xs lg:text-sm text-gray-700
                focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                hover:border-gray-300 transition-colors"
            >
                {DIVISIONS.map((div) => (
                <option key={div.value} value={div.value}>
                  {div.label}
                </option>
              ))}
            </select>
          </div>
          )}

          {dataTypeConfig.hasConference && (
          <div className="flex items-center gap-2">
            <label className="text-xs lg:text-sm font-medium text-gray-700 whitespace-nowrap">
              Conference:
            </label>
            <select
                value={tempConference}
                onChange={handleConferenceChange}
              className="px-2 py-1.5 bg-white border border-gray-200 rounded-md text-xs lg:text-sm text-gray-700
                focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                hover:border-gray-300 transition-colors"
            >
              <option value="">All Conferences</option>
              {Array.isArray(conferences) && conferences.map((conf, index) => (
                <option key={`${conf}-${index}`} value={conf}>
                  {conf}
                </option>
              ))}
            </select>
          </div>
          )}

          {dataTypeConfig.hasPlayerList && (
            <div className="flex items-center gap-2">
              <label className="text-xs lg:text-sm font-medium text-gray-700 whitespace-nowrap">
                Player List:
              </label>
              <select
                value={selectedListId}
                onChange={handleListIdChange}
                disabled={loadingPlayerLists}
                className="px-2 py-1.5 bg-white border border-gray-200 rounded-md text-xs lg:text-sm text-gray-700
                  focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                  hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">All Players</option>
                {playerLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(dataTypeConfig.hasMinPA && (!dataTypeConfig.hasPlayerType || tempPlayerType === "batter")) && (
            <div className="flex items-center gap-2">
              <label className="text-xs lg:text-sm font-medium text-gray-700 whitespace-nowrap">
                {dataType === "battedball" ? "Min Count:" : "Min PA:"}
              </label>
              <input
                type="number"
                value={tempMinPA === "" ? "" : tempMinPA}
                onChange={handleMinPAChange}
                min="0"
                step="1"
                className="w-16 px-2 py-1.5 bg-white border border-gray-200 rounded-md text-xs lg:text-sm text-gray-700
                  focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                  hover:border-gray-300 transition-colors"
              />
            </div>
          )}

          {((dataTypeConfig.hasMinIP && (!dataTypeConfig.hasPlayerType || tempPlayerType === "pitcher")) ||
            (dataTypeConfig.hasPlayerType && (dataType === "situational" || dataType === "splits") && tempPlayerType === "pitcher")) && (
            <div className="flex items-center gap-2">
              <label className="text-xs lg:text-sm font-medium text-gray-700 whitespace-nowrap">
                Min IP:
              </label>
              <input
                type="number"
                value={tempMinIP === "" ? "" : tempMinIP}
                onChange={handleMinIPChange}
                min="0"
                step="1"
                className="w-16 px-2 py-1.5 bg-white border border-gray-200 rounded-md text-xs lg:text-sm text-gray-700
                  focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                  hover:border-gray-300 transition-colors"
              />
            </div>
          )}
        </div>
      </div>

      {hasChanges && dataTypeConfig.hasApplyFilters && (
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
          >
            <X size={14} />
            Reset
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <Check size={14} />
            Apply Filters
          </button>
        </div>
      )}

    </div>
  );
};

export default DataControls;