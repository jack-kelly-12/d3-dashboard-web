import React, { useState, useRef, useEffect } from "react";
import { ReactComponent as BatterIconSVG } from "./batter.svg";
import { ReactComponent as TrophyIconSVG } from "./trophy.svg";
import { ReactComponent as PitcherIconSVG } from "./pitcher.svg";
import { Play } from "lucide-react";

const StatBar = ({
  label,
  value,
  percentile,
  format = "decimal",
  decimals = 1,
  suffix = "",
  qualified = true,
}) => {
  const formatValue = (val) => {
    if (val === undefined || val === null) return "-";
    switch (format) {
      case "percent":
        return val.toFixed(decimals) + "%";
      case "decimal":
      default:
        return val.toFixed(decimals);
    }
  };

  const getBarColor = (pct) => {
    if (!qualified) return "bg-gray-200";
    if (pct >= 90) return "bg-red-600";
    if (pct >= 75) return "bg-red-500";
    if (pct >= 50) return "bg-red-400";
    if (pct >= 25) return "bg-blue-400";
    return "bg-blue-600";
  };

  return (
    <div className="relative mb-2 sm:mb-3">
      <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm mb-1">
        <div className="flex justify-between items-center mb-1 sm:mb-0">
          {/* Label */}
          <span className="text-gray-600 font-medium sm:w-24 md:w-32 flex-shrink-0 text-xs sm:text-sm">
            {label}
          </span>

          {/* Value */}
          <span className="font-mono text-gray-800 sm:w-16 flex-shrink-0 sm:ml-2 text-xs sm:text-sm">
            {formatValue(value)}
            {suffix}
          </span>
        </div>

        {/* Progress bar and percentile badge in a flex container */}
        <div className="flex items-center w-full mt-1 sm:mt-0">
          <div className="flex-1 relative h-2 sm:h-2.5 mx-2">
            <div className="absolute inset-0 bg-gray-100 rounded-full" />
            <div
              className={`absolute h-full rounded-full transition-all duration-300 ${getBarColor(
                percentile
              )}`}
              style={{ width: `${percentile}%` }}
            />
          </div>

          {/* Percentile badge */}
          <div
            className={`w-7 h-4 sm:w-8 sm:h-5 rounded-full flex items-center justify-center text-xs font-medium text-white ${getBarColor(
              percentile
            )}`}
          >
            {percentile || 0}
          </div>
        </div>
      </div>
    </div>
  );
};

const CategorySection = ({ title, stats, currentPercentiles, isQualified }) => (
  <div className="mb-6 sm:mb-8">
    <div className="flex items-center gap-2 mb-3 sm:mb-4">
      <CategoryIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" category={title} />
      <h3 className="text-base sm:text-lg font-bold text-gray-800">{title}</h3>
    </div>
    <div className="space-y-1.5 sm:space-y-2">
      {stats.map(({ key, label, decimals, suffix = "" }) => (
        <StatBar
          key={key}
          label={label}
          value={currentPercentiles.stats[key]}
          percentile={currentPercentiles.stats[`${key}Percentile`]}
          decimals={decimals}
          suffix={suffix}
          qualified={isQualified}
        />
      ))}
    </div>
  </div>
);

