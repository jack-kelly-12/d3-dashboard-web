const getBaseUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8000";
  }
  return "https://www.d3-dashboard.com";
};

export const API_BASE_URL = getBaseUrl();

export const fetchAPI = async (endpoint) => {
  const normalizedEndpoint = endpoint.startsWith("/api/")
    ? endpoint
    : `/api${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `API call failed: ${response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};
