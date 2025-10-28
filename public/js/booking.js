document.addEventListener('DOMContentLoaded', () => {
  const priceEl = document.querySelector('[data-nightly-price]');
  const checkinEl = document.getElementById('checkin');
  const checkoutEl = document.getElementById('checkout');
  const couponEl = document.getElementById('couponCode');
  const summaryEl = document.getElementById('booking-summary');
  if (!priceEl || !checkinEl || !checkoutEl || !summaryEl) return;

  function calc() {
    const nightly = Number(priceEl.getAttribute('data-nightly-price')) || 0;
    const checkin = new Date(checkinEl.value);
    const checkout = new Date(checkoutEl.value);
    let days = Math.ceil((checkout - checkin) / (1000*60*60*24));
    if (!isFinite(days) || days < 1) days = 1;
    const basePrice = nightly * days;
    const tax = basePrice * 0.18;
    const serviceFee = 200;
    let discount = 0;
    const code = (couponEl && couponEl.value || '').trim().toUpperCase();
    if (code && code.includes('SAVE')) {
      discount = Math.min(basePrice, Math.round(basePrice * 0.1));
    }
    const total = basePrice - discount + tax + serviceFee;
    summaryEl.innerHTML = `
      <div><strong>Nights:</strong> ${days}</div>
      <div><strong>Base:</strong> ₹${basePrice.toFixed(2)}</div>
      <div><strong>Discount:</strong> -₹${discount.toFixed(2)}</div>
      <div><strong>GST (18%):</strong> ₹${tax.toFixed(2)}</div>
      <div><strong>Service fee:</strong> ₹${serviceFee.toFixed(2)}</div>
      <div class="fw-bold fs-5 text-success"><strong>Total:</strong> ₹${total.toFixed(2)}</div>
    `;
  }

  ['change','keyup'].forEach(ev => {
    checkinEl.addEventListener(ev, calc);
    checkoutEl.addEventListener(ev, calc);
    couponEl && couponEl.addEventListener(ev, calc);
  });

  calc();
});


