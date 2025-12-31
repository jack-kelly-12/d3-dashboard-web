import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Calendar, ChevronLeft, Zap, TrendingUp, Award, Flame } from "lucide-react";
import WinExpectancyChart from "../components/game/WinExpectancyChart";
import GameLog from "../components/game/GameLog";
import { fetchAPI } from "../config/api";

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[6%] right-[8%] w-[380px] h-[380px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[12%] left-[6%] w-[520px] h-[520px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-[48%] right-[28%] w-[300px] h-[300px] bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse delay-500" />
      <div className="absolute top-[18%] left-[18%] w-[220px] h-[220px] bg-gradient-to-r from-indigo-400/25 to-purple-400/25 rounded-full blur-xl animate-pulse delay-700" />
    </div>
    <div className="container max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 py-16">
      <div className="w-24 sm:w-32 h-4 sm:h-6 bg-gray-200 rounded animate-pulse mb-4 sm:mb-6" />
      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 mb-4 sm:mb-8" />
      <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 sm:h-24 bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse" />
        ))}
      </div>
      <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 h-72" />
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 h-72" />
      </div>
    </div>
  </div>
);

const ErrorDisplay = ({ error }) => (
  <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
    <div className="bg-red-50 border border-red-100 rounded-xl p-4 sm:p-8 shadow-lg max-w-md w-full">
      <h3 className="text-red-800 font-semibold text-base sm:text-lg mb-2 sm:mb-3">Error Loading Game</h3>
      <p className="text-red-600 text-sm sm:text-base">{error}</p>
    </div>
  </div>
);

const calculateGameStats = (gameData) => {
  if (!gameData?.plays?.length) return null;
  const lastPlay = gameData.plays[gameData.plays.length - 1];
  const homeScore = lastPlay?.home_score_after || 0;
  const awayScore = lastPlay?.away_score_after || 0;
  const biggestPlay = [...gameData.plays].sort((a, b) => Math.abs(b.wpa) - Math.abs(a.wpa))[0];
  const playerWPA = gameData.plays.reduce((acc, play) => {
    if (play.batter_name) acc[play.batter_name] = (acc[play.batter_name] || 0) + (play.wpa || 0);
    if (play.pitcher_name) acc[play.pitcher_name] = (acc[play.pitcher_name] || 0) - (play.wpa || 0);
    return acc;
  }, {});
  const mvp = Object.entries(playerWPA).sort((a, b) => b[1] - a[1])[0];
  let leadChanges = 1;
  let lastLeader = null;
  gameData.plays.forEach((play) => {
    const currentLeader = play.home_score_after > play.away_score_after ? "home" : play.away_score_after > play.home_score_after ? "away" : "tie";
    if (lastLeader && currentLeader !== "tie" && currentLeader !== lastLeader) leadChanges++;
    if (currentLeader !== "tie") lastLeader = currentLeader;
  });
  
  // Leverage-Weighted Excitement Index
  // EI_LI = Σ |WE_i - WE_{i-1}| × LI_i
  const excitementIndex = gameData.plays.reduce((sum, play) => {
    const wpaAbs = Math.abs(play.wpa || 0);
    const li = play.li || 1;
    return sum + (wpaAbs * li);
  }, 0);
  
  return { homeScore, awayScore, biggestPlay, mvp, leadChanges, excitementIndex };
};

const KPIChip = ({ icon: Icon, label, value, color, tooltip }) => (
  <div className="relative group flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm cursor-default">
    <Icon className="w-4 h-4" style={{ color }} />
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600">{label}:</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
    {tooltip && (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
        {tooltip}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    )}
  </div>
);

const TeamLogo = ({ teamId, teamName }) => (
  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
    <img
      src={teamId ? `https://d3-dashboard-kellyjc.s3.us-east-2.amazonaws.com/images/${teamId}.png` : `https://d3-dashboard-kellyjc.s3.us-east-2.amazonaws.com/images/0.png`}
      alt={teamName}
      className="w-full h-full object-cover"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = `https://d3-dashboard-kellyjc.s3.us-east-2.amazonaws.com/images/0.png`;
      }}
    />
  </div>
);

