const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

// Get all customers
router.get('/', (req, res) => {
  try {
    const customers = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get customer with full history
router.get('/:id', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'العميل غير موجود' });

    const purchases = db.prepare(`
      SELECT cp.*, p.name as product_name, p.category
      FROM customer_purchases cp
      LEFT JOIN products p ON cp.product_id = p.id
      WHERE cp.customer_id = ?
      ORDER BY cp.date DESC
    `).all(req.params.id);

    const maintenance = db.prepare(`
      SELECT * FROM maintenance_tickets WHERE customer_id = ? ORDER BY created_at DESC
    `).all(req.params.id);

    res.json({ ...customer, purchases, maintenance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create customer
router.post('/', (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO customers (id, name, phone, email, address, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, phone, email, address, notes);
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update customer
router.put('/:id', (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    db.prepare(`
      UPDATE customers SET name=?, phone=?, email=?, address=?, notes=? WHERE id=?
    `).run(name, phone, email, address, notes, req.params.id);
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete customer
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
