module.exports = function requireAdmin(event) {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const incoming = event.headers['x-admin-email'];

  if (!incoming || incoming !== ADMIN_EMAIL) {
    return {
      authorized: false,
      error: { message: "Unauthorized", code: "CN-2000" }
    };
  }

  return { authorized: true };
};

