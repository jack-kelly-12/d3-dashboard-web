import React, { useState } from "react";
import { Upload, AlertCircle, FileText } from "lucide-react";
import { fetchAPI } from "../../config/api";

const DataUpload = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dataSource, setDataSource] = useState("trackman");
  const [chartType, setChartType] = useState("bullpen");
  const [zoneType, setZoneType] = useState("standard");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
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
      let url = `/upload/${dataSource}`;
      if (dataSource === "d3") {
        url += `?chartType=${chartType}&zoneType=${zoneType}`;
      }

      const data = await fetchAPI(url, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      let finalDescription;
      if (dataSource === "d3" && chartType === "game") {
        if (!awayTeam || !homeTeam) {
          throw new Error("Please enter both team names");
        }
        finalDescription = `${awayTeam} @ ${homeTeam}`;
      } else {
        finalDescription =
          description.trim() ||
          `${dataSource.charAt(0).toUpperCase() + dataSource.slice(1)} ${
            chartType.charAt(0).toUpperCase() + chartType.slice(1)
          } - ${new Date().toLocaleDateString()}`;
      }

      const chartData = {
        chartType: dataSource === "d3" ? chartType : "bullpen",
        zoneType:
          dataSource === "d3" && chartType === "bullpen"
            ? zoneType
            : "standard",
        date: new Date().toISOString(),
        pitches: data.pitches,
        source: dataSource,
        playerInfo: data.playerInfo,
        description: finalDescription,
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

    if (
      dataSource === "d3" &&
      chartType === "game" &&
      (!awayTeam || !homeTeam)
    ) {
      setError("Please enter both team names");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const chartData = await uploadFile(stagedFile);
      onUpload(chartData);
      setStagedFile(null);
      setAwayTeam("");
      setHomeTeam("");
      setDescription("");
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
      {/* Data Source Selection */}
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
        <button
          onClick={() => setDataSource("d3")}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${
              dataSource === "d3"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
        >
          D3
        </button>
      </div>

      {/* Chart Type Selection (only for D3) */}
      {dataSource === "d3" && (
        <div className="flex justify-center gap-4 text-sm">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setChartType("bullpen")}
              className={`px-3 py-1.5 transition-all duration-200
                ${
                  chartType === "bullpen"
                    ? "bg-gray-100 text-gray-900"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
            >
              Bullpen
            </button>
            <button
              onClick={() => setChartType("game")}
              className={`px-3 py-1.5 transition-all duration-200 border-l border-gray-200
                ${
                  chartType === "game"
                    ? "bg-gray-100 text-gray-900"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
            >
              Game
            </button>
          </div>
        </div>
      )}

      {/* Zone Type Selection (only for D3 Bullpen) */}
      {dataSource === "d3" && chartType === "bullpen" && (
        <div className="flex justify-center items-center gap-2 text-sm text-gray-600">
          <span className="text-gray-400">Zone Type:</span>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setZoneType("standard")}
              className={`px-3 py-1 transition-all duration-200
                ${
                  zoneType === "standard"
                    ? "bg-gray-100 text-gray-900"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
            >
              Standard
            </button>
            <button
              onClick={() => setZoneType("detailed")}
              className={`px-3 py-1 transition-all duration-200 border-l border-gray-200
                ${
                  zoneType === "detailed"
                    ? "bg-gray-100 text-gray-900"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
            >
              RH 7 Zone
            </button>
          </div>
        </div>
      )}

      {/* Description Input - Team inputs for game charts, regular description for others */}
      {dataSource === "d3" && chartType === "game" ? (
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Away Team
            </label>
            <input
              type="text"
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              placeholder="Enter away team"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center h-full pt-6">
            <span className="text-gray-400">@</span>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Home Team
            </label>
            <input
              type="text"
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              placeholder="Enter home team"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      ) : (
        <textarea
          value={description}
          placeholder="Add a description (optional)"
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={1}
        />
      )}

      {/* File Upload Area */}
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
            {dataSource === "trackman"
              ? "Trackman"
              : dataSource === "rapsodo"
              ? "Rapsodo"
              : "D3"}{" "}
            data
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

      {/* Error Display */}
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
