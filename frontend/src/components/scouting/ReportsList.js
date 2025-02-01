import React from "react";
import { BaseballTable } from "../tables/BaseballTable";
import { Plus, Trash2, FileDown } from "lucide-react";
import toast from "react-hot-toast";
import ReportPDF from "./ReportPDF";
import { pdf } from "@react-pdf/renderer";
import InfoBanner from "../data/InfoBanner";

const ReportsList = ({
  reports,
  onCreateClick,
  onReportSelect,
  onDeleteReport,
}) => {
  const handleDeleteConfirmation = (report) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-4">
          <p>Delete report for {report.teamName}?</p>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
              onClick={() => {
                onDeleteReport(report.id);
                toast.dismiss(t.id);
              }}
            >
              Delete
            </button>
            <button
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
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

  const columns = [
    {
      name: "Team",
      selector: (row) => row.teamName,
      sortable: true,
      width: "25%",
    },
    {
      name: "Date Created",
      selector: (row) => row.dateCreated,
      sortable: true,
      width: "25%",
      format: (row) => new Date(row.dateCreated).toLocaleDateString(),
    },
    {
      name: "# Pitchers",
      selector: (row) => row.numPitchers,
      sortable: true,
      width: "10%",
    },
    {
      name: "# Hitters",
      selector: (row) => row.numHitters,
      sortable: true,
      width: "10%",
    },
    {
      name: "Actions",
      width: "30%",
      cell: (row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReportSelect(row);
            }}
            className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
          >
            View Report
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleExportReport(row);
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
          >
            <FileDown size={12} />
            Export PDF
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteConfirmation(row);
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
    <div className="container mx-auto px-4 py-6">
      <InfoBanner dataType="scouting" />
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
          >
            <Plus size={14} />
            New Report
          </button>
        </div>

        <BaseballTable
          title=""
          data={reports}
          columns={columns}
          filename="scouting_reports.csv"
          noDataComponent={
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No reports created yet</p>
              <p className="text-gray-400 mt-2">
                Click "New Report" to get started
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default ReportsList;
