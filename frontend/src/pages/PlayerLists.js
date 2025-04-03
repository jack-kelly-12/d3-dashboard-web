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
  const allPlayersLoaded = useRef(false);

  // Load players for a specific list
  const loadPlayersForList = useCallback(
    async (listId) => {
      if (!listId) return;

      try {
        setIsPlayersLoading(true);
        const cacheKey = `list_players_${listId}`;
        let cachedListPlayers = null;

        // Try to get data from cache
        try {
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            cachedListPlayers = JSON.parse(cachedData);
          }
        } catch (cacheError) {
          console.warn(`Could not read cache for list ${listId}:`, cacheError);
        }

        // Use cached data if available
        if (cachedListPlayers) {
          setListPlayers(cachedListPlayers);
          setIsPlayersLoading(false);
          return;
        }

        // Fetch player list
        const playerList = await PlayerListManager.getPlayerListById(listId);
        const playerIds = playerList.playerIds;

        // Handle empty list
        if (playerIds.length === 0) {
          setListPlayers([]);
          setIsPlayersLoading(false);
          return;
        }

        // Use already loaded players if available
        if (allPlayers.length > 0) {
          const players = allPlayers.filter((player) =>
            playerIds.includes(player.player_id.toString())
          );

          try {
            const minimalPlayers = players.map((player) => ({
              player_id: player.player_id,
              player_name: player.player_name,
              team_name: player.team_name,
              minYear: player.minYear,
              maxYear: player.maxYear,
            }));

            localStorage.setItem(cacheKey, JSON.stringify(minimalPlayers));
          } catch (storageError) {
            console.warn(
              `Could not cache list ${listId} players:`,
              storageError
            );
          }

          setListPlayers(players);
        } else {
          // Try to use cached global players
          try {
            const cachedAllPlayers = localStorage.getItem("baseballPlayers");
            if (cachedAllPlayers) {
              const allPlayersData = JSON.parse(cachedAllPlayers);
              const playersInList = allPlayersData.filter((player) =>
                playerIds.includes(player.player_id.toString())
              );

              localStorage.setItem(cacheKey, JSON.stringify(playersInList));
              setListPlayers(playersInList);
              return;
            }
          } catch (error) {
            console.warn("Could not read from global player cache:", error);
          }

          // Fetch all players if no cache available
          const allPlayersData = await fetchAPI("/api/players");
          const playersInList = allPlayersData.filter((player) =>
            playerIds.includes(player.player_id.toString())
          );

          try {
            const minimalPlayers = playersInList.map((player) => ({
              player_id: player.player_id,
              player_name: player.player_name,
              team_name: player.team_name,
              minYear: player.minYear,
              maxYear: player.maxYear,
            }));

            localStorage.setItem(cacheKey, JSON.stringify(minimalPlayers));
          } catch (storageError) {
            console.warn(
              `Could not cache list ${listId} players:`,
              storageError
            );
          }

          setListPlayers(playersInList);
        }
      } catch (err) {
        console.error("Error loading players:", err);
        toast.error("Failed to load player data");
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

        // Try to get data from cache
        try {
          const cachedPlayers = localStorage.getItem("baseballPlayers");
          if (cachedPlayers) {
            const players = JSON.parse(cachedPlayers);
            setAllPlayers(players);
            setFilteredPlayers(players.slice(0, 10));
            setIsLoadingPlayers(false);
            allPlayersLoaded.current = true;
            return;
          }
        } catch (cacheError) {
          console.warn("Could not read from cache:", cacheError);
        }

        // Fetch players
        const players = await fetchAPI("/api/players");
        const sortedPlayers = players.sort((a, b) =>
          a.player_name.localeCompare(b.player_name)
        );

        // Cache sorted players
        try {
          const minimalPlayers = sortedPlayers.map((player) => ({
            player_id: player.player_id,
            player_name: player.player_name,
            team_name: player.team_name,
            minYear: player.minYear,
            maxYear: player.maxYear,
          }));

          localStorage.setItem(
            "baseballPlayers",
            JSON.stringify(minimalPlayers)
          );
        } catch (storageError) {
          console.warn("Could not cache player data:", storageError);
        }

        setAllPlayers(sortedPlayers);
        setFilteredPlayers(sortedPlayers.slice(0, 10));
        allPlayersLoaded.current = true;
      } catch (err) {
        console.error("Error fetching player data:", err);
        toast.error("Failed to fetch player data");
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
          lists.find((list) => list.id === selectedListId)
        ) {
          await loadPlayersForList(selectedListId);
        } else if (lists.length > 0 && !selectedListId) {
          setSelectedListId(lists[0].id);
          await loadPlayersForList(lists[0].id);
        }
      } catch (err) {
        toast.error("Failed to load player lists");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerLists();
  }, [loadPlayersForList, selectedListId]);

  // Update URL params when selected list changes
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

  // Filter players based on search term
  const memoizedFilteredPlayers = useMemo(() => {
    if (!playerSearchTerm) return allPlayers.slice(0, 10);

    const searchTermLower = playerSearchTerm.toLowerCase();
    return allPlayers
      .filter((player) =>
        player.player_name.toLowerCase().includes(searchTermLower)
      )
      .slice(0, 10);
  }, [playerSearchTerm, allPlayers]);

  // Update filtered players with debounce
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      setFilteredPlayers(memoizedFilteredPlayers);
    }, 150);

    return () => clearTimeout(debounceTimeout);
  }, [memoizedFilteredPlayers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsAddingPlayer(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Create a new player list
  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error("Please enter a list name");
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
      toast.success("Player list created successfully");
    } catch (err) {
      toast.error("Failed to create player list");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a player list
  const confirmDeleteList = async () => {
    try {
      setIsLoading(true);
      await PlayerListManager.deletePlayerList(listToDelete);

      localStorage.removeItem(`list_players_${listToDelete}`);

      toast.success("List deleted successfully");
      setPlayerLists((prev) => prev.filter((list) => list.id !== listToDelete));

      if (selectedListId === listToDelete) {
        const remainingLists = playerLists.filter(
          (list) => list.id !== listToDelete
        );
        if (remainingLists.length > 0) {
          setSelectedListId(remainingLists[0].id);
        } else {
          setSelectedListId("");
          setListPlayers([]);
        }
      }
    } catch (err) {
      toast.error("Failed to delete list");
    } finally {
      setIsLoading(false);
      setListToDelete(null);
    }
  };

  // Add a player to the selected list
  const handleAddPlayer = async (player) => {
    if (!selectedListId) {
      toast.error("Please select a list first");
      return;
    }

    try {
      const playerId = player.player_id.toString();

      // Check if player is already in the list
      const currentList = playerLists.find(
        (list) => list.id === selectedListId
      );
      if (currentList?.playerIds.includes(playerId)) {
        toast.info(`${player.player_name} is already in this list`);
        setIsAddingPlayer(false);
        setPlayerSearchTerm("");
        return;
      }

      // Add player to local state
      const playerToAdd = {
        player_id: player.player_id,
        player_name: player.player_name,
        team_name: player.team_name,
        minYear: player.minYear,
        maxYear: player.maxYear,
      };

      const updatedListPlayers = [...listPlayers, playerToAdd];
      setListPlayers(updatedListPlayers);

      // Update cache
      try {
        const minimalPlayers = updatedListPlayers.map((p) => ({
          player_id: p.player_id,
          player_name: p.player_name,
          team_name: p.team_name,
          minYear: p.minYear,
          maxYear: p.maxYear,
        }));

        localStorage.setItem(
          `list_players_${selectedListId}`,
          JSON.stringify(minimalPlayers)
        );
      } catch (storageError) {
        console.warn("Could not cache updated player list:", storageError);
      }

      // Update lists state
      setPlayerLists((prev) =>
        prev.map((list) => {
          if (list.id === selectedListId) {
            return {
              ...list,
              playerIds: [...list.playerIds, playerId],
            };
          }
          return list;
        })
      );

      // Save to server
      await PlayerListManager.addPlayerToList(selectedListId, playerId);

      setIsAddingPlayer(false);
      setPlayerSearchTerm("");
      toast.success(`Added ${player.player_name} to list`);
    } catch (err) {
      console.error("Error adding player:", err);
      toast.error("Failed to add player");

      // Revert the changes
      const revertedPlayers = listPlayers.filter(
        (p) => p.player_id.toString() !== player.player_id.toString()
      );

      setListPlayers(revertedPlayers);

      try {
        const minimalPlayers = revertedPlayers.map((p) => ({
          player_id: p.player_id,
          player_name: p.player_name,
          team_name: p.team_name,
          minYear: p.minYear,
          maxYear: p.maxYear,
        }));

        localStorage.setItem(
          `list_players_${selectedListId}`,
          JSON.stringify(minimalPlayers)
        );
      } catch (storageError) {
        console.warn("Could not cache reverted player list:", storageError);
      }

      setPlayerLists((prev) =>
        prev.map((list) => {
          if (list.id === selectedListId) {
            return {
              ...list,
              playerIds: list.playerIds.filter(
                (id) => id !== player.player_id.toString()
              ),
            };
          }
          return list;
        })
      );
    }
  };

  // Table columns with actions
  const getColumnsWithActions = useMemo(() => {
    const handleRemovePlayer = async (playerId) => {
      if (!selectedListId) return;

      try {
        await PlayerListManager.removePlayerFromList(
          selectedListId,
          playerId.toString()
        );

        // Update local state
        const updatedPlayers = listPlayers.filter(
          (player) => player.player_id.toString() !== playerId.toString()
        );

        setListPlayers(updatedPlayers);

        // Update cache
        try {
          const minimalPlayers = updatedPlayers.map((p) => ({
            player_id: p.player_id,
            player_name: p.player_name,
            team_name: p.team_name,
            minYear: p.minYear,
            maxYear: p.maxYear,
          }));

          localStorage.setItem(
            `list_players_${selectedListId}`,
            JSON.stringify(minimalPlayers)
          );
        } catch (storageError) {
          console.warn(
            "Could not cache player list after removal:",
            storageError
          );
        }

        // Update lists state
        setPlayerLists((prev) =>
          prev.map((list) => {
            if (list.id === selectedListId) {
              return {
                ...list,
                playerIds: list.playerIds.filter(
                  (id) => id !== playerId.toString()
                ),
              };
            }
            return list;
          })
        );

        toast.success("Player removed from list");
      } catch (err) {
        toast.error("Failed to remove player");
      }
    };

    return [
      {
        name: "",
        minWidth: "40px",
        cell: (row) => (
          <button
            onClick={() => handleRemovePlayer(row.player_id)}
            className="p-1 sm:p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            title="Remove from list"
          >
            <Trash2 size={16} />
          </button>
        ),
      },
      {
        name: "Player",
        selector: (row) => row.player_name || row.Player || "Unknown Player",
        sortable: true,
        minWidth: "300px",
        cell: (row) => (
          <span className="font-medium text-xs sm:text-base">
            {row.player_name || row.Player || "Unknown Player"}
          </span>
        ),
      },
      {
        name: "Team",
        selector: (row) => row.team_name || row.Team || "N/A",
        sortable: true,
        minWidth: "10%",
        cell: (row) => (
          <span className="text-xs sm:text-base">
            {row.team_name || row.Team || "N/A"}
          </span>
        ),
      },
      {
        name: "Years",
        selector: (row) => `${row.minYear || "N/A"} - ${row.maxYear || "N/A"}`,
        sortable: true,
        minWidth: "20%",
        cell: (row) => (
          <span className="whitespace-nowrap text-sm sm:text-base">
            {row.minYear || "N/A"} - {row.maxYear || "N/A"}
          </span>
        ),
      },
    ];
  }, [listPlayers, selectedListId]);

  const selectedList = playerLists.find((list) => list.id === selectedListId);

  const CreateListForm = () => (
    <div className="m-3 sm:m-4 bg-white p-3 sm:p-4 rounded-lg border border-blue-100">
      <h3 className="font-medium mb-2 sm:mb-3 text-blue-800">
        Create New List
      </h3>
      <div className="mb-2 sm:mb-3">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
          List Name
        </label>
        <input
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          placeholder="Enter list name"
        />
      </div>
      <div className="mb-3 sm:mb-4">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          value={newListDescription}
          onChange={(e) => setNewListDescription(e.target.value)}
          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          rows={2}
          placeholder="Enter description"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleCreateList}
          className="px-3 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-md hover:bg-blue-700 transition-colors flex-1"
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
          className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-200 text-gray-700 text-xs sm:text-sm rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // Component for player search dropdown
  const PlayerSearchDropdown = () => (
    <div className="fixed inset-0 z-50 overflow-auto bg-transparent">
      <div className="absolute right-0 mt-1 sm:mt-2 w-full sm:w-80 bg-white border border-gray-200 rounded-lg shadow-xl overflow-visible">
        <div className="p-2 sm:p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="relative">
            <input
              type="text"
              value={playerSearchTerm}
              onChange={(e) => setPlayerSearchTerm(e.target.value)}
              placeholder="Search players..."
              className="w-full pl-8 sm:pl-9 pr-8 sm:pr-9 py-1 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <Search
              size={16}
              className="absolute left-2 sm:left-3 top-1.5 sm:top-2.5 text-gray-400"
            />
            {playerSearchTerm && (
              <button
                onClick={() => setPlayerSearchTerm("")}
                className="absolute right-2 sm:right-3 top-1.5 sm:top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-64 sm:max-h-72 overflow-y-auto">
          {filteredPlayers.length === 0 ? (
            <div className="p-3 sm:p-4 text-center text-gray-500">
              <Filter
                size={20}
                className="mx-auto mb-1 sm:mb-2 text-gray-300"
              />
              <p className="text-sm">No players found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try a different search term
              </p>
            </div>
          ) : (
            filteredPlayers.map((player) => (
              <div
                key={player.player_id}
                className="p-2 sm:p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-colors"
                onClick={() => handleAddPlayer(player)}
              >
                <div>
                  <div className="font-medium text-sm sm:text-base text-gray-800">
                    {player.player_name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center">
                    <span className="font-medium">{player.team_name}</span>
                    <span className="mx-1">•</span>
                    <span>
                      {player.minYear}-{player.maxYear}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Component for delete confirmation modal
  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3 sm:mb-4">
          Delete List
        </h3>
        <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
          Are you sure you want to delete this list? This action cannot be
          undone.
        </p>
        <div className="flex justify-end space-x-2 sm:space-x-3">
          <button
            onClick={() => setListToDelete(null)}
            className="px-3 sm:px-4 py-1 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteList}
            className="px-3 sm:px-4 py-1 sm:py-2 bg-red-600 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-2 sm:p-4 md:p-6">
      <div className="container max-w-full lg:max-w-[1200px] mx-auto">
        <div className="mb-4 sm:mb-6">
          <InfoBanner dataType={"player-lists"} />
        </div>

        {/* Mobile List Selector */}
        <div className="lg:hidden mb-3">
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="w-full flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center">
              <List size={16} className="mr-2 text-blue-600" />
              <span className="font-medium text-sm sm:text-base">
                {selectedList ? selectedList.name : "Your Lists"}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform ${
                showMobileSidebar ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar */}
          <div
            className={`lg:col-span-1 ${
              showMobileSidebar || window.innerWidth >= 1024
                ? "block"
                : "hidden"
            }`}
          >
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
              {/* Sidebar Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 sm:p-4 text-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Users size={18} className="mr-2" />
                    <h2 className="text-base sm:text-lg font-semibold">
                      Player Lists
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsCreatingList(true)}
                    className="inline-flex items-center text-xs sm:text-sm bg-white text-blue-600 px-2 sm:px-3 py-1 rounded-full hover:bg-blue-50 transition-colors"
                    disabled={isLoading}
                  >
                    <Plus size={14} className="mr-1" /> New List
                  </button>
                </div>
              </div>

              {/* Create List Form */}
              {isCreatingList && <CreateListForm />}

              {/* Lists Content */}
              {isLoading ? (
                <div className="flex justify-center py-8 sm:py-10">
                  <div className="w-6 sm:w-8 h-6 sm:h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : playerLists.length === 0 ? (
                <div className="text-center py-8 sm:py-10 px-3 sm:px-4">
                  <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
                    <Users
                      size={32}
                      className="mx-auto text-blue-300 mb-2 sm:mb-3"
                    />
                    <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">
                      You haven't created any player lists yet.
                    </p>
                    <button
                      onClick={() => setIsCreatingList(true)}
                      className="px-3 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center text-xs sm:text-sm"
                    >
                      <Plus size={14} className="mr-1" /> Create Your First List
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5 max-h-[400px] sm:max-h-[500px] overflow-y-auto p-1 sm:p-2">
                  {playerLists.map((list) => (
                    <div
                      key={list.id}
                      className={`p-2 sm:p-3 rounded-md cursor-pointer transition-all ${
                        selectedListId === list.id
                          ? "bg-blue-100 border-l-4 border-blue-600"
                          : "hover:bg-gray-50 border-l-4 border-transparent"
                      }`}
                      onClick={() => setSelectedListId(list.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3
                            className={`font-medium text-sm sm:text-base mb-1 ${
                              selectedListId === list.id ? "text-blue-800" : ""
                            }`}
                          >
                            {list.name}
                          </h3>
                          <div className="flex items-center">
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
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setListToDelete(list.id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                          title="Delete list"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {list.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 line-clamp-2">
                          {list.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedListId ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                {/* List Header */}
                <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 md:gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                        {selectedList?.name || "Players"}
                      </h2>
                      {selectedList?.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {selectedList.description}
                        </p>
                      )}
                    </div>

                    {/* Add Player Button & Dropdown */}
                    <div
                      className="relative self-end sm:self-auto"
                      ref={dropdownRef}
                    >
                      <button
                        onClick={() => setIsAddingPlayer(!isAddingPlayer)}
                        className="px-3 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs sm:text-sm rounded-md hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center shadow-md"
                        disabled={isLoadingPlayers}
                      >
                        {isLoadingPlayers ? (
                          <>
                            <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                            <span className="text-xs sm:text-sm">
                              Loading Players...
                            </span>
                          </>
                        ) : (
                          <>
                            <Plus size={14} className="mr-1 sm:mr-2" />
                            <span className="text-xs sm:text-sm">
                              Add Player
                            </span>
                          </>
                        )}
                      </button>

                      {isAddingPlayer && <PlayerSearchDropdown />}
                    </div>
                  </div>
                </div>

                {/* List Content */}
                {isPlayersLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                    <div className="w-8 sm:w-12 h-8 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3 sm:mb-4" />
                    <p className="text-gray-500 text-sm sm:text-base">
                      Loading players...
                    </p>
                  </div>
                ) : listPlayers.length === 0 ? (
                  <div className="text-center py-10 sm:py-16 px-3 sm:px-4">
                    <div className="bg-white max-w-md mx-auto rounded-lg p-4 sm:p-8">
                      <Users
                        size={36}
                        className="mx-auto text-gray-300 mb-3 sm:mb-4"
                      />
                      <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-1 sm:mb-2">
                        No Players Yet
                      </h3>
                      <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">
                        This list doesn't have any players yet. Use the "Add
                        Player" button to start building your collection.
                      </p>
                      <button
                        onClick={() => setIsAddingPlayer(true)}
                        className="px-3 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center text-xs sm:text-sm mx-auto"
                      >
                        <Plus size={14} className="mr-1 sm:mr-2" /> Add Your
                        First Player
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg overflow-hidden">
                    <BaseballTable
                      data={listPlayers}
                      columns={getColumnsWithActions}
                      filename={`player_list_${
                        selectedList?.name || selectedListId
                      }.csv`}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-4 sm:p-6 md:p-8 text-center">
                <div className="max-w-md mx-auto bg-white rounded-lg p-4 sm:p-6">
                  <Users
                    size={36}
                    className="mx-auto text-blue-300 mb-3 sm:mb-4"
                  />
                  <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-1 sm:mb-2">
                    No List Selected
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                    Select a player list from the sidebar or create a new one to
                    get started.
                  </p>
                  <button
                    onClick={() => setIsCreatingList(true)}
                    className="px-3 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center text-xs sm:text-sm mx-auto"
                  >
                    <Plus size={14} className="mr-1 sm:mr-2" /> Create New List
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {listToDelete && <DeleteConfirmationModal />}
    </div>
  );
};

export default PlayerLists;
