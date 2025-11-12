import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchAPI } from "../config/api";

const GlobalPlayerSearch = ({ collapsed = false, className = "" }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const debounceTimerRef = useRef(null);
  const searchRef = useRef(null);
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
      setIsOpen(false);
      return;
    }

    if (cacheRef.current[searchQuery]) {
      setResults(cacheRef.current[searchQuery]);
      setIsOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchAPI(
        `/api/search/players?q=${encodeURIComponent(searchQuery)}`
      );
      const topResults = data.slice(0, 8);
      setResults(topResults);
      setIsOpen(true);

      cacheRef.current[searchQuery] = topResults;

      const cacheKeys = Object.keys(cacheRef.current);
      if (cacheKeys.length > 50) {
        delete cacheRef.current[cacheKeys[0]];
      }
    } catch (error) {
      console.error("Error searching players:", error);
      setResults([]);
      setIsOpen(false);
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
        handleClose();
      } else if (results.length > 0) {
        navigate(`/player/${results[0].player_id || results[0].playerId}`);
        handleClose();
      }
    } else if (e.key === "Escape") {
      handleClose();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    debouncedSearch(value);
  };

  const handleClose = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handlePlayerClick = (player) => {
    navigate(`/player/${player.player_id || player.playerId}`);
    handleClose();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (collapsed) {
    return (
      <div className="relative" ref={searchRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-10 flex items-center justify-center text-gray-500 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200"
        >
          <Search className="w-4 h-4" />
        </button>
        
        {isOpen && (
          <div className="absolute left-full top-0 ml-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Search players..."
                  className="w-full h-10 px-4 pl-10 pr-10 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  autoComplete="off"
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button
                  onClick={handleClose}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {isLoading && (
              <div className="p-4 text-center">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin mx-auto" />
              </div>
            )}
            
            {results.length > 0 && !isLoading && (
              <div className="max-h-80 overflow-y-auto">
                {results.map((player, index) => (
                  <div
                    key={player.player_id || player.playerId || index}
                    onClick={() => handlePlayerClick(player)}
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
            )}
            
            {query && results.length === 0 && !isLoading && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No players found
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search players..."
          className="w-full h-10 px-4 pl-10 pr-10 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all duration-200 placeholder:text-gray-400"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
        {query && (
          <button
            onClick={handleClose}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full bg-white mt-2 rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {results.map((player, index) => (
              <div
                key={player.player_id || player.playerId || index}
                onClick={() => handlePlayerClick(player)}
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
      
      {isOpen && query && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full bg-white mt-2 rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 text-center text-gray-500 text-sm">
            No players found
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalPlayerSearch;



