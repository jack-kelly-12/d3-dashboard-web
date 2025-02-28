import React from "react";
import DataTable from "react-data-table-component";

const customStyles = {
  header: {
    style: {
      backgroundColor: "#ffffff",
      color: "#1e293b",
      padding: "1rem 1.5rem",
    },
  },
  headRow: {
    style: {
      backgroundColor: "#f8fafc",
      borderBottom: "2px solid #e2e8f0",
      minHeight: "3rem",
      position: "sticky",
      top: 0,
      zIndex: 2,
    },
  },
  headCells: {
    style: {
      color: "#64748b",
      fontSize: "0.625rem",
      "@media (min-width: 1024px)": {
        fontSize: "0.75rem",
      },
      fontWeight: "600",
      letterSpacing: "0.05em",
      padding: "0.5rem 0.3125rem",
      justifyContent: "flex-start",
      textAlign: "center",
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
      fontSize: "0.75rem",
      "@media (min-width: 1024px)": {
        fontSize: "0.875rem",
      },
      color: "#334155",
      padding: "0.625rem 0.75rem",
      justifyContent: "flex-start",
      textAlign: "left",
    },
  },
  rows: {
    style: {
      backgroundColor: "white",
      borderBottom: "1px solid #f1f5f9",
      minHeight: "3rem",
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
  // Function to convert rem to pixels based on base font size
  const remToPx = (rem) => {
    // Get the base font size from the document (default is 16px)
    const baseFontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );
    return parseFloat(rem) * baseFontSize;
  };

  const getStickyStyles = () => {
    const styles = {};
    let currentLeft = 0;

    stickyColumns.forEach((columnIndex) => {
      const columnWidthValue = columns[columnIndex].width || "9.375rem"; // default 150px as 9.375rem

      // Extract numeric value and unit
      const match = columnWidthValue.match(/^([\d.]+)(\w+)$/);
      if (!match) return;

      const [, value, unit] = match;
      let widthInPixels = parseFloat(value);

      // Convert rem to pixels if needed
      if (unit === "rem") {
        widthInPixels = remToPx(value);
      }

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

      currentLeft += widthInPixels;
    });

    styles[".rdt_TableHead"] = {
      position: "sticky",
      top: 0,
      zIndex: 2,
    };

    return styles;
  };

  // Create a useEffect to handle the initial calculation and window resize
  React.useEffect(() => {
    const handleResize = () => {
      // Force a re-render to recalculate sticky column positions
      setForceUpdate((prev) => !prev);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // State to force re-render on resize
  const [forceUpdate, setForceUpdate] = React.useState(false);

  const mergedStyles = React.useMemo(
    () => ({
      ...customStyles,
      tableWrapper: {
        style: getStickyStyles(),
      },
    }),
    [forceUpdate, stickyColumns, columns]
  );

  const formattedColumns = columns.map((column, index) => ({
    ...column,
    grow: stickyColumns.includes(index) ? 0 : column.grow || 1,
    width: stickyColumns.includes(index)
      ? column.width || "9.5rem"
      : column.width || "auto",
    style: {
      ...(column.style || {}),
      justifyContent: "flex-start",
      textAlign: "center",
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
