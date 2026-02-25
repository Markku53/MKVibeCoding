const API = '/api';
let allProducts = [];
let allCategories = [];
let isGridView = true;
let pendingDeleteId = null;
let debounceTimer = null;

// ── Fetch helpers ────────────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Toast ────────────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// ── Category badge class ─────────────────────────────────────────────────────
function categoryClass(cat) {
  const map = {
    electronics: 'badge-electronics',
    furniture: 'badge-furniture',
    stationery: 'badge-stationery',
    kitchen: 'badge-kitchen',
    sports: 'badge-sports',
    accessories: 'badge-accessories',
  };
  return map[cat.toLowerCase()] || 'badge-default';
}

// ── Stock badge ──────────────────────────────────────────────────────────────
function stockInfo(qty) {
  if (qty === 0) return { cls: 'stock-out', label: 'Out of stock' };
  if (qty <= 10) return { cls: 'stock-low', label: `Low: ${qty}` };
  return { cls: 'stock-in', label: `In stock: ${qty}` };
}

// ── Render products ──────────────────────────────────────────────────────────
function renderProducts(products) {
  const container = document.getElementById('productsContainer');
  const empty = document.getElementById('emptyState');

  if (products.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  container.innerHTML = products.map(p => {
    const { cls: stockCls, label: stockLabel } = stockInfo(p.quantity);
    const catCls = categoryClass(p.category);
    return `
    <div class="product-card" data-id="${p.id}">
      <div class="card-header">
        <div>
          <div class="card-title">${escHtml(p.name)}</div>
          <div class="card-sku">${escHtml(p.sku)}</div>
        </div>
        <span class="card-badge ${catCls}">${escHtml(p.category)}</span>
      </div>
      ${p.description ? `<div class="card-desc">${escHtml(p.description)}</div>` : ''}
      <div class="card-footer">
        <span class="card-price">€${Number(p.price).toFixed(2)}</span>
        <div class="card-actions">
          <span class="card-badge ${stockCls}">${stockLabel}</span>
          <div class="quantity-ctrl">
            <span class="quantity-label">Quantity</span>
            <div class="quantity-row">
              <button class="qty-btn" data-action="dec" data-id="${p.id}" aria-label="Decrease quantity">−</button>
              <input type="number" class="qty-input" value="${p.quantity}" min="0" data-id="${p.id}" aria-label="Quantity for ${escHtml(p.name)}" />
              <button class="qty-btn" data-action="inc" data-id="${p.id}" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div style="display:flex;gap:6px;margin-top:4px;">
            <button class="btn-icon" data-action="edit" data-id="${p.id}" title="Edit product" aria-label="Edit ${escHtml(p.name)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon danger" data-action="delete" data-id="${p.id}" data-name="${escHtml(p.name)}" title="Delete product" aria-label="Delete ${escHtml(p.name)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Load products ─────────────────────────────────────────────────────────────
async function loadProducts() {
  const search = document.getElementById('searchInput').value.trim();
  const category = document.getElementById('categoryFilter').value;
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);

  try {
    const products = await apiFetch(`${API}/products?${params}`);
    allProducts = products;
    renderProducts(products);
    updateHeaderStats(products);
  } catch (err) {
    showToast('Failed to load products', 'error');
  }
}

function updateHeaderStats(products) {
  document.getElementById('totalProducts').textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;
  const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= 10).length;
  const badge = document.getElementById('lowStockBadge');
  if (lowStock > 0) {
    badge.textContent = `⚠ ${lowStock} low stock`;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

async function loadCategories() {
  try {
    const cats = await apiFetch(`${API}/categories`);
    allCategories = cats;
    const filter = document.getElementById('categoryFilter');
    const datalist = document.getElementById('categoryList');
    cats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat; opt.textContent = cat;
      filter.appendChild(opt);
      const dopt = document.createElement('option');
      dopt.value = cat;
      datalist.appendChild(dopt);
    });
  } catch (err) { /* ignore */ }
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function openModal(product = null) {
  const modal = document.getElementById('productModal');
  const title = document.getElementById('modalTitle');
  const form  = document.getElementById('productForm');
  document.getElementById('formError').style.display = 'none';

  if (product) {
    title.textContent = 'Edit Product';
    document.getElementById('productId').value = product.id;
    document.getElementById('fieldName').value = product.name;
    document.getElementById('fieldSku').value = product.sku;
    document.getElementById('fieldCategory').value = product.category;
    document.getElementById('fieldPrice').value = product.price;
    document.getElementById('fieldQuantity').value = product.quantity;
    document.getElementById('fieldDescription').value = product.description || '';
  } else {
    title.textContent = 'Add Product';
    form.reset();
    document.getElementById('productId').value = '';
  }
  modal.style.display = 'flex';
  document.getElementById('fieldName').focus();
}

function closeModal() {
  document.getElementById('productModal').style.display = 'none';
}

function openDeleteModal(id, name) {
  pendingDeleteId = id;
  document.getElementById('deleteProductName').textContent = name;
  document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById('deleteModal').style.display = 'none';
}

// ── Form submit ───────────────────────────────────────────────────────────────
document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('formError');
  errorEl.style.display = 'none';

  const id   = document.getElementById('productId').value;
  const body = {
    name:        document.getElementById('fieldName').value.trim(),
    sku:         document.getElementById('fieldSku').value.trim(),
    category:    document.getElementById('fieldCategory').value.trim(),
    price:       document.getElementById('fieldPrice').value,
    quantity:    document.getElementById('fieldQuantity').value,
    description: document.getElementById('fieldDescription').value.trim(),
  };

  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true; saveBtn.textContent = 'Saving…';

  try {
    if (id) {
      await apiFetch(`${API}/products/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Product updated successfully');
    } else {
      await apiFetch(`${API}/products`, { method: 'POST', body: JSON.stringify(body) });
      showToast('Product added successfully');
      // refresh categories list if new
      if (!allCategories.includes(body.category)) {
        const opt = document.createElement('option');
        opt.value = body.category; opt.textContent = body.category;
        document.getElementById('categoryFilter').appendChild(opt);
        const dopt = document.createElement('option');
        dopt.value = body.category;
        document.getElementById('categoryList').appendChild(dopt);
        allCategories.push(body.category);
      }
    }
    closeModal();
    await loadProducts();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  } finally {
    saveBtn.disabled = false; saveBtn.textContent = 'Save Product';
  }
});

