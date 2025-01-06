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
        <div className="grid grid-cols-6 gap-2 py-2">
          {[
            { label: "ERA", value: stats.era },
            { label: "FIP", value: stats.fip },
            { label: "K%", value: `${stats.k}%` },
            { label: "BB%", value: `${stats.bb}%` },
            { label: "IP", value: stats.ip },
            { label: "WAR", value: stats.war },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-sm font-semibold text-gray-900">{value}</div>
              <div className="text-xs font-medium text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      );
    }

    const stats = player.keyStats;
    return (
      <div className="flex items-center gap-8 py-2">
        <div className="flex-1">
          <div className="flex gap-1 justify-center">
            <span className="text-sm font-semibold text-gray-900">
              {stats.avg}
            </span>
            <span className="text-sm font-semibold text-gray-400">/</span>
            <span className="text-sm font-semibold text-gray-900">
              {stats.obp}
            </span>
            <span className="text-sm font-semibold text-gray-400">/</span>
            <span className="text-sm font-semibold text-gray-900">
              {stats.slg}
            </span>
          </div>
          <div className="text-xs font-medium text-gray-500 text-center mt-1">
            AVG/OBP/SLG
          </div>
        </div>

        <div className="flex gap-6">
          <div className="text-center w-12">
            <div className="text-sm font-semibold text-gray-900">
              {stats.hr}
            </div>
            <div className="text-xs font-medium text-gray-500">HR</div>
          </div>
          <div className="text-center w-12">
            <div className="text-sm font-semibold text-gray-900">
              {stats.sb}
            </div>
            <div className="text-xs font-medium text-gray-500">SB</div>
          </div>
          <div className="text-center w-12">
            <div className="text-sm font-semibold text-gray-900">
              {stats.war}
            </div>
            <div className="text-xs font-medium text-gray-500">WAR</div>
          </div>
        </div>
      </div>
    );
  };

  const getColumns = () => [
    {
      name: "#",
      cell: (row, index) => (
        <div className="text-sm font-medium text-gray-400 pl-4">
          {index + 1}
        </div>
      ),
      width: "60px",
    },
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
      width: "160px",
      cell: (row) => (
        <div className="text-sm font-semibold text-gray-900">{row.name}</div>
      ),
    },
    ...(isPitcherTable
      ? [
          {
            name: "Role",
            selector: (row) => row.role || "",
            sortable: true,
            width: "100px",
            cell: (row) => (
              <div className="inline-flex px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
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
            width: "100px",
            cell: (row) => (
              <div className="inline-flex px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                {row.position || "—"}
              </div>
            ),
          },
        ]),
    {
      name: "Key Stats",
      cell: formatStats,
      sortable: false,
      width: "440px",
    },
    {
      name: "Write-up",
      selector: (row) => row.writeup || "",
      sortable: false,
      width: "200px",
      cell: (row) => (
        <div className="text-sm text-gray-600 line-clamp-2 pr-4">
          {row.writeup || "No write-up available"}
        </div>
      ),
    },
    {
      name: "Actions",
      width: "200px",
      cell: (row) => (
        <div className="flex items-center gap-2 pr-4">
          <button
            onClick={() => onEditPlayer(row)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            <Edit2 size={12} />
            Edit
          </button>
          <button
            onClick={() => onDeletePlayer(row.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
          >
            <Trash2 size={12} />
            Delete
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
