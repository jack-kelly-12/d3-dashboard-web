import React from "react";
import { BaseballTable } from "../tables/BaseballTable";
import { Plus, Trash2, FileDown } from "lucide-react";

const ChartsList = ({
  charts,
  onCreateClick,
  onUploadClick,
  onChartSelect,
  onDeleteChart,
}) => {
  const getTimeAgo = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";

    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours === 0) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;

    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatPitchesForExport = (pitches, source = "d3") => {
    let headers;
    let rows;

    switch (source.toLowerCase()) {
      case "trackman":
        headers = [
          "Time",
          "Pitch Type",
          "Velocity",
          "Spin Rate",
          "Spin Axis",
          "Horizontal Break",
          "Vertical Break",
          "Extension",
          "Plate Location Height",
          "Plate Location Side",
        ];

        rows = pitches.map((pitch) => [
          new Date(pitch.timestamp).toLocaleString(),
          pitch.type || "",
          pitch.velocity || "",
          pitch.spinRate || "",
          pitch.spinAxis || "",
          pitch.horizontalBreak || "",
          pitch.verticalBreak || "",
          pitch.extension || "",
          pitch.plateLocHeight || "",
          pitch.plateLocSide || "",
        ]);
        break;

      case "rapsodo":
        headers = [
          "Time",
          "Pitch Type",
          "Velocity",
          "Spin Rate",
          "Spin Efficiency",
          "Horizontal Break",
          "Vertical Break",
          "Release Height",
          "Release Side",
          "Strike Zone X",
          "Strike Zone Z",
        ];

        rows = pitches.map((pitch) => [
          new Date(pitch.timestamp).toLocaleString(),
          pitch.type || "",
          pitch.velocity || "",
          pitch.spinRate || "",
          pitch.spinEff || "",
          pitch.horzBreak || "",
          pitch.vertBreak || "",
          pitch.relHeight || "",
          pitch.relSide || "",
          pitch.strikeZoneX || "",
          pitch.strikeZoneZ || "",
        ]);
        break;

      default: // D3 Dashboard format
        headers = [
          "Time",
          "Pitcher",
          "Pitcher Hand",
          "Batter",
          "Batter Hand",
          "Pitch Type",
          "Velocity",
          "Result",
          "Hit Result",
          "Pitch X",
          "Pitch Y",
          "Hit X",
          "Hit Y",
          "Notes",
        ];

        rows = pitches.map((pitch) => [
          new Date(pitch.timestamp).toLocaleString(),
          pitch.pitcher?.name || "",
          pitch.pitcher?.pitchHand || "",
          pitch.batter?.name || "",
          pitch.batter?.batHand || "",
          pitch.type || "",
          pitch.velocity || "",
          pitch.result?.replace(/_/g, " ") || "",
          pitch.hitResult?.replace(/_/g, " ") || "",
          pitch.x?.toFixed(1) || "",
          pitch.y?.toFixed(1) || "",
          pitch.hitX?.toFixed(1) || "",
          pitch.hitY?.toFixed(1) || "",
          pitch.notes || "",
        ]);
    }

    return [headers, ...rows];
  };

  const handleExport = (chart) => {
    // Pass the chart's source to formatPitchesForExport
    const csvContent = formatPitchesForExport(chart.pitches || [], chart.source)
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `chart_${chart.id}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDescription = (row) => {
    if (!row.chartType) return "—";

    if (row.source !== "d3") {
      return (
        <div className="space-y-1">
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
            User uploaded data
          </span>
        </div>
      );
    }

    if (row.chartType === "bullpen") {
      return (
        <div className="space-y-1">
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
            Bullpen Session: {row.pitcher?.name || "No Pitcher"}
          </span>
        </div>
      );
    }

    if (!row.homeTeam || !row.awayTeam) return "—";

    return (
      <div className="space-y-1">
        <span className="font-medium text-gray-800">
          {`${row.awayTeam} @ ${row.homeTeam}`}
        </span>
      </div>
    );
  };

  const SourceBadge = ({ source }) => {
    const sourceConfig = {
      d3: {
        styles: "bg-blue-50 text-blue-700 border-blue-200",
        label: "D3 Dashboard",
      },
      rapsodo: {
        styles: "bg-green-50 text-green-700 border-green-200",
        label: "Rapsodo",
      },
      trackman: {
        styles: "bg-purple-50 text-purple-700 border-purple-200",
        label: "Trackman",
      },
    };

    const normalizedSource = (source || "d3").toLowerCase();
    const config = sourceConfig[normalizedSource] || sourceConfig.d3;

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${config.styles}`}
      >
        {config.label}
      </span>
    );
  };

  const columns = [
    {
      name: "Date",
      selector: (row) => row.date || "—",
      sortable: true,
      width: "10%",
      cell: (row) => (row.date ? new Date(row.date).toLocaleDateString() : "—"),
    },
    {
      name: "Description",
      sortable: true,
      width: "25%",
      cell: formatDescription,
    },
    {
      name: "Source",
      selector: (row) => row.source,
      sortable: true,
      width: "15%",
      cell: (row) => <SourceBadge source={row.source} />,
    },
    {
      name: "Pitches",
      selector: (row) => row.totalPitches || 0,
      sortable: true,
      width: "10%",
      cell: (row) => (
        <span className="font-medium text-blue-600">
          {row.totalPitches || 0}
        </span>
      ),
    },
    {
      name: "Last Updated",
      selector: (row) => row.updatedAt || "—",
      sortable: true,
      width: "15%",
      cell: (row) => getTimeAgo(row.updatedAt),
    },
    {
      name: "Actions",
      width: "25%",
      cell: (row) => (
        <div className="flex gap-2">
          {(row.source || "d3").toLowerCase() === "d3" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChartSelect(row);
              }}
              className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            >
              View Chart
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleExport(row);
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
          >
            <FileDown size={12} />
            Export CSV
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteChart(row.id);
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Game Charts
          </h1>
          <div className="flex gap-3">
            <button
              onClick={onCreateClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
            >
              <Plus size={14} />
              New Chart
            </button>
            <button
              onClick={onUploadClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Plus size={14} />
              Upload Data
            </button>
          </div>
        </div>

        <BaseballTable
          title=""
          data={charts}
          columns={columns}
          filename="game_charts.csv"
          noDataComponent={
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No charts created yet</p>
              <p className="text-gray-400 mt-2">
                Click "New Chart" to get started
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default ChartsList;
