const express = require('express');
const router = express.Router();
const { pool } = require('../../db');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (!customer.rows[0]) return res.status(404).json({ error: 'غير موجود' });
    const maintenance = await pool.query('SELECT * FROM maintenance_tickets WHERE customer_id = $1 ORDER BY created_at DESC', [req.params.id]);
    res.json({ ...customer.rows[0], maintenance: maintenance.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO customers (id,name,phone,email,address,notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [id, name, phone, email, address, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    const result = await pool.query(
      'UPDATE customers SET name=$1,phone=$2,email=$3,address=$4,notes=$5 WHERE id=$6 RETURNING *',
      [name, phone, email, address, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
