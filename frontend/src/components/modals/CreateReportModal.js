import React, { useState } from "react";
import Modal from "./Modal";

const CreateReportModal = ({
  isOpen,
  onClose,
  onSubmit,
  availableTeams,
  isPremiumUser,
  selectedDivision,
  onDivisionChange,
}) => {
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [formError, setFormError] = useState("");
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  const handleSubmit = () => {
    if (!selectedTeam) {
      setFormError("Please select a team");
      return;
    }

    const reportData = {
      teamName: selectedTeam,
      division: selectedDivision,
      year: selectedYear,
    };

    onSubmit(reportData);
    setFormError("");
  };

  const handleDivisionChange = async (newDivision) => {
    setIsLoadingTeams(true);
    setSelectedTeam("");
    await onDivisionChange(Number(newDivision));
    setIsLoadingTeams(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Scouting Report">
      <div className="space-y-6">
        {isPremiumUser && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Division:
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoadingTeams}
            >
              <option value={1}>Division 1</option>
              <option value={2}>Division 2</option>
              <option value={3}>Division 3</option>
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Use 2024 or 2025 data?
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Team:
          </label>
          <select
            value={selectedTeam}
            onChange={(e) => {
              setSelectedTeam(e.target.value);
              setFormError("");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoadingTeams}
          >
            <option value="">Choose a team...</option>
            {availableTeams.map((team) => (
              <option key={team.team_name} value={team.team_name}>
                {team.team_name}
              </option>
            ))}
          </select>
          {isLoadingTeams && (
            <p className="mt-1 text-sm text-blue-600">Loading teams...</p>
          )}
          {formError && (
            <p className="mt-1 text-sm text-red-600">{formError}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedTeam || isLoadingTeams}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Report
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateReportModal;
