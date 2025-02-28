import React, { useState, useEffect, useMemo } from "react";
import { BaseballTable } from "../tables/BaseballTable";
import { Plus, FileText, Upload } from "lucide-react";
import AdvanceReportModal from "../modals/AdvanceReportModal";
import PitchArsenalReport from "../../reports/BullpenReport";
import { pdf } from "@react-pdf/renderer";
import InfoBanner from "../data/InfoBanner";
import AuthManager from "../../managers/AuthManager";
import { useSubscription } from "../../contexts/SubscriptionContext";
import ActionMenu from "./ActionMenu";
import { useMediaQuery } from "react-responsive";

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
  const { isPremiumUser } = useSubscription();

  const isXSmall = useMediaQuery({ maxWidth: 480 });
  const isSmall = useMediaQuery({ maxWidth: 640 });
  const isMedium = useMediaQuery({ maxWidth: 768 });

  useEffect(() => {
    const unsubscribeAuth = AuthManager.onAuthStateChanged(async (user) => {
      setAuthState({
        isAuthenticated: !!user,
        user: user,
      });
    });

    return () => {
      unsubscribeAuth();
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

    // Different date formats based on screen size
    if (isXSmall) {
      return date.toLocaleDateString();
    }

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

  const formatPitchesForExport = (chart, source = "d3", chartType = "game") => {
    // Ensure chart and pitches are properly defined
    if (!chart) {
      console.error("Chart object is required");
      return [[], []];
    }

    // Fix the pitches initialization with proper OR operator
    const pitches = chart.pitches || [];

    // Validate pitches is an array
    if (!Array.isArray(pitches)) {
      console.error("Pitches must be an array");
      return [[], []];
    }

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
          pitch?.timestamp ? new Date(pitch.timestamp).toLocaleString() : "",
          pitch?.type || "",
          pitch?.velocity || "",
          pitch?.spinRate || "",
          pitch?.spinAxis || "",
          pitch?.horizontalBreak || "",
          pitch?.verticalBreak || "",
          pitch?.extension || "",
          pitch?.plateLocHeight || "",
          pitch?.plateLocSide || "",
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
          pitch?.timestamp || "",
          pitch?.type || "",
          pitch?.velocity || "",
          pitch?.spinRate || "",
          pitch?.spinEff || "",
          pitch?.horzBreak || "",
          pitch?.vertBreak || "",
          pitch?.relHeight || "",
          pitch?.relSide || "",
          pitch?.strikeZoneX || "",
          pitch?.strikeZoneZ || "",
        ]);
        break;

      default:
        if (chartType === "bullpen") {
          headers = [
            "Pitcher",
            "Pitcher Hand",
            "Pitch Type",
            "Velocity",
            "Intended Zone",
            "Pitch X",
            "Pitch Y",
            "Notes",
          ];

          rows = pitches.map((pitch) => [
            pitch?.pitcher?.name || "",
            pitch?.pitcher?.pitchHand || "",
            pitch?.type || "",
            pitch?.velocity || "",
            pitch?.intendedZone || "",
            pitch?.x ? pitch.x.toFixed(1) : "",
            pitch?.y ? pitch.y.toFixed(1) : "",
            pitch?.note || "",
          ]);
        } else {
          headers = [
            "Pitcher",
            "Pitcher Hand",
            "Batter",
            "Batter Hand",
            "Home Team",
            "Away Team",
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
            pitch?.pitcher?.name || "",
            pitch?.pitcher?.pitchHand || "",
            pitch?.batter?.name || "",
            pitch?.batter?.batHand || "",
            chart.homeTeam || "",
            chart.awayTeam || "",
            pitch?.type || "",
            pitch?.velocity || "",
            pitch?.result ? pitch.result.replace(/_/g, " ") : "",
            pitch?.hitResult ? pitch.hitResult.replace(/_/g, " ") : "",
            pitch?.x ? pitch.x.toFixed(1) : "",
            pitch?.y ? pitch.y.toFixed(1) : "",
            pitch?.hitDetails?.x ? pitch.hitDetails.x.toFixed(1) : "",
            pitch?.hitDetails?.y ? pitch.hitDetails.y.toFixed(1) : "",
            pitch?.note || "",
          ]);
        }
    }

    return [headers, ...rows];
  };

  const handleExport = (chart) => {
    const csvContent = formatPitchesForExport(
      chart,
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

  const truncateText = (text, maxLengthOverride) => {
    if (!text) return "";

    let maxLength;
    if (maxLengthOverride) {
      maxLength = maxLengthOverride;
    } else if (isXSmall) {
      maxLength = 10;
    } else if (isSmall) {
      maxLength = 15;
    } else if (isMedium) {
      maxLength = 20;
    } else {
      return text;
    }

    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const formatDescription = (row) => {
    if (!row.chartType) return "—";

    if (row.source !== "d3") {
      return (
        <div className="space-y-1">
          <span className="px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-800 rounded-full text-md sm:text-xs md-text-sm lg-text-md">
            {isSmall ? truncateText(row.description) : row.description}
          </span>
        </div>
      );
    }

    if (row.chartType === "bullpen") {
      const pitcherName = row.pitcher?.name || "No Pitcher";
      return (
        <div className="space-y-1">
          <span className="px-2 py-0.5 sm:py-1 bg-red-100 text-gray-800 rounded-full text-md md-text-sm lg-text-md">
            {isXSmall ? (
              <>Bullpen: {truncateText(pitcherName)}</>
            ) : isSmall ? (
              <>Bullpen: {truncateText(pitcherName)}</>
            ) : isMedium ? (
              <>Bullpen: {truncateText(pitcherName)}</>
            ) : (
              <>Bullpen: {pitcherName}</>
            )}
          </span>
        </div>
      );
    }

    if (row.homeTeam && row.awayTeam) {
      return (
        <div className="space-y-1">
          <span className="font-medium text-gray-800 text-md md-text-sm lg-text-sm">
            {isXSmall
              ? `${truncateText(row.awayTeam, 7)} @ ${truncateText(
                  row.homeTeam,
                  7
                )}`
              : isSmall
              ? `${truncateText(row.awayTeam, 10)} @ ${truncateText(
                  row.homeTeam,
                  10
                )}`
              : `${row.awayTeam} @ ${row.homeTeam}`}
          </span>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <span className="font-medium text-gray-800 text-xs sm:text-sm lg-text-md">
          {isMedium ? truncateText(row.description) : row.description}
        </span>
      </div>
    );
  };

  const SourceBadge = ({ source }) => {
    const sourceConfig = {
      d3: {
        styles: "bg-blue-50 text-blue-700 border-blue-200",
        label: "D3 Dashboard",
        shortLabel: "D3",
      },
      rapsodo: {
        styles: "bg-green-50 text-green-700 border-green-200",
        label: "Rapsodo",
        shortLabel: "Rap",
      },
      trackman: {
        styles: "bg-purple-50 text-purple-700 border-purple-200",
        label: "Trackman",
        shortLabel: "TM",
      },
    };

    const normalizedSource = (source || "d3").toLowerCase();
    const config = sourceConfig[normalizedSource] || sourceConfig.d3;

    return (
      <span
        className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium border ${config.styles}`}
      >
        {isXSmall && <span>{config.shortLabel}</span>}
        {isSmall && !isXSmall && <span>{config.shortLabel}</span>}
        {isMedium && !isSmall && !isXSmall && <span>{config.shortLabel}</span>}

        {!isMedium && <span>{config.label}</span>}
      </span>
    );
  };

  const getColumns = () => {
    if (isXSmall) {
      return [
        {
          name: "Info",
          width: "80%",
          cell: (row) => (
            <div className="flex flex-col space-y-1">
              <div className="text-xs text-gray-500 text-xs text-md-sm text-lg-md">
                {row.date ? new Date(row.date).toLocaleDateString() : "—"}
              </div>
              {formatDescription(row)}
            </div>
          ),
        },
        {
          name: "Actions",
          width: "20%",
          cell: (row) => (
            <ActionMenu
              row={row}
              onChartSelect={onChartSelect}
              handleExport={handleExport}
              onDeleteChart={onDeleteChart}
              compact={true}
            />
          ),
        },
      ];
    }

    if (isSmall) {
      return [
        {
          name: "Date",
          selector: (row) => row.date || "—",
          sortable: true,
          width: "25%",
          cell: (row) =>
            row.date ? new Date(row.date).toLocaleDateString() : "—",
        },
        {
          name: "Description",
          sortable: true,
          width: "55%",
          cell: formatDescription,
        },
        {
          name: "Actions",
          width: "20%",
          cell: (row) => (
            <ActionMenu
              row={row}
              onChartSelect={onChartSelect}
              handleExport={handleExport}
              onDeleteChart={onDeleteChart}
              compact={true}
            />
          ),
        },
      ];
    }

    if (isMedium) {
      return [
        {
          name: "Date",
          selector: (row) => row.date || "—",
          sortable: true,
          width: "20%",
          cell: (row) =>
            row.date ? new Date(row.date).toLocaleDateString() : "—",
        },
        {
          name: "Description",
          sortable: true,
          width: "30%",
          cell: formatDescription,
        },
        {
          name: "Source",
          selector: (row) => row.source,
          sortable: true,
          width: "20%",
          cell: (row) => <SourceBadge source={row.source} />,
        },
        {
          name: "#",
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
          name: "Actions",
          width: "10%",
          cell: (row) => (
            <ActionMenu
              row={row}
              onChartSelect={onChartSelect}
              handleExport={handleExport}
              onDeleteChart={onDeleteChart}
            />
          ),
        },
      ];
    }

    return [
      {
        name: "Date",
        selector: (row) => row.date || "—",
        sortable: true,
        width: "15%",
        cell: (row) =>
          row.date ? new Date(row.date).toLocaleDateString() : "—",
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
        width: "20%",
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
        width: "14%",
        cell: (row) => getTimeAgo(row.updatedAt),
      },
      {
        name: "Actions",
        width: "15%",
        cell: (row) => (
          <ActionMenu
            row={row}
            onChartSelect={onChartSelect}
            handleExport={handleExport}
            onDeleteChart={onDeleteChart}
          />
        ),
      },
    ];
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <InfoBanner dataType={"charting"} />

      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={onCreateClick}
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
            >
              <Plus size={isSmall ? 12 : 14} />
              {isXSmall ? "New" : "New Chart"}
            </button>
            {authState.isAuthenticated && isPremiumUser && (
              <>
                <button
                  onClick={onUploadClick}
                  className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Upload size={isSmall ? 12 : 14} />
                  {isXSmall ? "Upload" : "Upload Data"}
                </button>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <FileText size={isSmall ? 12 : 14} />
                  {isXSmall ? "Report" : "Generate Report"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <BaseballTable
            title=""
            data={normalizedCharts}
            columns={getColumns()}
            filename="game_charts.csv"
            noDataComponent={
              <div className="text-center py-6 sm:py-12">
                <p className="text-gray-500 text-base sm:text-lg">
                  No charts created yet
                </p>
                <p className="text-gray-400 mt-2 text-sm sm:text-base">
                  Click {isXSmall ? '"New"' : '"New Chart"'} to get started
                </p>
              </div>
            }
          />
        </div>
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
