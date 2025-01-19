import { Trash2 } from "lucide-react";

const PitchTable = ({
  pitches,
  onDeletePitch,
  isBullpen = false,
  showIntendedPitch = false,
}) => {
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

  if (isBullpen || showIntendedPitch) {
    return (
      <div className="relative overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-3">Time</th>
              <th className="px-3 py-3">Pitcher</th>
              {showIntendedPitch && (
                <>
                  <th className="px-3 py-3">Intended Type</th>
                  <th className="px-3 py-3">Intended Zone</th>
                </>
              )}
              <th className="px-3 py-3">Pitch Type</th>
              <th className="px-3 py-3">Velo</th>
              <th className="px-3 py-3">Pitch X</th>
              <th className="px-3 py-3">Pitch Z</th>
              <th className="px-3 py-3">Notes</th>
              <th className="px-3 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {pitches.length === 0 ? (
              <tr>
                <td
                  colSpan={showIntendedPitch ? 9 : 7}
                  className="text-center py-8 text-gray-500"
                >
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
                    <td className="px-3 py-2.5 text-gray-600">
                      {formatDate(pitch.timestamp)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">
                      {pitch.pitcher.name}
                    </td>
                    {showIntendedPitch && (
                      <>
                        <td className="px-3 py-2.5 font-medium capitalize">
                          {pitch.scriptDetails?.intendedType || "—"}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-center">
                          {pitch.scriptDetails?.intendedZone || "—"}
                        </td>
                      </>
                    )}
                    <td className="px-3 py-2.5 font-medium capitalize">
                      {pitch.type || "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      {pitch.velocity ? (
                        <span className="font-mono">{pitch.velocity}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono">{coords.x}</td>
                    <td className="px-3 py-2.5 font-mono">{coords.y}</td>
                    <td className="px-3 py-2.5 text-gray-600">
                      {pitch.note || "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => onDeletePitch?.(pitch.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete pitch"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

  if (isBullpen) {
    return (
      <div className="relative overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-3">Time</th>
              <th className="px-3 py-3">Pitcher</th>
              <th className="px-3 py-3">Pitch Type</th>
              <th className="px-3 py-3">Velo</th>
              <th className="px-3 py-3">Intended Zone</th>
              <th className="px-3 py-3">Pitch X</th>
              <th className="px-3 py-3">Pitch Z</th>
              <th className="px-3 py-3">Notes</th>
              <th className="px-3 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {pitches.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
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
                    <td className="px-3 py-2.5 text-gray-600">
                      {formatDate(pitch.timestamp)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">
                      {pitch.pitcher.name}
                    </td>
                    <td className="px-3 py-2.5 font-medium capitalize">
                      {pitch.type || "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      {pitch.velocity ? (
                        <span className="font-mono">{pitch.velocity}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-center">
                      {pitch.intendedZone || "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono">{coords.x}</td>
                    <td className="px-3 py-2.5 font-mono">{coords.y}</td>

                    <td className="px-3 py-2.5 text-gray-600">
                      {pitch.note || "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => onDeletePitch?.(pitch.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete pitch"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-gray-50 text-gray-500">
          <tr>
            <th className="px-3 py-3">Time</th>
            <th className="px-3 py-3">Pitcher</th>
            <th className="px-3 py-3">Batter</th>
            <th className="px-3 py-3">B. Side</th>
            <th className="px-3 py-3">P. Hand</th>
            <th className="px-3 py-3">Pitch Type</th>
            <th className="px-3 py-3">Velo</th>
            <th className="px-3 py-3">Result</th>
            <th className="px-3 py-3">Pitch X</th>
            <th className="px-3 py-3">Pitch Z</th>
            <th className="px-7 py-3">Hit Result</th>
            <th className="px-3 py-3">Hit X</th>
            <th className="px-3 py-3">Hit Z</th>
            <th className="px-3 py-3">Notes</th>
            <th className="px-3 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {pitches.length === 0 ? (
            <tr>
              <td colSpan={18} className="text-center py-8 text-gray-500">
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
                  <td className="px-3 py-2.5 text-gray-600">
                    {formatDate(pitch.timestamp)}
                  </td>
                  <td className="px-3 py-2.5 font-medium">
                    {pitch.pitcher?.name || "—"}
                  </td>
                  <td className="px-3 py-2.5 font-medium">
                    {pitch.batter?.name || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 capitalize">
                    {pitch.batter?.batHand || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 capitalize">
                    {pitch.pitcher?.pitchHand || "—"}
                  </td>
                  <td className="px-3 py-2.5 font-medium capitalize">
                    {pitch.type || "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    {pitch.velocity ? (
                      <span className="font-mono">{pitch.velocity}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="capitalize">
                      {pitch.result?.replace(/_/g, " ") || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono">{pitchCoords.x}</td>
                  <td className="px-3 py-2.5 font-mono">{pitchCoords.y}</td>
                  <td className="px-3 py-2.5">
                    {pitch.hitDetails
                      ? pitch.hitDetails?.type?.replace(/_/g, " ")
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 font-mono">{hitCoords.x}</td>
                  <td className="px-3 py-2.5 font-mono">{hitCoords.y}</td>
                  <td className="px-3 py-2.5">{pitch.note || "—"}</td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => onDeletePitch?.(pitch.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete pitch"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PitchTable;
