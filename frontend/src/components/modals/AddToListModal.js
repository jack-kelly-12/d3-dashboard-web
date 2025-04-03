import React, { useState, useEffect } from "react";
import PlayerListManager from "../managers/PlayerListManager";

const AddToListModal = ({ isOpen, onClose, playerId, playerName }) => {
  const [playerLists, setPlayerLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedListId, setSelectedListId] = useState("");
  const [isNewList, setIsNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");

  useEffect(() => {
    const fetchPlayerLists = async () => {
      if (!isOpen) return;

      try {
        setIsLoading(true);
        const lists = await PlayerListManager.getUserPlayerLists();
        setPlayerLists(lists);
        if (lists.length > 0) {
          setSelectedListId(lists[0].id);
        } else {
          setIsNewList(true);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerLists();
  }, [isOpen]);

  const handleAddToList = async () => {
    try {
      setIsLoading(true);

      let listId = selectedListId;

      // Create a new list if needed
      if (isNewList) {
        if (!newListName.trim()) {
          setError("List name is required");
          setIsLoading(false);
          return;
        }

        const newList = await PlayerListManager.createPlayerList({
          name: newListName,
          description: newListDescription,
          playerIds: [],
        });

        listId = newList.id;
      }

      // Add player to the list
      await PlayerListManager.addPlayerToList(listId, playerId);

      onClose(true); // Pass true to indicate success
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Add to Player List</h2>
        <p className="mb-4">
          Add <span className="font-medium">{playerName}</span> to a player
          list:
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {playerLists.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    id="existing-list"
                    checked={!isNewList}
                    onChange={() => setIsNewList(false)}
                    className="mr-2"
                  />
                  <label
                    htmlFor="existing-list"
                    className="text-sm font-medium"
                  >
                    Add to existing list
                  </label>
                </div>

                {!isNewList && (
                  <select
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    disabled={isNewList}
                  >
                    {playerLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name} ({list.playerIds.length} players)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  id="new-list"
                  checked={isNewList}
                  onChange={() => setIsNewList(true)}
                  className="mr-2"
                />
                <label htmlFor="new-list" className="text-sm font-medium">
                  Create new list
                </label>
              </div>

              {isNewList && (
                <>
                  <div className="mb-3">
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      placeholder="Enter list name"
                    />
                  </div>
                  <div>
                    <textarea
                      value={newListDescription}
                      onChange={(e) => setNewListDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      placeholder="Enter description (optional)"
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => onClose(false)}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleAddToList}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={isLoading || (isNewList && !newListName.trim())}
          >
            {isLoading ? "Adding..." : "Add to List"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToListModal;
