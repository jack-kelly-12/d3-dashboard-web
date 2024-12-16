import PlayerSearch from "../home/PlayerSearch";

const PlayerHeader = ({ playerData }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
    <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent pb-2">
          {playerData.playerName}
        </h1>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-600 text-sm font-medium">
            {playerData.currentTeam}
          </span>
          <span className="text-gray-300">•</span>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-600 text-sm font-medium">
            {playerData.conference}
          </span>
        </div>
      </div>

      <div className="w-full sm:w-auto">
        <PlayerSearch />
      </div>
    </div>
  </div>
);

export default PlayerHeader;
