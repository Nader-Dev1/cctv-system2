const express = require('express');
const router = express.Router();
const { pool } = require('../../db');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    const lowStock = result.rows.filter(p => p.quantity <= p.min_quantity);
    res.json({ products: result.rows, lowStock });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'غير موجود' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, brand, model, buy_price, sell_price, quantity, min_quantity, description } = req.body;
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO products (id,name,category,brand,model,buy_price,sell_price,quantity,min_quantity,description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [id, name, category, brand, model, buy_price||0, sell_price||0, quantity||0, min_quantity||5, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, category, brand, model, buy_price, sell_price, quantity, min_quantity, description } = req.body;
    const result = await pool.query(
      `UPDATE products SET name=$1,category=$2,brand=$3,model=$4,buy_price=$5,sell_price=$6,quantity=$7,min_quantity=$8,description=$9 WHERE id=$10 RETURNING *`,
      [name, category, brand, model, buy_price, sell_price, quantity, min_quantity, description, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
