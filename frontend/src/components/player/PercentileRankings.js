import React, { useState, useRef, useEffect } from "react";
import { Play } from "lucide-react";
import { getPercentileColor } from "../../utils/colorUtils";
import { isBattingTab } from "../../utils/playerDataUtils";



const Bar = ({ percentile }) => {
  const width = percentile ? Math.min(percentile, 100) : 0;
  const color = percentile ? getPercentileColor(percentile) : "#d1d5db"; // gray-300
  
  return (
    <div className="relative w-full h-3 bg-gray-200 rounded">
      <div
        className="absolute left-0 top-0 h-3 rounded transition-all duration-500 ease-out"
        style={{
          width: `${width}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
};

const StatRow = ({ label, value, percentile, rank, totalPlayers, decimals = 1, suffix = "", isQualified = true }) => {
  const displayValue = value != null ? value.toFixed(decimals) : "-";
  const percentileText = percentile ? `${percentile}th percentile` : "-";
  const rankingText = rank && totalPlayers ? `#${rank} of ${totalPlayers} qualified` : "-";
  
  // Grey out everything if not qualified
  const textColor = isQualified ? "text-gray-700" : "text-gray-400";
  const valueColor = isQualified ? "text-gray-900" : "text-gray-400";
  const subtitleColor = isQualified ? "text-gray-500" : "text-gray-400";
  
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline text-sm">
        <span className={`font-medium ${textColor}`}>{label}</span>
        <span className={`font-mono text-sm ${valueColor}`}>
          {displayValue}{suffix}
        </span>
      </div>
      <Bar percentile={isQualified ? percentile : null} />
      <div className="flex justify-between items-center text-xs">
        <span className={subtitleColor}>
          {isQualified ? percentileText : "Not qualified"}
        </span>
        <span className={`font-mono ${subtitleColor}`}>
          {isQualified ? rankingText : "N/A"}
        </span>
      </div>
    </div>
  );
};

const Category = ({ title, stats, isQualified = true }) => (
  <div className="flex flex-col gap-3 border border-gray-200 rounded-xl p-3 bg-white shadow-sm">
    <h3 className="text-xs font-semibold text-gray-600 tracking-wide uppercase">
      {title}
    </h3>
    <div className="flex flex-col gap-3">
      {stats.map((stat) => (
        <StatRow key={stat.label} {...stat} isQualified={isQualified} />
      ))}
    </div>
  </div>
);

export const PercentileSection = ({
  playerData,
  initialPercentiles,
  activeTab,
  selectedYear,
  onYearChange,
  onConferenceChange,
  isLoading,
}) => {
  const getAvailableYears = () => {
    if (!playerData?.playerYears) {
      return [];
    }
    
    const tabType = isBattingTab(activeTab) ? 'batting' : 'pitching';
    const yearsKey = tabType === 'batting' ? 'batting_years' : 'pitching_years';
    const years = playerData.playerYears[yearsKey] || [];
    
    return years;
  };
  
  const years = getAvailableYears();
  const chrono = [...years].sort((a, b) => a - b);
  const [confOnly, setConfOnly] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [playing, setPlaying] = useState(false);
  const dropdownRef = useRef(null);

  const handleYearChange = async (year) => {
    setDropdown(false);
    await onYearChange(year);
  };

  const handleConferenceToggle = async () => {
    const newState = !confOnly;
    setConfOnly(newState);
    await onConferenceChange(newState ? "conference" : null);
  };

  const handlePlayCareer = async () => {
    if (playing || chrono.length <= 1) return;
    
    setPlaying(true);
    
    for (const year of chrono) {
      await handleYearChange(year);
      await new Promise((resolve) => setTimeout(resolve, 1800));
    }
    
    setPlaying(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!initialPercentiles) return null;
  
  if (!playerData?.playerYears) {
    return null;
  }

  const p = isBattingTab(activeTab)
    ? initialPercentiles.batting
    : initialPercentiles.pitching;
  if (!p) return null;

  const isQual = p.qualified;
  const threshold = isBattingTab(activeTab) ? p.pa_threshold : p.ip_threshold;
  const apps = isBattingTab(activeTab) ? p.player_pa : p.player_ip;
    
  const createStatConfig = (key, label, decimals = 1, suffix = "") => ({
    label,
    value: p.stats[key],
    percentile: p.stats[`${key}_percentile`],
    rank: p.stats[`${key}_rank`],
    totalPlayers: p.player_count,
    decimals,
    suffix,
  });

  const battingCategories = [
    {
      title: "Batting",
      stats: [
        createStatConfig("woba", "wOBA", 3),
        createStatConfig("ops", "OPS", 3),
        createStatConfig("wrc_plus", "wRC+", 0),
        createStatConfig("k_pct", "K%", 1, "%"),
        createStatConfig("bb_pct", "BB%", 1, "%"),
      ],
    },
    {
      title: "Value",
      stats: [
        createStatConfig("baserunning", "Baserunning", 1),
        createStatConfig("batting", "Batting", 1),
        createStatConfig("wpa_li", "WPA/LI", 1),
        createStatConfig("wpa", "WPA", 1),
        createStatConfig("rea", "RE24", 1),
      ],
    },
  ];

  const pitchingCategories = [
    {
      title: "Pitching",
      stats: [
        createStatConfig("era", "ERA", 2),
        createStatConfig("fip", "FIP", 2),
        createStatConfig("xfip", "xFIP", 2),
        createStatConfig("k_pct", "K%", 1, "%"),
        createStatConfig("bb_pct", "BB%", 1, "%"),
        createStatConfig("k_minus_bb_pct", "K-BB%", 1, "%"),
      ],
    },
    {
      title: "Value",
      stats: [
        createStatConfig("war", "WAR", 1),
        createStatConfig("pwpa_li", "WPA/LI", 1),
        createStatConfig("pwpa", "WPA", 1),
        createStatConfig("prea", "RE24", 1),
      ],
    },
  ];

  const categories = isBattingTab(activeTab) ? battingCategories : pitchingCategories;

  return (
    <div className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between mb-4 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] uppercase tracking-wider text-gray-500">
              Player Analysis
            </span>
            <h2 className="text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent select-none">
              Percentile Rankings
            </h2>
          </div>

          {isLoading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition-colors">
            <input
              type="checkbox"
              checked={confOnly}
              onChange={handleConferenceToggle}
              className="mr-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            Relative to Conference
          </label>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdown(!dropdown)}
              className="text-sm px-2 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700"
            >
              {selectedYear}
              <span className="ml-1 text-gray-400">▼</span>
            </button>
            {dropdown && (
              <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded shadow-md w-20">
                {years.filter(y => y != null).map((y) => (
                  <button
                    key={y}
                    onClick={() => handleYearChange(y)}
                    className={`block w-full text-left px-3 py-1 text-sm ${
                      y === selectedYear
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handlePlayCareer}
            disabled={playing}
            className={`flex items-center gap-1 text-sm px-3 py-1 rounded border ${
              playing
                ? "border-gray-300 text-gray-400 cursor-not-allowed"
                : "border-gray-300 hover:border-blue-500 hover:text-blue-600 text-gray-700"
            }`}
          >
            <Play size={14} />
            {playing ? "Playing..." : "Play Career"}
          </button>
        </div>
      </div>


      <div className="flex flex-wrap items-center gap-3 mb-4">
        {!isQual && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
            <span className="text-sm text-amber-800 font-medium">
              Not qualified for percentiles
            </span>
            <span className="text-xs text-amber-600">
              ({apps} / {threshold} {isBattingTab(activeTab) ? "PA" : "IP"} required)
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {categories.map((c) => (
          <Category key={c.title} {...c} isQualified={isQual} />
        ))}
      </div>
    </div>
  );
};
