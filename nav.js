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

  /* mini-TOC scrollspy: highlight the section currently in view */
  var toc = document.querySelector('.mini-toc');
  if (toc && 'IntersectionObserver' in window) {
    var tocLinks = toc.querySelectorAll('a[href^="#"]');
    var byId = {};
    tocLinks.forEach(function (a) {
      byId[a.getAttribute('href').slice(1)] = a;
    });
    var sections = Object.keys(byId)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    if (sections.length) {
      var setActive = function (id) {
        tocLinks.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + id;
          a.classList.toggle('active', on);
          if (on) {
            a.setAttribute('aria-current', 'true');
          } else {
            a.removeAttribute('aria-current');
          }
        });
      };

      var visible = {};
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting;
        });
        for (var i = sections.length - 1; i >= 0; i--) {
          if (visible[sections[i].id]) {
            setActive(sections[i].id);
            return;
          }
        }
      }, { rootMargin: '-25% 0px -60% 0px' });

      sections.forEach(function (s) { spy.observe(s); });
    }
  }

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* scroll reveal: sections fade up and h2 underlines draw in.
     Applied via JS so nothing is ever hidden if scripts fail. */
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    var revealables = document.querySelectorAll('main section');
    revealables.forEach(function (s, i) {
      if (i > 0) { s.classList.add('reveal'); }
    });
    var revealObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (s) { revealObs.observe(s); });
  }

  /* draw-in for hand-drawn SVG strokes */
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
