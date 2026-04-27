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
    const sportbike = `<svg viewBox="0 0 96 54" aria-hidden="true"><circle cx="22" cy="39" r="9"/><circle cx="73" cy="39" r="9"/><circle cx="22" cy="39" r="4"/><circle cx="73" cy="39" r="4"/><path d="M30 37h17l10-15h13l10 17M42 37l-12-18H18M36 20h20l7 6M63 22l10-12h10M52 20l-7-8h-12M16 29l-7 4M78 27l8-2"/></svg>`;
    const cruiser = `<svg viewBox="0 0 96 54" aria-hidden="true"><circle cx="22" cy="39" r="10"/><circle cx="74" cy="39" r="10"/><path d="M31 38h25l9-10h11M36 29h22l-6 9M42 29l-8-11M34 18h20M63 28l7-15M70 13h12M18 29l-8 7M22 39h52"/></svg>`;
    const adventure = `<svg viewBox="0 0 96 54" aria-hidden="true"><circle cx="22" cy="39" r="9"/><circle cx="74" cy="39" r="9"/><path d="M31 38h20l10-17h13l10 17M42 38l-9-20h-12M36 20h18l8 7M62 21l8-10h10M17 29h-7M48 24l-4 9M9 45h78"/></svg>`;
    const atv = `<svg viewBox="0 0 96 54" aria-hidden="true"><circle cx="23" cy="40" r="9"/><circle cx="74" cy="40" r="9"/><circle cx="23" cy="40" r="4"/><circle cx="74" cy="40" r="4"/><path d="M23 39h18l8-14h21l8 14M38 25h-15l-10 10M70 25l12-9h7M49 25l-4-12h18l-4 12M42 33h21M14 25l-5-5M84 19l5-6"/></svg>`;
    const trailer = `<svg viewBox="0 0 96 54" aria-hidden="true"><circle cx="69" cy="40" r="7"/><circle cx="69" cy="40" r="3"/><path d="M11 16h58v21H11zM69 31h12l8 7M21 16v21M38 16v21M55 16v21M12 13h18M12 40h46"/></svg>`;
    const boat = `<svg viewBox="0 0 96 54" aria-hidden="true"><path d="M10 29h71l-12 13H25zM27 29V14h24l11 15M36 14v15M55 22h17M17 45c7-4 13 4 20 0s13 4 20 0 13 4 20 0"/></svg>`;
    const snow = `<svg viewBox="0 0 96 54" aria-hidden="true"><path d="M11 39h64M24 32h35l14-10h11M34 32l11-17h19l10 17M26 39l-10 7M60 39l12 7M18 23l7 6M18 23h-9M18 23v-9M41 18h25M75 22l10-6"/></svg>`;
    const equipment = `<svg viewBox="0 0 96 54" aria-hidden="true"><circle cx="25" cy="40" r="8"/><circle cx="55" cy="40" r="8"/><path d="M15 40h50l12-14h10M26 31h25V15H31zM51 22h17l10 11M32 15l-7 16M38 22h8M83 26l5 12h-16"/></svg>`;
    const electric = `<svg viewBox="0 0 96 54" aria-hidden="true"><circle cx="24" cy="39" r="9"/><circle cx="72" cy="39" r="9"/><path d="M33 38h18l10-18h16l8 18M51 17l-10 16h12l-9 15M38 29h11M62 20l7-10h10M18 28l-8 6"/></svg>`;
    if (key.includes('sport') || key.includes('naked') || key.includes('three')) return sportbike;
    if (key.includes('cruiser') || key.includes('touring')) return cruiser;
    if (key.includes('adventure') || key.includes('off-road')) return adventure;
    if (key.includes('atv') || key.includes('utv') || key.includes('golf')) return atv;
    if (key.includes('trailer') || key.includes('rv')) return trailer;
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
