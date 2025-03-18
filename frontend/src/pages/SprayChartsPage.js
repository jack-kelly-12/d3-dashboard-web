import React, { useState, useEffect } from "react";
import { FileDown, ArrowLeft, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ScoutingReportManager from "../managers/ScoutingReportsManager";
import SprayChart from "../components/scouting/SprayChart";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { createRoot } from "react-dom/client";

export const exportAllSprayCharts = async (report) => {
  try {
    const batters = report?.positionPlayers || [];
    if (!batters.length) {
      return;
    }

    const zip = new JSZip();

    const { default: SprayChart } = await import(
      "../components/scouting/SprayChart"
    );

    for (let i = 0; i < batters.length; i++) {
      const batter = batters[i];

      try {
        const tempDiv = document.createElement("div");
        tempDiv.style.position = "absolute";
        tempDiv.style.left = "-9999px";
        tempDiv.style.width = "800px";
        tempDiv.style.height = "800px";
        tempDiv.style.overflow = "hidden";
        document.body.appendChild(tempDiv);

        tempDiv.setAttribute("data-player-id", batter.playerId);

        const root = createRoot(tempDiv);
        root.render(
          <SprayChart
            width={800}
            height={800}
            playerId={batter.playerId}
            year={report.year || 2024}
            division={report.division || 3}
          />
        );

        await new Promise((resolve) => setTimeout(resolve, 2000));
        const svgElement = tempDiv.querySelector("svg");

        if (!svgElement) {
          console.warn(`Could not find SVG for player: ${batter.name}`);
          document.body.removeChild(tempDiv);
          continue;
        }

        svgElement.setAttribute("width", "800");
        svgElement.setAttribute("height", "800");
        svgElement.setAttribute("length", "800");
        svgElement.setAttribute("viewBox", "0 0 800 800");
        svgElement.style.maxHeight = "800px";

        if (svgElement.getAttribute("height") === "auto") {
          svgElement.setAttribute("height", "800");
        }

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();

        await new Promise((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 800;
            canvas.height = 800;
            const ctx = canvas.getContext("2d");

            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const safeFileName = batter.name
                    .replace(/[^a-z0-9]/gi, "_")
                    .toLowerCase();

                  zip.file(`${safeFileName}_spray_chart.jpg`, blob);
                  resolve();
                } else {
                  reject(new Error("Failed to create image blob"));
                }
              },
              "image/jpeg",
              0.95
            );
          };

          img.onerror = () => {
            console.error("Failed to load SVG");
            reject(new Error("Failed to load SVG"));
          };

          img.src = url;
        });

        URL.revokeObjectURL(url);
        root.unmount();
        document.body.removeChild(tempDiv);
      } catch (playerError) {
        console.error(`Error processing player ${batter.name}:`, playerError);
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });

    const teamName = report.teamName
      ? report.teamName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
      : "team";
    const year = report.year || new Date().getFullYear();
    const fileName = `${teamName}_spray_charts_${year}.zip`;

    saveAs(zipBlob, fileName);
  } catch (error) {
    console.error("Error exporting spray charts:", error);
  }
};

export const exportSingleSprayChart = async (
  player,
  reportYear = 2024,
  division = 3
) => {
  try {
    const { default: SprayChart } = await import(
      "../components/scouting/SprayChart"
    );

    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.width = "800px";
    tempDiv.style.height = "800px";
    tempDiv.style.overflow = "hidden";
    document.body.appendChild(tempDiv);

    tempDiv.setAttribute("data-player-id", player.playerId);
    const root = createRoot(tempDiv);
    root.render(
      <SprayChart
        width={800}
        height={800}
        playerId={player.playerId}
        year={reportYear}
        division={division}
      />
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const svgElement = tempDiv.querySelector("svg");

    if (!svgElement) {
      console.warn(`Could not find SVG for player: ${player.name}`);
      root.unmount();
      document.body.removeChild(tempDiv);
      return;
    }

    // Match the exact attributes from the working function
    svgElement.setAttribute("width", "800");
    svgElement.setAttribute("height", "800");
    svgElement.setAttribute("length", "800");
    svgElement.setAttribute("viewBox", "0 0 800 800");
    svgElement.style.maxHeight = "800px";

    // Fix any invalid attributes that might cause rendering issues
    if (svgElement.getAttribute("height") === "auto") {
      svgElement.setAttribute("height", "800");
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const safeFileName = player.name
              .replace(/[^a-z0-9]/gi, "_")
              .toLowerCase();
            saveAs(blob, `${safeFileName}_spray_chart.jpg`);
          }
          root.unmount();
          document.body.removeChild(tempDiv);
          URL.revokeObjectURL(url);
        },
        "image/jpeg",
        0.95
      );
    };

    img.onerror = () => {
      console.error("Failed to load SVG");
      root.unmount();
      document.body.removeChild(tempDiv);
      URL.revokeObjectURL(url);
    };

    img.src = url;
  } catch (error) {
    console.error("Error exporting spray chart:", error);
  }
};

const SprayChartsPage = () => {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const reportData = await ScoutingReportManager.getReportById(reportId);
        setReport(reportData);
      } catch (error) {
        console.error("Error fetching report:", error);
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const handleExportAll = async () => {
    if (exporting) return;

    try {
      setExporting(true);
      await exportAllSprayCharts(report);
    } catch (error) {
      console.error("Error in export:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportSingle = async (player) => {
    if (exporting) return;

    try {
      setExporting(true);
      await exportSingleSprayChart(player);
    } catch (error) {
      console.error("Error in export:", error);
    } finally {
      setExporting(false);
    }
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
            disabled={exporting || batters.length === 0}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm ${
              exporting || batters.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white rounded-lg transition-colors shadow-sm`}
          >
            <Printer size={16} />
            {exporting ? "Exporting..." : "Export All"}
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
                <div
                  className="aspect-square bg-white"
                  data-player-id={batter.playerId}
                >
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
                    disabled={exporting}
                    className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm ${
                      exporting
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } rounded-lg transition-colors`}
                  >
                    <FileDown size={16} />
                    {exporting ? "Exporting..." : "Export Spray Chart"}
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
