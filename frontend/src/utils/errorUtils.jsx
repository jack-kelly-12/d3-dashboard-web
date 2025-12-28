/**
 * Utility functions for handling API errors consistently across the application
 */

/**
 * Get a user-friendly error message based on the error status and context
 * @param {Error} error - The error object from fetchAPI
 * @param {Object} context - Additional context (e.g., { division: 1, dataType: 'player_hitting' })
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, context = {}) => {
  const { division } = context;
  
  // Handle different HTTP status codes
  if (error.status === 401) {
    return "Authentication required. Please sign in to access this data.";
  }
  
  if (error.status === 403) {
    if (division === 1 || division === 2) {
      return "Division 1 and 2 data access is currently limited. Please switch to Division 3 for full access.";
    } else {
      return "Access denied. You don't have permission to view this data.";
    }
  }
  
  if (error.status === 404) {
    return "The requested data was not found.";
  }
  
  if (error.status >= 500) {
    return "Server error. Please try again later or contact support if the problem persists.";
  }
  
  if (error.status === 0) {
    return "Network error. Please check your connection and try again.";
  }
  
  // Fallback to the error message from the API or a generic message
  return error.message || "An unexpected error occurred. Please try again.";
};


/**
 * Check if an error is related to authentication
 * @param {Error} error - The error object
 * @returns {boolean} True if it's an authentication error
 */
export const isAuthenticationError = (error) => {
  return error.status === 401;
};

/**
 * Check if an error is a server error
 * @param {Error} error - The error object
 * @returns {boolean} True if it's a server error
 */
export const isServerError = (error) => {
  return error.status >= 500;
};

/**
 * Check if an error is a network error
 * @param {Error} error - The error object
 * @returns {boolean} True if it's a network error
 */
export const isNetworkError = (error) => {
  return error.status === 0;
};

/**
 * Get error type for UI styling
 * @param {Error} error - The error object
 * @returns {string} Error type ('auth', 'server', 'network', 'other')
 */
export const getErrorType = (error) => {
  if (isAuthenticationError(error)) return 'auth';
  if (isServerError(error)) return 'server';
  if (isNetworkError(error)) return 'network';
  return 'other';
};

/**
 * Get error icon and styling based on error type
 * @param {string} errorType - The type of error
 * @returns {Object} Object with icon, background, and text colors
 */
export const getErrorStyling = (errorType) => {
  const styles = {
    auth: {
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
      title: "Authentication Required"
    },
    server: {
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: "bg-red-100",
      textColor: "text-red-600",
      title: "Server Error"
    },
    network: {
      icon: (
        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
      bgColor: "bg-orange-100",
      textColor: "text-orange-600",
      title: "Network Error"
    },
    other: {
      icon: (
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: "bg-gray-100",
      textColor: "text-gray-600",
      title: "Error"
    }
  };
  
  return styles[errorType] || styles.other;
}; 