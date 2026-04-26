const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json({ limit: '2mb' }));

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ products: [], categories: [], orders: [], users: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function nextId(collection) {
  if (!collection.length) return 1;
  return Math.max(...collection.map(x => Number(x.id) || 0)) + 1;
}

// Generic CRUD factory
function registerCrud(resource, idField = 'id') {
  app.get(`/api/${resource}`, (req, res) => {
    const db = readDb();
    res.json(db[resource] || []);
  });

  app.get(`/api/${resource}/:id`, (req, res) => {
    const db = readDb();
    const item = (db[resource] || []).find(x => String(x[idField]) === String(req.params.id));
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });

  app.post(`/api/${resource}`, (req, res) => {
    const db = readDb();
    db[resource] = db[resource] || [];
    const item = { ...req.body, [idField]: nextId(db[resource]), createdAt: new Date().toISOString() };
    db[resource].push(item);
    writeDb(db);
    res.status(201).json(item);
  });

  app.put(`/api/${resource}/:id`, (req, res) => {
    const db = readDb();
    const list = db[resource] || [];
    const idx = list.findIndex(x => String(x[idField]) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const updated = { ...list[idx], ...req.body, [idField]: list[idx][idField] };
    list[idx] = updated;
    writeDb(db);
    res.json(updated);
  });

  app.delete(`/api/${resource}/:id`, (req, res) => {
    const db = readDb();
    const list = db[resource] || [];
    const idx = list.findIndex(x => String(x[idField]) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const [removed] = list.splice(idx, 1);
    writeDb(db);
    res.json(removed);
  });
}

['products', 'categories', 'orders', 'users'].forEach(r => registerCrud(r));

// Confirm payment endpoint
app.post('/api/confirm-payment', (req, res) => {
  const { orderId } = req.body || {};
  if (!orderId) return res.status(400).json({ error: 'orderId required' });
  const db = readDb();
  const order = (db.orders || []).find(o => String(o.id) === String(orderId));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.status = 'Paid';
  order.paymentMode = 'UPI';
  order.paidAt = new Date().toISOString();
  writeDb(db);
  res.json(order);
});

// Mark order expired
app.post('/api/expire-payment', (req, res) => {
  const { orderId } = req.body || {};
  const db = readDb();
  const order = (db.orders || []).find(o => String(o.id) === String(orderId));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'Pending') {
    order.status = 'Expired';
    writeDb(db);
  }
  res.json(order);
});

// Dashboard stats
app.get('/api/stats', (req, res) => {
  const db = readDb();
  res.json({
    products: (db.products || []).length,
    categories: (db.categories || []).length,
    orders: (db.orders || []).length,
    users: (db.users || []).length,
    revenue: (db.orders || []).filter(o => o.status === 'Paid' || o.status === 'Delivered' || o.status === 'Shipped').reduce((s, o) => s + (Number(o.amount) || 0), 0)
  });
});

app.get('/', (req, res) => res.json({ status: 'ok', service: 'ecom-admin-backend' }));

app.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT}`);
});
