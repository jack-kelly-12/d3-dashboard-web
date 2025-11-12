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

  let authToken = "";
  if (auth.currentUser) {
    try {
      authToken = await auth.currentUser.getIdToken();
    } catch (error) {
      console.warn("Failed to get auth token:", error);
      authToken = "";
    }
  }

  const defaultOptions = {
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken ? `Bearer ${authToken}` : "",
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
      error.status = response.status;
      error.statusText = response.statusText;
      error.data = errorData;
      throw error;
    }

    return response.json();
  } catch (error) {
    if (error.status) {
      throw error;
    }
    
    if (error.name === 'TypeError' && error.message.includes('CORS')) {
      const corsError = new Error("CORS error: Server is not allowing requests from this origin. Please check server configuration.");
      corsError.status = 0;
      corsError.originalError = error;
      throw corsError;
    }
    
    const networkError = new Error(
      error.message || "Network error. Please check your connection."
    );
    networkError.status = 0;
    networkError.originalError = error;
    throw networkError;
  }
};
