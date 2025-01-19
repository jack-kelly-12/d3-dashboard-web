import React from "react";
import { RotateCcw } from "lucide-react";

const SelectButton = ({ selected, onClick, disabled, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-sm rounded-md transition-all ${
      selected
        ? "bg-blue-600 text-white font-medium shadow-sm"
        : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    disabled={disabled}
  >
    {children}
  </button>
);

const VelocityInput = ({ value, onChange, disabled }) => {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (newValue === "") {
      onChange("");
      return;
    }

    const numValue = parseInt(newValue);
    if (!isNaN(numValue) && numValue >= 50 && numValue <= 100) {
      onChange(numValue);
    }
  };

  const handleSliderChange = (e) => {
    const newValue = parseInt(e.target.value);
    setInputValue(String(newValue));
    onChange(newValue);
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue);
    if (!inputValue || isNaN(numValue) || numValue < 50 || numValue > 100) {
      setInputValue(value ? String(value) : "");
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 block">
        Velocity (mph)
      </label>
      <div className="flex items-center gap-4">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="w-16 px-2 py-1.5 border border-gray-200 rounded-md text-center
            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
            text-sm font-medium"
          placeholder="-"
          disabled={disabled}
        />
        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm text-gray-500">50</span>
          <input
            type="range"
            min="50"
            max="100"
            value={value || 75}
            onChange={handleSliderChange}
            className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={disabled}
          />
          <span className="text-sm text-gray-500">100</span>
        </div>
      </div>
    </div>
  );
};

const formatOption = (option) => {
  if (typeof option === "number") return option;
  return option
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const PitchGrid = ({ options, selected, onChange, disabled, cols = 4 }) => (
  <div className={`grid grid-cols-${cols} gap-2`}>
    {options.map((option) => (
      <SelectButton
        key={option}
        selected={selected === option}
        onClick={() => onChange(option)}
        disabled={disabled}
      >
        {formatOption(option)}
      </SelectButton>
    ))}
  </div>
);

const PITCH_TYPES = [
  "fastball",
  "sinker",
  "slider",
  "curveball",
  "changeup",
  "splitter",
  "cutter",
  "knuckleball",
];

const PITCH_RESULTS = [
  "ball",
  "called_strike",
  "swinging_strike",
  "foul",
  "strikeout_looking",
  "strikeout_swinging",
  "in_play",
  "walk",
  "other",
];

const ZONES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14];

const PitchInput = ({
  currentPitch,
  onChange,
  onSubmit,
  onReset,
  disabled,
  isBullpen,
  isScripted,
  scriptedPitch,
}) => {
  const handleChange = (field, value) => {
    onChange({ ...currentPitch, [field]: value });
  };

  if (isScripted) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          {/* Current Target Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500">
                Pitch Type
              </div>
              <div className="text-lg font-semibold text-gray-900 mt-1">
                {scriptedPitch.type}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500">
                Target Zone
              </div>
              <div className="text-lg font-semibold text-gray-900 mt-1">
                {scriptedPitch.zone}
              </div>
            </div>
          </div>

          {/* Velocity Input */}
          <div>
            <label
              htmlFor="velocity"
              className="block text-sm font-medium text-gray-700"
            >
              Velocity
            </label>
            <div className="mt-1">
              <VelocityInput
                value={currentPitch.velocity}
                onChange={(value) => handleChange("velocity", value)}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Notes
            </label>
            <textarea
              value={currentPitch.note || ""}
              onChange={(e) => handleChange("note", e.target.value)}
              placeholder="Optional notes about the pitch..."
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm
            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
            resize-none"
              rows={2}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSubmit}
            disabled={
              disabled || !currentPitch.location || !currentPitch.velocity
            }
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md 
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Record Pitch
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md 
                     hover:bg-gray-200"
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  const handleReset = () => {
    onChange(
      isBullpen
        ? {
            velocity: null,
            type: "",
            intendedZone: null,
            location: null,
            note: "",
          }
        : {
            velocity: "",
            type: "",
            result: "",
            location: null,
            note: "",
          }
    );
    if (onReset) onReset();
  };

  const isFormEmpty =
    !currentPitch.velocity && !currentPitch.type && !currentPitch.location;

  const commonFields = (
    <>
      <VelocityInput
        value={currentPitch.velocity}
        onChange={(value) => handleChange("velocity", value)}
        disabled={disabled}
      />

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Pitch Type
        </label>
        <PitchGrid
          options={PITCH_TYPES}
          selected={currentPitch.type}
          onChange={(value) => handleChange("type", value)}
          disabled={disabled}
        />
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
            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
            resize-none"
          rows={2}
          disabled={disabled}
        />
      </div>
    </>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Pitch Details</h2>
        <button
          onClick={handleReset}
          disabled={disabled || isFormEmpty}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 
            rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      <div className="space-y-6">
        {isBullpen ? (
          <>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Intended Zone
              </label>
              <PitchGrid
                options={ZONES}
                selected={currentPitch.intendedZone}
                onChange={(value) => handleChange("intendedZone", value)}
                disabled={disabled}
              />
            </div>
            {commonFields}
          </>
        ) : (
          <>
            {commonFields}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Result
              </label>
              <PitchGrid
                options={PITCH_RESULTS}
                selected={currentPitch.result}
                onChange={(value) => handleChange("result", value)}
                disabled={disabled}
                cols={2}
              />
            </div>
          </>
        )}

        <div className="pt-2">
          <button
            onClick={onSubmit}
            disabled={
              disabled ||
              !currentPitch.type ||
              !currentPitch.location ||
              (!isBullpen && !currentPitch.result)
            }
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-md 
              hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 
              focus:ring-blue-500 focus:ring-offset-2 
              disabled:opacity-50 disabled:cursor-not-allowed 
              transition-all font-medium shadow-sm"
          >
            Add Pitch
          </button>
        </div>
      </div>
    </div>
  );
};

export default PitchInput;
