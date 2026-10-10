require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env");
  }

  if (password.length < 3) {
    throw new Error("Admin password must be at least 12 characters.");
  }

  // Check if admin already exists
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    console.log("Admin account already exists.");
    return;
  }

  // Hash password securely
  const passwordHash = await bcrypt.hash(password, 12);

  // Create admin in PostgreSQL
  const admin = await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Admin account created: ${admin.username}`);
}

main()
  .catch((error) => {
    console.error("Error:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
