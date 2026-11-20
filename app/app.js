// LEONIDA LEDGER — offline GTA VI trophy guide & tracker.
// Loads only its own data file (app/data/trophies.json). No network at run time.
// Progress lives in localStorage; export/import moves it as a JSON file.
// The URL hash carries shareable state: #view, #filter, #grade, #spoiler, #trophy, #earned.

const STORE_KEY = 'leonida-ledger-progress-v1';
const DATA_URL = 'data/trophies.json';

const $ = (sel) => document.querySelector(sel);
const rowsEl = $('#rows');
const detailEl = $('#detail');
const hintEl = $('#listHint');
const emptyEl = $('#emptyMsg');

let DATA = null;
let earned = new Set();
let state = { view: 'guide', filter: 'all', grade: 'all', spoiler: false, search: '', selected: null };

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((n) => Number.isInteger(n)));
  } catch {
    return new Set();
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  } catch {
    // Storage full or blocked: progress still works for this session.
  }
}

function sourceUrl(name) {
  const found = (DATA.sources || []).find((s) => s.name === name);
  return found && found.url ? found.url : null;
}

function sourceLink(name) {
  const url = sourceUrl(name);
  return url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(name)}</a>` : escapeHtml(name);
}

function isSpoilerHidden(t) {
  return state.spoiler && t.kind === 'story' && !earned.has(t.id);
}

function gradeLabel(t) {
  return t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
}

function trophyMatches(t) {
  if (state.filter === 'story' && t.kind !== 'story') return false;
  if (state.filter === 'missable' && !t.missable) return false;
  if (state.filter === 'collectibles' && t.kind !== 'collectibles') return false;
  if (state.filter === 'activities' && t.kind !== 'activities') return false;
  if (state.filter === 'online') return false; // No online trophies exist in this list.
  if (state.grade !== 'all' && t.grade !== state.grade) return false;
  if (state.search) {
    const q = state.search.toLowerCase();
    const hay = `${t.name} ${t.description} ${t.guide} ${t.roadmap || ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function renderAudit() {
  const steps = DATA.trophies.reduce((n, t) => n + (t.steps ? t.steps.length : 0), 0);
  const citedSources = new Set(DATA.trophies.flatMap((t) => t.steps || []).map((s) => s.source)).size;
  const hidden = DATA.trophies.filter((t) => t.hidden).length;
  $('#audit').innerHTML =
    `<span><b>55</b> trophies</span>` +
    `<span><b>1</b> platinum &middot; <b>2</b> gold &middot; <b>6</b> silver &middot; <b>46</b> bronze</span>` +
    `<span><b>${hidden}</b> hidden until earned</span>` +
    `<span><b>${steps}</b> cited steps</span>` +
    `<span><b>${citedSources}</b> step sources &middot; <b>${DATA.sources.length}</b> in the matrix</span>` +
    `<span><b>0</b> online trophies</span>`;
}

function renderProgress() {
  const n = earned.size;
  const pct = Math.round((n / DATA.trophies.length) * 100);
  $('#progressText').textContent = `${n} of ${DATA.trophies.length} earned`;
  $('#progressPct').textContent = `${pct}%`;
  $('#progressFill').style.width = `${pct}%`;
  $('#progressBar').setAttribute('aria-valuenow', String(n));
  const left = DATA.trophies.length - n;
  $('#progressSub').textContent =
    n === 0
      ? 'Start with Stage 1 of the roadmap — the story trophies cannot be missed.'
      : n === DATA.trophies.length
        ? 'Vice Got a Price! — you are a Leonida Legend.'
        : `${left} to go. The only possibly missable trophy is Positive Mental Attitude — meditate on the Chapter 1 balcony before the chapter ends.`;
}

function renderList() {
  const visible = DATA.trophies.filter(trophyMatches);
  const shown = visible.length;
  hintEl.textContent =
    state.filter === 'online'
      ? 'Online filter: this list has no online trophies — every one of the 55 is offline and single-player (PowerPyx, EGamers).'
      : `Showing ${shown} of ${DATA.trophies.length} trophies` +
        (state.filter !== 'all' ? ` · filter: ${state.filter}` : '') +
        (state.grade !== 'all' ? ` · grade: ${state.grade}` : '') +
        (state.spoiler ? ' · story spoilers hidden until earned' : '');
  emptyEl.hidden = shown !== 0;
  if (shown === 0) {
    emptyEl.textContent =
      state.filter === 'online'
        ? 'No online trophies. Try All, Story, Missable, Collectibles or Activities.'
        : 'No trophies match this filter. Clear the search or pick another filter.';
  }
  rowsEl.innerHTML = visible
    .map((t) => {
      const hidden = isSpoilerHidden(t);
      const name = hidden ? 'Hidden story trophy' : escapeHtml(t.name);
      const desc = hidden
        ? '<span class="spoiler-hidden">Name and description hidden until earned — spoiler setting is on.</span>'
        : escapeHtml(t.description);
      const badges =
        `<span class="badge ${t.grade}">${gradeLabel(t)}</span>` +
        (t.hidden ? '<span class="badge hidden">Hidden</span>' : '') +
        (t.missable ? '<span class="badge missable">Possibly missable</span>' : '') +
        `<span class="badge cited">${(t.steps || []).length} cited steps</span>`;
      return `<li class="trophy-item${earned.has(t.id) ? ' is-earned' : ''}${state.selected === t.id ? ' is-selected' : ''}" data-id="${t.id}">
        <div class="trophy-head">
          <input type="checkbox" class="trophy-check" data-id="${t.id}" ${earned.has(t.id) ? 'checked' : ''} aria-label="Mark ${escapeHtml(t.name)} as earned">
          <div>
            <div class="trophy-name">${name}<span class="grade-badge"></span></div>
            <div class="trophy-desc">${desc}</div>
            <div class="trophy-meta">${badges}</div>
          </div>
        </div>
      </li>`;
    })
    .join('');
}

function renderDetail() {
  const t = DATA.trophies.find((x) => x.id === state.selected) || DATA.trophies[0];
  if (!t) return;
  const hidden = isSpoilerHidden(t);
  const steps = (t.steps || [])
    .map((s) => `<li>${escapeHtml(s.text)} <span class="src">[${sourceLink(s.source)}]</span></li>`)
    .join('');
  const sources = (t.sources || [])
    .map((name) => `<li>${sourceLink(name)}</li>`)
    .join('');
  const unconfirmed =
    /unconfirmed/i.test(t.guide)
      ? `<p class="unconfirmed">Unconfirmed: part of this method is not settled yet in the guides. This entry says so instead of presenting a guess as fact.</p>`
      : '';
  detailEl.innerHTML =
    `<h2>${hidden ? 'Hidden story trophy' : escapeHtml(t.name)}</h2>` +
    `<p class="official">${hidden ? 'Name and description hidden until earned — spoiler setting is on.' : `“${escapeHtml(t.description)}” — official description, ${gradeLabel(t)}${t.hidden ? ', hidden until earned' : ''}${t.count ? `, count ${t.count}` : ''}.`}</p>` +
    `<p class="${earned.has(t.id) ? 'earned-line' : ''}">${earned.has(t.id) ? '✓ Earned — saved in this browser.' : 'Not earned yet. Tick the box in the list when it pops.'}</p>` +
    `<h3>Steps, each with its source</h3><ol class="steps">${steps}</ol>` +
    `<h3>Guide</h3><p>${escapeHtml(t.guide)}</p>` +
    unconfirmed +
    `<p><strong>Roadmap:</strong> ${escapeHtml(t.roadmap || '')}</p>` +
    (t.missable ? `<p class="unconfirmed">${escapeHtml(t.missable_note || 'Possibly missable.')}</p>` : '') +
    `<h3>Sources for this trophy</h3><ul class="sources">${sources}</ul>`;
}

function renderRoadmap() {
  $('#roadmapStages').innerHTML = (DATA.roadmap || [])
    .map(
      (s) => `<div class="stage"><h3>Stage ${s.stage} — ${escapeHtml(s.name)} <span class="hours">· ${escapeHtml(s.hours)} hours</span></h3><p>${escapeHtml(s.text)}</p><p class="src">Sources: ${s.sources.map(sourceLink).join(', ')}</p></div>`,
    )
    .join('');
  const missable = DATA.trophies.filter((t) => t.missable);
  $('#missableList').innerHTML = missable.length
    ? missable
        .map(
          (t) => `<div class="stage"><h3>${escapeHtml(t.name)} <span class="badge missable">Possibly missable</span></h3><p>${escapeHtml(t.missable_note || '')}</p><p>${escapeHtml(t.guide)}</p><p class="src">Sources: ${(t.sources || []).map(sourceLink).join(', ')}</p></div>`,
        )
        .join('') +
      `<p class="lede">Push Square reports no known missable trophies, while PowerPyx and GTABase flag this one — the flag above is a caution, not a certainty. Manual saves at the start and end of every chapter are the protection either way.</p>`
    : '<p>No trophy is flagged missable.</p>';
  $('#warnings').innerHTML = (DATA.warnings || [])
    .map((w) => `<li>${escapeHtml(w.text)} <span class="src">[${w.sources.map(sourceLink).join(', ')}]</span></li>`)
    .join('');
}

function renderSources() {
  const stepCount = {};
  DATA.trophies.forEach((t) => (t.steps || []).forEach((s) => { stepCount[s.source] = (stepCount[s.source] || 0) + 1; }));
  $('#sourceMatrix').innerHTML = (DATA.sources || [])
    .map((s) => {
      const n = stepCount[s.name] || 0;
      const link = s.url ? `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.url)}</a>` : 'Named as a list source; no article link.';
      return `<div class="source-card"><h3>${escapeHtml(s.name)} ${n ? `<span class="count">· ${n} cited steps</span>` : ''}</h3><p>${escapeHtml(s.note || '')}</p><p>${link}</p></div>`;
    })
    .join('');
  $('#disagreements').innerHTML = (DATA.disagreements || [])
    .map(
      (d) => `<div class="disagreement"><h4>${escapeHtml(d.topic)}</h4><p><strong>One side:</strong> ${escapeHtml(d.a)}</p><p><strong>The other side:</strong> ${escapeHtml(d.b)}</p><p class="src">Sources: ${d.sources.map(sourceLink).join(', ')}</p></div>`,
    )
    .join('');
}

function renderAll() {
  renderAudit();
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderSources();
}

function setView(view) {
  state.view = view;
  document.querySelectorAll('.view-tab').forEach((b) => b.classList.toggle('is-active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach((s) => s.classList.toggle('is-active', s.id === `view-${view}`));
  syncHash();
}

function syncHash() {
  const parts = [`view=${state.view}`, `filter=${state.filter}`, `grade=${state.grade}`];
  if (state.spoiler) parts.push('spoiler=1');
  if (state.selected) parts.push(`trophy=${state.selected}`);
  if (earned.size) parts.push(`earned=${[...earned].sort((a, b) => a - b).join(',')}`);
  history.replaceState(null, '', `#${parts.join('&')}`);
}

function readHash() {
  const hash = location.hash.replace(/^#/, '');
  if (!hash) return;
  const params = new URLSearchParams(hash);
  if (params.get('view')) state.view = params.get('view');
  if (params.get('filter')) state.filter = params.get('filter');
  if (params.get('grade')) state.grade = params.get('grade');
  if (params.get('spoiler') === '1') state.spoiler = true;
  if (params.get('trophy')) state.selected = Number(params.get('trophy'));
  if (params.get('earned')) {
    params.get('earned').split(',').map(Number).filter((n) => Number.isInteger(n)).forEach((n) => earned.add(n));
    saveProgress();
  }
}

function exportProgress() {
  const payload = {
    app: 'LEONIDA LEDGER — GTA VI trophy tracker',
    exported_at: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
    total: DATA.trophies.length,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const list = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(list)) throw new Error('No earned list found');
      const valid = new Set(DATA.trophies.map((t) => t.id));
      earned = new Set(list.filter((n) => Number.isInteger(n) && valid.has(n)));
      saveProgress();
      renderProgress();
      renderList();
      renderDetail();
      syncHash();
    } catch {
      alert('That file is not a LEONIDA LEDGER progress export.');
    }
  };
  reader.readAsText(file);
}

async function init() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Could not load ${DATA_URL}: ${res.status}`);
  DATA = await res.json();
  earned = loadProgress();
  readHash();
  if (!state.selected || !DATA.trophies.some((t) => t.id === state.selected)) state.selected = 28;

  document.querySelectorAll('.view-tab').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  document.querySelectorAll('.chip').forEach((b) =>
    b.addEventListener('click', () => {
      state.filter = b.dataset.filter;
      document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-active', c === b));
      renderList();
      syncHash();
    }),
  );
  $('#grade').addEventListener('change', (e) => { state.grade = e.target.value; renderList(); syncHash(); });
  $('#search').addEventListener('input', (e) => { state.search = e.target.value.trim(); renderList(); });
  $('#spoiler').addEventListener('change', (e) => { state.spoiler = e.target.checked; renderList(); renderDetail(); syncHash(); });
  $('#export').addEventListener('click', exportProgress);
  $('#import').addEventListener('change', (e) => { if (e.target.files[0]) importProgress(e.target.files[0]); e.target.value = ''; });

  rowsEl.addEventListener('click', (e) => {
    const item = e.target.closest('.trophy-item');
    if (!item) return;
    const id = Number(item.dataset.id);
    if (e.target.classList.contains('trophy-check')) {
      if (e.target.checked) earned.add(id); else earned.delete(id);
      saveProgress();
      renderProgress();
      renderList();
      renderDetail();
      syncHash();
      return;
    }
    state.selected = id;
    renderList();
    renderDetail();
    syncHash();
  });

  // Reflect hash state in the controls.
  document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-active', c.dataset.filter === state.filter));
  $('#grade').value = state.grade;
  $('#spoiler').checked = state.spoiler;
  setView(['guide', 'roadmap', 'sources'].includes(state.view) ? state.view : 'guide');
  renderAll();

  // A hash change without a reload (pasting a shared link into the address bar,
  // or following an in-app link) must apply too: re-read the hash and re-render.
  window.addEventListener('hashchange', () => {
    readHash();
    document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-active', c.dataset.filter === state.filter));
    $('#grade').value = state.grade;
    $('#spoiler').checked = state.spoiler;
    setView(['guide', 'roadmap', 'sources'].includes(state.view) ? state.view : 'guide');
    renderAll();
  });
}

init().catch((err) => {
  detailEl.innerHTML = `<h2>Could not load the trophy data</h2><p>${escapeHtml(err.message)}</p>`;
});
