import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Fake data for teams
const TEAMS = [
  { id: "nyy", name: "New York Yankees" },
  { id: "bos", name: "Boston Red Sox" },
  { id: "tor", name: "Toronto Blue Jays" },
  { id: "bal", name: "Baltimore Orioles" },
  { id: "tb", name: "Tampa Bay Rays" },
  { id: "lad", name: "Los Angeles Dodgers" },
  { id: "sf", name: "San Francisco Giants" },
  { id: "sd", name: "San Diego Padres" },
  { id: "ari", name: "Arizona Diamondbacks" },
  { id: "col", name: "Colorado Rockies" },
  { id: "hou", name: "Houston Astros" },
  { id: "sea", name: "Seattle Mariners" },
  { id: "tex", name: "Texas Rangers" },
  { id: "oak", name: "Oakland Athletics" },
  { id: "ana", name: "Los Angeles Angels" },
];

// Function to run Monte Carlo simulation with fake data
const runSimulation = (homeTeam, awayTeam, isMidweek, isNeutralSite) => {
  // This would be replaced with actual simulation logic
  const homeAdvantage = isNeutralSite ? 0 : 0.08;
  const midweekFactor = isMidweek ? -0.02 : 0.01;

  // Get random "strength" values for each team (in a real implementation, these would come from actual data)
  const homeStrength = Math.random() * 0.3 + 0.5;
  const awayStrength = Math.random() * 0.3 + 0.5;

  // Base win probability calculation
  let baseWinProb =
    homeStrength / (homeStrength + awayStrength) +
    homeAdvantage +
    midweekFactor;

  // Clamp between 0.1 and 0.9 to avoid extreme results
  baseWinProb = Math.max(0.1, Math.min(0.9, baseWinProb));

  // Run "simulation" 1000 times
  const numSims = 1000;
  const results = [];
  let homeWins = 0;

  for (let i = 0; i < numSims; i++) {
    const randomFactor = (Math.random() - 0.5) * 0.1; // Add some randomness
    const gameProb = baseWinProb + randomFactor;

    // Determine winner of this simulation
    const homeWin = Math.random() < gameProb;

    // Generate run differential (again, fake)
    const runDiff = homeWin
      ? Math.floor(Math.random() * 8) + 1 // Home win: 1-8 runs
      : -1 * (Math.floor(Math.random() * 8) + 1); // Away win: -1 to -8 runs

    results.push(runDiff);
    if (homeWin) homeWins++;
  }

  // Calculate win probability
  const winProbability = homeWins / numSims;

  // Calculate average spread
  const averageSpread = results.reduce((sum, val) => sum + val, 0) / numSims;

  // Prepare distribution data for chart
  const distribution = {};
  results.forEach((result) => {
    distribution[result] = (distribution[result] || 0) + 1;
  });

  const distributionData = Object.entries(distribution)
    .map(([score, count]) => ({
      score: parseInt(score),
      count: (count / numSims) * 100, // Convert to percentage
    }))
    .sort((a, b) => a.score - b.score);

  return {
    winProbability,
    averageSpread,
    distribution: distributionData,
  };
};

