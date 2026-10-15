require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("../config/db");

async function createTestUsers() {
  const testUsers = [
    {
      name: "Alpha Base Commander",
      email: "commander.alpha@test.local",
      password: "AlphaCommander@2026!",
      role: "BASE_COMMANDER",
      baseId: 1,
    },
    {
      name: "Bravo Logistics Officer",
      email: "logistics.officer@test.local",
      password: "BravoLogistics@2026!",
      role: "LOGISTICS_OFFICER",
      baseId: 2,
    },
  ];

  for (const user of testUsers) {
    const [existing] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [user.email],
    );

    if (existing.length > 0) {
      console.log(`${user.role} already exists; skipped.`);
      continue;
    }

    const hash = await bcrypt.hash(user.password, 12);

    await db.execute(
      `INSERT INTO users
       (name, email, password_hash, role, base_id)
       VALUES (?, ?, ?, ?, ?)`,
      [user.name, user.email, hash, user.role, user.baseId],
    );

    console.log(`${user.role} test account created.`);
  }
}

createTestUsers()
  .catch((error) => {
    console.error("Test user creation failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
