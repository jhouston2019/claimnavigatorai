module.exports = function requireAdmin(event) {
  const header = event.headers["x-admin-email"] 
               || event.headers["X-Admin-Email"]
               || event.headers["X-ADMIN-EMAIL"];

  if (!header || header !== "claimnavigatorai@gmail.com") {
    return {
      authorized: false,
      error: { message: "Unauthorized", code: "CN-2000" }
    };
  }

  return { authorized: true };
};

