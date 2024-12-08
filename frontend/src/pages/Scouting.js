import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReportsList from "../components/scouting/ReportsList";
import ScoutingView from "../components/scouting/ScoutingView";
import CreateReportModal from "../components/modals/CreateReportModal";
import AddPlayerModal from "../components/modals/AddPlayerModal";
import ScoutingReportManager from "../managers/ScoutingReportsManager";
import AuthManager from "../managers/AuthManager";
import {
  useAnonymousToast,
  ErrorState,
  LoadingState,
} from "../components/alerts/Alerts.js";
import { fetchAPI } from "../config/api.js";

const ScoutingReport = () => {
  const [reports, setReports] = useState([]);
  const navigate = useNavigate();
  const [availableTeams, setAvailableTeams] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState("list");
  const [selectedReport, setSelectedReport] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  useAnonymousToast();

  useEffect(() => {
    const unsubscribe = AuthManager.onAuthStateChanged(async (user) => {
      setIsLoading(true);
      try {
        if (!user) {
          const { success, user: anonUser } =
            await AuthManager.anonymousSignIn();
          if (success) {
            await Promise.all([fetchReports(anonUser), fetchTeams()]);
          }
        } else {
          await Promise.all([fetchReports(user), fetchTeams()]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchReports = async (user) => {
    try {
      const userReports = await ScoutingReportManager.getUserReports(user.uid);
      setReports(userReports);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(err.message);
    }
  };

  const fetchTeams = async () => {
    try {
      const data = await fetchAPI("/teams-2024");

      const uniqueTeams = Array.from(
        new Map(data.map((team) => [team.team_id, team])).values()
      );

      uniqueTeams.sort((a, b) => a.team_name.localeCompare(b.team_name));
      setAvailableTeams(uniqueTeams);
    } catch (err) {
      console.error("Error fetching teams:", err);
      setError(err.message);
    }
  };

  const fetchPlayers = async (teamId) => {
    try {
      const data = await fetchAPI(`players-2024/${teamId}`);

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
    } catch (error) {
      console.error("Error fetching players:", error);
      setError("Failed to fetch players");
    }
  };

  const handleCreateReport = async (selectedTeam) => {
    const user = AuthManager.getCurrentUser();
    if (!user) {
      navigate("/signin");
      return;
    }

    const selectedTeamData = availableTeams.find(
      (team) => team.team_id.toString() === selectedTeam
    );

    const newReport = {
      teamId: selectedTeamData.team_id,
      teamName: selectedTeamData.team_name,
      numPitchers: 0,
      numHitters: 0,
      dateCreated: new Date().toISOString(),
      positionPlayers: [],
      pitchers: [],
      userId: user.uid,
    };

    try {
      const createdReport = await ScoutingReportManager.createReport(newReport);
      setReports([...reports, createdReport]);
      setIsCreateModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // Replace handleAddPlayer with:
  const handleAddPlayer = async (newPlayer) => {
    const user = AuthManager.getCurrentUser();
    if (!user) {
      navigate("/signin");
      return;
    }

    if (!selectedReport) return;

    const updatedReport = {
      ...selectedReport,
      numHitters: selectedReport.numHitters + 1,
      positionPlayers: [...selectedReport.positionPlayers, newPlayer],
    };

    try {
      await handleUpdateReport(updatedReport);
      setIsAddPlayerModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateReport = async (updatedReport) => {
    const user = AuthManager.getCurrentUser();
    if (!user) {
      navigate("/signin");
      return;
    }

    try {
      await ScoutingReportManager.updateReport(updatedReport.id, updatedReport);
      setReports(
        reports.map((r) => (r.id === updatedReport.id ? updatedReport : r))
      );
      setSelectedReport(updatedReport);
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="main-content">
        {currentView === "list" ? (
          <ReportsList
            reports={reports}
            onCreateClick={() => setIsCreateModalOpen(true)}
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
              fetchPlayers(selectedReport.teamId);
              setIsAddPlayerModalOpen(true);
            }}
          />
        )}

        <CreateReportModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateReport}
          availableTeams={availableTeams}
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
