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

// ===== Razorpay payment endpoints =====

// Frontend asks the backend whether real payment is available
app.get('/api/payments/config', (req, res) => {
  res.json({
    enabled: !!razorpay,
    keyId: razorpay ? RZ_KEY_ID : null,
    provider: razorpay ? 'razorpay' : null
  });
});

// Create a Razorpay order for an existing local order
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
    if (!amount || amount < 100) return res.status(400).json({ error: 'Amount must be at least ₹1' });

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

// Verify Razorpay signature and mark order Paid
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

// Mark order expired (used when timer runs out)
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

app.get('/', (req, res) => res.json({ status: 'ok', service: 'pgemart-backend', razorpay: !!razorpay }));

app.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT}`);
});
