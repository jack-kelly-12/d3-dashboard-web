import React from "react";
import { User, MapPin } from "lucide-react";

const formatHeight = (height) => {
  if (!height) return "-";
  if (typeof height === "string" && height.includes("-")) {
    return height;
  }
  if (typeof height === "number") {
    const feet = Math.floor(height / 12);
    const inches = height % 12;
    return `${feet}-${inches}`;
  }
  return "-";
};

const formatSide = (value) => {
  if (!value) return "-";
  const formatted =
    value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  return formatted;
};

const romanize = (num) => {
  const map = { 1: "I", 2: "II", 3: "III" };
  return map[num] || num;
};

const PlayerHeader = ({ playerData }) => {
  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Decorative Banner */}
      <div className="relative h-16 bg-gradient-to-r from-blue-500 to-blue-600"></div>

      {/* Player Info Section */}
      <div className="flex-1 pt-12 px-6 pb-6 flex flex-col">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {playerData.playerName}
          </h1>
          <div className="text-gray-600 flex items-center justify-center gap-2">
            {playerData.currentTeam} • {playerData.conference} • Division{" "}
            {romanize(playerData.division)}
          </div>
        </div>

        {/* Player Details Stack */}
        <div className="flex-1 flex flex-col space-y-4">
          {/* Player Info Card */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-gray-800">Player Info</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Position</span>
                <span className="text-gray-800 font-medium">
                  {playerData.position}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Height</span>
                <span className="text-gray-800 font-medium">
                  {formatHeight(playerData.height)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bats</span>
                <span className="text-gray-800 font-medium">
                  {formatSide(playerData.bats)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Throws</span>
                <span className="text-gray-800 font-medium">
                  {formatSide(playerData.throws)}
                </span>
              </div>
            </div>
          </div>

          {/* Background Info Card */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-gray-800">Background</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Hometown</span>
                <span className="text-gray-800 font-medium">
                  {playerData.hometown || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">High School</span>
                <span className="text-gray-800 font-medium">
                  {playerData.highSchool || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerHeader;
