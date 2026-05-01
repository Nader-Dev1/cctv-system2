const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

function generateTicketNumber() {
  const date = new Date();
  const prefix = 'TKT';
  const timestamp = date.getFullYear().toString().slice(-2) +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${timestamp}-${random}`;
}

// Get all tickets
router.get('/', (req, res) => {
  try {
    const tickets = db.prepare(`
      SELECT mt.*, c.name as customer_name, c.phone as customer_phone
      FROM maintenance_tickets mt
      LEFT JOIN customers c ON mt.customer_id = c.id
      ORDER BY mt.created_at DESC
    `).all();
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single ticket
router.get('/:id', (req, res) => {
  try {
    const ticket = db.prepare(`
      SELECT mt.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
      FROM maintenance_tickets mt
      LEFT JOIN customers c ON mt.customer_id = c.id
      WHERE mt.id = ?
    `).get(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'التذكرة غير موجودة' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create ticket
router.post('/', (req, res) => {
  try {
    const { customer_id, device_name, problem, technician, cost, notes } = req.body;
    const id = uuidv4();
    const ticket_number = generateTicketNumber();
    db.prepare(`
      INSERT INTO maintenance_tickets (id, ticket_number, customer_id, device_name, problem, technician, cost, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, ticket_number, customer_id, device_name, problem, technician, cost || 0, notes);
    const ticket = db.prepare(`
      SELECT mt.*, c.name as customer_name FROM maintenance_tickets mt
      LEFT JOIN customers c ON mt.customer_id = c.id WHERE mt.id = ?
    `).get(id);
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update ticket
router.put('/:id', (req, res) => {
  try {
    const { status, technician, cost, notes, device_name, problem } = req.body;
    db.prepare(`
      UPDATE maintenance_tickets SET status=?, technician=?, cost=?, notes=?, device_name=?, problem=?,
      updated_at=datetime('now') WHERE id=?
    `).run(status, technician, cost, notes, device_name, problem, req.params.id);
    const ticket = db.prepare(`
      SELECT mt.*, c.name as customer_name FROM maintenance_tickets mt
      LEFT JOIN customers c ON mt.customer_id = c.id WHERE mt.id = ?
    `).get(req.params.id);
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete ticket
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM maintenance_tickets WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
