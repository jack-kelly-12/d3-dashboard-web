export const getAuthErrorMessage = (error) => {
  const errorMap = {
    "auth/popup-closed-by-user": "Sign in was cancelled. Please try again.",
    "auth/popup-blocked":
      "Pop-up was blocked by your browser. Please allow pop-ups for this site.",
    "auth/cancelled-popup-request": "Another sign in attempt is in progress.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Invalid email or password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/network-request-failed":
      "Network error. Please check your connection.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/operation-not-allowed": "This sign-in method is not enabled.",
    "auth/expired-action-code": "Sign in link has expired.",
    "auth/invalid-action-code": "Invalid sign in link.",
  };

  if (error?.code) {
    return (
      errorMap[error.code] || "An unexpected error occurred. Please try again."
    );
  }

  return error?.message || "An unexpected error occurred. Please try again.";
};
