const express = require('express');
const router = express.Router();
const { pool } = require('../../db');
const { v4: uuidv4 } = require('uuid');

function ticketNumber() {
  const d = new Date();
  return `TKT-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*9000+1000)}`;
}

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mt.*, c.name as customer_name, c.phone as customer_phone
       FROM maintenance_tickets mt LEFT JOIN customers c ON mt.customer_id = c.id
       ORDER BY mt.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mt.*, c.name as customer_name FROM maintenance_tickets mt
       LEFT JOIN customers c ON mt.customer_id = c.id WHERE mt.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'غير موجود' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { customer_id, device_name, problem, technician, cost, notes } = req.body;
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO maintenance_tickets (id,ticket_number,customer_id,device_name,problem,technician,cost,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id, ticketNumber(), customer_id||null, device_name, problem, technician, cost||0, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { status, technician, cost, notes, device_name, problem } = req.body;
    const result = await pool.query(
      `UPDATE maintenance_tickets SET status=$1,technician=$2,cost=$3,notes=$4,device_name=$5,problem=$6,updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [status, technician, cost, notes, device_name, problem, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM maintenance_tickets WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
