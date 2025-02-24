import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, ChevronLeft, Zap, TrendingUp, Award } from "lucide-react";
import WinExpectancyChart from "../components/game/WinExpectancyChart";
import GameLog from "../components/game/GameLog";
import { fetchAPI } from "../config/api";

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
          <div className="w-64 h-10 bg-gray-200 rounded-lg animate-pulse" />
          <div className="w-48 h-10 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse"
          >
            <div className="w-24 h-4 bg-gray-200 rounded mb-3" />
            <div className="w-32 h-6 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-6 mt-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8">
          <div className="w-40 h-6 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="w-full h-96 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8">
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-full h-16 bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ErrorDisplay = ({ error }) => (
  <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <div className="bg-red-50 border border-red-100 rounded-xl p-8 shadow-lg max-w-md w-full mx-4">
      <h3 className="text-red-800 font-semibold text-lg mb-3">
        Error Loading Game
      </h3>
      <p className="text-red-600">{error}</p>
    </div>
  </div>
);

const calculateGameStats = (gameData) => {
  if (!gameData?.plays?.length) return null;

  const lastPlay = gameData.plays[gameData.plays.length - 1];
  const homeScore = lastPlay?.home_score_after || 0;
  const awayScore = lastPlay?.away_score_after || 0;

  const biggestPlay = [...gameData.plays].sort(
    (a, b) => Math.abs(b.wpa) - Math.abs(a.wpa)
  )[0];

  const highestLeveragePlay = [...gameData.plays].sort(
    (a, b) => b.li - a.li
  )[0];

  const playerWPA = gameData.plays.reduce((acc, play) => {
    const isTopInning = play.top_inning;

    if (play.batter_name) {
      const batterWPA = isTopInning ? -play.wpa : play.wpa;
      acc[play.batter_name] = (acc[play.batter_name] || 0) + (batterWPA || 0);
    }

    if (play.pitcher_name) {
      const pitcherWPA = isTopInning ? play.wpa : -play.wpa;
      acc[play.pitcher_name] =
        (acc[play.pitcher_name] || 0) + (pitcherWPA || 0);
    }

    return acc;
  }, {});

  const mvp = Object.entries(playerWPA).sort((a, b) => b[1] - a[1])[0];

  let leadChanges = 1;
  let lastLeader = null;
  gameData.plays.forEach((play) => {
    const currentLeader =
      play.home_score_after > play.away_score_after
        ? "home"
        : play.away_score_after > play.home_score_after
        ? "away"
        : "tie";
    if (lastLeader && currentLeader !== "tie" && currentLeader !== lastLeader) {
      leadChanges++;
    }
    if (currentLeader !== "tie") lastLeader = currentLeader;
  });

  return {
    homeScore,
    awayScore,
    biggestPlay,
    highestLeveragePlay,
    mvp,
    leadChanges,
  };
};

const StatCard = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-2">
      <Icon className={`w-5 h-5 ${color}`} />
      <h3 className="font-semibold text-gray-700">{title}</h3>
    </div>
    <p className="text-xl font-bold text-gray-900">{value}</p>
  </div>
);

const GameContent = ({ gameData, handleBack }) => {
  const gameStats = calculateGameStats(gameData);

  if (!gameStats) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container max-w-full lg:max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8 backdrop-blur-xl">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 text-gray-400">
              <button
                onClick={handleBack}
                className="hover:text-gray-900 transition-colors rounded-full p-1 hover:bg-gray-50 group"
                aria-label="Back to scoreboard"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div className="h-4 w-px bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {new Date(gameData.game_date).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                {gameData.away_team} @ {gameData.home_team}
              </h1>
              <div className="flex items-center text-2xl font-bold">
                <span className="text-gray-900">{gameStats.awayScore}</span>
                <span className="mx-3 text-gray-400">-</span>
                <span className="text-gray-900">{gameStats.homeScore}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <StatCard
            icon={Zap}
            title="Biggest Play"
            value={
              gameStats.biggestPlay
                ? `${gameStats.biggestPlay.batter_name || "Unknown"} (${(
                    gameStats.biggestPlay.wpa * 100
                  ).toFixed(1)}% WPA)`
                : "N/A"
            }
            color="text-purple-500"
          />

          <StatCard
            icon={Award}
            title="Game MVP"
            value={
              gameStats.mvp
                ? `${gameStats.mvp[0]} (${(gameStats.mvp[1] * 100).toFixed(
                    1
                  )}% WPA)`
                : "N/A"
            }
            color="text-green-500"
          />

          <StatCard
            icon={TrendingUp}
            title="Lead Changes"
            value={gameStats.leadChanges}
            color="text-red-500"
          />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-1 h-8 bg-blue-500 rounded"></div>
              Win Probability
            </h2>
            <WinExpectancyChart
              homeTeam={gameData.home_team}
              awayTeam={gameData.away_team}
              plays={gameData.plays || []}
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-1 h-8 bg-green-500 rounded"></div>
              Game Log
            </h2>
            <div className="overflow-hidden rounded-xl">
              <GameLog
                plays={gameData.plays || []}
                homeTeam={gameData.home_team}
                awayTeam={gameData.away_team}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GamePage = () => {
  const { year, gameId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGameData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAPI(`/api/games/${year}/${gameId}`);
        setGameData(data);
      } catch (err) {
        console.error("Error fetching game data:", err);
        setError("Failed to load game data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, year]);

  const handleBack = () => {
    if (gameData?.plays?.length > 0) {
      const date = gameData.plays[0].game_date;
      navigate(`/scoreboard?date=${date}&division=${gameData.division}`);
    } else {
      navigate("/scoreboard");
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  if (!gameData) return null;

  return <GameContent gameData={gameData} handleBack={handleBack} />;
};

export default GamePage;
