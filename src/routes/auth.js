// CRMS - Auth Routes: login, refresh, logout, me
const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

const { prisma } = require("../lib/prisma");
const {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  REFRESH_COOKIE_NAME,
} = require("../lib/jwt");
const { requireAuth } = require("../middleware/auth");

// Token payload'ı
function userToPayload(u) {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    team: u.team,
    subteam: u.subteam,
    name: u.name,
    surname: u.surname,
  };
}

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email ve şifre zorunlu" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ ok: false, error: "Geçersiz kimlik" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ ok: false, error: "Geçersiz kimlik" });

    const payload = userToPayload(user);
    const accessToken = createAccessToken(payload);
    const refreshToken = createRefreshToken({ id: user.id, t: "r" });

    // Refresh cookie yaz
    setRefreshCookie(res, refreshToken);

    // Son giriş zamanı
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return res.json({ ok: true, accessToken, user: payload });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) return res.status(401).json({ ok: false, error: "Refresh token yok" });

    let decoded;
    try {
      decoded = verifyRefreshToken(token); // { id, t: 'r', iat, exp }
    } catch {
      return res.status(401).json({ ok: false, error: "Refresh token geçersiz" });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive) {
      return res.status(401).json({ ok: false, error: "Kullanıcı pasif" });
    }

    const payload = userToPayload(user);
    const accessToken = createAccessToken(payload);

    // Refresh rotasyonu (opsiyonel ama iyi pratik)
    const newRefresh = createRefreshToken({ id: user.id, t: "r" });
    setRefreshCookie(res, newRefresh);

    return res.json({ ok: true, accessToken, user: payload });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  clearRefreshCookie(res);
  return res.json({ ok: true });
});

// GET /api/me (access token zorunlu)
router.get("/me", requireAuth, async (req, res) => {
  return res.json({ ok: true, user: req.user });
});

module.exports = router;
