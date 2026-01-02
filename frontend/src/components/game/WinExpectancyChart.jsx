import React, { useMemo, useState, useEffect } from "react";
import {
  ComposedChart,
  Line,
  Area,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  YAxis,
  XAxis,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import { TrendingUp, ChevronsUpDown } from "lucide-react";

const WinExpectancyChart = ({ homeTeam, awayTeam, plays, homeTeamId, awayTeamId }) => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  const chartData = useMemo(() => {
    return (Array.isArray(plays) ? plays : []).map((play, index) => {
      const isLastPlay = index === plays.length - 1;
      const homeExp = Number(play.home_win_exp_after);
      let probability = Number.isFinite(homeExp) ? homeExp * 100 : 50;

      if (isLastPlay && play.away_score_after !== play.home_score_after) {
        probability = play.away_score_after > play.home_score_after ? 0 : 100;
      }

      const inningHalf = String(play.top_inning || "").toUpperCase().startsWith("T") ? "Top" : "Bot";
      const inningDisplay = `${inningHalf} ${Number(play.inning) || ""}`;

      return {
        index,
        probability,
        inning_half: play.top_inning,
        inning: play.inning,
        inningDisplay,
        description: play.description,
        homeScore: play.home_score_after,
        awayScore: play.away_score_after,
        wpa: Number(play.wpa) || 0,
      };
    });
  }, [plays]);

  const [hoverData, setHoverData] = useState(chartData[chartData.length - 1]);
  const [highlightedPlay, setHighlightedPlay] = useState(null);

  const momentumSwings = useMemo(() => {
    return (Array.isArray(plays) ? plays : [])
      .map((play, index) => ({
        index,
        wpa: Math.abs(Number(play.wpa) || 0),
        description: play.description,
      }))
      .sort((a, b) => b.wpa - a.wpa)
      .slice(0, isMobile ? 1 : isTablet ? 2 : 3);
  }, [plays, isMobile, isTablet]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.[0]) {
      const data = payload[0].payload;
      setHoverData(data);
      return (
        <div className="bg-white p-2 sm:p-4 shadow-lg border border-gray-200 rounded-lg max-w-xs sm:max-w-sm">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-900 mb-1 sm:mb-2">
            <ChevronsUpDown className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
            <span>{data.inningDisplay}</span>
          </div>
          {data.description && (
            <div className="text-xs sm:text-sm text-gray-600 border-t border-gray-100 mt-1 sm:mt-2 pt-1 sm:pt-2 line-clamp-3 sm:line-clamp-none">
              {data.description}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-1 sm:mt-2">
            Win Probability Change: {(data.wpa * 100).toFixed(1)}%
          </div>
        </div>
      );
    }
    return null;
  };

  const getWinProbabilityText = (data) => {
    if (!data || data.probability === undefined) return "";
    const probability = data.probability;
    const isHomeTeamLeading = probability >= 50;
    const leadingTeam = isHomeTeamLeading ? homeTeam : awayTeam;
    const displayProbability = isHomeTeamLeading
      ? probability
      : 100 - probability;

    const teamDisplay = isMobile
      ? leadingTeam.length > 3
        ? leadingTeam.substring(0, 3)
        : leadingTeam
      : leadingTeam;

    return `${teamDisplay} Win: ${displayProbability.toFixed(1)}%`;
  };

  if (!plays || plays.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        No play data available
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-md border border-gray-200">
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-100">
        <div className="flex flex-col gap-2 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
            <div className="flex items-center gap-4 sm:gap-8 justify-center sm:justify-start">
              <div className="text-center">
                <div className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5 sm:mb-1">
                  {isMobile && awayTeam.length > 10
                    ? awayTeam.substring(0, 10) + "..."
                    : awayTeam}
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  {hoverData
                    ? hoverData.awayScore
                    : plays[plays.length - 1].away_score_after}
                </div>
              </div>

              <div className="text-gray-300 text-base sm:text-xl">@</div>

              <div className="text-center">
                <div className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5 sm:mb-1">
                  {isMobile && homeTeam.length > 10
                    ? homeTeam.substring(0, 10) + "..."
                    : homeTeam}
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  {hoverData
                    ? hoverData.homeScore
                    : plays[plays.length - 1].home_score_after}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 bg-blue-50 px-2 sm:px-4 py-1 sm:py-2 rounded-lg self-center sm:self-auto mt-2 sm:mt-0">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
              <span className="text-xs sm:text-sm font-medium text-blue-700">
                {getWinProbabilityText(hoverData)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 text-xs">
            {momentumSwings.map((swing, index) => (
              <button
                key={index}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                  highlightedPlay === swing.index
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100"
                } border`}
                onClick={() =>
                  setHighlightedPlay(
                    highlightedPlay === swing.index ? null : swing.index
                  )
                }
              >
                <div className="font-medium mb-0.5 sm:mb-1 text-xs">
                  Key Moment
                </div>
                <div className="line-clamp-2 text-xs">{swing.description}</div>
                <div className="mt-1 text-[10px] sm:text-xs text-gray-500">
                  WPA: {(swing.wpa * 100).toFixed(1)}%
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-2 sm:px-4 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-3 sm:pb-4 md:pb-6 h-64 sm:h-80 md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{
              top: isMobile ? 10 : 20,
              right: isMobile ? 10 : 30,
              left: isMobile ? 10 : 20,
              bottom: isMobile ? 10 : 20,
            }}
            onMouseLeave={() => {
              setHoverData(chartData[chartData.length - 1]);
              setHighlightedPlay(null);
            }}
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.22} />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.18} />
                <stop offset="50%" stopColor="#ef4444" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.22} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="index"
              tickFormatter={(v) => chartData[v]?.inningDisplay || ""}
              interval={Math.floor(chartData.length / (isMobile ? 4 : isTablet ? 6 : 8))}
              tick={{ fontSize: isMobile ? 10 : 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis domain={[0, 100]} hide={true} reversed={true} />
            <ReferenceLine y={50} stroke="#e5e7eb" strokeDasharray="3 3" />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4", strokeWidth: 1 }} />

            <Area
              type="monotone"
              dataKey="probability"
              stroke="none"
              fill="url(#areaGradient)"
              isAnimationActive={true}
              animationDuration={600}
            />

            <Line
              type="monotone"
              dataKey="probability"
              stroke="#2563eb"
              strokeWidth={isMobile ? 1.75 : 2.5}
              dot={false}
              activeDot={{
                r: isMobile ? 4 : 6,
                stroke: "#fff",
                strokeWidth: isMobile ? 1 : 2,
                fill: "#2563eb",
              }}
              isAnimationActive={true}
              animationDuration={500}
            />

            {momentumSwings.map((swing, i) => (
              <ReferenceDot
                key={`swing-${i}`}
                x={swing.index}
                y={chartData[swing.index]?.probability}
                r={isMobile ? 3 : 4}
                fill={highlightedPlay === swing.index ? "#dc2626" : "#3b82f6"}
                stroke="#fff"
                strokeWidth={1}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WinExpectancyChart;
