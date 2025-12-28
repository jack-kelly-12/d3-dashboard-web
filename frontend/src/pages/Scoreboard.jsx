import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar } from "lucide-react";
import { fetchAPI } from "../config/api";
import DataControls from "../components/data/DataControls";
import AuthManager from "../managers/AuthManager";
import { DEFAULT_DIVISION } from "../config/constants";

const TeamLogo = ({ teamId, teamName }) => (
  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
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

const GameCard = ({ game }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const params = new URLSearchParams();
    if (game.home_org_id) params.set("homeId", String(game.home_org_id));
    if (game.away_org_id) params.set("awayId", String(game.away_org_id));
    navigate(`/games/${game.year}/${game.contest_id}?${params.toString()}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md 
        transition-all duration-200 overflow-hidden cursor-pointer hover:border-blue-300"
    >
      <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100 px-3 sm:px-4 py-2">
        <div className="text-xs sm:text-sm text-gray-600 truncate">
          {game.game_date}
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Teams */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <TeamLogo teamId={game.away_org_id} teamName={game.away_team} />
              <span className="font-medium truncate">{game.away_team}</span>
            </div>
            <span className="font-mono font-bold ml-2">{game.away_score}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <TeamLogo teamId={game.home_org_id} teamName={game.home_team} />
              <span className="font-medium truncate">{game.home_team}</span>
            </div>
            <span className="font-mono font-bold ml-2">{game.home_score}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 sm:pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="text-gray-600 truncate">Game #{game.contest_id}</div>
            <div className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 ml-2 flex-shrink-0">
              Final
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NoGames = () => (
  <div className="text-center py-8 sm:py-12">
    <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
    <h3 className="text-lg font-medium text-gray-900">No Games Found</h3>
    <p className="text-gray-600 mt-1 px-4">
      Either no games have been played on this date, or data is not available
      yet.
    </p>
  </div>
);

const Scoreboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [state, setState] = useState({
    games: [],
    isLoading: true,
    error: null,
    currentDate: new Date(searchParams.get("date") || Date.now()),
    division: Number(searchParams.get("division")) || DEFAULT_DIVISION,
  });

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const unsubscribeAuth = AuthManager.onAuthStateChanged(async (user) => {
        if (!isMounted) return;

        if (user) {
          // Update division from URL
          setState((prev) => ({
            ...prev,
            division: searchParams.get("division")
              ? Number(searchParams.get("division"))
              : prev.division,
          }));
        }

        setIsAuthReady(true);
      });

      return unsubscribeAuth;
    };

    const cleanup = initializeAuth();

    return () => {
      isMounted = false;
      cleanup.then((unsubscribe) => unsubscribe());
    };
  }, [searchParams]);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      division: searchParams.get("division")
        ? Number(searchParams.get("division"))
        : prev.division,
    }));
  }, [searchParams]);

  useEffect(() => {
    const localDate = new Date(
      state.currentDate.getTime() -
        state.currentDate.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];

    const params = { date: localDate, division: state.division.toString() };

    setSearchParams(params);
  }, [state.currentDate, state.division, setSearchParams]);

  const fetchGames = useCallback(async () => {
    if (!isAuthReady) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const month = (state.currentDate.getMonth() + 1)
        .toString()
        .padStart(2, "0");
      const day = state.currentDate.getDate().toString().padStart(2, "0");
      const year = state.currentDate.getFullYear();

      const response = await fetchAPI(
        `/api/games?month=${month}&day=${day}&year=${year}&division=${state.division}`
      );

      setState((prev) => ({
        ...prev,
        games: Array.isArray(response) ? response : response.games || [],
        error: response.error || null,
        isLoading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err.message || "Failed to load games",
        games: [],
        isLoading: false,
      }));
    }
  }, [state.currentDate, state.division, isAuthReady]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);


  if (!isAuthReady || state.isLoading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[6%] right-[8%] w-[380px] h-[380px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[12%] left-[6%] w-[520px] h-[520px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-[48%] right-[28%] w-[300px] h-[300px] bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse delay-500"></div>
          <div className="absolute top-[18%] left-[18%] w-[220px] h-[220px] bg-gradient-to-r from-indigo-400/25 to-purple-400/25 rounded-full blur-xl animate-pulse delay-700"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[6%] right-[8%] w-[380px] h-[380px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[12%] left-[6%] w-[520px] h-[520px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-[48%] right-[28%] w-[300px] h-[300px] bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse delay-500"></div>
        <div className="absolute top-[18%] left-[18%] w-[220px] h-[220px] bg-gradient-to-r from-indigo-400/25 to-purple-400/25 rounded-full blur-xl animate-pulse delay-700"></div>
      </div>
      <div className="relative z-10 container max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 py-16">
        <div className="relative z-10 mb-6">
          <div className="relative overflow-hidden rounded-2xl border border-white/30 bg-white/60 backdrop-blur p-4 sm:p-5 shadow-xl">
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 blur-2xl" />
            <div className="relative z-10 flex items-start gap-3 sm:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex-shrink-0">
                i
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm sm:text-base font-semibold text-gray-800 mb-1 truncate">Game Scores & Results</div>
                <div className="text-xs sm:text-sm text-gray-600">Browse live and completed game scores across all divisions. Scores update as data is ingested. Select a date and division to view games with play-by-play level data.</div>
              </div>
            </div>
          </div>
        </div>


        <div id="controls" className="relative z-10 mb-6">
          <DataControls
            dataType={"scoreboard"}
            setDataType={() => {}}
            selectedYears={[]}
            setSelectedYears={() => {}}
            currentDate={state.currentDate}
            setCurrentDate={(d) => setState((prev) => ({ ...prev, currentDate: d }))}
            minPA={0}
            setMinPA={() => {}}
            minIP={0}
            setMinIP={() => {}}
            searchTerm={""}
            setSearchTerm={() => {}}
            conference={""}
            setConference={() => {}}
            division={state.division}
            setDivision={(div) => setState((prev) => ({ ...prev, division: div }))}
            selectedListId={""}
            setSelectedListId={() => {}}
            conferences={[]}
            allowedDataTypes={["scoreboard"]}
            onApplyFilters={() => {}}
          />
        </div>

        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
          {state.error ? (
            <div className="text-center py-6 sm:py-8 bg-red-50/80 backdrop-blur rounded-2xl border border-red-100 mb-6">
              <div className="text-red-700 px-4">{state.error}</div>
            </div>
          ) : state.games.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {state.games.map((game) => (
                <GameCard key={game.contest_id} game={game} />
              ))}
            </div>
          ) : (
            <NoGames />
          )}
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;
