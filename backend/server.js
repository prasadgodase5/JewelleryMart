require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Razorpay (optional — only loads if keys are present)
let razorpay = null;
const RZ_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RZ_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
if (RZ_KEY_ID && RZ_KEY_SECRET && !RZ_KEY_ID.includes('XXXX')) {
  try {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({ key_id: RZ_KEY_ID, key_secret: RZ_KEY_SECRET });
    console.log('[backend] Razorpay configured (key_id =', RZ_KEY_ID + ')');
  } catch (e) {
    console.warn('[backend] Failed to init Razorpay:', e.message);
  }
} else {
  console.warn('[backend] Razorpay NOT configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env');
}

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

function stripPassword(user) {
  if (!user) return user;
  const { password, ...safe } = user;
  return safe;
}

function decrementStock(db, items) {
  for (const item of items || []) {
    const p = (db.products || []).find(p => String(p.id) === String(item.productId));
    if (p) p.stock = Math.max(0, (Number(p.stock) || 0) - (Number(item.qty) || 1));
  }
}

function restoreStock(db, items) {
  for (const item of items || []) {
    const p = (db.products || []).find(p => String(p.id) === String(item.productId));
    if (p) p.stock = (Number(p.stock) || 0) + (Number(item.qty) || 1);
  }
}

// ============================================================
// Generic CRUD factory (used for products and categories only)
// ============================================================
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

['products', 'categories'].forEach(r => registerCrud(r));

// ============================================================
// Users (with username + password — passwords never leave the server)
// ============================================================
app.get('/api/users', (req, res) => {
  const db = readDb();
  res.json((db.users || []).map(stripPassword));
});

app.get('/api/users/:id', (req, res) => {
  const db = readDb();
  const u = (db.users || []).find(x => String(x.id) === String(req.params.id));
  if (!u) return res.status(404).json({ error: 'Not found' });
  res.json(stripPassword(u));
});

