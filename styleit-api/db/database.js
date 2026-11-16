import { DatabaseSync } from 'node:sqlite'
import { DB_FILE } from '../config.js'

// One shared connection. The tables are created the first time the app runs.
const db = new DatabaseSync(DB_FILE)
db.exec('PRAGMA foreign_keys = ON')
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  pw_hash TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  provider TEXT NOT NULL DEFAULT 'password',
  seller INTEGER NOT NULL DEFAULT 0,
  shop TEXT NOT NULL DEFAULT '',
  joined TEXT NOT NULL,
  warns INTEGER NOT NULL DEFAULT 0,
  suspended INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  grp TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  sold INTEGER NOT NULL DEFAULT 0 CHECK (sold >= 0),
  img TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS cart_items (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL CHECK (qty >= 1),
  PRIMARY KEY (user_id, product_id)
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,                    -- order numbers start at 1001
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  seller_id INTEGER NOT NULL REFERENCES users(id),
  total INTEGER NOT NULL,
  status INTEGER NOT NULL DEFAULT 0,         -- 0 placed ... 5 delivered
  cancelled INTEGER NOT NULL DEFAULT 0,
  pay_label TEXT NOT NULL,
  paid INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS order_items (     -- a copy of name and price at purchase time
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  qty INTEGER NOT NULL CHECK (qty >= 1)
);
CREATE TABLE IF NOT EXISTS order_events (    -- when each step happened
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  at TEXT NOT NULL,
  PRIMARY KEY (order_id, step)
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  UNIQUE (product_id, buyer_id)
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  icon TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  act TEXT NOT NULL DEFAULT '',
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS reset_codes (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);
`)

// All-or-nothing: if anything inside throws, every change inside is undone.
export function transaction(fn) {
  db.exec('BEGIN')
  try { const r = fn(); db.exec('COMMIT'); return r }
  catch (e) { db.exec('ROLLBACK'); throw e }
}
export default db
