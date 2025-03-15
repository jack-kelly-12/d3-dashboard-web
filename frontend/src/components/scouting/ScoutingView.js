import React, { useState } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { UserPlus, Users, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import PlayersTable from "../tables/PlayersTable";
import AddPlayerModal from "../modals/AddPlayerModal";
import AddPitcherModal from "../modals/AddPitcherModal";
import ScoutingReportManager from "../../managers/ScoutingReportsManager";
import { fetchAPI } from "../../config/api";
import { useMediaQuery } from "react-responsive";

const ScoutingView = ({ report, onBack, onUpdateReport }) => {
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [isAddPitcherModalOpen, setIsAddPitcherModalOpen] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [availablePitchers, setAvailablePitchers] = useState([]);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editingPitcher, setEditingPitcher] = useState(null);

  const isXSmall = useMediaQuery({ maxWidth: 480 });
  const isSmall = useMediaQuery({ maxWidth: 640 });

  const handleEditPlayer = async (updatedPlayer) => {
    const loadingToast = toast.loading("Updating player...");
    try {
      const updatedReport = {
        ...report,
        positionPlayers: report.positionPlayers.map((player) =>
          player.id === updatedPlayer.id ? updatedPlayer : player
        ),
      };
      await ScoutingReportManager.updateReport(report.id, updatedReport);
      onUpdateReport(updatedReport);
      setIsAddPlayerModalOpen(false);
      setEditingPlayer(null);
      toast.success("Player updated successfully", { id: loadingToast });
    } catch (error) {
      console.error("Error updating player:", error);
      toast.error("Failed to update player", { id: loadingToast });
    }
  };

  const handleEditPitcher = async (updatedPitcher) => {
    const loadingToast = toast.loading("Updating pitcher...");
    try {
      const updatedReport = {
        ...report,
        pitchers: (report.pitchers || []).map((pitcher) =>
          pitcher.id === updatedPitcher.id ? updatedPitcher : pitcher
        ),
      };
      await ScoutingReportManager.updateReport(report.id, updatedReport);
      onUpdateReport(updatedReport);
      setIsAddPitcherModalOpen(false);
      setEditingPitcher(null);
      toast.success("Pitcher updated successfully", { id: loadingToast });
    } catch (error) {
      console.error("Error updating pitcher:", error);
      toast.error("Failed to update pitcher", { id: loadingToast });
    }
  };

  const fetchPlayers = async () => {
    try {
      const data = await fetchAPI(
        `/players-hit/${encodeURIComponent(report.teamName)}?division=${
          report.division
        }&year=${report.year || 2024}`
      );

      const uniqueData = data.reduce((acc, current) => {
        const x = acc.find((item) => item.Player === current.Player);
        if (!x) {
          acc.push(current);
        }
        return acc;
      }, []);

      const transformedData = uniqueData.map((player) => ({
        name: player.Player,
        position: player.Pos || "",
        playerId: player.player_id,
        keyStats: {
          avg: player.BA?.toFixed(3) || "",
          obp: player.OBP?.toFixed(3) || "",
          slg: player.SLG?.toFixed(3) || "",
          hr: player.HR?.toString() || "",
          sb: player.SB?.toString() || "",
          war: player.WAR?.toFixed(1) || "",
        },
      }));

      setAvailablePlayers(transformedData);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast.error("Failed to fetch players");
      setAvailablePlayers([]);
    }
  };

  const fetchPitchers = async () => {
    try {
      const data = await fetchAPI(
        `/players-pitch/${encodeURIComponent(report.teamName)}?division=${
          report.division
        }&year=${report.year || 2024}`
      );

      const uniqueData = data.reduce((acc, current) => {
        const x = acc.find((item) => item.Player === current.Player);
        if (!x) {
          acc.push(current);
        }
        return acc;
      }, []);

      const transformedData = uniqueData.map((player) => ({
        name: player.Player,
        playerId: player.player_id,
        keyStats: {
          era: player.ERA?.toFixed(2) || "",
          fip: player.FIP?.toFixed(2) || "",
          k: player["K%"]?.toFixed(1) || "",
          bb: player["BB%"]?.toFixed(1) || "",
          ip: player.IP?.toString() || "",
          war: player.WAR?.toFixed(1) || "",
        },
      }));

      setAvailablePitchers(transformedData);
    } catch (error) {
      console.error("Error fetching pitchers:", error);
      toast.error("Failed to fetch pitchers");
      setAvailablePitchers([]);
    }
  };

  const handleAddPlayer = async (newPlayer) => {
    const loadingToast = toast.loading("Adding player...");
    try {
      const updatedReport = {
        ...report,
        numHitters: report.numHitters + 1,
        positionPlayers: [...report.positionPlayers, newPlayer],
      };
      await ScoutingReportManager.updateReport(report.id, updatedReport);
      onUpdateReport(updatedReport);
      setIsAddPlayerModalOpen(false);
      toast.success("Player added successfully", { id: loadingToast });
    } catch (error) {
      console.error("Error adding player:", error);
      toast.error("Failed to add player", { id: loadingToast });
    }
  };

  const handleAddPitcher = async (newPitcher) => {
    const loadingToast = toast.loading("Adding pitcher...");
    try {
      const updatedReport = {
        ...report,
        numPitchers: report.numPitchers + 1,
        pitchers: [...(report.pitchers || []), newPitcher],
      };
      await ScoutingReportManager.updateReport(report.id, updatedReport);
      onUpdateReport(updatedReport);
      setIsAddPitcherModalOpen(false);
      toast.success("Pitcher added successfully", { id: loadingToast });
    } catch (error) {
      console.error("Error adding pitcher:", error);
      toast.error("Failed to add pitcher", { id: loadingToast });
    }
  };

  const handleDeletePlayer = async (playerId) => {
    const playerToDelete = report.positionPlayers.find(
      (p) => p.id === playerId
    );

    toast(
      (t) => (
        <div className="flex flex-col gap-4">
          <p>Delete {playerToDelete.name}?</p>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
              onClick={async () => {
                const loadingToast = toast.loading("Deleting player...");
                try {
                  const updatedReport = {
                    ...report,
                    positionPlayers: report.positionPlayers.filter(
                      (p) => p.id !== playerId
                    ),
                    numHitters: report.numHitters - 1,
                  };
                  await ScoutingReportManager.updateReport(
                    report.id,
                    updatedReport
                  );
                  onUpdateReport(updatedReport);
                  toast.success("Player deleted successfully", {
                    id: loadingToast,
                  });
                } catch (error) {
                  console.error("Error deleting player:", error);
                  toast.error("Failed to delete player", { id: loadingToast });
                }
                toast.dismiss(t.id);
              }}
            >
              Delete
            </button>
            <button
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  const handleDeletePitcher = async (pitcherId) => {
    const pitcherToDelete = report.pitchers.find((p) => p.id === pitcherId);

    toast(
      (t) => (
        <div className="flex flex-col gap-4">
          <p>Delete {pitcherToDelete.name}?</p>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
              onClick={async () => {
                const loadingToast = toast.loading("Deleting pitcher...");
                try {
                  const updatedReport = {
                    ...report,
                    pitchers: (report.pitchers || []).filter(
                      (p) => p.id !== pitcherId
                    ),
                    numPitchers: report.numPitchers - 1,
                  };
                  await ScoutingReportManager.updateReport(
                    report.id,
                    updatedReport
                  );
                  onUpdateReport(updatedReport);
                  toast.success("Pitcher deleted successfully", {
                    id: loadingToast,
                  });
                } catch (error) {
                  console.error("Error deleting pitcher:", error);
                  toast.error("Failed to delete pitcher", { id: loadingToast });
                }
                toast.dismiss(t.id);
              }}
            >
              Delete
            </button>
            <button
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const sourceType = result.source.droppableId;
    let updatedReport = { ...report };
    let originalReport = { ...report };

    if (sourceType === "positionPlayers") {
      const items = Array.from(report.positionPlayers);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      updatedReport.positionPlayers = items;
    } else if (sourceType === "pitchers") {
      const items = Array.from(report.pitchers || []);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      updatedReport.pitchers = items;
    }

    onUpdateReport(updatedReport);

    try {
      await ScoutingReportManager.updateReport(report.id, updatedReport);
      toast.success("Order updated", { duration: 2000 });
    } catch (error) {
      console.error("Error updating player order:", error);
      onUpdateReport(originalReport);
      toast.error("Failed to update order", { duration: 3000 });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
          <button
            onClick={onBack}
            className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm sm:text-base"
          >
            <ChevronLeft size={isSmall ? 16 : 18} />
            <span>{isXSmall ? "Back" : "Back to Reports"}</span>
          </button>

          {/* Report Header */}
          <div className="mt-4 sm:mt-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-0">
                {report.teamName}
              </h1>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs sm:text-sm">
                  {report.division}
                </span>
                <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-xs sm:text-sm">
                  {report.year || "2024"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
            <DragDropContext onDragEnd={handleDragEnd}>
              {/* Position Players Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                      Position Players
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      fetchPlayers();
                      setIsAddPlayerModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
                  >
                    <UserPlus size={isSmall ? 12 : 14} />
                    {isXSmall ? "Add" : "Add Hitter"}
                  </button>
                </div>

                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <PlayersTable
                    players={report.positionPlayers}
                    onEditPlayer={(player) => {
                      setEditingPlayer(player);
                      setIsAddPlayerModalOpen(true);
                    }}
                    onDeletePlayer={handleDeletePlayer}
                    isPitcherTable={false}
                    droppableId="positionPlayers"
                    isSmallScreen={isSmall}
                    isXSmallScreen={isXSmall}
                  />
                </div>
              </div>

              {/* Pitchers Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                      Pitchers
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      fetchPitchers();
                      setIsAddPitcherModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
                  >
                    <UserPlus size={isSmall ? 12 : 14} />
                    {isXSmall ? "Add" : "Add Pitcher"}
                  </button>
                </div>

                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <PlayersTable
                    players={report.pitchers || []}
                    onEditPlayer={(pitcher) => {
                      setEditingPitcher(pitcher);
                      setIsAddPitcherModalOpen(true);
                    }}
                    onDeletePlayer={handleDeletePitcher}
                    isPitcherTable={true}
                    droppableId="pitchers"
                    isSmallScreen={isSmall}
                    isXSmallScreen={isXSmall}
                  />
                </div>
              </div>
            </DragDropContext>
          </div>

          {/* Modals */}
          <AddPlayerModal
            isOpen={isAddPlayerModalOpen}
            onClose={() => {
              setIsAddPlayerModalOpen(false);
              setEditingPlayer(null);
            }}
            onSubmit={editingPlayer ? handleEditPlayer : handleAddPlayer}
            availablePlayers={availablePlayers}
            editingPlayer={editingPlayer}
          />

          <AddPitcherModal
            isOpen={isAddPitcherModalOpen}
            onClose={() => {
              setIsAddPitcherModalOpen(false);
              setEditingPitcher(null);
            }}
            onSubmit={editingPitcher ? handleEditPitcher : handleAddPitcher}
            availablePlayers={availablePitchers}
            editingPitcher={editingPitcher}
          />
        </div>
      </div>
    </div>
  );
};

export default ScoutingView;
