import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Users, Plus, Trash2, Search } from "lucide-react";
import PlayerListManager from "../managers/PlayerListManager";
import { BaseballTable } from "../components/tables/BaseballTable";
import { fetchAPI } from "../config/api";
import toast from "react-hot-toast";
import InfoBanner from "../components/data/InfoBanner";

// Minimal inline modal (no external deps)
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
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
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
    { name: "Player", selector: row => row.player_name, sortable: true, width: "300px", cell: row => <span className="font-medium text-sm">{row.player_name}</span> },
    { name: "Team", selector: row => row.team_name, sortable: true, cell: row => <span className="text-sm">{row.team_name || "N/A"}</span> },
    { name: "Position", selector: row => row.position, sortable: true, cell: row => <span className="text-sm">{row.position || "N/A"}</span> },
    { name: "Years", selector: row => `${row.min_year ?? "N/A"} - ${row.max_year ?? "N/A"}`, sortable: true, cell: row => <span className="text-sm whitespace-nowrap">{row.min_year ?? "N/A"} - {row.max_year ?? "N/A"}</span> },
    { name: "", minWidth: "40px", cell: row => (<button onClick={() => handleRemovePlayer(row.player_id)} className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded" title="Remove"><Trash2 size={16} /></button>) }
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

          <div className="relative z-10 bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <aside className="lg:col-span-5 sticky top-8 h-fit">
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="New list name"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={handleCreateList}
                      disabled={!newListName.trim() || saving}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs"
                      aria-label="Create list"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="max-h-[60vh] overflow-y-auto divide-y">
                  {loadingLists ? (
                    <div className="py-8 text-center text-gray-500">Loading...</div>
                  ) : lists.length === 0 ? (
                    <div className="py-8 text-center text-gray-400">No lists yet</div>
                  ) : (
                    lists.map((list) => (
                      <div
                        key={list.id}
                        onClick={() => setSelectedListId(list.id)}
                        className={`px-4 py-3 flex justify-between items-center cursor-pointer ${
                          selectedListId === list.id ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <div>
                          <div className="font-medium">{list.name}</div>
                          <div className="text-xs text-gray-500">{list.playerIds.length} players</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(list);
                          }}
                          className="text-gray-400 hover:text-red-600 p-1 rounded-md"
                          aria-label={`Delete ${list.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>

            <main className="lg:col-span-7">
              {!selectedListId ? (
                <div className="bg-white border border-gray-200 rounded-lg py-16 flex flex-col items-center">
                  <Users className="text-blue-400 mb-3" size={40} />
                  <div className="font-medium text-gray-800 mb-1">No list selected</div>
                  <div className="text-sm text-gray-500">Select or create a list to get started.</div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="font-semibold text-gray-900">{selectedList?.name}</div>
                    <div />
                  </div>

                  <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-gray-200">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Filter current list"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div ref={searchRef} className="relative">
                      <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        onFocus={() => {
                          setShowSearch(true);
                          ensureAllPlayersLoaded();
                        }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Add player by search"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      {showSearch && searchTerm && (
                        <div className="absolute mt-2 bg-white border border-gray-200 rounded-md shadow w-full max-h-64 overflow-y-auto z-50">
                          {loadingSearch ? (
                            <div className="p-3 text-sm text-gray-500">Loading...</div>
                          ) : filteredSearch.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500">No matches</div>
                          ) : (
                            filteredSearch.map((p) => (
                              <button
                                key={p.player_id}
                                onClick={() => handleAddPlayer(p)}
                                className="w-full text-left p-3 hover:bg-blue-50 flex justify-between items-center"
                              >
                                <span className="text-sm">{p.player_name}</span>
                                <span className="text-xs text-gray-500">{p.team_name}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {loadingPlayers ? (
                    <div className="flex flex-col items-center py-10 text-gray-500">Loading players...</div>
                  ) : tableData.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">No players in this list</div>
                  ) : (
                    <div className="p-5">
                      <BaseballTable
                        data={tableData}
                        columns={columns}
                        filename={`${selectedList?.name || "player_list"}.csv`}
                      />
                    </div>
                  )}
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
