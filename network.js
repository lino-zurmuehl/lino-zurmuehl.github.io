/* Scroll-driven charcoal network for the home page.
   Edges sketch themselves in as the reader scrolls; the whole
   drawing "boils" gently like a hand-drawn animation. */
(function () {
    const svg = document.getElementById('net');
    if (!svg) return;

    const NS = 'http://www.w3.org/2000/svg';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const filters = ['url(#charcoal)', 'url(#charcoal-2)', 'url(#charcoal-3)'];

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
        c.style.transition = 'opacity .5s ease';
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

    let ticking = false;
    function onScroll() {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }

    function update() {
        ticking = false;
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        const p = reduced ? 1 : (max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 1);
        const seen = new Set();
        const n = edgeEls.length;
        edgeEls.forEach((e, i) => {
            const w0 = i / n, w1 = (i + 1) / n;
            const q = Math.min(1, Math.max(0, (p - w0) / (w1 - w0)));
            e.el.style.strokeDashoffset = 1 - q;
            if (q > 0.02) seen.add(e.a);
            if (q > 0.85) seen.add(e.b);
        });
        nodes.forEach(nd => {
            const on = seen.has(nd.id);
            nodeEls[nd.id].style.opacity = on ? '1' : '0';
            if (labelEls[nd.id]) labelEls[nd.id].style.opacity = on ? '.9' : '0';
        });
        if (!reduced) {
            svg.style.transform = `translateY(${(p - 0.5) * -18}px) rotate(${(p - 0.5) * 1.6}deg)`;
        }
    }

    /* boiling: cycle turbulence seeds so the strokes shiver softly */
    if (!reduced) {
        let f = 0;
        setInterval(() => {
            if (document.hidden) return;
            f = (f + 1) % filters.length;
            boilables.forEach((el, i) => el.setAttribute('filter', filters[(f + i) % filters.length]));
        }, 380);
    }

    addEventListener('scroll', onScroll, { passive: true });
    update();
})();
