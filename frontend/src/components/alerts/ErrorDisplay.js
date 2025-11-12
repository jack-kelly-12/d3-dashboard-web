import React from 'react';
import { getErrorMessage, getErrorType, getErrorStyling } from '../../utils/errorUtils';

/**
 * Reusable error display component with consistent styling and actions
 * @param {Object} props
 * @param {Error} props.error - The error object from fetchAPI
 * @param {Object} props.context - Additional context for error handling
 * @param {Function} props.onRetry - Optional retry function
 * @param {Function} props.onSwitchToDivision3 - Optional function to switch to Division 3
 * @param {string} props.className - Additional CSS classes
 */
const ErrorDisplay = ({ 
  error, 
  context = {}, 
  onRetry, 
  onSwitchToDivision3,
  className = "" 
}) => {
  if (!error) return null;

  const errorMessage = getErrorMessage(error, context);
  const errorType = getErrorType(error);
  const styling = getErrorStyling(errorType);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-8 max-w-2xl mx-auto ${className}`}>
      <div className="flex items-center justify-center mb-4">
        <div className={`w-12 h-12 ${styling.bgColor} rounded-full flex items-center justify-center`}>
          {styling.icon}
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
        {styling.title}
      </h3>
      
      <p className="text-gray-600 mb-4 text-center">{errorMessage}</p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
      
      {errorType === 'auth' && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          <p>Please sign in to your account to access this data.</p>
        </div>
      )}
      
      {errorType === 'server' && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          <p>If this problem persists, please contact support.</p>
        </div>
      )}
      
      {errorType === 'network' && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          <p>Please check your internet connection and try again.</p>
        </div>
      )}
    </div>
  );
};

export default ErrorDisplay; 