import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { API_BASE_URL } from "../../config/api";

// Global cache for all logo URLs
const logoCache = new Map();

// Global prefetch registry to track which logos have been requested
const prefetchRegistry = new Set();

/**
 * Preload a batch of logos in the background
 * @param {string[]} ids - Array of team or conference IDs
 * @param {boolean} areConferences - Whether these are conference IDs
 * @returns {Promise<void>} - Promise that resolves when all logos are preloaded
 */
export const preloadLogos = (ids, areConferences = false) => {
  if (!ids || !ids.length) return Promise.resolve();

  // Filter out IDs that have already been prefetched or are in cache
  const idsToFetch = ids.filter((id) => {
    if (!id) return false;
    const endpoint = areConferences ? "conferences" : "teams";
    const cacheKey = `${endpoint}_${id}`;
    return !prefetchRegistry.has(cacheKey) && !logoCache.has(cacheKey);
  });

  if (!idsToFetch.length) return Promise.resolve();

  // Mark these IDs as being prefetched
  idsToFetch.forEach((id) => {
    const endpoint = areConferences ? "conferences" : "teams";
    const cacheKey = `${endpoint}_${id}`;
    prefetchRegistry.add(cacheKey);
  });

  // Create an image request helper that handles the loading
  const preloadSingleLogo = (id) => {
    return new Promise((resolve) => {
      const endpoint = areConferences ? "conferences" : "teams";
      const cacheKey = `${endpoint}_${id}`;

      // If already in cache, just resolve
      if (logoCache.has(cacheKey)) {
        resolve();
        return;
      }

      const url = `${API_BASE_URL}/api/${endpoint}/logos/${id}.png`;

      // Use low priority fetch to avoid blocking more important resources
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
          // Even if it fails, we've tried prefetching, so resolve anyway
          resolve();
        });
    });
  };

  // Process logos in batches to avoid too many concurrent requests
  const BATCH_SIZE = 5;
  const batches = [];

  for (let i = 0; i < idsToFetch.length; i += BATCH_SIZE) {
    const batch = idsToFetch.slice(i, i + BATCH_SIZE).map(preloadSingleLogo);
    batches.push(Promise.all(batch));
  }

  // Execute batches sequentially to reduce load
  return batches.reduce(
    (promise, batch) => promise.then(() => batch),
    Promise.resolve()
  );
};

/**
 * Advanced TeamLogo component with optimized loading
 */
const TeamLogo = ({
  teamId,
  conferenceId,
  teamName,
  showConference = false,
  className = "",
  placeholder = null, // Optional custom placeholder
  priority = false, // Whether this is a high-priority image
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const currentRequestRef = useRef(null);
  const isMounted = useRef(true);
  const imageRef = useRef(null);

  // Generate loading state identifiers
  const { id, endpoint, cacheKey } = useMemo(() => {
    const id = showConference ? conferenceId : teamId;
    const endpoint = showConference ? "conferences" : "teams";
    const cacheKey = `${endpoint}_${id}`;
    return { id, endpoint, cacheKey };
  }, [teamId, conferenceId, showConference]);

  // Generate initials only once for consistency
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

  // Handle image errors (memoized to prevent recreation on each render)
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

  // Handle successful image load
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Fetch or retrieve the logo
  useEffect(() => {
    // Reset mounted ref on component mount
    isMounted.current = true;

    // Early exit for invalid ID
    if (!id) {
      setError(true);
      setImageUrl(null);
      setIsLoading(false);
      return;
    }

    // Reset states for new image request
    setError(false);
    setIsLoading(true);

    // Cancel any in-flight request
    if (currentRequestRef.current) {
      currentRequestRef.current.cancelled = true;
    }

    // Create new request tracker
    const thisRequest = { cancelled: false };
    currentRequestRef.current = thisRequest;

    // Fast path - use cached logo if available
    if (logoCache.has(cacheKey)) {
      setImageUrl(logoCache.get(cacheKey));
      setIsLoading(false); // Still need to transition, but don't show loading state
      return;
    }

    // If the image is already loading in a prefetch, don't start another request
    if (prefetchRegistry.has(cacheKey)) {
      // Poll the cache until the prefetch completes or times out
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

      // Set a timeout to avoid indefinite polling
      const timeoutId = setTimeout(() => {
        clearInterval(checkCacheInterval);
        if (isMounted.current && !thisRequest.cancelled) {
          // If prefetch is taking too long, load it directly
          loadImage();
        }
      }, 2000);

      return () => {
        clearInterval(checkCacheInterval);
        clearTimeout(timeoutId);
      };
    }

    // Load the image directly
    loadImage();

    function loadImage() {
      const url = `${API_BASE_URL}/api/${endpoint}/logos/${id}.png`;

      // Use fetch priority based on the priority prop
      const fetchOptions = {
        cache: "no-cache", // Ensure we're getting a fresh response
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

          // Only update state if this is still the current request
          if (!thisRequest.cancelled && isMounted.current) {
            setImageUrl(objectUrl);
            // Loading state will be turned off by the onLoad handler
          }
        })
        .catch((err) => {
          if (thisRequest.cancelled || !isMounted.current) return;
          console.error(`Error loading logo for ${teamName} (id: ${id}):`, err);
          setError(true);
          setIsLoading(false);
        });
    }

    // Cleanup function
    return () => {
      thisRequest.cancelled = true;
      isMounted.current = false;
    };
  }, [id, endpoint, cacheKey, teamName, priority]);

  // Render the initials placeholder
  const InitialsDisplay = useMemo(
    () => (
      <div
        className={`flex items-center justify-center rounded-full bg-gray-100 text-gray-600 ${className}`}
        aria-label={`${teamName || "Team"} logo placeholder`}
      >
        <span className={`font-medium text-xs}`}>{initials}</span>
      </div>
    ),
    [initials, className, showConference, teamName]
  );

  // Custom placeholder if provided
  const PlaceholderDisplay = placeholder || InitialsDisplay;

  // If we have an error or no image URL, show the placeholder
  if (error || !imageUrl) {
    return PlaceholderDisplay;
  }

  // Show the image with a transition effect
  return (
    <div className={className} style={{ position: "relative" }}>
      {/* Always show placeholder while loading for instant visual */}
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

// Static methods
TeamLogo.clearCache = () => {
  logoCache.forEach((url) => URL.revokeObjectURL(url));
  logoCache.clear();
  prefetchRegistry.clear();
};

// Add preloading ability to component
TeamLogo.preloadLogos = preloadLogos;

export default TeamLogo;
