import { FileDown, Trash2, MoreVertical, Eye } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const ActionMenu = ({ row, onChartSelect, handleExport, onDeleteChart }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleClickOutside = useCallback(
    (e) => {
      if (isOpen) setIsOpen(false);
    },
    [isOpen]
  );

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  return (
    <div className="relative flex items-center justify-end">
      {/* Tablet/Desktop view - icon buttons only */}
      <div className="hidden sm:flex sm:flex-nowrap gap-1 whitespace-nowrap">
        {(row.source || "d3").toLowerCase() === "d3" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChartSelect(row);
            }}
            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
            title="View Chart"
          >
            <Eye size={16} />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleExport(row);
          }}
          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors"
          title="Export CSV"
        >
          <FileDown size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteChart(row.id);
          }}
          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Mobile view - dropdown menu */}
      <div className="sm:hidden">
        <button
          onClick={toggleMenu}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
          aria-label="Actions menu"
        >
          <MoreVertical size={16} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-md shadow-lg z-10 border border-gray-200">
            <div className="py-1">
              {(row.source || "d3").toLowerCase() === "d3" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChartSelect(row);
                    setIsOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50"
                >
                  <Eye size={14} />
                  View Chart
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExport(row);
                  setIsOpen(false);
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50"
              >
                <FileDown size={14} />
                Export CSV
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChart(row.id);
                  setIsOpen(false);
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionMenu;
