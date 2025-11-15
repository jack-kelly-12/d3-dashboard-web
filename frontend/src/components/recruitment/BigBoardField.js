import React, { useMemo, useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { GripVertical, Filter } from "lucide-react";
import RecruitManager from "../../managers/RecruitManager";
import toast from "react-hot-toast";

const POSITIONS = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH", "P", "Bench"];

const StrictModeDroppable = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => cancelAnimationFrame(animation);
  }, []);

  if (!enabled) {
    return null;
  }

  return <Droppable {...props}>{children}</Droppable>;
};

const BigBoardField = ({ recruits, onRecruitsChange }) => {
  const [positionFilter, setPositionFilter] = useState("ALL");
  const [assignments, setAssignments] = useState({});

  const recruitsById = useMemo(() => {
    const map = {};
    recruits.forEach((r) => {
      map[r.id] = r;
    });
    return map;
  }, [recruits]);

  useEffect(() => {
    const initial = { pool: [] };
    POSITIONS.forEach((pos) => {
      initial[pos] = [];
    });

    recruits.forEach((recruit) => {
      const bucket = recruit.bigBoardBucket && POSITIONS.includes(recruit.bigBoardBucket)
        ? recruit.bigBoardBucket
        : "pool";
      initial[bucket].push(recruit.id);
    });

    POSITIONS.forEach((pos) => {
      initial[pos].sort((a, b) => {
        const ra = recruitsById[a]?.bigBoardRank ?? 0;
        const rb = recruitsById[b]?.bigBoardRank ?? 0;
        return ra - rb;
      });
    });

    if (initial.pool.length > 0) {
      initial.pool.sort((a, b) => {
        const na = recruitsById[a]?.name || "";
        const nb = recruitsById[b]?.name || "";
        return na.localeCompare(nb);
      });
    }

    setAssignments(initial);
  }, [recruits, recruitsById]);

  const filteredPoolIds = useMemo(() => {
    const ids = assignments.pool || [];
    if (positionFilter === "ALL") return ids;
    return ids.filter((id) => {
      const rec = recruitsById[id];
      if (!rec) return false;
      const primary = Array.isArray(rec.positions) ? rec.positions[0] : rec.positions;
      if (!primary) return false;
      return primary === positionFilter;
    });
  }, [assignments, positionFilter, recruitsById]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const sourceId = result.source.droppableId;
    const destId = result.destination.droppableId;

    if (!assignments[sourceId] || !assignments[destId]) return;

    const sourceIds = Array.from(assignments[sourceId]);
    const destIds = sourceId === destId ? sourceIds : Array.from(assignments[destId]);

    const [movedId] = sourceIds.splice(result.source.index, 1);
    destIds.splice(result.destination.index, 0, movedId);

    const nextAssignments = { ...assignments };
    nextAssignments[sourceId] = sourceIds;
    nextAssignments[destId] = destIds;

    if (sourceId === "pool" || destId === "pool") {
      nextAssignments.pool = nextAssignments.pool.filter((id) => id !== movedId);
      if (destId === "pool") {
        nextAssignments.pool.splice(result.destination.index, 0, movedId);
      }
    }

    setAssignments(nextAssignments);

    const bucket = destId === "pool" ? null : destId;
    const rankInBucket = bucket
      ? nextAssignments[bucket].indexOf(movedId) + 1
      : null;

    onRecruitsChange((prev) =>
      prev.map((r) =>
        r.id === movedId
          ? { ...r, bigBoardBucket: bucket, bigBoardRank: rankInBucket }
          : r
      )
    );

    try {
      await RecruitManager.updateRecruit(movedId, {
        bigBoardBucket: bucket,
        bigBoardRank: rankInBucket,
      });
    } catch (err) {
      toast.error("Failed to update big board");
    }
  };

  const renderPositionSlot = (id, label, extra = "") => {
    const ids = assignments[id] || [];

    return (
      <StrictModeDroppable droppableId={id} key={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col items-stretch text-left ${extra} transition-colors w-full ${
              snapshot.isDraggingOver ? "bg-blue-50 border-blue-400" : "bg-white"
            } border border-gray-200 rounded-lg px-3 py-2`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                {label}
              </div>
              <div className="text-[10px] text-gray-400">
                {ids.length} {ids.length === 1 ? "player" : "players"}
              </div>
            </div>
            <div className="space-y-0.5 max-h-32 overflow-y-auto w-full">
              {ids.map((rid, index) => {
                const r = recruitsById[rid];
                if (!r) return null;

                const slotLabel =
                  index === 0
                    ? "Starter"
                    : index === 1
                    ? "First backup"
                    : index === 2
                    ? "Second backup"
                    : `Depth ${index + 1}`;

                return (
                  <Draggable key={rid} draggableId={rid} index={index}>
                    {(dragProvided) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className="bg-gray-100 text-[11px] text-gray-800 rounded px-2 py-1 cursor-grab flex items-center gap-2"
                      >
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-300 text-[10px] font-semibold text-gray-800 flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{r.name}</div>
                          <div className="text-[10px] text-gray-500 truncate">
                            {slotLabel}
                            {" • "}
                            {[
                              Array.isArray(r.positions) ? r.positions[0] : r.positions,
                              r.highSchool,
                              r.graduationYear,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          </div>
        )}
      </StrictModeDroppable>
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.45fr)] items-start">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 lg:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-gray-900">Player Pool</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Drag players onto the field to build your depth chart.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="border border-gray-300 rounded-lg text-xs px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Positions</option>
                {["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH", "P"].map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <StrictModeDroppable droppableId="pool">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`border border-dashed rounded-lg p-3 max-h-[420px] overflow-y-auto transition-colors ${
                  snapshot.isDraggingOver ? "border-blue-400 bg-blue-50/60" : "border-gray-300 bg-gray-50"
                }`}
              >
                {filteredPoolIds.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-6">
                    No players available for this filter.
                  </div>
                ) : (
                  filteredPoolIds.map((id, index) => {
                    const r = recruitsById[id];
                    if (!r) return null;
                    const primary = Array.isArray(r.positions) ? r.positions[0] : r.positions;
                    return (
                      <Draggable key={id} draggableId={id} index={index}>
                        {(dragProvided, snapshotItem) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={`flex items-center justify-between bg-white rounded-lg border px-3 py-1.5 mb-1.5 text-xs cursor-grab transition-shadow ${
                              snapshotItem.isDragging ? "shadow-md border-blue-400" : "border-gray-200 hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <GripVertical className="w-3 h-3 text-gray-400" />
                              <div className="truncate text-gray-900">{r.name}</div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {primary && (
                                <span className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-700">
                                  {primary}
                                </span>
                              )}
                              {r.graduationYear && (
                                <span className="text-[10px] text-gray-400">{r.graduationYear}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })
                )}
                {provided.placeholder}
              </div>
            )}
          </StrictModeDroppable>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 lg:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-gray-900">Depth Chart</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Buckets for each position. Drag players into the appropriate spot.
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Outfield
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {renderPositionSlot("LF", "LF")}
                {renderPositionSlot("CF", "CF")}
                {renderPositionSlot("RF", "RF")}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Infield
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {renderPositionSlot("3B", "3B")}
                {renderPositionSlot("SS", "SS")}
                {renderPositionSlot("2B", "2B")}
                {renderPositionSlot("1B", "1B")}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Battery
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderPositionSlot("P", "P")}
                {renderPositionSlot("C", "C")}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Other
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderPositionSlot("DH", "DH")}
                {renderPositionSlot("Bench", "Bench")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};

export default BigBoardField;

