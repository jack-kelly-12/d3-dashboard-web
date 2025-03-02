import { Trash2 } from "lucide-react";
import React, { useState, useMemo } from "react";
import { BaseballTable } from "./BaseballTable";

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

  const VelocityCell = ({ row }) =>
    editingVelocity === row.id ? (
      <input
        type="number"
        value={velocityValue}
        onChange={(e) => setVelocityValue(e.target.value)}
        onBlur={() => handleVelocityUpdate(row.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleVelocityUpdate(row.id);
          if (e.key === "Escape") setEditingVelocity(null);
        }}
        className="w-16 px-1 py-0.5 border rounded"
        autoFocus
      />
    ) : (
      <span
        className="font-mono cursor-pointer hover:text-blue-600"
        onClick={() => handleVelocityEdit(row)}
      >
        {row.velocity || "—"}
      </span>
    );

  // Create action cell component
  const ActionCell = ({ row }) => (
    <button
      onClick={() => onDeletePitch?.(row.id)}
      className="text-gray-400 hover:text-red-500 transition-colors"
      title="Delete pitch"
    >
      <Trash2 size={16} />
    </button>
  );

  const bullpenColumns = useMemo(
    () => [
      {
        name: "Time",
        selector: (row) => formatDate(row.timestamp),
        sortable: true,
        width: "9rem",
      },
      {
        name: "Pitcher",
        selector: (row) => row.pitcher?.name || "—",
        sortable: true,
        width: "9rem",
      },
      {
        name: "Pitch Type",
        selector: (row) => row.type || "—",
        sortable: true,
        format: (row) => <span className="capitalize">{row.type || "—"}</span>,
        width: "7rem",
      },
      {
        name: "Velo",
        cell: (row) => <VelocityCell row={row} />,
        sortable: true,
        width: "5rem",
      },
      {
        name: "Intended Zone",
        selector: (row) => row.intendedZone || "—",
        sortable: true,
        width: "7rem",
        center: true,
      },
      {
        name: "Pitch X",
        selector: (row) => formatCoords(row.x, row.y).x,
        sortable: true,
        width: "5rem",
        cell: (row) => (
          <span className="font-mono">{formatCoords(row.x, row.y).x}</span>
        ),
      },
      {
        name: "Pitch Z",
        selector: (row) => formatCoords(row.x, row.y).y,
        sortable: true,
        width: "5rem",
        cell: (row) => (
          <span className="font-mono">{formatCoords(row.x, row.y).y}</span>
        ),
      },
      {
        name: "Notes",
        selector: (row) => row.note || "—",
        sortable: true,
        grow: 1,
        width: "12rem",
      },
      {
        name: "",
        cell: (row) => <ActionCell row={row} />,
        width: "3rem",
        button: true,
      },
    ],
    []
  );

  const gameColumns = useMemo(
    () => [
      {
        name: "Time",
        selector: (row) => formatDate(row.timestamp),
        sortable: true,
        width: "9rem",
      },
      {
        name: "Pitcher",
        selector: (row) => row.pitcher?.name || "—",
        sortable: true,
        width: "9rem",
      },
      {
        name: "Batter",
        selector: (row) => row.batter?.name || "—",
        sortable: true,
        width: "9rem",
      },
      {
        name: "B. Side",
        selector: (row) => row.batter?.batHand || "—",
        format: (row) => (
          <span className="capitalize">{row.batter?.batHand || "—"}</span>
        ),
        sortable: true,
        width: "5rem",
      },
      {
        name: "P. Hand",
        selector: (row) => row.pitcher?.pitchHand || "—",
        format: (row) => (
          <span className="capitalize">{row.pitcher?.pitchHand || "—"}</span>
        ),
        sortable: true,
        width: "5rem",
      },
      {
        name: "Pitch Type",
        selector: (row) => row.type || "—",
        format: (row) => <span className="capitalize">{row.type || "—"}</span>,
        sortable: true,
        width: "7rem",
      },
      {
        name: "Velo",
        cell: (row) => <VelocityCell row={row} />,
        sortable: true,
        width: "5rem",
      },
      {
        name: "Result",
        selector: (row) => row.result || "—",
        format: (row) => (
          <span className="capitalize">
            {row.result?.replace(/_/g, " ") || "—"}
          </span>
        ),
        sortable: true,
        width: "7rem",
      },
      {
        name: "Pitch X",
        selector: (row) => formatCoords(row.x, row.y).x,
        sortable: true,
        width: "5rem",
        cell: (row) => (
          <span className="font-mono">{formatCoords(row.x, row.y).x}</span>
        ),
      },
      {
        name: "Pitch Z",
        selector: (row) => formatCoords(row.x, row.y).y,
        sortable: true,
        width: "5rem",
        cell: (row) => (
          <span className="font-mono">{formatCoords(row.x, row.y).y}</span>
        ),
      },
      {
        name: "Hit Result",
        selector: (row) => row.hitDetails?.type || "—",
        format: (row) => (
          <span>
            {row.hitDetails ? row.hitDetails?.type?.replace(/_/g, " ") : "—"}
          </span>
        ),
        sortable: true,
        width: "7rem",
      },
      {
        name: "Hit X",
        selector: (row) =>
          row.hitDetails?.x
            ? formatCoords(row.hitDetails?.x, row.hitDetails?.y).x
            : "—",
        sortable: true,
        width: "5rem",
        cell: (row) => (
          <span className="font-mono">
            {formatCoords(row.hitDetails?.x, row.hitDetails?.y).x}
          </span>
        ),
      },
      {
        name: "Hit Z",
        selector: (row) =>
          row.hitDetails?.y
            ? formatCoords(row.hitDetails?.x, row.hitDetails?.y).y
            : "—",
        sortable: true,
        width: "5rem",
        cell: (row) => (
          <span className="font-mono">
            {formatCoords(row.hitDetails?.x, row.hitDetails?.y).y}
          </span>
        ),
      },
      {
        name: "Notes",
        selector: (row) => row.note || "—",
        sortable: true,
        grow: 1,
        width: "12rem",
      },
      {
        name: "",
        cell: (row) => <ActionCell row={row} />,
        width: "3rem",
        button: true,
      },
    ],
    []
  );

  return (
    <BaseballTable
      data={pitches}
      columns={isBullpen ? bullpenColumns : gameColumns}
      stickyColumns={[]}
    />
  );
};

export default PitchTable;
