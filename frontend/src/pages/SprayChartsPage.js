import React, { useState, useEffect } from "react";
import { FileDown, ArrowLeft, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ScoutingReportManager from "../managers/ScoutingReportsManager";
import SprayChart from "../components/scouting/SprayChart";
import toast from "react-hot-toast";

const SprayChartsPage = () => {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const reportData = await ScoutingReportManager.getReportById(reportId);
        setReport(reportData);
      } catch (error) {
        console.error("Error fetching report:", error);
        toast.error("Error loading report data");
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const handleExportAll = () => {
    toast.success(`Exporting all spray charts for ${report.teamName}`);
    console.log("Export all spray charts to PDF");
  };

  const handleExportSingle = (player) => {
    toast.success(`Exporting spray chart for ${player.name}`);
    console.log(`Export spray chart for ${player.name}`);
  };

  const handleBackToReports = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Report Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The requested report could not be found.
          </p>
          <button
            onClick={() => navigate("/reports")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  // Get all batters from the report (position players)
  const batters = report.positionPlayers || [];

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackToReports}
              className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                Spray Charts
              </h1>
              <p className="text-sm text-gray-500">
                {report.teamName} • {report.year || "2024"} Season
              </p>
            </div>
          </div>
          <button
            onClick={handleExportAll}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Printer size={16} />
            Export All to PDF
          </button>
        </div>

        {batters.length === 0 ? (
          <div className="text-center py-10">
            <div className="bg-gray-50 p-6 rounded-xl inline-flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <ArrowLeft size={24} />
              </div>
              <p className="text-gray-700 text-lg font-medium">
                No batters in this report
              </p>
              <p className="text-gray-500 mt-2">
                Return to the report and add batters to generate spray charts
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {batters.map((batter) => (
              <div
                key={batter.id}
                className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
              >
                {/* Spray Chart Visualization */}
                <div className="aspect-square bg-white">
                  <SprayChart
                    width={300}
                    height={300}
                    playerId={batter.playerId}
                    year={report.year || 2024}
                    division={report.division || 3}
                  />
                </div>

                {/* Batter info */}
                <div className="p-4 border-t border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800">{batter.name}</h3>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span>{batter.position}</span>
                        {batter.bats && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span>Bats: {batter.bats}</span>
                          </>
                        )}
                        {batter.jersey && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span>#{batter.jersey}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats preview - Use actual player stats if available */}
                  <div className="grid grid-cols-3 gap-2 mt-3 mb-4 text-center">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-lg font-semibold text-gray-700">
                        {batter.keyStats?.avg || ".---"}
                      </div>
                      <div className="text-xs text-gray-500">AVG</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-lg font-semibold text-gray-700">
                        {batter.keyStats?.obp || ".---"}
                      </div>
                      <div className="text-xs text-gray-500">OBP</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-lg font-semibold text-gray-700">
                        {batter.keyStats?.slg || ".---"}
                      </div>
                      <div className="text-xs text-gray-500">SLG</div>
                    </div>
                  </div>

                  {/* Export button */}
                  <button
                    onClick={() => handleExportSingle(batter)}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <FileDown size={16} />
                    Export Spray Chart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SprayChartsPage;
