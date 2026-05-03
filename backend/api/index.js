const express = require('express');
const cors = require('cors');
const { initDB } = require('../db');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(express.json());

app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/products', require('./routes/products'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/invoices', require('./routes/invoices'));

app.get('/', (req, res) => res.json({ status: 'TechSec API running' }));

initDB().catch(console.error);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server on port ${PORT}`));

module.exports = app;
