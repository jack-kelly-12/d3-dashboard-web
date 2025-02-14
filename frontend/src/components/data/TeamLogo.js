import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

const logoCache = new Map();

const TeamLogo = ({
  teamId,
  conferenceId,
  teamName,
  showConference = false,
  className = "",
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = showConference ? conferenceId : teamId;
    if (!id) {
      console.log(
        `No ${
          showConference ? "conference" : "team"
        } ID provided for ${teamName}`
      );
      return;
    }

    const endpoint = showConference ? "conferences" : "teams";
    const cacheKey = `${endpoint}_${id}`;

    if (logoCache.has(cacheKey)) {
      setImageUrl(logoCache.get(cacheKey));
      setError(false);
      return;
    }

    const url = `${API_BASE_URL}/api/${endpoint}/logos/${id}.png`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        logoCache.set(cacheKey, objectUrl);
        setImageUrl(objectUrl);
        setError(false);
      })
      .catch((err) => {
        console.error(`Error loading logo for ${teamName}:`, err);
        setError(true);
      });

    return () => {
      if (imageUrl && !Array.from(logoCache.values()).includes(imageUrl)) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [teamId, conferenceId, showConference, teamName, imageUrl]);

  const InitialsDisplay = () => {
    const initials = teamName
      ? (teamName.includes(" ")
          ? teamName
              .split(" ")
              .map((word) => word[0])
              .join("")
          : teamName.slice(0, 3)
        ).toUpperCase()
      : "-";

    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gray-100 text-gray-600 ${className}`}
      >
        <span
          className={`text-xs font-medium ${
            showConference ? "text-sm" : "text-xs"
          }`}
        >
          {initials}
        </span>
      </div>
    );
  };

  if (error || !imageUrl) {
    return <InitialsDisplay />;
  }

  return (
    <div className={className}>
      <img
        src={imageUrl}
        alt={`${teamName || "Team"} logo`}
        className="w-full h-full object-contain"
        onError={() => {
          console.error(`Image load error for ${teamName}`);
          setError(true);
        }}
      />
    </div>
  );
};

TeamLogo.clearCache = () => {
  logoCache.forEach((url) => URL.revokeObjectURL(url));
  logoCache.clear();
};

export default TeamLogo;
