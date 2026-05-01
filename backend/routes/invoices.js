const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

function generateInvoiceNumber() {
  const date = new Date();
  const prefix = 'INV';
  const timestamp = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${timestamp}-${random}`;
}

// Get all invoices
router.get('/', (req, res) => {
  try {
    const invoices = db.prepare(`
      SELECT inv.*, c.name as customer_name
      FROM invoices inv
      LEFT JOIN customers c ON inv.customer_id = c.id
      ORDER BY inv.created_at DESC
    `).all();
    res.json(invoices.map(inv => ({ ...inv, items: JSON.parse(inv.items || '[]') })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single invoice
router.get('/:id', (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT inv.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
      FROM invoices inv
      LEFT JOIN customers c ON inv.customer_id = c.id
      WHERE inv.id = ?
    `).get(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    res.json({ ...invoice, items: JSON.parse(invoice.items || '[]') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create invoice
router.post('/', (req, res) => {
  try {
    const { type, customer_id, items, subtotal, discount, total, notes } = req.body;
    const id = uuidv4();
    const invoice_number = generateInvoiceNumber();
    db.prepare(`
      INSERT INTO invoices (id, invoice_number, type, customer_id, items, subtotal, discount, total, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, invoice_number, type, customer_id, JSON.stringify(items || []), subtotal || 0, discount || 0, total || 0, notes);

    // Update product quantities for sale invoices
    if (type === 'sale' && items) {
      items.forEach(item => {
        if (item.product_id) {
          db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?')
            .run(item.quantity, item.product_id);
        }
      });
    }

    const invoice = db.prepare(`
      SELECT inv.*, c.name as customer_name FROM invoices inv
      LEFT JOIN customers c ON inv.customer_id = c.id WHERE inv.id = ?
    `).get(id);
    res.status(201).json({ ...invoice, items: JSON.parse(invoice.items || '[]') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update invoice status
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE invoices SET status=? WHERE id=?').run(status, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete invoice
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate PDF
router.get('/:id/pdf', (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT inv.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
      FROM invoices inv
      LEFT JOIN customers c ON inv.customer_id = c.id
      WHERE inv.id = ?
    `).get(req.params.id);

    if (!invoice) return res.status(404).json({ error: 'الفاتورة غير موجودة' });

    const items = JSON.parse(invoice.items || '[]');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_number}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(invoice.invoice_number, { align: 'center' });
    doc.moveDown();

    // Company info
    doc.fontSize(14).font('Helvetica-Bold').text('TechSec Solutions', { align: 'left' });
    doc.fontSize(10).font('Helvetica').text('CCTV & Network Systems', { align: 'left' });
    doc.moveDown();

    // Invoice details
    const typeLabel = invoice.type === 'sale' ? 'Sale Invoice' : 'Maintenance Invoice';
    doc.fontSize(11).text(`Type: ${typeLabel}`);
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString('ar-SA')}`);
    doc.text(`Status: ${invoice.status === 'paid' ? 'Paid' : 'Unpaid'}`);
    doc.moveDown();

    // Customer info
    doc.fontSize(12).font('Helvetica-Bold').text('Customer:');
    doc.fontSize(11).font('Helvetica').text(invoice.customer_name || 'Walk-in Customer');
    if (invoice.customer_phone) doc.text(`Phone: ${invoice.customer_phone}`);
    if (invoice.customer_address) doc.text(`Address: ${invoice.customer_address}`);
    doc.moveDown();

    // Items table header
    doc.fontSize(12).font('Helvetica-Bold').text('Items:', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Description', 50, tableTop);
    doc.text('Qty', 300, tableTop);
    doc.text('Price', 370, tableTop);
    doc.text('Total', 450, tableTop);
    doc.moveDown();

    // Items
    doc.font('Helvetica');
    items.forEach(item => {
      const y = doc.y;
      doc.text(item.name || item.description, 50, y);
      doc.text(String(item.quantity), 300, y);
      doc.text(`${item.price} SAR`, 370, y);
      doc.text(`${(item.quantity * item.price).toFixed(2)} SAR`, 450, y);
      doc.moveDown();
    });

    doc.moveDown();
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(`Subtotal: ${invoice.subtotal} SAR`, { align: 'right' });
    if (invoice.discount > 0) doc.text(`Discount: ${invoice.discount} SAR`, { align: 'right' });
    doc.fontSize(13).text(`Total: ${invoice.total} SAR`, { align: 'right' });

    if (invoice.notes) {
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(`Notes: ${invoice.notes}`);
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
