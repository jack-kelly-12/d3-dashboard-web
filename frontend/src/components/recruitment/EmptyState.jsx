import React from "react";

const EmptyState = ({ onAddRecruit }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No recruits yet</h3>
      <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
        Build comprehensive recruit profiles with measurables, coach evaluations, and tracking data.
      </p>
      <button
        onClick={onAddRecruit}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
      >
        Add Your First Recruit
      </button>
    </div>
  );
};

export default EmptyState;

