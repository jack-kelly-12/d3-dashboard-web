import { useEffect, useRef } from "react";
import { User, MapPin } from "lucide-react";
import { TeamLogo } from "../shared/TeamLogo";
import { PLAYER_HEADSHOT_FALLBACK } from "../../config/constants";

const DEFAULT_PRIMARY = "#2563eb";
const DEFAULT_SECONDARY = "#3b82f6";

const formatHeight = (h) => {
  if (!h) return "-";
  if (typeof h === "string" && h.includes("-")) return h;
  if (typeof h === "number") return `${Math.floor(h / 12)}-${h % 12}`;
  return "-";
};

const formatSide = (v) => (v ? v[0].toUpperCase() + v.slice(1).toLowerCase() : "-");
const romanize = (n) => ({ 1: "I", 2: "II", 3: "III" }[n] || n);

const PlayerHeader = ({ playerData, onReady }) => {
  const headshotUrl = playerData?.headshot_url || PLAYER_HEADSHOT_FALLBACK;
  
  const teamColors = playerData?.team_colors || {};
  const primaryColor = teamColors.primary || DEFAULT_PRIMARY;
  const secondaryColor = teamColors.secondary || primaryColor || DEFAULT_SECONDARY;

  const readyRef = useRef(false);

  useEffect(() => {
    if (!readyRef.current) {
      readyRef.current = true;
      onReady?.();
    }
  }, [onReady]);

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div
        className="relative h-24 transition-colors duration-500"
        style={{
          background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
        }}
      > 
        <div className="absolute left-1/2 -bottom-12 transform -translate-x-1/2">
          <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-offset-2 ring-white shadow-lg">
            <img
              src={headshotUrl}
              alt={`${playerData.player_name} headshot`}
              onError={(e) => (e.currentTarget.src = PLAYER_HEADSHOT_FALLBACK)}
              className="w-full h-full object-cover object-top transition-transform hover:scale-105"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 pt-14 px-5 pb-5 flex flex-col">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{playerData.player_name}</h1>
          <div className="text-gray-600 flex items-center justify-center gap-2 flex-wrap">
            <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              <TeamLogo teamId={playerData.org_id} teamName={playerData.current_team} />
            </div>
            <span>{playerData.current_team}</span> • <span>{playerData.conference}</span> • Division{" "}
            {romanize(playerData.division)}
          </div>
        </div>

        <div className="flex-1 flex flex-col space-y-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-gray-800 text-sm">Player Info</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Position</span>
                <span className="font-medium">{playerData.position}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Height</span>
                <span className="font-medium">{formatHeight(playerData.height)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bats</span>
                <span className="font-medium">{formatSide(playerData.bats)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Throws</span>
                <span className="font-medium">{formatSide(playerData.throws)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-gray-800 text-sm">Background</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Hometown</span>
                <span className="font-medium">{playerData.hometown || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">High School</span>
                <span className="font-medium">{playerData.high_school || "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerHeader;
