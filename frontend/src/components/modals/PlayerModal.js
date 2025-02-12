import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import _ from "lodash";

const RadioGroup = ({ options, value, onChange, title }) => (
  <div>
    <label className="text-sm font-medium text-gray-700 mb-3 block">
      {title}
    </label>
    <div className="flex gap-3">
      {options.map((option) => (
        <label
          key={option.value}
          className={`
            relative flex items-center justify-center px-4 py-2.5 rounded-lg cursor-pointer
            transition-all duration-200 select-none min-w-[90px]
            ${
              value === option.value
                ? "bg-blue-50 border-2 border-blue-500 text-blue-700 font-medium shadow-sm"
                : "bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-200 hover:bg-blue-50"
            }
          `}
        >
          <input
            type="radio"
            className="sr-only"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="flex items-center gap-2">
            {option.icon}
            <span>{option.label}</span>
          </div>
          {value === option.value && (
            <div className="absolute -right-1 -top-1 w-3 h-3 bg-blue-500 rounded-full" />
          )}
        </label>
      ))}
    </div>
  </div>
);

const PlayerModal = ({ isOpen, onClose, onSubmit, type, chart }) => {
  const [name, setName] = useState("");
  const [pitchHand, setPitchHand] = useState("right");
  const [batHand, setBatHand] = useState("right");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentPlayers, setRecentPlayers] = useState([]);

  useEffect(() => {
    if (chart?.pitches) {
      if (type === "pitcher") {
        const pitchersData = chart.pitches
          .filter((pitch) => pitch.pitcher && pitch.pitcher.name)
          .map((pitch) => ({
            name: pitch.pitcher.name,
            pitchHand: pitch.pitcher.pitchHand,
          }));

        const unique = _.uniqBy(
          pitchersData,
          (pitcher) => `${pitcher.name}-${pitcher.pitchHand}`
        );
        setRecentPlayers(unique);
      } else if (type === "batter") {
        const currentTopBottom = chart.topBottom || "Top";
        const isAwayTeam = currentTopBottom === "Top";

        const teamBatters = chart.pitches
          .filter((pitch) => {
            const pitchTopBottom = pitch.topBottom || "Top";
            const isPitchFromTeam = (pitchTopBottom === "Top") === isAwayTeam;
            return pitch.batter && pitch.batter.name && isPitchFromTeam;
          })
          .map((pitch) => ({
            name: pitch.batter.name,
            batHand: pitch.batter.batHand,
          }));

        const unique = _.uniqBy(
          teamBatters,
          (batter) => `${batter.name}-${batter.batHand}`
        );
        setRecentPlayers(unique);
      }
    }
  }, [chart, type]);

  const handleSubmit = () => {
    onSubmit({
      name,
      pitchHand: type === "pitcher" ? pitchHand : undefined,
      batHand: type === "batter" ? batHand : undefined,
    });
    setName("");
    setPitchHand("right");
    setBatHand("right");
    onClose();
  };

  const selectRecentPlayer = (player) => {
    onSubmit(player);
    onClose();
  };

  const handOptions = [
    {
      value: "right",
      label: "Right",
    },
    {
      value: "left",
      label: "Left",
    },
  ];

  if (type === "batter") {
    handOptions.push({
      value: "switch",
      label: "Switch",
    });
  }

  const filteredPlayers = recentPlayers.filter((player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPlayerTypeDisplay = (player) => {
    if (type === "pitcher") {
      return player.pitchHand === "right" ? "RHP" : "LHP";
    } else {
      if (player.batHand === "switch") return "Switch";
      return player.batHand === "right" ? "RHH" : "LHH";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Select {type.charAt(0).toUpperCase() + type.slice(1)}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {recentPlayers.length > 0 && (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search recent ${type}s...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={20}
                />
              </div>
              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {filteredPlayers.map((player) => (
                  <button
                    key={player.name}
                    onClick={() => selectRecentPlayer(player)}
                    className="w-full px-4 py-3 text-left border rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-gray-500">
                      {getPlayerTypeDisplay(player)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {recentPlayers.length > 0 && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  or add new {type}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Enter ${type} name...`}
              />
            </div>

            {type === "pitcher" && (
              <RadioGroup
                options={handOptions}
                value={pitchHand}
                onChange={setPitchHand}
                title="Throws"
              />
            )}

            {type === "batter" && (
              <RadioGroup
                options={handOptions}
                value={batHand}
                onChange={setBatHand}
                title="Bats"
              />
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;
