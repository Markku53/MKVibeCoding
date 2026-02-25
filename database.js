const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'inventory.db');

function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  return db;
}

function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      sku TEXT UNIQUE NOT NULL,
      description TEXT
    )
  `);

  const count = db.prepare('SELECT COUNT(*) as cnt FROM products').get();
  if (count.cnt === 0) {
    const insert = db.prepare(`
      INSERT INTO products (name, category, price, quantity, sku, description)
      VALUES (@name, @category, @price, @quantity, @sku, @description)
    `);

    const products = [
      { name: 'Wireless Bluetooth Headphones', category: 'Electronics', price: 79.99, quantity: 45, sku: 'ELEC-001', description: 'Over-ear noise cancelling headphones with 30hr battery life' },
      { name: 'USB-C Charging Cable 2m', category: 'Electronics', price: 12.99, quantity: 120, sku: 'ELEC-002', description: 'Braided nylon USB-C to USB-C fast charging cable' },
      { name: 'Mechanical Keyboard', category: 'Electronics', price: 129.99, quantity: 30, sku: 'ELEC-003', description: 'TKL mechanical keyboard with blue switches and RGB backlight' },
      { name: 'Ergonomic Office Chair', category: 'Furniture', price: 349.99, quantity: 12, sku: 'FURN-001', description: 'Lumbar support chair with adjustable armrests and height' },
      { name: 'Standing Desk', category: 'Furniture', price: 499.99, quantity: 8, sku: 'FURN-002', description: 'Electric height-adjustable standing desk 140x70cm' },
      { name: 'Notebook A5 Pack (3)', category: 'Stationery', price: 9.99, quantity: 200, sku: 'STAT-001', description: 'Ruled A5 notebooks with soft cover, 96 pages each' },
      { name: 'Ballpoint Pen Set (10)', category: 'Stationery', price: 5.49, quantity: 350, sku: 'STAT-002', description: 'Smooth writing ballpoint pens in blue and black' },
      { name: 'Desk Organizer', category: 'Stationery', price: 24.99, quantity: 60, sku: 'STAT-003', description: 'Bamboo desktop organizer with 6 compartments' },
      { name: 'Stainless Steel Water Bottle', category: 'Kitchen', price: 29.99, quantity: 85, sku: 'KITC-001', description: '500ml vacuum insulated bottle keeps drinks cold 24hr' },
      { name: 'Coffee Mug 350ml', category: 'Kitchen', price: 14.99, quantity: 95, sku: 'KITC-002', description: 'Ceramic mug with non-slip base and ergonomic handle' },
      { name: 'Yoga Mat', category: 'Sports', price: 39.99, quantity: 40, sku: 'SPRT-001', description: 'Non-slip 6mm thick TPE yoga mat with carrying strap' },
      { name: 'Resistance Bands Set', category: 'Sports', price: 19.99, quantity: 75, sku: 'SPRT-002', description: 'Set of 5 resistance bands from light to extra heavy' },
      { name: 'Adjustable Dumbbell 20kg', category: 'Sports', price: 89.99, quantity: 18, sku: 'SPRT-003', description: 'Space-saving adjustable dumbbell with quick dial system' },
      { name: 'LED Desk Lamp', category: 'Electronics', price: 44.99, quantity: 55, sku: 'ELEC-004', description: '10W LED desk lamp with 5 color temperatures and USB port' },
      { name: 'Wireless Mouse', category: 'Electronics', price: 34.99, quantity: 70, sku: 'ELEC-005', description: 'Silent wireless mouse with 2.4GHz and Bluetooth connectivity' },
      { name: 'Monitor Stand Riser', category: 'Furniture', price: 59.99, quantity: 35, sku: 'FURN-003', description: 'Adjustable monitor stand with drawer and cable management' },
      { name: 'Sticky Notes Pack', category: 'Stationery', price: 7.99, quantity: 280, sku: 'STAT-004', description: '4 packs of 100-sheet sticky notes in assorted colors' },
      { name: 'Protein Shaker Bottle', category: 'Sports', price: 16.99, quantity: 90, sku: 'SPRT-004', description: '700ml BPA-free shaker with mixing ball and compartments' },
      { name: 'Electric Kettle 1.7L', category: 'Kitchen', price: 49.99, quantity: 25, sku: 'KITC-003', description: 'Stainless steel kettle with temperature control and keep-warm' },
      { name: 'Laptop Backpack 15.6"', category: 'Accessories', price: 64.99, quantity: 50, sku: 'ACCS-001', description: 'Water-resistant backpack with USB charging port and anti-theft pocket' },
    ];

    const insertMany = db.transaction((items) => {
      for (const item of items) insert.run(item);
    });
    insertMany(products);
    console.log('Database seeded with 20 products.');
  }

  db.close();
}

module.exports = { getDb, initDb };
