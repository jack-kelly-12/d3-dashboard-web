import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchAPI } from "../../config/api";

const PlayerSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const debounceTimerRef = useRef(null);

  // Cache for search results
  const cacheRef = useRef({});

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      searchPlayers(searchQuery);
    }, 300); // 300ms debounce delay
  }, []);

  const searchPlayers = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    // Check if we have cached results
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

      // Cache the results
      cacheRef.current[searchQuery] = topResults;

      // Limit cache size to prevent memory issues
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
        // Navigate to first result if none selected but results exist
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

  // Clean up debounce timer on unmount
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
          placeholder="Search for a player..."
          className="w-full h-12 px-4 pl-12 text-base rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {results.length > 0 && query && (
        <div className="absolute z-50 w-full bg-white mt-1 rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {results.map((player, index) => (
            <div
              key={player.player_id || player.playerId || index}
              onClick={() =>
                navigate(`/player/${player.player_id || player.playerId}`)
              }
              onMouseEnter={() => setSelectedIndex(index)}
              className={`cursor-pointer p-3 hover:bg-gray-50 ${
                index === selectedIndex ? "bg-gray-50" : ""
              }`}
            >
              <div className="font-semibold text-gray-900">
                {player.playerName}
              </div>
              <div className="text-sm text-gray-500">
                {player.team} • {player.conference}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerSearch;
