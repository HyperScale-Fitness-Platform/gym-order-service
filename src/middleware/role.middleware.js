function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { role } = req.user;
    if (!allowedRoles || allowedRoles.length === 0) return next();
    if (allowedRoles.includes(role)) return next();
    return res.status(403).json({ message: "Forbidden" });
  };
}

// keys: array of dot-paths to check for an owner id (e.g. ['params.user_id','body.user_id','params.trainerId'])
function authorizeSelfOrRole(
  allowedRoles = [],
  keys = [
    "params.user_id",
    "body.user_id",
    "params.userId",
    "params.trainerId",
  ],
) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { role, id: userId } = req.user;
    if (allowedRoles && allowedRoles.includes(role)) return next();

    // try to find an owner id in the request using the provided keys
    for (const key of keys) {
      const parts = key.split(".");
      let val = req;
      for (const p of parts) {
        if (val == null) break;
        val = val[p];
      }
      if (val != null && String(val) === String(userId)) return next();
    }

    return res.status(403).json({ message: "Forbidden" });
  };
}

module.exports = { authorize, authorizeSelfOrRole };
