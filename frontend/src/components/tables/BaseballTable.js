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
      fontSize: "12px",
      fontWeight: "600",
      letterSpacing: "0.05em",
      padding: "16px 5px",
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
      fontSize: "14px",
      color: "#334155",
      padding: "12px 16px",
      flex: "0 0 auto",
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
  const formattedColumns = columns.map((column) => ({
    ...column,
    grow: 0,
    width: column.width || "auto", // Use specified width or auto
    sortable: column.sortable !== false, // Make sortable by default
    style: column.numeric ? { justifyContent: "flex-end" } : {},
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {(title || searchComponent) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            {title && (
              <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {title}
              </h2>
            )}
            {searchComponent && (
              <div className="flex items-center gap-4">{searchComponent}</div>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <DataTable
          columns={formattedColumns}
          data={data}
          customStyles={customStyles}
          pagination
          paginationPerPage={25}
          paginationRowsPerPageOptions={[25, 50, 100]}
          noDataComponent={
            <div className="py-12 text-center">
              <p className="text-gray-500 text-sm">No records found</p>
            </div>
          }
          fixedHeader
          dense
        />
      </div>
    </div>
  );
};
