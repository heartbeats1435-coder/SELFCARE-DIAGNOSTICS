/**
 * SELFCARE DIAGNOSTICS - PWA Application Engine
 */

const APP_CONFIG = {
  WHATSAPP_NUMBER: '917010174890',
  COLLECTION_FEE: 100
};

let STATE = {
  tests: [],
  packages: [],
  cart: [],
  selectedCategory: 'all'
};

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  initPWA();
});

async function initApp() {
  await loadTestData();
  await loadPackagesData();
  renderCategories();
  renderTests();
  setupEventListeners();
}

// 1. Fetch JSON Data
async function loadTestData() {
  try {
    const res = await fetch('tests.json');
    STATE.tests = await res.json();
  } catch (err) {
    console.error('Error loading tests.json', err);
  }
}

async function loadPackagesData() {
  try {
    const res = await fetch('packages.json');
    STATE.packages = await res.json();
  } catch (err) {
    console.error('Error loading packages.json', err);
  }
}

// 2. Render UI Components
function renderCategories() {
  const categories = ['Hematology', 'Biochemistry', 'Serology', 'Hormones', 'Vitamin', 'Liver', 'Kidney', 'Thyroid', 'Diabetes', 'Cardiac'];
  const container = document.getElementById('categories-grid');
  if (!container) return;

  container.innerHTML = categories.map(cat => `
    <div class="category-card" onclick="filterByCategory('${cat}')">
      <h4>${cat}</h4>
    </div>
  `).join('');
}

function renderTests(filteredList = null) {
  const container = document.getElementById('tests-grid');
  if (!container) return;

  const listToRender = filteredList || STATE.tests.filter(t => t.Status === 'Active');

  if (listToRender.length === 0) {
    container.innerHTML = `<p>No tests found.</p>`;
    return;
  }

  container.innerHTML = listToRender.map(test => `
    <div class="test-card">
      <div>
        <span class="test-card-cat">${test.Category}</span>
        <h3 class="test-card-title">${test['Test Name']}</h3>
      </div>
      <div>
        <div class="test-card-price">₹${test.Price}</div>
        <button class="btn-primary" onclick="addToCart('${test['Test Name']}', ${test.Price})">Add to Cart</button>
      </div>
    </div>
  `).join('');
}

// 3. Search Engine (Name, Synonyms & Keywords)
function setupEventListeners() {
  const searchInput = document.getElementById('search-input');
  const dropdown = document.getElementById('search-results-dropdown');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      dropdown.classList.add('hidden');
      renderTests();
      return;
    }

    const matches = STATE.tests.filter(t => {
      const nameMatch = t['Test Name'].toLowerCase().includes(query);
      const catMatch = t.Category.toLowerCase().includes(query);
      const keyMatch = t.Keywords && t.Keywords.toLowerCase().includes(query);
      return nameMatch || catMatch || keyMatch;
    });

    // Render Dropdown
    if (matches.length > 0) {
      dropdown.innerHTML = matches.slice(0, 6).map(t => `
        <div class="search-item" onclick="selectSearchResult('${t['Test Name']}')">
          <span><strong>${t['Test Name']}</strong> (${t.Category})</span>
          <span>₹${t.Price}</span>
        </div>
      `).join('');
      dropdown.classList.remove('hidden');
    } else {
      dropdown.innerHTML = `<div class="search-item">No results matching "${query}"</div>`;
      dropdown.classList.remove('hidden');
    }

    renderTests(matches);
  });

  // Cart Controls
  document.getElementById('cart-toggle-btn').addEventListener('click', toggleCart);
  document.getElementById('close-cart-btn').addEventListener('click', toggleCart);
  document.getElementById('proceed-booking-btn').addEventListener('click', () => {
    if (STATE.cart.length === 0) return alert('Your cart is empty!');
    toggleCart();
    document.getElementById('booking-modal').classList.remove('hidden');
  });

  document.getElementById('close-booking-modal').addEventListener('click', () => {
    document.getElementById('booking-modal').classList.add('hidden');
  });

  // Booking Submit Event
  document.getElementById('booking-form').addEventListener('submit', handleBookingSubmit);
}

function filterByCategory(cat) {
  const filtered = STATE.tests.filter(t => t.Category.toLowerCase() === cat.toLowerCase());
  renderTests(filtered);
}

function selectSearchResult(testName) {
  document.getElementById('search-results-dropdown').classList.add('hidden');
  const selected = STATE.tests.filter(t => t['Test Name'] === testName);
  renderTests(selected);
}

// 4. Cart Engine
function addToCart(name, price) {
  const existing = STATE.cart.find(item => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    STATE.cart.push({ name, price, qty: 1 });
  }
  updateCartUI();
}

function updateCartUI() {
  const badge = document.getElementById('cart-badge');
  const container = document.getElementById('cart-items-container');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-grand-total');

  const totalItems = STATE.cart.reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = totalItems;

  if (STATE.cart.length === 0) {
    container.innerHTML = `<p class="empty-cart-text">Your cart is empty.</p>`;
    subtotalEl.textContent = '₹0';
    totalEl.textContent = '₹0';
    return;
  }

  let subtotal = 0;
  container.innerHTML = STATE.cart.map(item => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;
    return `
      <div class="cart-item">
        <div>
          <strong>${item.name}</strong><br>
          <small>₹${item.price} x ${item.qty}</small>
        </div>
        <div>
          <strong>₹${itemTotal}</strong>
        </div>
      </div>
    `;
  }).join('');

  const grandTotal = subtotal + APP_CONFIG.COLLECTION_FEE;
  subtotalEl.textContent = `₹${subtotal}`;
  totalEl.textContent = `₹${grandTotal}`;
}

function toggleCart() {
  document.getElementById('cart-drawer').classList.toggle('active');
}

// 5. WhatsApp Dispatcher
function handleBookingSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('p-name').value;
  const age = document.getElementById('p-age').value;
  const gender = document.getElementById('p-gender').value;
  const mobile = document.getElementById('p-mobile').value;
  const type = document.getElementById('p-type').value;
  const address = document.getElementById('p-address').value;
  const date = document.getElementById('p-date').value;
  const time = document.getElementById('p-time').value;

  const testListStr = STATE.cart.map(i => `- ${i.name} (${i.qty}x)`).join('\n');
  const subtotal = STATE.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const grandTotal = subtotal + APP_CONFIG.COLLECTION_FEE;

  const message = `*NEW BOOKING - SELFCARE DIAGNOSTICS*\n` +
                  `=============================\n` +
                  `*Patient:* ${name} (${age}/${gender})\n` +
                  `*Mobile:* ${mobile}\n` +
                  `*Service:* ${type}\n` +
                  `*Address:* ${address}\n` +
                  `*Schedule:* ${date} @ ${time}\n` +
                  `=============================\n` +
                  `*Selected Tests:*\n${testListStr}\n` +
                  `=============================\n` +
                  `*Home Collection:* ₹${APP_CONFIG.COLLECTION_FEE}\n` +
                  `*Grand Total:* ₹${grandTotal}\n` +
                  `=============================`;

  const waUrl = `https://wa.me/${APP_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');
}

// 6. PWA Registration
function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('SW Registered'))
      .catch(err => console.error('SW Error', err));
  }
}
