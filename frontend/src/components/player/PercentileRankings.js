import React from "react";

export const PercentileLegend = () => (
  <div className="flex items-center gap-4 mb-8">
    <div className="text-xs flex items-center">
      <span className="inline-block w-3 h-3 bg-gradient-to-r from-red-600 to-red-500 rounded-sm mr-1" />
      Great
    </div>
    <div className="text-xs flex items-center">
      <span className="inline-block w-3 h-3 bg-gradient-to-r from-red-500 to-red-400 rounded-sm mr-1" />
      Good
    </div>
    <div className="text-xs flex items-center">
      <span className="inline-block w-3 h-3 bg-gradient-to-r from-red-400 to-red-300 rounded-sm mr-1" />
      Average
    </div>
    <div className="text-xs flex items-center">
      <span className="inline-block w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-300 rounded-sm mr-1" />
      Below Average
    </div>
    <div className="text-xs flex items-center">
      <span className="inline-block w-3 h-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-sm mr-1" />
      Poor
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

  const getBarColors = (pct, isQualified) => {
    if (!isQualified)
      return {
        bar: "bg-gradient-to-r from-gray-300 to-gray-200",
        circle: "bg-gray-300",
      };
    if (pct >= 90)
      return {
        bar: "bg-gradient-to-r from-red-600 to-red-500",
        circle: "bg-red-600",
      };
    if (pct >= 75)
      return {
        bar: "bg-gradient-to-r from-red-500 to-red-400",
        circle: "bg-red-500",
      };
    if (pct >= 50)
      return {
        bar: "bg-gradient-to-r from-red-400 to-red-300",
        circle: "bg-red-400",
      };
    if (pct >= 25)
      return {
        bar: "bg-gradient-to-r from-blue-400 to-blue-300",
        circle: "bg-blue-400",
      };
    return {
      bar: "bg-gradient-to-r from-blue-600 to-blue-500",
      circle: "bg-blue-600",
    };
  };

  return (
    <div className={`relative h-10 mb-4 ${!qualified ? "opacity-50" : ""}`}>
      <div className="flex justify-between text-xs mb-2.5">
        <div className="flex gap-3">
          <span className="text-gray-600 font-medium">
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
      </div>
      <div className="relative h-2">
        <div className="absolute inset-0 bg-gray-100 rounded-full" />
        <div
          className={`absolute h-full rounded-full transition-all duration-300 ${
            getBarColors(percentile, qualified).bar
          }`}
          style={{ width: `${percentile}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${percentile}%` }}
        >
          <div
            className={`${
              getBarColors(percentile, qualified).circle
            } text-white text-xs rounded-full h-5 w-8 flex items-center justify-center`}
          >
            {percentile || 0}
          </div>
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 mb-8">
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
        {stats.map(({ key, label, decimals, suffix = "", percentileKey }) => (
          <StatBar
            key={key}
            label={label}
            value={currentStats[key]}
            percentile={percentiles?.stats?.[percentileKey] || 0}
            decimals={decimals}
            suffix={suffix}
            qualified={isQualified}
          />
        ))}
      </div>
    </div>
  );
};
