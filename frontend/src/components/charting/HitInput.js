import React from "react";
import { RotateCcw } from "lucide-react";

const HitInput = ({ currentHit, onChange, onReset, disabled }) => {
  const hitTypes = [
    { value: "single", label: "Single" },
    { value: "double", label: "Double" },
    { value: "triple", label: "Triple" },
    { value: "home_run", label: "Home Run" },
    { value: "groundout", label: "Ground Out" },
    { value: "flyout", label: "Fly Out" },
    { value: "lineout", label: "Line Out" },
    { value: "popout", label: "Pop Out" },
    { value: "error", label: "Error" },
    { value: "bunt", label: "Bunt" },
  ];

  const exitVelocityOptions = [
    { value: "soft", label: "Soft" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ];

  const handleChange = (field, value) => {
    onChange({ ...currentHit, [field]: value });
  };

  const isFormEmpty =
    !currentHit.location &&
    !currentHit.type &&
    !currentHit.result &&
    !currentHit.exitVelocity;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Hit Details</h2>
        <button
          onClick={onReset}
          disabled={disabled || isFormEmpty}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 
            rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Hit Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hit Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {hitTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleChange("type", type.value)}
                disabled={disabled}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  currentHit.type === type.value
                    ? "bg-blue-600 text-white font-medium"
                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exit Velocity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exit Velocity
          </label>
          <div className="grid grid-cols-3 gap-2">
            {exitVelocityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleChange("exitVelocity", option.value)}
                disabled={disabled}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  currentHit.exitVelocity === option.value
                    ? "bg-blue-600 text-white font-medium"
                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HitInput;
