// ─────────────────────────────────────────────────────────────
// CRMS - Express API
// Ortam değişkenleri, güvenlik ve sağlık kontrolü
// ─────────────────────────────────────────────────────────────

// .env dosyasını oku (ilk satırda olsun)
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

// Ortam değişkenleri
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

// Railway/Proxy arkasında doğru IP algılamak için
app.set("trust proxy", 1);

// Güvenlik ve temel middleware'ler
app.use(helmet());
app.use(
  cors({
    origin: ALLOWED_ORIGIN, // Netlify domaini .env'den gelir
    credentials: true,
  })
);
app.use(express.json());

// Kök endpoint (opsiyonel bilgi)
app.get("/", (req, res) => {
  res.json({
    name: "crm-api",
    message: "API çalışıyor.",
    env: NODE_ENV,
  });
});

// Healthcheck
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "crm-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: NODE_ENV,
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: "Not Found",
    path: req.originalUrl,
  });
});

// Global hata yakalayıcı
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({
    ok: false,
    error: "Internal Server Error",
  });
});

// Sunucuyu dinlet
app.listen(PORT, () => {
  console.log(`crm-api dinliyor: http://localhost:${PORT} (${NODE_ENV})`);
  console.log(`CORS allowed origin: ${ALLOWED_ORIGIN}`);
});
