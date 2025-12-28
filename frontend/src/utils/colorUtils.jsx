import { roundTo } from "../utils/mathUtils";

const getContrastColor = (r, g, b) => {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "text-gray-900" : "text-white";
};

export const getPercentileColor = (p) => {
  const clamp = (x) => Math.min(100, Math.max(0, x));
  p = clamp(p);

  const blue = [0, 65, 160];
  const mid  = [210, 210, 210];
  const red  = [186, 0, 33];

  let r, g, b;
  if (p < 50) {
    const t = p / 50;
    r = blue[0] + (mid[0] - blue[0]) * t;
    g = blue[1] + (mid[1] - blue[1]) * t;
    b = blue[2] + (mid[2] - blue[2]) * t;
  } else {
    const t = (p - 50) / 50;
    r = mid[0] + (red[0] - mid[0]) * t;
    g = mid[1] + (red[1] - mid[1]) * t;
    b = mid[2] + (red[2] - mid[2]) * t;
  }

  const darken = 0.9;
  r *= darken; g *= darken; b *= darken;

  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
};

export const WARCell = ({ value, percentile, isTeam = false }) => {
  if (value === null || value === undefined || isNaN(value)) {
    return (
      <div className="p-2 rounded text-gray-500 text-center font-medium">
        -
      </div>
    );
  }

  const getWARColor = (war, percentile) => {
    if (percentile !== null && percentile !== undefined && !isNaN(percentile)) {
      const colorString = getPercentileColor(percentile);
      const rgbMatch = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        return { color: { r, g, b }, textClass: getContrastColor(r, g, b) };
      }
    }

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

  const { color, textClass } = getWARColor(value, percentile);

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


export const hexToRgba = (hex, alpha = 1) => {
  if (hex.startsWith("rgb")) return hex.replace("rgb", "rgba").replace(")", `, ${alpha})`);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getPitchColorPDF = (pitchType) => {
  switch (pitchType) {
    case "FB":
      return "#ef4444";
    case "CB":
      return "#3b82f6";
    case "SL":
      return "#10b981";
    case "CH":
      return "#94a3b8";
    default:
      return "#94a3b8";
  }
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
