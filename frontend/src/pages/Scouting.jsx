import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ReportsList from "../components/scouting/ReportsList";
import ScoutingView from "../components/scouting/ScoutingView";
import CreateReportModal from "../components/modals/CreateReportModal";
import AddPlayerPanel from "../components/modals/AddPlayerPanel";
import ScoutingReportManager from "../managers/ScoutingReportsManager";
import AuthManager from "../managers/AuthManager";
import { fetchAPI } from "../config/api";
import { LoadingState } from "../components/alerts/Alerts";
import { DEFAULT_DIVISION } from "../config/constants";

const useScoutingState = () => {
  const [state, setState] = useState({
    user: null,
    reports: [],
    availableTeams: [],
    selectedReport: null,
    currentView: "list",
    selectedDivision: DEFAULT_DIVISION,
    isLoading: true,
    isCreateModalOpen: false,
    isAddPlayerModalOpen: false,
    isAddPlayerPanelOpen: false,
    isAddPitcherPanelOpen: false,
    availablePlayers: [],
    availablePitchers: [],
    editingPlayer: null,
    editingPitcher: null,
    isAuthReady: false,
  });

  const updateState = useCallback((updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  return [state, updateState];
};

const useTeamsFetch = () => {
  return useCallback(async (divisionValue, year = null) => {
    try {
      let url = `/teams?division=${divisionValue}`;
      if (typeof year === 'number') url += `&year=${year}`;
      const data = await fetchAPI(url);
      const uniqueTeams = Array.from(
        new Map(data.map((team) => [team.team_name, team])).values()
      ).sort((a, b) => a.team_name.localeCompare(b.team_name));
      return uniqueTeams;
    } catch (err) {
      console.error("Error fetching teams:", err);
      toast.error("Failed to load teams");
      return [];
    }
  }, []);
};

const ScoutingReport = () => {
  const navigate = useNavigate();
  const [state, updateState] = useScoutingState();
  const fetchTeams = useTeamsFetch();

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const unsubscribeAuth = AuthManager.onAuthStateChanged(async (user) => {
        if (!isMounted) return;

        updateState({ user, isLoading: true });

        try {
          if (!user) {
            const result = await AuthManager.anonymousSignIn();
            if (result.success && isMounted) {
              updateState({ user: result.user });
              user = result.user;
            }
          }

          if (user) {
            const userReports = await ScoutingReportManager.getUserReports();
            const teams = await fetchTeams(3, 2025);

            if (isMounted) {
              updateState({
                reports: userReports,
                availableTeams: teams,
              });
            }
          }
        } catch (err) {
          console.error("Error in auth initialization:", err);
          toast.error("Failed to initialize. Please try again.");
        } finally {
          if (isMounted) {
            updateState({ isLoading: false, isAuthReady: true });
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
  }, [updateState, fetchTeams]);

  useEffect(() => {
    if (state.user && state.isAuthReady && !state.isLoading) {
      fetchTeams(state.selectedDivision, 2025).then((teams) =>
        updateState({ availableTeams: teams })
      );
    }
  }, [
    state.user,
    state.isAuthReady,
    state.isLoading,
    state.selectedDivision,
    fetchTeams,
    updateState,
  ]);

  const fetchPlayers = async (teamName, division, year) => {
    if (!state.isAuthReady) return;

    const loadingToast = toast.loading("Loading players...");
    try {
      const data = await fetchAPI(
        `/players_batting/${teamName}?division=${division}&year=${year}`
      );
      const transformedData = data.map((player) => ({
        name: player.player_name,
        position: player.position || "",
        playerId: player.player_id,
        keyStats: {
          avg: player.ba?.toFixed(3) || "",
          obp: player.ob_pct?.toFixed(3) || "",
          slg: player.slg_pct?.toFixed(3) || "",
          hr: player.hr?.toString() || "",
          sb: player.sb?.toString() || "",
        },
      }));

      updateState({ availablePlayers: transformedData });
      toast.success("Players loaded", { id: loadingToast });
    } catch (err) {
      console.error("Error fetching players:", err);
      toast.error("Failed to load players", { id: loadingToast });
    }
  };

  const handleCreateReport = async (reportData) => {
    if (!state.user || !state.isAuthReady) {
      navigate("/signin");
      return;
    }

    const loadingToast = toast.loading("Creating report...");
    try {
      const selectedTeamData = state.availableTeams.find(
        (team) => team.team_name === reportData.teamName
      );

      const newReport = {
        teamId: selectedTeamData.team_id,
        teamName: selectedTeamData.team_name,
        division: reportData.division,
        year: reportData.year,
        numPitchers: 0,
        numHitters: 0,
        dateCreated: new Date().toISOString(),
        positionPlayers: [],
        pitchers: [],
        userId: state.user.uid,
        isAnonymous: state.user.isAnonymous,
      };

      const createdReport = await ScoutingReportManager.createReport(newReport);
      updateState({
        reports: [...state.reports, createdReport],
        isCreateModalOpen: false,
      });
      toast.success("Report created", { id: loadingToast });
    } catch (err) {
      console.error("Error creating report:", err);
      toast.error("Failed to create report", { id: loadingToast });
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!state.user || !state.isAuthReady) {
      navigate("/signin");
      return;
    }

    const loadingToast = toast.loading("Deleting report...");
    try {
      await ScoutingReportManager.deleteReport(reportId);

      const updates = {
        reports: state.reports.filter((report) => report.id !== reportId),
      };

      if (state.selectedReport?.id === reportId) {
        updates.selectedReport = null;
        updates.currentView = "list";
      }

      updateState(updates);
      toast.success("Report deleted", { id: loadingToast });
    } catch (err) {
      console.error("Error deleting report:", err);
      toast.error("Failed to delete report", { id: loadingToast });
    }
  };

  const handleUpdateReport = async (updatedReport) => {
    if (!state.user || !state.isAuthReady) {
      navigate("/signin");
      return;
    }

    const loadingToast = toast.loading("Updating report...");
    try {
      await ScoutingReportManager.updateReport(updatedReport.id, updatedReport);
      updateState({
        reports: state.reports.map((r) =>
          r.id === updatedReport.id ? updatedReport : r
        ),
        selectedReport: updatedReport,
      });
      toast.success("Report updated", { id: loadingToast });
    } catch (err) {
      console.error("Error updating report:", err);
      toast.error("Failed to update report", { id: loadingToast });
    }
  };

  const fetchPitchers = async (teamName, division, year) => {
    if (!state.isAuthReady) return;

    const loadingToast = toast.loading("Loading pitchers...");
    try {
      const data = await fetchAPI(
        `/players_pitching/${teamName}?division=${division}&year=${year}`
      );
      const transformedData = data.map((pitcher) => ({
        name: pitcher.player_name,
        position: pitcher.position || "P",
        playerId: pitcher.player_id,
        keyStats: {
          avg: pitcher.ba?.toFixed(3) || "",
          obp: pitcher.ob_pct?.toFixed(3) || "",
          slg: pitcher.slg_pct?.toFixed(3) || "",
          hr: pitcher.hr?.toString() || "",
          sb: pitcher.sb?.toString() || "",
        },
      }));

      updateState({ availablePitchers: transformedData });
      toast.success("Pitchers loaded", { id: loadingToast });
    } catch (err) {
      console.error("Error fetching pitchers:", err);
      toast.error("Failed to load pitchers", { id: loadingToast });
    }
  };

  const handleAddPlayer = async (playerData) => {
    if (!state.selectedReport) return;

    const loadingToast = toast.loading("Adding player...");
    try {
      // fetch key stats for display on spray charts page card
      let keyStats = { avg: "", obp: "", slg: "" };
      try {
        const stats = await fetchAPI(`/player/${playerData.playerId}`);
        if (stats && stats.batting && stats.batting.ba !== undefined) {
          keyStats = {
            avg: (stats.batting.ba ?? 0).toFixed(3),
            obp: (stats.batting.ob_pct ?? 0).toFixed(3),
            slg: (stats.batting.slg_pct ?? 0).toFixed(3),
          };
        }
      } catch (e) {
        // best-effort; leave blanks on failure
      }
      const newPlayer = {
        id: playerData.playerId,
        playerId: playerData.playerId,
        name: playerData.name,
        writeup: playerData.writeup || "",
        position: playerData.position || "",
        keyStats,
      };

      const updatedReport = {
        ...state.selectedReport,
        positionPlayers: [...state.selectedReport.positionPlayers, newPlayer],
        numHitters: state.selectedReport.numHitters + 1,
      };

      await ScoutingReportManager.updateReport(state.selectedReport.id, updatedReport);
      updateState({
        reports: state.reports.map((r) =>
          r.id === state.selectedReport.id ? updatedReport : r
        ),
        selectedReport: updatedReport,
        isAddPlayerPanelOpen: false,
      });
      toast.success("Player added successfully", { id: loadingToast });
    } catch (error) {
      console.error("Error adding player:", error);
      toast.error("Failed to add player", { id: loadingToast });
    }
  };

  const handleAddPitcher = async (pitcherData) => {
    if (!state.selectedReport) return;

    const loadingToast = toast.loading("Adding pitcher...");
    try {
      const newPitcher = {
        id: pitcherData.playerId,
        playerId: pitcherData.playerId,
        name: pitcherData.name,
        writeup: pitcherData.writeup || "",
      };

      const updatedReport = {
        ...state.selectedReport,
        pitchers: [...(state.selectedReport.pitchers || []), newPitcher],
        numPitchers: state.selectedReport.numPitchers + 1,
      };

      await ScoutingReportManager.updateReport(state.selectedReport.id, updatedReport);
      updateState({
        reports: state.reports.map((r) =>
          r.id === state.selectedReport.id ? updatedReport : r
        ),
        selectedReport: updatedReport,
        isAddPitcherPanelOpen: false,
      });
      toast.success("Pitcher added successfully", { id: loadingToast });
    } catch (error) {
      console.error("Error adding pitcher:", error);
      toast.error("Failed to add pitcher", { id: loadingToast });
    }
  };

  const handleEditPlayer = async (updatedPlayer) => {
    if (!state.selectedReport) return;

    const loadingToast = toast.loading("Updating player...");
    try {
      const cleanedPlayer = {
        id: updatedPlayer.playerId,
        playerId: updatedPlayer.playerId,
        name: updatedPlayer.name,
        writeup: updatedPlayer.writeup || "",
      };

      const updatedReport = {
        ...state.selectedReport,
        positionPlayers: state.selectedReport.positionPlayers.map((player) =>
          player.id === updatedPlayer.id ? cleanedPlayer : player
        ),
      };
      await ScoutingReportManager.updateReport(state.selectedReport.id, updatedReport);
      updateState({
        reports: state.reports.map((r) =>
          r.id === state.selectedReport.id ? updatedReport : r
        ),
        selectedReport: updatedReport,
        isAddPlayerPanelOpen: false,
        editingPlayer: null,
      });
      toast.success("Player updated successfully", { id: loadingToast });
    } catch (error) {
      console.error("Error updating player:", error);
      toast.error("Failed to update player", { id: loadingToast });
    }
  };

  const handleEditPitcher = async (updatedPitcher) => {
    if (!state.selectedReport) return;

    const loadingToast = toast.loading("Updating pitcher...");
    try {
      const cleanedPitcher = {
        id: updatedPitcher.playerId,
        playerId: updatedPitcher.playerId,
        name: updatedPitcher.name,
        writeup: updatedPitcher.writeup || "",
      };

      const updatedReport = {
        ...state.selectedReport,
        pitchers: (state.selectedReport.pitchers || []).map((pitcher) =>
          pitcher.id === updatedPitcher.id ? cleanedPitcher : pitcher
        ),
      };
      await ScoutingReportManager.updateReport(state.selectedReport.id, updatedReport);
      updateState({
        reports: state.reports.map((r) =>
          r.id === state.selectedReport.id ? updatedReport : r
        ),
        selectedReport: updatedReport,
        isAddPitcherPanelOpen: false,
        editingPitcher: null,
      });
      toast.success("Pitcher updated successfully", { id: loadingToast });
    } catch (error) {
      console.error("Error updating pitcher:", error);
      toast.error("Failed to update pitcher", { id: loadingToast });
    }
  };

  if (!state.isAuthReady || state.isLoading)
    return <LoadingState />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[6%] right-[8%] w-[380px] h-[380px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[12%] left-[6%] w-[520px] h-[520px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-[48%] right-[28%] w-[300px] h-[300px] bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse delay-500" />
        <div className="absolute top-[18%] left-[18%] w-[220px] h-[220px] bg-gradient-to-r from-indigo-400/25 to-purple-400/25 rounded-full blur-xl animate-pulse delay-700" />
      </div>
      
      <div className="container max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 py-16">
        <div className="relative z-10 mb-6">
          <div className="relative overflow-hidden rounded-2xl border border-white/30 bg-white/60 backdrop-blur p-4 sm:p-5 shadow-xl">
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 blur-2xl" />
            <div className="relative z-10 flex items-start gap-3 sm:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex-shrink-0">
                i
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm sm:text-base font-semibold text-gray-800 mb-1 truncate">Scouting Reports & Player Analysis</div>
                <div className="text-xs sm:text-sm text-gray-600">Build comprehensive player reports with stats, notes, and evaluations. Create detailed scouting assessments for recruiting, player development, and team analysis. Track both position players and pitchers with custom metrics and observations.</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10">
          {state.currentView === "list" ? (
          <ReportsList
            reports={state.reports}
            onCreateClick={() => updateState({ isCreateModalOpen: true })}
            onDeleteReport={handleDeleteReport}
            onReportSelect={(report) => {
              updateState({
                selectedReport: report,
                currentView: "detail",
              });
            }}
          />
        ) : (
          <ScoutingView
            report={state.selectedReport}
            onBack={() => updateState({ currentView: "list" })}
            onUpdateReport={handleUpdateReport}
            onAddPlayer={() => {
              if (state.selectedReport) {
                fetchPlayers(
                  state.selectedReport.teamName,
                  state.selectedReport.division || 3,
                  state.selectedReport.year
                );
                updateState({ isAddPlayerPanelOpen: true });
              }
            }}
            onAddPitcher={() => {
              if (state.selectedReport) {
                fetchPitchers(
                  state.selectedReport.teamName,
                  state.selectedReport.division || 3,
                  state.selectedReport.year
                );
                updateState({ isAddPitcherPanelOpen: true });
              }
            }}
            onEditPlayer={(player) => {
              updateState({ editingPlayer: player, isAddPlayerPanelOpen: true });
            }}
            onEditPitcher={(pitcher) => {
              updateState({ editingPitcher: pitcher, isAddPitcherPanelOpen: true });
            }}
          />
          )}
        </div>

        <CreateReportModal
          isOpen={state.isCreateModalOpen}
          onClose={() => updateState({ isCreateModalOpen: false })}
          onSubmit={handleCreateReport}
          availableTeams={state.availableTeams}
          selectedDivision={state.selectedDivision}
          onDivisionChange={async (division, year) => {
            updateState({ selectedDivision: division });
            const teams = await fetchTeams(division, year);
            updateState({ availableTeams: teams });
          }}
        />

        <AddPlayerPanel
          isOpen={state.isAddPlayerPanelOpen}
          onClose={() => {
            updateState({ 
              isAddPlayerPanelOpen: false,
              editingPlayer: null 
            });
          }}
          onSubmit={state.editingPlayer ? handleEditPlayer : handleAddPlayer}
          availablePlayers={state.availablePlayers}
          editingPlayer={state.editingPlayer}
          isPitcher={false}
        />

        <AddPlayerPanel
          isOpen={state.isAddPitcherPanelOpen}
          onClose={() => {
            updateState({ 
              isAddPitcherPanelOpen: false,
              editingPitcher: null 
            });
          }}
          onSubmit={state.editingPitcher ? handleEditPitcher : handleAddPitcher}
          availablePlayers={state.availablePitchers}
          editingPlayer={state.editingPitcher}
          isPitcher={true}
        />
      </div>
    </div>
  );
};

export default ScoutingReport;