app.post('/api/users', (req, res) => {
  const db = readDb();
  db.users = db.users || [];

  const { username, password, name, email, role, phone } = req.body || {};
  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: 'name, username, password and role are required' });
  }
  if (db.users.some(u => (u.username || '').toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const user = {
    id: nextId(db.users),
    name, email: email || '',
    username: String(username).trim(),
    password: String(password),
    role,
    phone: phone || '',
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  writeDb(db);
  res.status(201).json(stripPassword(user));
});

app.put('/api/users/:id', (req, res) => {
  const db = readDb();
  const list = db.users || [];
  const idx = list.findIndex(x => String(x.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const existing = list[idx];
  const { username, password, name, email, role, phone } = req.body || {};

  if (username && username.toLowerCase() !== (existing.username || '').toLowerCase()) {
    if (list.some(u => u.id !== existing.id && (u.username || '').toLowerCase() === username.toLowerCase())) {
      return res.status(409).json({ error: 'Username already taken' });
    }
  }

  list[idx] = {
    ...existing,
    name: name ?? existing.name,
    email: email ?? existing.email,
    username: username ?? existing.username,
    password: password && String(password).trim() ? String(password) : existing.password,
    role: role ?? existing.role,
    phone: phone ?? existing.phone
  };
  writeDb(db);
  res.json(stripPassword(list[idx]));
});

app.delete('/api/users/:id', (req, res) => {
  const db = readDb();
  const list = db.users || [];
  const idx = list.findIndex(x => String(x.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = list.splice(idx, 1);
  writeDb(db);
  res.json(stripPassword(removed));
});

// ============================================================
// Auth
// ============================================================
app.post('/api/auth/login', (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  const db = readDb();
  const user = (db.users || []).find(u =>
    (u.username || '').toLowerCase() === String(username).toLowerCase().trim() &&
    u.password === password &&
    (!role || u.role === role)
  );

  if (!user) {
    const existsAtAll = (db.users || []).some(u =>
      (u.username || '').toLowerCase() === String(username).toLowerCase().trim() &&
      u.password === password
    );
    if (existsAtAll) return res.status(403).json({ error: 'This account is not authorised for the selected panel' });
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  res.json(stripPassword(user));
});

// ============================================================
// Orders (with stock decrement / restore)
// ============================================================
app.get('/api/orders', (req, res) => {
  const db = readDb();
  res.json(db.orders || []);
});

app.get('/api/orders/:id', (req, res) => {
  const db = readDb();
  const o = (db.orders || []).find(x => String(x.id) === String(req.params.id));
  if (!o) return res.status(404).json({ error: 'Not found' });
  res.json(o);
});

app.post('/api/orders', (req, res) => {
  const db = readDb();
  db.orders = db.orders || [];

  const order = {
    ...req.body,
    id: nextId(db.orders),
    createdAt: new Date().toISOString()
  };

  // Validate stock for each line item before committing
  for (const item of order.items || []) {
    const p = (db.products || []).find(p => String(p.id) === String(item.productId));
    if (!p) return res.status(400).json({ error: `Product ${item.productId} not found` });
    if ((p.stock || 0) < (item.qty || 1)) {
      return res.status(409).json({ error: `Only ${p.stock} of "${p.name}" in stock` });
    }
  }

  decrementStock(db, order.items);
  db.orders.push(order);
  writeDb(db);
  res.status(201).json(order);
});

app.put('/api/orders/:id', (req, res) => {
  const db = readDb();
  const list = db.orders || [];
  const idx = list.findIndex(x => String(x.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const updated = { ...list[idx], ...req.body, id: list[idx].id };
  list[idx] = updated;
  writeDb(db);
  res.json(updated);
});

app.delete('/api/orders/:id', (req, res) => {
  const db = readDb();
  const list = db.orders || [];
  const idx = list.findIndex(x => String(x.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = list.splice(idx, 1);
  // Restore stock unless the order was already expired (stock was already restored)
  if (removed.status !== 'Expired') restoreStock(db, removed.items);
  writeDb(db);
  res.json(removed);
});

// ============================================================
// Razorpay payment endpoints
// ============================================================
app.get('/api/payments/config', (req, res) => {
  res.json({
    enabled: !!razorpay,
    keyId: razorpay ? RZ_KEY_ID : null,
    provider: razorpay ? 'razorpay' : null
  });
});

app.post('/api/payments/create-order', async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({
      error: 'Razorpay not configured',
      hint: 'Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env, then restart the backend.'
    });
  }
  const { orderId } = req.body || {};
  if (!orderId) return res.status(400).json({ error: 'orderId required' });

  const db = readDb();
  const localOrder = (db.orders || []).find(o => String(o.id) === String(orderId));
  if (!localOrder) return res.status(404).json({ error: 'Order not found' });
  if (localOrder.status === 'Paid') return res.status(400).json({ error: 'Order already paid' });

  try {
    const amount = Math.round(Number(localOrder.amount) * 100);
    if (!amount || amount < 100) return res.status(400).json({ error: 'Amount must be at least Rs 1' });

    const rpOrder = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `pgemart_${localOrder.id}`,
      notes: { localOrderId: String(localOrder.id), customer: localOrder.customer || '' }
    });

    res.json({
      keyId: RZ_KEY_ID,
      orderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      localOrderId: localOrder.id,
      customer: localOrder.customer || ''
    });
  } catch (e) {
    console.error('[razorpay create-order]', e);
    res.status(500).json({ error: e.error?.description || e.message || 'Failed to create payment' });
  }
});

app.post('/api/payments/verify', (req, res) => {
  if (!razorpay) return res.status(503).json({ error: 'Razorpay not configured' });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, localOrderId } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !localOrderId) {
    return res.status(400).json({ error: 'Missing payment fields' });
  }

  const expected = crypto
    .createHmac('sha256', RZ_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  const db = readDb();
  const order = (db.orders || []).find(o => String(o.id) === String(localOrderId));
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = 'Paid';
  order.paymentMode = 'UPI';
  order.paymentId = razorpay_payment_id;
  order.razorpayOrderId = razorpay_order_id;
  order.paidAt = new Date().toISOString();
  writeDb(db);
  res.json(order);
});

// Mark order expired (used when timer runs out) — restores stock
app.post('/api/expire-payment', (req, res) => {
  const { orderId } = req.body || {};
  const db = readDb();
  const order = (db.orders || []).find(o => String(o.id) === String(orderId));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'Pending') {
    order.status = 'Expired';
    restoreStock(db, order.items);
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
    revenue: (db.orders || []).filter(o => o.status === 'Paid' || o.status === 'Delivered' || o.status === 'Shipped').reduce((s, o) => s + (Number(o.amount) || 0), 0),
    lowStock: (db.products || []).filter(p => (p.stock || 0) <= 5).length
  });
});

app.get('/', (req, res) => res.json({ status: 'ok', service: 'pgemart-backend', razorpay: !!razorpay }));

app.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT}`);
});
