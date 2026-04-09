const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'vault.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      totp_secret TEXT,
      totp_enabled INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_check_in DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dead_switch_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      check_in_interval_days INTEGER DEFAULT 30 CHECK(check_in_interval_days BETWEEN 1 AND 365),
      grace_period_days INTEGER DEFAULT 7 CHECK(grace_period_days BETWEEN 1 AND 90),
      is_active INTEGER DEFAULT 0,
      switch_triggered INTEGER DEFAULT 0,
      switch_triggered_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS beneficiaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      relationship TEXT,
      access_token TEXT UNIQUE,
      token_expires_at DATETIME,
      emergency_access_requested INTEGER DEFAULT 0,
      emergency_access_requested_at DATETIME,
      emergency_waiting_days INTEGER DEFAULT 7 CHECK(emergency_waiting_days BETWEEN 1 AND 90),
      access_granted INTEGER DEFAULT 0,
      access_granted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vault_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      section TEXT NOT NULL,
      title TEXT NOT NULL,
      fields_encrypted TEXT NOT NULL,
      notes_encrypted TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      detail TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_vault_entries_user_section ON vault_entries(user_id, section);
    CREATE INDEX IF NOT EXISTS idx_vault_entries_user ON vault_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_beneficiaries_user ON beneficiaries(user_id);
    CREATE INDEX IF NOT EXISTS idx_beneficiaries_token ON beneficiaries(access_token);
    CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
  `);

  // Add columns to existing tables if missing (safe migration)
  const cols = db.prepare("PRAGMA table_info(beneficiaries)").all().map(c => c.name);
  if (!cols.includes('token_expires_at')) {
    db.exec('ALTER TABLE beneficiaries ADD COLUMN token_expires_at DATETIME');
  }
  const userCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  if (!userCols.includes('totp_secret')) {
    db.exec('ALTER TABLE users ADD COLUMN totp_secret TEXT');
    db.exec('ALTER TABLE users ADD COLUMN totp_enabled INTEGER DEFAULT 0');
  }
}

function audit(userId, action, targetType, targetId, detail, ip) {
  try {
    getDb().prepare(
      'INSERT INTO audit_log (user_id, action, target_type, target_id, detail, ip_address) VALUES (?,?,?,?,?,?)'
    ).run(userId, action, targetType || null, targetId || null, detail || null, ip || null);
  } catch { /* never let audit failure break the app */ }
}

module.exports = { getDb, audit };
