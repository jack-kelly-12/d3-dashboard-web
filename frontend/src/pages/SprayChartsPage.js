import React, { useState, useEffect } from "react";
import { FileDown, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ScoutingReportManager from "../managers/ScoutingReportsManager";
import SprayChart from "../components/scouting/SprayChart";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { createRoot } from "react-dom/client";

function getSVGString(svgNode) {
  svgNode.setAttribute("xlink", "http://www.w3.org/1999/xlink");

  const styleNode = document.createElement("style");
  styleNode.textContent = `
    text {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      shape-rendering: geometricPrecision;
      text-rendering: optimizeLegibility;
    }
  `;
  svgNode.appendChild(styleNode);

  var cssStyleText = getCSSStyles(svgNode);
  appendCSS(cssStyleText, svgNode);

  var serializer = new XMLSerializer();
  var svgString = serializer.serializeToString(svgNode);
  svgString = svgString.replace(/(\w+)?:?xlink=/g, "xmlns:xlink=");
  svgString = svgString.replace(/NS\d+:href/g, "xlink:href");

  return svgString;
}

function getCSSStyles(parentElement) {
  var selectorTextArr = [];

  if (parentElement.id) selectorTextArr.push("#" + parentElement.id);
  for (var c = 0; c < parentElement.classList.length; c++)
    if (!contains("." + parentElement.classList[c], selectorTextArr))
      selectorTextArr.push("." + parentElement.classList[c]);

  var nodes = parentElement.getElementsByTagName("*");
  for (var i = 0; i < nodes.length; i++) {
    var id = nodes[i].id;
    if (id && !contains("#" + id, selectorTextArr))
      selectorTextArr.push("#" + id);

    var classes = nodes[i].classList;
    for (c = 0; c < classes.length; c++)
      if (!contains("." + classes[c], selectorTextArr))
        selectorTextArr.push("." + classes[c]);
  }

  var extractedCSSText = "";
  for (i = 0; i < document.styleSheets.length; i++) {
    var s = document.styleSheets[i];

    try {
      if (!s.cssRules) continue;
    } catch (e) {
      if (e.name !== "SecurityError") throw e;
      continue;
    }

    var cssRules = s.cssRules;
    for (var r = 0; r < cssRules.length; r++) {
      if (contains(cssRules[r].selectorText, selectorTextArr))
        extractedCSSText += cssRules[r].cssText;
    }
  }

  return extractedCSSText;

  function contains(str, arr) {
    return arr.indexOf(str) === -1 ? false : true;
  }
}

function appendCSS(cssText, element) {
  var styleElement = document.createElement("style");
  styleElement.setAttribute("type", "text/css");
  styleElement.innerHTML = cssText;
  var refNode = element.hasChildNodes() ? element.children[0] : null;
  element.insertBefore(styleElement, refNode);
}

function svgToImage(svgString, width, height, callback) {
  var imgsrc =
    "data:image/svg+xml;base64," +
    btoa(unescape(encodeURIComponent(svgString)));

  var canvas = document.createElement("canvas");
  canvas.width = width * 2; // 2x resolution
  canvas.height = height * 2; // 2x resolution

  var context = canvas.getContext("2d");
  context.scale(2, 2);

  var image = new Image();
  image.onload = function () {
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    context.textRendering = "optimizeLegibility";
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    context.drawImage(image, 0, 0, width, height);

    canvas.toBlob(
      function (blob) {
        if (callback) callback(blob);
      },
      "image/jpeg",
      0.98
    );
  };

  image.src = imgsrc;
}

export const exportSingleSprayChart = async (
  player,
  reportYear = 2024,
  division = 3
) => {
  try {
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.width = "800px";
    tempDiv.style.height = "500px";
    document.body.appendChild(tempDiv);

    return new Promise((resolve, reject) => {
      const root = createRoot(tempDiv);

      root.render(
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      );

      setTimeout(() => {
        root.render(
          <SprayChart
            width={800}
            height={500}
            playerId={player.playerId}
            year={reportYear}
            division={division}
          />
        );

        let attempts = 0;
        const maxAttempts = 20;
        const checkInterval = 500;

        const checkForSVG = () => {
          attempts++;
          const svgElement = tempDiv.querySelector("svg");

          if (svgElement && svgElement.querySelector("path")) {
            try {
              const clonedSvg = svgElement.cloneNode(true);
              clonedSvg.setAttribute("width", "800");
              clonedSvg.setAttribute("height", "500");
              clonedSvg.setAttribute("viewBox", "0 0 800 500");

              if (clonedSvg.getAttribute("height") === "auto") {
                clonedSvg.setAttribute("height", "500");
              }

              const svgString = getSVGString(clonedSvg);

              svgToImage(svgString, 800, 500, (blob) => {
                if (blob) {
                  const safeFileName = player.name
                    .replace(/[^a-z0-9]/gi, "_")
                    .toLowerCase();
                  saveAs(blob, `${safeFileName}_spray_chart.jpg`);
                  resolve(blob);
                } else {
                  reject(new Error("Failed to create image blob"));
                }

                root.unmount();
                document.body.removeChild(tempDiv);
              });
            } catch (error) {
              root.unmount();
              document.body.removeChild(tempDiv);
              reject(error);
            }
          } else if (attempts >= maxAttempts) {
            root.unmount();
            document.body.removeChild(tempDiv);
            reject(
              new Error(
                `Could not render spray chart for player: ${player.name}`
              )
            );
          } else {
            setTimeout(checkForSVG, checkInterval);
          }
        };

        setTimeout(checkForSVG, 1000);
      }, 100);
    });
  } catch (error) {
    console.error("Error exporting spray chart:", error);
    throw error;
  }
};

export const exportAllSprayCharts = async (report) => {
  try {
    const batters = report?.positionPlayers || [];
    if (!batters.length) {
      return;
    }

    const zip = new JSZip();

    for (const batter of batters) {
      await exportBatterToZip(
        batter,
        zip,
        report.year || 2024,
        report.division || 3
      );
    }

    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6,
      },
    });

    const teamName = report.teamName
      ? report.teamName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
      : "team";
    const year = report.year || new Date().getFullYear();
    const fileName = `${teamName}_spray_charts_${year}.zip`;

    saveAs(zipBlob, fileName);
    console.log(
      `Successfully exported ${batters.length} spray charts to ${fileName}`
    );
  } catch (error) {
    console.error("Error exporting spray charts:", error);
    throw error;
  }
};

