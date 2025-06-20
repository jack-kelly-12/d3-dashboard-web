import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { API_BASE_URL } from "../../config/api";

const logoCache = new Map();
const prefetchRegistry = new Set();

export const preloadLogos = (ids, areConferences = false) => {
  if (!ids || !ids.length) return Promise.resolve();

  const idsToFetch = ids.filter((id) => {
    if (!id) return false;
    const endpoint = areConferences ? "conferences" : "teams";
    const cacheKey = `${endpoint}_${id}`;
    return !prefetchRegistry.has(cacheKey) && !logoCache.has(cacheKey);
  });

  if (!idsToFetch.length) return Promise.resolve();

  idsToFetch.forEach((id) => {
    const endpoint = areConferences ? "conferences" : "teams";
    const cacheKey = `${endpoint}_${id}`;
    prefetchRegistry.add(cacheKey);
  });

  const preloadSingleLogo = (id) => {
    return new Promise((resolve) => {
      const endpoint = areConferences ? "conferences" : "teams";
      const cacheKey = `${endpoint}_${id}`;

      if (logoCache.has(cacheKey)) {
        resolve();
        return;
      }

      const url = `${API_BASE_URL}/api/${endpoint}/logos/${id}.png`;

      fetch(url, {
        priority: "low",
        cache: "force-cache",
      })
        .then((response) => {
          if (!response.ok) throw new Error("Logo not found");
          return response.blob();
        })
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          logoCache.set(cacheKey, objectUrl);
          resolve();
        })
        .catch(() => {
          resolve();
        });
    });
  };

  const BATCH_SIZE = 5;
  const batches = [];

  for (let i = 0; i < idsToFetch.length; i += BATCH_SIZE) {
    const batch = idsToFetch.slice(i, i + BATCH_SIZE).map(preloadSingleLogo);
    batches.push(Promise.all(batch));
  }

  return batches.reduce(
    (promise, batch) => promise.then(() => batch),
    Promise.resolve()
  );
};

const TeamLogo = ({
  teamId,
  conferenceId,
  teamName,
  showConference = false,
  className = "",
  placeholder = null,
  priority = false,
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const currentRequestRef = useRef(null);
  const isMounted = useRef(true);
  const imageRef = useRef(null);

  const { id, endpoint, cacheKey } = useMemo(() => {
    const id = showConference ? conferenceId : teamId;
    const endpoint = showConference ? "conferences" : "teams";
    const cacheKey = `${endpoint}_${id}`;
    return { id, endpoint, cacheKey };
  }, [teamId, conferenceId, showConference]);

  const initials = useMemo(() => {
    if (!teamName) return "-";

    return (
      teamName.includes(" ")
        ? teamName
            .split(" ")
            .map((word) => word?.[0] || "")
            .join("")
            .slice(0, 3)
        : teamName.slice(0, 3)
    ).toUpperCase();
  }, [teamName]);

  const handleImageError = useCallback(() => {
    console.error(`Image load error for ${teamName}`);
    setError(true);
    setIsLoading(false);

    if (logoCache.has(cacheKey)) {
      const urlToRevoke = logoCache.get(cacheKey);
      URL.revokeObjectURL(urlToRevoke);
      logoCache.delete(cacheKey);
    }
  }, [cacheKey, teamName]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    isMounted.current = true;

    if (!id) {
      setError(true);
      setImageUrl(null);
      setIsLoading(false);
      return;
    }

    setError(false);
    setIsLoading(true);

    if (currentRequestRef.current) {
      currentRequestRef.current.cancelled = true;
    }

    const thisRequest = { cancelled: false };
    currentRequestRef.current = thisRequest;

    if (logoCache.has(cacheKey)) {
      setImageUrl(logoCache.get(cacheKey));
      setIsLoading(false);
      return;
    }

    if (prefetchRegistry.has(cacheKey)) {
      const checkCacheInterval = setInterval(() => {
        if (
          logoCache.has(cacheKey) &&
          isMounted.current &&
          !thisRequest.cancelled
        ) {
          setImageUrl(logoCache.get(cacheKey));
          setIsLoading(false);
          clearInterval(checkCacheInterval);
        }
      }, 100);

      const timeoutId = setTimeout(() => {
        clearInterval(checkCacheInterval);
        if (isMounted.current && !thisRequest.cancelled) {
          loadImage();
        }
      }, 2000);

      return () => {
        clearInterval(checkCacheInterval);
        clearTimeout(timeoutId);
      };
    }

    loadImage();

    function loadImage() {
      const url = `${API_BASE_URL}/api/${endpoint}/logos/${id}.png`;

      const fetchOptions = {
        cache: "no-cache",
        priority: priority ? "high" : "auto",
      };

      fetch(url, fetchOptions)
        .then((response) => {
          if (thisRequest.cancelled) return null;
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.blob();
        })
        .then((blob) => {
          if (!blob || thisRequest.cancelled || !isMounted.current) return;

          const objectUrl = URL.createObjectURL(blob);
          logoCache.set(cacheKey, objectUrl);

          if (!thisRequest.cancelled && isMounted.current) {
            setImageUrl(objectUrl);
          }
        })
        .catch((err) => {
          if (thisRequest.cancelled || !isMounted.current) return;
          console.error(`Error loading logo for ${teamName} (id: ${id}):`, err);
          setError(true);
          setIsLoading(false);
        });
    }

    return () => {
      thisRequest.cancelled = true;
      isMounted.current = false;
    };
  }, [id, endpoint, cacheKey, teamName, priority]);

  const InitialsDisplay = useMemo(
    () => (
      <div
        className={`flex items-center justify-center rounded-full bg-gray-100 text-gray-600 ${className}`}
        aria-label={`${teamName || "Team"} logo placeholder`}
      >
        <span className={`font-medium text-xs}`}>{initials}</span>
      </div>
    ),
    [initials, className, teamName]
  );

  const PlaceholderDisplay = placeholder || InitialsDisplay;

  if (error || !imageUrl) {
    return PlaceholderDisplay;
  }

  return (
    <div className={className} style={{ position: "relative" }}>
      {isLoading && (
        <div
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {PlaceholderDisplay}
        </div>
      )}

      <img
        ref={imageRef}
        src={imageUrl}
        alt={`${teamName || "Team"} logo`}
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority ? "eager" : "lazy"}
        fetchpriority={priority ? "high" : "auto"}
        decoding="async"
      />
    </div>
  );
};

TeamLogo.clearCache = () => {
  logoCache.forEach((url) => URL.revokeObjectURL(url));
  logoCache.clear();
  prefetchRegistry.clear();
};

TeamLogo.preloadLogos = preloadLogos;

export default TeamLogo;
