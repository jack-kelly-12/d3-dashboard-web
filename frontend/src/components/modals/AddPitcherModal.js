import React, { useState, useEffect } from "react";
import Modal, { StatInput } from "./Modal";
import { UserPlus, Users } from "lucide-react";

const AddPitcherModal = ({
  isOpen,
  onClose,
  onSubmit,
  availablePlayers,
  editingPitcher,
}) => {
  const [isNewPlayer, setIsNewPlayer] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [pitcherFormData, setPitcherFormData] = useState({
    id: null,
    name: "",
    role: "",
    keyStats: {
      era: "",
      fip: "",
      k: "",
      bb: "",
      ip: "",
      war: "",
    },
    writeup: "",
  });

  useEffect(() => {
    if (editingPitcher) {
      setIsNewPlayer(true);
      setPitcherFormData({
        ...editingPitcher,
        id: editingPitcher.id, // Preserve the ID when editing
        keyStats: {
          era: editingPitcher.keyStats?.era || "",
          fip: editingPitcher.keyStats?.fip || "",
          k: editingPitcher.keyStats?.k || "",
          bb: editingPitcher.keyStats?.bb || "",
          ip: editingPitcher.keyStats?.ip || "",
          war: editingPitcher.keyStats?.war || "",
        },
        role: editingPitcher.role || "",
        writeup: editingPitcher.writeup || "",
      });
    }
  }, [editingPitcher]);

  const handleExistingPlayerSelect = (e) => {
    const player = availablePlayers.find((p) => p.name === e.target.value);
    if (player) {
      setSelectedPlayer(player.name);
      setPitcherFormData({
        ...pitcherFormData,
        name: player.name,
        role: "",
        keyStats: {
          era: player.keyStats?.era || "",
          fip: player.keyStats?.fip || "",
          k: player.keyStats?.k || "",
          bb: player.keyStats?.bb || "",
          ip: player.keyStats?.ip || "",
          war: player.keyStats?.war || "",
        },
      });
    }
  };

  const handleSubmit = () => {
    const newPitcher = {
      id: pitcherFormData.id || Date.now(),
      name: pitcherFormData.name,
      role: pitcherFormData.role,
      keyStats: pitcherFormData.keyStats,
      writeup: pitcherFormData.writeup,
    };
    onSubmit(newPitcher);
    resetForm();
  };

  const resetForm = () => {
    setSelectedPlayer("");
    setIsNewPlayer(false);
    setPitcherFormData({
      name: "",
      role: "",
      keyStats: {
        era: "",
        fip: "",
        k: "",
        bb: "",
        ip: "",
        war: "",
      },
      writeup: "",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Pitcher to Report">
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
            Select Existing Pitcher
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
            Create New Pitcher
          </div>
        </button>
      </div>

      {/* Existing Pitcher Selection */}
      {!isNewPlayer && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Pitcher
          </label>
          <select
            value={selectedPlayer}
            onChange={handleExistingPlayerSelect}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a pitcher</option>
            {availablePlayers.map((player) => (
              <option key={player.name} value={player.name}>
                {player.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Pitcher Form */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pitcher Name
            </label>
            <input
              type="text"
              value={pitcherFormData.name}
              onChange={(e) =>
                setPitcherFormData({
                  ...pitcherFormData,
                  name: e.target.value,
                })
              }
              disabled={!isNewPlayer && selectedPlayer}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={pitcherFormData.role}
              onChange={(e) =>
                setPitcherFormData({
                  ...pitcherFormData,
                  role: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select role...</option>
              <option value="Starter">Starter</option>
              <option value="Reliever">Reliever</option>
              <option value="Closer">Closer</option>
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <StatInput
            label="ERA"
            value={pitcherFormData.keyStats.era}
            onChange={(value) =>
              setPitcherFormData({
                ...pitcherFormData,
                keyStats: { ...pitcherFormData.keyStats, era: value },
              })
            }
            disabled={!isNewPlayer && selectedPlayer}
            placeholder="0.00"
          />
          <StatInput
            label="FIP"
            value={pitcherFormData.keyStats.fip}
            onChange={(value) =>
              setPitcherFormData({
                ...pitcherFormData,
                keyStats: { ...pitcherFormData.keyStats, fip: value },
              })
            }
            disabled={!isNewPlayer && selectedPlayer}
            placeholder="0.00"
          />
          <StatInput
            label="K%"
            value={pitcherFormData.keyStats.k}
            onChange={(value) =>
              setPitcherFormData({
                ...pitcherFormData,
                keyStats: { ...pitcherFormData.keyStats, k: value },
              })
            }
            disabled={!isNewPlayer && selectedPlayer}
            placeholder="0.0%"
          />
          <StatInput
            label="BB%"
            value={pitcherFormData.keyStats.bb}
            onChange={(value) =>
              setPitcherFormData({
                ...pitcherFormData,
                keyStats: { ...pitcherFormData.keyStats, bb: value },
              })
            }
            disabled={!isNewPlayer && selectedPlayer}
            placeholder="0.0%"
          />
          <StatInput
            label="IP"
            value={pitcherFormData.keyStats.ip}
            onChange={(value) =>
              setPitcherFormData({
                ...pitcherFormData,
                keyStats: { ...pitcherFormData.keyStats, ip: value },
              })
            }
            disabled={!isNewPlayer && selectedPlayer}
            placeholder="0.0"
          />
          <StatInput
            label="WAR"
            value={pitcherFormData.keyStats.war}
            onChange={(value) =>
              setPitcherFormData({
                ...pitcherFormData,
                keyStats: { ...pitcherFormData.keyStats, war: value },
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
            value={pitcherFormData.writeup}
            onChange={(e) =>
              setPitcherFormData({
                ...pitcherFormData,
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
            disabled={!pitcherFormData.name || !pitcherFormData.role}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Pitcher
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddPitcherModal;
