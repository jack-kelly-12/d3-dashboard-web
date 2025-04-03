import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  Search,
  X,
  List,
  Users,
  Filter,
  ChevronDown,
} from "lucide-react";
import PlayerListManager from "../managers/PlayerListManager";
import { BaseballTable } from "../components/tables/BaseballTable";
import { fetchAPI } from "../config/api";
import toast from "react-hot-toast";
import InfoBanner from "../components/data/InfoBanner";

const PlayerLists = () => {
  // State management
  const [searchParams, setSearchParams] = useSearchParams();
  const [playerLists, setPlayerLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState(
    searchParams.get("listId") || ""
  );
  const [listPlayers, setListPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);

  // UI state
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [playerSearchTerm, setPlayerSearchTerm] = useState("");
  const [listToDelete, setListToDelete] = useState(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayersLoading, setIsPlayersLoading] = useState(false);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  // Refs
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const listNameInputRef = useRef(null);
  const listDescInputRef = useRef(null);
  const allPlayersLoaded = useRef(false);

  // Cache helper function
  const cachePlayers = (cacheKey, players) => {
    try {
      const minimalPlayers = players.map(
        ({ player_id, player_name, team_name, minYear, maxYear }) => ({
          player_id,
          player_name,
          team_name,
          minYear,
          maxYear,
        })
      );
      localStorage.setItem(cacheKey, JSON.stringify(minimalPlayers));
    } catch (error) {
      console.warn("Failed to cache players:", error);
    }
  };

  // Load players for a specific list
  const loadPlayersForList = useCallback(
    async (listId) => {
      if (!listId) return;

      try {
        setIsPlayersLoading(true);
        const cacheKey = `list_players_${listId}`;

        // Try cache first
        try {
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            setListPlayers(JSON.parse(cachedData));
            return;
          }
        } catch (error) {
          console.warn("Cache read error:", error);
        }

        const playerList = await PlayerListManager.getPlayerListById(listId);
        const playerIds = playerList.playerIds;

        if (playerIds.length === 0) {
          setListPlayers([]);
          return;
        }

        // Use existing players if available
        if (allPlayers.length > 0) {
          const players = allPlayers.filter((p) =>
            playerIds.includes(p.player_id.toString())
          );
          cachePlayers(cacheKey, players);
          setListPlayers(players);
          return;
        }

        // Try global cache
        try {
          const cachedAllPlayers = localStorage.getItem("baseballPlayers");
          if (cachedAllPlayers) {
            const allPlayersData = JSON.parse(cachedAllPlayers);
            const playersInList = allPlayersData.filter((p) =>
              playerIds.includes(p.player_id.toString())
            );
            cachePlayers(cacheKey, playersInList);
            setListPlayers(playersInList);
            return;
          }
        } catch (error) {
          console.warn("Global cache error:", error);
        }

        // Final fallback - fetch all players
        const allPlayersData = await fetchAPI("/api/players");
        const playersInList = allPlayersData.filter((p) =>
          playerIds.includes(p.player_id.toString())
        );
        cachePlayers(cacheKey, playersInList);
        setListPlayers(playersInList);
      } catch (err) {
        toast.error("Failed to load players");
        console.error("Player load error:", err);
      } finally {
        setIsPlayersLoading(false);
      }
    },
    [allPlayers]
  );

  // Fetch all players
  useEffect(() => {
    const fetchAllPlayers = async () => {
      if (allPlayersLoaded.current) return;

      try {
        setIsLoadingPlayers(true);

        // Try cache first
        try {
          const cachedPlayers = localStorage.getItem("baseballPlayers");
          if (cachedPlayers) {
            const players = JSON.parse(cachedPlayers);
            setAllPlayers(players);
            setFilteredPlayers(players.slice(0, 10));
            allPlayersLoaded.current = true;
            return;
          }
        } catch (error) {
          console.warn("Cache read error:", error);
        }

        // Fetch fresh data
        const players = await fetchAPI("/api/players");
        const sortedPlayers = players.sort((a, b) =>
          a.player_name.localeCompare(b.player_name)
        );

        cachePlayers("baseballPlayers", sortedPlayers);
        setAllPlayers(sortedPlayers);
        setFilteredPlayers(sortedPlayers.slice(0, 10));
        allPlayersLoaded.current = true;
      } catch (err) {
        toast.error("Failed to load players");
        console.error("Player fetch error:", err);
      } finally {
        setIsLoadingPlayers(false);
      }
    };

    fetchAllPlayers();
  }, []);

  // Fetch player lists
  useEffect(() => {
    const fetchPlayerLists = async () => {
      try {
        setIsLoading(true);
        const lists = await PlayerListManager.getUserPlayerLists();
        setPlayerLists(lists);

        if (
          selectedListId &&
          lists.some((list) => list.id === selectedListId)
        ) {
          await loadPlayersForList(selectedListId);
        } else if (lists.length > 0 && !selectedListId) {
          setSelectedListId(lists[0].id);
          await loadPlayersForList(lists[0].id);
        }
      } catch (err) {
        toast.error("Failed to load lists");
        console.error("List fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerLists();
  }, [loadPlayersForList, selectedListId]);

  // Update URL when selected list changes
  useEffect(() => {
    if (selectedListId) {
      setSearchParams({ listId: selectedListId });
      loadPlayersForList(selectedListId);
      setShowMobileSidebar(false);
    } else {
      setSearchParams({});
      setListPlayers([]);
    }
  }, [selectedListId, setSearchParams, loadPlayersForList]);

  // Filter players with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (!playerSearchTerm) {
        setFilteredPlayers(allPlayers.slice(0, 10));
        return;
      }

      const searchTerm = playerSearchTerm.toLowerCase();
      const filtered = allPlayers
        .filter((p) => p.player_name.toLowerCase().includes(searchTerm))
        .slice(0, 10);
      setFilteredPlayers(filtered);
    }, 150);

    return () => clearTimeout(debounceTimer);
  }, [playerSearchTerm, allPlayers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsAddingPlayer(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus handling for inputs
  useEffect(() => {
    if (isCreatingList && listNameInputRef.current) {
      listNameInputRef.current.focus();
    }
  }, [isCreatingList]);

  useEffect(() => {
    if (isAddingPlayer && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isAddingPlayer]);

  // Create a new list
  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error("List name is required");
      return;
    }

    try {
      setIsLoading(true);
      const newList = await PlayerListManager.createPlayerList({
        name: newListName,
        description: newListDescription,
        playerIds: [],
      });

      setPlayerLists((prev) => [newList, ...prev]);
      setSelectedListId(newList.id);
      setIsCreatingList(false);
      setNewListName("");
      setNewListDescription("");
      toast.success("List created successfully");
    } catch (err) {
      toast.error("Failed to create list");
      console.error("List creation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a list
  const confirmDeleteList = async () => {
    try {
      setIsLoading(true);
      await PlayerListManager.deletePlayerList(listToDelete);
      localStorage.removeItem(`list_players_${listToDelete}`);

      setPlayerLists((prev) => prev.filter((list) => list.id !== listToDelete));

      if (selectedListId === listToDelete) {
        const remaining = playerLists.filter(
          (list) => list.id !== listToDelete
        );
        setSelectedListId(remaining[0]?.id || "");
      }

      toast.success("List deleted");
    } catch (err) {
      toast.error("Failed to delete list");
      console.error("List deletion error:", err);
    } finally {
      setIsLoading(false);
      setListToDelete(null);
    }
  };

  // Add player to list
  const handleAddPlayer = async (player) => {
    if (!selectedListId) {
      toast.error("Please select a list first");
      return;
    }

    const playerId = player.player_id.toString();
    const currentList = playerLists.find((list) => list.id === selectedListId);

    if (currentList?.playerIds.includes(playerId)) {
      toast.info(`${player.player_name} is already in this list`);
      setIsAddingPlayer(false);
      setPlayerSearchTerm("");
      return;
    }

    try {
      // Optimistic UI update
      const playerToAdd = {
        player_id: player.player_id,
        player_name: player.player_name,
        team_name: player.team_name,
        minYear: player.minYear,
        maxYear: player.maxYear,
      };

      const updatedPlayers = [...listPlayers, playerToAdd];
      setListPlayers(updatedPlayers);
      cachePlayers(`list_players_${selectedListId}`, updatedPlayers);

      setPlayerLists((prev) =>
        prev.map((list) =>
          list.id === selectedListId
            ? { ...list, playerIds: [...list.playerIds, playerId] }
            : list
        )
      );

      await PlayerListManager.addPlayerToList(selectedListId, playerId);
      toast.success(`Added ${player.player_name} to list`);
    } catch (err) {
      // Revert on error
      const reverted = listPlayers.filter(
        (p) => p.player_id.toString() !== playerId
      );
      setListPlayers(reverted);
      cachePlayers(`list_players_${selectedListId}`, reverted);

      setPlayerLists((prev) =>
        prev.map((list) =>
          list.id === selectedListId
            ? {
                ...list,
                playerIds: list.playerIds.filter((id) => id !== playerId),
              }
            : list
        )
      );

      toast.error("Failed to add player");
      console.error("Add player error:", err);
    } finally {
      setIsAddingPlayer(false);
      setPlayerSearchTerm("");
    }
  };

  // Remove player from list
  const handleRemovePlayer = async (playerId) => {
    if (!selectedListId) return;

    try {
      // Optimistic UI update
      const updatedPlayers = listPlayers.filter(
        (player) => player.player_id.toString() !== playerId.toString()
      );
      setListPlayers(updatedPlayers);
      cachePlayers(`list_players_${selectedListId}`, updatedPlayers);

      setPlayerLists((prev) =>
        prev.map((list) =>
          list.id === selectedListId
            ? {
                ...list,
                playerIds: list.playerIds.filter(
                  (id) => id !== playerId.toString()
                ),
              }
            : list
        )
      );

      await PlayerListManager.removePlayerFromList(
        selectedListId,
        playerId.toString()
      );
      toast.success("Player removed");
    } catch (err) {
      toast.error("Failed to remove player");
      console.error("Remove player error:", err);
    }
  };

  // Table columns
  const tableColumns = useMemo(
    () => [
      {
        name: "",
        minWidth: "40px",
        cell: (row) => (
          <button
            onClick={() => handleRemovePlayer(row.player_id)}
            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
            title="Remove player"
          >
            <Trash2 size={16} />
          </button>
        ),
      },
      {
        name: "Player",
        selector: (row) => row.player_name,
        sortable: true,
        minWidth: "200px",
        cell: (row) => (
          <span className="font-medium text-sm">{row.player_name}</span>
        ),
      },
      {
        name: "Team",
        selector: (row) => row.team_name,
        sortable: true,
        minWidth: "120px",
        cell: (row) => (
          <span className="text-sm">{row.team_name || "N/A"}</span>
        ),
      },
      {
        name: "Years",
        selector: (row) => `${row.minYear || "N/A"} - ${row.maxYear || "N/A"}`,
        sortable: true,
        minWidth: "120px",
        cell: (row) => (
          <span className="text-sm whitespace-nowrap">
            {row.minYear || "N/A"} - {row.maxYear || "N/A"}
          </span>
        ),
      },
    ],
    [listPlayers, selectedListId]
  );

  const selectedList = playerLists.find((list) => list.id === selectedListId);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <InfoBanner dataType="player-lists" />
        </div>

        {/* Mobile sidebar toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg shadow border border-gray-200"
          >
            <div className="flex items-center">
              <List className="mr-2 text-blue-600" size={18} />
              <span className="font-medium">
                {selectedList?.name || "Your Lists"}
              </span>
            </div>
            <ChevronDown
              className={`transition-transform ${
                showMobileSidebar ? "rotate-180" : ""
              }`}
              size={18}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div
            className={`lg:col-span-1 ${
              showMobileSidebar ? "block" : "hidden lg:block"
            }`}
          >
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-blue-600 p-4 text-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Users className="mr-2" size={20} />
                    <h2 className="font-semibold text-lg">Player Lists</h2>
                  </div>
                  <button
                    onClick={() => setIsCreatingList(true)}
                    className="flex items-center text-xs bg-white text-blue-600 px-3 py-1 rounded-full hover:bg-blue-50"
                    disabled={isLoading}
                  >
                    <Plus size={14} className="mr-1" /> New List
                  </button>
                </div>
              </div>

              {/* Create List Form */}
              {isCreatingList && (
                <div className="p-4 border-b">
                  <h3 className="font-medium text-blue-800 mb-3">
                    Create New List
                  </h3>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      List Name
                    </label>
                    <input
                      ref={listNameInputRef}
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="My Player List"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      ref={listDescInputRef}
                      value={newListDescription}
                      onChange={(e) => setNewListDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Describe this list..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateList}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                      disabled={!newListName.trim() || isLoading}
                    >
                      Create List
                    </button>
                    <button
                      onClick={() => {
                        setIsCreatingList(false);
                        setNewListName("");
                        setNewListDescription("");
                      }}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Lists */}
              <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : playerLists.length === 0 ? (
                  <div className="text-center p-6">
                    <div className="bg-blue-50 rounded-lg p-6">
                      <Users className="mx-auto text-blue-300 mb-3" size={32} />
                      <p className="text-gray-600 mb-4">
                        You haven't created any player lists yet.
                      </p>
                      <button
                        onClick={() => setIsCreatingList(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md inline-flex items-center text-sm"
                      >
                        <Plus size={14} className="mr-1" /> Create First List
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y">
                    {playerLists.map((list) => (
                      <div
                        key={list.id}
                        className={`p-3 cursor-pointer transition-colors ${
                          selectedListId === list.id
                            ? "bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedListId(list.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3
                              className={`font-medium ${
                                selectedListId === list.id
                                  ? "text-blue-800"
                                  : ""
                              }`}
                            >
                              {list.name}
                            </h3>
                            <div className="flex items-center mt-1">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  selectedListId === list.id
                                    ? "bg-blue-200 text-blue-800"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {list.playerIds.length} player
                                {list.playerIds.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                            {list.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {list.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setListToDelete(list.id);
                            }}
                            className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50"
                            title="Delete list"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedListId ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* List Header */}
                <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h2 className="font-bold text-gray-800 text-xl">
                        {selectedList?.name || "Players"}
                      </h2>
                      {selectedList?.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedList.description}
                        </p>
                      )}
                    </div>

                    {/* Add Player Button */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setIsAddingPlayer(!isAddingPlayer)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md text-sm flex items-center shadow"
                        disabled={isLoadingPlayers}
                      >
                        {isLoadingPlayers ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Plus size={16} className="mr-2" />
                            Add Player
                          </>
                        )}
                      </button>

                      {/* Player Search Dropdown */}
                      {isAddingPlayer && (
                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl z-10 border border-gray-200">
                          <div className="p-3 border-b bg-gray-50">
                            <div className="relative">
                              <input
                                ref={searchInputRef}
                                type="text"
                                value={playerSearchTerm}
                                onChange={(e) =>
                                  setPlayerSearchTerm(e.target.value)
                                }
                                placeholder="Search players..."
                                className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              />
                              <Search
                                size={16}
                                className="absolute left-3 top-2.5 text-gray-400"
                              />
                              {playerSearchTerm && (
                                <button
                                  onClick={() => setPlayerSearchTerm("")}
                                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="max-h-72 overflow-y-auto">
                            {filteredPlayers.length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                <Filter
                                  size={20}
                                  className="mx-auto mb-2 text-gray-300"
                                />
                                <p>No players found</p>
                                <p className="text-xs mt-1">
                                  Try a different search term
                                </p>
                              </div>
                            ) : (
                              filteredPlayers.map((player) => (
                                <div
                                  key={player.player_id}
                                  className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                                  onClick={() => handleAddPlayer(player)}
                                >
                                  <div className="font-medium">
                                    {player.player_name}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 flex items-center">
                                    <span className="font-medium">
                                      {player.team_name}
                                    </span>
                                    <span className="mx-1">•</span>
                                    <span>
                                      {player.minYear}-{player.maxYear}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* List Content */}
                {isPlayersLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-500">Loading players...</p>
                  </div>
                ) : listPlayers.length === 0 ? (
                  <div className="text-center p-8">
                    <div className="max-w-md mx-auto">
                      <Users className="mx-auto text-gray-300 mb-4" size={40} />
                      <h3 className="font-medium text-gray-800 mb-2">
                        No Players Yet
                      </h3>
                      <p className="text-gray-500 mb-6">
                        This list is empty. Add players to get started.
                      </p>
                      <button
                        onClick={() => setIsAddingPlayer(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md inline-flex items-center text-sm"
                      >
                        <Plus size={16} className="mr-2" /> Add Players
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2">
                    <BaseballTable
                      data={listPlayers}
                      columns={tableColumns}
                      filename={`${selectedList?.name || "player_list"}.csv`}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-6 text-center">
                <div className="max-w-md mx-auto">
                  <Users className="mx-auto text-blue-300 mb-4" size={40} />
                  <h3 className="font-medium text-gray-800 mb-2">
                    No List Selected
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Select a list from the sidebar or create a new one to get
                    started.
                  </p>
                  <button
                    onClick={() => setIsCreatingList(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md inline-flex items-center text-sm"
                  >
                    <Plus size={16} className="mr-2" /> Create New List
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {listToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete List
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this list? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setListToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteList}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerLists;
