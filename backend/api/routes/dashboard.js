const express = require('express');
const router = express.Router();
const { pool } = require('../../db');

router.get('/', async (req, res) => {
  try {
    const [
      products, lowStock, customers, employees,
      pendingTickets, inProgressTickets, invoices, revenue,
      recentTickets, recentInvoices, lowStockItems
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM products'),
      pool.query('SELECT COUNT(*) FROM products WHERE quantity <= min_quantity'),
      pool.query('SELECT COUNT(*) FROM customers'),
      pool.query("SELECT COUNT(*) FROM employees WHERE status = 'active'"),
      pool.query("SELECT COUNT(*) FROM maintenance_tickets WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*) FROM maintenance_tickets WHERE status = 'in_progress'"),
      pool.query('SELECT COUNT(*) FROM invoices'),
      pool.query("SELECT COALESCE(SUM(total),0) as sum FROM invoices WHERE status = 'paid'"),
      pool.query(`SELECT mt.*, c.name as customer_name FROM maintenance_tickets mt LEFT JOIN customers c ON mt.customer_id = c.id ORDER BY mt.created_at DESC LIMIT 5`),
      pool.query(`SELECT inv.*, c.name as customer_name FROM invoices inv LEFT JOIN customers c ON inv.customer_id = c.id ORDER BY inv.created_at DESC LIMIT 5`),
      pool.query('SELECT * FROM products WHERE quantity <= min_quantity ORDER BY quantity ASC LIMIT 5'),
    ]);

    res.json({
      stats: {
        totalProducts: parseInt(products.rows[0].count),
        lowStockProducts: parseInt(lowStock.rows[0].count),
        totalCustomers: parseInt(customers.rows[0].count),
        totalEmployees: parseInt(employees.rows[0].count),
        pendingTickets: parseInt(pendingTickets.rows[0].count),
        inProgressTickets: parseInt(inProgressTickets.rows[0].count),
        totalInvoices: parseInt(invoices.rows[0].count),
        totalRevenue: parseFloat(revenue.rows[0].sum),
      },
      recentTickets: recentTickets.rows,
      recentInvoices: recentInvoices.rows,
      lowStockItems: lowStockItems.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
