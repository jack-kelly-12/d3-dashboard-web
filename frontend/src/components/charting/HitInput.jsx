import { RotateCcw } from "lucide-react";

const HitInput = ({ currentHit, onChange, onReset, disabled }) => {
  const hitTypes = [
    { value: "ground_ball", label: "Ground Ball" },
    { value: "fly_ball", label: "Fly Ball" },
    { value: "line_drive", label: "Line Drive" },
    { value: "popup", label: "Pop Up" },
    { value: "bunt", label: "Bunt" },
  ];

  const results = [
    { value: "single", label: "Single" },
    { value: "double", label: "Double" },
    { value: "triple", label: "Triple" },
    { value: "home_run", label: "Home Run" },
    { value: "double_play", label: "Double Play" },
    { value: "triple_play", label: "Triple Play" },
    { value: "fielders_choice", label: "Fielder's Choice" },
    { value: "error", label: "Error" },
    { value: "field_out", label: "Field Out" },
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
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          Hit Details
        </h2>
        <button
          onClick={onReset}
          disabled={disabled || isFormEmpty}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 text-xs sm:text-sm text-gray-600 bg-gray-100 
            rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Results */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Result
          </label>
          <div className="grid grid-cols-3 xs:grid-cols-2 gap-1 sm:gap-2">
            {results.map((result) => (
              <button
                key={result.value}
                onClick={() => handleChange("result", result.value)}
                disabled={disabled}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md transition-colors ${
                  currentHit.result === result.value
                    ? "bg-blue-600 text-white font-medium"
                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {result.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hit Types */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Hit Type
          </label>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-1 sm:gap-2">
            {hitTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleChange("type", type.value)}
                disabled={disabled}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md transition-colors ${
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
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Exit Velocity
          </label>
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {exitVelocityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleChange("exitVelocity", option.value)}
                disabled={disabled}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md transition-colors ${
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
