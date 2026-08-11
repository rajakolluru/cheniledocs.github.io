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

/* ============================================================
   Interactive JavaScript schematics
   Declared in markup as: <div class="jsx" data-jsx="TYPE"></div>
   ============================================================ */
(function () {
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- animated request-processing pipeline (flowing token) ----------
  function pipeline(root) {
    var stages = (root.getAttribute('data-stages') || 'Exchange,Security,Tenancy,i18n,Logging,Service').split(',');
    var notes = {
      Exchange:'The request is normalized into a <b>ChenileExchange</b>.',
      Security:'Authenticate &amp; authorize — a policy interceptor (an Owiz command).',
      Tenancy:'Resolve the tenant into the <b>ContextContainer</b>.',
      i18n:'Localize messages for the caller.',
      Logging:'Structured, correlation-aware logging.',
      Service:'Your <b>pure business logic</b> runs here.'
    };
    var flow = el('div', 'flow');
    var row = el('div', 'jsx-row');
    var token = el('div', 'jsx-token');
    var chips = stages.map(function (s) { var c = el('div', 'jsx-chip', esc(s)); row.appendChild(c); return c; });
    flow.appendChild(row); flow.appendChild(token);
    var note = el('div', 'jsx-note', 'A request flows through the Owiz-powered interception chain before your service. Press <b>Play</b>.');
    var bar = el('div', 'jsx-bar');
    var play = el('button', 'jsx-btn', '▶ Play'); var step = el('button', 'jsx-btn ghost', 'Step'); var reset = el('button', 'jsx-btn ghost', 'Reset');
    bar.appendChild(play); bar.appendChild(step); bar.appendChild(reset);
    var i = -1, timer = null;
    function moveToken(k) {
      var c = chips[k]; if (!c) return;
      token.style.transform = 'translate(' + (c.offsetLeft + c.offsetWidth / 2 - 8) + 'px,' + (c.offsetTop + c.offsetHeight / 2 - 8) + 'px)';
    }
    function show(k) {
      chips.forEach(function (c, x) { c.classList.toggle('on', x === k); c.classList.toggle('done', x < k); });
      var c = chips[k]; if (c) { c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse'); }
      note.innerHTML = '<b>' + esc(stages[k]) + '</b> — ' + (notes[stages[k]] || '');
      moveToken(k);
    }
    function advance() {
      i++;
      if (i >= stages.length) { note.innerHTML = '✅ Response flows back out through the same chain.'; i = -1; chips.forEach(function (c) { c.classList.remove('on', 'done'); }); moveToken(0); return; }
      show(i);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } flow.classList.remove('playing'); play.innerHTML = '▶ Play'; }
    function start() {
      flow.classList.add('playing'); play.innerHTML = '❚❚ Pause';
      if (i < 0) { i = 0; show(0); }
      timer = setInterval(advance, reduced ? 1400 : 1050);
    }
    play.onclick = function () { timer ? stop() : start(); };
    step.onclick = function () { stop(); flow.classList.add('playing'); advance(); };
    reset.onclick = function () { stop(); i = -1; chips.forEach(function (c) { c.classList.remove('on', 'done'); }); note.innerHTML = 'Reset. Press <b>Play</b> or <b>Step</b>.'; moveToken(0); };
    root.appendChild(flow); root.appendChild(note); root.appendChild(bar);
    // position token once laid out; autoplay when scrolled into view
    setTimeout(function () { moveToken(0); }, 60);
    if ('IntersectionObserver' in window) {
      var seen = false;
      new IntersectionObserver(function (es, ob) { es.forEach(function (e) { if (e.isIntersecting && !seen) { seen = true; setTimeout(start, 400); ob.disconnect(); } }); }, { threshold: 0.4 }).observe(root);
    }
  }

  // ---------- animated state machine (token walks the flow) ----------
  function statemachine(root) {
    var mainPath = [
      { id: 'REQUESTED', kind: 'initial' },
      { id: 'APPROVED',  ev: 'approve' },
      { id: 'LABEL_SENT',ev: 'ship' },
      { id: 'INSPECTION',ev: 'receive', kind: 'auto' }
    ];
    var track = el('div', 'anim-track'), scroll = el('div', 'anim-scroll');
    scroll.appendChild(track);
    var cap = el('div', 'anim-cap', 'An entity walks its states as events fire. Press <b>Play</b>.');
    var bar = el('div', 'anim-bar');
    var play = el('button', 'jsx-btn', '▶ Play'), step = el('button', 'jsx-btn ghost', 'Step'), reset = el('button', 'jsx-btn ghost', 'Reset');
    bar.appendChild(play); bar.appendChild(step); bar.appendChild(reset);
    var nodes = [], conns = [], seq = [], i = -1, timer = null, damaged = false;
    function build() {
      track.innerHTML = ''; nodes = []; conns = [];
      var term = damaged ? { id: 'REJECTED', ev: 'damaged', kind: 'terminal' } : { id: 'REFUNDED', ev: 'ok', kind: 'terminal' };
      seq = mainPath.concat([term]);
      seq.forEach(function (s, k) {
        if (k > 0) { var cn = el('div', 'anim-conn'); cn.innerHTML = '<span class="elbl">' + esc(s.ev) + '</span><span class="spark"></span>'; track.appendChild(cn); conns.push(cn); }
        var kindLbl = s.kind === 'initial' ? 'manual · initial' : s.kind === 'auto' ? 'auto' : s.kind === 'terminal' ? 'terminal' : 'manual';
        var n = el('div', 'anim-state' + (s.kind === 'auto' ? ' auto' : ''), '<span class="k">' + kindLbl + '</span>' + esc(s.id));
        track.appendChild(n); nodes.push(n);
      });
    }
    function clearHi() { nodes.forEach(function (n) { n.classList.remove('active', 'visited'); }); conns.forEach(function (c) { c.classList.remove('lit'); }); }
    function show(k) {
      nodes.forEach(function (n, x) { n.classList.toggle('active', x === k); n.classList.toggle('visited', x < k); });
      if (k > 0) conns[k - 1].classList.add('lit');
      var s = seq[k];
      cap.innerHTML = k === 0 ? 'Created in <b>' + esc(s.id) + '</b> (initial state).'
        : (s.kind === 'terminal' && s.id === 'REFUNDED' ? 'Auto state inspected the item → <span class="ev">ok</span> → <b>REFUNDED</b>.'
        : s.kind === 'terminal' ? 'Auto state inspected the item → <span class="ev">damaged</span> → <b>REJECTED</b>.'
        : 'Event <span class="ev">' + esc(s.ev) + '</span> → entered <b>' + esc(s.id) + '</b>.');
      var n = nodes[k]; if (n && n.scrollIntoView) { /* keep visible on small screens */ }
    }
    function advance() {
      i++;
      if (i >= seq.length) { i = -1; damaged = !damaged; build(); clearHi(); cap.innerHTML = 'Restarting — this run takes the <b>' + (damaged ? 'damaged' : 'ok') + '</b> branch at inspection.'; return; }
      show(i);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } play.innerHTML = '▶ Play'; }
    function start() { play.innerHTML = '❚❚ Pause'; if (i < 0) { i = 0; show(0); } timer = setInterval(advance, reduced ? 1500 : 1150); }
    play.onclick = function () { timer ? stop() : start(); };
    step.onclick = function () { stop(); advance(); };
    reset.onclick = function () { stop(); i = -1; damaged = false; build(); clearHi(); cap.innerHTML = 'Reset. Press <b>Play</b> or <b>Step</b>.'; };
    build();
    root.appendChild(scroll); root.appendChild(cap); root.appendChild(bar);
    if ('IntersectionObserver' in window) {
      var seen = false;
      new IntersectionObserver(function (es, ob) { es.forEach(function (e) { if (e.isIntersecting && !seen) { seen = true; setTimeout(start, 400); ob.disconnect(); } }); }, { threshold: 0.4 }).observe(root);
    }
  }

  // ---------- Owiz EIP explorer ----------
  function owiz(root) {
    var blocks = {
      Chain:      { d: 'Run commands in sequence. Each command enriches the shared Context before passing it on. This is how Chenile builds its interception pipeline.', g: ['C1', '→', 'C2', '→', 'C3'] },
      Router:     { d: 'Pick the next command by evaluating a condition (OGNL). One input, many possible paths — like a switch statement over the Context.', g: ['in', '→', '◇', '→', 'A / B'] },
      'Splitter–Aggregator': { d: 'Fan a collection out to a command, run each item, then combine the results back into one — scatter-gather.', g: ['list', '→', 'split', '→', '▮ ▮ ▮', '→', 'join'] },
      Parallel:   { d: 'Run commands concurrently and join when all finish — for independent work that should not block each other.', g: ['in', '→', 'A ∥ B ∥ C', '→', 'join'] }
    };
    var keys = Object.keys(blocks);
    var tabs = el('div', 'jsx-tabs');
    var stage = el('div', 'jsx-stage');
    var diag = el('div', 'jsx-diagram');
    var desc = el('div', 'jsx-note');
    function show(k) {
      Array.prototype.forEach.call(tabs.children, function (b) { b.classList.toggle('active', b.textContent === k); });
      diag.innerHTML = ''; blocks[k].g.forEach(function (t) { diag.appendChild(el('span', /→|∥|◇/.test(t) ? 'jsx-op' : 'jsx-box', esc(t))); });
      desc.innerHTML = '<b>' + esc(k) + '</b> — ' + blocks[k].d;
    }
    keys.forEach(function (k) { var b = el('button', 'jsx-tab', esc(k)); b.onclick = function () { show(k); }; tabs.appendChild(b); });
    stage.appendChild(diag);
    root.appendChild(tabs); root.appendChild(stage); root.appendChild(desc); show(keys[0]);
  }

  // ---------- Chenile Query builder ----------
  function query(root) {
    var data = [
      { id: 1, name: 'Asha',   branch: 'CSE',  percentage: 91 },
      { id: 2, name: 'Bharat', branch: 'ECE',  percentage: 78 },
      { id: 3, name: 'Chitra', branch: 'CSE',  percentage: 85 },
      { id: 4, name: 'Deepak', branch: 'MECH', percentage: 66 },
      { id: 5, name: 'Esha',   branch: 'CSE',  percentage: 88 },
      { id: 6, name: 'Farid',  branch: 'ECE',  percentage: 72 }
    ];
    var ctr = el('div', 'jsx-controls');
    ctr.innerHTML =
      '<label>name <span>like</span><input type="text" data-q="name" placeholder="e.g. a"></label>' +
      '<label>branch <span>contains</span><select data-q="branch"><option value="">All</option><option>CSE</option><option>ECE</option><option>MECH</option></select></label>' +
      '<label>sort <span>percentage</span><select data-q="sort"><option value="">none</option><option value="desc">high→low</option><option value="asc">low→high</option></select></label>';
    var split = el('div', 'jsx-2col');
    var reqBox = el('pre', 'jsx-json'); var resWrap = el('div', 'jsx-result');
    split.appendChild(reqBox); split.appendChild(resWrap);
    function run() {
      var name = ctr.querySelector('[data-q=name]').value.trim();
      var branch = ctr.querySelector('[data-q=branch]').value;
      var sort = ctr.querySelector('[data-q=sort]').value;
      var filters = {};
      if (name) filters.name = { op: 'like', value: name };
      if (branch) filters.branch = { op: 'contains', value: branch };
      var req = { entity: 'Student.getAll', filters: filters };
      if (sort) req.sort = [{ column: 'percentage', order: sort }];
      req.page = { from: 0, size: 10 };
      reqBox.textContent = JSON.stringify(req, null, 2);
      var rows = data.filter(function (r) {
        return (!name || r.name.toLowerCase().indexOf(name.toLowerCase()) >= 0) && (!branch || r.branch === branch);
      });
      if (sort) rows.sort(function (a, b) { return sort === 'desc' ? b.percentage - a.percentage : a.percentage - b.percentage; });
      var html = '<table><thead><tr><th>id</th><th>name</th><th>branch</th><th>%</th></tr></thead><tbody>';
      rows.forEach(function (r) { html += '<tr><td>' + r.id + '</td><td>' + esc(r.name) + '</td><td>' + esc(r.branch) + '</td><td>' + r.percentage + '</td></tr>'; });
      html += '</tbody></table><div class="jsx-count">' + rows.length + ' row' + (rows.length === 1 ? '' : 's') + ' · no Java written</div>';
      resWrap.innerHTML = html;
    }
    ctr.addEventListener('input', run);
    root.appendChild(ctr); root.appendChild(split); run();
  }

  // ---------- Multi-tenant router ----------
  function tenant(root) {
    var t = {
      tenant1: { name: 'Acme',   ds: 'jdbc:…/acme',   color: '#c01860', plan: 'pro',   rows: 128 },
      tenant2: { name: 'Globex', ds: 'jdbc:…/globex', color: '#2563eb', plan: 'free',  rows: 42 },
      tenant3: { name: 'Initech',ds: 'jdbc:…/initech',color: '#0d9488', plan: 'pro',   rows: 301 }
    };
    var keys = Object.keys(t);
    var tabs = el('div', 'jsx-tabs');
    var flow = el('div', 'jsx-flow');
    keys.forEach(function (k) { var b = el('button', 'jsx-tab', k); b.onclick = function () { show(k); }; tabs.appendChild(b); });
    function show(k) {
      Array.prototype.forEach.call(tabs.children, function (b) { b.classList.toggle('active', b.textContent === k); });
      var d = t[k];
      flow.innerHTML =
        '<div class="jsx-lane"><span class="jsx-tag">request header</span><code>x-chenile-tenant-id: ' + k + '</code></div>' +
        '<div class="jsx-arrow">↓ resolved into <b>ContextContainer.getTenant()</b></div>' +
        '<div class="jsx-cards">' +
          '<div class="jsx-mini"><h5>💾 Write datasource</h5><code>' + esc(d.ds) + '</code><p>multi-datasource-utils routes JPA writes here.</p></div>' +
          '<div class="jsx-mini"><h5>🔎 Query datasource</h5><code>' + esc(d.ds) + '?ro</code><p>chenile-query reads this tenant\'s rows.</p></div>' +
          '<div class="jsx-mini"><h5>🎛️ cconfig override</h5><code>plan = ' + d.plan + '</code><p>per-tenant config by customAttribute.</p></div>' +
        '</div>' +
        '<div class="jsx-out" style="border-color:' + d.color + '">Same code · <b style="color:' + d.color + '">' + esc(d.name) + '</b> sees only its ' + d.rows + ' rows &amp; its config.</div>';
    }
    root.appendChild(tabs); root.appendChild(flow); show(keys[0]);
  }

  // ---------- jgen blueprint picker ----------
  function blueprint(root) {
    var bp = {
      'chenile-service': { d: 'A plain Chenile service.', mods: ['svc-api', 'svc-service'], dep: 'chenile-core' },
      'wfservice':       { d: 'A standard workflow service (fixed status model).', mods: ['svc-api', 'svc-service'], dep: 'workflow-api · workflow-service · stm-generate-puml' },
      'wfcustom':        { d: 'A custom workflow from your own STM XML.', mods: ['svc-api', 'svc-service'], dep: 'workflow-api · workflow-service · stm-generate-puml' },
      'mybatisQuery':    { d: 'A metadata-driven query service over MyBatis.', mods: ['query-api', 'query-service'], dep: 'chenile-query-controller' },
      'minimonolith':    { d: 'A deployable that hosts one or more services.', mods: ['deploy'], dep: 'chenile-http' },
      'chenile-interceptor': { d: 'A reusable policy interceptor.', mods: ['interceptor'], dep: 'chenile-core' },
      'it':              { d: 'An integration-test harness.', mods: ['it-tests'], dep: 'it-cucumber-utils' },
      'batch':           { d: 'A batch/bulk-processing job.', mods: ['batch'], dep: 'chenile-core' },
      'jgen-blueprint':  { d: 'A blueprint that generates blueprints (meta!).', mods: ['bp-yourthing'], dep: 'jgen' }
    };
    var keys = Object.keys(bp);
    var sel = el('select', 'jsx-select');
    keys.forEach(function (k) { sel.appendChild(el('option', null, k)); });
    var out = el('div', 'jsx-bp');
    function show() {
      var k = sel.value, b = bp[k];
      out.innerHTML = '<p class="jsx-bp-d">' + esc(b.d) + '</p>' +
        '<div class="jsx-flow2"><span class="jsx-tag">jgen ' + esc(k) + '</span><span class="jsx-op">→</span>' +
        b.mods.map(function (m) { return '<span class="jsx-box">' + esc(m) + '</span>'; }).join('<span class="jsx-op">+</span>') +
        '</div><div class="jsx-count">compiles against <code>' + esc(b.dep) + '</code></div>';
    }
    sel.onchange = show;
    var wrap = el('div', 'jsx-controls');
    var lab = el('label', null, 'blueprint '); lab.appendChild(sel); wrap.appendChild(lab);
    root.appendChild(wrap); root.appendChild(out); show();
  }

  // ---------- animated trajectory switch ----------
  function trajectory(root) {
    var T = {
      '(default)': { hdr: '— no trajectory header —', impl: 'S1ServiceImpl', err: 'error 1234 · "not valid"', action: 'returnsApproveAction', cfg: 'plan = standard', note: 'Default wiring — no trajectory in play.', ch: { impl: 0, action: 0, cfg: 0 } },
      't1': { hdr: 'x-chenile-trajectory-id: t1', impl: 'S1<b>T1</b>ServiceImpl', err: 'error 1235 · "is illegal"', action: 'returnsApprove<b>T1</b>Action', cfg: 'plan = experimental', note: '@ConditionalOnTrajectory swaps the service bean · the resolver finds the t1 action · cconfig returns the t1 value.', ch: { impl: 1, action: 1, cfg: 1 } },
      't2': { hdr: 'x-chenile-trajectory-id: t2', impl: 'S1ServiceImpl <span class="fallback">fallback</span>', err: 'error 1234 · "not valid"', action: 'returnsApproveAction <span class="fallback">fallback</span>', cfg: 'plan = pilot', note: 't2 overrides only config — the service &amp; action fall back to default. Overrides are selective.', ch: { impl: 0, action: 0, cfg: 1 } }
    };
    var keys = Object.keys(T);
    var tabs = el('div', 'jsx-tabs');
    keys.forEach(function (k) { var b = el('button', 'jsx-tab', k); b.onclick = function () { stop(); show(k); }; tabs.appendChild(b); });
    var hdr = el('div', 'jsx-lane');
    var cards = el('div', 'jsx-cards');
    var mImpl = el('div', 'jsx-mini'), mAct = el('div', 'jsx-mini'), mCfg = el('div', 'jsx-mini');
    cards.appendChild(mImpl); cards.appendChild(mAct); cards.appendChild(mCfg);
    var note = el('div', 'jsx-note');
    var bar = el('div', 'jsx-bar'); var play = el('button', 'jsx-btn', '▶ Play'); bar.appendChild(play);
    function pulse(elm) { elm.classList.remove('changed'); void elm.offsetWidth; elm.classList.add('changed'); }
    function show(k) {
      Array.prototype.forEach.call(tabs.children, function (b) { b.classList.toggle('active', b.textContent === k); });
      var d = T[k];
      hdr.innerHTML = '<span class="jsx-tag">request</span><code>' + d.hdr + '</code>';
      mImpl.innerHTML = '<h5>⚙️ Service implementation</h5><code>' + d.impl + '</code><p>' + d.err + '</p>';
      mAct.innerHTML = '<h5>🔀 Workflow action / auto-state</h5><code>' + d.action + '</code><p>resolved by convention for the trajectory</p>';
      mCfg.innerHTML = '<h5>🎛️ cconfig value</h5><code>' + d.cfg + '</code><p>config resolved per trajectory</p>';
      [mImpl, mAct, mCfg].forEach(function (c, x) { c.classList.toggle('hot', [d.ch.impl, d.ch.action, d.ch.cfg][x] === 1); });
      if (d.ch.impl) pulse(mImpl); if (d.ch.action) pulse(mAct); if (d.ch.cfg) pulse(mCfg);
      note.innerHTML = d.note;
    }
    var i = 0, timer = null;
    function stop() { if (timer) { clearInterval(timer); timer = null; play.innerHTML = '▶ Play'; } }
    function start() { play.innerHTML = '❚❚ Pause'; timer = setInterval(function () { i = (i + 1) % keys.length; show(keys[i]); }, reduced ? 2000 : 1600); }
    play.onclick = function () { timer ? stop() : start(); };
    root.appendChild(tabs); root.appendChild(hdr); root.appendChild(cards); root.appendChild(note); root.appendChild(bar);
    show(keys[0]);
    if ('IntersectionObserver' in window) { var seen = false; new IntersectionObserver(function (es, ob) { es.forEach(function (e) { if (e.isIntersecting && !seen) { seen = true; setTimeout(start, 500); ob.disconnect(); } }); }, { threshold: 0.4 }).observe(root); }
  }

  var reg = { pipeline: pipeline, statemachine: statemachine, trajectory: trajectory, owiz: owiz, query: query, tenant: tenant, blueprint: blueprint };
  document.querySelectorAll('.jsx[data-jsx]').forEach(function (n) {
    var fn = reg[n.getAttribute('data-jsx')];
    if (fn) try { fn(n); } catch (e) { /* fail quietly */ }
  });
})();
