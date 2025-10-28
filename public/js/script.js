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
;(function(){
  async function sendInteraction(listingId, action, context){
    try{
      await fetch('/api/search/feedback',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ listingId, action, context })
      });
    }catch(_){ }
  }

  document.addEventListener('click', function(e){
    const el = e.target.closest('[data-listing-id]');
    if(!el) return;
    const id = el.getAttribute('data-listing-id');
    const context = { at: Date.now() };
    sendInteraction(id, 'click', context);
  });
})();