import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, ChevronLeft, Zap, TrendingUp, Award } from "lucide-react";
import WinExpectancyChart from "../components/game/WinExpectancyChart";
import GameLog from "../components/game/GameLog";
import { fetchAPI } from "../config/api";

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
      <div className="w-24 sm:w-32 h-4 sm:h-6 bg-gray-200 rounded animate-pulse mb-4 sm:mb-6" />
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8 mb-4 sm:mb-8 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-6">
          <div className="w-48 sm:w-64 h-8 sm:h-10 bg-gray-200 rounded-lg animate-pulse" />
          <div className="w-32 sm:w-48 h-6 sm:h-10 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-20 sm:h-24 bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-pulse"
          >
            <div className="w-20 sm:w-24 h-3 sm:h-4 bg-gray-200 rounded mb-2 sm:mb-3" />
            <div className="w-28 sm:w-32 h-5 sm:h-6 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-md sm:shadow-lg p-4 sm:p-6 md:p-8">
          <div className="w-32 sm:w-40 h-5 sm:h-6 bg-gray-200 rounded animate-pulse mb-4 sm:mb-8" />
          <div className="w-full h-64 sm:h-80 md:h-96 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-md sm:shadow-lg p-4 sm:p-6 md:p-8">
          <div className="w-24 sm:w-32 h-5 sm:h-6 bg-gray-200 rounded animate-pulse mb-4 sm:mb-8" />
          <div className="space-y-2 sm:space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-full h-12 sm:h-16 bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ErrorDisplay = ({ error }) => (
  <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
    <div className="bg-red-50 border border-red-100 rounded-xl p-4 sm:p-8 shadow-lg max-w-md w-full">
      <h3 className="text-red-800 font-semibold text-base sm:text-lg mb-2 sm:mb-3">
        Error Loading Game
      </h3>
      <p className="text-red-600 text-sm sm:text-base">{error}</p>
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
    if (play.batter_name) {
      acc[play.batter_name] = (acc[play.batter_name] || 0) + (play.wpa || 0);
    }

    if (play.pitcher_name) {
      acc[play.pitcher_name] = (acc[play.pitcher_name] || 0) + (-play.wpa || 0);
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
  <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
      <h3 className="font-semibold text-sm sm:text-base text-gray-700">
        {title}
      </h3>
    </div>
    <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 line-clamp-2">
      {value}
    </p>
  </div>
);

const GameContent = ({ gameData, handleBack }) => {
  const gameStats = calculateGameStats(gameData);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (windowWidth < 640) {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!gameStats) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container max-w-full lg:max-w-[1200px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="bg-white rounded-xl sm:rounded-xl shadow-md sm:shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8 backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-3 text-gray-400">
              <button
                onClick={handleBack}
                className="hover:text-gray-900 transition-colors rounded-full p-1 hover:bg-gray-50 group"
                aria-label="Back to scoreboard"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div className="h-3 sm:h-4 w-px bg-gray-200"></div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">
                  {formatDate(gameData.game_date)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-gray-900">
                {gameData.away_team} @ {gameData.home_team}
              </h1>
              <div className="flex items-center text-xl sm:text-2xl font-bold mt-2 sm:mt-0">
                <span className="text-gray-900">{gameStats.awayScore}</span>
                <span className="mx-2 sm:mx-3 text-gray-400">-</span>
                <span className="text-gray-900">{gameStats.homeScore}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-4 sm:mb-6 md:mb-8">
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

        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-md sm:shadow-lg p-4 sm:p-6 md:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2 sm:gap-3">
              <div className="w-1 h-6 sm:h-8 bg-blue-500 rounded"></div>
              Win Probability
            </h2>
            <WinExpectancyChart
              homeTeam={gameData.home_team}
              awayTeam={gameData.away_team}
              homeTeamId={gameData.home_team_id}
              awayTeamId={gameData.away_team_id}
              plays={gameData.plays || []}
            />
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-md sm:shadow-lg p-4 sm:p-6 md:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2 sm:gap-3">
              <div className="w-1 h-6 sm:h-8 bg-green-500 rounded"></div>
              Game Log
            </h2>
            <div className="overflow-hidden rounded-lg sm:rounded-xl">
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
