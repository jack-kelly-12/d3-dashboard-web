import React from "react";
import DataTable from "react-data-table-component";

const customStyles = {
  header: {
    style: {
      backgroundColor: "#ffffff",
      color: "#1e293b",
      padding: "16px 24px",
    },
  },
  headRow: {
    style: {
      backgroundColor: "#f8fafc",
      borderBottom: "2px solid #e2e8f0",
      minHeight: "48px",
    },
  },
  headCells: {
    style: {
      color: "#64748b",
      fontSize: "10px",
      "@media (min-width: 1024px)": {
        fontSize: "12px",
      },
      fontWeight: "600",
      letterSpacing: "0.05em",
      padding: "8px 5px",
      justifyContent: "center",
    },
    activeSortStyle: {
      color: "#3b82f6",
      "&:focus": {
        outline: "none",
      },
    },
  },
  cells: {
    style: {
      fontSize: "12px",
      "@media (min-width: 1024px)": {
        fontSize: "14px",
      },
      color: "#334155",
      padding: "10px 12px",
    },
  },
  rows: {
    style: {
      backgroundColor: "white",
      borderBottom: "1px solid #f1f5f9",
      minHeight: "48px",
      "&:nth-child(odd)": {
        backgroundColor: "#f8fafc",
      },
      "&:hover": {
        backgroundColor: "#f1f5f9",
        cursor: "pointer",
        transition: "all 0.2s ease",
      },
    },
  },
};

export const BaseballTable = ({
  title,
  data,
  columns,
  filename,
  searchComponent,
}) => {
  const stickyColumnKey = columns.some((col) => col.selector === "Player")
    ? "Player"
    : columns.some((col) => col.selector === "Team")
    ? "Team"
    : null;

  const formattedColumns = columns.map((column) => ({
    ...column,
    grow: column.selector === stickyColumnKey ? 0 : column.grow || 1,
    width:
      column.selector === stickyColumnKey ? "150px" : column.width || "auto",
    style: {
      ...column.style,
      position: column.selector === stickyColumnKey ? "sticky" : "unset",
      left: column.selector === stickyColumnKey ? 0 : "unset",
      zIndex: column.selector === stickyColumnKey ? 1 : "unset",
      backgroundColor:
        column.selector === stickyColumnKey ? "#ffffff" : "inherit",
    },
  }));

  return (
    <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
      {(title || searchComponent) && (
        <div className="px-6 sm:px-2 py-4 border-b border-gray-200">
          <div className="flex flex-wrap justify-between items-center gap-4">
            {title && (
              <h2 className="text-xs lg:text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {title}
              </h2>
            )}
            {searchComponent && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {searchComponent}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Apply custom scrollbar styles to the DataTable container */}
      <div className="custom-scrollbar">
        <DataTable
          columns={formattedColumns}
          data={data}
          customStyles={customStyles}
          pagination
          paginationPerPage={25}
          paginationRowsPerPageOptions={[25, 50, 100]}
          noDataComponent={
            <div className="py-12 text-center">
              <p className="text-gray-500 text-xs lg:text-sm">
                No records found
              </p>
            </div>
          }
          fixedHeader
          dense
        />
      </div>
    </div>
  );
};
