import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import DataUpload from "../charting/UploadData";

const UploadModal = ({ isOpen, onClose, onUpload }) => {
  if (!isOpen) return null;

  const handleUpload = (data) => {
    const processedData = {
      ...data,
      source: data.source?.toLowerCase() || "d3",
    };

    onUpload(processedData);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Upload Data</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Supported Data Sources
            </h3>
            <div className="flex gap-2">
              {["d3", "rapsodo", "trackman"].map((source) => (
                <div
                  key={source}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor:
                      source === "d3"
                        ? "#EFF6FF"
                        : source === "rapsodo"
                        ? "#F0FDF4"
                        : "#FAF5FF",
                    color:
                      source === "d3"
                        ? "#1D4ED8"
                        : source === "rapsodo"
                        ? "#15803D"
                        : "#7E22CE",
                    borderColor:
                      source === "d3"
                        ? "#BFDBFE"
                        : source === "rapsodo"
                        ? "#BBF7D0"
                        : "#F3E8FF",
                  }}
                >
                  {source.charAt(0).toUpperCase() + source.slice(1)}
                </div>
              ))}
            </div>
          </div>

          <DataUpload onUpload={handleUpload} />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default UploadModal;
