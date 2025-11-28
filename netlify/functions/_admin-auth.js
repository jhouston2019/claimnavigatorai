/**
 * Shared Admin Authentication Middleware
 * Validates admin access for protected monitoring functions
 */

module.exports = function requireAdmin(request) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const requestEmail =
    request.headers["x-admin-email"] ||
    request.headers["x-user-email"] ||
    null;

  if (!requestEmail || requestEmail !== adminEmail) {
    return {
      authorized: false,
      error: {
        message: "Unauthorized",
        code: "CN-2000"
      }
    };
  }

  return { authorized: true };
};

