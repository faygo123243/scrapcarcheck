'use strict';

/* =============================================
   SCRAP CAR CHECK — MAIN JS
   DVLA lookup + quote simulation + lead capture
   ============================================= */

// DVLA Vehicle Enquiry API (free, no auth needed for basic details)
const DVLA_API = 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';

// Stored vehicle state
let currentVehicle = null;

// ── REG LOOKUP ──────────────────────────────────
async function lookupReg(e) {
  e.preventDefault();
  const rawReg = document.getElementById('reg-input').value.trim().replace(/\s+/g, '').toUpperCase();
  if (!rawReg || rawReg.length < 2) return;

  const card = document.getElementById('reg-form-card') || document.querySelector('.reg-form-card');
  const btn = e.target.querySelector('button[type="submit"]');

  // Show loading state
  btn.disabled = true;
  btn.textContent = 'Looking up…';

  clearError();

  try {
    // DVLA Vehicle Enquiry API — free public endpoint
    const resp = await fetch(DVLA_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '' // Public access — no key needed for basic lookup
      },
      body: JSON.stringify({ registrationNumber: rawReg })
    });

    if (resp.ok) {
      const data = await resp.json();
      currentVehicle = {
        reg: rawReg,
        make: data.make || 'Unknown',
        model: data.model || '',
        colour: data.colour || '',
        year: data.yearOfManufacture || '',
        engineSize: data.engineCapacity ? `${Math.round(data.engineCapacity / 100) / 10}L` : '',
        fuelType: data.fuelType || '',
        co2: data.co2Emissions || null,
        weight: estimateWeight(data)
      };
      showVehicleCard(currentVehicle);
    } else {
      // DVLA returned an error — fall back to basic vehicle card with just the reg
      currentVehicle = { reg: rawReg, make: null };
      showVehicleCardManual(rawReg);
    }
  } catch (err) {
    // Network or CORS issue — show manual entry
    currentVehicle = { reg: rawReg, make: null };
    showVehicleCardManual(rawReg);
  }

  btn.disabled = false;
  btn.textContent = 'Get My Scrap Quote →';
}

function estimateWeight(data) {
  // Very rough weight by fuel type / engine size — used for price estimation
  const cc = data.engineCapacity || 1200;
  if (cc < 1000) return 900;
  if (cc < 1400) return 1100;
  if (cc < 1800) return 1300;
  if (cc < 2200) return 1550;
  if (cc < 3000) return 1800;
  return 2100;
}

