/* ================================================
   UNFAZED MOTORS — Inventory Page
   Fetches all inventory, handles filters/search/sort.
   ================================================ */

const API_BASE = 'https://unfazed-chatbot.unfazedmotors.workers.dev';

(function () {
  const grid = document.getElementById('invGrid');
  const resultCount = document.getElementById('resultCount');
  const searchInput = document.getElementById('invSearch');
  const sortSelect = document.getElementById('invSort');
  const catChips = document.querySelectorAll('.cat-chip');
  const sidebarMakes = document.getElementById('sidebarMakes');
  const clearBtn = document.getElementById('clearFilters');
  if (!grid) return;

  let allRecords = [];
  let activeCat = 'all';
  let activeSearch = '';
  let activeSort = 'newest';
  let activeMakes = new Set();
  // ---- New filter state (additive) ----
  let activeBodyTypes = new Set();
  let activeModels = new Set();
  let yearMin = null, yearMax = null;
  let kmMax = null;

  // ---- Utilities ----
  function fmt(n) {
    const value = Number(n);
    if (!Number.isFinite(value) || value <= 0) return 'Contact Us';

    return '$' + Math.ceil(value / 100).toLocaleString('en-CA');
  }
  function fmtNum(n) { return n ? Number(n).toLocaleString('en-CA') : '—'; }
  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }
  function titleText(value) {
    return cleanText(value).toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }
  function bodyIcon(type) {
    const key = String(type || '').toLowerCase();
    function logo(code, mark) {
      return `<svg class="category-logo" viewBox="0 0 96 60" aria-hidden="true">
        <rect class="badge-bg" x="6" y="5" width="84" height="50" rx="14"/>
        <path class="badge-ring" d="M18 45V21l30-10 30 10v24L48 53z"/>
        ${mark}
        <text x="48" y="48" text-anchor="middle">${code}</text>
      </svg>`;
    }
    const sportbike = logo('SPORT', `<path class="badge-line" d="M29 31c6-12 18-17 34-15M34 34h21l11-15M26 36h42M67 19l9-6M24 23h12M20 29h11"/><path class="badge-accent" d="M62 25l12 2-14 9z"/>`);
    const naked = logo('STREET', `<path class="badge-line" d="M24 35h48M35 34l10-15h18l9 15M39 24h25M62 19l9-6h7M24 35l-7 6M72 35l7 6"/><path class="badge-accent" d="M41 22h18l-5 8H36z"/>`);
    const cruiser = logo('CRUISER', `<path class="badge-line" d="M31 18l17 18 17-18M38 18l10 11 10-11M31 36h34M36 25h-9M69 25h-9"/><path class="badge-accent" d="M45 15h6v21h-6z"/>`);
    const adventure = logo('ADV', `<path class="badge-line" d="M20 36l15-20 11 14 8-10 22 16M30 36h38M48 14v24M42 22l6-8 6 8"/><path class="badge-accent" d="M48 28l5 8H43z"/>`);
    const atv = logo('ATV', `<circle class="badge-line" cx="28" cy="34" r="6"/><circle class="badge-line" cx="68" cy="34" r="6"/><path class="badge-line" d="M28 34h12l8-15 8 15h12M37 25h22M43 19h10M20 28h12M64 28h12"/><path class="badge-accent" d="M44 25h8l-4 8z"/>`);
    const golf = logo('GOLF', `<path class="badge-line" d="M23 35h43l8-11M30 35V22h27l9 13M38 22v13M73 18v22M73 18h10l-3 5h-7"/><circle class="badge-line" cx="30" cy="38" r="4"/><circle class="badge-line" cx="62" cy="38" r="4"/><path class="badge-accent" d="M47 18h10l9 17H47z"/>`);
    const trailer = logo('TRAILER', `<path class="badge-line" d="M22 20h39v18H22zM61 32h11l7 6M31 20v18M45 20v18M64 38h8"/><circle class="badge-line" cx="57" cy="39" r="5"/><path class="badge-accent" d="M76 36l7 2-7 2z"/>`);
    const rv = logo('RV', `<path class="badge-line" d="M20 19h48v20H20zM68 28h8l6 11H68M30 19v20M44 19v20M22 41h56"/><circle class="badge-line" cx="32" cy="40" r="4"/><circle class="badge-line" cx="65" cy="40" r="4"/><path class="badge-accent" d="M22 19h20v20H22z"/>`);
    const boat = logo('BOAT', `<path class="badge-line" d="M22 31h52L64 41H32zM38 31V16h16l12 15M29 43c5-3 10 3 15 0s10 3 15 0 10 3 15 0"/><path class="badge-accent" d="M42 16h12v15H42z"/>`);
    const snow = logo('SNOW', `<path class="badge-line" d="M48 15v24M36 21l24 12M60 21L36 33M25 38h46M31 38l-7 5M65 38l7 5"/><circle class="badge-accent" cx="48" cy="27" r="4"/>`);
    const equipment = logo('EQUIP', `<path class="badge-line" d="M26 38h30l15-17h9M30 31h20V17H34zM50 24h14l8 10M21 39h58"/><circle class="badge-line" cx="31" cy="39" r="5"/><circle class="badge-line" cx="55" cy="39" r="5"/><path class="badge-accent" d="M72 28h10l-5 10z"/>`);
    const electric = logo('EV', `<path class="badge-line" d="M34 36h24l9-13h10M37 27h11M64 22l6-8h9M28 37h48"/><path class="badge-accent" d="M49 14L38 32h11l-5 14 16-23H49z"/>`);
    const motorcycle = logo('MOTO', `<path class="badge-line" d="M27 35h42M35 33l10-14h18l9 14M42 20h15M27 35l-8 6M69 35l8 6"/><circle class="badge-accent" cx="28" cy="35" r="4"/><circle class="badge-accent" cx="68" cy="35" r="4"/>`);
    if (key.includes('naked') || key.includes('street')) return naked;
    if (key.includes('sport') || key.includes('three')) return sportbike;
    if (key.includes('cruiser') || key.includes('touring')) return cruiser;
    if (key.includes('adventure') || key.includes('off-road')) return adventure;
    if (key.includes('golf')) return golf;
    if (key.includes('atv') || key.includes('utv')) return atv;
    if (key.includes('rv')) return rv;
    if (key.includes('trailer')) return trailer;
    if (key.includes('boat') || key.includes('water')) return boat;
    if (key.includes('snow')) return snow;
    if (key.includes('equipment')) return equipment;
    if (key.includes('electric')) return electric;
    return motorcycle;
  }
  function badgeClass(badge) {
    const map = { 'NEW': 'badge-new', 'Featured': 'badge-featured', 'Reduced': 'badge-reduced', 'Just Arrived': 'badge-featured' };
    return map[badge] || '';
  }
  function statusClass(status) {
    const map = { 'In Stock': 'in-stock', 'Reserved': 'reserved', 'Sold': 'sold', 'Pending': 'pending', 'Hold': 'reserved' };
    return map[status] || 'in-stock';
  }

  function placeholderSvg() {
    return `<svg class="placeholder-svg" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
  <defs>
    <linearGradient id="bgi" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#e8e8e8"/><stop offset="100%" stop-color="#6a6a6a"/></linearGradient>
    <linearGradient id="bti" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#2a2a2a"/><stop offset="100%" stop-color="#000"/></linearGradient>
  </defs>
  <ellipse cx="400" cy="355" rx="320" ry="18" fill="#000" opacity="0.6"/>
  <ellipse cx="400" cy="355" rx="260" ry="10" fill="#ff2d2d" opacity="0.12"/>
  <circle cx="610" cy="300" r="70" fill="url(#bti)"/><circle cx="610" cy="300" r="55" fill="none" stroke="#111" stroke-width="2"/>
  <circle cx="610" cy="300" r="34" fill="#1a1a1a"/><circle cx="610" cy="300" r="18" fill="#333"/>
  <circle cx="190" cy="300" r="70" fill="url(#bti)"/><circle cx="190" cy="300" r="55" fill="none" stroke="#111" stroke-width="2"/>
  <circle cx="190" cy="300" r="34" fill="#1a1a1a"/><circle cx="190" cy="300" r="18" fill="#333"/>
  <circle cx="190" cy="300" r="30" fill="none" stroke="#555" stroke-width="1.2" stroke-dasharray="2,3"/>
  <path d="M 420 270 L 605 305 L 600 320 L 420 290 Z" fill="#2b2b2b"/>
  <path d="M 240 220 Q 270 160 340 150 L 480 145 Q 540 148 570 200 L 590 270 Q 560 290 480 290 L 340 290 Q 260 285 240 260 Z" fill="url(#bgi)"/>
  <path d="M 330 165 Q 380 140 460 145 Q 500 150 510 180 L 500 220 L 340 220 Q 320 200 330 165 Z" fill="#d4d4d4"/>
  <path d="M 500 195 L 580 200 Q 600 200 595 215 L 560 240 L 500 235 Z" fill="#111"/>
  <path d="M 350 200 L 480 200 L 475 210 L 350 210 Z" fill="#ff2d2d" opacity="0.85"/>
  <text x="415" y="208" text-anchor="middle" fill="#fff" font-family="JetBrains Mono, monospace" font-size="8" letter-spacing="2">UNFAZED</text>
</svg>`;
  }

  function renderCard(rec) {
    const f = rec.fields || {};
    const stock = f['Stock Number'] || rec.id;
    const thumb = f['Photos'] && f['Photos'][0] ? f['Photos'][0].thumbnails?.large?.url || f['Photos'][0].url : null;
    const badge = f['Badge'];
    const status = f['Status'] || 'In Stock';
    const cat = f['Category'] || '';
    const year = f['Year'] || '';
    const make = f['Make'] || '';
    const model = f['Model'] || '';
    const cc = f['Engine (cc)'];
    const hp = f['Horsepower'];
    const km = f['Mileage (km)'];
    const price = f['Price (CAD)'];
    const isSold = status === 'Sold';

    return `<article class="card ${isSold ? 'card-status-sold' : ''}" data-stock="${stock}">
  <a href="vehicle.html?stock=${encodeURIComponent(stock)}">
    <div class="card-media">
    ${thumb ? `<img src="${thumb}" alt="${year} ${make} ${model}" loading="lazy">` : `<img src="assets/coming-soon.png" alt="Photos coming soon" loading="lazy">`}
      ${badge ? `<span class="card-badge ${badgeClass(badge)}">${badge}</span>` : ''}
      <span class="status-pill ${statusClass(status)}">${status}</span>
    </div>
    <div class="card-body">
      <div class="card-top"><span>${year} · ${cat}</span><span>${make.toUpperCase()}</span></div>
      <h3>${make} ${model}</h3>
      <div class="card-meta">
        ${cc ? `<span>${fmtNum(cc)}cc</span>` : ''}
        ${hp ? `<span>${fmtNum(hp)} HP</span>` : ''}
        ${km ? `<span>${fmtNum(km)} km</span>` : ''}
      </div>
      <div class="card-foot">
        <div class="card-price">${fmt(price)}<small>b/w · OAC</small></div>
        <span class="card-cta">↗</span>
      </div>
    </div>
  </a>
</article>`;
  }

  // ---- Filter + render ----
  function applyFilters() {
    let records = [...allRecords];

    // Category chip
    if (activeCat !== 'all') {
      records = records.filter(r => (r.fields['Category'] || '').toLowerCase() === activeCat.toLowerCase());
    }

    // Make checkboxes
    if (activeMakes.size > 0) {
      records = records.filter(r => activeMakes.has((r.fields['Make'] || '').toLowerCase()));
    }

    // Body Type (sidebar checkboxes)
    if (activeBodyTypes.size > 0) {
      records = records.filter(r => activeBodyTypes.has((r.fields['Category'] || '').toLowerCase()));
    }

    // Model (sidebar checkboxes)
    if (activeModels.size > 0) {
      records = records.filter(r => activeModels.has((r.fields['Model'] || '').toLowerCase()));
    }

    // Year range
    if (yearMin != null) {
      records = records.filter(r => Number(r.fields['Year'] || 0) >= yearMin);
    }
    if (yearMax != null) {
      records = records.filter(r => Number(r.fields['Year'] || 0) <= yearMax);
    }

    // Odometer max
    if (kmMax != null) {
      records = records.filter(r => Number(r.fields['Mileage (km)'] || 0) <= kmMax);
    }

    // Search
    if (activeSearch) {
      const q = activeSearch.toLowerCase();
      records = records.filter(r => {
        const f = r.fields;
        return [f['Make'], f['Model'], f['Category'], f['Year'], f['Color'], f['Stock Number']]
          .join(' ').toLowerCase().includes(q);
      });
    }

    // Sort
    records.sort((a, b) => {
      const fa = a.fields, fb = b.fields;
      switch (activeSort) {
        case 'price-asc':  return (fa['Price (CAD)'] || 0) - (fb['Price (CAD)'] || 0);
        case 'price-desc': return (fb['Price (CAD)'] || 0) - (fa['Price (CAD)'] || 0);
        case 'year-desc':  return (fb['Year'] || 0) - (fa['Year'] || 0);
        case 'year-asc':   return (fa['Year'] || 0) - (fb['Year'] || 0);
        case 'km-asc':     return (fa['Mileage (km)'] || 0) - (fb['Mileage (km)'] || 0);
        default:           return 0; // newest = Airtable order
      }
    });

    if (resultCount) resultCount.textContent = `${records.length} vehicle${records.length !== 1 ? 's' : ''}`;
    const tc = document.getElementById('totalCount');
    if (tc) tc.textContent = records.length;

    if (!records.length) {
      grid.innerHTML = `<div class="inv-no-results"><h3>Nothing here.</h3><p style="margin-top:8px">Try adjusting your filters or <button class="sidebar-clear" id="noResultClear" style="display:inline">clear all filters</button>.</p></div>`;
      document.getElementById('noResultClear')?.addEventListener('click', resetFilters);
      return;
    }

    grid.innerHTML = records.map(r => renderCard(r)).join('');
  }

  function resetFilters() {
    activeCat = 'all';
    activeMakes.clear();
    activeBodyTypes.clear();
    activeModels.clear();
    yearMin = null; yearMax = null;
    kmMax = null;
    activeSearch = '';
    activeSort = 'newest';
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'newest';
    catChips.forEach(c => c.classList.toggle('active', c.dataset.cat === 'all'));
    document.querySelectorAll('.inv-sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
    ['yearMin', 'yearMax', 'kmMax'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    if (typeof updateMakesCount === 'function') updateMakesCount();
    updateAllCounts();
    buildModelSidebar();
    applyFilters();
  }
  if (clearBtn) clearBtn.addEventListener('click', resetFilters);

  // ---- Build sidebar makes ----
  function buildMakeSidebar() {
    if (!sidebarMakes) return;
    const section = sidebarMakes.closest('.sidebar-section');
    const counts = {};
    allRecords.forEach(r => {
      const make = r.fields['Make'];
      if (make) counts[make] = (counts[make] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) {
      if (section) section.classList.add('hidden');
      return;
    }
    if (section) section.classList.remove('hidden');
    sidebarMakes.innerHTML = sorted.map(([make, count]) => `
      <label class="sidebar-make-item">
        <input type="checkbox" value="${make.toLowerCase()}" ${activeMakes.has(make.toLowerCase()) ? 'checked' : ''}>
        <span>${make}</span>
        <span class="make-count">${count}</span>
      </label>
    `).join('');
    sidebarMakes.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) activeMakes.add(cb.value);
        else activeMakes.delete(cb.value);
        updateMakesCount();
        applyFilters();
      });
    });
    updateMakesCount();
  }

  // ---- Update the small count badge next to "Make" ----
  function updateMakesCount() {
    const countEl = document.getElementById('makesCount');
    if (!countEl) return;
    countEl.textContent = activeMakes.size > 0 ? `(${activeMakes.size})` : '';
  }


  // ============================================================
  // NEW FILTERS (additive — Body Type, Model, Year, Odometer)
  // ============================================================

  // ---- Build Body Type sidebar ----
  function buildBodyTypeSidebar() {
    const container = document.getElementById('sidebarBodyType');
    if (!container) return;
    const section = container.closest('.sidebar-section');
    const counts = {};
    allRecords.forEach(r => {
      const v = r.fields['Category'];
      if (v) counts[v] = (counts[v] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
    if (!sorted.length) {
      // Hide whole section if no categories exist in data
      if (section) section.classList.add('hidden');
      return;
    }
    if (section) section.classList.remove('hidden');
    container.innerHTML = sorted.map(([value, count]) => `
      <label class="body-type-card">
        <input type="checkbox" value="${value.toLowerCase()}" ${activeBodyTypes.has(value.toLowerCase()) ? 'checked' : ''}>
        <span class="body-dot"></span>
        <span class="body-icon">${bodyIcon(value)}</span>
        <span class="body-name">${value}</span>
        <span class="make-count">${count}</span>
      </label>
    `).join('');
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) activeBodyTypes.add(cb.value);
        else activeBodyTypes.delete(cb.value);
        updateAllCounts();
        applyFilters();
      });
    });
  }

  // ---- Build Model sidebar (depends on selected Make) ----
  function buildModelSidebar() {
    const container = document.getElementById('sidebarModels');
    if (!container) return;
    const section = container.closest('.sidebar-section');
    if (activeMakes.size === 0) {
      // No Make selected — hide whole section
      if (section) section.classList.add('hidden');
      return;
    }
    const counts = {};
    allRecords.forEach(r => {
      const make = (r.fields['Make'] || '').toLowerCase();
      if (!activeMakes.has(make)) return;
      const v = r.fields['Model'];
      if (v) counts[v] = (counts[v] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
    if (!sorted.length) {
      if (section) section.classList.add('hidden');
      return;
    }
    if (section) section.classList.remove('hidden');
    container.innerHTML = sorted.map(([value, count]) => `
      <label class="sidebar-make-item">
        <input type="checkbox" value="${value.toLowerCase()}" ${activeModels.has(value.toLowerCase()) ? 'checked' : ''}>
        <span>${value}</span>
        <span class="make-count">${count}</span>
      </label>
    `).join('');
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) activeModels.add(cb.value);
        else activeModels.delete(cb.value);
        updateAllCounts();
        applyFilters();
      });
    });
  }

  // When Make changes, rebuild Models list. We hook into the existing
  // Make sidebar by adding a delegated listener at the container level.
  function rebuildModelsAfterMakeChange() {
    // Drop any selected models no longer valid for the new make selection
    if (activeMakes.size > 0) {
      const validModels = new Set();
      allRecords.forEach(r => {
        const make = (r.fields['Make'] || '').toLowerCase();
        if (activeMakes.has(make)) {
          const m = (r.fields['Model'] || '').toLowerCase();
          if (m) validModels.add(m);
        }
      });
      for (const m of [...activeModels]) {
        if (!validModels.has(m)) activeModels.delete(m);
      }
    } else {
      activeModels.clear();
    }
    buildModelSidebar();
    updateAllCounts();
  }
  // Delegated listener: any checkbox change inside #sidebarMakes triggers a model rebuild
  if (sidebarMakes) {
    sidebarMakes.addEventListener('change', (e) => {
      if (e.target && e.target.matches('input[type="checkbox"]')) {
        // Run AFTER the existing handler updates activeMakes (microtask)
        Promise.resolve().then(rebuildModelsAfterMakeChange);
      }
    });
  }

  // ---- Update count badges for new filters ----
  function updateAllCounts() {
    const setCount = (id, n, isDot) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (isDot) el.textContent = n > 0 ? '•' : '';
      else el.textContent = n > 0 ? `(${n})` : '';
    };
    setCount('bodyTypeCount', activeBodyTypes.size);
    setCount('modelsCount', activeModels.size);
    const yearActive = (yearMin != null || yearMax != null) ? 1 : 0;
    setCount('yearCount', yearActive, true);
    const kmActive = (kmMax != null) ? 1 : 0;
    setCount('odometerCount', kmActive, true);
  }

