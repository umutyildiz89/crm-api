// CRMS - JWT yardımcıları
// Access/Refresh token üretimi ve refresh cookie yönetimi

const jwt = require("jsonwebtoken");

// .env'den süreleri al (örn. "15m", "7d")
const ACCESS_EXPIRES = process.env.TOKEN_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.REFRESH_EXPIRES_IN || "7d";

// Cookie ismi (refresh)
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || "crms_rft";

// Süre metnini saniyeye çevir (15m/7d/12h gibi)
function durationToSeconds(input, fallbackSeconds) {
  if (!input || typeof input !== "string") return fallbackSeconds;
  const m = input.trim().match(/^(\d+)([smhd])$/i);
  if (!m) return fallbackSeconds;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  switch (unit) {
    case "s": return n;
    case "m": return n * 60;
    case "h": return n * 60 * 60;
    case "d": return n * 24 * 60 * 60;
    default:  return fallbackSeconds;
  }
}

// Cookie maxAge (ms)
const refreshCookieMaxAgeMs = durationToSeconds(REFRESH_EXPIRES, 7 * 24 * 60 * 60) * 1000;

// Access token üret
function createAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
}

// Refresh token üret
function createRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

// Access token doğrula
function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Refresh token doğrula
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

// Refresh cookie seçenekleri (Cross-site için zorunlular)
function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: true,          // HTTPS zorunlu
    sameSite: "none",      // Netlify (farklı kaynak) için gerekli
    path: "/",             // tüm yollarda geçerli
    maxAge: refreshCookieMaxAgeMs,
  };
}

// Refresh cookie yaz
function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, getRefreshCookieOptions());
}

// Refresh cookie temizle
function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  getRefreshCookieOptions,
  REFRESH_COOKIE_NAME,
};