function showVehicleCard(v) {
  document.getElementById('reg-form-card') && document.querySelector('.reg-form-card').classList.add('hidden');
  document.querySelector('.reg-form-card').classList.add('hidden');

  const detailsEl = document.getElementById('vehicle-details');
  const label = [v.year, v.colour, v.make, v.model].filter(Boolean).join(' ');
  const sub = [v.engineSize, v.fuelType].filter(Boolean).join(' · ');

  detailsEl.innerHTML = `
    <h3>${label || v.reg}</h3>
    <p>${v.reg}${sub ? ' &nbsp;·&nbsp; ' + sub : ''}</p>
  `;

  document.getElementById('vehicle-card').classList.remove('hidden');
  document.getElementById('vehicle-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showVehicleCardManual(reg) {
  document.querySelector('.reg-form-card').classList.add('hidden');
  const detailsEl = document.getElementById('vehicle-details');
  detailsEl.innerHTML = `
    <h3>${reg}</h3>
    <p>We'll confirm your vehicle details when you book collection.</p>
  `;
  document.getElementById('vehicle-card').classList.remove('hidden');
  document.getElementById('vehicle-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetForm() {
  currentVehicle = null;
  document.querySelector('.reg-form-card').classList.remove('hidden');
  document.getElementById('vehicle-card').classList.add('hidden');
  document.getElementById('quotes-section').classList.add('hidden');
  document.getElementById('reg-input').value = '';
  document.getElementById('reg-input').focus();
}

// ── QUOTE GENERATION ────────────────────────────
function getQuotes(e) {
  e.preventDefault();

  const postcode = document.getElementById('postcode').value.trim().toUpperCase();
  const condition = document.getElementById('condition').value;
  const collection = document.getElementById('collection').value;

  if (!postcode || !condition || !collection) return;

  // Hide form, show loading
  document.getElementById('vehicle-card').classList.add('hidden');

  const section = document.getElementById('quotes-section');
  const grid = document.getElementById('quotes-grid');

  section.classList.remove('hidden');
  grid.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Finding the best scrap prices near you…</p></div>';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Simulate network delay, then show quotes
  setTimeout(() => {
    const quotes = generateQuotes(currentVehicle, condition, postcode);
    renderQuotes(quotes, postcode);
  }, 1800);
}

function generateQuotes(vehicle, condition, postcode) {
  // Base price on weight. Condition multipliers applied.
  const weight = (vehicle && vehicle.weight) ? vehicle.weight : 1200; // kg
  const steelPricePer100kg = 14.50; // approx live UK HMS scrap £/100kg
  let basePrice = Math.round((weight / 100) * steelPricePer100kg);

  const condMultiplier = {
    'complete': 1.0,
    'missing-parts': 0.78,
    'accident': 0.65,
    'fire': 0.45
  }[condition] || 1.0;

  basePrice = Math.round(basePrice * condMultiplier);

  // Generate 5 quotes with slight variance
  const dealers = [
    { name: 'National Car Breakers', location: 'Nationwide' },
    { name: 'Green Scrap UK', location: 'Regional ATF' },
    { name: 'QuickScrap', location: 'Local dealer' },
    { name: 'EcoAuto Recycling', location: 'Nationwide' },
    { name: 'TopScrapPrices', location: 'Local ATF' }
  ];

  return dealers.map((d, i) => {
    const variance = (Math.random() - 0.4) * basePrice * 0.18;
    const price = Math.max(80, Math.round(basePrice + variance));
    return { ...d, price, id: `dealer-${i}` };
  }).sort((a, b) => b.price - a.price);
}

function renderQuotes(quotes, postcode) {
  const grid = document.getElementById('quotes-grid');
  const sub = document.getElementById('quotes-sub');

  const outcode = postcode.split(' ')[0];
  sub.textContent = `5 quotes found near ${outcode} · Prices valid for 24 hours · Free collection included`;

  grid.innerHTML = quotes.map((q, i) => `
    <div class="quote-card ${i === 0 ? 'best' : ''}">
      <div class="quote-dealer">
        ${i === 0 ? '<span class="best-badge">★ Best Price</span>' : ''}
        <div class="quote-dealer-name">${q.name}</div>
        <div class="quote-dealer-location">${q.location} · Free collection · Same-day payment</div>
      </div>
      <div class="quote-price">£${q.price}</div>
      <div class="quote-cta">
        <a href="/get-quote/?dealer=${encodeURIComponent(q.name)}&price=${q.price}" class="btn btn-primary ${i === 0 ? '' : 'btn-ghost'}">
          ${i === 0 ? 'Accept &amp; Book' : 'Select'}
        </a>
      </div>
    </div>
  `).join('');
}

// ── FAQ ACCORDION ───────────────────────────────
function toggleFaq(btn) {
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  const answer = btn.nextElementSibling;

  // Close all
  document.querySelectorAll('.faq-q[aria-expanded="true"]').forEach(b => {
    b.setAttribute('aria-expanded', 'false');
    b.nextElementSibling.hidden = true;
  });

  if (!expanded) {
    btn.setAttribute('aria-expanded', 'true');
    answer.hidden = false;
  }
}

// ── ERROR HELPERS ───────────────────────────────
function showError(msg) {
  clearError();
  const el = document.createElement('div');
  el.className = 'error-msg';
  el.id = 'reg-error';
  el.textContent = msg;
  document.querySelector('.reg-form').appendChild(el);
}

function clearError() {
  const el = document.getElementById('reg-error');
  if (el) el.remove();
}

// ── REG INPUT FORMATTING ────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const regInput = document.getElementById('reg-input');
  if (regInput) {
    regInput.addEventListener('input', function () {
      this.value = this.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    });
  }
});
