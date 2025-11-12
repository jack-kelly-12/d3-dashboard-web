import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { getTopPlayersByVisits } from "../../services/dataService";
import { fetchAPI } from "../../config/api";

const SkeletonRow = () => (
  <tr className="border-b border-gray-100">
    <td className="px-4 py-1.5">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
    </td>
    <td className="px-4 py-1.5">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-24 animate-pulse" />
          <div className="h-2 bg-gray-100 rounded w-20 animate-pulse" />
        </div>
      </div>
    </td>
    <td className="px-4 py-1.5 text-right">
      <div className="h-5 bg-gradient-to-r from-blue-100 to-blue-50 rounded-full w-10 ml-auto animate-pulse" />
    </td>
  </tr>
);

const TrendingPlayers = ({ compact = false, limit }) => {
  const [trendingPlayers, setTrendingPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setIsLoading(true);
        const data = await getTopPlayersByVisits(limit || (compact ? 5 : 10));
        
        if (data && data.length > 0) {
          // Fetch detailed player data for headshots
          const enrichedData = await Promise.all(
            data.map(async (player) => {
              try {
                const playerDetails = await fetchAPI(`/api/player/${encodeURIComponent(player.playerId)}`);
                return {
                  ...player,
                  headshot_url: playerDetails?.headshot_url,
                  current_team: playerDetails?.current_team,
                };
              } catch (err) {
                return player;
              }
            })
          );
          
          setTrendingPlayers(enrichedData);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching trending players:", err);
        setError("Failed to load trending players");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrending();
  }, [compact, limit]);

  if (isLoading) {
    if (compact) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm h-full flex flex-col relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">Trending Players</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-2 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex-shrink-0" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-24 animate-pulse" />
                    <div className="h-2 bg-gray-100 rounded w-20 animate-pulse" />
                  </div>
                  <div className="h-5 bg-gradient-to-r from-blue-100 to-blue-50 rounded-full w-10 animate-pulse flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Trending Players</h2>
            <span className="text-xs text-gray-500 ml-auto">Most Viewed</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Player</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Page Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...Array(5)].map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500 text-sm">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (trendingPlayers.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500 text-sm">
          <p>No trending players yet. Visit some player pages to see them here!</p>
        </div>
      </div>
    );
  }

  const fallbackHeadshot = "https://d3-dashboard-kellyjc.s3.us-east-2.amazonaws.com/images/default-silhouette.png";

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm h-full flex flex-col relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">Trending Players</h3>
          <span className="text-xs text-gray-500">(Page Views)</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {trendingPlayers.map((player, index) => (
            <div key={player.playerId} className="p-2 rounded hover:bg-gray-50 transition-colors">
              <Link 
                to={`/player/${player.playerId}`} 
                className="group flex items-center gap-2 hover:no-underline"
              >
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white text-[10px] font-bold shadow-sm flex-shrink-0">
                  {index + 1}
                </span>
                <div className="relative w-8 h-8 flex-shrink-0">
                  <img
                    src={player.headshot_url || fallbackHeadshot}
                    alt={player.playerName}
                    className="w-full h-full rounded-full object-cover object-top border border-gray-200 group-hover:border-blue-400 transition-all duration-300 shadow-sm"
                    onError={(e) => {
                      e.currentTarget.src = fallbackHeadshot;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                    {player.playerName}
                  </div>
                  <div className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors truncate">
                    {player.current_team || "College Baseball"}
                  </div>
                </div>
                <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 shadow-sm flex-shrink-0">
                  {player.visitCount}
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-700" />
            <h2 className="text-base font-semibold text-gray-900">Trending Players</h2>
            <span className="text-xs text-gray-500 ml-auto">Most Page Views</span>
          </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-10">#</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Player</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Page Views</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {trendingPlayers.map((player, index) => (
              <tr key={player.playerId} className="hover:bg-blue-50/40 transition-colors duration-200">
                <td className="px-4 py-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white text-xs font-bold shadow-sm">
                    {index + 1}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <Link to={`/player/${player.playerId}`} className="group flex items-center gap-2 hover:no-underline">
                    <div className="relative w-9 h-9 flex-shrink-0">
                      <img
                        src={player.headshot_url || fallbackHeadshot}
                        alt={player.playerName}
                        className="w-full h-full rounded-full object-cover object-top border border-gray-200 group-hover:border-blue-400 transition-all duration-300 shadow-sm group-hover:shadow-md"
                        onError={(e) => {
                          e.currentTarget.src = fallbackHeadshot;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200 truncate">
                        {player.playerName}
                      </div>
                      <div className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-200 truncate">
                        {player.current_team || "College Baseball"}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-2 text-right">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 shadow-sm">
                    {player.visitCount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrendingPlayers;
