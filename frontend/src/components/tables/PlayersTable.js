import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { BaseballTable } from "./BaseballTable";

const PlayersTable = ({
  players,
  onEditPlayer,
  onDeletePlayer,
  isPitcherTable,
}) => {
  const formatStats = (player) => {
    if (isPitcherTable) {
      const stats = player.keyStats;
      return (
        <div className="grid grid-cols-6 gap-3 px-2 h-full items-center">
          {[
            { label: "ERA", value: stats.era },
            { label: "FIP", value: stats.fip },
            { label: "K%", value: `${stats.k}%` },
            { label: "BB%", value: `${stats.bb}%` },
            { label: "IP", value: stats.ip },
            { label: "WAR", value: stats.war },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <span className="font-semibold text-gray-900">{value}</span>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      );
    }

    const stats = player.keyStats;
    return (
      <div className="grid grid-cols-4 gap-3 px-2 h-full items-center">
        {[
          {
            label: "AVG/OBP/SLG",
            value: `${stats.avg}/${stats.obp}/${stats.slg}`,
          },
          { label: "HR", value: stats.hr },
          { label: "SB", value: stats.sb },
          { label: "WAR", value: stats.war },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <span className="font-semibold text-gray-900">{value}</span>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>
    );
  };

  const getColumns = () => [
    {
      name: "#",
      cell: (row, index) => (
        <div className="text-gray-500 font-medium">{index + 1}</div>
      ),
      width: "5%",
    },
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
      width: "15%",
      cell: (row) => <div className="font-medium text-black">{row.name}</div>,
    },
    ...(isPitcherTable
      ? [
          {
            name: "Role",
            selector: (row) => row.role || "",
            sortable: true,
            width: "10%",
            cell: (row) => (
              <div className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-sm inline-block">
                {row.role || "—"}
              </div>
            ),
          },
        ]
      : [
          {
            name: "Position",
            selector: (row) => row.position,
            sortable: true,
            width: "10%",
            cell: (row) => (
              <div className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-sm inline-block">
                {row.position || "—"}
              </div>
            ),
          },
        ]),
    {
      name: "Key Stats",
      cell: formatStats,
      sortable: false,
      width: "35%",
    },
    {
      name: "Write-up",
      selector: (row) => row.writeup || "",
      sortable: false,
      width: "15%",
      cell: (row) => (
        <div className="text-sm text-gray-700 line-clamp-2">
          {row.writeup || "No write-up available"}
        </div>
      ),
    },
    {
      name: "Actions",
      width: "20%",
      cell: (row) => (
        <div className="flex gap-1">
          <button
            onClick={() => onEditPlayer(row)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded"
          >
            <Edit2 size={12} />
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDeletePlayer(row.id)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500 text-white rounded"
          >
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <BaseballTable
        data={players || []}
        columns={getColumns()}
        filename={`${isPitcherTable ? "pitchers" : "position_players"}.csv`}
        paginationPerPage={10}
      />
    </div>
  );
};

export default PlayersTable;
