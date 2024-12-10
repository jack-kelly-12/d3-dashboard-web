import React from "react";
import { Search } from "lucide-react";

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
          {isPitching ? "IP Qualifier:" : "PA Qualifier:"}
        </label>
        <select
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            hover:border-gray-300 transition-colors"
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-wrap gap-2">
          {dataTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setDataType(type.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  dataType === type.id
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-blue-50 border border-gray-200"
                }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {[2024, 2023, 2022, 2021].map((year) => (
              <label
                key={year}
                className={`
                  relative flex items-center justify-center px-4 py-2 rounded-lg cursor-pointer
                  transition-all duration-200 select-none
                  ${
                    selectedYears.includes(year)
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-blue-50 border border-gray-200"
                  }
                `}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedYears.includes(year)}
                  onChange={() => {
                    const newYears = selectedYears.includes(year)
                      ? selectedYears.filter((y) => y !== year)
                      : [...selectedYears, year];
                    if (newYears.length > 0) setSelectedYears(newYears);
                  }}
                />
                {year}
              </label>
            ))}
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Qualifier Filter */}
            <QualifierFilter />

            {/* Search Input */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${
                  dataType.includes("player") ? "players" : "teams"
                }...`}
                className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataControls;
