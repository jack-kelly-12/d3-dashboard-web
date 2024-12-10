import React, { useState } from "react";
import Modal from "./Modal";

const ChartModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    chartType: "",
    homeTeam: "",
    awayTeam: "",
    source: "d3",
    lastUpdated: new Date().toISOString(),
    pitches: [],
  });

  const chartTypes = [
    { value: "game", label: "Game" },
    { value: "scrimmage", label: "Scrimmage" },
    { value: "bullpen", label: "Bullpen" },
  ];

  const handleSubmit = () => {
    if (
      !formData.chartType ||
      !formData.date ||
      (!formData.homeTeam && formData.chartType !== "bullpen") ||
      (!formData.awayTeam && formData.chartType !== "bullpen")
    )
      return;

    // Create a new date object with the current time
    const now = new Date();
    const dateWithTime = new Date(formData.date);
    dateWithTime.setHours(now.getHours());
    dateWithTime.setMinutes(now.getMinutes());
    dateWithTime.setSeconds(now.getSeconds());

    onSubmit({
      ...formData,
      date: dateWithTime.toISOString(),
      lastUpdated: now.toISOString(),
    });
  };

  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    // Keep date only, remove time component
    setFormData({
      ...formData,
      date: newDate.toISOString().split("T")[0],
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Chart">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={formData.chartType}
            onChange={(e) =>
              setFormData({ ...formData, chartType: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select type...</option>
            {chartTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={handleDateChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {formData.chartType !== "bullpen" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Home Team
              </label>
              <input
                type="text"
                value={formData.homeTeam}
                onChange={(e) =>
                  setFormData({ ...formData, homeTeam: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter home team..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Away Team
              </label>
              <input
                type="text"
                value={formData.awayTeam}
                onChange={(e) =>
                  setFormData({ ...formData, awayTeam: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter away team..."
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              !formData.chartType ||
              !formData.date ||
              (!formData.homeTeam && formData.chartType !== "bullpen") ||
              (!formData.awayTeam && formData.chartType !== "bullpen")
            }
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Create Chart
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ChartModal;
