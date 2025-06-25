import React, { useState, useEffect } from "react";
import {
  Search,
  BookOpen,
  ListPlus,
  FileBox,
  ChevronDown,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import PlayerListManager from "../../managers/PlayerListManager";
import { useNavigate } from "react-router-dom";
import ExportButton from "../buttons/ExportButton";

const dataTypes = [
  { id: "player_hitting", label: "Player Hitting" },
  { id: "player_pitching", label: "Player Pitching" },
  { id: "team_hitting", label: "Team Hitting" },
  { id: "team_pitching", label: "Team Pitching" },
];

const pitchingQualifiers = [
  { label: "No Minimum", value: 0 },
  { label: "Relief (10 IP)", value: 10 },
  { label: "Spot Starter (20 IP)", value: 20 },
  { label: "Part-Time (30 IP)", value: 30 },
  { label: "Qualified (1 IP/Team Game)", value: 40 },
];

const hittingQualifiers = [
  { label: "No Minimum", value: 0 },
  { label: "Pinch Hitter (20 PA)", value: 20 },
  { label: "Part-Time (50 PA)", value: 50 },
  { label: "Semi-Regular (100 PA)", value: 100 },
  { label: "Regular (150 PA)", value: 150 },
  { label: "Qualified (2.5 PA/Team Game)", value: 200 },
];

const divisions = [
  { label: "Division 1", value: 1 },
  { label: "Division 2", value: 2 },
  { label: "Division 3", value: 3 },
];

const DataControls = ({
  dataType,
  setDataType,
  selectedYears,
  setSelectedYears,
  minPA,
  setMinPA,
  minIP,
  setMinIP,
  searchTerm,
  setSearchTerm,
  conference,
  setConference,
  conferences,
  division = 3,
  setDivision,
  isPremiumUser = false,
  selectedListId,
  setSelectedListId,
  exportData,
  exportFilename,
  showExportButton = false,
}) => {
  const [playerLists, setPlayerLists] = useState([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlayerLists = async () => {
      if (!dataType.includes("player")) return;

      try {
        setIsLoadingLists(true);
        const lists = await PlayerListManager.getUserPlayerLists();
        setPlayerLists(lists);
      } catch (err) {
        console.error("Failed to load player lists:", err);
      } finally {
        setIsLoadingLists(false);
      }
    };

    fetchPlayerLists();
  }, [dataType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (showListDropdown) {
      const handleClickOutside = (event) => {
        if (!event.target.closest(".player-list-dropdown")) {
          setShowListDropdown(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showListDropdown]);

  const QualifierFilter = () => {
    if (!dataType.includes("player")) return null;

    const isPitching = dataType === "player_pitching";
    const value = isPitching ? minIP : minPA;
    const setValue = isPitching ? setMinIP : setMinPA;
    const qualifiers = isPitching ? pitchingQualifiers : hittingQualifiers;

    return (
      <div className="w-full">
        <div className="flex items-center gap-2">
          <label className="text-xs lg:text-sm font-medium text-gray-700 whitespace-nowrap">
            {isPitching ? "IP Qualifier" : "PA Qualifier"}:
          </label>
          <select
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="flex-1 px-2 py-1.5 bg-white border border-gray-200 rounded-md text-xs lg:text-sm text-gray-700
              focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
              hover:border-gray-300 transition-colors"
          >
            {qualifiers.map((qualifier) => (
              <option key={qualifier.value} value={qualifier.value}>
                {qualifier.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const getSelectedListName = () => {
    if (!selectedListId) return "All Players";
    const list = playerLists.find((list) => list.id === selectedListId);
    return list ? list.name : "All Players";
  };

  const clearSelectedList = () => {
    setSelectedListId("");
  };

  const renderPlayerListSelector = () => {
    if (!dataType.includes("player")) return null;

    return (
      <div className="w-full player-list-dropdown relative">
        <div className="flex items-center gap-2">
          <label className="text-xs lg:text-sm font-medium text-gray-700 whitespace-nowrap">
            Player List:
          </label>
          <div className="relative flex-1">
            <button
              onClick={() => setShowListDropdown(!showListDropdown)}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs lg:text-sm text-gray-700
                focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                hover:border-gray-300 transition-colors text-ellipsis truncate"
            >
              <div className="flex items-center gap-2">
                <FileBox size={14} className="text-blue-600 flex-shrink-0" />
                <span className="flex-1 text-ellipsis truncate">
                  {isLoadingLists ? "Loading lists..." : getSelectedListName()}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`transition-transform flex-shrink-0 ${
                  showListDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showListDropdown && (
              <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                <div className="p-1">
                  <button
                    onClick={() => {
                      clearSelectedList();
                      setShowListDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs lg:text-sm rounded-md ${
                      !selectedListId
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    All Players
                  </button>

                  {playerLists.length > 0 ? (
                    playerLists.map((list) => (
                      <button
                        key={list.id}
                        onClick={() => {
                          setSelectedListId(list.id);
                          setShowListDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs lg:text-sm rounded-md ${
                          selectedListId === list.id
                            ? "bg-blue-50 text-blue-700"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{list.name}</span>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {list.playerIds?.length || 0} players
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-2 text-xs text-gray-500 text-center">
                      No player lists found
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

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 space-y-4 mb-4">
      {/* Data Type Tabs - Horizontally scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:-mx-4 sm:px-4 sm:pb-2 md:mx-0 md:px-0 md:pb-0 scrollbar-hide">
        {dataTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => {
              setDataType(type.id);
              if (!type.id.includes("player")) {
                setSelectedListId(""); // Clear player list when switching to team data
              }
            }}
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

      {/* Years and Documentation */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          <span className="text-xs lg:text-sm font-medium text-gray-700">
            Years to include:
          </span>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:-mx-4 sm:px-4 sm:pb-2 md:mx-0 md:px-0 md:pb-0 scrollbar-hide">
            {[2025, 2024, 2023, 2022, 2021].map((year) => (
              <button
                key={year}
                onClick={() => {
                  const newYears = selectedYears.includes(year)
                    ? selectedYears.filter((y) => y !== year)
                    : [...selectedYears, year];
                  if (newYears.length > 0) setSelectedYears(newYears);
                }}
                className={`px-3 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors flex-shrink-0
                  ${
                    selectedYears.includes(year)
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50 border border-gray-200"
                  }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-1 md:mt-0 md:ml-auto">
          {showExportButton && exportData && (
            <ExportButton
              data={exportData}
              filename={exportFilename}
            />
          )}
          <Link
            to="/documentation"
            className="flex items-center gap-2 text-xs lg:text-sm text-blue-600 hover:text-blue-700"
          >
            <BookOpen size={16} className="flex-shrink-0" />
            <span>View Statistics Guide</span>
          </Link>
        </div>
      </div>

      {/* Mobile: Show/Hide filters toggle */}
      <div className="md:hidden">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full flex justify-center items-center gap-2 py-2 bg-gray-50 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {showMobileFilters ? (
            <>
              <X size={16} />
              Hide Filters
            </>
          ) : (
            <>
              <Search size={16} />
              Show Filters
            </>
          )}
        </button>
      </div>

      {/* Filters section - conditionally shown on mobile */}
      <div
        className={`${
          showMobileFilters ? "block" : "hidden"
        } md:block space-y-3`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap items-start lg:items-center gap-3 lg:gap-6">
          {/* Division Filter - Only shown for premium users */}
          {isPremiumUser && (
            <div className="w-full sm:col-span-1">
              <div className="flex items-center gap-2">
                <label className="text-xs lg:text-sm font-medium text-gray-700 whitespace-nowrap">
                  Division:
                </label>
                <select
                  value={division}
                  onChange={(e) => setDivision(Number(e.target.value))}
                  className="flex-1 px-2 py-1.5 bg-white border border-gray-200 rounded-md text-xs lg:text-sm text-gray-700
                    focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                    hover:border-gray-300 transition-colors"
                >
                  {divisions.map((div) => (
                    <option key={div.value} value={div.value}>
                      {div.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Conference Filter */}
          <div className="w-full sm:col-span-1">
            <div className="flex items-center gap-2">
              <label className="text-xs lg:text-sm font-medium text-gray-700 whitespace-nowrap">
                Conference:
              </label>
              <select
                value={conference}
                onChange={(e) => setConference(e.target.value)}
                className="flex-1 px-2 py-1.5 bg-white border border-gray-200 rounded-md text-xs lg:text-sm text-gray-700
                  focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                  hover:border-gray-300 transition-colors"
              >
                <option value="">All Conferences</option>
                {conferences.map((conf) => (
                  <option key={conf} value={conf}>
                    {conf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Qualifier Filter */}
          <QualifierFilter />

          {/* Search Input - Full width on mobile, auto width on larger screens */}
          <div className="w-full lg:flex-1 lg:max-w-md">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${
                  dataType.includes("player") ? "players" : "teams"
                }...`}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-xs lg:text-sm
                  focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Player Lists Actions - Stack on mobile, row on larger screens */}
      {dataType.includes("player") && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
          {/* Player List Selector */}
          <div className="sm:order-1 sm:flex-1 lg:flex-initial lg:min-w-64">
            {renderPlayerListSelector()}
          </div>

          {/* Create Player List Button */}
          <button
            onClick={() => navigate("/player-lists")}
            className="px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-colors whitespace-nowrap
              text-blue-600 hover:bg-blue-50 border border-blue-200 flex items-center justify-center sm:justify-start gap-1"
          >
            <ListPlus size={16} className="flex-shrink-0" />
            Create Player List
          </button>
        </div>
      )}
    </div>
  );
};

export default DataControls;
