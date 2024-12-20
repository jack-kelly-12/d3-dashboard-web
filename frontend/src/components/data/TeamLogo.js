import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

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
    // Use conferenceId when showConference is true, otherwise use teamId
    const id = showConference ? conferenceId : teamId;
    if (!id) return;

    const getLogoUrl = async () => {
      try {
        const endpoint = showConference ? "conferences" : "teams";
        const response = await fetch(
          `${API_BASE_URL}/api/${endpoint}/logos/${id}.png`
        );
        if (!response.ok) throw new Error("Failed to load logo");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (err) {
        console.error(
          `Error loading ${showConference ? "conference" : "team"} logo:`,
          err
        );
        setError(true);
      }
    };

    getLogoUrl();

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [teamId, conferenceId, showConference, imageUrl]);

  const InitialsDisplay = () => {
    const name = showConference ? teamName : teamName;
    const initials =
      name
        ?.split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "??";

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

  if (
    error ||
    (!showConference && !teamId) ||
    (showConference && !conferenceId) ||
    !imageUrl
  ) {
    return <InitialsDisplay />;
  }

  return (
    <div className={className}>
      <img
        src={imageUrl}
        alt={`Logo for NCAA ${showConference ? "conference" : "team"}`}
        className="w-full h-full object-contain"
        onError={() => setError(true)}
      />
    </div>
  );
};

export default TeamLogo;
