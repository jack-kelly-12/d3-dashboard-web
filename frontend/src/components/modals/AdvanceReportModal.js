import React, { useState, useMemo } from "react";
import { pdf } from "@react-pdf/renderer";
import BullpenReport from "../../reports/BullpenReport";
import PitcherAdvanceReport from "../../reports/PitcherAdvanceReport";
import TTOReport from "../../reports/TTOReport";
import PitcherScoutingReport from "../../reports/PitcherScoutingReport";
import CatcherReport from "../../reports/CatcherReport";
import Modal from "./Modal";

export const ReportTypes = {
  BULLPEN: {
    id: "bullpen",
    name: "Bullpen Report",
    component: BullpenReport,
    description: "Detailed bullpen session metrics and pitch data.",
    sourceRestriction: ["d3"],
    typeRestriction: ["bullpen"],
    filterType: "pitcher",
    showPitcherSelection: false,
  },
  PITCHER_SCOUTING_1: {
    id: "pitcher_scouting_1",
    name: "Pitcher Scouting I",
    component: PitcherAdvanceReport,
    description: "Pitch metrics, location heatmaps, and L/R splits.",
    sourceRestriction: ["d3"],
    typeRestriction: ["game", "scrimmage"],
    filterType: "team",
    showPitcherSelection: true,
  },
  PITCHER_SCOUTING_2: {
    id: "pitcher_scouting_2",
    name: "Pitcher Scouting II",
    component: PitcherScoutingReport,
    description:
      "Sequencing, pitch effectiveness, and usage patterns by handedness.",
    sourceRestriction: ["d3"],
    typeRestriction: ["game", "scrimmage"],
    filterType: "team",
    showPitcherSelection: true,
  },
  TIMES_THROUGH_ORDER: {
    id: "times_through_order",
    name: "Times Through Order",
    component: TTOReport,
    description: "Pitcher performance through successive lineup cycles.",
    sourceRestriction: ["d3"],
    typeRestriction: ["game", "scrimmage"],
    filterType: "team",
    showPitcherSelection: true,
  },
  CATCHER: {
    id: "catcher",
    name: "Catcher Framing",
    component: CatcherReport,
    description: "Framing efficiency and strike-zone control metrics.",
    sourceRestriction: ["d3"],
    typeRestriction: ["game", "scrimmage"],
    filterType: "team",
    showPitcherSelection: false,
  },
};

const getChartDisplayTitle = (chart) => {
  if (chart.chartType === "bullpen") {
    return `Bullpen: ${chart.pitcher?.name || "Unknown Pitcher"}`;
  }
  if (["game", "scrimmage"].includes(chart.chartType)) {
    return `${chart.awayTeam} @ ${chart.homeTeam}`;
  }
  return "Unknown Chart";
};

const AdvanceReportModal = ({ isOpen, onClose, charts }) => {
  const [selectedCharts, setSelectedCharts] = useState([]);
  const [reportType, setReportType] = useState("bullpen");
  const [nameFilter, setNameFilter] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const currentReport = ReportTypes[reportType.toUpperCase()];
  const filterType = currentReport?.filterType || "pitcher";

  const resetState = () => {
    setSelectedCharts([]);
    setReportType("bullpen");
    setNameFilter("");
    setDateRange({ start: "", end: "" });
    onClose();
  };

  const availableCharts = useMemo(() => {
    if (!currentReport) return [];
    return charts.filter(
      (c) =>
        currentReport.sourceRestriction.includes((c.source || "d3").toLowerCase()) &&
        currentReport.typeRestriction.includes(c.chartType)
    );
  }, [charts, currentReport]);

  const filteredCharts = useMemo(() => {
    return availableCharts.filter((chart) => {
      const searchValue =
        filterType === "team"
          ? `${chart.awayTeam} ${chart.homeTeam}`.toLowerCase()
          : chart.pitcher?.name?.toLowerCase() || "";
      const match = searchValue.includes(nameFilter.toLowerCase());
      const chartDate = new Date(chart.date);
      const afterStart =
        !dateRange.start || chartDate >= new Date(dateRange.start);
      const beforeEnd =
        !dateRange.end || chartDate <= new Date(dateRange.end);
      return match && afterStart && beforeEnd;
    });
  }, [availableCharts, nameFilter, dateRange, filterType]);

  const handleGenerate = async () => {
    try {
      const ReportComponent = currentReport.component;
      const blob = await pdf(<ReportComponent charts={selectedCharts} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportType}_${new Date().toISOString().split("T")[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      resetState();
    } catch (err) {
      console.error("Report generation failed:", err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={resetState} title="Generate Report">
      <section>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Report Type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          {Object.values(ReportTypes).map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setReportType(type.id);
                setSelectedCharts([]);
              }}
              className={`p-4 rounded-lg border text-left transition ${
                reportType === type.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              <div className="font-medium text-gray-900 mb-1">{type.name}</div>
              <div className="text-sm text-gray-500">{type.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filterType === "team" ? "Team Name" : "Pitcher Name"}
            </label>
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder={`Filter by ${filterType}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      <section>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Charts
        </label>
        {filteredCharts.length === 0 ? (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
            No charts available for this report type.
          </div>
        ) : (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
            {filteredCharts.map((chart) => {
              const isSelected = selectedCharts.some((c) => c.id === chart.id);
              return (
                <div
                  key={chart.id}
                  onClick={() =>
                    setSelectedCharts((prev) =>
                      isSelected
                        ? prev.filter((c) => c.id !== chart.id)
                        : [...prev, chart]
                    )
                  }
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {getChartDisplayTitle(chart)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(chart.date).toLocaleDateString()} • {chart.totalPitches} pitches
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-500">
          {selectedCharts.length} chart{selectedCharts.length !== 1 && "s"} selected
        </span>
        <div className="flex gap-3">
          <button
            onClick={resetState}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={selectedCharts.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Generate
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AdvanceReportModal;
