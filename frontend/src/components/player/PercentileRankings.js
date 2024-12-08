import React from "react";

export const PercentileLegend = () => (
  <div className="flex items-center gap-4 mb-8">
    <div className="text-xs flex items-center">
      <span className="inline-block w-3 h-3 bg-red-600 rounded-sm mr-1" />
      90-100
    </div>
    <div className="text-xs flex items-center">
      <span className="inline-block w-3 h-3 bg-red-400 rounded-sm mr-1" />
      75-89
    </div>
    <div className="text-xs flex items-center">
      <span className="inline-block w-3 h-3 bg-red-100 rounded-sm mr-1" />
      50-74
    </div>
    <div className="text-xs flex items-center">
      <span className="inline-block w-3 h-3 bg-blue-400 rounded-sm mr-1" />
      25-49
    </div>
    <div className="text-xs flex items-center">
      <span className="inline-block w-3 h-3 bg-blue-600 rounded-sm mr-1" />
      0-24
    </div>
  </div>
);

export const StatBar = ({
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

  const getColorClass = (pct, isQualified) => {
    if (!isQualified) return "bg-gray-300";
    if (pct >= 90) return "bg-red-600";
    if (pct >= 75) return "bg-red-400";
    if (pct >= 50) return "bg-red-100";
    if (pct >= 25) return "bg-blue-400";
    return "bg-blue-600";
  };

  return (
    <div className={`relative h-8 mb-2 ${!qualified ? "opacity-50" : ""}`}>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">
          {label}
          {!qualified && (
            <span className="ml-1 text-gray-400">(Unqualified)</span>
          )}
        </span>
        <span className="font-mono font-medium">
          {formatValue(value)}
          {suffix}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getColorClass(
            percentile,
            qualified
          )}`}
          style={{ width: `${percentile}%` }}
        />
      </div>
      <div className="absolute right-0 -top-1">
        <div className="bg-gray-800 text-white text-xs rounded-full h-5 w-8 flex items-center justify-center">
          {percentile || 0}
        </div>
      </div>
    </div>
  );
};

export const PercentileSection = ({ playerData, percentiles, activeTab }) => {
  const isQualified =
    activeTab === "batting"
      ? percentiles?.playerPA >= percentiles?.paThreshold
      : percentiles?.playerIP >= percentiles?.ipThreshold;

  const stats =
    activeTab === "batting"
      ? [
          {
            key: "Baserunning",
            label: "Baserunning Value",
            decimals: 1,
            percentileKey: "BaserunningPercentile",
          },
          {
            key: "Batting",
            label: "Batting Value",
            decimals: 1,
            percentileKey: "BattingPercentile",
          },
          {
            key: "Adjustment",
            label: "Positional Value",
            decimals: 1,
            percentileKey: "AdjustmentPercentile",
          },
          {
            key: "wOBA",
            label: "wOBA",
            decimals: 3,
            percentileKey: "wOBAPercentile",
          },
          {
            key: "OPS+",
            label: "OPS+",
            decimals: 0,
            percentileKey: "OPS+Percentile",
          },
          {
            key: "wRC+",
            label: "wRC+",
            decimals: 0,
            percentileKey: "wRC+Percentile",
          },
          {
            key: "BA",
            label: "AVG",
            decimals: 3,
            percentileKey: "BAPercentile",
          },
          {
            key: "SlgPct",
            label: "SLG",
            decimals: 3,
            percentileKey: "SlgPctPercentile",
          },
        ]
      : [
          {
            key: "WAR",
            label: "WAR",
            decimals: 1,
            percentileKey: "WARPercentile",
          },
          {
            key: "ERA",
            label: "ERA",
            decimals: 2,
            reverse: true,
            percentileKey: "ERAPercentile",
          },
          {
            key: "FIP",
            label: "FIP",
            decimals: 2,
            reverse: true,
            percentileKey: "FIPPercentile",
          },
          {
            key: "xFIP",
            label: "xFIP",
            decimals: 2,
            reverse: true,
            percentileKey: "xFIPPercentile",
          },
          {
            key: "K%",
            label: "K%",
            decimals: 1,
            suffix: "%",
            percentileKey: "K%Percentile",
          },
          {
            key: "BB%",
            label: "BB%",
            decimals: 1,
            suffix: "%",
            reverse: true,
            percentileKey: "BB%Percentile",
          },
          {
            key: "K-BB%",
            label: "K-BB%",
            decimals: 1,
            suffix: "%",
            percentileKey: "K-BB%Percentile",
          },
          {
            key: "RA9",
            label: "RA9",
            decimals: 2,
            percentileKey: "RA9Percentile",
          },
        ];

  const currentStats =
    activeTab === "batting"
      ? playerData.battingStats[0]
      : playerData.pitchingStats[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          2024 Percentile Rankings
        </h2>
        {!isQualified && (
          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Below qualification threshold
          </div>
        )}
      </div>

      <PercentileLegend />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
        {stats.map(
          ({ key, label, decimals, suffix = "", reverse, percentileKey }) => (
            <StatBar
              key={key}
              label={label}
              value={currentStats[key]}
              percentile={percentiles?.stats?.[percentileKey] || 0}
              decimals={decimals}
              suffix={suffix}
              qualified={isQualified}
            />
          )
        )}
      </div>
    </div>
  );
};
