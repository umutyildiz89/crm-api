// CRMS - Prisma Client (singleton)
const { PrismaClient } = require("@prisma/client");

// Tek instance olsun (hot-reload vs. sorun çıkmasın)
let prisma;
if (!global.__prisma) {
  global.__prisma = new PrismaClient();
}
prisma = global.__prisma;

module.exports = { prisma };
