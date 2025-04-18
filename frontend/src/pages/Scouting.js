import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ReportsList from "../components/scouting/ReportsList";
import ScoutingView from "../components/scouting/ScoutingView";
import CreateReportModal from "../components/modals/CreateReportModal";
import ScoutingReportManager from "../managers/ScoutingReportsManager";
import AuthManager from "../managers/AuthManager";
import { useSubscription } from "../contexts/SubscriptionContext";
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
    isAuthReady: false,
  });

  const updateState = useCallback((updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  return [state, updateState];
};

const useTeamsFetch = () => {
  return useCallback(async (divisionValue) => {
    try {
      const data = await fetchAPI(`/teams?division=${divisionValue}`);
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
  const { isPremiumUser, isLoadingPremium } = useSubscription();

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
            const teams = await fetchTeams();

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
      fetchTeams(state.selectedDivision).then((teams) =>
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
        `/players-hit/${teamName}?division=${division}&year=${year}`
      );
      const transformedData = data.map((player) => ({
        name: player.Player,
        position: player.Pos || "",
        playerId: player.player_id,
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

  if (!state.isAuthReady || state.isLoading || isLoadingPremium)
    return <LoadingState />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-full lg:max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
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
          isPremiumUser={isPremiumUser}
          selectedDivision={state.selectedDivision}
          onDivisionChange={(division) =>
            updateState({ selectedDivision: division })
          }
        />
      </div>
    </div>
  );
};

export default ScoutingReport;
