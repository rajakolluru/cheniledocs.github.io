// Mobile nav toggle
(function () {
  var t = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (t && links) t.addEventListener('click', function () { links.classList.toggle('open'); });
})();

// Animated stat counters (count up when scrolled into view)
(function () {
  var nums = document.querySelectorAll('.stat .num[data-target]');
  if (!nums.length || !('IntersectionObserver' in window)) return;
  var animate = function (el) {
    var target = parseFloat(el.getAttribute('data-target'));
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1200, start = null;
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = (Number.isInteger(target) ? Math.round(val) : val.toFixed(0)) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    };
    requestAnimationFrame(step);
  };
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  nums.forEach(function (n) { io.observe(n); });
})();
