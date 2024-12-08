import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ChartsList from "../components/charting/ChartsList";
import ChartModal from "../components/modals/ChartModal";
import { ChartingView } from "../components/charting/ChartingView";
import ChartManager from "../managers/ChartManager";
import AuthManager from "../managers/AuthManager";
import { LoadingState, useAnonymousToast } from "../components/alerts/Alerts";

const Charting = () => {
  const navigate = useNavigate();
  const [charts, setCharts] = useState([]);
  const [selectedChart, setSelectedChart] = useState(null);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  useAnonymousToast();

  useEffect(() => {
    const unsubscribe = AuthManager.onAuthStateChanged(async (user) => {
      setUser(user);
      setIsLoading(true);

      try {
        if (!user) {
          const result = await AuthManager.anonymousSignIn();
          if (result.success) {
            setUser(result.user);
            await loadCharts();
          }
        } else {
          await loadCharts();
        }
      } catch (err) {
        console.error("Auth error:", err);
        setCharts([]);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadCharts = async () => {
    const loadingToast = toast.loading("Loading charts...");
    try {
      const fetchedCharts = await ChartManager.getUserCharts();
      setCharts(fetchedCharts);
      toast.success("Charts loaded successfully", { id: loadingToast });
    } catch (err) {
      console.error("Error loading charts:", err);
      toast.error(err.message || "Failed to load charts", {
        id: loadingToast,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChart = async (chartData) => {
    const user = await AuthManager.ensureUser("charts");
    if (!user) {
      navigate("/signin");
      return;
    }

    const loadingToast = toast.loading("Creating chart...");
    try {
      const newChart = await ChartManager.createChart({
        chartType: chartData.chartType,
        date: new Date(chartData.date).toISOString(),
        homeTeam: chartData.homeTeam,
        awayTeam: chartData.awayTeam,
        userId: user.uid,
        isAnonymous: user.isAnonymous,
      });
      setCharts((prevCharts) => [newChart, ...prevCharts]);
      setSelectedChart(newChart);
      setIsChartModalOpen(false);
      toast.success("Chart created successfully", { id: loadingToast });
    } catch (err) {
      toast.error("Failed to create chart. Please try again.", {
        id: loadingToast,
      });
    }
  };

  const handleDeleteChart = async (chartId) => {
    if (!user) {
      navigate("/signin");
      return;
    }

    const loadingToast = toast.loading("Deleting chart...");
    try {
      await ChartManager.deleteChart(chartId);
      setCharts((prevCharts) =>
        prevCharts.filter((chart) => chart.id !== chartId)
      );
      toast.success("Chart deleted successfully", { id: loadingToast });
    } catch (err) {
      toast.error("Failed to delete chart. Please try again.", {
        id: loadingToast,
      });
    }
  };

  const handleUpdateChart = async (chartId, updatedPitches) => {
    if (!user) {
      navigate("/signin");
      return;
    }

    const loadingToast = toast.loading("Updating chart...");
    try {
      await ChartManager.updatePitches(chartId, updatedPitches);
      setCharts((prevCharts) =>
        prevCharts.map((chart) => {
          if (chart.id === chartId) {
            return {
              ...chart,
              pitches: updatedPitches,
              totalPitches: updatedPitches.length,
              updatedAt: new Date().toISOString(),
            };
          }
          return chart;
        })
      );
      toast.success("Chart updated successfully", { id: loadingToast });
    } catch (err) {
      toast.error("Failed to update chart. Please try again.", {
        id: loadingToast,
      });
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (selectedChart) {
    return (
      <ChartingView
        chart={selectedChart}
        onSave={(pitches) => handleUpdateChart(selectedChart.id, pitches)}
        onBack={() => setSelectedChart(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <ChartsList
        charts={charts}
        onCreateClick={() => setIsChartModalOpen(true)}
        onChartSelect={setSelectedChart}
        onDeleteChart={handleDeleteChart}
      />
      <ChartModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        onSubmit={handleCreateChart}
      />
    </div>
  );
};

export default Charting;
