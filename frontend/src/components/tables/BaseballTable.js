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
      position: "sticky",
      top: 0,
      zIndex: 2,
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
  stickyColumns = [],
}) => {
  const getStickyStyles = () => {
    const styles = {};
    let currentLeft = 0;

    stickyColumns.forEach((columnIndex) => {
      const columnWidth = columns[columnIndex].width || "150px";
      styles[`.rdt_TableCol:nth-child(${columnIndex + 1})`] = {
        position: "sticky",
        left: `${currentLeft}px`,
        zIndex: 3,
        backgroundColor: "#f8fafc",
      };

      styles[`.rdt_TableCell:nth-child(${columnIndex + 1})`] = {
        position: "sticky",
        left: `${currentLeft}px`,
        zIndex: 1,
        backgroundColor: "inherit",
      };

      currentLeft += parseInt(columnWidth);
    });

    styles[".rdt_TableHead"] = {
      position: "sticky",
      top: 0,
      zIndex: 2,
    };

    return styles;
  };

  const mergedStyles = {
    ...customStyles,
    tableWrapper: {
      style: getStickyStyles(),
    },
  };

  const formattedColumns = columns.map((column, index) => ({
    ...column,
    grow: stickyColumns.includes(index) ? 0 : column.grow || 1,
    width: stickyColumns.includes(index)
      ? column.width || "150px"
      : column.width || "auto",
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

      <div className="overflow-auto">
        <DataTable
          columns={formattedColumns}
          data={data}
          customStyles={mergedStyles}
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
