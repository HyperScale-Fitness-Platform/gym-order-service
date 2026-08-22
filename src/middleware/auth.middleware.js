function auth(req, res, next) {
  // Health checks are public and should not require gateway identity headers.
  if (req.path === "/health") {
    return next();
  }

  // Trust user-* headers from the gateway; no re-verification needed.
  // These headers are only set by the gateway and inaccessible from outside the cluster.
  const userId = req.headers["user-id"];
  const userEmail = req.headers["user-email"];
  const userRole = req.headers["user-role"];

  if (!userId) {
    return res.status(401).json({ message: "User ID header is required" });
  }

  req.user = { id: userId, email: userEmail, role: userRole };
  next();
}

module.exports = auth;
