import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

export const columnsRollingLeaderboard = [
  {
    name: "Player",
    selector: (row) => row.player_name,
    sortable: true,
    width: "20rem",
    cell: (row) => (
      <div className="flex items-center gap-2">
        {String(row.player_id).substring(0, 4) === "d3d-" ? (
          <a
            href={`/player/${row.player_id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            {row.player_name}
          </a>
        ) : (
          <span className="text-sm font-medium">{row.player_name}</span>
        )}
      </div>
    ),
  },
  {
    name: "Team",
    selector: (row) => row.team_name,
    sortable: true,
    width: "12rem",
    cell: (row) => (
      <span className="text-sm text-gray-700">{row.team_name}</span>
    ),
  },
  {
    name: "Conference",
    selector: (row) => row.conference,
    sortable: true,
    width: "10rem",
    cell: (row) => (
      <span className="text-sm text-gray-600">{row.conference}</span>
    ),
  },
  {
    name: "wOBA Then",
    selector: (row) => row.woba_then,
    sortable: true,
    width: "8rem",
    className: "text-center",
    cell: (row) => (
      <span className="text-sm font-mono">{row.woba_then}</span>
    ),
  },
  {
    name: "wOBA Now",
    selector: (row) => row.woba_now,
    sortable: true,
    width: "8rem",
    className: "text-center",
    cell: (row) => (
      <span className="text-sm font-mono">{row.woba_now}</span>
    ),
  },
  {
    name: "Change",
    selector: (row) => row.woba_change,
    sortable: true,
    width: "8rem",
    className: "text-center",
    cell: (row) => {
      const isPositive = row.woba_change > 0;
      const colorClass = isPositive ? "text-green-600" : "text-red-600";
      
      return (
        <div className={`flex items-center justify-center gap-1 ${colorClass}`}>
          <span className="text-sm font-mono">{row.woba_change}</span>
          {isPositive ? (
            <ArrowUp size={14} />
          ) : (
            <ArrowDown size={14} />
          )}
        </div>
      );
    },
  },
  {
    name: "PA",
    selector: (row) => row.pa,
    sortable: true,
    width: "6rem",
    className: "text-center",
    cell: (row) => (
      <span className="text-sm">{row.pa}</span>
    ),
  },
];
