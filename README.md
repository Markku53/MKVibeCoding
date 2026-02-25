# MKVibeCoding — Retail Store Inventory Manager

A modern, full-stack web application for managing a retail store's product inventory.

## Features

- **Browse products** — responsive grid or list view with real-time search and category filtering
- **Add products** — modal form with name, SKU, category, price, quantity and description
- **Edit products** — update any product details via the same modal form
- **Delete products** — confirmation dialog before permanent removal
- **Adjust quantity** — inline − / + buttons or direct input, saved instantly to the database
- **Stock indicators** — colour-coded badges (In stock / Low stock / Out of stock)
- **Low-stock alert** — header badge appears when any product has ≤ 10 units
- **Pre-populated database** — 20 sample products across 6 categories (Electronics, Furniture, Stationery, Kitchen, Sports, Accessories)

## Screenshots

**Inventory grid**
![Inventory grid](https://github.com/user-attachments/assets/ed39907c-7ade-49a8-8109-c73398b45231)

**Add / Edit product modal**
![Add product modal](https://github.com/user-attachments/assets/7fa7518c-26ab-456b-8ddd-a8e7fc54a042)

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Backend  | Node.js + Express |
| Database | SQLite via `better-sqlite3` |
| Frontend | Vanilla HTML / CSS / JavaScript |

## Getting Started

```bash
# Install dependencies
npm install

# Start the server (seeds the database on first run)
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
.
├── server.js        # Express API server
├── database.js      # SQLite setup & 20-product seed data
├── public/
│   ├── index.html   # Single-page app shell
│   ├── styles.css   # Modern CSS (Inter font, CSS variables)
│   └── app.js       # Vanilla JS frontend logic
└── package.json
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/products` | List products (supports `?search=` and `?category=`) |
| `GET` | `/api/products/:id` | Get single product |
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/:id` | Update product |
| `PATCH` | `/api/products/:id/quantity` | Update quantity only |
| `DELETE` | `/api/products/:id` | Delete product |
| `GET` | `/api/categories` | List distinct categories |