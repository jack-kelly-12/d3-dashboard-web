import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Users, Plus, Trash2, Search } from "lucide-react";
import PlayerListManager from "../managers/PlayerListManager";
import { BaseballTable } from "../components/tables/BaseballTable";
import { fetchAPI } from "../config/api";
import toast from "react-hot-toast";
import InfoBanner from "../components/data/InfoBanner";

const DeleteModal = ({ open, onClose, onConfirm, listName, loading }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Delete List</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to delete &quot;{listName}&quot;? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayerLists = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState(searchParams.get("listId") || "");
  const [players, setPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [filter, setFilter] = useState("");
  const searchRef = useRef(null);
  const [showSearch, setShowSearch] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteList, setPendingDeleteList] = useState(null);

  const selectedList = useMemo(() => lists.find(l => l.id === selectedListId), [lists, selectedListId]);

  const loadLists = useCallback(async () => {
    setLoadingLists(true);
    try {
      const response = await PlayerListManager.getUserPlayerLists();
      const userLists = Array.isArray(response) ? response : [];
      setLists(userLists);
      if (!selectedListId && userLists.length > 0) setSelectedListId(userLists[0].id);
    } catch {
      toast.error("Failed to load lists");
      } finally {
      setLoadingLists(false);
    }
  }, [selectedListId]);

  const loadPlayersForList = useCallback(async (listId) => {
    if (!listId) return setPlayers([]);
    setLoadingPlayers(true);
    try {
      const list = await PlayerListManager.getPlayerListById(listId);
      const ids = list?.playerIds || [];
      if (ids.length === 0) return setPlayers([]);
      const all = await fetchAPI("/api/players");
      const matching = all.filter(p => ids.includes((p.player_id || "").toString()));
      setPlayers(matching);
    } catch {
        toast.error("Failed to load players");
      } finally {
      setLoadingPlayers(false);
    }
  }, []);

  useEffect(() => { loadLists(); }, [loadLists]);
  useEffect(() => {
    if (selectedListId) {
      setSearchParams({ listId: selectedListId });
      loadPlayersForList(selectedListId);
    } else {
      setSearchParams({});
      setPlayers([]);
    }
  }, [selectedListId, setSearchParams, loadPlayersForList]);

  const ensureAllPlayersLoaded = useCallback(async () => {
    if (allPlayers.length > 0 || loadingSearch) return;
    try {
      setLoadingSearch(true);
      const result = await fetchAPI("/api/players");
      const sorted = Array.isArray(result)
        ? result.sort((a, b) => String(a.player_name || "").localeCompare(String(b.player_name || "")))
        : [];
      setAllPlayers(sorted);
    } catch {
      toast.error("Failed to load players");
    } finally {
      setLoadingSearch(false);
    }
  }, [allPlayers.length, loadingSearch]);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowSearch(false);
        if (deleteModalOpen) setDeleteModalOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [deleteModalOpen]);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      setSaving(true);
      const newList = await PlayerListManager.createPlayerList({ name: newListName.trim(), description: "", playerIds: [] });
      setLists(prev => [newList, ...prev]);
      setSelectedListId(newList.id);
      setNewListName("");
      toast.success("List created");
    } catch {
      toast.error("Failed to create list");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (list) => {
    setPendingDeleteList(list);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setPendingDeleteList(null);
  };

  const confirmDeleteList = async () => {
    if (!pendingDeleteList) return;
    try {
      setSaving(true);
      await PlayerListManager.deletePlayerList(pendingDeleteList.id);
      setLists(prev => prev.filter(l => l.id !== pendingDeleteList.id));
      if (selectedListId === pendingDeleteList.id) {
        const remaining = lists.filter(l => l.id !== pendingDeleteList.id);
        setSelectedListId(remaining[0]?.id || "");
        setPlayers([]);
      }
      toast.success("List deleted");
      closeDeleteModal();
    } catch {
      toast.error("Failed to delete list");
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePlayer = useCallback(async (playerId) => {
      if (!selectedListId) return;
    try {
      const current = lists.find(l => l.id === selectedListId);
      const updatedIds = current.playerIds.filter(id => id !== playerId.toString());
      await PlayerListManager.updatePlayerList({ ...current, playerIds: updatedIds });
      setLists(prev => prev.map(l => l.id === selectedListId ? { ...l, playerIds: updatedIds } : l));
      setPlayers(prev => prev.filter(p => (p.player_id || "").toString() !== playerId.toString()));
        toast.success("Player removed");
    } catch {
        toast.error("Failed to remove player");
    }
  }, [selectedListId, lists]);


  const tableData = useMemo(() => {
    if (!filter) return players;
    const s = filter.toLowerCase();
    return players.filter(p => p.player_name?.toLowerCase().includes(s) || p.team_name?.toLowerCase().includes(s));
  }, [players, filter]);

  const columns = useMemo(() => [
    { name: "Player", selector: row => row.player_name, sortable: true, minWidth: "150px", cell: row => <span className="font-medium text-sm truncate block">{row.player_name}</span> },
    { name: "Team", selector: row => row.team_name, sortable: true, minWidth: "180px", cell: row => <span className="text-sm truncate block">{row.team_name || "N/A"}</span> },
    { name: "Position", selector: row => row.position, sortable: true, width: "80px", cell: row => <span className="text-sm whitespace-nowrap">{row.position || "N/A"}</span> },
    { name: "Years", selector: row => `${row.min_year ?? "N/A"} - ${row.max_year ?? "N/A"}`, sortable: true, width: "110px", cell: row => <span className="text-sm whitespace-nowrap">{row.min_year ?? "N/A"} - {row.max_year ?? "N/A"}</span> },
    { name: "", width: "50px", cell: row => (<button onClick={() => handleRemovePlayer(row.player_id)} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors" title="Remove"><Trash2 size={14} /></button>) }
  ], [handleRemovePlayer]);

  const filteredSearch = useMemo(() => {
    const s = searchTerm.toLowerCase().trim();
    if (!s) return [];
    const setIds = new Set(players.map(p => (p.player_id || "").toString()));
    return allPlayers.filter(p => !setIds.has((p.player_id || "").toString())).filter(p => p.player_name?.toLowerCase().includes(s) || p.team_name?.toLowerCase().includes(s)).slice(0, 8);
  }, [searchTerm, allPlayers, players]);

  const handleAddPlayer = async (player) => {
    if (!selectedListId) return;
    try {
      const playerIdStr = (player.player_id || "").toString();
      await PlayerListManager.addPlayerToList(selectedListId, playerIdStr);
      setLists(prev => prev.map(l => l.id === selectedListId ? { ...l, playerIds: Array.from(new Set([...(l.playerIds || []), playerIdStr])) } : l));
      setPlayers(prev => [...prev, player]);
      setSearchTerm("");
      setShowSearch(false);
      toast.success("Player added");
    } catch {
      toast.error("Failed to add player");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[6%] right-[8%] w-[380px] h-[380px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-[12%] left-[6%] w-[520px] h-[520px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl" />
          <div className="absolute top-[48%] right-[28%] w-[300px] h-[300px] bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl" />
          <div className="absolute top-[18%] left-[18%] w-[220px] h-[220px] bg-gradient-to-r from-indigo-400/25 to-purple-400/25 rounded-full blur-xl" />
        </div>
        <div className="container max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 py-16">
          <div className="relative z-10 mb-6">
            <InfoBanner
              title="Player Lists"
              description="Create and manage custom player lists. Add players via search or CSV import, then use these lists across the platform."
            />
          </div>

          <div className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <aside className="lg:col-span-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-8">
                  <div className="px-5 pt-5 pb-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900 mb-3">Your Lists</h2>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="text"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                        placeholder="New list..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white transition-all"
                      />
                      <button
                        onClick={handleCreateList}
                        disabled={!newListName.trim() || saving}
                        className="px-3 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center flex-shrink-0 mr-0.5"
                        aria-label="Create list"
                      >
                        <Plus size={16} strokeWidth={2.25} />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
                    {loadingLists ? (
                      <div className="py-12 text-center text-gray-500">
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                        <p className="mt-2 text-xs">Loading...</p>
                      </div>
                    ) : lists.length === 0 ? (
                      <div className="py-12 text-center">
                        <Users className="mx-auto text-gray-300 mb-3" size={24} />
                        <p className="text-xs text-gray-500">No lists yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {lists.map((list) => (
                          <div
                            key={list.id}
                            onClick={() => setSelectedListId(list.id)}
                            className={`px-4 py-3 flex justify-between items-center cursor-pointer transition-colors ${
                              selectedListId === list.id 
                                ? "bg-gray-50 border-l-4 border-l-gray-900" 
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 truncate mb-1">{list.name}</div>
                              <div className="text-xs text-gray-500">
                                {list.playerIds.length} {list.playerIds.length === 1 ? "player" : "players"}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(list);
                              }}
                              className="ml-3 text-gray-400 hover:text-red-600 p-1.5 rounded transition-colors flex-shrink-0"
                              aria-label={`Delete ${list.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </aside>

            <main className="lg:col-span-8">
              {!selectedListId ? (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm py-16 flex flex-col items-center justify-center">
                  <div className="bg-blue-100 rounded-full p-3 mb-3">
                    <Users className="text-blue-600" size={32} />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">No list selected</h3>
                  <p className="text-xs text-gray-500 text-center max-w-sm">
                    Select a list from the sidebar or create a new one to get started.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-240px)]">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{selectedList?.name}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {players.length} {players.length === 1 ? "player" : "players"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="relative">
                        <Search size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                          placeholder="Filter list..."
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400"
                        />
                      </div>
                      <div ref={searchRef} className="relative">
                        <Search size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          onFocus={() => {
                            setShowSearch(true);
                            ensureAllPlayersLoaded();
                          }}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Add players..."
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400"
                        />
                        {showSearch && searchTerm && (
                          <div className="absolute mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-full max-h-64 overflow-y-auto z-50">
                            {loadingSearch ? (
                              <div className="p-3 text-xs text-gray-500 text-center">
                                <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                                Loading...
                              </div>
                            ) : filteredSearch.length === 0 ? (
                              <div className="p-3 text-xs text-gray-500 text-center">No matches</div>
                            ) : (
                              <div className="py-1">
                                {filteredSearch.map((p) => (
                                  <button
                                    key={p.player_id}
                                    onClick={() => handleAddPlayer(p)}
                                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex justify-between items-center transition-colors border-b border-gray-100 last:border-b-0 text-sm"
                                  >
                                    <span className="font-medium text-gray-900 truncate">{p.player_name}</span>
                                    <span className="text-xs text-gray-500 ml-2 truncate">{p.team_name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto min-h-0">
                    {loadingPlayers ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                        <p className="text-xs text-gray-500">Loading...</p>
                      </div>
                    ) : tableData.length === 0 ? (
                      <div className="p-12 text-center">
                        {filter ? (
                          <>
                            <Search className="mx-auto text-gray-300 mb-2" size={24} />
                            <p className="text-xs font-medium text-gray-900 mb-1">No matches</p>
                            <p className="text-xs text-gray-500">Adjust your filter</p>
                          </>
                        ) : (
                          <>
                            <Users className="mx-auto text-gray-300 mb-2" size={24} />
                            <p className="text-xs font-medium text-gray-900 mb-1">No players</p>
                            <p className="text-xs text-gray-500">Add players above</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="p-4">
                        <BaseballTable
                          data={tableData}
                          columns={columns}
                          filename={`${selectedList?.name || "player_list"}.csv`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>
            </div>
          </div>

          <DeleteModal
            open={deleteModalOpen}
            onClose={closeDeleteModal}
            onConfirm={confirmDeleteList}
            listName={pendingDeleteList?.name}
            loading={saving}
          />
        </div>
      </div>
    </>
  );
};

export default PlayerLists;
