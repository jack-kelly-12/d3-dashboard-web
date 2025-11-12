import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { fetchAPI } from "../../config/api";
import {
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  FileBox,
} from "lucide-react";

const TeamLogo = memo(({ teamId, teamName }) => (
  <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
    <img
      src={teamId ? `https://d3-dashboard-kellyjc.s3.us-east-2.amazonaws.com/images/${teamId}.png` : `https://d3-dashboard-kellyjc.s3.us-east-2.amazonaws.com/images/0.png`}
      alt={teamName}
      className="w-full h-full object-cover"
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = `https://d3-dashboard-kellyjc.s3.us-east-2.amazonaws.com/images/0.png`;
      }}
    />
  </div>
));

TeamLogo.displayName = 'TeamLogo';

const LeaderboardSection = memo(({
  window,
  rawData,
  searchTerm,
  conference,
  selectedListId,
  selectedListPlayerIds,
  expandedWindows,
  playerType,
  toggleWindow,
  getDeltaColor,
  filterDataWithPlayerList,
}) => {
  const s = (searchTerm || "").toLowerCase();
  const selectedConference = conference || "";
  const isExpanded = expandedWindows[window];
  const [visibleCount, setVisibleCount] = useState(50);
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  
  const filteredData = useMemo(() => {
    const base = Array.isArray(rawData) ? rawData : [];
    let filtered = base.filter((player) => {
      const searchMatch =
        s === "" ||
        player.player_name?.toLowerCase().includes(s) ||
        (player.team_name && player.team_name.toLowerCase().includes(s));
      const conferenceMatch = selectedConference === "" || player.conference === selectedConference;
      return searchMatch && conferenceMatch;
    });
    
    return filterDataWithPlayerList(filtered);
  }, [rawData, s, selectedConference, filterDataWithPlayerList]);

  const displayData = useMemo(() => {
    if (isExpanded) {
      return filteredData
        .slice()
        .sort((a, b) => {
          if (playerType === "pitcher") {
            return (a.woba_change ?? 0) - (b.woba_change ?? 0);
          } else {
            return (b.woba_change ?? 0) - (a.woba_change ?? 0);
          }
        });
    } else {
      const improving =
        playerType === "pitcher"
          ? filteredData
              .filter((p) => (p.woba_change ?? 0) < 0)
              .sort((a, b) => (a.woba_change ?? 0) - (b.woba_change ?? 0))
              .slice(0, 5)
          : filteredData
              .filter((p) => (p.woba_change ?? 0) > 0)
              .sort((a, b) => (b.woba_change ?? 0) - (a.woba_change ?? 0))
              .slice(0, 5);

      const declining =
        playerType === "pitcher"
          ? filteredData
              .filter((p) => (p.woba_change ?? 0) > 0)
              .sort((a, b) => (b.woba_change ?? 0) - (a.woba_change ?? 0))
              .slice(0, 5)
          : filteredData
              .filter((p) => (p.woba_change ?? 0) < 0)
              .sort((a, b) => (a.woba_change ?? 0) - (b.woba_change ?? 0))
              .slice(0, 5);

      return { improving, declining };
    }
  }, [isExpanded, filteredData, playerType]);

  useEffect(() => {
    setVisibleCount(isExpanded ? 50 : 10);
  }, [isExpanded, s, selectedConference, selectedListId, selectedListPlayerIds, window, playerType]);

  useEffect(() => {
    const container = containerRef.current;
    const sentinel = sentinelRef.current;
    if (!container || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((c) => c + 50);
          }
        });
      },
      { root: container, threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [containerRef, sentinelRef]);

  if (filteredData.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">
            {window} {playerType === "pitcher" ? "BF" : "PA"} wOBA
          </h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-600 mb-4">No data found for the current filters.</p>
          {selectedListId && (
            <div className="mt-4 flex flex-col items-center">
              <FileBox size={32} className="text-blue-500 mb-2" />
              <p className="text-gray-500 text-sm">
                {selectedListPlayerIds.length === 0
                  ? "The selected player list is empty."
                  : "None of the players in the selected list match the current criteria."}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-600 tracking-wide uppercase">
          {window} {playerType === "pitcher" ? "BF" : "PA"} wOBA
        </h3>
        <div className="flex items-center gap-2">
          {selectedListId && (
            <span className="text-xs text-blue-600">
              {filteredData.length}/{rawData.length} players
            </span>
          )}
          <button
            onClick={() => toggleWindow(window)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center"
          >
            {isExpanded ? (
              <>
                Show Top 5 <ChevronUp size={14} className="ml-1" />
              </>
            ) : (
              <>
                Show All <ChevronDown size={14} className="ml-1" />
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-12 gap-2 text-xs font-medium bg-white text-gray-500 mb-3">
          <div className="col-span-6">PLAYER</div>
          <div className="text-center col-span-2">THEN</div>
          <div className="text-center col-span-2">NOW</div>
          <div className="text-center col-span-2">Δ</div>
        </div>

        {isExpanded ? (
          <div className="max-h-96 overflow-y-auto" ref={containerRef}>
            {displayData.slice(0, visibleCount).map((player, idx) => (
              <div
                key={`${window}-${player.player_id}-${idx}`}
                className="grid grid-cols-12 items-center py-2"
              >
                <div className="flex items-center gap-2 col-span-6">
                  <TeamLogo teamId={player.team_org_id} teamName={player.team_name} />
                  {String(player.player_id).substring(0, 4) === "d3d-" ? (
                    <a
                      href={`/player/${player.player_id}`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline truncate"
                    >
                      {player.player_name}
                    </a>
                  ) : (
                    <span className="text-xs font-medium truncate">{player.player_name}</span>
                  )}
                </div>
                <div className="text-center text-xs col-span-2">{player.woba_then}</div>
                <div className="text-center text-xs col-span-2">{player.woba_now}</div>
                <div className={`text-center text-xs flex items-center justify-center col-span-2 ${getDeltaColor(player)}`}>
                  {player.woba_change}
                  {player.woba_change > 0 ? (
                    <ArrowUp size={14} className="ml-1" />
                  ) : (
                    <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </div>
            ))}
            <div ref={sentinelRef} />
          </div>
        ) : (
          <>
            {displayData.improving.map((player, idx) => (
              <div key={`${window}-up-${idx}`} className="grid grid-cols-12 items-center py-2">
                <div className="flex items-center gap-2 col-span-6">
                  <TeamLogo teamId={player.team_org_id} teamName={player.team_name} />
                  {String(player.player_id).substring(0, 4) === "d3d-" ? (
                    <a href={`/player/${player.player_id}`} className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline truncate">
                      {player.player_name}
                    </a>
                  ) : (
                    <span className="text-xs font-medium truncate">{player.player_name}</span>
                  )}
                </div>
                <div className="text-center text-xs col-span-2">{player.woba_then}</div>
                <div className="text-center text-xs col-span-2">{player.woba_now}</div>
                <div className="text-center text-xs text-green-600 flex items-center justify-center col-span-2">
                  {player.woba_change}
                  {playerType === "pitcher" ? <ArrowDown size={14} className="ml-1" /> : <ArrowUp size={14} className="ml-1" />}
                </div>
              </div>
            ))}
            <div className="border-t border-gray-200 my-4"></div>
            {displayData.declining.map((player, idx) => (
              <div key={`${window}-down-${idx}`} className="grid grid-cols-12 items-center py-2">
                <div className="flex items-center gap-2 col-span-6">
                  <TeamLogo teamId={player.team_org_id} teamName={player.team_name} />
                  {String(player.player_id).substring(0, 4) === "d3d-" ? (
                    <a href={`/player/${player.player_id}`} className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline truncate">
                      {player.player_name}
                    </a>
                  ) : (
                    <span className="text-xs font-medium truncate">{player.player_name}</span>
                  )}
                </div>
                <div className="text-center text-xs col-span-2">{player.woba_then}</div>
                <div className="text-center text-xs col-span-2">{player.woba_now}</div>
                <div className="text-center text-xs text-red-600 flex items-center justify-center col-span-2">
                  {player.woba_change}
                  {playerType === "pitcher" ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
});

LeaderboardSection.displayName = 'LeaderboardSection';

const RollingLeaderboard = ({
  division,
  conference,
  searchTerm,
  selectedListId,
  selectedListPlayerIds,
  isLoadingPlayerList,
  playerType = "batter",
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({});
  const [error, setError] = useState(null);
  const [expandedWindows, setExpandedWindows] = useState({});

  const windowSizes = useMemo(() => [25, 50, 100], []);

  const fetchData = useCallback(async () => {
    if (isLoadingPlayerList) return;

    setIsLoading(true);
    setError(null);

    try {
      const responses = await Promise.all(
        windowSizes.map((window) =>
          fetchAPI(
            `/api/leaderboards/rolling?division=${division}&window=${window}&player_type=${playerType}`
          )
        )
      );

      const combinedData = {};
      windowSizes.forEach((window, idx) => {
        combinedData[window] = Array.isArray(responses[idx]) ? responses[idx] : (responses[idx]?.items || []);
      });

      setData(combinedData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [division, playerType, isLoadingPlayerList, windowSizes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setExpandedWindows({});
  }, [playerType]);

  const toggleWindow = useCallback((window) => {
    setExpandedWindows((prev) => ({
      ...prev,
      [window]: !prev[window],
    }));
  }, []);

  const filterDataWithPlayerList = useCallback((dataArray) => {
    if (
      !selectedListId ||
      !selectedListPlayerIds ||
      selectedListPlayerIds.length === 0
    ) {
      return dataArray;
    }

    return dataArray.filter((player) => {
      const playerId = player.player_id || player.Player_ID;
      if (!playerId) return false;

      return selectedListPlayerIds.some(
        (id) =>
          id === playerId.toString() ||
          id === playerId ||
          (playerId.toString().includes("d3d-") &&
            id === playerId.toString().replace("d3d-", ""))
      );
    });
  }, [selectedListId, selectedListPlayerIds]);

  const getDeltaColor = useCallback((player) => {
    if (playerType === "pitcher") {
      return (player.woba_change ?? 0) < 0 ? "text-green-600" : "text-red-600";
    } else {
      return (player.woba_change ?? 0) > 0 ? "text-green-600" : "text-red-600";
    }
  }, [playerType]);

  if (isLoading || isLoadingPlayerList) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-0">
        <div className="flex items-center justify-end">
          {selectedListId && selectedListPlayerIds && (
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-md text-xs lg:text-sm text-blue-700">
              Player list filter active
            </div>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {windowSizes.map((window) => (
          <LeaderboardSection
            key={window}
            window={window}
            rawData={data[window]}
            searchTerm={searchTerm}
            conference={conference}
            selectedListId={selectedListId}
            selectedListPlayerIds={selectedListPlayerIds}
            expandedWindows={expandedWindows}
            playerType={playerType}
            toggleWindow={toggleWindow}
            getDeltaColor={getDeltaColor}
            filterDataWithPlayerList={filterDataWithPlayerList}
          />
        ))}
      </div>
    </div>
  );
};

export default RollingLeaderboard;
