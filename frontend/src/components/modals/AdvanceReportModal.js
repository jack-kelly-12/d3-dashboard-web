import React, { useState } from "react";
import PitchArsenalPDF from "../../reports/PitchArsenalReport";
import { FileText } from "lucide-react";

export const ReportTypes = {
  PITCH_ARSENAL: {
    id: "pitch-arsenal",
    name: "Pitch Arsenal Report",
    description:
      "Detailed breakdown of pitch usage, movement, and metrics by pitcher",
    dataRequirements: [
      "velocity",
      "spinRate",
      "horizontalBreak",
      "verticalBreak",
    ],
    sourceRestriction: ["trackman", "rapsodo", "d3"],
    component: PitchArsenalPDF,
  },
};

export const validatePitchData = (charts, reportType) => {
  const requirements = ReportTypes[reportType].dataRequirements;
  const validSources = ReportTypes[reportType].sourceRestriction;

  return charts.filter((chart) => {
    // Check if chart source is valid for this report type
    const source = (chart.source || "d3").toLowerCase();
    if (!validSources.includes(source)) return false;
    return chart.pitches?.some((pitch) =>
      requirements.every((req) => pitch[req] !== undefined)
    );
  });
};

const AdvanceReportModal = ({ isOpen, onClose, charts, onGenerate }) => {
  const [selectedCharts, setSelectedCharts] = useState([]);
  const [reportType, setReportType] = useState("pitch-arsenal");
  const [selectedPitchers, setSelectedPitchers] = useState([]);

  const availableCharts = charts.filter(
    (chart) => (chart.source || "d3").toLowerCase() === "d3"
  );

  const availablePitchers = React.useMemo(() => {
    const pitchers = new Set();
    selectedCharts.forEach((chart) => {
      chart.pitches?.forEach((pitch) => {
        if (pitch.pitcher?.name) {
          pitchers.add(pitch.pitcher.name);
        }
      });
    });
    return Array.from(pitchers);
  }, [selectedCharts]);

  const handleGenerate = () => {
    onGenerate({
      charts: selectedCharts,
      reportType,
      pitchers: selectedPitchers,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-xl w-full max-w-3xl mx-4 flex flex-col"
        style={{ maxHeight: "calc(100vh - 40px)" }}
      >
        {/* Fixed Header */}
        <div className="flex-none p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Generate Report
          </h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Report Type Selection */}
          <div className="bg-white">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
            >
              <option value="pitch-arsenal">Pitch Arsenal Report</option>
            </select>
          </div>

          {/* Chart Selection */}
          <div className="bg-white">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Charts to Include
            </label>
            {availableCharts.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-md">
                <p className="text-gray-500">
                  No D3 Dashboard charts available
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Create a new chart using the D3 Dashboard charting tool
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
                {availableCharts.map((chart) => (
                  <label
                    key={chart.id}
                    className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCharts.includes(chart)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCharts([...selectedCharts, chart]);
                        } else {
                          setSelectedCharts(
                            selectedCharts.filter((c) => c.id !== chart.id)
                          );
                        }
                      }}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-700">
                        {chart.chartType === "bullpen"
                          ? `Bullpen Session: ${
                              chart.pitcher?.name || "Unknown Pitcher"
                            }`
                          : `${chart.awayTeam} @ ${chart.homeTeam}`}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(chart.date).toLocaleDateString()} •{" "}
                        {chart.totalPitches} pitches
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Pitcher Selection */}
          {availablePitchers.length > 0 && (
            <div className="bg-white">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Pitchers
              </label>
              <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
                {availablePitchers.map((pitcher) => (
                  <label
                    key={pitcher}
                    className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPitchers.includes(pitcher)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPitchers([...selectedPitchers, pitcher]);
                        } else {
                          setSelectedPitchers(
                            selectedPitchers.filter((p) => p !== pitcher)
                          );
                        }
                      }}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {pitcher}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="flex-none flex justify-end gap-3 p-6 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={
              selectedCharts.length === 0 || selectedPitchers.length === 0
            }
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvanceReportModal;
