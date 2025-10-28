document.addEventListener('DOMContentLoaded', () => {
  const couponInput = document.querySelector('input[name="couponCode"]');
  if (!couponInput) return;
  const form = couponInput.closest('form');
  const applyBtn = document.createElement('button');
  applyBtn.type = 'submit';
  applyBtn.name = 'apply';
  applyBtn.className = 'btn btn-outline-success ms-2';
  applyBtn.textContent = 'Apply Coupon';
  form && form.appendChild(applyBtn);
});


