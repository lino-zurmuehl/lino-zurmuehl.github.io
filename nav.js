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

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setupBackgroundGraph(prefersReducedMotion);
  setupReveal(prefersReducedMotion);
  if (!prefersReducedMotion) {
    setupCursorGlow();
  }

  function setupReveal(reducedMotion) {
    var targets = document.querySelectorAll('main section, .project-card, .result-card, .feature-image, .key-points li');
    if (!targets.length) {
      return;
    }

    document.body.classList.add('js-motion');

    targets.forEach(function (el) {
      el.classList.add('motion-reveal');
    });

    if (reducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -10% 0px"
    });

    targets.forEach(function (el, index) {
      el.style.transitionDelay = ((index % 6) * 70) + "ms";
      observer.observe(el);
    });
  }

  function setupCursorGlow() {
    if (!window.matchMedia('(pointer: fine)').matches || !document.body) {
      return;
    }

    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    var targetX = window.innerWidth / 2;
    var targetY = window.innerHeight / 2;
    var currentX = targetX;
    var currentY = targetY;
    var rafId = null;

    function paint() {
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      glow.style.transform = "translate3d(" + (currentX - 160) + "px," + (currentY - 160) + "px,0)";

      if (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > 0.2) {
        rafId = window.requestAnimationFrame(paint);
      } else {
        rafId = null;
      }
    }

    document.addEventListener('pointermove', function (event) {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!rafId) {
        rafId = window.requestAnimationFrame(paint);
      }
    });
  }

  function setupBackgroundGraph(reducedMotion) {
    if (!document.body || !('HTMLCanvasElement' in window)) {
      return;
    }

    var canvas = document.createElement('canvas');
    canvas.className = 'data-graph-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    if (!ctx) {
      canvas.remove();
      return;
    }

    var width = 0;
    var height = 0;
    var dpr = 1;
    var rafId = null;
    var lines = [
      { baseline: 0.27, ampA: 0.11, ampB: 0.035, freqA: 0.012, freqB: 0.023, speed: 0.65, phase: 0.2, color: 'rgba(127, 211, 255, 0.30)', glow: 'rgba(127, 211, 255, 0.16)', stroke: 2.1 },
      { baseline: 0.46, ampA: 0.085, ampB: 0.03, freqA: 0.010, freqB: 0.02, speed: 0.48, phase: 1.4, color: 'rgba(185, 159, 102, 0.28)', glow: 'rgba(185, 159, 102, 0.14)', stroke: 1.9 },
      { baseline: 0.68, ampA: 0.07, ampB: 0.025, freqA: 0.009, freqB: 0.019, speed: 0.36, phase: 2.6, color: 'rgba(255, 255, 255, 0.17)', glow: 'rgba(255, 255, 255, 0.08)', stroke: 1.7 }
    ];

    function getY(line, x, t, index) {
      var drift = Math.sin((t * 0.22) + index * 1.8) * (height * 0.03);
      var base = (height * line.baseline) + drift;
      var waveA = Math.sin((x * line.freqA) + (t * line.speed) + line.phase) * (height * line.ampA);
      var waveB = Math.cos((x * line.freqB) - (t * line.speed * 0.55) + line.phase * 1.5) * (height * line.ampB);
      return base + waveA + waveB;
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawGrid(t) {
      var rows = 7;
      for (var i = 1; i < rows; i += 1) {
        var y = ((height / rows) * i) + (Math.sin(t * 0.14 + i * 0.8) * 4);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    function drawLines(t) {
      lines.forEach(function (line, index) {
        var x;
        var y;
        var lastY = 0;

        ctx.beginPath();
        for (x = 0; x <= width; x += 7) {
          y = getY(line, x, t, index);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          lastY = y;
        }

        ctx.strokeStyle = line.glow;
        ctx.lineWidth = line.stroke + 3;
        ctx.stroke();

        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.stroke;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(width - 8, lastY, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = line.color;
        ctx.fill();
      });
    }

    function paint(t) {
      ctx.clearRect(0, 0, width, height);
      drawGrid(t);
      drawLines(t);
    }

    function frame(ms) {
      paint(ms * 0.001);
      rafId = window.requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);

    if (reducedMotion) {
      paint(0);
      return;
    }

    rafId = window.requestAnimationFrame(frame);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
        return;
      }

      if (!rafId) {
        rafId = window.requestAnimationFrame(frame);
      }
    });
  }
}());
