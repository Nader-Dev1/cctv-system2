const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        buy_price NUMERIC DEFAULT 0,
        sell_price NUMERIC DEFAULT 0,
        quantity INTEGER DEFAULT 0,
        min_quantity INTEGER DEFAULT 5,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS maintenance_tickets (
        id TEXT PRIMARY KEY,
        ticket_number TEXT UNIQUE,
        customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
        device_name TEXT,
        problem TEXT,
        status TEXT DEFAULT 'pending',
        technician TEXT,
        cost NUMERIC DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        role TEXT,
        salary NUMERIC DEFAULT 0,
        hire_date TEXT,
        status TEXT DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
        date TEXT,
        check_in TEXT,
        check_out TEXT,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE,
        type TEXT NOT NULL,
        customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
        items JSONB DEFAULT '[]',
        subtotal NUMERIC DEFAULT 0,
        discount NUMERIC DEFAULT 0,
        total NUMERIC DEFAULT 0,
        status TEXT DEFAULT 'unpaid',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Database ready');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