// ── Delete confirm ────────────────────────────────────────────────────────────
document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  if (!pendingDeleteId) return;
  try {
    await apiFetch(`${API}/products/${pendingDeleteId}`, { method: 'DELETE' });
    closeDeleteModal();
    showToast('Product deleted');
    await loadProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ── Quantity update ───────────────────────────────────────────────────────────
async function updateQuantity(id, qty) {
  try {
    await apiFetch(`${API}/products/${id}/quantity`, {
      method: 'PATCH', body: JSON.stringify({ quantity: qty }),
    });
    // update in memory
    const p = allProducts.find(x => x.id === id);
    if (p) p.quantity = qty;
    updateHeaderStats(allProducts);
    showToast('Quantity updated');
    // refresh stock badge on card
    const card = document.querySelector(`.product-card[data-id="${id}"]`);
    if (card) {
      const { cls, label } = stockInfo(qty);
      const stockBadge = card.querySelector('.card-badge.stock-in, .card-badge.stock-low, .card-badge.stock-out');
      if (stockBadge) {
        stockBadge.className = `card-badge ${cls}`;
        stockBadge.textContent = label;
      }
    }
  } catch (err) {
    showToast(err.message, 'error');
    // revert input
    const input = document.querySelector(`.qty-input[data-id="${id}"]`);
    const p = allProducts.find(x => x.id === id);
    if (input && p) input.value = p.quantity;
  }
}

// ── Event delegation ──────────────────────────────────────────────────────────
document.getElementById('productsContainer').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id, name } = btn.dataset;
  const numId = parseInt(id);

  if (action === 'inc') {
    const input = document.querySelector(`.qty-input[data-id="${id}"]`);
    const newVal = parseInt(input.value) + 1;
    input.value = newVal;
    await updateQuantity(numId, newVal);
  } else if (action === 'dec') {
    const input = document.querySelector(`.qty-input[data-id="${id}"]`);
    const newVal = Math.max(0, parseInt(input.value) - 1);
    input.value = newVal;
    await updateQuantity(numId, newVal);
  } else if (action === 'edit') {
    const product = allProducts.find(p => p.id === numId);
    if (product) openModal(product);
  } else if (action === 'delete') {
    openDeleteModal(numId, btn.dataset.name);
  }
});

document.getElementById('productsContainer').addEventListener('change', async (e) => {
  if (!e.target.classList.contains('qty-input')) return;
  const id = parseInt(e.target.dataset.id);
  let val = parseInt(e.target.value);
  if (isNaN(val) || val < 0) { val = 0; e.target.value = 0; }
  await updateQuantity(id, val);
});

// ── Toolbar ───────────────────────────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadProducts, 300);
});

document.getElementById('categoryFilter').addEventListener('change', loadProducts);

document.getElementById('addProductBtn').addEventListener('click', () => openModal());
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.getElementById('deleteModalClose').addEventListener('click', closeDeleteModal);
document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);

// Close modals on overlay click
document.getElementById('productModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});
document.getElementById('deleteModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeDeleteModal();
});

// Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); closeDeleteModal(); }
});

// View toggle
document.getElementById('gridViewBtn').addEventListener('click', () => {
  isGridView = true;
  document.getElementById('productsContainer').className = 'products-grid';
  document.getElementById('gridViewBtn').classList.add('active');
  document.getElementById('listViewBtn').classList.remove('active');
});
document.getElementById('listViewBtn').addEventListener('click', () => {
  isGridView = false;
  document.getElementById('productsContainer').className = 'products-list';
  document.getElementById('listViewBtn').classList.add('active');
  document.getElementById('gridViewBtn').classList.remove('active');
});

// ── Init ──────────────────────────────────────────────────────────────────────
(async () => {
  await loadCategories();
  await loadProducts();
})();
