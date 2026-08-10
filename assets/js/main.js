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

  // ---------- interception / owiz chain stepper ----------
  function pipeline(root) {
    var stages = (root.getAttribute('data-stages') || 'Exchange,Security,Tenancy,i18n,Logging,Service').split(',');
    var notes = {
      Exchange:'The request is normalized into a ChenileExchange.',
      Security:'Authenticate & authorize — a policy interceptor (an Owiz command).',
      Tenancy:'Resolve the tenant into the ContextContainer.',
      i18n:'Localize messages for the caller.',
      Logging:'Structured, correlation-aware logging.',
      Service:'Your pure business logic runs here.'
    };
    var i = -1;
    var row = el('div', 'jsx-row');
    var chips = stages.map(function (s) { var c = el('div', 'jsx-chip', esc(s)); row.appendChild(c); return c; });
    var note = el('div', 'jsx-note', 'Press <b>Step</b> to send a request through the Owiz-powered interception chain.');
    var bar = el('div', 'jsx-bar');
    var step = el('button', 'jsx-btn', 'Step ▶'); var reset = el('button', 'jsx-btn ghost', 'Reset');
    bar.appendChild(step); bar.appendChild(reset);
    function render() { chips.forEach(function (c, k) { c.classList.toggle('on', k === i); c.classList.toggle('done', k < i); }); }
    step.onclick = function () { i = (i + 1) % (stages.length + 1); if (i === stages.length) { note.innerHTML = '✅ Response flows back out through the same chain.'; i = -1; render(); return; } note.innerHTML = '<b>' + esc(stages[i]) + '</b> — ' + (notes[stages[i]] || ''); render(); };
    reset.onclick = function () { i = -1; note.innerHTML = 'Reset. Press <b>Step</b> to begin.'; render(); };
    root.appendChild(row); root.appendChild(note); root.appendChild(bar); render();
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

  var reg = { pipeline: pipeline, owiz: owiz, query: query, tenant: tenant, blueprint: blueprint };
  document.querySelectorAll('.jsx[data-jsx]').forEach(function (n) {
    var fn = reg[n.getAttribute('data-jsx')];
    if (fn) try { fn(n); } catch (e) { /* fail quietly */ }
  });
})();