const exportBatterToZip = async (batter, zip, year, division) => {
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  tempDiv.style.width = "800px";
  tempDiv.style.height = "500px";
  document.body.appendChild(tempDiv);

  return new Promise((resolve) => {
    const root = createRoot(tempDiv);

    root.render(
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    );

    setTimeout(() => {
      root.render(
        <SprayChart
          width={800}
          height={500}
          playerId={batter.playerId}
          year={year}
          division={division}
        />
      );

      let attempts = 0;
      const maxAttempts = 20;
      const checkInterval = 500;

      const checkForSVG = () => {
        attempts++;
        try {
          const svgElement = tempDiv.querySelector("svg");

          if (svgElement && svgElement.querySelector("path")) {
            const clonedSvg = svgElement.cloneNode(true);
            clonedSvg.setAttribute("width", "800");
            clonedSvg.setAttribute("height", "500");
            clonedSvg.setAttribute("viewBox", "0 0 800 500");

            if (clonedSvg.getAttribute("height") === "auto") {
              clonedSvg.setAttribute("height", "500");
            }

            const svgString = getSVGString(clonedSvg);

            svgToImage(svgString, 800, 500, (blob) => {
              if (blob) {
                const safeFileName = batter.name
                  .replace(/[^a-z0-9]/gi, "_")
                  .toLowerCase();
                zip.file(`${safeFileName}_spray_chart.jpg`, blob);
                console.log(`Successfully added ${batter.name} to zip`);
              }

              root.unmount();
              document.body.removeChild(tempDiv);
              resolve();
            });
          } else if (attempts >= maxAttempts) {
            console.warn(
              `Could not render spray chart for player: ${batter.name} after ${maxAttempts} attempts`
            );
            root.unmount();
            document.body.removeChild(tempDiv);
            resolve(); // Skip this player but continue with others
          } else {
            setTimeout(checkForSVG, checkInterval);
          }
        } catch (error) {
          console.warn(`Error processing player ${batter.name}:`, error);
          root.unmount();
          document.body.removeChild(tempDiv);
          resolve();
        }
      };

      setTimeout(checkForSVG, 1000);
    }, 100);
  });
};

const SprayChartsPage = () => {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [chartsReady, setChartsReady] = useState(false);
  const [chartsLoading, setChartsLoading] = useState(true);

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

  // Add a new useEffect to check if all charts are ready
  useEffect(() => {
    if (!report || loading) return;

    const batters = report.positionPlayers || [];
    if (batters.length === 0) {
      setChartsReady(true);
      setChartsLoading(false);
      return;
    }

    setChartsLoading(true);

    // Wait for initial render, then check charts
    const checkChartsInterval = setInterval(() => {
      const allChartsRendered = batters.every((batter) => {
        const container = document.querySelector(
          `[data-player-id="${batter.playerId}"]`
        );
        if (!container) return false;

        const svg = container.querySelector("svg");
        const hasData = svg && svg.querySelector("path");

        return !!hasData;
      });

      if (allChartsRendered) {
        setChartsReady(true);
        setChartsLoading(false);
        clearInterval(checkChartsInterval);
      }
    }, 500);

    // Timeout after 15 seconds to prevent infinite loading
    const timeout = setTimeout(() => {
      clearInterval(checkChartsInterval);
      setChartsLoading(false);
      // Even if not all charts are ready, we'll allow export after timeout
      setChartsReady(true);
    }, 15000);

    return () => {
      clearInterval(checkChartsInterval);
      clearTimeout(timeout);
    };
  }, [report, loading]);

  const handleExportAll = async () => {
    if (exporting || !chartsReady) return;

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
    if (exporting || !chartsReady) return;

    try {
      setExporting(true);
      await exportSingleSprayChart(
        player,
        report.year || 2024,
        report.division || 3
      );
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
  const isExportDisabled = exporting || batters.length === 0 || chartsLoading;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
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
            disabled={isExportDisabled}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm ${
              isExportDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white rounded-lg transition-colors shadow-sm`}
          >
            {loading
              ? "Loading charts..."
              : exporting
              ? "Exporting..."
              : chartsLoading
              ? "Charts loading..."
              : "Export All"}
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

                <div className="p-4 border-t border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800">{batter.name}</h3>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span>{batter.position}</span>
                      </div>
                    </div>
                  </div>

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

                  <button
                    onClick={() => handleExportSingle(batter)}
                    disabled={isExportDisabled}
                    className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm ${
                      isExportDisabled
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } rounded-lg transition-colors`}
                  >
                    <FileDown size={16} />
                    {exporting
                      ? "Exporting..."
                      : chartsLoading
                      ? "Chart loading..."
                      : "Export Spray Chart"}
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
