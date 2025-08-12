/* CRMS — Prisma Seed
 * Yerelden çalıştırılır:  npx prisma db seed
 * Not: PlanetScale bağlantısı .env içindeki DATABASE_URL ile yapılır.
 */
require("dotenv").config();
const { PrismaClient, Role, Team, Subteam } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function hash(pwd) {
  return bcrypt.hash(pwd, SALT_ROUNDS);
}

async function main() {
  console.log("🔰 Seed başladı…");

  // 1) Kullanıcılar
  const defaultPassword = "Sardis!123"; // ilk kurulum için
  const users = [
    {
      email: "itadmin@crms.local",
      name: "IT",
      surname: "Admin",
      role: Role.IT_ADMIN,
      team: null,
      subteam: null,
    },
    {
      email: "genelmudur@crms.local",
      name: "Genel",
      surname: "Mudur",
      role: Role.GENEL_MUDUR,
      team: null,
      subteam: null,
    },
    {
      email: "mudur.a@crms.local",
      name: "Satis",
      surname: "MuduruA",
      role: Role.SATIS_MUDURU,
      team: Team.A,
      subteam: null,
    },
    {
      email: "gorevli.a1@crms.local",
      name: "Satici",
      surname: "A1",
      role: Role.SATIS_GOREVLISI,
      team: Team.A,
      subteam: Subteam.A1,
    },
    {
      email: "gorevli.a2@crms.local",
      name: "Satici",
      surname: "A2",
      role: Role.SATIS_GOREVLISI,
      team: Team.A,
      subteam: Subteam.A2,
    },
  ];

  const userMap = {};
  for (const u of users) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        surname: u.surname,
        role: u.role,
        team: u.team,
        subteam: u.subteam,
        passwordHash: await hash(defaultPassword),
      },
    });
    userMap[u.email] = created;
  }
  console.log("👥 Kullanıcılar hazır.");

  // 2) Müşteriler (örnek veriler)
  const customers = [
    {
      firstName: "Ahmet",
      lastName: "Yıldız",
      phoneE164: "+905309000001",
      ownerEmail: "gorevli.a1@crms.local",
      teamTag: Team.A,
      status: "Yeni",
      nextCallAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 gün sonra
      recallAt: null,
      notesSummary: "İlk görüşme olumlu.",
    },
    {
      firstName: "Ayşe",
      lastName: "Demir",
      phoneE164: "+905309000002",
      ownerEmail: "gorevli.a2@crms.local",
      teamTag: Team.A,
      status: "Takipte",
      nextCallAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 gün sonra
      recallAt: null,
      notesSummary: "Fiyat teklifi gönderildi.",
    },
    {
      firstName: "Mehmet",
      lastName: "Kaya",
      phoneE164: "+905309000003",
      ownerEmail: "gorevli.a1@crms.local",
      teamTag: Team.A,
      status: "Tekrar Aranacak",
      nextCallAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 gün sonra
      recallAt: null,
      notesSummary: "Karar için hafta sonu arama.",
    },
  ];

  const customerMap = {};
  for (const c of customers) {
    const owner = userMap[c.ownerEmail];
    const created = await prisma.customer.create({
      data: {
        firstName: c.firstName,
        lastName: c.lastName,
        phoneE164: c.phoneE164,
        ownerUserId: owner.id,
        teamTag: c.teamTag,
        status: c.status,
        nextCallAt: c.nextCallAt,
        recallAt: c.recallAt,
        notesSummary: c.notesSummary,
      },
    });
    customerMap[c.phoneE164] = created;
  }
  console.log("📇 Müşteriler eklendi.");

  // 3) Notlar
  const notes = [
    {
      phone: "+905309000001",
      authorEmail: "gorevli.a1@crms.local",
      content: "Ürün özellikleri anlatıldı, demo talep etti.",
    },
    {
      phone: "+905309000002",
      authorEmail: "gorevli.a2@crms.local",
      content: "İndirim talebi var, müdür onayı beklenecek.",
    },
    {
      phone: "+905309000003",
      authorEmail: "gorevli.a1@crms.local",
      content: "Tekrar arama için tarih belirlendi.",
    },
  ];

  for (const n of notes) {
    const customer = customerMap[n.phone];
    const author = userMap[n.authorEmail];
    if (!customer || !author) continue;

    await prisma.customerNote.create({
      data: {
        customerId: customer.id,
        authorUserId: author.id,
        content: n.content,
      },
    });
  }
  console.log("📝 Notlar eklendi.");

  console.log("✅ Seed tamamlandı.");
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
