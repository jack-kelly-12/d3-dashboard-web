import React, { useState, useEffect } from "react";
import Modal, { StatInput } from "./Modal";
import { UserPlus, Users } from "lucide-react";

const AddPlayerModal = ({
  isOpen,
  onClose,
  onSubmit,
  availablePlayers,
  editingPlayer,
}) => {
  const [isNewPlayer, setIsNewPlayer] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [playerFormData, setPlayerFormData] = useState({
    id: null,
    name: "",
    position: "",
    keyStats: {
      avg: "",
      obp: "",
      slg: "",
      hr: "",
      sb: "",
      war: "",
    },
    writeup: "",
  });

  useEffect(() => {
    if (editingPlayer) {
      setIsNewPlayer(true);
      setPlayerFormData({
        ...editingPlayer,
        keyStats: {
          id: editingPlayer.id,
          avg: editingPlayer.keyStats.avg || "",
          obp: editingPlayer.keyStats.obp || "",
          slg: editingPlayer.keyStats.slg || "",
          hr: editingPlayer.keyStats.hr || "",
          sb: editingPlayer.keyStats.sb || "",
          war: editingPlayer.keyStats.war || "",
        },
      });
    }
  }, [editingPlayer]);

  const handleExistingPlayerSelect = (e) => {
    const player = availablePlayers.find((p) => p.name === e.target.value);
    if (player) {
      setSelectedPlayer(player.name);
      setPlayerFormData({
        name: player.name,
        position: player.position || "",
        keyStats: {
          avg: player.keyStats.avg || "",
          obp: player.keyStats.obp || "",
          slg: player.keyStats.slg || "",
          hr: player.keyStats.hr || "",
          sb: player.keyStats.sb || "",
          war: player.keyStats.war || "",
        },
        writeup: "",
      });
    }
  };

  const resetForm = () => {
    setSelectedPlayer("");
    setIsNewPlayer(false);
    setPlayerFormData({
      name: "",
      position: "",
      keyStats: {
        avg: "",
        obp: "",
        slg: "",
        hr: "",
        sb: "",
        war: "",
      },
      writeup: "",
    });
  };

  const handleSubmit = () => {
    const newPlayer = {
      id: playerFormData.id || Date.now(),
      name: playerFormData.name,
      position: playerFormData.position,
      keyStats: {
        avg: playerFormData.keyStats.avg || ".000",
        obp: playerFormData.keyStats.obp || ".000",
        slg: playerFormData.keyStats.slg || ".000",
        hr: playerFormData.keyStats.hr || "0",
        sb: playerFormData.keyStats.sb || "0",
        war: playerFormData.keyStats.war || "0.0",
      },
      writeup: playerFormData.writeup,
    };
    onSubmit(newPlayer);
    resetForm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Player to Report">
      {/* Selection Type Toggle */}
      <div className="flex space-x-2 mb-6">
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 
            ${
              !isNewPlayer
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          onClick={() => setIsNewPlayer(false)}
        >
          <div className="flex items-center justify-center">
            <Users className="w-4 h-4 mr-2" />
            Select Existing Player
          </div>
        </button>
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 
            ${
              isNewPlayer
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          onClick={() => setIsNewPlayer(true)}
        >
          <div className="flex items-center justify-center">
            <UserPlus className="w-4 h-4 mr-2" />
            Create New Player
          </div>
        </button>
      </div>

      {/* Existing Player Selection */}
      {!isNewPlayer && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Player
          </label>
          <select
            value={selectedPlayer}
            onChange={handleExistingPlayerSelect}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a player</option>
            {availablePlayers.map((player) => (
              <option key={player.name} value={player.name}>
                {player.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Player Form */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Player Name
            </label>
            <input
              type="text"
              value={playerFormData.name}
              onChange={(e) =>
                setPlayerFormData({
                  ...playerFormData,
                  name: e.target.value,
                })
              }
              disabled={!isNewPlayer && selectedPlayer}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <input
              type="text"
              value={playerFormData.position}
              onChange={(e) =>
                setPlayerFormData({
                  ...playerFormData,
                  position: e.target.value,
                })
              }
              disabled={!isNewPlayer && selectedPlayer}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <StatInput
            label="AVG"
            value={playerFormData.keyStats.avg}
            onChange={(value) =>
              setPlayerFormData({
                ...playerFormData,
                keyStats: { ...playerFormData.keyStats, avg: value },
              })
            }
            disabled={!isNewPlayer && selectedPlayer}
            placeholder=".000"
          />
          <StatInput
            label="OBP"
            value={playerFormData.keyStats.obp}
            onChange={(value) =>
              setPlayerFormData({
                ...playerFormData,
                keyStats: { ...playerFormData.keyStats, obp: value },
              })
            }
            disabled={!isNewPlayer && selectedPlayer}
            placeholder=".000"
          />
          <StatInput
            label="SLG"
            value={playerFormData.keyStats.slg}
            onChange={(value) =>
              setPlayerFormData({
                ...playerFormData,
                keyStats: { ...playerFormData.keyStats, slg: value },
              })
            }
            disabled={!isNewPlayer && selectedPlayer}
            placeholder=".000"
          />
          <StatInput
            label="HR"
            value={playerFormData.keyStats.hr}
            onChange={(value) =>
              setPlayerFormData({
                ...playerFormData,
                keyStats: { ...playerFormData.keyStats, hr: value },
              })
            }
            disabled={!isNewPlayer && selectedPlayer}
            placeholder="0"
          />
          <StatInput
            label="SB"
            value={playerFormData.keyStats.sb}
            onChange={(value) =>
              setPlayerFormData({
                ...playerFormData,
                keyStats: { ...playerFormData.keyStats, sb: value },
              })
            }
            disabled={!isNewPlayer && selectedPlayer}
            placeholder="0"
          />
          <StatInput
            label="WAR"
            value={playerFormData.keyStats.war}
            onChange={(value) =>
              setPlayerFormData({
                ...playerFormData,
                keyStats: { ...playerFormData.keyStats, war: value },
              })
            }
            disabled={!isNewPlayer && selectedPlayer}
            placeholder="0.0"
          />
        </div>

        {/* Write-up Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Write-up
          </label>
          <textarea
            value={playerFormData.writeup}
            onChange={(e) =>
              setPlayerFormData({
                ...playerFormData,
                writeup: e.target.value,
              })
            }
            placeholder="Enter scouting report..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!playerFormData.name || !playerFormData.position}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Player
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddPlayerModal;
