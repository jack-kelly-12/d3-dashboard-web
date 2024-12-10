import React, { useState } from "react";
import { Upload, AlertCircle } from "lucide-react";
import { fetchAPI } from "../../config/api";

const DataUpload = ({ onUpload, chartType }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dataSource, setDataSource] = useState("trackman");

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await fetchAPI(`/upload/${dataSource}`, {
        method: "POST",
        body: formData,
      });

      return {
        chartType: chartType || "bullpen",
        date: new Date().toISOString(),
        pitches: data.pitches,
        source: dataSource,
        playerInfo: data.playerInfo,
      };
    } catch (err) {
      console.error("Upload error:", err);
      throw new Error(err.message || "Upload failed");
    }
  };

  const handleFile = async (file) => {
    setUploading(true);
    setError("");

    try {
      if (!file.name.match(/\.(csv|xlsx|xls)$/)) {
        throw new Error("Please upload a CSV or Excel file");
      }

      const chartData = await uploadFile(file);
      onUpload(chartData);
    } catch (err) {
      setError(err.message);
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setDataSource("trackman")}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${
              dataSource === "trackman"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
        >
          Trackman
        </button>
        <button
          onClick={() => setDataSource("rapsodo")}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${
              dataSource === "rapsodo"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
        >
          Rapsodo
        </button>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center
          ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}
          transition-colors duration-200
        `}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <Upload className="mx-auto h-12 w-12 text-gray-400" />

        <p className="mt-4 text-sm text-gray-600">
          Drag and drop or click to upload{" "}
          {dataSource === "trackman" ? "Trackman" : "Rapsodo"} data
        </p>

        <p className="mt-2 text-xs text-gray-500">
          Supports CSV and Excel files
        </p>

        {uploading && (
          <div className="mt-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center justify-center text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataUpload;
