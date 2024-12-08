import React from "react";
import { RotateCcw } from "lucide-react";

const VelocityInput = ({ value, onChange, disabled }) => {
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    if (newValue === "") {
      onChange("");
      return;
    }

    const numValue = parseInt(newValue);
    if (!isNaN(numValue) && numValue >= 50 && numValue <= 100) {
      onChange(numValue);
    }
  };

  return (
    <div className="relative">
      <label className="text-sm font-medium text-gray-700 mb-1 block">
        Velocity (mph)
      </label>
      <div className="flex gap-3 items-center">
        <input
          type="range"
          min="50"
          max="100"
          value={value || 80}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer 
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
            [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-600 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
          disabled={disabled}
        />
        <input
          type="text"
          value={value || ""}
          onChange={handleInputChange}
          className="w-16 px-2 py-1 border border-gray-200 rounded-md text-center
            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="80"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

const PitchInput = ({
  currentPitch,
  onChange,
  onSubmit,
  onReset,
  disabled,
  isBullpen,
}) => {
  const handleChange = (field, value) => {
    onChange({ ...currentPitch, [field]: value });
  };

  const handleReset = () => {
    if (isBullpen) {
      onChange({
        velocity: "",
        type: "",
        intendedZone: null,
        location: null,
        note: "",
      });
    } else {
      onChange({
        velocity: "",
        type: "",
        result: "",
        location: null,
        note: "",
      });
    }
    if (onReset) onReset();
  };

  const isFormEmpty =
    !currentPitch.velocity && !currentPitch.type && !currentPitch.location;

  const pitchTypes = [
    "fastball",
    "sinker",
    "slider",
    "curveball",
    "changeup",
    "splitter",
    "cutter",
  ];

  if (isBullpen) {
    const zones = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14];

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Pitch Details</h2>
          <button
            onClick={handleReset}
            disabled={disabled || isFormEmpty}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 
              rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Intended Zone
            </label>
            <div className="grid grid-cols-4 gap-2">
              {zones.map((zone) => (
                <button
                  key={zone}
                  onClick={() => handleChange("intendedZone", zone)}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    currentPitch.intendedZone === zone
                      ? "bg-blue-600 text-white font-medium"
                      : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}
                  disabled={disabled}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>

          <VelocityInput
            value={currentPitch.velocity}
            onChange={(value) => handleChange("velocity", value)}
            disabled={false}
          />

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Pitch Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {pitchTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleChange("type", type)}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    currentPitch.type === type
                      ? "bg-blue-600 text-white font-medium"
                      : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}
                  disabled={disabled}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Notes
            </label>
            <textarea
              value={currentPitch.note || ""}
              onChange={(e) => handleChange("note", e.target.value)}
              placeholder="Optional notes about the pitch..."
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm
                focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              disabled={disabled}
            />
          </div>

          <div className="pt-2">
            <button
              onClick={onSubmit}
              disabled={
                disabled || !currentPitch.type || !currentPitch.location
              }
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-md 
                hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 
                focus:ring-blue-500 focus:ring-offset-2 
                disabled:opacity-50 disabled:cursor-not-allowed 
                transition-colors font-medium"
            >
              Add Pitch
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Pitch Details</h2>
        <button
          onClick={handleReset}
          disabled={disabled || isFormEmpty}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 
            rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      <div className="space-y-4">
        <VelocityInput
          value={currentPitch.velocity}
          onChange={(value) => handleChange("velocity", value)}
          disabled={disabled}
        />

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Pitch Type
          </label>
          <div className="grid grid-cols-4 gap-2">
            {pitchTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleChange("type", type)}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  currentPitch.type === type
                    ? "bg-blue-600 text-white font-medium"
                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
                disabled={disabled}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Result
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              "ball",
              "called_strike",
              "swinging_strike",
              "foul",
              "strikeout_looking",
              "strikeout_swinging",
              "in_play",
              "walk",
              "other",
            ].map((result) => (
              <button
                key={result}
                onClick={() => handleChange("result", result)}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  currentPitch.result === result
                    ? "bg-blue-600 text-white font-medium"
                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
                disabled={disabled}
              >
                {result
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Notes
          </label>
          <textarea
            value={currentPitch.note || ""}
            onChange={(e) => handleChange("note", e.target.value)}
            placeholder="Optional notes about the pitch..."
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm
              focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            disabled={disabled}
          />
        </div>

        <div className="pt-2">
          <button
            onClick={onSubmit}
            disabled={
              disabled ||
              !currentPitch.type ||
              !currentPitch.result ||
              !currentPitch.location
            }
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-md 
              hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 
              focus:ring-blue-500 focus:ring-offset-2 
              disabled:opacity-50 disabled:cursor-not-allowed 
              transition-colors font-medium"
          >
            Add Pitch
          </button>
        </div>
      </div>
    </div>
  );
};

export default PitchInput;
