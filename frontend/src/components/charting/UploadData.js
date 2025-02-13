import React, { useState } from "react";
import { Upload, AlertCircle, FileText } from "lucide-react";
import { fetchAPI } from "../../config/api";

const DataUpload = ({ onUpload, chartType }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dataSource, setDataSource] = useState("trackman");
  const [description, setDescription] = useState("");
  const [stagedFile, setStagedFile] = useState(null);

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
        credentials: "include",
      });

      const chartData = {
        chartType: "bullpen",
        zoneType: "standard",
        date: new Date().toISOString(),
        pitches: data.pitches,
        source: dataSource,
        playerInfo: data.playerInfo,
        description:
          description.trim() ||
          `${
            dataSource.charAt(0).toUpperCase() + dataSource.slice(1)
          } Upload - ${new Date().toLocaleDateString()}`,
      };

      return chartData;
    } catch (err) {
      console.error("Upload error:", err);
      throw new Error(err.message || "Upload failed");
    }
  };

  const handleFile = (file) => {
    setError("");

    if (!file.name.match(/\.(csv|xlsx|xls)$/)) {
      setError("Please upload a CSV or Excel file");
      return;
    }

    setStagedFile(file);
  };

  const handleUploadClick = async () => {
    if (!stagedFile) return;

    setUploading(true);
    setError("");

    try {
      const chartData = await uploadFile(stagedFile);
      onUpload(chartData);
      setStagedFile(null); // Clear the staged file after successful upload
    } catch (err) {
      setError(err.message);
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
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

  const clearStagedFile = () => {
    setStagedFile(null);
    setError("");
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

      <textarea
        value={description}
        placeholder="Add a description (optional)"
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={1}
      />

      {!stagedFile ? (
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
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-500" />
              <div>
                <p className="font-medium">{stagedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(stagedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={clearStagedFile}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className={`
              mt-4 w-full py-2 px-4 rounded-lg font-medium
              ${
                uploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }
            `}
          >
            {uploading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Uploading...
              </div>
            ) : (
              "Upload File"
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center justify-center text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}
    </div>
  );
};

export default DataUpload;
