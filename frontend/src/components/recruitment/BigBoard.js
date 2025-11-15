import React, { useMemo, useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { GripVertical } from "lucide-react";
import { Link } from "react-router-dom";
import RecruitManager from "../../managers/RecruitManager";
import toast from "react-hot-toast";

const POSITIONS = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH", "P", "Bench"];

const TAG_STYLES = {
  "offer-given": {
    row: "bg-green-50 border-green-100",
    pill: "bg-green-100 text-green-800",
    label: "Offer Given",
  },
  "potential-offer": {
    row: "bg-amber-50 border-amber-100",
    pill: "bg-amber-100 text-amber-800",
    label: "Potential Offer",
  },
  committed: {
    row: "bg-blue-50 border-blue-100",
    pill: "bg-blue-100 text-blue-800",
    label: "Committed",
  },
  "high-interest": {
    row: "bg-purple-50 border-purple-100",
    pill: "bg-purple-100 text-purple-800",
    label: "High Interest",
  },
  unscouted: {
    row: "bg-gray-50 border-gray-100",
    pill: "bg-gray-100 text-gray-800",
    label: "Unscouted",
  },
  unsure: {
    row: "bg-yellow-50 border-yellow-100",
    pill: "bg-yellow-100 text-yellow-800",
    label: "Unsure",
  },
  "not-interested": {
    row: "bg-red-50 border-red-100",
    pill: "bg-red-100 text-red-800",
    label: "Not Interested",
  },
  default: {
    row: "bg-gray-100 border-gray-200",
    pill: "bg-gray-100 text-gray-700",
    label: "",
  },
};

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

const BigBoard = ({ recruits, onRecruitsChange }) => {
  const [viewMode, setViewMode] = useState("byPosition"); // 'byPosition' | 'totalRank'
  const [assignments, setAssignments] = useState({});

  const recruitsById = useMemo(() => {
    const map = {};
    recruits.forEach((r) => {
      map[r.id] = r;
    });
    return map;
  }, [recruits]);

  useEffect(() => {
    if (!recruits || recruits.length === 0) {
      setAssignments({ pool: [] });
      return;
    }

    if (viewMode === "byPosition") {
      const initial = { pool: [] };
      POSITIONS.forEach((pos) => {
        initial[pos] = [];
      });

      recruits.forEach((recruit) => {
        const bucket =
          recruit.bigBoardBucket && POSITIONS.includes(recruit.bigBoardBucket)
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
    } else {
      const initial = { pool: [], total: [] };

      recruits.forEach((recruit) => {
        const rank = typeof recruit.totalRank === "number" ? recruit.totalRank : null;
        if (rank && rank > 0) {
          initial.total.push(recruit.id);
        } else {
          initial.pool.push(recruit.id);
        }
      });

      if (initial.total.length > 0) {
        initial.total.sort((a, b) => {
          const ra = recruitsById[a]?.totalRank ?? 0;
          const rb = recruitsById[b]?.totalRank ?? 0;
          return ra - rb;
        });
      }

      if (initial.pool.length > 0) {
        initial.pool.sort((a, b) => {
          const na = recruitsById[a]?.name || "";
          const nb = recruitsById[b]?.name || "";
          return na.localeCompare(nb);
        });
      }

      setAssignments(initial);
    }
  }, [recruits, recruitsById, viewMode]);

  const filteredPoolIds = useMemo(() => {
    return assignments.pool || [];
  }, [assignments]);

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

    if (viewMode === "byPosition") {
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
    } else {
      const rankInTotal =
        destId === "total"
          ? (nextAssignments.total || []).indexOf(movedId) + 1
          : null;

      onRecruitsChange((prev) =>
        prev.map((r) =>
          r.id === movedId
            ? { ...r, totalRank: rankInTotal }
            : r
        )
      );

      try {
        await RecruitManager.updateRecruit(movedId, {
          totalRank: rankInTotal,
        });
      } catch (err) {
        toast.error("Failed to update total rank");
      }
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
             <div className="space-y-0.5 max-h-36 overflow-y-auto w-full">
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

                 const primaryPosition = Array.isArray(r.positions) ? r.positions[0] : r.positions;
                 const tagStyle = TAG_STYLES[r.tag] || TAG_STYLES.default;
                 const isTransferLink = r.isTransferPortal && r.player_id;

                 return (
                   <Draggable key={rid} draggableId={rid} index={index}>
                     {(dragProvided) => (
                       <div
                         ref={dragProvided.innerRef}
                         {...dragProvided.draggableProps}
                         {...dragProvided.dragHandleProps}
                         className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 cursor-grab border hover:shadow-sm ${tagStyle.row}`}
                       >
                         <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-300 text-[10px] font-semibold text-gray-800 flex-shrink-0 mt-0.5">
                           {index + 1}
                         </span>
                         <div className="flex-1 min-w-0">
                           <div className="text-[11px] font-medium text-gray-900 leading-snug">
                             {isTransferLink ? (
                               <Link
                                 to={`/player/${encodeURIComponent(r.player_id)}`}
                                 className="text-blue-600 hover:text-blue-800"
                               >
                                 {r.name}
                               </Link>
                             ) : (
                               r.name
                             )}
                           </div>
                           <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-gray-600">
                             <span>{slotLabel}</span>
                             {primaryPosition && <span>• {primaryPosition}</span>}
                             {r.highSchool && <span>• {r.highSchool}</span>}
                             {r.graduationYear && <span>• {r.graduationYear}</span>}
                             {tagStyle.label && (
                               <span
                                 className={`ml-1 px-1.5 py-0.5 rounded-full font-medium ${tagStyle.pill}`}
                               >
                                 {tagStyle.label}
                               </span>
                             )}
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
       <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.7fr)] items-start">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 lg:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-gray-900">Player Pool</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Drag players into the depth chart or total board.
              </div>
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
                 {viewMode === "byPosition"
                   ? "Buckets for each position. Drag players into the appropriate spot."
                   : "Overall big board ranking. Drag to reorder your top recruits."}
               </div>
             </div>
             <div className="flex items-center gap-2">
               <span className="text-[11px] text-gray-500">View</span>
               <div className="inline-flex rounded-full bg-gray-100 p-0.5 text-[11px] font-medium">
                 <button
                   type="button"
                   onClick={() => setViewMode("byPosition")}
                   className={`px-2.5 py-1 rounded-full ${
                     viewMode === "byPosition"
                       ? "bg-white shadow-sm text-gray-900"
                       : "text-gray-500"
                   }`}
                 >
                   By Position
                 </button>
                 <button
                   type="button"
                   onClick={() => setViewMode("totalRank")}
                   className={`px-2.5 py-1 rounded-full ${
                     viewMode === "totalRank"
                       ? "bg-white shadow-sm text-gray-900"
                       : "text-gray-500"
                   }`}
                 >
                   Total Rank
                 </button>
               </div>
             </div>
           </div>

           {viewMode === "byPosition" ? (
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
           ) : (
             <div className="space-y-4">
               <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                 Overall Board
               </div>
               {renderPositionSlot("total", "Total Rank")}
             </div>
           )}
        </div>
      </div>
    </DragDropContext>
  );
};

export default BigBoard;

