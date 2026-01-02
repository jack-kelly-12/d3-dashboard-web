import React, { useState, useEffect, memo } from "react";
import { fetchAPI } from "../../config/api";
import { TeamLogo } from "../shared/TeamLogo";

const SimilarBatters = memo(({ playerId, year, division }) => {
  const [similarPlayers, setSimilarPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [player, setPlayer] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchSimilarBatters = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchAPI(
          `/api/similar-batters/${encodeURIComponent(
            playerId
          )}?year=${year}&division=${division}`
        );
        
        if (response.target_player && response.target_player.player_id === playerId) {
          setPlayer(response.target_player.player_name || "");
          setSimilarPlayers(response.similar_players || []);
          setNote(response.note || "");
        } else {
          setError("No data available for this player");
          setSimilarPlayers([]);
        }
      } catch (err) {
        console.error("Error fetching similar batters:", err);
        setError("Could not load similar batters");
        setSimilarPlayers([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (playerId && year && division) {
      fetchSimilarBatters();
    }
  }, [playerId, year, division]);

  if (isLoading) return <div className="text-center py-4"></div>;
  if (error) return null;
  if (!similarPlayers.length) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-8">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Similar Batters to {player}</h3>
        {note && (
          <p className="text-xs text-gray-500">{note}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {similarPlayers.slice(0, 5).map((p) => {
          return (
          <a
            key={`${p.player_id}-${p.year}`}
            href={`/player/${p.player_id}`}
            className="flex items-center p-2 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <div className="h-8 w-8 flex-shrink-0 mr-2 bg-gray-100 rounded-full overflow-hidden">
              <TeamLogo teamId={p.org_id} teamName={p.team_name} />
            </div>
            <span className="text-xs truncate">
              {p.year} - {p.player_name}
            </span>
          </a>
        );})}
      </div>
    </div>
  );
});

SimilarBatters.displayName = 'SimilarBatters';

export default SimilarBatters;