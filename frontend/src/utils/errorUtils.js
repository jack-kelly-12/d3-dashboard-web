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
  const { division, dataType, endpoint } = context;
  
  // Handle different HTTP status codes
  if (error.status === 401) {
    return "Authentication required. Please sign in to access this data.";
  }
  
  if (error.status === 403) {
    if (division === 1 || division === 2) {
      return "Premium subscription required to access Division 1 and 2 data. Please upgrade your subscription or switch to Division 3.";
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
 * Check if an error is related to premium access restrictions
 * @param {Error} error - The error object
 * @returns {boolean} True if it's a premium access error
 */
export const isPremiumAccessError = (error) => {
  return error.status === 403 && 
         (error.message?.includes("Premium subscription required") || 
          error.message?.includes("Access denied"));
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
 * @returns {string} Error type ('premium', 'auth', 'server', 'network', 'other')
 */
export const getErrorType = (error) => {
  if (isPremiumAccessError(error)) return 'premium';
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
    premium: {
      icon: (
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-600",
      title: "Premium Access Required"
    },
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