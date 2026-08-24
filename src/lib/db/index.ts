import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { COLDSTART } from "./coldstart";

declare global {
  // eslint-disable-next-line no-var
  var __surveyDb: Database.Database | undefined;
}

function createDb(): Database.Database {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(path.join(dataDir, "app.db"));
  db.pragma("journal_mode = WAL");
  initSchema(db);
  seedIfEmpty(db);
  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      reward INTEGER NOT NULL CHECK (reward >= 0)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_surveys_date ON surveys(date);

    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      predicted_interval REAL NOT NULL,
      predicted_date TEXT NOT NULL,
      predicted_reward REAL NOT NULL,
      range_low_days REAL NOT NULL,
      range_high_days REAL NOT NULL,
      range_low_reward REAL NOT NULL,
      range_high_reward REAL NOT NULL,
      reliability_arrival REAL NOT NULL,
      reliability_reward REAL NOT NULL,
      model_version_arrival TEXT NOT NULL,
      model_version_reward TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      actual_date TEXT,
      actual_reward REAL,
      arrival_error REAL,
      reward_error REAL
    );

    CREATE TABLE IF NOT EXISTS model_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target TEXT NOT NULL CHECK (target IN ('arrival','reward')),
      algorithm TEXT NOT NULL,
      metrics_json TEXT NOT NULL,
      trained_at TEXT NOT NULL,
      dataset_size INTEGER NOT NULL,
      features_used INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

function seedIfEmpty(db: Database.Database): void {
  const count = (db.prepare("SELECT COUNT(*) AS c FROM surveys").get() as { c: number }).c;
  const seeded = db
    .prepare("SELECT value FROM settings WHERE key = 'seeded'")
    .get() as { value: string } | undefined;
  if (count === 0 && !seeded) {
    const insert = db.prepare("INSERT INTO surveys (date, reward) VALUES (?, ?)");
    const tx = db.transaction(() => {
      for (const row of COLDSTART) insert.run(row.date, row.reward);
      db.prepare("INSERT INTO settings (key, value) VALUES ('seeded', '1')").run();
    });
    tx();
  }
}

export function getDb(): Database.Database {
  if (!globalThis.__surveyDb) {
    globalThis.__surveyDb = createDb();
  }
  return globalThis.__surveyDb;
}
