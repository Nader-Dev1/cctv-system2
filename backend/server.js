const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/products', require('./routes/products'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/invoices', require('./routes/invoices'));

app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});