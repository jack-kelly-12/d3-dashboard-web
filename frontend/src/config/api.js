import { getAuth } from "firebase/auth";

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
  const auth = getAuth();

  const defaultOptions = {
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth.currentUser
        ? `Bearer ${await auth.currentUser.getIdToken()}`
        : "",
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
      const error = new Error(
        errorData?.error || errorData?.message || `API call failed: ${response.statusText}`
      );
      // Preserve the status code for better error handling
      error.status = response.status;
      error.statusText = response.statusText;
      error.data = errorData;
      throw error;
    }

    return response.json();
  } catch (error) {
    // If it's already our custom error with status, re-throw it
    if (error.status) {
      throw error;
    }
    // For network errors or other issues, create a generic error
    const networkError = new Error(
      error.message || "Network error. Please check your connection."
    );
    networkError.status = 0; // 0 indicates network error
    networkError.originalError = error;
    throw networkError;
  }
};
