/* Scroll-driven charcoal network for the home page.
   Edges sketch themselves in as the reader scrolls; the whole
   drawing "boils" gently like a hand-drawn animation. */
(function () {
    const svg = document.getElementById('net');
    if (!svg) return;

    const NS = 'http://www.w3.org/2000/svg';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* the rail is only shown at >=1200px (see .netrail in style.css);
       below that, skip the animation entirely */
    const railMq = matchMedia('(min-width: 1200px)');
    const filters = ['url(#charcoal)', 'url(#charcoal-2)', 'url(#charcoal-3)'];

    /* on load only the starting node ("Politics") is on the page, with the
       first stroke just beginning; scrolling draws the rest of the journey */
    const BASE = 0.05;

    /* the labels trace the professional journey:
       political science, public opinion, NLP at GESIS, experiments and
       chatbots at MPI, AI ethics, harmful language detection at Penemue */
    const nodes = [
        { id: 'politics', x: 120, y: 120, r: 6, label: 'Politics' },
        { id: 'data',     x: 210, y: 170, r: 7, label: 'Data' },
        { id: 'society',  x:  90, y: 230, r: 5, label: 'Public opinion' },
        { id: 'nlp',      x: 250, y: 300, r: 7, label: 'NLP' },
        { id: 'ml',       x: 150, y: 340, r: 6, label: 'ML' },
        { id: 'text',     x: 280, y: 410, r: 5, label: 'Content moderation', dy: -14 },
        { id: 'humans',   x: 110, y: 460, r: 6, label: 'Experiments' },
        { id: 'ai',       x: 220, y: 520, r: 8, label: 'AI' },
        { id: 'exp',      x:  80, y: 570, r: 5, label: 'Chatbots' },
        { id: 'ethics',   x: 190, y: 650, r: 6, label: 'Ethics' },
        { id: 'harm',     x: 100, y: 690, r: 5, label: 'Harm detection' }
    ];
    /* drawn in this order as the page scrolls */
    const edges = [
        ['politics', 'data'], ['data', 'society'], ['society', 'politics'],
        ['data', 'nlp'], ['nlp', 'ml'], ['ml', 'data'], ['nlp', 'text'],
        ['ml', 'humans'], ['humans', 'ai'], ['ai', 'nlp'], ['humans', 'exp'], ['exp', 'ai'],
        ['ai', 'ethics'], ['ethics', 'harm'], ['harm', 'text'], ['ethics', 'politics']
    ];

    const byId = {};
    nodes.forEach(n => { byId[n.id] = n; });
    const edgeEls = [], nodeEls = {}, labelEls = {}, boilables = [];

    function curve(a, b) {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const off = Math.min(18, len * 0.18);
        const s = (a.x + b.y) % 2 === 0 ? 1 : -1;
        return `M ${a.x} ${a.y} Q ${mx - dy / len * off * s} ${my + dx / len * off * s}, ${b.x} ${b.y}`;
    }

    edges.forEach(([ai, bi]) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', curve(byId[ai], byId[bi]));
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', '#4f4a41');
        p.setAttribute('stroke-width', '1.7');
        p.setAttribute('stroke-linecap', 'round');
        p.setAttribute('filter', 'url(#charcoal)');
        p.setAttribute('pathLength', '1');
        p.style.strokeDasharray = '1';
        p.style.strokeDashoffset = '1';
        svg.appendChild(p);
        edgeEls.push({ el: p, a: ai, b: bi });
        boilables.push(p);
    });

    nodes.forEach(n => {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', n.x); c.setAttribute('cy', n.y); c.setAttribute('r', n.r);
        c.setAttribute('fill', '#2b271f');
        c.setAttribute('filter', 'url(#charcoal-2)');
        c.style.opacity = '0';
        /* charcoal "dab": nodes pop in with a slight overshoot */
        c.style.transformBox = 'fill-box';
        c.style.transformOrigin = 'center';
        c.style.transform = 'scale(.4)';
        c.style.transition = 'opacity .45s ease, transform .55s cubic-bezier(.34,1.56,.64,1)';
        svg.appendChild(c);
        nodeEls[n.id] = c;
        boilables.push(c);
        if (n.label) {
            const t = document.createElementNS(NS, 'text');
            const left = n.x > 170;
            t.setAttribute('x', left ? n.x - n.r - 8 : n.x + n.r + 8);
            t.setAttribute('text-anchor', left ? 'end' : 'start');
            t.setAttribute('y', n.y + 4 + (n.dy || 0));
            t.textContent = n.label;
            t.style.opacity = '0';
            t.style.transition = 'opacity .6s ease .15s';
            svg.appendChild(t);
            labelEls[n.id] = t;
        }
    });

    /* labels last in paint order so they always sit above edges and nodes */
    Object.keys(labelEls).forEach(id => svg.appendChild(labelEls[id]));

    /* smoothstep easing for each edge's draw */
    function smooth(q) { return q * q * (3 - 2 * q); }

    function scrollProgress() {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        const raw = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 1;
        return BASE + (1 - BASE) * raw;
    }

    let current = reduced ? 1 : 0;   /* animated value, eased toward target */
    let target = reduced ? 1 : scrollProgress();
    let rafId = null;

    function render(p) {
        const seen = new Set();
        let lastId = null;
        const n = edgeEls.length;
        /* overlapping windows: ~2.5 edges drawing at once feels organic */
        const span = 2.5 / (n + 1.5);
        edgeEls.forEach((e, i) => {
            const w0 = i / (n + 1.5);
            const q = smooth(Math.min(1, Math.max(0, (p - w0) / span)));
            e.el.style.strokeDashoffset = 1 - q;
            if (q > 0.02) seen.add(e.a);
            if (q > 0.85) { seen.add(e.b); lastId = e.b; }
            else if (q > 0.02) { lastId = e.a; }
        });
        nodes.forEach(nd => {
            const on = seen.has(nd.id);
            const c = nodeEls[nd.id];
            c.style.opacity = on ? '1' : '0';
            c.style.transform = on ? 'scale(1)' : 'scale(.4)';
            if (labelEls[nd.id]) {
                /* the most recently reached label is emphasized */
                labelEls[nd.id].style.opacity = on ? (nd.id === lastId ? '1' : '.72') : '0';
            }
        });
        if (!reduced) {
            svg.style.transform = `translateY(${(p - 0.5) * -18}px) rotate(${(p - 0.5) * 1.6}deg)`;
        }
    }

    function tick() {
        const diff = target - current;
        if (Math.abs(diff) < 0.0015) {
            current = target;
            render(current);
            rafId = null;
            return;
        }
        current += diff * 0.14;
        render(current);
        rafId = requestAnimationFrame(tick);
    }

    function kick() {
        if (reduced) { current = target = 1; render(1); return; }
        target = scrollProgress();
        if (!rafId && railMq.matches) rafId = requestAnimationFrame(tick);
    }

    /* boiling: cycle turbulence seeds so the strokes shiver softly.
       Only runs while the rail is actually visible (wide viewport,
       tab in the foreground) — no wasted repaints on mobile. */
    let boilTimer = null;

    function startBoil() {
        if (boilTimer || reduced) return;
        let f = 0;
        boilTimer = setInterval(() => {
            if (document.hidden) return;
            f = (f + 1) % filters.length;
            boilables.forEach((el, i) => el.setAttribute('filter', filters[(f + i) % filters.length]));
        }, 380);
    }

    function stopBoil() {
        if (boilTimer) { clearInterval(boilTimer); boilTimer = null; }
    }

    function syncRail() {
        if (railMq.matches) { startBoil(); kick(); } else { stopBoil(); }
    }

    if (railMq.addEventListener) {
        railMq.addEventListener('change', syncRail);
    } else if (railMq.addListener) {
        railMq.addListener(syncRail); /* older Safari */
    }
    syncRail();

    addEventListener('scroll', function () {
        if (railMq.matches) kick();
    }, { passive: true });
    kick();
})();
