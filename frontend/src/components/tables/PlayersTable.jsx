import React from "react";
import { Edit, Trash2, GripVertical } from "lucide-react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { useMediaQuery } from "react-responsive";
import { fetchAPI } from "../../config/api";

const PlayerStatsDisplay = ({ playerId, isPitcherTable }) => {
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const isMediumMediaQuery = useMediaQuery({ maxWidth: 768 });

  React.useEffect(() => {
    if (!playerId) {
      setStats(null);
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetchAPI(
          `/api/player/${playerId}?include_stats=true`
        );
        if (response) {
          setStats(response);
        }
      } catch (err) {
        console.error("Error fetching player stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [playerId]);

  if (loading) {
    return <div className="text-xs text-gray-400">Loading...</div>;
  }

  if (isPitcherTable && stats) {
    const pitchingStats = stats.pitching_stats?.[0] || {};
    return (
      <div className="flex items-center gap-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: "ERA", value: pitchingStats.era != null ? Number(pitchingStats.era).toFixed(2) : "—" },
            { label: "FIP", value: pitchingStats.fip != null ? Number(pitchingStats.fip).toFixed(2) : "—" },
            { label: "K%", value: `${(pitchingStats.k_pct ?? 0).toFixed(1)}%` },
            { label: "BB%", value: `${(pitchingStats.bb_pct ?? 0).toFixed(1)}%` },
            { label: "IP", value: (pitchingStats.ip ?? 0).toFixed(1) },
            { label: "WAR", value: (pitchingStats.war ?? 0).toFixed(1) },
          ].map(({ label, value }, index) => (
            <div
              key={label}
              className={`text-center ${
                isMediumMediaQuery && index > 2 ? "hidden md:block" : ""
              }`}
            >
              <div className="text-sm font-medium text-gray-900">
                {value || "—"}
              </div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stats) {
    const battingStats = stats.batting_stats?.[0] || {};
    return (
      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden sm:block">
          <div className="flex gap-1 items-center">
            <span className="text-sm font-medium text-gray-900">
              {battingStats.ba?.toFixed(3) || "—"}
            </span>
            <span className="text-sm text-gray-400">/</span>
            <span className="text-sm font-medium text-gray-900">
              {battingStats.ob_pct?.toFixed(3) || "—"}
            </span>
            <span className="text-sm text-gray-400">/</span>
            <span className="text-sm font-medium text-gray-900">
              {battingStats.slg_pct?.toFixed(3) || "—"}
            </span>
          </div>
          <div className="text-xs text-gray-500">AVG/OBP/SLG</div>
        </div>

        <div className="flex gap-2 md:gap-4">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900">
              {Number(battingStats.hr ?? 0)}
            </div>
            <div className="text-xs text-gray-500">HR</div>
          </div>
          <div className="text-center hidden md:block">
            <div className="text-sm font-medium text-gray-900">
              {Number(battingStats.sb ?? 0)}
            </div>
            <div className="text-xs text-gray-500">SB</div>
          </div>
          <div className="text-center hidden md:block">
            <div className="text-sm font-medium text-gray-900">
              {(battingStats.war ?? 0).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">WAR</div>
          </div>
        </div>
      </div>
    );
  }

  return <div className="text-xs text-gray-400">No stats</div>;
};

const PlayersTable = ({
  players,
  onEditPlayer,
  onDeletePlayer,
  isPitcherTable,
  droppableId,
  isSmallScreen,
  isXSmallScreen,
}) => {
  const isXSmallMediaQuery = useMediaQuery({ maxWidth: 480 });
  const isSmallMediaQuery = useMediaQuery({ maxWidth: 640 });
  const isMediumMediaQuery = useMediaQuery({ maxWidth: 768 });

  const _isXSmall = isXSmallScreen || isXSmallMediaQuery;
  const _isSmall = isSmallScreen || isSmallMediaQuery;
  const _isMedium = isMediumMediaQuery;

  if (!players || players.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 italic">
        No players added yet
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header - responsive based on screen size */}
      <div className="flex items-center w-full bg-gray-50 border-b border-gray-200">
        <div className="w-10"></div>
        {!_isXSmall && (
          <div className="w-8 px-2 py-2 text-xs font-medium text-gray-500 hidden sm:block">
            #
          </div>
        )}
        <div className="flex-1 px-3 py-2 text-xs font-medium text-gray-500">
          Name
        </div>
        <div className="w-20 px-3 py-2 text-xs font-medium text-gray-500">
          {isPitcherTable ? "Role" : "Pos"}
        </div>
        {!_isSmall && (
          <div className="px-3 py-2 text-xs font-medium text-gray-500 hidden sm:block flex-1">
            Stats
          </div>
        )}
        {!_isMedium && (
          <div className="w-48 px-3 py-2 text-xs font-medium text-gray-500 hidden md:block">
            Write-up
          </div>
        )}
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
                draggableId={String(player.id)}
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
                    <div className="w-10 px-2 py-3 flex items-center">
                      <div
                        {...provided.dragHandleProps}
                        className="cursor-grab hover:text-blue-600"
                      >
                        <GripVertical size={16} />
                      </div>
                    </div>
                    {!_isXSmall && (
                      <div className="w-8 px-2 py-3 hidden sm:block">
                        <div className="text-sm text-gray-400">{index + 1}</div>
                      </div>
                    )}
                    <div className="flex-1 px-3 py-3">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {player.name}
                      </div>
                    </div>
                    <div className="w-20 px-3 py-3">
                      <div className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full text-center truncate">
                        {isPitcherTable
                          ? player.role || "P"
                          : player.position || "—"}
                      </div>
                    </div>
                    {!_isSmall && (
                      <div className="px-3 py-3 hidden sm:block flex-1">
                        <PlayerStatsDisplay playerId={player.id} isPitcherTable={isPitcherTable} />
                      </div>
                    )}
                    {!_isMedium && (
                      <div className="w-48 px-3 py-3 hidden md:block">
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {player.writeup || "No write-up available"}
                        </div>
                      </div>
                    )}
                    <div className="w-20 px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditPlayer(player)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View player"
                        >
                          <Edit size={16} />
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
