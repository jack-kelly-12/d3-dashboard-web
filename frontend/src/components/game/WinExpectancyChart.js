import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  YAxis,
} from "recharts";

const WinExpectancyChart = ({ homeTeam, awayTeam, plays }) => {
  const chartData = useMemo(() => {
    return plays.map((play, index) => {
      const isLastPlay = index === plays.length - 1;
      let probability = play.home_win_exp_after * 100;

      if (isLastPlay && play.away_score_after !== play.home_score_after) {
        probability = play.away_score_after > play.home_score_after ? 0 : 100;
      }

      return {
        probability,
        inning_half: play.top_inning,
        inning: play.inning,
        label: play.top_inning + " " + play.inning,
        description: play.description,
        homeScore: play.home_score_after,
        awayScore: play.away_score_after,
      };
    });
  }, [plays]);

  const [hoverData, setHoverData] = useState(chartData[chartData.length - 1]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.[0]) {
      const data = payload[0].payload;
      setHoverData(data);
      return (
        <div className="bg-white p-3 shadow-lg border border-gray-200 rounded-lg max-w-xs">
          <div className="text-sm font-medium text-gray-900 mb-1">
            {data.label}
          </div>
          {data.description && (
            <div className="text-xs text-gray-600 border-t border-gray-100 mt-1 pt-1">
              {data.description}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (!plays || plays.length === 0) {
    return <div>No play data available</div>;
  }

  const getWinProbabilityText = (data) => {
    if (!data || data.probability === undefined) return "";
    const probability = data.probability;
    const isHomeTeamLeading = probability >= 50;
    const leadingTeam = isHomeTeamLeading ? homeTeam : awayTeam;
    const displayProbability = isHomeTeamLeading
      ? probability
      : 100 - probability;
    return `${leadingTeam}: ${displayProbability.toFixed(1)}%`;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            {/* Away Team Score */}
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {awayTeam}
              </div>
              <div className="text-3xl font-bold">
                {hoverData
                  ? hoverData.awayScore
                  : plays[plays.length - 1].away_score_after}
              </div>
            </div>
            <div className="text-gray-400 text-xl">@</div>
            {/* Home Team Score */}
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {homeTeam}
              </div>
              <div className="text-3xl font-bold">
                {hoverData
                  ? hoverData.homeScore
                  : plays[plays.length - 1].home_score_after}
              </div>
            </div>

            {/* Inning Display */}
            <div className="text-lg font-medium text-gray-600">
              {hoverData
                ? hoverData.label
                : `${plays[plays.length - 1].top_inning} ${
                    plays[plays.length - 1].inning
                  }`}
            </div>
          </div>
          {/* Win Probability Display */}
          <div className="text-lg font-semibold text-gray-900">
            {getWinProbabilityText(hoverData)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-8 pt-8 pb-4 h-[400px] relative">
        {/* Team Labels overlaid on chart */}
        <div className="absolute left-6 top-2 text-sm font-medium text-gray-500">
          {awayTeam}
        </div>
        <div className="absolute left-6 bottom-2 text-sm font-medium text-gray-500">
          {homeTeam}
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onMouseLeave={() => setHoverData(chartData[chartData.length - 1])}
          >
            <YAxis domain={[0, 100]} hide={true} reversed={true} />
            <ReferenceLine y={50} stroke="#e5e7eb" strokeDasharray="3 3" />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="probability"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 6,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WinExpectancyChart;