export const PercentileSection = ({
  playerData,
  initialPercentiles,
  activeTab,
  selectedYear,
  selectedDivision,
  onYearChange,
  onDivisionChange,
  onConferenceChange,
  isLoading
}) => {
  const availableYears = playerData?.yearsPlayed || [];
  const sortedYears = [...availableYears].sort((a, b) => Number(b) - Number(a));

  const [isYearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [conferenceOnly, setConferenceOnly] = useState(false);
  const dropdownRef = useRef(null);
  const animationTimer = useRef(null);

  const chronologicalYears = [...availableYears].sort(
    (a, b) => Number(a) - Number(b)
  );

  const handleYearChange = async (year) => {
    await onYearChange(year);
    setYearDropdownOpen(false);
  };

  const handleConferenceToggle = () => {
    const newConferenceOnly = !conferenceOnly;
    setConferenceOnly(newConferenceOnly);
    
    // Call the conference change handler with the appropriate value
    onConferenceChange(newConferenceOnly ? 'conference' : null);
  };

  const playAnimation = async () => {
    setIsPlaying(true);
    await handleYearChange(chronologicalYears[0]);

    const playNextYear = async (index) => {
      if (index >= chronologicalYears.length - 1) {
        setIsPlaying(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const nextIndex = index + 1;
      await handleYearChange(chronologicalYears[nextIndex]);

      playNextYear(nextIndex);
    };

    playNextYear(0);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setYearDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    const timer = animationTimer.current;

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);

      if (timer) {
        clearInterval(timer);
      }
    };
  }, []);

  if (
    !initialPercentiles ||
    (!initialPercentiles.batting && !initialPercentiles.pitching)
  ) {
    return null;
  }

  const currentPercentiles =
    activeTab === "batting"
      ? initialPercentiles.batting
      : initialPercentiles.pitching;

  if (!currentPercentiles) return null;

  const isQualified = currentPercentiles.qualified;
  const threshold =
    activeTab === "batting"
      ? currentPercentiles.paThreshold
      : currentPercentiles.ipThreshold;
  const appearances =
    activeTab === "batting"
      ? currentPercentiles.playerPA
      : currentPercentiles.playerIP;

  const isConferenceFiltered = currentPercentiles.isConferenceFiltered;
  const conferenceUsed = currentPercentiles.conference;
  const playerCount = currentPercentiles.playerCount;

  const categories =
    activeTab === "batting"
      ? [
          {
            title: "Batting",
            stats: [
              { key: "wOBA", label: "wOBA", decimals: 3 },
              { key: "OPS+", label: "OPS+", decimals: 0 },
              { key: "wRC+", label: "wRC+", decimals: 0 },
              { key: "K%", label: "K%", decimals: 1 },
              { key: "BB%", label: "BB%", decimals: 1 },
            ],
          },
          {
            title: "Value",
            stats: [
              { key: "Baserunning", label: "Baserunning", decimals: 1 },
              { key: "Batting", label: "Batting", decimals: 1 },
              { key: "WPA/LI", label: "WPA/LI", decimals: 1 },
              { key: "WPA", label: "WPA", decimals: 1 },
              { key: "REA", label: "RE24", decimals: 1 },
            ],
          },
        ]
      : [
          {
            title: "Pitching",
            stats: [
              { key: "ERA", label: "ERA", decimals: 2, reverse: true },
              { key: "FIP", label: "FIP", decimals: 2, reverse: true },
              { key: "xFIP", label: "xFIP", decimals: 2, reverse: true },
              { key: "K%", label: "K%", decimals: 1, suffix: "%" },
              {
                key: "BB%",
                label: "BB%",
                decimals: 1,
                suffix: "%",
                reverse: true,
              },
              { key: "K-BB%", label: "K-BB%", decimals: 1, suffix: "%" },
              { key: "RA9", label: "RA9", decimals: 2 },
            ],
          },
          {
            title: "Value",
            stats: [
              { key: "WAR", label: "WAR", decimals: 1 },
              { key: "pWPA/LI", label: "WPA/LI", decimals: 1 },
              { key: "pWPA", label: "WPA", decimals: 1 },
              { key: "pREA", label: "RE24", decimals: 1 },
            ],
          },
        ];

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-col gap-3 mb-4 sm:mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 relative">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
              <span className="mr-1">
                {selectedYear} Percentile Rankings
              </span>
              <button
                onClick={() => setYearDropdownOpen(!isYearDropdownOpen)}
                className="text-blue-600 hover:text-blue-700 text-base sm:text-lg"
                aria-label="Select year"
              >
                ▾
              </button>
            </h2>

            {isLoading && (
              <div className="ml-1">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {isYearDropdownOpen && (
              <div
                ref={dropdownRef}
                className="absolute bg-white border border-gray-200 rounded-md shadow-lg z-50 w-40 top-full mt-1 left-0"
              >
                <div className="py-1 max-h-60 overflow-auto">
                  {sortedYears.map((year) => (
                    <button
                      key={year}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 
                      ${
                        selectedYear === year
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700"
                      }`}
                      onClick={() => handleYearChange(year)}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center h-9">
            {!isPlaying ? (
              <button
                onClick={playAnimation}
                className="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors text-sm"
                disabled={isPlaying}
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center justify-center gap-1 px-3 py-1.5 text-transparent text-xs">
                <span className="w-3.5 h-3.5"></span>
                <span>Play Career</span>
              </div>
            )}
          </div>
        </div>

        {/* Conference Toggle and Info */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={conferenceOnly}
                onChange={handleConferenceToggle}
                className="sr-only"
              />
              <div className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${
                conferenceOnly ? 'bg-blue-600' : 'bg-gray-200'
              }`}>
                <span className={`inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                  conferenceOnly ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0.5 sm:translate-x-1'
                }`} />
              </div>
              <span className="ml-2 text-xs sm:text-sm font-medium text-gray-700">
                Conference Only
              </span>
            </label>
          </div>

          {isConferenceFiltered && conferenceUsed && (
            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              <span>{conferenceUsed}</span>
              <span>•</span>
              <span>{playerCount} players</span>
            </div>
          )}
        </div>

        {!isQualified && (
          <div className="text-xs text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full self-start">
            Below threshold ({appearances}/{threshold}{" "}
            {activeTab === "batting" ? "PA" : "IP"})
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {categories.map((category) => (
          <CategorySection
            key={category.title}
            title={category.title}
            stats={category.stats}
            currentPercentiles={currentPercentiles}
            isQualified={isQualified}
          />
        ))}
      </div>
    </div>
  );
};

const BatterIcon = ({ className }) => (
  <BatterIconSVG className={`${className} w-8 h-8`} />
);
const TrophyIcon = ({ className }) => <TrophyIconSVG className={className} />;
const PitcherIcon = ({ className }) => (
  <PitcherIconSVG className={`${className} w-8 h-8`} />
);

const DefaultIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <path d="M12 6v12M6 12h12" strokeWidth="2" />
  </svg>
);

const CategoryIcon = ({ className, category }) => {
  if (category === "Batting") {
    return <BatterIcon className={className} />;
  } else if (category === "Value") {
    return <TrophyIcon className={className} />;
  } else if (category === "Pitching") {
    return <PitcherIcon className={className} />;
  } else {
    return <DefaultIcon className={className} />;
  }
};