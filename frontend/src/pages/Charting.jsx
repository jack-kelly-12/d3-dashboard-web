import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// removed unused icons
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
        chartType: chartData.chartType,
        zoneType: chartData.zoneType,
        date: chartData.date,
        source: chartData.source,
        pitches: chartData.pitches,
        totalPitches: chartData.pitches.length,
        description: chartData.description,
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
                <div className="text-sm sm:text-base font-semibold text-gray-800 mb-1 truncate">Game Charting & Analysis</div>
                <div className="text-xs sm:text-sm text-gray-600">Track pitches, hits, and plays during games. Create detailed charts for bullpen sessions, game analysis, and player development. Export data for advanced reporting and insights.</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10">
          <ChartsList
            charts={charts}
            onCreateClick={() => setIsChartModalOpen(true)}
            onUploadClick={() => setIsUploadModalOpen(true)}
            onChartSelect={setSelectedChart}
            onDeleteChart={handleDeleteChart}
          />
        </div>

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
