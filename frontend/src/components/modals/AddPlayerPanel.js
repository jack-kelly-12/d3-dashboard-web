import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
import SlideOutPanel from "./SlideOutPanel";

const AddPlayerPanel = ({
  isOpen,
  onClose,
  onSubmit,
  availablePlayers,
  editingPlayer,
  isPitcher = false,
}) => {
  const [isNewPlayer, setIsNewPlayer] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [playerFormData, setPlayerFormData] = useState({
    playerId: null,
    name: "",
    position: "",
    writeup: "",
  });

  useEffect(() => {
    if (editingPlayer) {
      setIsNewPlayer(true);
      setPlayerFormData({
        playerId: editingPlayer.playerId,
        name: editingPlayer.name,
        position: editingPlayer.position || "",
        writeup: editingPlayer.writeup || "",
      });
    } else {
      resetForm();
    }
  }, [editingPlayer, isOpen]);

  const resetForm = () => {
    setIsNewPlayer(false);
    setSelectedPlayer("");
    setPlayerFormData({
      playerId: null,
      name: "",
      position: "",
      writeup: "",
    });
  };

  const handleExistingPlayerSelect = (e) => {
    const player = availablePlayers.find((p) => p.name === e.target.value);
    if (player) {
      setSelectedPlayer(player.name);
      setPlayerFormData({
        playerId: player.playerId,
        name: player.name,
        position: player.position || "",
        writeup: "",
      });
    }
  };

  const handleInputChange = (field, value) => {
    setPlayerFormData({
      ...playerFormData,
      [field]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(playerFormData);
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const TextInput = ({ label, value, onChange, disabled, placeholder = "" }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
      />
    </div>
  );

  return (
    <SlideOutPanel
      isOpen={isOpen}
      onClose={handleClose}
      title={editingPlayer ? `Edit ${isPitcher ? 'Pitcher' : 'Player'}` : `Add ${isPitcher ? 'Pitcher' : 'Player'}`}
      width="w-[700px]"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setIsNewPlayer(false)}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              !isNewPlayer
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Select Existing
          </button>
          <button
            type="button"
            onClick={() => setIsNewPlayer(true)}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              isNewPlayer
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Create New
          </button>
        </div>

        {!isNewPlayer && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Choose a player
            </label>
            <select
              value={selectedPlayer}
              onChange={handleExistingPlayerSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a player...</option>
              {availablePlayers.map((player) => (
                <option key={player.playerId} value={player.name}>
                  {player.name} - {player.position}
                </option>
              ))}
            </select>
          </div>
        )}

        <TextInput
          label="Player Name"
          value={playerFormData.name}
          onChange={(value) => handleInputChange("name", value)}
          disabled={!isNewPlayer && selectedPlayer}
        />

        <TextInput
          label="Position"
          value={playerFormData.position}
          onChange={(value) => handleInputChange("position", value)}
          disabled={!isNewPlayer && selectedPlayer}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Scouting Report
          </label>
          <textarea
            value={playerFormData.writeup}
            onChange={(e) => handleInputChange("writeup", e.target.value)}
            rows={6}
            placeholder="Enter scouting report..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {editingPlayer ? 'Update' : 'Add'} {isPitcher ? 'Pitcher' : 'Player'}
          </button>
        </div>
      </form>
    </SlideOutPanel>
  );
};

export default AddPlayerPanel;


