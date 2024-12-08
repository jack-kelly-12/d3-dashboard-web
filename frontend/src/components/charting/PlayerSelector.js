const PlayerSelector = ({ type, player, onEdit, required = false }) => {
  return (
    <div className="relative">
      <button
        onClick={onEdit}
        className={`w-full px-4 py-3 bg-white border rounded-lg text-left transition-colors hover:bg-gray-50 
          ${!player ? "border-dashed" : "border-gray-200"} 
          ${required ? "border-gray-300" : "border-gray-200"}
          group`}
      >
        {player ? (
          <div>
            <div className="font-medium text-gray-900">{player.name}</div>
            {(type === "Pitcher" || type === "Batter") && (
              <div className="text-sm text-gray-500 capitalize">
                {type === "Pitcher" && `Throws: ${player.pitchHand}`}
                {type === "Batter" && `Bats: ${player.batHand}`}
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 flex items-center justify-between">
            <span>
              {required ? `Select ${type}` : `Add ${type} (Optional)`}
            </span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded group-hover:bg-gray-200 transition-colors">
              {required ? "Required" : "Optional"}
            </span>
          </div>
        )}
      </button>
    </div>
  );
};

export default PlayerSelector;
