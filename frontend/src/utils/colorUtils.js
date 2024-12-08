import { roundTo } from "../utils/mathUtils";

const getContrastColor = (r, g, b) => {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "text-gray-900" : "text-white";
};

export const WARCell = ({ value, isTeam = false }) => {
  const getWARColor = (war) => {
    const scales = isTeam
      ? { min: -15, max: 15, median: 1 }
      : { min: -2, max: 5, median: 0 };

    const { min, max, median } = scales;

    if (war < median) {
      const t = (war - min) / (median - min);
      const color = {
        r: Math.round(255 * t),
        g: Math.round(255 * t),
        b: 255,
      };
      return { color, textClass: getContrastColor(color.r, color.g, color.b) };
    } else {
      const t = (war - median) / (max - median);
      const color = {
        r: 255,
        g: Math.round(255 * (1 - t)),
        b: Math.round(255 * (1 - t)),
      };
      return { color, textClass: getContrastColor(color.r, color.g, color.b) };
    }
  };

  const { color, textClass } = getWARColor(value);

  return (
    <div
      className={`p-2 rounded ${textClass} text-center font-medium`}
      style={{
        backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
        textShadow:
          textClass === "text-white" ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
      }}
    >
      {roundTo(value, 1)}
    </div>
  );
};

export const getPitchColor = (pitchType) => {
  const colors = {
    Fastball: "#ff0000",
    Slider: "#00ff00",
    Curveball: "#0000ff",
    Changeup: "#ffff00",
    Other: "#808080",
  };
  return colors[pitchType] || colors.Other;
};

export const getPFColor = (val) => {
  const min = 90;
  const max = 120;
  const median = 100;

  if (val < median) {
    const t = (val - min) / (median - min);
    return {
      r: Math.round(255 * t),
      g: Math.round(255 * t),
      b: 255,
    };
  } else {
    const t = (val - median) / (max - median);
    return {
      r: 255,
      g: Math.round(255 * (1 - t)),
      b: Math.round(255 * (1 - t)),
    };
  }
};
