import { CSVLink } from "react-csv";

export const ExportButton = ({ data, filename }) => (
  <div className="inline-block">
    <CSVLink
      data={data}
      filename={filename}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
    >
      Export to CSV
    </CSVLink>
  </div>
);
