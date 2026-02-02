// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()

  // Interaction tracking for bandit feedback
  ; (function () {
    async function sendInteraction(listingId, action, context) {
      try {
        await fetch('/api/search/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId, action, context })
        });
      } catch (_) { }
    }

    document.addEventListener('click', function (e) {
      const el = e.target.closest('[data-listing-id]');
      if (!el) return;
      const id = el.getAttribute('data-listing-id');
      const context = { at: Date.now() };
      sendInteraction(id, 'click', context);
    });
  })();

// Prevent clicks on disabled features (auth-required)
document.addEventListener('DOMContentLoaded', function () {
  const disabledFeatures = document.querySelectorAll('[data-auth-required="true"]');

  disabledFeatures.forEach(element => {
    element.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      // Optional: Show flash message or modal
      console.log('Authentication required to access this feature');
    });
  });

  // Auto-dismiss error flash messages after 2 seconds
  const autoDismissAlerts = document.querySelectorAll('.alert.auto-dismiss');

  autoDismissAlerts.forEach(alert => {
    setTimeout(() => {
      // Add fade-out class for smooth transition
      alert.classList.add('fade-out');

      // Remove from DOM after fade animation completes
      setTimeout(() => {
        // Use Bootstrap's alert close method if available
        const bsAlert = bootstrap.Alert.getInstance(alert);
        if (bsAlert) {
          bsAlert.close();
        } else {
          alert.remove();
        }
      }, 500); // Match the CSS transition duration
    }, 2000); // 2 seconds delay
  });
});