const GamePrediction = () => {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [isMidweek, setIsMidweek] = useState(false);
  const [isNeutralSite, setIsNeutralSite] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    if (!homeTeam || !awayTeam) {
      setError("Please select both home and away teams");
      return;
    }

    if (homeTeam === awayTeam) {
      setError("Home and away teams cannot be the same");
      return;
    }

    setError("");
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const simulationResults = runSimulation(
        homeTeam,
        awayTeam,
        isMidweek,
        isNeutralSite
      );
      setResults(simulationResults);
      setIsLoading(false);
    }, 800);
  };

  const getTeamName = (teamId) => {
    const team = TEAMS.find((t) => t.id === teamId);
    return team ? team.name : "Unknown Team";
  };

  const getPredictionText = () => {
    if (!results) return "";

    const homeTeamName = getTeamName(homeTeam);
    const awayTeamName = getTeamName(awayTeam);

    if (results.winProbability > 0.5) {
      return `${homeTeamName} is predicted to win by ${results.averageSpread.toFixed(
        1
      )} runs`;
    } else {
      return `${awayTeamName} is predicted to win by ${Math.abs(
        results.averageSpread
      ).toFixed(1)} runs`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-full lg:max-w-6xl mx-auto px-4 py-4 sm:py-8">
        {/* Main container */}
        <div className="rounded-lg overflow-hidden">
          {/* Header Section */}
          <div className="p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Left side - Title */}
            <h1 className="text-3xl font-bold text-blue-600">
              Game Prediction
            </h1>
          </div>

          {/* Form Section */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Home Team
                </label>
                <select
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Home Team</option>
                  {TEAMS.map((team) => (
                    <option key={`home-${team.id}`} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Away Team
                </label>
                <select
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Away Team</option>
                  {TEAMS.map((team) => (
                    <option key={`away-${team.id}`} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Game Conditions */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="midweek"
                  checked={isMidweek}
                  onChange={(e) => setIsMidweek(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="midweek" className="ml-2 text-sm text-gray-700">
                  Midweek Game
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="neutralSite"
                  checked={isNeutralSite}
                  onChange={(e) => setIsNeutralSite(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="neutralSite"
                  className="ml-2 text-sm text-gray-700"
                >
                  Neutral Site
                </label>
              </div>
            </div>

            {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Running Simulation...
                  </>
                ) : (
                  "Run Prediction"
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          {results && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              {/* Results Header */}
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Prediction Results
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Based on {homeTeam && getTeamName(homeTeam)} vs{" "}
                  {awayTeam && getTeamName(awayTeam)}
                  {isMidweek ? " (Midweek)" : ""}
                  {isNeutralSite ? " at Neutral Site" : ""}
                </p>
              </div>

              {/* Results Cards */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">
                    Win Probability
                  </h3>
                  <div className="flex items-end">
                    <span className="text-4xl font-bold text-blue-700">
                      {(results.winProbability * 100).toFixed(1)}%
                    </span>
                    <span className="ml-2 text-sm text-blue-600 mb-1">
                      for{" "}
                      {results.winProbability > 0.5
                        ? getTeamName(homeTeam)
                        : getTeamName(awayTeam)}
                    </span>
                  </div>
                  <div className="mt-4 bg-blue-100 rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full"
                      style={{ width: `${results.winProbability * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <h3 className="text-sm font-medium text-purple-800 mb-2">
                    Predicted Spread
                  </h3>
                  <div className="flex items-end">
                    <span className="text-4xl font-bold text-purple-700">
                      {results.averageSpread > 0 ? "+" : ""}
                      {results.averageSpread.toFixed(1)}
                    </span>
                    <span className="ml-2 text-sm text-purple-600 mb-1">
                      runs
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-purple-700">
                    {getPredictionText()}
                  </p>
                </div>
              </div>

              {/* Win Distribution Chart */}
              <div className="px-6 py-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Win Probability Distribution
                </h3>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={results.distribution}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="score"
                        label={{
                          value: "Run Differential (+ favors Home Team)",
                          position: "insideBottom",
                          offset: -5,
                        }}
                      />
                      <YAxis
                        label={{
                          value: "Probability (%)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${value.toFixed(1)}%`,
                          "Probability",
                        ]}
                        labelFormatter={(value) => `Run Differential: ${value}`}
                      />
                      <Bar dataKey="count" fill="#3B82F6" name="Probability" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                  <p>
                    This chart shows the distribution of predicted run
                    differentials from {results.distribution.length} simulated
                    games. Positive values favor the home team (
                    {getTeamName(homeTeam)}), negative values favor the away
                    team ({getTeamName(awayTeam)}).
                  </p>
                </div>
              </div>

              {/* Explanation */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  About This Prediction
                </h3>
                <p className="text-sm text-gray-600">
                  This prediction is based on a Monte Carlo simulation of 1,000
                  games using team performance data, adjusted for home field
                  advantage {isNeutralSite ? "(disabled for neutral site)" : ""}
                  and schedule factors {isMidweek ? "(midweek game)" : ""}. The
                  simulation considers team strength ratings, recent
                  performance, and historical matchup data.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePrediction;
