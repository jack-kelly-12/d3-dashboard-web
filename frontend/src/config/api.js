const getBaseUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8000";
  }
  return "https://www.d3-dashboard.com";
};

export const API_BASE_URL = getBaseUrl();

export const fetchAPI = async (endpoint, options = {}) => {
  const normalizedEndpoint = endpoint.startsWith("/api/")
    ? endpoint
    : `/api${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  const defaultOptions = {
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (options.body instanceof FormData) {
    delete defaultOptions.headers["Content-Type"];
  }

  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, fetchOptions);

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
