import React, { useState, useMemo } from "react";
import { FileText, X, ChevronRight } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import BullpenReport from "../../reports/BullpenReport";
import PitcherAdvanceReport from "../../reports/PitcherAdvanceReport";
import TTOReport from "../../reports/TTOReport";
import PitcherScoutingReport from "../../reports/PitcherScoutingReport";
import CatcherReport from "../../reports/CatcherReport";

export const ReportTypes = {
  BULLPEN: {
    id: "bullpen",
    name: "Bullpen Report",
    sourceRestriction: ["d3"],
    typeRestriction: ["bullpen"],
    filterType: "pitcher",
    component: BullpenReport,
    description:
      "Comprehensive analysis of bullpen sessions including pitch metrics and patterns",
    icon: "🎯",
  },
  PITCHER_SCOUTING_1: {
    id: "pitcher_scouting_1",
    name: "Pitcher Scouting Report I",
    sourceRestriction: ["d3"],
    typeRestriction: ["game", "scrimmage"],
    filterType: "team",
    component: PitcherAdvanceReport,
    description:
      "Comprehensive breakdown of pitch metrics and location patterns with left/right handed splits from in-game performance",
    icon: "⚾",
  },
  PITCHER_SCOUTING_2: {
    id: "pitcher_scouting_2",
    name: "Pitcher Scouting Report II",
    sourceRestriction: ["d3"],
    typeRestriction: ["game", "scrimmage"],
    filterType: "team",
    component: PitcherScoutingReport,
    description:
      "Advanced analysis of pitch sequencing and effectiveness, featuring detailed metrics and preferred pitch combinations by handedness",
    icon: "⚾",
  },
  TIMES_THROUGH_ORDER: {
    id: "times_through_order",
    name: "Times Through Order Report",
    sourceRestriction: ["d3"],
    typeRestriction: ["game", "scrimmage"],
    filterType: "team",
    component: TTOReport,
    description:
      "Analysis of pitcher effectiveness across multiple times through the batting order",
    icon: "📈",
  },
  CATCHER: {
    id: "catcher",
    name: "Catcher Framing Report",
    sourceRestriction: ["d3"],
    typeRestriction: ["game", "scrimmage"],
    filterType: "team",
    component: CatcherReport,
    description:
      "Analysis of catcher framing and pitch framing metrics, including pitch framing rates",
    icon: "🖼️",
  },
};

const getChartDisplayTitle = (chart) => {
  if (chart.chartType === "bullpen") {
    return `Bullpen Session: ${chart.pitcher?.name || "Unknown Pitcher"}`;
  } else if (["game", "scrimmage"].includes(chart.chartType)) {
    return `${chart.awayTeam} @ ${chart.homeTeam}`;
  }
  return "Unknown Chart Type";
};

