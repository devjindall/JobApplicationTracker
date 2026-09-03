import React from 'react';

/**
 * ProtectedRoute Component
 * Ensures only authenticated users with a valid token can access the protected view.
 * If unauthenticated, navigates to the login page.
 */
export default function ProtectedRoute({ isAuthenticated, onRedirectLogin, children }) {
  if (!isAuthenticated) {
    onRedirectLogin();
    return null;
  }

  return <>{children}</>;
}
