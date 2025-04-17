import React, {
  useState,
  useEffect,
  useRef,
  lazy,
  Suspense,
  useCallback,
} from "react";
import { ChevronDown } from "lucide-react";
import { useSubscription } from "../contexts/SubscriptionContext";
import AuthManager from "../managers/AuthManager";
import PlayerListManager from "../managers/PlayerListManager";
import { useSearchParams } from "react-router-dom";

const ValueLeaderboard = lazy(() =>
  import("../components/tables/ValueLeaderboard")
);
const SituationalLeaderboard = lazy(() =>
  import("../components/tables/SituationalLeaderboard")
);
const BaserunningLeaderboard = lazy(() =>
  import("../components/tables/BaserunningLeaderboard")
);
const BattedBallLeaderboard = lazy(() =>
  import("../components/tables/BattedBallLeaderboard")
);
const SplitsLeaderboard = lazy(() =>
  import("../components/tables/SplitsLeaderboard")
);

const LEADERBOARD_TYPES = {
  VALUE: {
    id: "value",
    label: "Value Leaderboard",
    description:
      "Overall player value combining batting, baserunning, and pitching contributions",
    component: ValueLeaderboard,
  },
  SITUATIONAL: {
    id: "situational",
    label: "Situational Leaderboard",
    description:
      "How players perform in various game situations (e.g. RISP, high/low leverage, etc.)",
    component: SituationalLeaderboard,
  },
  BASERUNNING: {
    id: "baserunning",
    label: "Baserunning Leaderboard",
    description: "Comprehensive leaderboard of total baserunning value",
    component: BaserunningLeaderboard,
  },
  BATTEDBALL: {
    id: "battedball",
    label: "Batted Ball Leaderboard",
    description: "Distribution of batted ball types for each hitter",
    component: BattedBallLeaderboard,
  },
  SPLITS: {
    id: "splits",
    label: "Splits Leaderboard",
    description:
      "Comparative statistics for pitchers and hitters in left/right matchup scenarios",
    component: SplitsLeaderboard,
  },
};

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const Leaderboards = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState(() => {
    const urlType = searchParams.get("type");
    return Object.values(LEADERBOARD_TYPES).some((t) => t.id === urlType)
      ? urlType
      : LEADERBOARD_TYPES.VALUE.id;
  });
  const [selectedListId, setSelectedListId] = useState(
    searchParams.get("listId") || ""
  );
  const [selectedListPlayerIds, setSelectedListPlayerIds] = useState([]);
  const [isLoadingPlayerList, setIsLoadingPlayerList] = useState(false);
  const [playerLists, setPlayerLists] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { isPremiumUser, isLoadingPremium } = useSubscription();
  const dropdownRef = useRef(null);
  const listDropdownRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const unsubscribeAuth = AuthManager.onAuthStateChanged(async (user) => {
        if (!isMounted) return;

        if (isMounted) {
          setIsAuthReady(true);

          // Load player lists when auth is ready
          if (user) {
            try {
              const lists = await PlayerListManager.getUserPlayerLists();
              setPlayerLists(lists || []);
            } catch (err) {
              console.error("Error fetching player lists:", err);
              setPlayerLists([]);
            }
          }
        }
      });

      return unsubscribeAuth;
    };

    const cleanup = initializeAuth();

    return () => {
      isMounted = false;
      cleanup.then((unsubscribe) => unsubscribe());
    };
  }, []);

  // Fetch player list IDs when selectedListId changes
  useEffect(() => {
    const fetchPlayerList = async () => {
      if (!selectedListId) {
        setSelectedListPlayerIds([]);
        return;
      }

      try {
        setIsLoadingPlayerList(true);
        const list = await PlayerListManager.getPlayerListById(selectedListId);
        if (list && list.playerIds) {
          setSelectedListPlayerIds(list.playerIds);
        } else {
          setSelectedListPlayerIds([]);
        }
      } catch (err) {
        console.error("Error fetching player list:", err);
        setSelectedListPlayerIds([]);
      } finally {
        setIsLoadingPlayerList(false);
      }
    };

    fetchPlayerList();
  }, [selectedListId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (
        listDropdownRef.current &&
        !listDropdownRef.current.contains(event.target)
      ) {
        setShowListDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const gcTimeout = setTimeout(() => {
      if (window.gc) {
        window.gc();
      }
    }, 100);

    return () => clearTimeout(gcTimeout);
  }, [selectedType]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("type", selectedType);

    if (selectedListId) {
      params.set("listId", selectedListId);
    }

    setSearchParams(params);
  }, [selectedType, selectedListId, setSearchParams]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlType = params.get("type");
      const urlListId = params.get("listId");

      if (Object.values(LEADERBOARD_TYPES).some((t) => t.id === urlType)) {
        setSelectedType(urlType);
      }

      setSelectedListId(urlListId || "");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleListSelection = useCallback((listId) => {
    setSelectedListId(listId);
    setShowListDropdown(false);
  }, []);

  const clearListSelection = useCallback(() => {
    setSelectedListId("");
    setShowListDropdown(false);
  }, []);

  const getSelectedListName = useCallback(() => {
    if (!selectedListId) return "All Players";
    const list = playerLists.find((list) => list.id === selectedListId);
    return list ? list.name : "All Players";
  }, [selectedListId, playerLists]);

  const getCurrentLeaderboard = () => {
    const leaderboard = Object.values(LEADERBOARD_TYPES).find(
      (type) => type.id === selectedType
    );
    const LeaderboardComponent = leaderboard?.component;

    return LeaderboardComponent ? (
      <Suspense fallback={<LoadingFallback />}>
        <LeaderboardComponent
          isPremiumUser={isPremiumUser}
          selectedListId={selectedListId}
          selectedListPlayerIds={selectedListPlayerIds}
          isLoadingPlayerList={isLoadingPlayerList}
        />
      </Suspense>
    ) : null;
  };

  if (!isAuthReady || isLoadingPremium) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-full lg:max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center mx-auto py-4 px-4 lg:px-12">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent py-3 mb-5 md:mb-0 md:mr-4">
            {LEADERBOARD_TYPES[selectedType.toUpperCase()]?.label}
          </h1>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Leaderboard Type Selection Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="text-sm font-medium text-gray-700">
                  Current:{" "}
                  {LEADERBOARD_TYPES[selectedType.toUpperCase()]?.label}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-500 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 z-50 w-72 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {Object.values(LEADERBOARD_TYPES).map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedType(type.id);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div className="font-medium text-gray-900">
                        {type.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {type.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Player List Selection Dropdown */}
            <div className="relative" ref={listDropdownRef}>
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Player List:
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowListDropdown(!showListDropdown)}
                    className="flex items-center justify-between px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-700
                      focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                      hover:border-gray-300 transition-colors min-w-[160px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate">
                        {isLoadingPlayerList
                          ? "Loading lists..."
                          : getSelectedListName()}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${
                        showListDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showListDropdown && (
                    <div className="absolute right-0 mt-1 w-72 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                      <div className="p-1">
                        <button
                          onClick={clearListSelection}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                            !selectedListId
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          All Players
                        </button>

                        {playerLists.length > 0 ? (
                          playerLists.map((list) => (
                            <button
                              key={list.id}
                              onClick={() => handleListSelection(list.id)}
                              className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                                selectedListId === list.id
                                  ? "bg-blue-50 text-blue-700"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">{list.name}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {list.playerIds?.length || 0} players
                                </span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-2 text-xs text-gray-500 text-center">
                            No player lists found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player List Filter Status */}
        {selectedListId && (
          <div className="mx-auto px-4 md:px-12 mb-4">
            <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-md inline-flex items-center text-sm">
              <span className="font-medium text-blue-700">Filtered: </span>
              <span className="ml-2 text-blue-600">
                {isLoadingPlayerList
                  ? "Loading player list..."
                  : `Showing players from "${getSelectedListName()}" (${
                      selectedListPlayerIds.length
                    } players)`}
              </span>
            </div>
          </div>
        )}

        {/* Leaderboard Content */}
        <div className="overflow-x-auto px-6">
          {isLoadingPlayerList ? <LoadingFallback /> : getCurrentLeaderboard()}
        </div>
      </div>
    </div>
  );
};

export default Leaderboards;
