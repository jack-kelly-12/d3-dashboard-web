import React, { useState, useEffect } from "react";
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

const ScoutingReport = () => {
  const navigate = useNavigate();

  // State management
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [currentView, setCurrentView] = useState("list");
  const [selectedDivision, setSelectedDivision] = useState(3);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = AuthManager.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setIsLoading(true);

      try {
        if (!currentUser) {
          const result = await AuthManager.anonymousSignIn();
          if (result.success) {
            setUser(result.user);
            await loadUserData(result.user);
          }
        } else {
          await loadUserData(currentUser);
        }
      } catch (err) {
        console.error("Auth error:", err);
        toast.error("Authentication failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
      SubscriptionManager.stopListening();
    };
  }, []);

  // Load user data (reports, subscription, teams)
  const loadUserData = async (currentUser) => {
    if (!currentUser) return;

    try {
      // Set up subscription listener
      SubscriptionManager.listenToSubscriptionUpdates(
        currentUser.uid,
        (subscription) => {
          setIsPremiumUser(subscription?.isActive || false);
        }
      );

      const userReports = await ScoutingReportManager.getUserReports();
      setReports(userReports);

      await fetchTeams();
    } catch (err) {
      console.error("Error loading user data:", err);
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    if (user) {
      fetchTeams();
    }
  }, [selectedDivision, user]);

  const fetchTeams = async () => {
    try {
      const data = await fetchAPI(`/teams-2024?division=${selectedDivision}`);
      const uniqueTeams = Array.from(
        new Map(data.map((team) => [team.team_name, team])).values()
      ).sort((a, b) => a.team_name.localeCompare(b.team_name));

      setAvailableTeams(uniqueTeams);
    } catch (err) {
      console.error("Error fetching teams:", err);
      toast.error("Failed to load teams");
    }
  };

  const handleCreateReport = async (reportData) => {
    if (!user) {
      navigate("/signin");
      return;
    }

    const loadingToast = toast.loading("Creating report...");
    try {
      const selectedTeamData = availableTeams.find(
        (team) => team.team_name === reportData.teamName
      );

      const newReport = {
        teamId: selectedTeamData.team_id,
        teamName: selectedTeamData.team_name,
        division: reportData.division, // Using the division from the modal
        numPitchers: 0,
        numHitters: 0,
        dateCreated: new Date().toISOString(),
        positionPlayers: [],
        pitchers: [],
        userId: user.uid,
        isAnonymous: user.isAnonymous,
      };

      const createdReport = await ScoutingReportManager.createReport(newReport);
      setReports((prev) => [...prev, createdReport]);
      setIsCreateModalOpen(false);
      toast.success("Report created", { id: loadingToast });
    } catch (err) {
      console.error("Error creating report:", err);
      toast.error("Failed to create report", { id: loadingToast });
    }
  };

  const fetchPlayers = async (teamName, division) => {
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

      setAvailablePlayers(transformedData);
      toast.success("Players loaded", { id: loadingToast });
    } catch (err) {
      console.error("Error fetching players:", err);
      toast.error("Failed to load players", { id: loadingToast });
    }
  };

  const handleAddPlayer = async (newPlayer) => {
    if (!selectedReport || !user) return;

    const loadingToast = toast.loading("Adding player...");
    try {
      const updatedReport = {
        ...selectedReport,
        numHitters: selectedReport.numHitters + 1,
        positionPlayers: [...selectedReport.positionPlayers, newPlayer],
      };

      await ScoutingReportManager.updateReport(updatedReport.id, updatedReport);
      setReports((prev) =>
        prev.map((r) => (r.id === selectedReport.id ? updatedReport : r))
      );
      setSelectedReport(updatedReport);
      setIsAddPlayerModalOpen(false);
      toast.success("Player added", { id: loadingToast });
    } catch (err) {
      console.error("Error adding player:", err);
      toast.error("Failed to add player", { id: loadingToast });
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!user) {
      navigate("/signin");
      return;
    }

    const loadingToast = toast.loading("Deleting report...");
    try {
      await ScoutingReportManager.deleteReport(reportId);
      setReports((prev) => prev.filter((report) => report.id !== reportId));

      // If we're deleting the currently selected report, go back to list view
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
        setCurrentView("list");
      }

      toast.success("Report deleted", { id: loadingToast });
    } catch (err) {
      console.error("Error deleting report:", err);
      toast.error("Failed to delete report", { id: loadingToast });
    }
  };

  const handleUpdateReport = async (updatedReport) => {
    if (!user) {
      navigate("/signin");
      return;
    }

    const loadingToast = toast.loading("Updating report...");
    try {
      await ScoutingReportManager.updateReport(updatedReport.id, updatedReport);
      setReports((prev) =>
        prev.map((r) => (r.id === updatedReport.id ? updatedReport : r))
      );
      setSelectedReport(updatedReport);
      toast.success("Report updated", { id: loadingToast });
    } catch (err) {
      console.error("Error updating report:", err);
      toast.error("Failed to update report", { id: loadingToast });
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-[calc(100vw-100px)] lg:max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8">
        {currentView === "list" ? (
          <ReportsList
            reports={reports}
            onCreateClick={() => setIsCreateModalOpen(true)}
            onDeleteReport={handleDeleteReport}
            onReportSelect={(report) => {
              setSelectedReport(report);
              setCurrentView("detail");
            }}
          />
        ) : (
          <ScoutingView
            report={selectedReport}
            onBack={() => setCurrentView("list")}
            onUpdateReport={handleUpdateReport}
            onAddPlayer={() => {
              if (selectedReport) {
                fetchPlayers(
                  selectedReport.teamName,
                  selectedReport.division || 3
                );
                setIsAddPlayerModalOpen(true);
              }
            }}
          />
        )}

        <CreateReportModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateReport}
          availableTeams={availableTeams}
          isPremiumUser={isPremiumUser}
          selectedDivision={selectedDivision}
          onDivisionChange={setSelectedDivision}
        />

        <AddPlayerModal
          isOpen={isAddPlayerModalOpen}
          onClose={() => setIsAddPlayerModalOpen(false)}
          onSubmit={handleAddPlayer}
          availablePlayers={availablePlayers}
        />
      </div>
    </div>
  );
};

export default ScoutingReport;
