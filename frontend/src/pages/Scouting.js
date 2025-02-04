import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ReportsList from "../components/scouting/ReportsList";
import ScoutingView from "../components/scouting/ScoutingView";
import CreateReportModal from "../components/modals/CreateReportModal";
import AddPlayerModal from "../components/modals/AddPlayerModal";
import ScoutingReportManager from "../managers/ScoutingReportsManager";
import AuthManager from "../managers/AuthManager";
import SubscriptionManager from "../managers/SubscriptionManager";
import { fetchAPI } from "../config/api";
import { LoadingState } from "../components/alerts/Alerts";

const useScoutingState = () => {
  const [state, setState] = useState({
    user: null,
    reports: [],
    availableTeams: [],
    availablePlayers: [],
    selectedReport: null,
    currentView: "list",
    selectedDivision: 3,
    isLoading: true,
    isCreateModalOpen: false,
    isAddPlayerModalOpen: false,
    isPremiumUser: false,
    isAuthReady: false,
  });

  const updateState = useCallback((updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  return [state, updateState];
};

const useTeamsFetch = (selectedDivision) => {
  return useCallback(async () => {
    try {
      const data = await fetchAPI(`/teams-2024?division=${selectedDivision}`);
      const uniqueTeams = Array.from(
        new Map(data.map((team) => [team.team_name, team])).values()
      ).sort((a, b) => a.team_name.localeCompare(b.team_name));
      return uniqueTeams;
    } catch (err) {
      console.error("Error fetching teams:", err);
      toast.error("Failed to load teams");
      return [];
    }
  }, [selectedDivision]);
};

const ScoutingReport = () => {
  const navigate = useNavigate();
  const [state, updateState] = useScoutingState();
  const fetchTeams = useTeamsFetch(state.selectedDivision);

  // Initialize auth and subscription
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
              user = result.user; // Update user for subsequent operations
            }
          }

          if (user) {
            // Get initial subscription state
            const initialSubscription =
              await SubscriptionManager.getUserSubscription(user.uid);
            if (isMounted) {
              updateState({
                isPremiumUser: initialSubscription?.isActive || false,
              });
            }

            // Set up subscription listener
            SubscriptionManager.listenToSubscriptionUpdates(
              user.uid,
              (subscription) => {
                if (isMounted) {
                  updateState({
                    isPremiumUser: subscription?.isActive || false,
                  });
                }
              }
            );

            // Load user data
            const [userReports, teams] = await Promise.all([
              ScoutingReportManager.getUserReports(),
              fetchTeams(),
            ]);

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
      SubscriptionManager.stopListening();
    };
  }, [updateState, fetchTeams]);

  useEffect(() => {
    if (state.user && state.isAuthReady && !state.isLoading) {
      fetchTeams().then((teams) => updateState({ availableTeams: teams }));
    }
  }, [
    state.user,
    state.isAuthReady,
    state.selectedDivision,
    state.isLoading,
    fetchTeams,
    updateState,
  ]);

  const fetchPlayers = async (teamName, division) => {
    if (!state.isAuthReady) return;

    const loadingToast = toast.loading("Loading players...");
    try {
      const data = await fetchAPI(
        `/players-hit-2024/${teamName}?division=${division}`
      );
      const transformedData = data.map((player) => ({
        name: player.Player,
        position: player.Pos || "",
        keyStats: {
          avg: player.BA?.toFixed(3) || "",
          obp: player.OBP?.toFixed(3) || "",
          slg: player.SLG?.toFixed(3) || "",
          hr: player.HR?.toString() || "",
          sb: player.SB?.toString() || "",
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

  const handleAddPlayer = async (newPlayer) => {
    if (!state.selectedReport || !state.user || !state.isAuthReady) return;

    const loadingToast = toast.loading("Adding player...");
    try {
      const updatedReport = {
        ...state.selectedReport,
        numHitters: state.selectedReport.numHitters + 1,
        positionPlayers: [...state.selectedReport.positionPlayers, newPlayer],
      };

      await ScoutingReportManager.updateReport(updatedReport.id, updatedReport);
      updateState({
        reports: state.reports.map((r) =>
          r.id === state.selectedReport.id ? updatedReport : r
        ),
        selectedReport: updatedReport,
        isAddPlayerModalOpen: false,
      });
      toast.success("Player added", { id: loadingToast });
    } catch (err) {
      console.error("Error adding player:", err);
      toast.error("Failed to add player", { id: loadingToast });
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

  if (!state.isAuthReady || state.isLoading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-[calc(100vw-100px)] lg:max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8">
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
                  state.selectedReport.division || 3
                );
                updateState({ isAddPlayerModalOpen: true });
              }
            }}
          />
        )}

        <CreateReportModal
          isOpen={state.isCreateModalOpen}
          onClose={() => updateState({ isCreateModalOpen: false })}
          onSubmit={handleCreateReport}
          availableTeams={state.availableTeams}
          isPremiumUser={state.isPremiumUser}
          selectedDivision={state.selectedDivision}
          onDivisionChange={(division) =>
            updateState({ selectedDivision: division })
          }
        />

        <AddPlayerModal
          isOpen={state.isAddPlayerModalOpen}
          onClose={() => updateState({ isAddPlayerModalOpen: false })}
          onSubmit={handleAddPlayer}
          availablePlayers={state.availablePlayers}
        />
      </div>
    </div>
  );
};

export default ScoutingReport;
