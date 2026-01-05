/**
 * Admin Authentication Middleware (Nuclear Fix)
 * Ensures admin access without needing browser headers.
 */

const ADMIN_EMAIL = "Claim Navigator@gmail.com";

module.exports = function requireAdmin(event, injectedEmail = null) {
  const headers = event.headers || {};

  // Accept injected admin email OR header
  const adminHeader =
    injectedEmail ||
    headers["x-admin-email"] ||
    headers["x-admin-email".toLowerCase()];

  if (!adminHeader) {
    return {
      authorized: false,
      error: { code: "CN-2000", message: "Missing admin authentication header" }
    };
  }

  if (adminHeader.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return {
      authorized: false,
      error: { code: "CN-2001", message: "Unauthorized admin email" }
    };
  }

  return { authorized: true, error: null };
};