const GameHeader = ({ gameData, onBack, fallbackHomeId, fallbackAwayId }) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const formattedDate = useMemo(() => {
    const raw = gameData.game_date;
    let d;
    if (typeof raw === "string" && /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(raw)) {
      const [, mm, dd, yyyy] = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    } else {
      d = new Date(raw);
    }
    if (Number.isNaN(d.getTime())) return String(raw || "");
    if (windowWidth < 640) return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }, [gameData.game_date, windowWidth]);
  const stats = calculateGameStats(gameData);
  if (!stats) return null;
  return (
    <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="hover:text-gray-900 text-gray-500 transition-colors rounded-full p-1 hover:bg-gray-50 group" aria-label="Back to scoreboard">
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span className="text-xs sm:text-sm">{formattedDate}</span>
        </div>
        {Number.isFinite(Number(gameData.attendance)) ? (
          <div className="text-xs sm:text-sm text-gray-600">
            Attendance: {Number(gameData.attendance).toLocaleString()}
          </div>
        ) : <div className="w-16" />}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 items-center">
        <div className="flex items-center sm:justify-start justify-center gap-3">
          <TeamLogo teamId={gameData.away_team_id || fallbackAwayId} teamName={gameData.away_team} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">{gameData.away_team}</div>
          </div>
        </div>
        <div className="flex items-center justify-center mt-3 sm:mt-0">
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
            {stats.awayScore}
            <span className="mx-2 text-gray-400">-</span>
            {stats.homeScore}
          </div>
        </div>
        <div className="flex items-center sm:justify-end justify-center gap-3 mt-3 sm:mt-0">
          <div className="min-w-0 text-right">
            <div className="text-sm font-medium text-gray-800 truncate">{gameData.home_team}</div>
          </div>
          <TeamLogo teamId={gameData.home_team_id || fallbackHomeId} teamName={gameData.home_team} />
        </div>
      </div>
    </div>
  );
};

const KPIChips = ({ gameData }) => {
  const stats = calculateGameStats(gameData);
  if (!stats) return null;
  
  const getExcitementColor = (ei) => {
    if (ei >= 2.5) return "#dc2626";    // red-600 - Instant classic
    if (ei >= 1.5) return "#f97316";    // orange-500 - Exciting
    if (ei >= 1.0) return "#f59e0b";    // amber-500 - Competitive
    return "#9ca3af";                    // gray-400 - Routine
  };
  
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        <KPIChip
          icon={Flame}
          label="Excitement"
          value={stats.excitementIndex.toFixed(2)}
          color={getExcitementColor(stats.excitementIndex)}
        />
        <KPIChip
          icon={Zap}
          label="Biggest Play"
          value={stats.biggestPlay ? `${stats.biggestPlay.batter_name || "Unknown"} · ${(stats.biggestPlay.wpa * 100).toFixed(1)}%` : "N/A"}
          color="#a855f7"
        />
        <KPIChip
          icon={Award}
          label="Game MVP"
          value={stats.mvp ? `${stats.mvp[0]} · ${(stats.mvp[1] * 100).toFixed(1)}%` : "N/A"}
          color="#16a34a"
        />
        <KPIChip
          icon={TrendingUp}
          label="Lead Changes"
          value={stats.leadChanges}
          color="#e11d48"
        />
      </div>
    </div>
  );
};

const Card = ({ children }) => (
  <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
    {children}
  </div>
);

const useGameData = (year, gameId) => {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let didCancel = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAPI(`/api/games/${year}/${gameId}`, { signal: controller.signal });
        if (!didCancel) setGameData({ ...data, plays: data.plays });
      } catch (err) {
        if (!didCancel && err.name !== "AbortError") setError("Failed to load game data");
      } finally {
        if (!didCancel) setLoading(false);
      }
    };

    run();
    return () => {
      didCancel = true;
      controller.abort();
    };
  }, [year, gameId]);

  return { gameData, loading, error };
};

const GamePage = () => {
  const { year, gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { gameData, loading, error } = useGameData(year, gameId);

  const { fallbackHomeId, fallbackAwayId } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const homeId = params.get("homeId");
    const awayId = params.get("awayId");
    return {
      fallbackHomeId: homeId ? Number(homeId) : null,
      fallbackAwayId: awayId ? Number(awayId) : null,
    };
  }, [location.search]);

  const handleBack = () => {
    if (gameData?.game_date) {
      navigate(`/scoreboard?date=${gameData.game_date}&division=${gameData.division}`);
    } else {
      navigate("/scoreboard");
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  if (!gameData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[6%] right-[8%] w-[380px] h-[380px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[12%] left-[6%] w-[520px] h-[520px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-[48%] right-[28%] w-[300px] h-[300px] bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse delay-500" />
        <div className="absolute top-[18%] left-[18%] w-[220px] h-[220px] bg-gradient-to-r from-indigo-400/25 to-purple-400/25 rounded-full blur-xl animate-pulse delay-700" />
      </div>
      <div className="relative z-10 container max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 py-16">
        <GameHeader gameData={gameData} onBack={handleBack} fallbackHomeId={fallbackHomeId} fallbackAwayId={fallbackAwayId} />
        <KPIChips gameData={gameData} />
        <div className="space-y-4">
          <div className="h-px bg-gray-200" />
          <Card>
            <WinExpectancyChart homeTeam={gameData.home_team} awayTeam={gameData.away_team} homeTeamId={gameData.home_team_id || fallbackHomeId} awayTeamId={gameData.away_team_id || fallbackAwayId} plays={gameData.plays || []} />
          </Card>
          <div className="h-px bg-gray-200" />
          <Card>
            <div className="rounded-lg sm:rounded-xl">
              <GameLog plays={gameData.plays || []} homeTeam={gameData.home_team} awayTeam={gameData.away_team} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
