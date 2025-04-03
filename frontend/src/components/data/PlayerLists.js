import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PlayerListManager from "../managers/PlayerListManager";
import { BaseballTable } from "../components/tables/BaseballTable";
import { getDataColumns } from "../config/tableColumns";
import InfoBanner from "../components/data/InfoBanner";
import debounce from "lodash/debounce";

const PlayerLists = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [playerLists, setPlayerLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState(
    searchParams.get("listId") || ""
  );
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [originalData, setOriginalData] = useState([]);

  // Fetch player lists on component mount
  useEffect(() => {
    const fetchPlayerLists = async () => {
      try {
        setIsLoading(true);
        const lists = await PlayerListManager.getUserPlayerLists();
        setPlayerLists(lists);

        // If a list is selected in URL but not loaded yet, load it
        if (
          selectedListId &&
          lists.find((list) => list.id === selectedListId)
        ) {
          loadPlayerData(selectedListId);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerLists();
  }, [selectedListId]);

  // Update URL when selected list changes
  useEffect(() => {
    if (selectedListId) {
      setSearchParams({ listId: selectedListId });
    } else {
      setSearchParams({});
    }
  }, [selectedListId, setSearchParams]);

  // Load player data when a list is selected
  const loadPlayerData = async (listId) => {
    if (!listId) {
      setFilteredData([]);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch the players data - you'll need to implement this API endpoint
      const response = await fetch("/api/players");
      if (!response.ok) throw new Error("Failed to fetch player data");

      const allPlayers = await response.json();
      setOriginalData(allPlayers);

      // Get the player list details
      const playerList = await PlayerListManager.getPlayerListById(listId);

      // Filter the players based on the playerIds in the list
      const filtered = allPlayers.filter((player) =>
        playerList.playerIds.includes(player.id)
      );

      setFilteredData(filtered);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

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
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm("Are you sure you want to delete this list?")) return;

    try {
      setIsLoading(true);
      await PlayerListManager.deletePlayerList(listId);

      setPlayerLists((prev) => prev.filter((list) => list.id !== listId));
      if (selectedListId === listId) {
        setSelectedListId("");
        setFilteredData([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlayerToList = async (playerId) => {
    if (!selectedListId) return;

    try {
      await PlayerListManager.addPlayerToList(selectedListId, playerId);

      // Refresh the data
      loadPlayerData(selectedListId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemovePlayerFromList = async (playerId) => {
    if (!selectedListId) return;

    try {
      await PlayerListManager.removePlayerFromList(selectedListId, playerId);

      // Update the UI without refetching all data
      setFilteredData((prev) =>
        prev.filter((player) => player.id !== playerId)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-full lg:max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <InfoBanner dataType="player_lists" />

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Player Lists</h2>
            {!isCreatingList && (
              <button
                onClick={() => setIsCreatingList(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create New List
              </button>
            )}
          </div>

          {isCreatingList && (
            <div className="bg-gray-50 p-4 rounded mb-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  List Name
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Enter list name"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Enter description"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateList}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={!newListName.trim()}
                >
                  Create List
                </button>
                <button
                  onClick={() => {
                    setIsCreatingList(false);
                    setNewListName("");
                    setNewListDescription("");
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {playerLists.length === 0 && !isLoading && (
            <div className="text-center py-6 text-gray-500">
              You haven't created any player lists yet.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {playerLists.map((list) => (
              <div
                key={list.id}
                className={`p-4 rounded border cursor-pointer transition-all ${
                  selectedListId === list.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
                onClick={() => setSelectedListId(list.id)}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{list.name}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteList(list.id);
                    }}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">{list.description}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {list.playerIds.length} players
                </p>
              </div>
            ))}
          </div>
        </div>

        {selectedListId && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            ) : filteredData.length > 0 ? (
              <BaseballTable
                data={filteredData}
                columns={getDataColumns("player_hitting").concat({
                  Header: "Actions",
                  accessor: "id",
                  Cell: ({ value }) => (
                    <button
                      onClick={() => handleRemovePlayerFromList(value)}
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  ),
                })}
                filename={`player_list_${selectedListId}.csv`}
                stickyColumns={[0, 1]}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                This list is empty. Add players to get started.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(PlayerLists);
