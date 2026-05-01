const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

// Get all employees
router.get('/', (req, res) => {
  try {
    const employees = db.prepare('SELECT * FROM employees ORDER BY created_at DESC').all();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single employee with attendance
router.get('/:id', (req, res) => {
  try {
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    if (!employee) return res.status(404).json({ error: 'الموظف غير موجود' });
    const attendance = db.prepare('SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC LIMIT 30').all(req.params.id);
    res.json({ ...employee, attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create employee
router.post('/', (req, res) => {
  try {
    const { name, phone, role, salary, hire_date, notes } = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO employees (id, name, phone, role, salary, hire_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, phone, role, salary || 0, hire_date, notes);
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update employee
router.put('/:id', (req, res) => {
  try {
    const { name, phone, role, salary, hire_date, status, notes } = req.body;
    db.prepare(`
      UPDATE employees SET name=?, phone=?, role=?, salary=?, hire_date=?, status=?, notes=? WHERE id=?
    `).run(name, phone, role, salary, hire_date, status, notes, req.params.id);
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete employee
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record attendance
router.post('/:id/attendance', (req, res) => {
  try {
    const { date, check_in, check_out, notes } = req.body;
    const id = uuidv4();
    const existing = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(req.params.id, date);
    if (existing) {
      db.prepare('UPDATE attendance SET check_in=?, check_out=?, notes=? WHERE id=?')
        .run(check_in, check_out, notes, existing.id);
    } else {
      db.prepare('INSERT INTO attendance (id, employee_id, date, check_in, check_out, notes) VALUES (?,?,?,?,?,?)')
        .run(id, req.params.id, date, check_in, check_out, notes);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