// ---- Wire sidebar collapsible sections ----
document.querySelectorAll('.sidebar-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.toggle;

    const panelMap = {
      bodyType: 'sidebarBodyType',
      makes: 'sidebarMakes',
      models: 'sidebarModels',
      year: 'sidebarYear',
      odometer: 'sidebarOdometer'
    };

    const panelId = panelMap[key];
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;

    const isCollapsed = panel.classList.toggle('collapsed');
    btn.setAttribute('aria-expanded', String(!isCollapsed));
  });
});

  // ---- Wire Year inputs ----
  const yearMinEl = document.getElementById('yearMin');
  const yearMaxEl = document.getElementById('yearMax');
  if (yearMinEl) yearMinEl.addEventListener('input', () => {
    const v = yearMinEl.value.trim();
    yearMin = v ? Number(v) : null;
    updateAllCounts();
    applyFilters();
  });
  if (yearMaxEl) yearMaxEl.addEventListener('input', () => {
    const v = yearMaxEl.value.trim();
    yearMax = v ? Number(v) : null;
    updateAllCounts();
    applyFilters();
  });

  // ---- Wire Odometer input ----
  const kmMaxEl = document.getElementById('kmMax');
  if (kmMaxEl) kmMaxEl.addEventListener('input', () => {
    const v = kmMaxEl.value.trim();
    kmMax = v ? Number(v) : null;
    updateAllCounts();
    applyFilters();
  });

  // ---- Event listeners ----
  catChips.forEach(chip => {
    chip.addEventListener('click', () => {
      catChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCat = chip.dataset.cat || 'all';
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      activeSearch = searchInput.value.trim();
      applyFilters();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      activeSort = sortSelect.value;
      applyFilters();
    });
  }

// ---- Fetch all records from Worker ----
async function fetchAll() {
  const res = await fetch(`${API_BASE}/inventory?featuredOnly=false&limit=100`);

  if (!res.ok) {
    throw new Error(`Inventory API ${res.status}`);
  }

  const data = await res.json();
  const records = data.records || [];

  return records.map((bike) => ({
    id: bike.id,
    fields: {
      'Stock Number': bike.stockNumber,
      'Year': bike.year,
      'Make': titleText(bike.make),
      'Model': cleanText(bike.model),
      'Category': cleanText(bike.category),
      'Mileage (km)': bike.mileage,
      'Engine (cc)': bike.engine,
      'Horsepower': bike.horsepower,
      'Transmission': bike.transmission,
      'Color': cleanText(bike.color),
      'Price (CAD)': bike.price,
      'Badge': bike.badge,
      'Description': bike.description,
      'Photos': Array.isArray(bike.photos) && bike.photos.length
        ? bike.photos
        : (bike.photo ? [{ url: bike.photo, thumbnails: { large: { url: bike.photo } } }] : []),
      'Status': bike.status
    }
  }));
}

  async function load() {
    grid.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><span>Loading inventory…</span></div>`;
    try {
      allRecords = await fetchAll();
      buildMakeSidebar();
      buildBodyTypeSidebar();
      buildModelSidebar();
      updateAllCounts();
      applyFilters();
    } catch (err) {
      console.error('inventory-page:', err);
      grid.innerHTML = `<div class="error-state"><h3>Failed to load inventory.</h3><p>Check your connection and try refreshing. If the problem persists, contact us directly.</p></div>`;
    }
  }

  load();
})();


/* ===== Inventory filter toggle ===== */
document.addEventListener("DOMContentLoaded", function () {
  const body = document.body;
  const toolbar = document.querySelector(".inv-toolbar");
  const backdrop = document.getElementById("filterBackdrop");
  const closeBtn = document.getElementById("filterClose");

  if (!toolbar) return;

  if (window.matchMedia("(max-width: 900px)").matches) {
    body.classList.add("inventory-filters-collapsed");
  }

  let btn = document.getElementById("filterToggle");

  if (!btn) {
    btn = document.createElement("button");
    btn.id = "filterToggle";
    btn.type = "button";
    btn.className = "filter-toggle-btn";
    toolbar.prepend(btn);
  }

  btn.setAttribute("aria-expanded", body.classList.contains("inventory-filters-collapsed") ? "false" : "true");

  function setFiltersOpen(open) {
    body.classList.toggle("inventory-filters-collapsed", !open);
    body.classList.toggle("filters-drawer-open", open);
    btn.textContent = open ? "Hide Filters" : "Filters";
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (window.matchMedia("(max-width: 900px)").matches) {
      document.body.style.overflow = open ? "hidden" : "";
    }
  }

  btn.addEventListener("click", function () {
    setFiltersOpen(body.classList.contains("inventory-filters-collapsed"));
  });

  backdrop?.addEventListener("click", () => setFiltersOpen(false));
  closeBtn?.addEventListener("click", () => setFiltersOpen(false));
  setFiltersOpen(!body.classList.contains("inventory-filters-collapsed"));
});
