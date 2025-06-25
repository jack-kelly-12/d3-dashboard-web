import React from 'react';
import { Download } from 'lucide-react';

/**
 * Subtle export button component for exporting table data to CSV
 * @param {Object} props
 * @param {Array} props.data - The data to export
 * @param {string} props.filename - The filename for the exported file
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Whether the button is disabled
 */
const ExportButton = ({ data, filename, className = "", disabled = false }) => {
  const exportToCSV = () => {
    if (!data || data.length === 0) return;

    // Get the first row to determine headers
    const firstRow = data[0];
    const headers = Object.keys(firstRow).filter(key => {
      // Skip React elements and complex objects
      const value = firstRow[key];
      return typeof value !== 'object' || value === null || 
             (typeof value === 'object' && !React.isValidElement(value));
    });

    // Create CSV content
    const csvContent = [
      // Headers
      headers.join(','),
      // Data rows
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle null/undefined values
          if (value === null || value === undefined) return '';
          // Handle strings that might contain commas
          if (typeof value === 'string') {
            return `"${value.replace(/"/g, '""')}"`;
          }
          // Handle numbers and other types
          return String(value);
        }).join(',')
      )
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || 'export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isDisabled = disabled || !data || data.length === 0;

  return (
    <button
      onClick={exportToCSV}
      disabled={isDisabled}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium
        text-gray-600 bg-white border border-gray-200 rounded-md
        hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        transition-all duration-150
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      title={isDisabled ? 'No data to export' : 'Export to CSV'}
    >
      <Download size={14} />
      <span className="hidden sm:inline">Export</span>
    </button>
  );
};

export default ExportButton;
