import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchAPI, API_BASE_URL } from "../config/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import InfoBanner from "../components/data/InfoBanner";
import { useSearchParams } from "react-router-dom";

const TeamLogo = ({ teamId, teamName }) => {
  const [error, setError] = useState(false);

  const InitialsDisplay = () => {
    const initials =
      teamName
        ?.split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "??";

    return (
      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600">
        <span className="text-xs font-medium">{initials}</span>
      </div>
    );
  };

  if (error || !teamId) {
    return <InitialsDisplay />;
  }

  return (
    <img
      src={`${API_BASE_URL}/api/teams/logos/${teamId}.png`}
      alt={teamName}
      className="w-8 h-8 rounded-full"
      onError={() => setError(true)}
    />
  );
};

const GameCard = ({ game }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/games/${game.year}/${game.game_id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer hover:border-blue-300"
    >
      <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2">
        <div className="text-sm text-gray-600">{game.game_date}</div>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          {/* Away Team */}
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

          {/* Home Team */}
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

const Scoreboard = () => {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(() => {
    const dateParam = searchParams.get("date");
    return dateParam ? new Date(dateParam) : new Date();
  });

  useEffect(() => {
    const localDate = new Date(
      currentDate.getTime() - currentDate.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];

    setSearchParams({
      date: localDate,
    });
  }, [currentDate, setSearchParams]);

  useEffect(() => {
    const fetchGames = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const dateStr = formatAPIDate(currentDate);

        const response = await fetchAPI(
          `/api/games?month=${dateStr.month}&day=${dateStr.day}&year=${dateStr.year}`
        );

        if (Array.isArray(response)) {
          setGames(response);
        } else if (response.games) {
          setGames(response.games);
        } else if (response.error) {
          setError(response.error);
          setGames([]);
        } else {
          setGames([]);
        }
      } catch (err) {
        setError(err.message || "Failed to load games");
        setGames([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, [currentDate]);

  const formatDisplayDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatAPIDate = (date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return { month, day, year };
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  // Custom date validation for DatePicker
  const filterDate = (date) => {
    const year = date.getFullYear();
    return year >= 2021 && year <= 2024;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-[calc(100vw-128px)] lg:max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8">
        <InfoBanner dataType={"scoreboard"} />

        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Date Picker */}
            <div className="relative">
              <DatePicker
                selected={currentDate}
                onChange={(date) => setCurrentDate(date)}
                filterDate={filterDate}
                className="px-4 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Arrow Navigation */}
            <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 hover:bg-gray-50 text-gray-600 border-r border-gray-200"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="px-4 py-2 flex items-center gap-2">
                <Calendar size={18} className="text-gray-500" />
                <span className="font-medium">
                  {formatDisplayDate(currentDate)}
                </span>
              </div>

              <button
                onClick={() => navigateDate(1)}
                className="p-2 hover:bg-gray-50 text-gray-600 border-l border-gray-200"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center py-8 bg-red-50 rounded-lg mb-6">
            <div className="text-red-600">{error}</div>
          </div>
        )}

        {/* Games Grid */}
        {!error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game) => (
              <GameCard key={game.game_id} game={game} />
            ))}
          </div>
        )}

        {/* No Games Message */}
        {!error && games.length === 0 && (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No Games Found
            </h3>
            <p className="text-gray-600 mt-1">
              There are no games recorded for this date
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scoreboard;
