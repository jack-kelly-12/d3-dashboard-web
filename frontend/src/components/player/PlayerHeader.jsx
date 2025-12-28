import { useState, useEffect, useRef } from "react";
import { User, MapPin } from "lucide-react";
import { API_BASE_URL } from "../../config/api";
// removed unused imports

const formatHeight = (h) => {
  if (!h) return "-";
  if (typeof h === "string" && h.includes("-")) return h;
  if (typeof h === "number") return `${Math.floor(h / 12)}-${h % 12}`;
  return "-";
};

const formatSide = (v) => (v ? v[0].toUpperCase() + v.slice(1).toLowerCase() : "-");
const romanize = (n) => ({ 1: "I", 2: "II", 3: "III" }[n] || n);

const PlayerHeader = ({ playerData, onReady }) => {
  const fallback = "https://d3-dashboard-kellyjc.s3.us-east-2.amazonaws.com/images/default-silhouette.png";
  const teamFallback = "https://d3-dashboard-kellyjc.s3.us-east-2.amazonaws.com/images/0.png";
  const headshotUrl = playerData?.headshot_url || fallback;
  const teamLogoUrl = playerData?.org_id
    ? `https://d3-dashboard-kellyjc.s3.us-east-2.amazonaws.com/images/${playerData.org_id}.png`
    : teamFallback;

  const [bannerColors, setBannerColors] = useState({
    primary: "rgb(37, 99, 235)",
    secondary: "rgb(59, 130, 246)"
  });
  const readyRef = useRef(false);

  useEffect(() => {
    readyRef.current = false;
    setBannerColors({
      primary: "rgb(37, 99, 235)",
      secondary: "rgb(59, 130, 246)"
    });

    const setDynamicBannerColors = async () => {
      try {
        const proxyUrl = `${API_BASE_URL}/api/logo?url=${encodeURIComponent(teamLogoUrl)}`;
        const resp = await fetch(proxyUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        if (blob.size === 0) throw new Error("Empty logo blob");

        const imgBitmap = await createImageBitmap(blob);
        const canvas = document.createElement("canvas");
        canvas.width = imgBitmap.width;
        canvas.height = imgBitmap.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(imgBitmap, 0, 0);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const colorCounts = {};
        const colors = [];

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const alpha = data[i + 3];
          if (alpha < 128) continue;
          const brightness = (r + g + b) / 3;
          if (brightness < 30 || brightness > 225) continue;
          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;
          const key = `${qr},${qg},${qb}`;
          colorCounts[key] = (colorCounts[key] || 0) + 1;
          colors.push({ r: qr, g: qg, b: qb, count: colorCounts[key] });
        }

        const sortedColors = colors
          .filter((color, index, self) => 
            index === self.findIndex(c => c.r === color.r && c.g === color.g && c.b === color.b)
          )
          .sort((a, b) => b.count - a.count);

        const primary = sortedColors[0] || { r: 37, g: 99, b: 235 };
        const secondary = sortedColors[1] || { r: 59, g: 130, b: 246 };

        setBannerColors({
          primary: `rgb(${primary.r}, ${primary.g}, ${primary.b})`,
          secondary: `rgb(${secondary.r}, ${secondary.g}, ${secondary.b})`
        });
      } catch {
        setBannerColors({
          primary: "rgb(37, 99, 235)",
          secondary: "rgb(59, 130, 246)"
        });
      } finally {
        if (!readyRef.current) {
          readyRef.current = true;
          onReady?.();
        }
      }
    };

    if (playerData?.org_id) setDynamicBannerColors();
    else {
      readyRef.current = true;
      onReady?.();
    }
  }, [playerData?.org_id, onReady, teamLogoUrl]);

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div
        className="relative h-24 transition-colors duration-500"
        style={{
          background: `linear-gradient(to right, ${bannerColors.primary}, ${bannerColors.secondary})`,
        }}
      > 
        <div className="absolute left-1/2 -bottom-12 transform -translate-x-1/2">
          <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-offset-2 ring-white shadow-lg">
            <img
              src={headshotUrl}
              alt={`${playerData.player_name} headshot`}
              onError={(e) => (e.currentTarget.src = fallback)}
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
              <img
                className="w-full h-full object-cover"
                src={teamLogoUrl}
                alt="Team logo"
                onError={(e) => (e.currentTarget.src = teamFallback)}
              />
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
