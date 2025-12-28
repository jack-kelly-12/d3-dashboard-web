import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchAPI } from "../../config/api";

const PlayerSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const debounceTimerRef = useRef(null);

  const cacheRef = useRef({});

  const debouncedSearch = useCallback((searchQuery) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      searchPlayers(searchQuery);
    }, 300);
  }, []);

  const searchPlayers = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    if (cacheRef.current[searchQuery]) {
      setResults(cacheRef.current[searchQuery]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchAPI(
        `/api/search/players?q=${encodeURIComponent(searchQuery)}`
      );
      const topResults = data.slice(0, 5);
      setResults(topResults);

      cacheRef.current[searchQuery] = topResults;

      const cacheKeys = Object.keys(cacheRef.current);
      if (cacheKeys.length > 50) {
        delete cacheRef.current[cacheKeys[0]];
      }
    } catch (error) {
      console.error("Error searching players:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0) {
        navigate(
          `/player/${
            results[selectedIndex].player_id || results[selectedIndex].playerId
          }`
        );
      } else if (results.length > 0) {
        navigate(`/player/${results[0].player_id || results[0].playerId}`);
      }
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    debouncedSearch(value);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search players..."
          className="w-full h-12 px-4 pl-12 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-sm transition-all duration-200 placeholder:text-gray-400"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {results.length > 0 && query && (
        <div className="absolute z-[99999] w-full bg-white mt-2 rounded-xl shadow-2xl border border-gray-200 overflow-hidden" style={{ zIndex: 99999 }}>
          <div className="max-h-80 overflow-y-auto">
            {results.map((player, index) => (
            <div
              key={player.player_id || player.playerId || index}
              onClick={() =>
                navigate(`/player/${player.player_id || player.playerId}`)
              }
              onMouseEnter={() => setSelectedIndex(index)}
              className={`cursor-pointer p-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">
                    {player.playerName}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {player.team} • {player.conference}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
              </div>
            </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerSearch;
