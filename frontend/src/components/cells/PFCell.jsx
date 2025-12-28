import { getPFColor } from "../../utils/colorUtils";
import { roundTo } from "../../utils/mathUtils";

export const PFCell = ({ value }) => {
  const { r, g, b } = getPFColor(value);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const textColor = brightness > 128 ? "text-black" : "text-white";

  return (
    <div
      className={`p-2 rounded ${textColor} text-center`}
      style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
    >
      {roundTo(value, 0)}
    </div>
  );
};
