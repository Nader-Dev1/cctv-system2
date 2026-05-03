const express = require('express');
const router = express.Router();
const { pool } = require('../../db');
const { v4: uuidv4 } = require('uuid');

function invoiceNumber() {
  const d = new Date();
  return `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*9000+1000)}`;
}

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT inv.*, c.name as customer_name FROM invoices inv
       LEFT JOIN customers c ON inv.customer_id = c.id ORDER BY inv.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT inv.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
       FROM invoices inv LEFT JOIN customers c ON inv.customer_id = c.id WHERE inv.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'غير موجود' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { type, customer_id, items, subtotal, discount, total, notes } = req.body;
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO invoices (id,invoice_number,type,customer_id,items,subtotal,discount,total,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, invoiceNumber(), type, customer_id||null, JSON.stringify(items||[]), subtotal||0, discount||0, total||0, notes]
    );
    // تخفيض الكميات لو فاتورة بيع
    if (type === 'sale' && items) {
      for (const item of items) {
        if (item.product_id) {
          await pool.query('UPDATE products SET quantity = quantity - $1 WHERE id = $2', [item.quantity, item.product_id]);
        }
      }
    }
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/status', async (req, res) => {
  try {
    await pool.query('UPDATE invoices SET status=$1 WHERE id=$2', [req.body.status, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM invoices WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
