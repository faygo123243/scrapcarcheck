'use strict';

let currentReg = null;

// REG SUBMISSION
function lookupReg(e) {
  e.preventDefault();
  const raw = document.getElementById('reg-input').value.trim().replace(/\s+/g, '').toUpperCase();
  if (!raw || raw.length < 2) return;
  currentReg = raw;

  document.querySelector('.reg-form-card').classList.add('hidden');
  document.getElementById('vehicle-card').classList.remove('hidden');
  document.getElementById('vehicle-card').scrollIntoView({ behavior: 'smooth', block: 'center' });

  const detailsEl = document.getElementById('vehicle-details');
  detailsEl.innerHTML = `
    <h3>${raw}</h3>
    <p>We'll confirm your vehicle details when we match you with dealers.</p>
  `;
}

function resetForm() {
  currentReg = null;
  document.querySelector('.reg-form-card').classList.remove('hidden');
  document.getElementById('vehicle-card').classList.add('hidden');
  document.getElementById('quotes-section').classList.add('hidden');
  document.getElementById('reg-input').value = '';
  document.getElementById('reg-input').focus();
}

// LEAD CAPTURE SUBMIT
function getQuotes(e) {
  e.preventDefault();

  const postcode = document.getElementById('postcode').value.trim().toUpperCase();
  const condition = document.getElementById('condition').value;
  const name = document.getElementById('lead-name').value.trim();
  const phone = document.getElementById('lead-phone').value.trim();

  if (!postcode || !condition || !name || !phone) return;

  document.getElementById('vehicle-card').classList.add('hidden');

  const section = document.getElementById('quotes-section');
  section.classList.remove('hidden');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const outcode = postcode.split(' ')[0];

  section.innerHTML = `
    <div style="text-align:center;padding:40px 20px;">
      <div style="font-size:3rem;margin-bottom:16px;">&#x2705;</div>
      <h2 style="font-size:1.5rem;font-weight:800;margin-bottom:12px;color:var(--slate-900);">You're on the list, ${name.split(' ')[0]}!</h2>
      <p style="color:var(--slate-600);max-width:460px;margin:0 auto 24px;">We're matching your <strong>${currentReg || 'vehicle'}</strong> with licensed scrap dealers near <strong>${outcode}</strong>. You'll hear from up to 3 authorised dealers within 2 hours.</p>
      <div style="background:var(--green-light);border-radius:12px;padding:20px;max-width:400px;margin:0 auto 28px;text-align:left;">
        <p style="font-size:.9rem;color:var(--slate-700);margin:0 0 8px;font-weight:600;">What happens next:</p>
        <p style="font-size:.88rem;color:var(--slate-600);margin:0 0 6px;">&#x2714; Dealers contact you directly by phone</p>
        <p style="font-size:.88rem;color:var(--slate-600);margin:0 0 6px;">&#x2714; Free collection arranged at your convenience</p>
        <p style="font-size:.88rem;color:var(--slate-600);margin:0;">&#x2714; Paid by bank transfer on collection day</p>
      </div>
      <button class="btn btn-ghost" onclick="resetForm()">Get another quote</button>
    </div>
  `;
}

// FAQ
function toggleFaq(btn) {
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  document.querySelectorAll('.faq-q[aria-expanded="true"]').forEach(b => {
    b.setAttribute('aria-expanded', 'false');
    b.nextElementSibling.hidden = true;
  });
  if (!expanded) {
    btn.setAttribute('aria-expanded', 'true');
    btn.nextElementSibling.hidden = false;
  }
}

// Mobile nav
function toggleNav(btn) {
  const nav = document.querySelector('.main-nav');
  const open = nav.classList.toggle('open');
  btn.setAttribute('aria-expanded', open);
}

// Reg input formatting
document.addEventListener('DOMContentLoaded', () => {
  const regInput = document.getElementById('reg-input');
  if (regInput) {
    regInput.addEventListener('input', function () {
      this.value = this.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    });
  }
});
