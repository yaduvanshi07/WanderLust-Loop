(function() {
  window.renderSimpleStats = function(stats) {
    if (!stats || typeof stats !== 'object') {
      console.warn('Invalid stats object:', stats);
      return;
    }
    console.log('Stats:', stats);
    // Future: add chart rendering logic here
  };
})();
