const express = require('express');
const router = express.Router();
const { pool } = require('../../db');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const emp = await pool.query('SELECT * FROM employees WHERE id = $1', [req.params.id]);
    if (!emp.rows[0]) return res.status(404).json({ error: 'غير موجود' });
    const att = await pool.query('SELECT * FROM attendance WHERE employee_id = $1 ORDER BY date DESC LIMIT 30', [req.params.id]);
    res.json({ ...emp.rows[0], attendance: att.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, role, salary, hire_date, notes } = req.body;
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO employees (id,name,phone,role,salary,hire_date,notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [id, name, phone, role, salary||0, hire_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, phone, role, salary, hire_date, status, notes } = req.body;
    const result = await pool.query(
      'UPDATE employees SET name=$1,phone=$2,role=$3,salary=$4,hire_date=$5,status=$6,notes=$7 WHERE id=$8 RETURNING *',
      [name, phone, role, salary, hire_date, status, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/attendance', async (req, res) => {
  try {
    const { date, check_in, check_out, notes } = req.body;
    const existing = await pool.query('SELECT id FROM attendance WHERE employee_id=$1 AND date=$2', [req.params.id, date]);
    if (existing.rows[0]) {
      await pool.query('UPDATE attendance SET check_in=$1,check_out=$2,notes=$3 WHERE id=$4', [check_in, check_out, notes, existing.rows[0].id]);
    } else {
      await pool.query('INSERT INTO attendance (id,employee_id,date,check_in,check_out,notes) VALUES ($1,$2,$3,$4,$5,$6)',
        [uuidv4(), req.params.id, date, check_in, check_out, notes]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
