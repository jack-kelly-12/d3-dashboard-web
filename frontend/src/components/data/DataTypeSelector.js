import React from "react";

const DataTypeSelector = ({ dataType, setDataType }) => {
  const dataTypes = [
    { id: "player_hitting", label: "Player Hitting" },
    { id: "player_pitching", label: "Player Pitching" },
    { id: "team_hitting", label: "Team Hitting" },
    { id: "team_pitching", label: "Team Pitching" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {dataTypes.map((type) => (
        <button
          key={type.id}
          onClick={() => setDataType(type.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${
              dataType === type.id
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-blue-50 border border-gray-200"
            }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
};

export default DataTypeSelector;
