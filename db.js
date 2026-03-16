import Database from "better-sqlite3";

const dbPath = process.env.DB_PATH || "data.sqlite";

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'both',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS list_items (
  list_id INTEGER NOT NULL,
  stremio_id TEXT NOT NULL,
  item_name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL,
  poster TEXT NOT NULL DEFAULT '',
  background TEXT NOT NULL DEFAULT '',
  logo TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  release_info TEXT NOT NULL DEFAULT '',
  genres_json TEXT NOT NULL DEFAULT '[]',
  added_at INTEGER NOT NULL,
  PRIMARY KEY(list_id, stremio_id),
  FOREIGN KEY(list_id) REFERENCES lists(id) ON DELETE CASCADE
);
`);

db.exec(`
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);
CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);
`);

function hasColumn(tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some((column) => column.name === columnName);
}

if (!hasColumn("users", "created_at")) {
  db.exec("ALTER TABLE users ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0");
  db.exec("UPDATE users SET created_at = 0 WHERE created_at IS NULL");
}

if (!hasColumn("lists", "created_at")) {
  db.exec("ALTER TABLE lists ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0");
  db.exec("UPDATE lists SET created_at = 0 WHERE created_at IS NULL");
}

if (!hasColumn("list_items", "item_name")) {
  db.exec("ALTER TABLE list_items ADD COLUMN item_name TEXT NOT NULL DEFAULT ''");
  db.exec("UPDATE list_items SET item_name = stremio_id WHERE item_name = '' OR item_name IS NULL");
}

if (!hasColumn("list_items", "poster")) {
  db.exec("ALTER TABLE list_items ADD COLUMN poster TEXT NOT NULL DEFAULT ''");
  db.exec("UPDATE list_items SET poster = '' WHERE poster IS NULL");
}

if (!hasColumn("list_items", "background")) {
  db.exec("ALTER TABLE list_items ADD COLUMN background TEXT NOT NULL DEFAULT ''");
  db.exec("UPDATE list_items SET background = '' WHERE background IS NULL");
}

if (!hasColumn("list_items", "logo")) {
  db.exec("ALTER TABLE list_items ADD COLUMN logo TEXT NOT NULL DEFAULT ''");
  db.exec("UPDATE list_items SET logo = '' WHERE logo IS NULL");
}

if (!hasColumn("list_items", "description")) {
  db.exec("ALTER TABLE list_items ADD COLUMN description TEXT NOT NULL DEFAULT ''");
  db.exec("UPDATE list_items SET description = '' WHERE description IS NULL");
}

if (!hasColumn("list_items", "release_info")) {
  db.exec("ALTER TABLE list_items ADD COLUMN release_info TEXT NOT NULL DEFAULT ''");
  db.exec("UPDATE list_items SET release_info = '' WHERE release_info IS NULL");
}

if (!hasColumn("list_items", "genres_json")) {
  db.exec("ALTER TABLE list_items ADD COLUMN genres_json TEXT NOT NULL DEFAULT '[]'");
  db.exec("UPDATE list_items SET genres_json = '[]' WHERE genres_json IS NULL OR genres_json = ''");
}
