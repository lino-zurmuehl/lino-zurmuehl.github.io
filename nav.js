(function () {
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
  if (!toggle || !links) {
    return;
  }

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
}());
