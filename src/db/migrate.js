const fs = require("fs").promises;
const path = require("path");
const { pool } = require("../config/db");
const migrationsPath = path.join(__dirname, "migrations");

async function migrate() {
  const client = await pool.connect();
  try {
    const lockKey = 1234567890;
    await client.query("SELECT pg_advisory_lock($1)", [lockKey]);
    await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
    const applied = new Set((await client.query("SELECT filename FROM schema_migrations ORDER BY filename")).rows.map((row) => row.filename));
    const files = (await fs.readdir(migrationsPath)).filter((file) => file.endsWith(".sql")).sort();
    for (const filename of files.filter((file) => !applied.has(file))) {
      await client.query("BEGIN");
      try {
        await client.query(await fs.readFile(path.join(migrationsPath, filename), "utf8"));
        await client.query("INSERT INTO schema_migrations(filename) VALUES ($1) ON CONFLICT DO NOTHING", [filename]);
        await client.query("COMMIT");
        console.log(`✅ Applied migration: ${filename}`);
      } catch (error) { await client.query("ROLLBACK"); throw error; }
    }
    if (files.every((file) => applied.has(file))) console.log("No pending migrations. Database is up to date.");
  } finally {
    try { await client.query("SELECT pg_advisory_unlock($1)", [1234567890]); } catch { /* ignore unlock errors */ }
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => { console.error("Migration failed:", error); process.exit(1); });
