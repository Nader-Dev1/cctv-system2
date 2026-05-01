const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'cctv.db'));

db.exec(`CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, brand TEXT, model TEXT, buy_price REAL DEFAULT 0, sell_price REAL DEFAULT 0, quantity INTEGER DEFAULT 0, min_quantity INTEGER DEFAULT 5, description TEXT, created_at TEXT DEFAULT (datetime('now')))`);

db.exec(`CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, email TEXT, address TEXT, notes TEXT, created_at TEXT DEFAULT (datetime('now')))`);

db.exec(`CREATE TABLE IF NOT EXISTS customer_purchases (id TEXT PRIMARY KEY, customer_id TEXT, product_id TEXT, quantity INTEGER, price REAL, date TEXT DEFAULT (datetime('now')))`);

db.exec(`CREATE TABLE IF NOT EXISTS maintenance_tickets (id TEXT PRIMARY KEY, ticket_number TEXT UNIQUE, customer_id TEXT, device_name TEXT, problem TEXT, status TEXT DEFAULT 'pending', technician TEXT, cost REAL DEFAULT 0, notes TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`);

db.exec(`CREATE TABLE IF NOT EXISTS employees (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, role TEXT, salary REAL DEFAULT 0, hire_date TEXT, status TEXT DEFAULT 'active', notes TEXT, created_at TEXT DEFAULT (datetime('now')))`);

db.exec(`CREATE TABLE IF NOT EXISTS attendance (id TEXT PRIMARY KEY, employee_id TEXT, date TEXT, check_in TEXT, check_out TEXT, notes TEXT)`);

db.exec(`CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, invoice_number TEXT UNIQUE, type TEXT NOT NULL, customer_id TEXT, items TEXT, subtotal REAL DEFAULT 0, discount REAL DEFAULT 0, total REAL DEFAULT 0, status TEXT DEFAULT 'unpaid', notes TEXT, created_at TEXT DEFAULT (datetime('now')))`);

module.exports = db;
