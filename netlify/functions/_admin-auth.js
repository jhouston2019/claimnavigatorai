/**
 * Admin Authentication Middleware
 * Ensures only the configured admin can access protected monitoring endpoints.
 */

const ADMIN_EMAIL = "claimnavigatorai@gmail.com";

module.exports = function requireAdmin(event) {
  // Netlify always lowercases header keys
  const headers = event.headers || {};

  // Support all reasonable variations to be safe
  const adminHeader =
    headers["x-admin-email"] ||
    headers["X-Admin-Email"] ||
    headers["X-ADMIN-EMAIL"] ||
    headers["x-admin-email".toLowerCase()];

  if (!adminHeader) {
    return {
      authorized: false,
      error: {
        code: "CN-2000",
        message: "Missing admin authentication header"
      }
    };
  }

  if (adminHeader !== ADMIN_EMAIL) {
    return {
      authorized: false,
      error: {
        code: "CN-2001",
        message: "Unauthorized admin email"
      }
    };
  }

  return {
    authorized: true,
    error: null
  };
};
