import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";

const RadioGroup = ({ options, value, onChange, title, showSwitch = true }) => (
  <div>
    <label className="text-sm font-medium text-gray-700 mb-3 block">
      {title}
    </label>
    <div className="flex gap-3">
      {options.map((option) => (
        <label
          key={option.value}
          className={`
            relative flex items-center justify-center px-4 py-2.5 rounded-lg cursor-pointer
            transition-all duration-200 select-none min-w-[90px]
            ${
              value === option.value
                ? "bg-blue-50 border-2 border-blue-500 text-blue-700 font-medium shadow-sm"
                : "bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-200 hover:bg-blue-50"
            }
          `}
        >
          <input
            type="radio"
            className="sr-only"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="flex items-center gap-2">
            {option.icon}
            <span>{option.label}</span>
          </div>
          {value === option.value && (
            <div className="absolute -right-1 -top-1 w-3 h-3 bg-blue-500 rounded-full" />
          )}
        </label>
      ))}
    </div>
  </div>
);

const PlayerModal = ({ isOpen, onClose, onSubmit, type }) => {
  const [name, setName] = useState("");
  const [pitchHand, setPitchHand] = useState("right");
  const [batHand, setBatHand] = useState("right");

  const handleSubmit = () => {
    onSubmit({
      name,
      pitchHand: type === "pitcher" ? pitchHand : undefined,
      batHand: type === "batter" ? batHand : undefined,
    });
    setName("");
    setPitchHand("right");
    setBatHand("right");
    onClose();
  };

  const handOptions = [
    {
      value: "right",
      label: "Right",
      icon: (
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 16C3 14.9391 3.42143 13.9217 4.17157 13.1716C4.92172 12.4214 5.93913 12 7 12H17C18.0609 12 19.0783 12.4214 19.8284 13.1716C20.5786 13.9217 21 14.9391 21 16V20H3V16Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 8C13.6569 8 15 6.65685 15 5C15 3.34315 13.6569 2 12 2C10.3431 2 9 3.34315 9 5C9 6.65685 10.3431 8 12 8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      value: "left",
      label: "Left",
      icon: (
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 16C21 14.9391 20.5786 13.9217 19.8284 13.1716C19.0783 12.4214 18.0609 12 17 12H7C5.93913 12 4.92172 12.4214 4.17157 13.1716C3.42143 13.9217 3 14.9391 3 16V20H21V16Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 8C10.3431 8 9 6.65685 9 5C9 3.34315 10.3431 2 12 2C13.6569 2 15 3.34315 15 5C15 6.65685 13.6569 8 12 8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  const switchOption = {
    value: "switch",
    label: "Switch",
    icon: <ArrowLeftRight className="w-4 h-4" />,
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Select {type.charAt(0).toUpperCase() + type.slice(1)}
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Enter ${type} name...`}
              />
            </div>

            {type === "pitcher" && (
              <RadioGroup
                options={handOptions}
                value={pitchHand}
                onChange={setPitchHand}
                title="Throws"
              />
            )}

            {type === "batter" && (
              <RadioGroup
                options={[...handOptions, switchOption]}
                value={batHand}
                onChange={setBatHand}
                title="Bats"
                showSwitch
              />
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;
