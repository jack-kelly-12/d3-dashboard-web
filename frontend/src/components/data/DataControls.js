import React from "react";
import { Search, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

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
}) => {
  const QualifierFilter = () => {
    if (!dataType.includes("player")) return null;

    const isPitching = dataType === "player_pitching";
    const value = isPitching ? minIP : minPA;
    const setValue = isPitching ? setMinIP : setMinPA;
    const qualifiers = isPitching ? pitchingQualifiers : hittingQualifiers;

    return (
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">
          {isPitching ? "IP Qualifier" : "PA Qualifier"}:
        </label>
        <select
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-700
            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
            hover:border-gray-300 transition-colors w-44"
        >
          {qualifiers.map((qualifier) => (
            <option key={qualifier.value} value={qualifier.value}>
              {qualifier.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4 mb-4">
      {/* Data Type Tabs */}
      <div className="flex gap-2">
        {dataTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setDataType(type.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
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

      {/* Years Selection */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            Years to include:
          </span>
          <div className="flex gap-2">
            {[2024, 2023, 2022, 2021].map((year) => (
              <button
                key={year}
                onClick={() => {
                  const newYears = selectedYears.includes(year)
                    ? selectedYears.filter((y) => y !== year)
                    : [...selectedYears, year];
                  if (newYears.length > 0) setSelectedYears(newYears);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
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

        <Link
          to="/documentation"
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <BookOpen size={16} />
          <span>View Statistics Guide</span>
        </Link>
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-6">
        {/* Division Filter - Only shown for premium users */}
        {isPremiumUser && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Division:
            </label>
            <select
              value={division}
              onChange={(e) => setDivision(Number(e.target.value))}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-700
                focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                hover:border-gray-300 transition-colors w-32"
            >
              {divisions.map((div) => (
                <option key={div.value} value={div.value}>
                  {div.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Conference Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Conference:
          </label>
          <select
            value={conference}
            onChange={(e) => setConference(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-700
              focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
              hover:border-gray-300 transition-colors w-44"
          >
            <option value="">All Conferences</option>
            {conferences.map((conf) => (
              <option key={conf} value={conf}>
                {conf}
              </option>
            ))}
          </select>
        </div>

        {/* Qualifier Filter */}
        <QualifierFilter />

        {/* Search Input */}
        <div className="relative ml-auto">
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
            className="w-64 pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-sm
              focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default DataControls;
