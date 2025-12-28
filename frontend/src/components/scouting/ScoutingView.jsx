import React from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { UserPlus, Users, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import PlayersTable from "../tables/PlayersTable";
import ScoutingReportManager from "../../managers/ScoutingReportsManager";
import { useMediaQuery } from "react-responsive";

const ScoutingView = ({ 
  report, 
  onBack, 
  onUpdateReport, 
  onAddPlayer, 
  onAddPitcher, 
  onEditPlayer, 
  onEditPitcher 
}) => {

  const isXSmall = useMediaQuery({ maxWidth: 480 });
  const isSmall = useMediaQuery({ maxWidth: 640 });

  const handleDeletePlayer = async (playerId) => {
    const playerToDelete = report.positionPlayers.find((p) => p.id === playerId);

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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {report.teamName} • {report.year || "2024"} Season
              </h2>
              <p className="text-sm text-gray-500">
                Scouting Report
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
            <DragDropContext onDragEnd={handleDragEnd}>
              {/* Position Players Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Position Players
                      </h2>
                      <p className="text-sm text-gray-600">
                        {report.positionPlayers?.length || 0} players
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onAddPlayer}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <UserPlus size={16} />
                    Add Hitter
                  </button>
                </div>

                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <PlayersTable
                    players={report.positionPlayers}
                    onEditPlayer={onEditPlayer}
                    onDeletePlayer={handleDeletePlayer}
                    isPitcherTable={false}
                    droppableId="positionPlayers"
                    isSmallScreen={isSmall}
                    isXSmallScreen={isXSmall}
                  />
                </div>
              </div>

              {/* Pitchers Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Pitchers
                      </h2>
                      <p className="text-sm text-gray-600">
                        {report.pitchers?.length || 0} pitchers
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onAddPitcher}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <UserPlus size={16} />
                    Add Pitcher
                  </button>
                </div>

                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <PlayersTable
                    players={report.pitchers || []}
                    onEditPlayer={onEditPitcher}
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
      </div>
    </div>
  );
};

export default ScoutingView;