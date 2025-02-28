import { Trash2 } from "lucide-react";
import React, { useState } from "react";

const PitchTable = ({
  pitches,
  onDeletePitch,
  onUpdatePitch,
  isBullpen = false,
}) => {
  const [editingVelocity, setEditingVelocity] = useState(null);
  const [velocityValue, setVelocityValue] = useState("");

  const handleVelocityEdit = (pitch) => {
    setEditingVelocity(pitch.id);
    setVelocityValue(pitch.velocity || "");
  };

  const handleVelocityUpdate = (pitchId) => {
    const velocity = parseFloat(velocityValue);
    if (!isNaN(velocity)) {
      onUpdatePitch?.(pitchId, { velocity });
    }
    setEditingVelocity(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatCoords = (x, y) => {
    if (!x || !y) return { x: "—", y: "—" };
    return {
      x: x.toFixed(1),
      y: y.toFixed(1),
    };
  };

  // Table component for bullpen mode
  if (isBullpen) {
    return (
      <div className="w-full overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full w-max text-xs sm:text-sm text-left border-collapse">
            <thead className="text-xs uppercase bg-gray-50 text-gray-500">
              <tr>
                <th className="px-2 py-2 whitespace-nowrap">Time</th>
                <th className="px-2 py-2 whitespace-nowrap">Pitcher</th>
                <th className="px-2 py-2 whitespace-nowrap">Type</th>
                <th className="px-2 py-2 whitespace-nowrap">Velo</th>
                <th className="px-2 py-2 whitespace-nowrap">Zone</th>
                <th className="px-2 py-2 whitespace-nowrap">X</th>
                <th className="px-2 py-2 whitespace-nowrap">Z</th>
                <th className="px-2 py-2 whitespace-nowrap">Notes</th>
                <th className="px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {pitches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-gray-500">
                    No pitches recorded yet
                  </td>
                </tr>
              ) : (
                pitches.map((pitch) => {
                  const coords = formatCoords(pitch.x, pitch.y);
                  return (
                    <tr
                      key={pitch.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-2 py-1.5 text-gray-600 whitespace-nowrap">
                        {formatDate(pitch.timestamp)}
                      </td>
                      <td className="px-2 py-1.5 text-gray-600 whitespace-nowrap">
                        {pitch.pitcher.name}
                      </td>
                      <td className="px-2 py-1.5 font-medium capitalize whitespace-nowrap">
                        {pitch.type || "—"}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {editingVelocity === pitch.id ? (
                          <input
                            type="number"
                            value={velocityValue}
                            onChange={(e) => setVelocityValue(e.target.value)}
                            onBlur={() => handleVelocityUpdate(pitch.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleVelocityUpdate(pitch.id);
                              if (e.key === "Escape") setEditingVelocity(null);
                            }}
                            className="w-12 px-1 py-0.5 border rounded"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="font-mono cursor-pointer hover:text-blue-600"
                            onClick={() => handleVelocityEdit(pitch)}
                          >
                            {pitch.velocity || "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 font-medium text-center whitespace-nowrap">
                        {pitch.intendedZone || "—"}
                      </td>
                      <td className="px-2 py-1.5 font-mono whitespace-nowrap">
                        {coords.x}
                      </td>
                      <td className="px-2 py-1.5 font-mono whitespace-nowrap">
                        {coords.y}
                      </td>
                      <td className="px-2 py-1.5 text-gray-600 max-w-[6rem] truncate">
                        {pitch.note || "—"}
                      </td>
                      <td className="px-2 py-1.5">
                        <button
                          onClick={() => onDeletePitch?.(pitch.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete pitch"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Table component for game mode
  return (
    <div className="w-full">
      <div
        className="overflow-x-auto"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <table className="min-w-full w-max text-xs sm:text-sm text-left border-collapse">
          <thead className="text-xs uppercase bg-gray-50 text-gray-500">
            <tr>
              <th className="px-2 py-2 whitespace-nowrap">Time</th>
              <th className="px-2 py-2 whitespace-nowrap">Pitcher</th>
              <th className="px-2 py-2 whitespace-nowrap">Batter</th>
              <th className="px-2 py-2 whitespace-nowrap">B.Side</th>
              <th className="px-2 py-2 whitespace-nowrap">P.Hand</th>
              <th className="px-2 py-2 whitespace-nowrap">Type</th>
              <th className="px-2 py-2 whitespace-nowrap">Velo</th>
              <th className="px-2 py-2 whitespace-nowrap">Result</th>
              <th className="px-2 py-2 whitespace-nowrap">X</th>
              <th className="px-2 py-2 whitespace-nowrap">Z</th>
              <th className="px-2 py-2 whitespace-nowrap">Hit</th>
              <th className="px-2 py-2 whitespace-nowrap">Hit X</th>
              <th className="px-2 py-2 whitespace-nowrap">Hit Z</th>
              <th className="px-2 py-2 whitespace-nowrap">Notes</th>
              <th className="px-2 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {pitches.length === 0 ? (
              <tr>
                <td colSpan={15} className="text-center py-4 text-gray-500">
                  No pitches recorded yet
                </td>
              </tr>
            ) : (
              pitches.map((pitch) => {
                const pitchCoords = formatCoords(pitch.x, pitch.y);
                const hitCoords = formatCoords(
                  pitch.hitDetails?.x,
                  pitch.hitDetails?.y
                );

                return (
                  <tr
                    key={pitch.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-2 py-1.5 text-gray-600 whitespace-nowrap">
                      {formatDate(pitch.timestamp)}
                    </td>
                    <td className="px-2 py-1.5 font-medium whitespace-nowrap">
                      {pitch.pitcher?.name || "—"}
                    </td>
                    <td className="px-2 py-1.5 font-medium whitespace-nowrap">
                      {pitch.batter?.name || "—"}
                    </td>
                    <td className="px-2 py-1.5 text-gray-600 capitalize whitespace-nowrap">
                      {pitch.batter?.batHand || "—"}
                    </td>
                    <td className="px-2 py-1.5 text-gray-600 capitalize whitespace-nowrap">
                      {pitch.pitcher?.pitchHand || "—"}
                    </td>
                    <td className="px-2 py-1.5 font-medium capitalize whitespace-nowrap">
                      {pitch.type || "—"}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      {editingVelocity === pitch.id ? (
                        <input
                          type="number"
                          value={velocityValue}
                          onChange={(e) => setVelocityValue(e.target.value)}
                          onBlur={() => handleVelocityUpdate(pitch.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleVelocityUpdate(pitch.id);
                            if (e.key === "Escape") setEditingVelocity(null);
                          }}
                          className="w-12 px-1 py-0.5 border rounded"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="font-mono cursor-pointer hover:text-blue-600"
                          onClick={() => handleVelocityEdit(pitch)}
                        >
                          {pitch.velocity || "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="capitalize">
                        {pitch.result?.replace(/_/g, " ") || "—"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 font-mono whitespace-nowrap">
                      {pitchCoords.x}
                    </td>
                    <td className="px-2 py-1.5 font-mono whitespace-nowrap">
                      {pitchCoords.y}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap max-w-[6rem] truncate">
                      {pitch.hitDetails
                        ? pitch.hitDetails?.type?.replace(/_/g, " ")
                        : "—"}
                    </td>
                    <td className="px-2 py-1.5 font-mono whitespace-nowrap">
                      {hitCoords.x}
                    </td>
                    <td className="px-2 py-1.5 font-mono whitespace-nowrap">
                      {hitCoords.y}
                    </td>
                    <td className="px-2 py-1.5 max-w-[6rem] truncate">
                      {pitch.note || "—"}
                    </td>
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() => onDeletePitch?.(pitch.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete pitch"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PitchTable;
