const PlayerHeader = ({ playerData }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {playerData.playerName}
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-gray-600">{playerData.currentTeam}</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-600">{playerData.conference}</span>
        </div>
      </div>
    </div>
  </div>
);

export default PlayerHeader;
