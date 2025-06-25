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

const ChartSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-5 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-4 pb-3 border-b border-gray-100">
        <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/2 sm:w-1/3 mb-3"></div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap mt-2 gap-2 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col">
              <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-16 sm:w-20 mb-1"></div>
              <div className="h-5 sm:h-6 bg-gray-300 rounded w-12 sm:w-16"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5 gap-3 sm:gap-0">
        <div className="flex bg-gray-200 rounded-lg h-8 sm:h-9 w-full sm:w-64"></div>
        <div className="h-4 bg-gray-200 rounded w-20 sm:w-24 self-end"></div>
      </div>

      {/* Chart title skeleton */}
      <div className="mb-3">
        <div className="h-3.5 sm:h-4 bg-gray-200 rounded w-2/3 sm:w-48"></div>
      </div>

      {/* Chart area skeleton */}
      <div className="h-48 sm:h-64 lg:h-72 bg-gray-100 rounded-md flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          <line x1="40" y1="20" x2="40" y2="180" stroke="#e5e5e5" strokeWidth="2" />
          <line x1="40" y1="180" x2="380" y2="180" stroke="#e5e5e5" strokeWidth="2" />
          {[40, 80, 120, 160].map((y, i) => (
            <line key={i} x1="40" y1={y} x2="380" y2={y} stroke="#e5e5e5" strokeDasharray="5,5" />
          ))}
          <path
            d="M40,120 C80,140 120,90 160,100 C200,110 240,80 280,90 C320,100 360,60 380,80"
            fill="none" stroke="#e5e5e5" strokeWidth="3"
          />
        </svg>
      </div>
    </div>
  );
};

const EmptyState = ({ message, suggestion }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 text-center h-48 sm:h-64 flex flex-col justify-center">
      <div className="text-sm sm:text-base text-gray-600 mb-2">{message}</div>
      {suggestion && <div className="text-xs sm:text-sm text-gray-500">{suggestion}</div>}
    </div>
  );
};

