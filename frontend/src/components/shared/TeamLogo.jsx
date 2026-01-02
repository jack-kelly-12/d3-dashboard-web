import { API_BASE_URL } from "../../config/api";
import { TEAM_FALLBACK } from "../../config/constants";

export const TeamLogo = ({ teamId, teamName }) => (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
      <img
        src={teamId ? `${API_BASE_URL}/api/team-logo/${teamId}` : TEAM_FALLBACK}
        alt={teamName}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = TEAM_FALLBACK;
        }}
      />
    </div>
);