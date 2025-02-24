import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  YAxis,
  XAxis,
} from "recharts";
import { TrendingUp, ChevronsUpDown } from "lucide-react";

const WinExpectancyChart = ({ homeTeam, awayTeam, plays }) => {
  const chartData = useMemo(() => {
    return plays.map((play, index) => {
      const isLastPlay = index === plays.length - 1;
      let probability = play.home_win_exp_after * 100;

      if (isLastPlay && play.away_score_after !== play.home_score_after) {
        probability = play.away_score_after > play.home_score_after ? 0 : 100;
      }

      const inningDisplay = `${play.top_inning} ${play.inning}`;

      return {
        probability,
        inning_half: play.top_inning,
        inning: play.inning,
        inningDisplay,
        description: play.description,
        homeScore: play.home_score_after,
        awayScore: play.away_score_after,
        wpa: play.wpa,
      };
    });
  }, [plays]);

  const [hoverData, setHoverData] = useState(chartData[chartData.length - 1]);
  const [highlightedPlay, setHighlightedPlay] = useState(null);

  const momentumSwings = useMemo(() => {
    return plays
      .map((play, index) => ({
        index,
        wpa: Math.abs(play.wpa || 0),
        description: play.description,
      }))
      .sort((a, b) => b.wpa - a.wpa)
      .slice(0, 3);
  }, [plays]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.[0]) {
      const data = payload[0].payload;
      setHoverData(data);
      return (
        <div className="bg-white p-4 shadow-lg border border-gray-200 rounded-lg max-w-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
            <ChevronsUpDown className="w-4 h-4 text-blue-500" />
            <span>{data.inningDisplay}</span>
          </div>
          {data.description && (
            <div className="text-sm text-gray-600 border-t border-gray-100 mt-2 pt-2">
              {data.description}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2">
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
    return `${leadingTeam} Win Probability: ${displayProbability.toFixed(1)}%`;
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
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              {/* Away Team */}
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500 mb-1">
                  {awayTeam}
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {hoverData
                    ? hoverData.awayScore
                    : plays[plays.length - 1].away_score_after}
                </div>
              </div>

              <div className="text-gray-300 text-xl">@</div>

              {/* Home Team */}
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500 mb-1">
                  {homeTeam}
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {hoverData
                    ? hoverData.homeScore
                    : plays[plays.length - 1].home_score_after}
                </div>
              </div>
            </div>

            {/* Win Probability */}
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">
                {getWinProbabilityText(hoverData)}
              </span>
            </div>
          </div>

          {/* Key Moments */}
          <div className="flex gap-4 text-xs">
            {momentumSwings.map((swing, index) => (
              <button
                key={index}
                className={`flex-1 p-2 rounded-lg transition-colors ${
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
                <div className="font-medium mb-1">Key Moment {index + 1}</div>
                <div className="line-clamp-2">{swing.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-8 pt-8 pb-6 h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onMouseLeave={() => {
              setHoverData(chartData[chartData.length - 1]);
              setHighlightedPlay(null);
            }}
          >
            <defs>
              <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="inningDisplay"
              interval={Math.floor(chartData.length / 8)}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis domain={[0, 100]} hide={true} reversed={true} />
            <ReferenceLine y={50} stroke="#e5e7eb" strokeDasharray="3 3" />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="probability"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 6,
                stroke: "#fff",
                strokeWidth: 2,
                fill: "#3b82f6",
              }}
              fill="url(#probGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WinExpectancyChart;
