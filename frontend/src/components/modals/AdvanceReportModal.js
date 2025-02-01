import React, { useState, useMemo } from "react";
import { FileText, X } from "lucide-react";
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

const AdvanceReportModal = ({ isOpen, onClose, charts }) => {
  const [selectedCharts, setSelectedCharts] = useState([]);
  const [reportType, setReportType] = useState("bullpen");
  const [nameFilter, setNameFilter] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

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
                  {filteredCharts.map((chart) => (
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
          </div>
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
              disabled={selectedCharts.length === 0}
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
