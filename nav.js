(function () {
  var yearEl = document.getElementById('y');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  var navLinks = document.querySelectorAll('nav .links a');
  if (navLinks.length) {
    var current = location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(function (a) {
      if (a.getAttribute('href') === current) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  var toggle = document.querySelector('.menu-toggle');
  var links = document.querySelector('nav .links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('open');
      toggle.classList.toggle('active', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* draw-in for hand-drawn SVG strokes */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var drawables = document.querySelectorAll('.draw');

  if (drawables.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      drawables.forEach(function (d) {
        d.parentElement.classList.add('in-view');
      });
    } else {
      var observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.parentElement.classList.add('in-view');
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.4 });

      drawables.forEach(function (d) {
        observer.observe(d);
      });

      /* fallback so strokes always end up drawn */
      setTimeout(function () {
        drawables.forEach(function (d) {
          d.parentElement.classList.add('in-view');
        });
      }, 1500);
    }
  }
}());