const AdvanceReportModal = ({ isOpen, onClose, charts }) => {
  const [selectedCharts, setSelectedCharts] = useState([]);
  const [selectedPitchers, setSelectedPitchers] = useState({});
  const [currentStep, setCurrentStep] = useState("select-report");
  const [reportType, setReportType] = useState("bullpen");
  const [nameFilter, setNameFilter] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedGameChart, setSelectedGameChart] = useState(null);

  const currentReportType = ReportTypes[reportType.toUpperCase()];
  const filterType = currentReportType?.filterType || "pitcher";

  const availableCharts = useMemo(() => {
    if (!currentReportType) return [];

    return charts.filter((chart) => {
      const source = (chart.source || "d3").toLowerCase();
      return (
        currentReportType.sourceRestriction.includes(source) &&
        currentReportType.typeRestriction.includes(chart.chartType)
      );
    });
  }, [charts, currentReportType]);

  const filteredCharts = useMemo(() => {
    return availableCharts.filter((chart) => {
      const searchValue =
        filterType === "team"
          ? `${chart.awayTeam} ${chart.homeTeam}`
          : chart.pitcher?.name || "";

      const matchesName = searchValue
        .toLowerCase()
        .includes(nameFilter.toLowerCase());
      const chartDate = new Date(chart.date);
      const afterStart =
        !dateRange.start || chartDate >= new Date(dateRange.start);
      const beforeEnd = !dateRange.end || chartDate <= new Date(dateRange.end);

      return matchesName && afterStart && beforeEnd;
    });
  }, [availableCharts, nameFilter, dateRange, filterType]);

  // Extract all unique pitchers from the selected chart's pitches
  const availablePitchers = useMemo(() => {
    if (!selectedGameChart) return [];

    // Find the selected chart
    const chart = filteredCharts.find((c) => c.id === selectedGameChart.id);
    if (!chart || !chart.pitches || chart.pitches.length === 0) return [];

    // Extract all pitchers from the pitches array
    // Each pitch may have pitcher information
    const uniquePitchersMap = new Map();

    chart.pitches.forEach((pitch) => {
      if (pitch.pitcher && pitch.pitcher.name) {
        // Use pitcher name as the key for uniqueness
        if (!uniquePitchersMap.has(pitch.pitcher.name)) {
          uniquePitchersMap.set(pitch.pitcher.name, {
            ...pitch.pitcher,
            id: pitch.pitcher.id || `pitcher_${pitch.id || Date.now()}`,
            chartId: chart.id,
          });
        }
      }
    });

    // Convert Map back to array
    return Array.from(uniquePitchersMap.values());
  }, [selectedGameChart, filteredCharts]);

  const handleSelectChart = (chart) => {
    if (["game", "scrimmage"].includes(chart.chartType)) {
      setSelectedGameChart(chart);
      setCurrentStep("select-pitchers");
      // Reset pitcher selection when selecting a new chart
      setSelectedPitchers({});
    } else {
      const isSelected = selectedCharts.includes(chart);
      if (isSelected) {
        setSelectedCharts(selectedCharts.filter((c) => c.id !== chart.id));
      } else {
        setSelectedCharts([...selectedCharts, chart]);
      }
    }
  };

  const handlePitcherSelection = (pitcher) => {
    setSelectedPitchers((prev) => {
      const newSelection = { ...prev };
      if (newSelection[pitcher.id]) {
        delete newSelection[pitcher.id];
      } else {
        newSelection[pitcher.id] = pitcher;
      }
      return newSelection;
    });
  };

  const handleAddPitchers = () => {
    // Find the original chart
    const originalChart = filteredCharts.find(
      (chart) => chart.id === selectedGameChart.id
    );

    if (!originalChart) {
      console.error("Original chart not found");
      setCurrentStep("select-report");
      setSelectedGameChart(null);
      return;
    }

    // Instead of creating a new chart for each pitcher,
    // we'll create a single chart with filtered data
    if (Object.keys(selectedPitchers).length > 0) {
      // Get selected pitcher names for filtering
      const selectedPitcherNames = Object.values(selectedPitchers).map(
        (pitcher) => pitcher.name
      );

      // Create a single modified chart that includes all selected pitchers
      const modifiedChart = {
        ...originalChart,
        // We'll still use a uniquely identified chart
        id: `${originalChart.id}_filtered`,
        // Store the selected pitchers information for reference in the report
        selectedPitchers: Object.values(selectedPitchers),
        // Filter pitches to only include those from selected pitchers
        pitches: originalChart.pitches.filter(
          (pitch) =>
            pitch.pitcher && selectedPitcherNames.includes(pitch.pitcher.name)
        ),
        // Flag to indicate this is a filtered chart
        isFilteredChart: true,
      };

      // Update the total pitches count based on the filtered pitches
      modifiedChart.totalPitches = modifiedChart.pitches.length;

      // Only add the chart if it has pitches
      if (modifiedChart.pitches.length > 0) {
        setSelectedCharts([...selectedCharts, modifiedChart]);
      }
    }

    // Reset selection state and return to chart selection
    setSelectedPitchers({});
    setSelectedGameChart(null);
    setCurrentStep("select-report");
  };

  const FilterSection = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {filterType === "team" ? "Team Name" : "Pitcher Name"}
        </label>
        <input
          type="text"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder={`Filter by ${
            filterType === "team" ? "team" : "pitcher"
          }...`}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Start Date
        </label>
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) =>
            setDateRange((prev) => ({ ...prev, start: e.target.value }))
          }
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          End Date
        </label>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) =>
            setDateRange((prev) => ({ ...prev, end: e.target.value }))
          }
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );

  const handleGenerate = async () => {
    try {
      const ReportComponent = currentReportType.component;
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `${reportType}_report_${dateStr}.pdf`;

      const blob = await pdf(
        <ReportComponent charts={selectedCharts} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-2xl font-bold text-gray-900">Generate Report</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {currentStep === "select-report" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Report Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.values(ReportTypes).map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setReportType(type.id);
                        setSelectedCharts([]);
                      }}
                      className={`flex flex-col p-4 rounded-xl border-2 transition-all duration-200
                        ${
                          reportType === type.id
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:border-blue-200 hover:bg-blue-50"
                        }`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="font-medium text-gray-900 mb-1">
                        {type.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {type.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {FilterSection}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Charts to Include
                </label>
                {filteredCharts.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                    <div className="text-4xl mb-3">📈</div>
                    <p className="text-gray-600 font-medium">
                      No compatible charts available
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {currentReportType.typeRestriction[0] === "bullpen"
                        ? "Create a new bullpen chart using the charting tool"
                        : "Create a new game chart using the charting tool"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCharts.map((chart) => {
                      const isGameOrScrimmage = ["game", "scrimmage"].includes(
                        chart.chartType
                      );
                      // Check if there's a filtered version of this chart selected
                      const isSelected = isGameOrScrimmage
                        ? selectedCharts.some(
                            (c) => c.id === `${chart.id}_filtered`
                          )
                        : selectedCharts.some((c) => c.id === chart.id);

                      return (
                        <div
                          key={chart.id}
                          onClick={() => handleSelectChart(chart)}
                          className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                            ${
                              isSelected
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-200"
                            }`}
                        >
                          <div className="flex-grow">
                            <div className="font-medium text-gray-900">
                              {getChartDisplayTitle(chart)}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {new Date(chart.date).toLocaleDateString()} •{" "}
                              {chart.totalPitches} pitches
                            </div>
                          </div>
                          {isGameOrScrimmage && (
                            <div className="ml-3 flex items-center text-blue-600">
                              <span className="text-sm mr-1">
                                Select Pitchers
                              </span>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === "select-pitchers" && selectedGameChart && (
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <button
                  onClick={() => {
                    setCurrentStep("select-report");
                    setSelectedGameChart(null);
                  }}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to Charts
                </button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {getChartDisplayTitle(selectedGameChart)}
                </h3>
                <p className="text-sm text-gray-600">
                  {new Date(selectedGameChart.date).toLocaleDateString()} •{" "}
                  {selectedGameChart.totalPitches} pitches
                </p>
              </div>

              {availablePitchers.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                  <p className="text-gray-600 font-medium">
                    No pitcher data available for this game
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={() => {
                          const allSelected =
                            availablePitchers.length ===
                            Object.keys(selectedPitchers).length;
                          if (allSelected) {
                            setSelectedPitchers({});
                          } else {
                            const newSelection = {};
                            availablePitchers.forEach((pitcher) => {
                              newSelection[pitcher.id] = pitcher;
                            });
                            setSelectedPitchers(newSelection);
                          }
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {availablePitchers.length ===
                        Object.keys(selectedPitchers).length
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>

                    {/* All Pitchers in a simple list */}
                    <div className="mb-4">
                      <div className="mb-4 pb-2 border-b border-gray-200">
                        <h4 className="text-md font-medium text-gray-800 mb-1">
                          Available Pitchers
                        </h4>
                        <p className="text-sm text-gray-500">
                          Select the pitchers you want to include in the report
                        </p>
                      </div>

                      {availablePitchers.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                          No pitchers available for this game
                        </p>
                      ) : (
                        availablePitchers.map((pitcher) => (
                          <label
                            key={pitcher.id || pitcher.chartId}
                            className={`flex items-center p-3 rounded-lg border mb-2 cursor-pointer transition-all
                              ${
                                selectedPitchers[pitcher.id || pitcher.chartId]
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-blue-300"
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                !!selectedPitchers[
                                  pitcher.id || pitcher.chartId
                                ]
                              }
                              onChange={() => handlePitcherSelection(pitcher)}
                              className="h-4 w-4 text-blue-600 rounded mr-3"
                            />
                            <div>
                              <div className="font-medium">{pitcher.name}</div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleAddPitchers}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                        Object.keys(selectedPitchers).length > 0
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      } transition-colors`}
                    >
                      {Object.keys(selectedPitchers).length > 0
                        ? `Add ${Object.keys(selectedPitchers).length} Pitcher${
                            Object.keys(selectedPitchers).length > 1 ? "s" : ""
                          }`
                        : "Skip Selection"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {selectedCharts.length} charts selected
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={
                selectedCharts.length === 0 || currentStep !== "select-report"
              }
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FileText className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvanceReportModal;
