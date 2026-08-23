/**
 * Think Lab. - Database Engine (SQLite Native)
 * High-performance, zero-latency local persistent storage
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'thinklab.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for high concurrency & integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Tables
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      services TEXT,
      budget TEXT,
      timeline TEXT,
      details TEXT,
      status TEXT DEFAULT 'new',
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS roi_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      traffic INTEGER NOT NULL,
      ticket_gs INTEGER NOT NULL,
      conversion_rate REAL NOT NULL,
      projected_conversion_rate REAL NOT NULL,
      current_monthly_revenue_gs INTEGER NOT NULL,
      projected_monthly_revenue_gs INTEGER NOT NULL,
      extra_annual_revenue_gs INTEGER NOT NULL,
      multiplier REAL NOT NULL,
      contact_email TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      source TEXT DEFAULT 'footer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT,
      user_agent TEXT,
      referrer TEXT,
      path TEXT DEFAULT '/',
      device_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      client_phone TEXT,
      meeting_date TEXT NOT NULL,
      meeting_time TEXT NOT NULL,
      topic TEXT,
      status TEXT DEFAULT 'confirmed',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      user_message TEXT,
      bot_response TEXT,
      intent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_visits_created ON site_visits(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(meeting_date DESC);
  `);

  console.log('⚡ [DB] SQLite Database initialized & schema migrated successfully at:', dbPath);
}

initSchema();

module.exports = {
  db,
  // Helper to query all rows
  all(query, params = []) {
    const stmt = db.prepare(query);
    return stmt.all(...params);
  },
  // Helper to query single row
  get(query, params = []) {
    const stmt = db.prepare(query);
    return stmt.get(...params);
  },
  // Helper to run insert / update / delete
  run(query, params = []) {
    const stmt = db.prepare(query);
    return stmt.run(...params);
  }
};
