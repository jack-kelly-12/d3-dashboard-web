import React, { useState, useEffect, useMemo } from "react";
import { BaseballTable } from "../tables/BaseballTable";
import { Plus, Trash2, FileDown, FileText, Upload } from "lucide-react";
import AdvanceReportModal from "../modals/AdvanceReportModal";
import PitchArsenalReport from "../../reports/BullpenReport";
import { pdf } from "@react-pdf/renderer";
import InfoBanner from "../data/InfoBanner";
import AuthManager from "../../managers/AuthManager";
import SubscriptionManager from "../../managers/SubscriptionManager";

const ChartsList = ({
  charts,
  onCreateClick,
  onUploadClick,
  onChartSelect,
  onDeleteChart,
}) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [normalizedCharts, setNormalizedCharts] = useState([]);
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
  });
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = AuthManager.onAuthStateChanged(async (user) => {
      setAuthState({
        isAuthenticated: !!user,
        user: user,
      });

      if (user) {
        SubscriptionManager.listenToSubscriptionUpdates(
          user.uid,
          (subscription) => {
            setIsPremiumUser(subscription?.isActive || false);
          }
        );
      } else {
        setIsPremiumUser(false);
      }
    });

    return () => {
      unsubscribeAuth();
      SubscriptionManager.stopListening();
    };
  }, []);

  const chartsDepValue = useMemo(
    () =>
      charts
        .map((chart) =>
          JSON.stringify({
            id: chart.id,
            pitcher: chart.pitcher,
            pitches: chart.pitches?.length,
            updatedAt: chart.updatedAt,
          })
        )
        .join(","),
    [charts]
  );

  useEffect(() => {
    const normalized = charts.map((chart) =>
      normalizeChartData({
        ...chart,
        pitcher: chart.pitcher || null,
        pitches: chart.pitches || [],
        totalPitches: chart.pitches?.length || 0,
      })
    );
    setNormalizedCharts(normalized);
  }, [charts, chartsDepValue]);

  const normalizeChartData = (chart) => {
    const normalized = {
      ...chart,
      source: chart.source || "d3",
      date: chart.date || chart.createdAt,
      totalPitches: chart.totalPitches || chart.pitches?.length || 0,
      updatedAt: chart.updatedAt || chart.createdAt || chart.date,
      pitcher: chart.pitcher || null,
      pitches: chart.pitches || [],
    };

    if (normalized.chartType === "bullpen" && normalized.source === "d3") {
      normalized.description = `Bullpen Session: ${
        normalized.pitcher?.name || "No Pitcher"
      }`;
    }

    return normalized;
  };

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

  const validatePitchData = (charts, reportType) => {
    const requirements = {
      "pitch-arsenal": [
        "velocity",
        "spinRate",
        "horizontalBreak",
        "verticalBreak",
      ],
    };

    const validSources = {
      "pitch-arsenal": ["trackman", "rapsodo", "d3"],
    };

    const reqFields = requirements[reportType];
    const allowedSources = validSources[reportType];

    if (!reqFields || !allowedSources) {
      console.error("Invalid report type");
      return [];
    }

    return charts.filter((chart) => {
      const source = (chart.source || "d3").toLowerCase();
      if (!allowedSources.includes(source)) return false;

      return chart.pitches?.some((pitch) =>
        reqFields.every((field) => {
          const value = pitch[field];
          return value !== undefined && value !== null && !isNaN(value);
        })
      );
    });
  };

  const handleGenerateReport = async ({ charts, reportType, pitchers }) => {
    const validCharts = validatePitchData(charts, reportType);
    const allPitches = validCharts.flatMap((chart) => chart.pitches);

    const blob = await pdf(
      <PitchArsenalReport pitchers={pitchers} data={allPitches} />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bullpen_report_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatPitchesForExport = (
    pitches,
    source = "d3",
    chartType = "game"
  ) => {
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
          pitch.timestamp,
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

      default:
        if (chartType === "bullpen") {
          headers = [
            "time",
            "pitcher",
            "pitcherHand",
            "pitchType",
            "velocity",
            "intendedZone",
            "pitchX",
            "pitchY",
            "notes",
          ];

          rows = pitches.map((pitch) => [
            pitch.timestamp,
            pitch.pitcher?.name || "",
            pitch.pitcher?.pitchHand || "",
            pitch.type || "",
            pitch.velocity || "",
            pitch.intendedZone || "",
            pitch.x?.toFixed(1) || "",
            pitch.y?.toFixed(1) || "",
            pitch.note || "",
          ]);
        } else {
          headers = [
            "pitcher",
            "pitcherHand",
            "batter",
            "batterHand",
            "pitchType",
            "velocity",
            "result",
            "hitResult",
            "pitchX",
            "pitchY",
            "hitX",
            "hitY",
            "notes",
          ];

          rows = pitches.map((pitch) => [
            pitch.time,
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
            pitch.hitDetails?.x.toFixed(1) || "",
            pitch.hitDetails?.y.toFixed(1) || "",
            pitch.note || "",
          ]);
        }
    }

    return [headers, ...rows];
  };

  const handleExport = (chart) => {
    const csvContent = formatPitchesForExport(
      chart.pitches || [],
      chart.source,
      chart.chartType
    )
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
            {row.description}
          </span>
        </div>
      );
    }

    if (row.chartType === "bullpen") {
      return (
        <div className="space-y-1">
          <span className="px-2 py-1 bg-red-100 text-gray-800 rounded-full text-sm">
            Bullpen Session: {row.pitcher?.name || "No Pitcher"}
          </span>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <span className="font-medium text-gray-800">
          {row.homeTeam && row.awayTeam
            ? `${row.awayTeam} @ ${row.homeTeam}`
            : "—"}
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
      width: "13%",
      cell: (row) => <SourceBadge source={row.source} />,
    },
    {
      name: "Pitches",
      selector: (row) => row.totalPitches || 0,
      sortable: true,
      width: "7%",
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
      width: "30%",
      cell: (row) => (
        <div className="flex gap-2">
          {(row.source || "d3").toLowerCase() === "d3" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChartSelect(row);
              }}
              className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
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
      <InfoBanner dataType={"charting"} />

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3">
            <button
              onClick={onCreateClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
            >
              <Plus size={14} />
              New Chart
            </button>
            {authState.isAuthenticated && isPremiumUser && (
              <>
                <button
                  onClick={onUploadClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Upload size={14} />
                  Upload Data
                </button>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <FileText size={14} />
                  Generate Report
                </button>
              </>
            )}
          </div>
        </div>

        <BaseballTable
          title=""
          data={normalizedCharts}
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
        <AdvanceReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          charts={charts}
          onGenerate={handleGenerateReport}
        />
      </div>
    </div>
  );
};

export default ChartsList;
