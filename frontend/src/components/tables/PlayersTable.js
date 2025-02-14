import React from "react";
import { Edit2, Trash2, GripVertical } from "lucide-react";
import { Droppable, Draggable } from "react-beautiful-dnd";

const PlayersTable = ({
  players,
  onEditPlayer,
  onDeletePlayer,
  isPitcherTable,
  droppableId,
}) => {
  const formatStats = (player) => {
    if (isPitcherTable) {
      const stats = player.keyStats;
      return (
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="grid grid-cols-6 gap-3">
            {[
              { label: "ERA", value: stats.era },
              { label: "FIP", value: stats.fip },
              { label: "K%", value: `${stats.k}%` },
              { label: "BB%", value: `${stats.bb}%` },
              { label: "IP", value: stats.ip },
              { label: "WAR", value: stats.war },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-sm font-medium text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const stats = player.keyStats;
    return (
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-6">
          <div>
            <div className="flex gap-1 items-center">
              <span className="text-sm font-medium text-gray-900">
                {stats.avg}
              </span>
              <span className="text-sm text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.obp}
              </span>
              <span className="text-sm text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.slg}
              </span>
            </div>
            <div className="text-xs text-gray-500">AVG/OBP/SLG</div>
          </div>

          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {stats.hr}
              </div>
              <div className="text-xs text-gray-500">HR</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {stats.sb}
              </div>
              <div className="text-xs text-gray-500">SB</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {stats.war}
              </div>
              <div className="text-xs text-gray-500">WAR</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center w-full bg-gray-50 border-b border-gray-200">
        <div className="w-8"></div>
        <div className="w-8 px-2 py-2 text-xs font-medium text-gray-500">#</div>
        <div className="w-36 px-3 py-2 text-xs font-medium text-gray-500">
          Name
        </div>
        <div className="w-24 px-3 py-2 text-xs font-medium text-gray-500">
          {isPitcherTable ? "Role" : "Pos"}
        </div>
        <div className="w-96 px-3 py-2 text-xs font-medium text-gray-500">
          Stats
        </div>
        <div className="w-48 px-3 py-2 text-xs font-medium text-gray-500">
          Write-up
        </div>
        <div className="w-20 px-3 py-2"></div>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="w-full"
          >
            {players.map((player, index) => (
              <Draggable
                key={player.id}
                draggableId={player.id.toString()}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`flex items-center w-full border-b border-gray-200 ${
                      snapshot.isDragging ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-8 px-2 py-2 flex items-center">
                      <div
                        {...provided.dragHandleProps}
                        className="cursor-grab hover:text-blue-600"
                      >
                        <GripVertical size={16} />
                      </div>
                    </div>
                    <div className="w-8 px-2 py-2">
                      <div className="text-sm text-gray-400">{index + 1}</div>
                    </div>
                    <div className="w-36 px-3 py-2">
                      <div className="text-sm font-medium text-gray-900">
                        {player.name}
                      </div>
                    </div>
                    <div className="w-24 px-3 py-2">
                      <div className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full text-center">
                        {isPitcherTable
                          ? player.role || "—"
                          : player.position || "—"}
                      </div>
                    </div>
                    <div className="w-96 px-3 py-2">{formatStats(player)}</div>
                    <div className="w-48 px-3 py-2">
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {player.writeup || "No write-up available"}
                      </div>
                    </div>
                    <div className="w-20 px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditPlayer(player)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit player"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => onDeletePlayer(player.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete player"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default PlayersTable;
