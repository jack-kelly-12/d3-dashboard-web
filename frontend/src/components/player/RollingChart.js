import React, { useState, useEffect, memo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { fetchAPI } from "../../config/api";

const RollingChart = memo(
  ({
    playerId,
    playerType = "batter",
    initialWindow = 100,
    playerName = "",
    chartTitle = "",
  }) => {
    const [rollingData, setRollingData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [window, setWindow] = useState(initialWindow);
    const [lastPA, setLastPA] = useState("");
    const [currentWoba, setCurrentWoba] = useState(0);
    const [careerWoba, setCareerWoba] = useState(0);

    const leagueAvgWoba = 0.39;

    useEffect(() => {
      const fetchRollingData = async () => {
        if (!playerId) return;

        setIsLoading(true);
        try {
          const response = await fetchAPI(
            `/api/rolling/${encodeURIComponent(
              playerId
            )}?window=${window}&player_type=${playerType}`
          );

          const data = response.rolling_data || [];

          if (response.career_woba) {
            setCareerWoba(response.career_woba);
          } else if (data.length > 0) {
            const totalPAs = data.length;
            const sumWoba = data.reduce(
              (sum, item) => sum + item.raw_woba_value,
              0
            );
            setCareerWoba(sumWoba / totalPAs);
          }

          setRollingData(data);

          if (data.length > 0) {
            const lastEntry = data[data.length - 1];
            setLastPA(formatDate(lastEntry.game_date));
            setCurrentWoba(lastEntry.rolling_woba);
          }
        } catch (err) {
          console.error("Error fetching rolling wOBA data:", err);
          setError("Unable to load performance data. Please try again later.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchRollingData();
    }, [playerId, window, playerType]);

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const month = date.toLocaleString("default", { month: "short" });

      const day = date.getDate();
      let suffix = "th";
      if (day === 1 || day === 21 || day === 31) suffix = "st";
      else if (day === 2 || day === 22) suffix = "nd";
      else if (day === 3 || day === 23) suffix = "rd";

      return `${month} ${day}${suffix}`;
    };

    const handleWindowChange = (newWindow) => {
      setWindow(newWindow);
    };

    const formatYAxis = (value) => {
      return (value / 1000).toFixed(3).substring(2);
    };

    const processedData = rollingData.map((item) => ({
      ...item,
      rolling_woba: Math.round(item.rolling_woba * 1000),
      game_date_formatted: formatDate(item.game_date),
    }));

    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-white p-3 shadow-md border border-gray-200 rounded-md">
            <p className="text-sm font-medium">PA #{label}</p>
            <p className="text-sm text-gray-700">
              wOBA: <span className="font-semibold">.{payload[0].value}</span>
            </p>
            {data.game_date_formatted && (
              <p className="text-xs text-gray-500 mt-1">
                {data.game_date_formatted}
              </p>
            )}
          </div>
        );
      }
      return null;
    };

    // Loading state with professional spinner
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm">
          <div className="w-8 h-8 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      );
    }

    // Error state with action button
    if (error) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center h-64 flex flex-col justify-center items-center">
          <div className="text-gray-600 mb-3">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    // No data state
    if (!rollingData.length) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center h-64 flex flex-col justify-center">
          <div className="text-gray-600">
            No performance data available for this player.
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-5 mt-4">
        {/* Header section with player name and current stats */}
        {playerName && (
          <div className="mb-4 pb-3 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800">{playerName}</h3>
            <div className="flex flex-wrap mt-2 gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">CURRENT wOBA</span>
                <span
                  className={`text-lg font-semibold ${
                    currentWoba > leagueAvgWoba
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {currentWoba.toFixed(3)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">CAREER wOBA</span>
                <span className="text-lg font-semibold text-gray-800">
                  {careerWoba.toFixed(3)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">LEAGUE AVG</span>
                <span className="text-lg font-semibold text-gray-600">
                  {leagueAvgWoba.toFixed(3)}
                </span>
              </div>
              {lastPA && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">LAST PA</span>
                  <span className="text-lg font-semibold text-gray-800">
                    {lastPA}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls section */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleWindowChange(25)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  window === 25
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700 hover:bg-gray-200"
                }`}
              >
                25 PAs
              </button>
              <button
                onClick={() => handleWindowChange(50)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  window === 50
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700 hover:bg-gray-200"
                }`}
              >
                50 PAs
              </button>
              <button
                onClick={() => handleWindowChange(100)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  window === 100
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700 hover:bg-gray-200"
                }`}
              >
                100 PAs
              </button>
            </div>
          </div>
        </div>

        {/* Chart title */}
        <div className="mb-3">
          <h4 className="text-sm font-bold text-gray-800">
            {window} PAs Rolling wOBA {chartTitle && `(${chartTitle})`}
          </h4>
        </div>

        {/* Chart area */}
        <div className="h-72 relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={processedData}
              margin={{ top: 10, right: 40, left: 10, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e5e5"
                vertical={false}
              />
              <XAxis dataKey="pa_number" hide={true} />
              <YAxis
                tickFormatter={formatYAxis}
                domain={["auto", "auto"]}
                ticks={[300, 350, 400, 450, 500, 550, 600]}
                axisLine={false}
                tickLine={false}
                stroke="#9ca3af"
                fontSize={12}
                width={25}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={leagueAvgWoba * 1000}
                stroke="#9ca3af"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  position: "right",
                  value: "LG AVG",
                  fill: "#9ca3af",
                  fontSize: 11,
                }}
              />
              <Line
                type="monotone"
                dataKey="rolling_woba"
                stroke={playerType === "batter" ? "#1E88E5" : "#43A047"}
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: "#dc2626",
                  fill: "#fff",
                  strokeWidth: 2,
                }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
);

RollingChart.displayName = "RollingChart";

export default RollingChart;
