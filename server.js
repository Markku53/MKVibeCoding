const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb, initDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database
initDb();

// GET all products (with optional search/filter)
app.get('/api/products', (req, res) => {
  const db = getDb();
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];

    if (search || category) {
      const conditions = [];
      if (search) {
        conditions.push('(name LIKE ? OR sku LIKE ? OR description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      if (category) {
        conditions.push('category = ?');
        params.push(category);
      }
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY name ASC';
    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    db.close();
  }
});

// GET single product
app.get('/api/products/:id', (req, res) => {
  const db = getDb();
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    db.close();
  }
});

// GET distinct categories
app.get('/api/categories', (req, res) => {
  const db = getDb();
  try {
    const categories = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();
    res.json(categories.map(c => c.category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    db.close();
  }
});

// POST create product
app.post('/api/products', (req, res) => {
  const db = getDb();
  try {
    const { name, category, price, quantity, sku, description } = req.body;
    if (!name || !category || price == null || quantity == null || !sku) {
      return res.status(400).json({ error: 'name, category, price, quantity and sku are required' });
    }
    const result = db.prepare(`
      INSERT INTO products (name, category, price, quantity, sku, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, category, parseFloat(price), parseInt(quantity), sku, description || '');
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(product);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: err.message });
  } finally {
    db.close();
  }
});

// PATCH update quantity
app.patch('/api/products/:id/quantity', (req, res) => {
  const db = getDb();
  try {
    const { quantity } = req.body;
    if (quantity == null || isNaN(parseInt(quantity))) {
      return res.status(400).json({ error: 'quantity is required' });
    }
    const qty = parseInt(quantity);
    if (qty < 0) return res.status(400).json({ error: 'quantity cannot be negative' });

    const result = db.prepare('UPDATE products SET quantity = ? WHERE id = ?').run(qty, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    db.close();
  }
});

// PUT update product
app.put('/api/products/:id', (req, res) => {
  const db = getDb();
  try {
    const { name, category, price, quantity, sku, description } = req.body;
    if (!name || !category || price == null || quantity == null || !sku) {
      return res.status(400).json({ error: 'name, category, price, quantity and sku are required' });
    }
    const result = db.prepare(`
      UPDATE products SET name=?, category=?, price=?, quantity=?, sku=?, description=? WHERE id=?
    `).run(name, category, parseFloat(price), parseInt(quantity), sku, description || '', req.params.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(product);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: err.message });
  } finally {
    db.close();
  }
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
  const db = getDb();
  try {
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    db.close();
  }
});

app.listen(PORT, () => {
  console.log(`Inventory server running at http://localhost:${PORT}`);
});

module.exports = app;
