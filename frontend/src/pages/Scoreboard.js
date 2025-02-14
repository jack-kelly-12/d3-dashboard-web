import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchAPI, API_BASE_URL } from "../config/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import InfoBanner from "../components/data/InfoBanner";
import SubscriptionManager from "../managers/SubscriptionManager";
import AuthManager from "../managers/AuthManager";

const DIVISIONS = [
  { label: "Division 1", value: 1 },
  { label: "Division 2", value: 2 },
  { label: "Division 3", value: 3 },
];

const DATE_RANGE = {
  min: 2021,
  max: 2024,
};

const TeamLogo = ({ teamId, teamName }) => {
  const [error, setError] = useState(false);

  if (error || !teamId) {
    const initials =
      teamName
        ?.split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "??";

    return (
      <div className="w-8 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-600">
        <span className="text-xs font-medium">{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={`${API_BASE_URL}/api/teams/logos/${teamId}.png`}
      alt={teamName}
      className="w-8 h-6 rounded-full"
      onError={() => setError(true)}
    />
  );
};

const DateControl = ({
  currentDate,
  onDateChange,
  onNavigate,
  displayDate,
  filterDate,
}) => (
  <div className="flex items-center gap-4">
    <DatePicker
      selected={currentDate}
      onChange={onDateChange}
      filterDate={filterDate}
      className="px-4 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
    />
    <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
      <button
        onClick={() => onNavigate(-1)}
        className="p-2 hover:bg-gray-50 text-gray-600 border-r border-gray-200"
      >
        <ChevronLeft size={20} />
      </button>
      <div className="px-4 py-2 flex items-center gap-2">
        <Calendar size={18} className="text-gray-500" />
        <span className="font-medium">{displayDate}</span>
      </div>
      <button
        onClick={() => onNavigate(1)}
        className="p-2 hover:bg-gray-50 text-gray-600 border-l border-gray-200"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  </div>
);

const DivisionSelector = ({ division, onDivisionChange }) => (
  <div className="flex items-center gap-2">
    <label className="text-sm font-medium text-gray-700">Division:</label>
    <select
      value={division}
      onChange={(e) => onDivisionChange(Number(e.target.value))}
      className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm text-gray-700
        focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
        hover:border-gray-300 transition-colors w-32"
    >
      {DIVISIONS.map((div) => (
        <option key={div.value} value={div.value}>
          {div.label}
        </option>
      ))}
    </select>
  </div>
);

const GameCard = ({ game }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/games/${game.year}/${game.game_id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md 
        transition-all duration-200 overflow-hidden cursor-pointer hover:border-blue-300"
    >
      <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2">
        <div className="text-sm text-gray-600">{game.game_date}</div>
      </div>

      <div className="p-4 space-y-4">
        {/* Teams */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TeamLogo
                teamId={game.away_team_logo_id}
                teamName={game.away_team}
              />
              <span className="font-medium">{game.away_team}</span>
            </div>
            <span className="font-mono font-bold">{game.away_score}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TeamLogo
                teamId={game.home_team_logo_id}
                teamName={game.home_team}
              />
              <span className="font-medium">{game.home_team}</span>
            </div>
            <span className="font-mono font-bold">{game.home_score}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">Game #{game.game_id}</div>
            <div className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              Final
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NoGames = () => (
  <div className="text-center py-12">
    <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
    <h3 className="text-lg font-medium text-gray-900">No Games Found</h3>
    <p className="text-gray-600 mt-1">
      Either no games have been played on this date, or data is not available
      yet.
    </p>
  </div>
);

const Scoreboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [state, setState] = useState({
    games: [],
    isLoading: true,
    error: null,
    currentDate: new Date(searchParams.get("date") || Date.now()),
    division: Number(searchParams.get("division")) || 3,
  });

  const formatDisplayDate = useCallback((date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }, []);

  const filterDate = useCallback((date) => {
    const year = date.getFullYear();
    return year >= DATE_RANGE.min && year <= DATE_RANGE.max;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const unsubscribeAuth = AuthManager.onAuthStateChanged(async (user) => {
        if (!isMounted) return;

        if (user) {
          const initialSubscription =
            await SubscriptionManager.getUserSubscription(user.uid);
          if (isMounted) {
            setIsPremiumUser(initialSubscription?.isActive || false);

            if (initialSubscription?.isActive) {
              setState((prev) => ({
                ...prev,
                division: searchParams.get("division")
                  ? Number(searchParams.get("division"))
                  : prev.division,
              }));
            }
          }

          SubscriptionManager.listenToSubscriptionUpdates(
            user.uid,
            (subscription) => {
              if (isMounted) {
                setIsPremiumUser(subscription?.isActive || false);
              }
            }
          );
        } else {
          if (isMounted) {
            setIsPremiumUser(false);
          }
        }

        setIsAuthReady(true);
      });

      return unsubscribeAuth;
    };

    const cleanup = initializeAuth();

    return () => {
      isMounted = false;
      cleanup.then((unsubscribe) => unsubscribe());
      SubscriptionManager.stopListening();
    };
  }, [searchParams]);

  useEffect(() => {
    if (isPremiumUser) {
      setState((prev) => ({
        ...prev,
        division: searchParams.get("division")
          ? Number(searchParams.get("division"))
          : prev.division,
      }));
    }
  }, [isPremiumUser, searchParams]);

  useEffect(() => {
    const localDate = new Date(
      state.currentDate.getTime() -
        state.currentDate.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];

    const params = { date: localDate };
    if (isPremiumUser) {
      params.division = state.division.toString();
    }

    setSearchParams(params);
  }, [state.currentDate, state.division, isPremiumUser, setSearchParams]);

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

  const handleDateChange = useCallback((date) => {
    setState((prev) => ({ ...prev, currentDate: date }));
  }, []);

  const handleDateNavigate = useCallback(
    (direction) => {
      const newDate = new Date(state.currentDate);
      newDate.setDate(state.currentDate.getDate() + direction);
      setState((prev) => ({ ...prev, currentDate: newDate }));
    },
    [state.currentDate]
  );

  const handleDivisionChange = useCallback((division) => {
    setState((prev) => ({ ...prev, division }));
  }, []);

  if (!isAuthReady || state.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-full lg:max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <InfoBanner dataType="scoreboard" />

        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <DateControl
            currentDate={state.currentDate}
            onDateChange={handleDateChange}
            onNavigate={handleDateNavigate}
            displayDate={formatDisplayDate(state.currentDate)}
            filterDate={filterDate}
          />

          {isPremiumUser && (
            <DivisionSelector
              division={state.division}
              onDivisionChange={handleDivisionChange}
            />
          )}
        </div>

        {state.error ? (
          <div className="text-center py-8 bg-red-50 rounded-lg mb-6">
            <div className="text-red-600">{state.error}</div>
          </div>
        ) : state.games.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {state.games.map((game) => (
              <GameCard key={game.game_id} game={game} />
            ))}
          </div>
        ) : (
          <NoGames />
        )}
      </div>
    </div>
  );
};

export default Scoreboard;
