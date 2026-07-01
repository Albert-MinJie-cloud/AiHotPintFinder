import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'sentinel.db');

const db: DatabaseType = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function migrateAddColumn(table: string, column: string, definition: string): void {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
  if (cols.some((c: any) => c.name === column)) return;
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`[DB] Added column ${table}.${column}`);
  } catch (err: any) {
    if (!err.message.includes('duplicate column')) throw err;
  }
}

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS keywords (
      id TEXT PRIMARY KEY,
      keyword TEXT NOT NULL UNIQUE,
      scope TEXT DEFAULT '',
      category TEXT DEFAULT '综合',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      last_checked_at TEXT
    );

    CREATE TABLE IF NOT EXISTS hot_spots (
      id TEXT PRIMARY KEY,
      keyword_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT,
      source TEXT,
      summary TEXT,
      content TEXT,
      is_authentic INTEGER DEFAULT 1,
      authenticity_score REAL DEFAULT 1.0,
      authenticity_reason TEXT,
      hot_score REAL DEFAULT 0,
      detected_at TEXT DEFAULT (datetime('now')),
      is_notified INTEGER DEFAULT 0,
      category TEXT DEFAULT '',
      platform TEXT DEFAULT '',
      trend TEXT DEFAULT '',
      relevance_score REAL DEFAULT 0,
      sentiment_score REAL DEFAULT 50,
      FOREIGN KEY (keyword_id) REFERENCES keywords(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      hot_spot_id TEXT,
      keyword_id TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (hot_spot_id) REFERENCES hot_spots(id),
      FOREIGN KEY (keyword_id) REFERENCES keywords(id)
    );

    CREATE TABLE IF NOT EXISTS historical_volume (
      id TEXT PRIMARY KEY,
      keyword_id TEXT NOT NULL,
      volume INTEGER DEFAULT 0,
      recorded_date TEXT NOT NULL,
      recorded_hour INTEGER DEFAULT -1,
      FOREIGN KEY (keyword_id) REFERENCES keywords(id),
      UNIQUE(keyword_id, recorded_date, recorded_hour)
    );

    CREATE INDEX IF NOT EXISTS idx_hist_vol_keyword ON historical_volume(keyword_id);
    CREATE INDEX IF NOT EXISTS idx_hist_vol_date ON historical_volume(recorded_date);

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_hot_spots_keyword_id ON hot_spots(keyword_id);
    CREATE INDEX IF NOT EXISTS idx_hot_spots_detected_at ON hot_spots(detected_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
  `);

  // Idempotent column migrations for old databases
  migrateAddColumn('keywords', 'category', "TEXT DEFAULT '综合'");
  migrateAddColumn('hot_spots', 'category', "TEXT DEFAULT ''");
  migrateAddColumn('hot_spots', 'platform', "TEXT DEFAULT ''");
  migrateAddColumn('hot_spots', 'trend', "TEXT DEFAULT ''");
  migrateAddColumn('hot_spots', 'relevance_score', 'REAL DEFAULT 0');
  migrateAddColumn('hot_spots', 'sentiment_score', 'REAL DEFAULT 50');
}

export default db;
