import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReportsList from "../components/scouting/ReportsList";
import ScoutingView from "../components/scouting/ScoutingView";
import CreateReportModal from "../components/modals/CreateReportModal";
import AddPlayerModal from "../components/modals/AddPlayerModal";
import ScoutingReportManager from "../managers/ScoutingReportsManager";
import AuthManager from "../managers/AuthManager";
import SubscriptionManager from "../managers/SubscriptionManager";
import { fetchAPI } from "../config/api";

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
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState(3);

  useEffect(() => {
    const checkAuthAndSubscription = async () => {
      const user = AuthManager.getCurrentUser();
      if (!user) {
        navigate("/signin");
        return;
      }

      SubscriptionManager.listenToSubscriptionUpdates(
        user.uid,
        (subscription) => {
          setIsPremiumUser(subscription?.isActive || false);
        }
      );

      fetchReports();
    };

    checkAuthAndSubscription();
    return () => SubscriptionManager.stopListening();
  }, [navigate]);

  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAPI(`/teams-2024?division=${selectedDivision}`);

        const uniqueTeams = Array.from(
          new Map(data.map((team) => [team.team_name, team])).values()
        );

        uniqueTeams.sort((a, b) => a.team_name.localeCompare(b.team_name));
        setAvailableTeams(uniqueTeams);
      } catch (err) {
        console.error("Error fetching teams:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, [selectedDivision]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const userReports = await ScoutingReportManager.getUserReports();
      setReports(userReports);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlayers = async (team_name) => {
    try {
      const data = await fetchAPI(`/players-hit-2024/${team_name}`);

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
    } catch (err) {
      console.error("Error fetching players:", err);
      setError("Failed to fetch players");
    }
  };

  const handleCreateReport = async (selectedTeam) => {
    const user = await AuthManager.ensureUser("reports");
    if (!user) {
      navigate("/signin");
      return;
    }

    const selectedTeamData = availableTeams.find(
      (team) => team.team_name === selectedTeam
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
      isAnonymous: user.isAnonymous,
    };

    try {
      const createdReport = await ScoutingReportManager.createReport(newReport);
      setReports([...reports, createdReport]);
      setIsCreateModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddPlayer = (newPlayer) => {
    if (!selectedReport) return;

    const updatedReport = {
      ...selectedReport,
      numHitters: selectedReport.numHitters + 1,
      positionPlayers: [...selectedReport.positionPlayers, newPlayer],
    };

    setReports(
      reports.map((r) => (r.id === selectedReport.id ? updatedReport : r))
    );
    setSelectedReport(updatedReport);
    setIsAddPlayerModalOpen(false);
  };

  const handleUpdateReport = async (updatedReport) => {
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
  const LoadingState = () => (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-gray-600 font-medium">Loading data...</p>
      </div>
    </div>
  );

  const ErrorState = ({ message }) => (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
        <p className="text-red-600">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-[calc(100vw-100px)] lg:max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8">
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
              fetchPlayers(selectedReport.team_name);
              setIsAddPlayerModalOpen(true);
            }}
          />
        )}

        <CreateReportModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateReport}
          availableTeams={availableTeams}
          isPremiumUser={isPremiumUser} // Add this
          selectedDivision={selectedDivision} // Add this
          onDivisionChange={setSelectedDivision} // Add this
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
