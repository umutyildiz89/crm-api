// CRMS - Auth middleware'ları (access token doğrulama + role guard)
const { verifyAccessToken } = require("../lib/jwt");

// Bearer access token zorunlu
function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = payload; // {id,email,role,team,subteam,name,surname}
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }
}

// Role kontrolü
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "Unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
