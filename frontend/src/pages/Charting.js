import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ChartsList from "../components/charting/ChartsList";
import ChartModal from "../components/modals/ChartModal";
import UploadModal from "../components/modals/UploadModal";
import { ChartingView } from "../components/charting/ChartingView";
import ChartManager from "../managers/ChartManager";
import AuthManager from "../managers/AuthManager";
import { LoadingState, useAnonymousToast } from "../components/alerts/Alerts";

const Charting = () => {
  const navigate = useNavigate();
  const [charts, setCharts] = useState([]);
  const [selectedChart, setSelectedChart] = useState(null);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
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
    try {
      const fetchedCharts = await ChartManager.getUserCharts();
      setCharts(fetchedCharts);
    } catch (err) {
      console.error("Error loading charts:", err);
      toast.error(err.message || "Failed to load charts");
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

    try {
      const newChart = await ChartManager.createChart({
        chartType: chartData.chartType,
        date: new Date(chartData.date).toISOString(),
        homeTeam: chartData.homeTeam,
        awayTeam: chartData.awayTeam,
        zoneType: chartData.zoneType,
        userId: user.uid,
        isAnonymous: user.isAnonymous,
      });

      setCharts((prevCharts) => [newChart, ...prevCharts]);
      setSelectedChart(newChart);
      setIsChartModalOpen(false);
    } catch (err) {
      toast.error("Failed to create chart. Please try again.");
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

  const handleUpdateChart = async (
    chartId,
    updatedPitches,
    updatedChartData
  ) => {
    if (!user) {
      navigate("/signin");
      return;
    }

    const loadingToast = toast.loading("Updating chart...");
    try {
      if (updatedChartData) {
        // If we have full chart data, update the entire chart in state
        setCharts((prevCharts) =>
          prevCharts.map((chart) => {
            if (chart.id === chartId) {
              return {
                ...chart,
                ...updatedChartData,
                pitches: updatedPitches,
                totalPitches: updatedPitches.length,
                updatedAt: new Date().toISOString(),
              };
            }
            return chart;
          })
        );
      } else {
        // Handle pitch-only updates as before
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
      }
      toast.success("Chart updated successfully", { id: loadingToast });
    } catch (err) {
      toast.error("Failed to update chart. Please try again.", {
        id: loadingToast,
      });
    }
  };

  const handleUploadData = async (chartData) => {
    const user = await AuthManager.ensureUser("charts");
    if (!user) {
      navigate("/signin");
      return;
    }

    const loadingToast = toast.loading("Processing uploaded data...");
    try {
      const newChart = await ChartManager.createChart({
        chartType: "bullpen",
        date: chartData.date,
        source: chartData.source,
        pitches: chartData.pitches,
        totalPitches: chartData.pitches.length,
        description: chartData.description || "User uploaded data",
        userId: user.uid,
        isAnonymous: user.isAnonymous,
      });

      setCharts((prevCharts) => [newChart, ...prevCharts]);
      setIsUploadModalOpen(false);
      toast.success(
        `Uploaded ${chartData.pitches.length} pitches successfully`,
        { id: loadingToast }
      );
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(`Failed to process uploaded data: ${err.message}`, {
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
        onSave={(pitches, updatedChart) =>
          handleUpdateChart(selectedChart.id, pitches, updatedChart)
        }
        onBack={() => setSelectedChart(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-full lg:max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <ChartsList
          charts={charts}
          onCreateClick={() => setIsChartModalOpen(true)}
          onUploadClick={() => setIsUploadModalOpen(true)}
          onChartSelect={setSelectedChart}
          onDeleteChart={handleDeleteChart}
        />
        <ChartModal
          isOpen={isChartModalOpen}
          onClose={() => setIsChartModalOpen(false)}
          onSubmit={handleCreateChart}
        />
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleUploadData}
        />
      </div>
    </div>
  );
};

export default Charting;
