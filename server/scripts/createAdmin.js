require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("../config/db");

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password || password.length < 12) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters) in .env",
    );
  }

  const [existing] = await db.execute("SELECT id FROM users WHERE email = ?", [
    email.toLowerCase(),
  ]);

  if (existing.length > 0) {
    console.log("Admin already exists; no changes made.");
    return;
  }

  const hash = await bcrypt.hash(password, 12);

  await db.execute(
    `INSERT INTO users (name, email, password_hash, role, base_id)
     VALUES (?, ?, ?, 'ADMIN', NULL)`,
    ["System Administrator", email.toLowerCase(), hash],
  );

  console.log("Admin account created successfully.");
}

createAdmin()
  .catch((error) => {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
