const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  try {
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const lowStockProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE quantity <= min_quantity').get().count;
    const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
    const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees').get().count;
    const pendingTickets = db.prepare('SELECT COUNT(*) as count FROM maintenance_tickets WHERE status = "pending"').get().count;
    const inProgressTickets = db.prepare('SELECT COUNT(*) as count FROM maintenance_tickets WHERE status = "in_progress"').get().count;
    const totalInvoices = db.prepare('SELECT COUNT(*) as count FROM invoices').get().count;
    const totalRevenue = db.prepare('SELECT COALESCE(SUM(total), 0) as sum FROM invoices WHERE status = "paid"').get().sum;
    
    const recentTickets = db.prepare(`
      SELECT mt.*, c.name as customer_name FROM maintenance_tickets mt
      LEFT JOIN customers c ON mt.customer_id = c.id
      ORDER BY mt.created_at DESC LIMIT 5
    `).all();

    const recentInvoices = db.prepare(`
      SELECT inv.*, c.name as customer_name FROM invoices inv
      LEFT JOIN customers c ON inv.customer_id = c.id
      ORDER BY inv.created_at DESC LIMIT 5
    `).all();

    const lowStockItems = db.prepare('SELECT * FROM products WHERE quantity <= min_quantity ORDER BY quantity ASC LIMIT 5').all();

    res.json({
      stats: {
        totalProducts,
        lowStockProducts,
        totalCustomers,
        totalEmployees,
        pendingTickets,
        inProgressTickets,
        totalInvoices,
        totalRevenue
      },
      recentTickets,
      recentInvoices,
      lowStockItems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
