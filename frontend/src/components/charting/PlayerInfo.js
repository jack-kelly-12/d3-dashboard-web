import React from "react";
import { Edit2 } from "lucide-react";

const PlayerInfo = ({ pitcher, batter, onEditPitcher, onEditBatter }) => {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Pitcher</h3>
          <p className="text-lg font-semibold">{pitcher || "Not Selected"}</p>
        </div>
        <button
          onClick={onEditPitcher}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <Edit2 size={16} />
        </button>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Batter</h3>
          <p className="text-lg font-semibold">{batter || "Not Selected"}</p>
        </div>
        <button
          onClick={onEditBatter}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <Edit2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default PlayerInfo;