const RollingChart = memo(
  ({
    playerId,
    playerType = "batter",
    initialWindow = 25,
    playerName = "",
    chartTitle = "",
    minRequiredDataPoints = 10,
  }) => {
    const [rollingData, setRollingData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [window, setWindow] = useState(initialWindow);
    const [lastPA, setLastPA] = useState("");
    const [currentWoba, setCurrentWoba] = useState(0);
    const [careerWoba, setCareerWoba] = useState(0);
    const [isDataSufficient, setIsDataSufficient] = useState(true);

    const leagueAvgWoba = 0.39;

    useEffect(() => {
      const fetchRollingData = async () => {
        if (!playerId) {
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          const response = await fetchAPI(
            `/api/rolling/${encodeURIComponent(
              playerId
            )}?window=${window}&player_type=${playerType}`
          );

          const data = response.rolling_data || [];
          setIsDataSufficient(data.length >= minRequiredDataPoints);

          if (response.career_woba) {
            setCareerWoba(response.career_woba);
          } else if (data.length > 0) {
            const totalPAs = data.length;
            const sumWoba = data.reduce((sum, item) => sum + item.raw_woba_value, 0);
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
    }, [playerId, window, playerType, minRequiredDataPoints]);

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const month = date.toLocaleString("default", { month: "short" });
      const day = date.getDate();
      let suffix = "th";
      if (day === 1 || day === 21 || day === 31) suffix = "st";
      else if (day === 2 || day === 22) suffix = "nd";
      else if (day === 3 || day === 23) suffix = "rd";
      return `${month} ${day}${suffix}, ${date.getFullYear()}`;
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
          <div className="bg-white p-2 sm:p-3 shadow-lg border border-gray-200 rounded-md max-w-xs">
            <p className="text-xs sm:text-sm font-medium">PA #{label}</p>
            <p className="text-xs sm:text-sm text-gray-700">
              wOBA: <span className="font-semibold">.{payload[0].value}</span>
            </p>
            {data.game_date_formatted && (
              <p className="text-xs text-gray-500 mt-1">{data.game_date_formatted}</p>
            )}
          </div>
        );
      }
      return null;
    };

    if (isLoading) {
      return <ChartSkeleton />;
    }

    if (error) {
      return (
        <EmptyState
          message={error}
          suggestion={
            <button
              onClick={() => window.location.reload()}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors mt-3"
            >
              Retry
            </button>
          }
        />
      );
    }

    if (!playerId) {
      return (
        <EmptyState
          message="No player selected."
          suggestion="Please select a player to view their performance data."
        />
      );
    }

    if (!rollingData.length) {
      return (
        <EmptyState
          message="No performance data available for this player."
          suggestion="This player may be new or hasn't recorded enough plate appearances yet."
        />
      );
    }

    if (!isDataSufficient) {
      return (
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-5 mt-4">
          <div className="mb-4 pb-3 border-b border-gray-100">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3">{playerName}</h3>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-yellow-700">
                Limited data available ({rollingData.length} PAs). At least{" "}
                {minRequiredDataPoints} PAs are recommended for a meaningful rolling wOBA chart.
              </p>
            </div>

            {/* Stats grid - responsive */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap mt-3 gap-3 sm:gap-4">
              {rollingData.length > 0 && (
                <>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">CURRENT wOBA</span>
                    <span className="text-sm sm:text-lg font-semibold text-gray-800">
                      {currentWoba.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">CAREER wOBA</span>
                    <span className="text-sm sm:text-lg font-semibold text-gray-800">
                      {careerWoba.toFixed(3)}
                    </span>
                  </div>
                </>
              )}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">LEAGUE AVG</span>
                <span className="text-sm sm:text-lg font-semibold text-gray-600">
                  {leagueAvgWoba.toFixed(3)}
                </span>
              </div>
              {lastPA && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">LAST PA</span>
                  <span className="text-sm sm:text-lg font-semibold text-gray-800">{lastPA}</span>
                </div>
              )}
            </div>
          </div>

          {/* Responsive table */}
          <div className="mb-3">
            <h4 className="text-sm font-bold text-gray-800 mb-2">Available Performance Data</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PA #
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      wOBA
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rollingData.slice(0, 10).map((item) => (
                    <tr key={item.pa_number}>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-800">
                        {item.pa_number}
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                        {formatDate(item.game_date)}
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium">
                        {item.raw_woba_value.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                  {rollingData.length > 10 && (
                    <tr>
                      <td colSpan="3" className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-500 text-center">
                        ...and {rollingData.length - 10} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // Main chart view
    return (
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-5 mt-4">
        {/* Responsive controls section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5 gap-3 sm:gap-0">
          <div className="flex items-center">
            <div className="flex bg-gray-100 rounded-lg p-0.5 sm:p-1 w-full sm:w-auto">
              <button
                onClick={() => handleWindowChange(25)}
                className={`flex-1 sm:flex-none px-2 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                  window === 25
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700 hover:bg-gray-200"
                } ${rollingData.length < 25 ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={rollingData.length < 25}
              >
                25 PAs
              </button>
              <button
                onClick={() => rollingData.length >= 50 && handleWindowChange(50)}
                className={`flex-1 sm:flex-none px-2 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                  window === 50
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700 hover:bg-gray-200"
                } ${rollingData.length < 50 ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={rollingData.length < 50}
              >
                50 PAs
              </button>
              <button
                onClick={() => rollingData.length >= 100 && handleWindowChange(100)}
                className={`flex-1 sm:flex-none px-2 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                  window === 100
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700 hover:bg-gray-200"
                } ${rollingData.length < 100 ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={rollingData.length < 100}
              >
                100 PAs
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-right sm:text-left">
            {rollingData.length} total PAs
          </div>
        </div>

        {/* Chart title */}
        <div className="mb-3">
          <h4 className="text-xs sm:text-sm font-bold text-gray-800">
            {window} PAs Rolling wOBA {chartTitle && `(${chartTitle})`}
          </h4>
        </div>

        {/* Responsive chart area */}
        <div className="h-48 sm:h-64 lg:h-72 relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={processedData}
              margin={{ 
                top: 10, 
                right: window.innerWidth < 640 ? 20 : 40, 
                left: window.innerWidth < 640 ? 5 : 10, 
                bottom: 10 
              }}
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
                ticks={[100, 200, 300, 350, 400, 450, 500, 550, 600, 700, 800]}
                axisLine={false}
                tickLine={false}
                stroke="#9ca3af"
                fontSize={window.innerWidth < 640 ? 10 : 12}
                width={window.innerWidth < 640 ? 20 : 25}
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
                  fontSize: window.innerWidth < 640 ? 9 : 11,
                }}
              />
              <Line
                type="monotone"
                dataKey="rolling_woba"
                stroke="#1E88E5"
                strokeWidth={window.innerWidth < 640 ? 2 : 2.5}
                dot={false}
                activeDot={{
                  r: window.innerWidth < 640 ? 4 : 5,
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