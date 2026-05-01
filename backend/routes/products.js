const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

// Get all products
router.get('/', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    const lowStock = products.filter(p => p.quantity <= p.min_quantity);
    res.json({ products, lowStock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single product
router.get('/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'المنتج غير موجود' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create product
router.post('/', (req, res) => {
  try {
    const { name, category, brand, model, buy_price, sell_price, quantity, min_quantity, description } = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO products (id, name, category, brand, model, buy_price, sell_price, quantity, min_quantity, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, category, brand, model, buy_price || 0, sell_price || 0, quantity || 0, min_quantity || 5, description);
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product
router.put('/:id', (req, res) => {
  try {
    const { name, category, brand, model, buy_price, sell_price, quantity, min_quantity, description } = req.body;
    db.prepare(`
      UPDATE products SET name=?, category=?, brand=?, model=?, buy_price=?, sell_price=?, quantity=?, min_quantity=?, description=?
      WHERE id=?
    `).run(name, category, brand, model, buy_price, sell_price, quantity, min_quantity, description, req.params.id);
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
