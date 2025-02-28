import React from "react";
import { BaseballTable } from "../tables/BaseballTable";
import { Plus, Trash2, FileDown, Eye } from "lucide-react";
import toast from "react-hot-toast";
import ReportPDF from "./ReportPDF";
import { pdf } from "@react-pdf/renderer";
import InfoBanner from "../data/InfoBanner";
import { useMediaQuery } from "react-responsive";

const ReportsList = ({
  reports,
  onCreateClick,
  onReportSelect,
  onDeleteReport,
}) => {
  const isXSmall = useMediaQuery({ maxWidth: 480 });
  const isSmall = useMediaQuery({ maxWidth: 640 });
  const isMedium = useMediaQuery({ maxWidth: 768 });

  const handleDeleteConfirmation = (report) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-4">
          <p>Delete report for {truncateText(report.teamName)}?</p>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 text-sm text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-sm"
              onClick={() => {
                onDeleteReport(report.id);
                toast.dismiss(t.id);
              }}
            >
              Delete
            </button>
            <button
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  const handleExportReport = async (report) => {
    const loadingToast = toast.loading("Generating PDF...");

    try {
      const blob = await pdf(<ReportPDF report={report} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.teamName}_${
        report.dateCreated.split("T")[0]
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF generated successfully", { id: loadingToast });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF", { id: loadingToast });
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);

    if (isXSmall) {
      return `${date.getMonth() + 1}/${date.getDate()}/${date
        .getFullYear()
        .toString()
        .substr(2, 2)}`;
    } else if (isSmall) {
      return date.toLocaleDateString();
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  const ActionButton = ({
    icon: Icon,
    color,
    hoverColor,
    onClick,
    tooltip,
    showDropShadow = false,
  }) => {
    const baseClasses = `
      flex items-center justify-center 
      rounded-full transition-all duration-200 
      ${showDropShadow ? "shadow-sm hover:shadow" : ""}
    `;

    const sizeClasses = isXSmall
      ? "w-8 h-8"
      : isSmall
      ? "w-9 h-9"
      : "w-10 h-10";

    const colorClasses = `
      ${color} hover:${hoverColor} 
      hover:scale-105 active:scale-95
    `;

    const iconSize = isXSmall ? 14 : isSmall ? 16 : 18;

    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${sizeClasses} ${colorClasses}`}
        title={tooltip}
      >
        <Icon size={iconSize} />
      </button>
    );
  };

  const ActionMenu = ({ row }) => {
    return (
      <div className="flex items-center gap-2 justify-end">
        <ActionButton
          icon={Eye}
          color="text-blue-600 bg-blue-50"
          hoverColor="bg-blue-100"
          onClick={(e) => {
            e.stopPropagation();
            onReportSelect(row);
          }}
          tooltip="View Report"
        />

        <ActionButton
          icon={FileDown}
          color="text-emerald-600 bg-emerald-50"
          hoverColor="bg-emerald-100"
          onClick={(e) => {
            e.stopPropagation();
            handleExportReport(row);
          }}
          tooltip="Export PDF"
        />

        <ActionButton
          icon={Trash2}
          color="text-red-600 bg-red-50"
          hoverColor="bg-red-100"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteConfirmation(row);
          }}
          tooltip="Delete Report"
        />
      </div>
    );
  };

  const getColumns = () => {
    if (isXSmall) {
      return [
        {
          name: "Team Info",
          width: "70%",
          cell: (row) => (
            <div className="flex flex-col">
              <span className="font-medium text-gray-800">
                {truncateText(row.teamName)}
              </span>
              <div className="flex gap-2 text-xs text-gray-500">
                <span>{formatDate(row.dateCreated)}</span>
                <span className="text-gray-300">•</span>
                <span>{row.numPitchers}P</span>
                <span className="text-gray-300">•</span>
                <span>{row.numHitters}H</span>
              </div>
            </div>
          ),
        },
        {
          name: "",
          width: "30%",
          cell: (row) => <ActionMenu row={row} />,
        },
      ];
    }

    if (isSmall) {
      return [
        {
          name: "Team",
          selector: (row) => row.teamName,
          sortable: true,
          width: "40%",
          cell: (row) => <span>{truncateText(row.teamName)}</span>,
        },
        {
          name: "Date",
          selector: (row) => row.dateCreated,
          sortable: true,
          width: "30%",
          cell: (row) => formatDate(row.dateCreated),
        },

        {
          name: "",
          width: "30%",
          cell: (row) => <ActionMenu row={row} />,
        },
      ];
    }

    if (isMedium) {
      return [
        {
          name: "Team",
          selector: (row) => row.teamName,
          sortable: true,
          width: "20%",
        },
        {
          name: "Date",
          selector: (row) => row.dateCreated,
          sortable: true,
          width: "20%",
          cell: (row) => formatDate(row.dateCreated),
        },
        {
          name: "Roster",
          width: "30%",
          cell: (row) => (
            <div className="flex space-x-2">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                {row.numPitchers} Pitchers
              </span>
              <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs">
                {row.numHitters} Hitters
              </span>
            </div>
          ),
        },
        {
          name: "",
          width: "25%",
          cell: (row) => <ActionMenu row={row} />,
        },
      ];
    }

    return [
      {
        name: "Team",
        selector: (row) => row.teamName,
        sortable: true,
        width: "25%",
        cell: (row) => <span className="font-medium">{row.teamName}</span>,
      },
      {
        name: "Date Created",
        selector: (row) => row.dateCreated,
        sortable: true,
        width: "20%",
        cell: (row) => formatDate(row.dateCreated),
      },
      {
        name: "Roster",
        width: "30%",
        cell: (row) => (
          <div className="flex space-x-3">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              {row.numPitchers} Pitchers
            </span>
            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
              {row.numHitters} Hitters
            </span>
          </div>
        ),
      },
      {
        name: "",
        width: "20%",
        cell: (row) => <ActionMenu row={row} />,
      },
    ];
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <InfoBanner dataType="scouting" />

      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <button
            onClick={onCreateClick}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
          >
            <Plus size={isSmall ? 14 : 16} />
            {isXSmall ? "New" : "New Report"}
          </button>
        </div>

        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <BaseballTable
            title=""
            data={reports}
            columns={getColumns()}
            filename="scouting_reports.csv"
            noDataComponent={
              <div className="text-center py-8 sm:py-12">
                <div className="bg-gray-50 p-6 rounded-xl inline-flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                    <Plus size={24} />
                  </div>
                  <p className="text-gray-700 text-base sm:text-lg font-medium">
                    No reports created yet
                  </p>
                  <p className="text-gray-500 mt-2 text-sm">
                    Click {isXSmall ? '"New"' : '"New Report"'} to get started
                  </p>
                </div>
              </div>
            }
            paginationComponentOptions={{
              rowsPerPageText: "",
              rangeSeparatorText: "of",
              selectAllRowsItem: false,
            }}
            customStyles={{
              table: {
                style: {
                  borderRadius: "0.5rem",
                },
              },
              header: {
                style: {
                  padding: "1rem",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#4B5563",
                  backgroundColor: "#F9FAFB",
                  borderBottomWidth: "1px",
                  borderBottomColor: "#E5E7EB",
                  borderTopLeftRadius: "0.5rem",
                  borderTopRightRadius: "0.5rem",
                },
              },
              headRow: {
                style: {
                  borderBottomWidth: "1px",
                  borderBottomColor: "#E5E7EB",
                  backgroundColor: "#F9FAFB",
                },
              },
              headCells: {
                style: {
                  padding: "0.75rem 1rem",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#6B7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                },
              },
              cells: {
                style: {
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                },
              },
              rows: {
                style: {
                  "&:hover": {
                    backgroundColor: "#F3F4F6",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportsList;
