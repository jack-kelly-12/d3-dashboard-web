import React, { useState, useMemo } from "react";
import { FileText, X } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import BullpenReport from "../../reports/BullpenReport";
import PitcherAdvanceReport from "../../reports/PitcherAdvanceReport";
import TTOReport from "../../reports/TTOReport";

export const ReportTypes = {
  BULLPEN: {
    id: "bullpen",
    name: "Bullpen Report",
    sourceRestriction: ["d3"],
    typeRestriction: ["bullpen"],
    component: BullpenReport,
    description:
      "Comprehensive analysis of bullpen sessions including pitch metrics and patterns",
    icon: "🎯",
  },
  ADVANCE: {
    id: "advance",
    name: "Pitcher Advance Report",
    sourceRestriction: ["d3"],
    typeRestriction: ["game", "scrimmage"],
    component: PitcherAdvanceReport,
    description:
      "Detailed breakdown of pitcher performance in games and scrimmages",
    icon: "📊",
  },
  TIMES_THROUGH_ORDER: {
    id: "times_through_order",
    name: "Times Through Order Report",
    sourceRestriction: ["d3"],
    typeRestriction: ["game", "scrimmage"],
    component: TTOReport,
    description:
      "Analysis of pitcher effectiveness across multiple times through the batting order",
    icon: "🔄",
  },
};

const AdvanceReportModal = ({ isOpen, onClose, charts }) => {
  const [selectedCharts, setSelectedCharts] = useState([]);
  const [reportType, setReportType] = useState("bullpen");
  const [selectedPitchers, setSelectedPitchers] = useState([]);

  const availableCharts = useMemo(() => {
    const type = ReportTypes[reportType.toUpperCase()];
    if (!type) return [];

    return charts.filter((chart) => {
      const source = (chart.source || "d3").toLowerCase();
      if (!type.sourceRestriction.includes(source)) return false;
      if (!type.typeRestriction.includes(chart.chartType)) return false;
      return true;
    });
  }, [charts, reportType]);

  const availablePitchers = useMemo(() => {
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

  const handleGenerate = async () => {
    try {
      const ReportComponent = ReportTypes[reportType.toUpperCase()].component;
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `${reportType}_report_${dateStr}.pdf`;

      const blob = await pdf(
        <ReportComponent charts={selectedCharts} pitchers={selectedPitchers} />
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
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-2xl font-bold text-gray-900">Generate Report</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Report Type Selection */}
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
                      setSelectedPitchers([]);
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

            {/* Chart Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Charts to Include
              </label>
              {availableCharts.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                  <div className="text-4xl mb-3">📈</div>
                  <p className="text-gray-600 font-medium">
                    No compatible charts available
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {reportType === "bullpen"
                      ? "Create a new bullpen chart using the charting tool"
                      : "Create a new game chart using the charting tool"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableCharts.map((chart) => (
                    <label
                      key={chart.id}
                      className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                        ${
                          selectedCharts.includes(chart)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-200"
                        }`}
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
                        className="mt-1 h-4 w-4 text-blue-600 rounded"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">
                          {chart.chartType === "bullpen"
                            ? `Bullpen Session: ${
                                chart.pitcher?.name || "Unknown Pitcher"
                              }`
                            : `${chart.awayTeam} @ ${chart.homeTeam}`}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Pitchers to Include
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availablePitchers.map((pitcher) => (
                    <label
                      key={pitcher}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200
                        ${
                          selectedPitchers.includes(pitcher)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-200"
                        }`}
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
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {selectedCharts.length} charts • {selectedPitchers.length} pitchers
            selected
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
                selectedCharts.length === 0 || selectedPitchers.length === 0
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
