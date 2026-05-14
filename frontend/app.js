// ═══════════════════════════════════════════════════════════════
//  Yombale — Comparateur de prix Sénégal
//  app.js VERSION 4 — 2026-05-14
//  Si vous voyez ceci dans la console, le bon fichier est chargé
// ═══════════════════════════════════════════════════════════════
console.log('%c✅ Yombale app.js VERSION 4 chargé', 'color:#10b981;font-size:16px;font-weight:bold');

var API = '/api';

var state = {
  token:     localStorage.getItem('pm_token'),
  user:      null,
  ville:     'Dakar',
  page:      1,
  pageTotal: 1,
  total:     0,
  query:     '',
  categorie: '',
  tri:       'pertinence',
  prixMax:   '',
  prixMin:   '',
  vue:       'grille',         // grille | liste
  comparer:  [],               // ids sélectionnés pour comparaison côte-à-côte
  recents:   JSON.parse(localStorage.getItem('yomb_recents') || '[]'),
};

// ── Logger ──────────────────────────────────────────────────────
var _log = [];
function dbg(e, d)    { var t = new Date().toISOString().slice(11,23); _log.push('['+t+'] '+e+(d!==undefined?' → '+JSON.stringify(d):'')); console.log('%c[Y]','color:#1d4ed8;font-weight:bold',e,d!==undefined?d:''); }
function dbgErr(e, r) { var t = new Date().toISOString().slice(11,23); _log.push('['+t+'] ❌ '+e+' → '+(r&&r.message?r.message:String(r))); console.error('%c[Y]','color:#ef4444;font-weight:bold',e,r); }
window.PM_LOGS = function() { return _log.join('\n'); };

// ── apiFetch ────────────────────────────────────────────────────
function apiFetch(endpoint, options) {
  options = options || {};
  var headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = 'Bearer ' + state.token;
  var url = API + endpoint;
  var ctrl = new AbortController();
  var tid  = setTimeout(function() { ctrl.abort(); }, 12000);
  dbg('apiFetch START', url);
  return fetch(url, Object.assign({}, options, { headers: headers, signal: ctrl.signal }))
    .then(function(res) {
      clearTimeout(tid);
      dbg('apiFetch RESPONSE', { url: url, status: res.status, ok: res.ok });
      return res.json().then(function(data) {
        if (!res.ok) { dbgErr('apiFetch '+res.status, data); throw new Error(data.error || 'Erreur '+res.status); }
        return data;
      });
    })
    .catch(function(err) {
      clearTimeout(tid);
      if (err.name === 'AbortError') { var e = new Error('Délai dépassé (12s)'); dbgErr('TIMEOUT', e); throw e; }
      dbgErr('apiFetch CATCH', err);
      throw err;
    });
}

// ── Helpers ─────────────────────────────────────────────────────
function fcfa(n) { return Number(n||0).toLocaleString('fr-FR') + ' FCFA'; }
function render(html) { var a = document.getElementById('app'); if (a) a.innerHTML = html; }
function toast(msg, c) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.style.background = c || '#10b981';
  el.classList.add('show');
  setTimeout(function() { el.classList.remove('show'); }, 3000);
}

// ── Récents ─────────────────────────────────────────────────────
function ajouterRecent(produit) {
  state.recents = state.recents.filter(function(r) { return r.id !== produit.id; });
  state.recents.unshift({ id: produit.id, nom: produit.nom, prix: produit.prix_min, image: produit.image_url });
  if (state.recents.length > 6) state.recents.pop();
  try { localStorage.setItem('yomb_recents', JSON.stringify(state.recents)); } catch(e) {}
}

// ── Smart search parser ──────────────────────────────────────────
// "écouteurs moins de 15000" → { q:'écouteurs', prixMax:15000 }
function parseSearch(raw) {
  var q = (raw || '').trim();
  var prixMax = null, prixMin = null;
  var mMax = q.match(/(?:moins\s+de|max|jusqu[''à]?\s*(?:à|a)?|<\s*)\s*([0-9][0-9\s]*)/i);
  var mMin = q.match(/(?:plus\s+de|min|au[-\s]dessus\s+de|>\s*)\s*([0-9][0-9\s]*)/i);
  if (mMax) { prixMax = parseInt(mMax[1].replace(/\s/g,''), 10); q = q.replace(mMax[0], '').trim(); }
  if (mMin) { prixMin = parseInt(mMin[1].replace(/\s/g,''), 10); q = q.replace(mMin[0], '').trim(); }
  q = q.replace(/\b(fcfa|cfa|f\b|pour|de|à|a|environ)\b/gi, '').replace(/\s+/g,' ').trim();
  return { q: q, prixMax: prixMax, prixMin: prixMin };
}

// ── Autocomplete ─────────────────────────────────────────────────
var _acTimer = null;
function setupAutocomplete(inputId) {
  var inp = document.getElementById(inputId);
  if (!inp) return;
  inp.addEventListener('input', function() {
    clearTimeout(_acTimer);
    var val = inp.value.trim();
    fermerSuggestions();
    if (val.length < 2) return;
    _acTimer = setTimeout(function() { chargerSuggestions(val, inp); }, 280);
  });
  inp.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { fermerSuggestions(); doSearch(); }
    if (e.key === 'Escape') { fermerSuggestions(); }
  });
  document.addEventListener('click', function(e) {
    if (!inp.contains(e.target)) fermerSuggestions();
  });
}

function chargerSuggestions(q, inp) {
  apiFetch('/produits?q=' + encodeURIComponent(q) + '&limit=6')
    .then(function(data) {
      var produits = (data && data.produits) || [];
      if (!produits.length) return;
      var box = document.createElement('div');
      box.id = 'ac-box';
      box.style.cssText = 'position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #e2e8f0;' +
        'border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:999;overflow:hidden;margin-top:4px';
      box.innerHTML = produits.map(function(p) {
        return '<div onclick="selectSuggestion(\'' + p.id + '\',\'' + p.nom.replace(/'/g, "\\'") + '\')" ' +
          'style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid #f1f5f9" ' +
          'onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'#fff\'">' +
          '<span style="font-size:18px">📦</span>' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-size:13px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + p.nom + '</div>' +
            (p.prix_min ? '<div style="font-size:12px;color:#10b981;font-weight:700">' + fcfa(p.prix_min) + '</div>' : '') +
          '</div>' +
          (p.nb_offres ? '<span style="font-size:11px;color:#94a3b8;white-space:nowrap">' + p.nb_offres + ' offre(s)</span>' : '') +
        '</div>';
      }).join('');
      var wrap = inp.closest('.sbar') || inp.parentElement;
      wrap.style.position = 'relative';
      fermerSuggestions();
      wrap.appendChild(box);
    }).catch(function() {});
}

function fermerSuggestions() {
  var b = document.getElementById('ac-box');
  if (b) b.remove();
}

function selectSuggestion(id, nom) {
  fermerSuggestions();
  var inp = document.getElementById('search-input');
  if (inp) inp.value = nom;
  ouvrirProduit(id);
}

// ═══════════════════════════════════════════════════════════════
//  PAGE D'ACCUEIL
// ═══════════════════════════════════════════════════════════════

var CATEGORIES = [
  { slug: 'smartphones',  label: 'Téléphones',    icon: '📱' },
  { slug: 'informatique', label: 'Informatique',  icon: '💻' },
  { slug: 'tv-electro',   label: 'TV & Électro',  icon: '📺' },
  { slug: 'mode',         label: 'Mode',          icon: '👗' },
  { slug: 'maison',       label: 'Maison',        icon: '🏠' },
  { slug: 'auto-moto',    label: 'Auto & Moto',   icon: '🛵' },
  { slug: 'jeux',         label: 'Jeux',          icon: '🎮' },
];

var BUDGETS = [
  { label: '< 5 000',      max: 5000,  min: null },
  { label: '5k – 15k',     max: 15000, min: 5000 },
  { label: '15k – 50k',    max: 50000, min: 15000 },
  { label: '50k – 100k',   max: 100000,min: 50000 },
  { label: '+ 100 000',    max: null,  min: 100000 },
];

// ── Chargement produits ──────────────────────────────────────────
function chargerProduits(query, categorie, page) {
  page      = page      || 1;
  query     = query     !== undefined ? query     : state.query;
  categorie = categorie !== undefined ? categorie : state.categorie;
  state.query = query; state.categorie = categorie; state.page = page;

  dbg('chargerProduits', { q: query, cat: categorie, page: page });

  if (page === 1) {
    render('<div class="loader"><div class="spin"></div><p>Recherche en cours...</p></div>');
  } else {
    var s = document.querySelector('.products');
    if (s) { var sp = document.createElement('div'); sp.id = 'sp'; sp.className = 'loader'; sp.innerHTML = '<div class="spin"></div>'; s.appendChild(sp); }
  }

  var params = new URLSearchParams({
    q: query || '', categorie: categorie || '',
    limit: 24, page: page,
    tri: state.tri, prixMax: state.prixMax || '', prixMin: state.prixMin || ''
  });

  apiFetch('/produits?' + params.toString())
    .then(function(data) {
      var produits = (data && Array.isArray(data.produits)) ? data.produits : [];
      state.pageTotal = data.pages || 1;
      state.total     = data.total || 0;
      dbg('chargerProduits OK', { nb: produits.length, total: data.total });

      if (!produits.length && page === 1) { renderVide(); return; }

      if (page === 1) {
        render(templateListe(produits, data));
        setupAutocomplete('search-input');
      } else {
        var sp2 = document.getElementById('sp'); if (sp2) sp2.remove();
        var oldBtn = document.getElementById('btn-plus'); if (oldBtn) oldBtn.remove();
        var finMsg = document.getElementById('fin-liste'); if (finMsg) finMsg.remove();
        var grid = document.querySelector('.pgrid');
        if (grid) { var tmp = document.createElement('div'); tmp.innerHTML = produits.map(carteHTML).join(''); while (tmp.firstChild) grid.appendChild(tmp.firstChild); }
        var s2 = document.querySelector('.products');
        if (s2) { s2.insertAdjacentHTML('beforeend', page < state.pageTotal ? btnPlus(data) : '<p id="fin-liste" style="text-align:center;padding:16px;color:#94a3b8;font-size:13px">✅ Tous les ' + data.total + ' produits affichés</p>'); }
      }
    })
    .catch(function(err) {
      dbgErr('chargerProduits', err);
      var sp3 = document.getElementById('sp'); if (sp3) sp3.remove();
      if (page === 1) renderErreur(err);
      else toast('Erreur chargement page suivante', '#ef4444');
    });
}

// ── Template liste — avec dashboard si résultats ────────────────
function templateListe(produits, data) {
  var isSearch = !!(state.query || state.categorie || state.prixMax || state.prixMin);
  return [
    htmlHero(),
    htmlChipsBudget(),
    isSearch && produits.length > 1 ? htmlDashboardComparaison(produits, data) : '',
    htmlBarre(data),
    '<section class="products">',
      data.total > 0 ? '<p style="font-size:12px;color:#94a3b8;padding:4px 5% 10px">' +
        data.total + ' résultat(s)' + (state.query ? ' pour "' + state.query + '"' : '') + '</p>' : '',
      state.vue === 'liste'
        ? '<div class="pliste">' + produits.map(carteListeHTML).join('') + '</div>'
        : '<div class="pgrid">'  + produits.map(carteHTML).join('')      + '</div>',
      data.page < data.pages ? btnPlus(data) : (data.total > 24 ? '<p id="fin-liste" style="text-align:center;padding:16px;color:#94a3b8;font-size:13px">✅ Tous les ' + data.total + ' produits affichés</p>' : ''),
    '</section>',
    htmlRecents(),
  ].join('');
}

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD DE COMPARAISON INTELLIGENT
// ═══════════════════════════════════════════════════════════════
function htmlDashboardComparaison(produits, data) {
  // ── Calculs statistiques ──────────────────────────────────────
  var avecPrix   = produits.filter(function(p) { return p.prix_min > 0; });
  if (!avecPrix.length) return '';

  var tousLesPrix  = avecPrix.map(function(p) { return +p.prix_min; });
  var prixPlancher = Math.min.apply(null, tousLesPrix);
  var prixPlafond  = Math.max.apply(null, tousLesPrix);
  var prixMoyen    = Math.round(tousLesPrix.reduce(function(a,b){return a+b;},0) / tousLesPrix.length);

  // Grouper par marque
  var parMarque = {};
  avecPrix.forEach(function(p) {
    var m = (p.marque || 'Autre').split(' ')[0];
    if (!parMarque[m]) parMarque[m] = [];
    parMarque[m].push(p);
  });
  var marques = Object.keys(parMarque).sort(function(a,b) {
    return parMarque[b].length - parMarque[a].length;
  }).slice(0, 6);

  // Grouper par marchand (via nb_offres — approximation)
  var marchands = ['Jumia', 'Expat-Dakar', 'CoinAfrique'];

  // Gammes de prix automatiques
  var gammes = _calculerGammes(tousLesPrix, avecPrix);

  // Meilleur rapport Q/P = plus d'offres pour le prix le plus bas
  var meilleurQP = avecPrix.slice().sort(function(a,b) {
    var scoreA = (a.nb_offres || 1) / (a.prix_min / prixMoyen);
    var scoreB = (b.nb_offres || 1) / (b.prix_min / prixMoyen);
    return scoreB - scoreA;
  })[0];

  return [
    '<div id="dashboard" style="margin:0 5% 16px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">',

      // En-tête
      '<div style="padding:14px 16px;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#fff">',
        '<div style="font-size:13px;font-weight:700">📊 Analyse de votre recherche' + (state.query ? ' : "' + state.query + '"' : '') + '</div>',
        '<div style="font-size:11px;opacity:.8;margin-top:2px">' + data.total + ' produits · ' + avecPrix.length + ' avec prix · données en temps réel</div>',
      '</div>',

      // KPIs rapides
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #f1f5f9">',
        _kpi('💰 Plus bas',   fcfa(prixPlancher), '#10b981', avecPrix.find(function(p){return +p.prix_min===prixPlancher;})),
        _kpi('📈 Plus haut',  fcfa(prixPlafond),  '#ef4444', null),
        _kpi('📊 Moyenne',    fcfa(prixMoyen),    '#6366f1', null),
        _kpi('🏷 Produits',   data.total + ' refs','#f97316', null),
      '</div>',

      // Corps du dashboard
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #f1f5f9">',

        // Colonne gauche : par marque
        '<div style="padding:14px;border-right:1px solid #f1f5f9">',
          '<div style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">🏭 Par fabricant</div>',
          marques.map(function(m) {
            var items  = parMarque[m];
            var minM   = Math.min.apply(null, items.map(function(p){return +p.prix_min;}));
            var pct    = Math.round(items.length / avecPrix.length * 100);
            return [
              '<div onclick="filtrerCategoriePlus(\'' + m + '\')" ',
                'style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;cursor:pointer;margin-bottom:4px" ',
                'onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'transparent\'">',
                '<span style="font-size:14px;font-weight:800;color:#1e293b;min-width:80px">' + m + '</span>',
                '<div style="flex:1;background:#f1f5f9;border-radius:4px;height:6px;overflow:hidden">',
                  '<div style="width:' + pct + '%;height:100%;background:#1d4ed8;border-radius:4px"></div>',
                '</div>',
                '<span style="font-size:11px;color:#64748b;white-space:nowrap">' + items.length + ' · ' + fcfa(minM) + '</span>',
              '</div>',
            ].join('');
          }).join('') +
          (marques.length === 0 ? '<p style="font-size:12px;color:#94a3b8">Données insuffisantes</p>' : ''),
        '</div>',

        // Colonne droite : gammes
        '<div style="padding:14px">',
          '<div style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">💡 Par gamme de prix</div>',
          gammes.map(function(g) {
            return [
              '<div onclick="filtrerBudget(' + g.max + ',' + g.min + ')" ',
                'style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;',
                'border-radius:8px;cursor:pointer;border:1px solid #f1f5f9;margin-bottom:6px;background:#fff" ',
                'onmouseover="this.style.borderColor=\'#1d4ed8\';this.style.background=\'#eff6ff\'" ',
                'onmouseout="this.style.borderColor=\'#f1f5f9\';this.style.background=\'#fff\'">',
                '<div>',
                  '<div style="font-size:12px;font-weight:700;color:#1e293b">' + g.label + '</div>',
                  '<div style="font-size:11px;color:#94a3b8">' + g.count + ' produit(s)</div>',
                '</div>',
                '<span style="font-size:11px;font-weight:600;color:#1d4ed8;white-space:nowrap">Voir →</span>',
              '</div>',
            ].join('');
          }).join(''),
        '</div>',

      '</div>',

      // Recommandations
      '<div style="padding:12px 16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#f8fafc">',
        '<span style="font-size:11px;font-weight:700;color:#475569;white-space:nowrap">Décide vite :</span>',

        // Bouton meilleur prix
        _recoBouton(
          '🏆 Meilleur prix',
          avecPrix.find(function(p){return +p.prix_min===prixPlancher;}),
          '#10b981'
        ),

        // Bouton meilleur rapport Q/P
        _recoBouton('⭐ Meilleur rapport Q/P', meilleurQP, '#6366f1'),

        // Bouton milieu de gamme
        _recoBouton(
          '🎯 Milieu de gamme',
          avecPrix.find(function(p){ var ecart=Math.abs(+p.prix_min-prixMoyen); return ecart < prixMoyen*0.15; }),
          '#f97316'
        ),
      '</div>',

    '</div>',
  ].join('');
}

function _kpi(label, valeur, couleur, produit) {
  return [
    '<div style="padding:12px 8px;text-align:center;cursor:' + (produit?'pointer':'default') + '"' +
      (produit ? ' onclick="ouvrirProduit(\'' + produit.id + '\')"' : '') + '>',
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:2px">' + label + '</div>',
      '<div style="font-size:14px;font-weight:800;color:' + couleur + '">' + valeur + '</div>',
    '</div>',
  ].join('');
}

function _recoBouton(label, produit, couleur) {
  if (!produit) return '';
  return '<button onclick="ouvrirProduit(\'' + produit.id + '\')" ' +
    'style="padding:7px 12px;background:' + couleur + '1a;color:' + couleur + ';border:1px solid ' + couleur + '4d;' +
    'border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">' +
    label + ' : ' + produit.nom.split(' ').slice(0,3).join(' ') + ' (' + fcfa(produit.prix_min) + ')' +
  '</button>';
}

function _calculerGammes(prix, produits) {
  var min = Math.min.apply(null, prix), max = Math.max.apply(null, prix);
  var range = max - min;
  if (range < 1000) return [{ label: 'Tous les prix', min: null, max: null, count: produits.length }];
  var seuils = [min + range*0.25, min + range*0.6, max];
  var labels = ['Entrée de gamme', 'Milieu de gamme', 'Haut de gamme'];
  var prev = min - 1;
  return seuils.map(function(s, i) {
    var count = produits.filter(function(p){ return +p.prix_min > prev && +p.prix_min <= s; }).length;
    var g = { label: labels[i], min: Math.round(prev), max: Math.round(s), count: count };
    prev = s;
    return g;
  }).filter(function(g){ return g.count > 0; });
}

function filtrerCategoriePlus(marque) {
  var inp = document.getElementById('search-input');
  var q   = state.query ? state.query + ' ' + marque : marque;
  if (inp) inp.value = q;
  chargerProduits(q, state.categorie, 1);
}



// ── Hero + barre de recherche ────────────────────────────────────
function htmlHero() {
  return [
    '<section class="hero">',
      '<h1>Meilleur prix au <span>Sénégal</span></h1>',
      '<p style="opacity:.8;margin-bottom:16px;font-size:14px">Comparez Jumia, Expat-Dakar, CoinAfrique en un clic</p>',
      '<div class="sbar" style="position:relative">',
        '<input type="text" id="search-input" autocomplete="off"',
          ' value="' + (state.query || '') + '"',
          ' placeholder="Ex: écouteurs moins de 15 000 FCFA..."',
          ' onkeydown="if(event.key===\'Enter\'){fermerSuggestions();doSearch()}"',
          ' oninput="onSearchInput(this.value)">',
        '<button onclick="fermerSuggestions();doSearch()">🔍 Comparer</button>',
      '</div>',
      htmlCategories(),
    '</section>',
  ].join('');
}

function htmlCategories() {
  return '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px">' +
    CATEGORIES.map(function(c) {
      var active = state.categorie === c.slug;
      return '<button onclick="filtrerCategorie(\'' + c.slug + '\')" ' +
        'style="padding:6px 14px;border-radius:20px;border:1px solid ' + (active ? '#1d4ed8' : '#e2e8f0') + ';' +
        'background:' + (active ? '#1d4ed8' : '#fff') + ';color:' + (active ? '#fff' : '#475569') + ';' +
        'font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">' +
        c.icon + ' ' + c.label +
      '</button>';
    }).join('') +
  '</div>';
}

// ── Chips de budget ──────────────────────────────────────────────
function htmlChipsBudget() {
  return '<div style="display:flex;gap:8px;flex-wrap:wrap;padding:10px 5%;background:#f8fafc;border-bottom:1px solid #e2e8f0;align-items:center">' +
    '<span style="font-size:12px;color:#94a3b8;font-weight:600;white-space:nowrap">Budget :</span>' +
    BUDGETS.map(function(b) {
      var active = (state.prixMax == b.max && state.prixMin == b.min);
      return '<button onclick="filtrerBudget(' + b.max + ',' + b.min + ')" ' +
        'style="padding:5px 12px;border-radius:16px;border:1px solid ' + (active ? '#1d4ed8' : '#e2e8f0') + ';' +
        'background:' + (active ? '#eff6ff' : '#fff') + ';color:' + (active ? '#1d4ed8' : '#475569') + ';' +
        'font-size:12px;font-weight:' + (active ? '700' : '500') + ';cursor:pointer;white-space:nowrap">' +
        b.label +
      '</button>';
    }).join('') +
    (state.prixMax || state.prixMin
      ? '<button onclick="filtrerBudget(null,null)" style="padding:5px 10px;border-radius:16px;border:1px solid #fecaca;background:#fef2f2;color:#ef4444;font-size:12px;cursor:pointer">✕</button>'
      : '') +
  '</div>';
}

// ── Barre tri + vue ──────────────────────────────────────────────
function htmlBarre(data) {
  var sStyle = 'padding:6px 8px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;background:#fff;cursor:pointer;outline:none';
  return '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 5%;border-bottom:1px solid #f1f5f9">' +
    '<select onchange="changerTri(this.value)" style="' + sStyle + '">' +
      [['pertinence','🎯 Pertinence'],['prix_asc','⬆ Prix ↑'],['prix_desc','⬇ Prix ↓'],['nom_asc','🔤 A→Z']].map(function(t) {
        return '<option value="' + t[0] + '"' + (state.tri === t[0] ? ' selected' : '') + '>' + t[1] + '</option>';
      }).join('') +
    '</select>' +
    '<div style="display:flex;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">' +
      '<button onclick="changerVue(\'grille\')" title="Grille" style="padding:6px 10px;border:none;cursor:pointer;font-size:14px;background:' + (state.vue==='grille'?'#1d4ed8':'#fff') + ';color:' + (state.vue==='grille'?'#fff':'#64748b') + '">▦</button>' +
      '<button onclick="changerVue(\'liste\')"  title="Liste"  style="padding:6px 10px;border:none;cursor:pointer;font-size:14px;background:' + (state.vue==='liste' ?'#1d4ed8':'#fff') + ';color:' + (state.vue==='liste' ?'#fff':'#64748b') + '">☰</button>' +
    '</div>' +
    (state.comparer.length > 0
      ? '<button onclick="ouvrirComparaison()" style="margin-left:auto;padding:6px 14px;background:#f97316;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">⚖ Comparer (' + state.comparer.length + ')</button>'
      : '<span style="margin-left:auto"></span>') +
  '</div>';
}

// ── Carte grille ─────────────────────────────────────────────────
function carteHTML(p) {
  var enCompare = state.comparer.indexOf(p.id) !== -1;
  var economie  = p.prix_max && p.prix_min && p.prix_max > p.prix_min
                ? Math.round((1 - p.prix_min / p.prix_max) * 100) : 0;
  return [
    '<div class="pcard" onclick="ouvrirProduit(\'' + p.id + '\')">',
      economie >= 15 ? '<div class="pbadge-eco">-' + economie + '%</div>' : '',
      '<div class="pimg">',
        p.image_url
          ? '<img src="' + p.image_url + '" alt="" loading="lazy" style="width:100%;height:100%;object-fit:contain">'
          : '<span style="font-size:40px">📦</span>',
      '</div>',
      '<div class="pbody">',
        '<div class="pname">' + p.nom + '</div>',
        p.marque ? '<div class="pbrand">' + p.marque + '</div>' : '',
        p.prix_min
          ? '<div class="pprice">' + fcfa(p.prix_min) + '</div>'
          : '<div style="font-size:12px;color:#cbd5e1;margin:4px 0">Prix N/D</div>',
        '<div class="poffers">' +
          (p.nb_offres > 0
            ? '<span style="color:#10b981;font-weight:600">' + p.nb_offres + ' offre(s)</span> · ' + state.ville
            : 'Aucune offre') +
        '</div>',
        '<div style="display:flex;gap:6px;margin-top:8px">',
          '<button class="btn-voir" style="flex:1">Comparer →</button>',
          '<button onclick="event.stopPropagation();toggleComparer(\'' + p.id + '\')" ' +
            'title="' + (enCompare ? 'Retirer' : 'Ajouter à la comparaison') + '" ' +
            'style="padding:6px 8px;border-radius:6px;border:1px solid ' + (enCompare ? '#1d4ed8' : '#e2e8f0') + ';' +
            'background:' + (enCompare ? '#eff6ff' : '#fff') + ';cursor:pointer;font-size:14px">⚖</button>',
        '</div>',
      '</div>',
    '</div>',
  ].join('');
}

// ── Carte liste ──────────────────────────────────────────────────
function carteListeHTML(p) {
  var economie = p.prix_max && p.prix_min && p.prix_max > p.prix_min
               ? Math.round((1 - p.prix_min / p.prix_max) * 100) : 0;
  return [
    '<div onclick="ouvrirProduit(\'' + p.id + '\')" ',
      'style="display:flex;gap:12px;align-items:center;padding:12px;border-bottom:1px solid #f1f5f9;cursor:pointer" ',
      'onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'#fff\'">',
      '<div style="width:60px;height:60px;flex-shrink:0;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden">',
        p.image_url
          ? '<img src="' + p.image_url + '" loading="lazy" style="max-width:60px;max-height:60px;object-fit:contain">'
          : '<span style="font-size:28px">📦</span>',
      '</div>',
      '<div style="flex:1;min-width:0">',
        '<div style="font-size:14px;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + p.nom + '</div>',
        '<div style="font-size:12px;color:#94a3b8">' + (p.marque || '') + (p.categorie_nom ? ' · ' + p.categorie_nom : '') + '</div>',
        '<div style="font-size:11px;color:#64748b;margin-top:2px">' + (p.nb_offres || 0) + ' offre(s)</div>',
      '</div>',
      '<div style="text-align:right;flex-shrink:0">',
        p.prix_min ? '<div style="font-size:16px;font-weight:800;color:#10b981">' + fcfa(p.prix_min) + '</div>' : '',
        economie >= 15 ? '<div style="font-size:11px;font-weight:700;color:#f97316;background:#fff7ed;padding:1px 6px;border-radius:8px;display:inline-block;margin-top:2px">-' + economie + '%</div>' : '',
        '<button class="btn-voir" style="margin-top:4px;font-size:11px;padding:4px 10px" onclick="event.stopPropagation();ouvrirProduit(\'' + p.id + '\')">Voir →</button>',
      '</div>',
    '</div>',
  ].join('');
}

// ── Récents ──────────────────────────────────────────────────────
function htmlRecents() {
  if (!state.recents.length) return '';
  return [
    '<section style="padding:16px 5% 24px">',
      '<h3 style="font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px">🕐 Récemment consultés</h3>',
      '<div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:4px">',
        state.recents.map(function(r) {
          return '<div onclick="ouvrirProduit(\'' + r.id + '\')" ' +
            'style="flex-shrink:0;width:100px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;' +
            'padding:10px 8px;text-align:center;cursor:pointer;transition:box-shadow .15s" ' +
            'onmouseover="this.style.boxShadow=\'0 4px 12px rgba(0,0,0,.08)\'" onmouseout="this.style.boxShadow=\'none\'">' +
            '<div style="font-size:24px;margin-bottom:4px">📦</div>' +
            '<div style="font-size:11px;font-weight:600;color:#1e293b;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">' + r.nom + '</div>' +
            (r.prix ? '<div style="font-size:11px;color:#10b981;font-weight:700;margin-top:2px">' + fcfa(r.prix) + '</div>' : '') +
          '</div>';
        }).join('') +
      '</div>',
    '</section>',
  ].join('');
}

// ── Bouton charger plus ──────────────────────────────────────────
function btnPlus(data) {
  var restant = Math.max(0, data.total - state.page * 24);
  return '<div id="btn-plus" style="text-align:center;padding:20px">' +
    '<button onclick="chargerProduits(state.query,state.categorie,state.page+1)" ' +
      'style="padding:12px 36px;background:#1d4ed8;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">' +
      '⬇ Voir plus (' + restant + ' restants)' +
    '</button>' +
    '<p style="font-size:11px;color:#94a3b8;margin-top:6px">Page ' + data.page + '/' + data.pages + '</p>' +
  '</div>';
}

// ── États vide / erreur ──────────────────────────────────────────
function renderVide() {
  render([
    htmlHero(),
    htmlChipsBudget(),
    '<div style="text-align:center;padding:48px 20px;color:#64748b">',
      '<div style="font-size:52px;margin-bottom:12px">🔍</div>',
      '<h3 style="margin-bottom:8px">Aucun résultat' + (state.query ? ' pour "' + state.query + '"' : '') + '</h3>',
      '<p style="font-size:13px;margin-bottom:20px">Essayez avec d\'autres mots-clés ou changez les filtres.</p>',
      '<button onclick="reinitialiserFiltres()" style="padding:10px 24px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">Tout effacer et réessayer</button>',
    '</div>',
    htmlRecents(),
  ].join(''));
  setTimeout(function() { setupAutocomplete('search-input'); }, 50);
}

function renderErreur(err) {
  render([
    htmlHero(),
    '<div style="text-align:center;padding:40px 20px;color:#64748b">',
      '<div style="font-size:48px;margin-bottom:12px">⚙️</div>',
      '<h3>Erreur de connexion</h3>',
      '<p style="color:#ef4444;font-size:13px;margin:8px 0 20px">' + err.message + '</p>',
      '<button onclick="goHome()" style="padding:10px 24px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">🔄 Réessayer</button>',
    '</div>',
  ].join(''));
  setTimeout(function() { setupAutocomplete('search-input'); }, 50);
}

// ═══════════════════════════════════════════════════════════════
//  PAGE PRODUIT — COMPARAISON COMPLÈTE
// ═══════════════════════════════════════════════════════════════

async function ouvrirProduit(id, simFiltres) {
  simFiltres = simFiltres || {};
  dbg('ouvrirProduit', id);

  var appEl = document.getElementById('app');
  if (appEl) { appEl.style.cssText = 'max-width:none;padding:0;margin:0;width:100%;background:#f8fafc;min-height:100vh'; }

  render('<div style="padding:60px 20px;text-align:center"><div class="spin" style="width:48px;height:48px;margin:0 auto 16px;border-width:4px"></div><p style="color:#64748b">Chargement...</p></div>');

  try {
    var res    = await apiFetch('/produits/' + id);
    var offres = await apiFetch('/produits/' + id + '/offres');
    var histo  = await apiFetch('/produits/' + id + '/historique').catch(function() { return []; });
    var simP   = new URLSearchParams({ limit:8, prixMax:simFiltres.prixMax||'', marchand:simFiltres.marchand||'' });
    var simRes = await apiFetch('/produits/' + id + '/similaires?' + simP).catch(function() { return { produits:[] }; });

    ajouterRecent(res);

    var prixMin  = offres.length ? Math.min.apply(null, offres.map(function(o){ return +o.prix; })) : 0;
    var prixMaxO = offres.length ? Math.max.apply(null, offres.map(function(o){ return +o.prix; })) : 0;
    var economie = prixMaxO > prixMin ? fcfa(prixMaxO - prixMin) : null;

    var html = '<div style="background:#f8fafc;min-height:100vh">';

    // ── Barre nav ──────────────────────────────────────────────
    html += '<div style="position:sticky;top:58px;z-index:99;background:#fff;border-bottom:2px solid #e2e8f0;padding:0 5%;height:48px;display:flex;align-items:center;gap:12px">';
    html += '<button onclick="retourListe()" style="background:none;border:none;color:#1d4ed8;font-size:14px;font-weight:700;cursor:pointer">← Retour</button>';
    html += '<span style="color:#e2e8f0">|</span>';
    html += '<span style="font-size:12px;color:#64748b;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">' + res.nom + '</span>';
    html += '</div>';

    html += '<div style="max-width:800px;margin:0 auto;padding:24px 5% 60px">';

    // ── En-tête produit ──────────────────────────────────────────
    html += '<div style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,.06)">';

    // Image
    html += '<div style="width:100%;height:240px;background:linear-gradient(135deg,#eff6ff,#dbeafe);display:flex;align-items:center;justify-content:center">';
    html += res.image_url ? '<img src="' + res.image_url + '" style="max-height:220px;max-width:85%;object-fit:contain">' : '<span style="font-size:80px">📦</span>';
    html += '</div>';

    // Infos
    html += '<div style="padding:20px 24px 24px">';
    if (res.categorie_nom) html += '<span style="font-size:11px;font-weight:700;color:#1d4ed8;background:#eff6ff;padding:3px 10px;border-radius:10px;text-transform:uppercase">' + res.categorie_nom + '</span>';
    html += '<h1 style="font-size:22px;font-weight:800;color:#1e293b;margin:10px 0 6px;line-height:1.3">' + res.nom + '</h1>';
    if (res.marque) html += '<p style="font-size:13px;color:#64748b;margin-bottom:16px">Par <strong>' + res.marque + '</strong></p>';

    if (offres.length) {
      html += '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">';
      html += '<div style="font-size:34px;font-weight:900;color:#10b981">' + fcfa(prixMin) + '</div>';
      if (economie) html += '<div style="background:#fff7ed;color:#f97316;font-size:13px;font-weight:700;padding:6px 14px;border-radius:10px;border:1px solid #fed7aa">Économie possible : ' + economie + '</div>';
      html += '</div>';
      html += '<p style="font-size:13px;color:#94a3b8;margin-top:8px">' + offres.length + ' marchand(s) · ' + state.ville + '</p>';
    } else {
      html += '<p style="color:#94a3b8;font-size:15px">Aucune offre disponible</p>';
    }
    html += '</div></div>';

    // ── Tableau offres ───────────────────────────────────────────
    html += '<div style="margin-bottom:20px">';
    html += '<h2 style="font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">📊 Comparer les prix</h2>';
    html += '<div style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04)">';

    if (offres.length) {
      offres.forEach(function(o, i) {
        var best  = +o.prix === prixMin;
        var ecart = best ? 0 : +o.prix - prixMin;
        html += '<div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #f1f5f9;' + (best ? 'background:#f0fdf4;border-left:4px solid #10b981' : 'border-left:4px solid transparent') + '">';
        html += '<div style="flex:1;min-width:0">';
        if (best) html += '<span style="display:inline-block;background:#10b981;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;margin-bottom:4px">🏆 Meilleur prix</span><br>';
        html += '<a href="' + (o.site_url||'#') + '" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="font-size:15px;font-weight:700;color:#1e293b;text-decoration:none">' + (o.marchand_nom||'Marchand') + '</a>';
        if (ecart > 0) html += '<div style="font-size:11px;color:#ef4444;margin-top:2px">+' + fcfa(ecart) + ' vs meilleur prix</div>';
        html += '</div>';
        html += '<div style="font-size:20px;font-weight:800;color:' + (best ? '#10b981' : '#1e293b') + ';white-space:nowrap">' + fcfa(o.prix) + '</div>';
        html += '<a href="' + (o.url_achat||'#') + '" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="display:inline-block;padding:10px 18px;background:' + (best?'#10b981':'#1d4ed8') + ';color:#fff;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none;white-space:nowrap;flex-shrink:0">Acheter →</a>';
        html += '</div>';
      });
    } else {
      html += '<div style="padding:24px;text-align:center;color:#94a3b8">Aucune offre disponible</div>';
    }
    html += '</div></div>';

    // ── Historique ───────────────────────────────────────────────
    html += htmlHistorique(histo);

    // ── Similaires ───────────────────────────────────────────────
    html += htmlSimilaires(id, simRes, simFiltres);

    html += '</div></div>';
    render(html);

  } catch(err) {
    dbgErr('ouvrirProduit', err);
    var appEl2 = document.getElementById('app');
    if (appEl2) appEl2.style.cssText = '';
    render([
      '<div style="padding:40px 5%;max-width:600px;margin:0 auto">',
        '<button onclick="retourListe()" style="background:none;border:none;color:#1d4ed8;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:24px">← Retour</button>',
        '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:24px;text-align:center">',
          '<div style="font-size:48px;margin-bottom:12px">⚠️</div>',
          '<h3 style="color:#b91c1c;margin-bottom:8px">Erreur de chargement</h3>',
          '<p style="color:#ef4444;font-size:14px;font-weight:600">' + err.message + '</p>',
          '<button onclick="ouvrirProduit(\'' + id + '\')" style="margin-top:16px;padding:10px 24px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">🔄 Réessayer</button>',
        '</div>',
      '</div>',
    ].join(''));
  }
}

// ── Tableau des offres (utilisé par comparaison côte à côte) ────
function htmlTableauOffres(offres, prixMin) {
  if (!offres || !offres.length) return '';
  var lignes = offres.map(function(o) {
    var best  = +o.prix === prixMin;
    var ecart = best ? 0 : +o.prix - prixMin;
    return '<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid #f1f5f9;' + (best ? 'background:#f0fdf4;border-left:3px solid #10b981' : 'border-left:3px solid transparent') + '">' +
      '<div style="flex:1">' + (best ? '<span style="background:#10b981;color:#fff;font-size:9px;font-weight:700;padding:1px 6px;border-radius:8px;margin-right:6px">🏆</span>' : '') +
      '<span style="font-weight:600;font-size:13px;color:#1e293b">' + (o.marchand_nom||'Marchand') + '</span>' +
      (ecart > 0 ? '<div style="font-size:11px;color:#ef4444">+' + fcfa(ecart) + '</div>' : '') + '</div>' +
      '<span style="font-weight:800;font-size:15px;color:' + (best?'#10b981':'#1e293b') + '">' + fcfa(o.prix) + '</span>' +
      '<a href="' + (o.url_achat||'#') + '" target="_blank" onclick="event.stopPropagation()" style="padding:7px 14px;background:' + (best?'#10b981':'#1d4ed8') + ';color:#fff;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none">→</a>' +
    '</div>';
  }).join('');
  return '<div style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:20px">' + lignes + '</div>';
}

// ── Historique SVG ───────────────────────────────────────────────
function htmlHistorique(histo) {
  if (!histo || histo.length < 2) return '';
  var prix  = histo.map(function(h) { return parseFloat(h.prix_min); });
  var dates = histo.map(function(h) { return h.jour ? h.jour.slice(0,10) : ''; });
  var minP  = Math.min.apply(null, prix), maxP = Math.max.apply(null, prix), rangeP = maxP-minP||1;
  var W=320, H=80, padX=8, padY=8;
  var pts = prix.map(function(v,i) {
    return (padX+(i/(prix.length-1))*(W-padX*2)).toFixed(1) + ',' + (padY+(1-(v-minP)/rangeP)*(H-padY*2)).toFixed(1);
  });
  var trend = prix[prix.length-1] < prix[0] ? '📉 En baisse' : prix[prix.length-1] > prix[0] ? '📈 En hausse' : '→ Stable';
  return [
    '<div style="margin-bottom:20px">',
      '<h3 style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">📈 Historique 90 jours · <span style="font-weight:500;text-transform:none;font-size:12px">' + trend + '</span></h3>',
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px">',
        '<svg viewBox="0 0 ' + W + ' ' + (H+20) + '" style="width:100%;display:block">',
          '<line x1="'+padX+'" y1="'+(H-padY)+'" x2="'+(W-padX)+'" y2="'+(H-padY)+'" stroke="#e2e8f0" stroke-width="1"/>',
          '<polyline points="'+pts.join(' ')+'" fill="none" stroke="#1d4ed8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>',
          '<circle cx="'+pts[0].split(',')[0]+'" cy="'+pts[0].split(',')[1]+'" r="4" fill="#1d4ed8"/>',
          '<circle cx="'+pts[pts.length-1].split(',')[0]+'" cy="'+pts[pts.length-1].split(',')[1]+'" r="4" fill="#1d4ed8"/>',
          '<text x="'+padX+'" y="'+(H+14)+'" font-size="9" fill="#94a3b8">' + (dates[0]||'') + '</text>',
          '<text x="'+(W-padX)+'" y="'+(H+14)+'" font-size="9" fill="#94a3b8" text-anchor="end">' + (dates[dates.length-1]||'') + '</text>',
          '<text x="2" y="'+(padY+4)+'" font-size="9" fill="#10b981">' + fcfa(maxP) + '</text>',
          '<text x="2" y="'+(H-padY)+'" font-size="9" fill="#ef4444">' + fcfa(minP) + '</text>',
        '</svg>',
      '</div>',
    '</div>',
  ].join('');
}

// ── Similaires avec filtres ──────────────────────────────────────
function htmlSimilaires(id, similaires, filtresSim) {
  var sStyle = 'padding:6px 8px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;background:#fff;cursor:pointer;outline:none;color:#334155';
  var filtresHTML = [
    '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:12px">',
      '<p style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">Affiner la recherche</p>',
      '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">',
        '<div style="display:flex;align-items:center;gap:4px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;padding:5px 8px">',
          '<span style="font-size:11px;color:#94a3b8">Max</span>',
          '<input id="sf-max" type="number" placeholder="ex: 15000" value="' + (filtresSim.prixMax||'') + '" style="border:none;outline:none;width:80px;font-size:12px;color:#334155">',
          '<span style="font-size:11px;color:#94a3b8">FCFA</span>',
        '</div>',
        '<select id="sf-site" style="' + sStyle + '">',
          '<option value="">Tous les sites</option>',
          ['Jumia Senegal','Expat-Dakar','CoinAfrique'].map(function(m) {
            return '<option' + (filtresSim.marchand===m?' selected':'') + '>' + m + '</option>';
          }).join(''),
        '</select>',
        '<button onclick="_appSimFiltres(\'' + id + '\')" style="padding:6px 14px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">Appliquer</button>',
        filtresSim.prixMax||filtresSim.marchand ? '<button onclick="ouvrirProduit(\'' + id + '\')" style="padding:6px 10px;border:1px solid #fecaca;background:#fef2f2;color:#ef4444;border-radius:8px;font-size:11px;cursor:pointer">✕</button>' : '',
      '</div>',
    '</div>',
  ].join('');

  if (!similaires.produits || !similaires.produits.length) {
    return [
      '<div>',
        '<h3 style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">🔄 Produits similaires</h3>',
        filtresHTML,
        '<p style="color:#94a3b8;font-size:13px;text-align:center;padding:16px 0">Aucun produit similaire trouvé.</p>',
      '</div>',
    ].join('');
  }

  var cartes = similaires.produits.map(function(p) {
    var economie = p.prix_max && p.prix_min && p.prix_max > p.prix_min
                 ? Math.round((1 - p.prix_min / p.prix_max) * 100) : 0;
    return [
      '<div onclick="ouvrirProduit(\'' + p.id + '\')" ',
        'style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px;cursor:pointer;position:relative" ',
        'onmouseover="this.style.borderColor=\'#1d4ed8\'" onmouseout="this.style.borderColor=\'#e2e8f0\'">',
        economie >= 15 ? '<div style="position:absolute;top:6px;right:6px;background:#f97316;color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:8px">-' + economie + '%</div>' : '',
        '<div style="width:100%;height:70px;background:#f8fafc;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:8px">',
          p.image_url ? '<img src="' + p.image_url + '" style="max-height:70px;object-fit:contain" loading="lazy">' : '<span style="font-size:28px">📦</span>',
        '</div>',
        '<div style="font-size:12px;font-weight:600;color:#1e293b;line-height:1.3;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + p.nom + '</div>',
        p.marque ? '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px">' + p.marque + '</div>' : '',
        p.prix_min ? '<div style="font-size:13px;font-weight:800;color:#10b981">' + fcfa(p.prix_min) + '</div>' : '<div style="font-size:11px;color:#cbd5e1">Prix N/D</div>',
        '<div style="font-size:10px;color:#94a3b8;margin-top:2px">' + (p.nb_offres||0) + ' offre(s)</div>',
      '</div>',
    ].join('');
  }).join('');

  return [
    '<div>',
      '<h3 style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">🔄 Produits similaires (' + similaires.produits.length + ')</h3>',
      filtresHTML,
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px">',
        cartes,
      '</div>',
    '</div>',
  ].join('');
}

// ═══════════════════════════════════════════════════════════════
//  COMPARAISON CÔTE À CÔTE
// ═══════════════════════════════════════════════════════════════

async function ouvrirComparaison() {
  if (state.comparer.length < 2) { toast('Sélectionne au moins 2 produits ⚖', '#f97316'); return; }
  render('<div class="loader"><div class="spin"></div><p>Préparation de la comparaison...</p></div>');
  try {
    var produits = await Promise.all(state.comparer.map(function(id) {
      return Promise.all([
        apiFetch('/produits/' + id),
        apiFetch('/produits/' + id + '/offres').catch(function() { return []; }),
      ]).then(function(r) { return Object.assign(r[0], { offres: r[1] }); });
    }));

    var colonnes = produits.map(function(p) {
      var pMin = p.offres.length ? Math.min.apply(null, p.offres.map(function(o){return o.prix;})) : null;
      var bestPrix = Math.min.apply(null, produits.map(function(pp) {
        return pp.offres.length ? Math.min.apply(null, pp.offres.map(function(o){return o.prix;})) : Infinity;
      }));
      var isCheapest = pMin && pMin === bestPrix;
      return [
        '<div style="flex:1;min-width:160px;background:#fff;border:2px solid ' + (isCheapest ? '#10b981' : '#e2e8f0') + ';border-radius:12px;padding:14px;text-align:center">',
          isCheapest ? '<div style="background:#10b981;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;display:inline-block;margin-bottom:8px">🏆 Moins cher</div>' : '',
          '<div style="width:60px;height:60px;margin:0 auto 8px;background:#f8fafc;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden">',
            p.image_url ? '<img src="' + p.image_url + '" style="max-width:60px;max-height:60px;object-fit:contain">' : '<span style="font-size:28px">📦</span>',
          '</div>',
          '<div style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:4px;line-height:1.3">' + p.nom + '</div>',
          p.marque ? '<div style="font-size:11px;color:#94a3b8;margin-bottom:8px">' + p.marque + '</div>' : '<div style="margin-bottom:8px"></div>',
          '<div style="font-size:20px;font-weight:800;color:' + (isCheapest ? '#10b981' : '#1e293b') + ';margin-bottom:4px">' + (pMin ? fcfa(pMin) : 'N/D') + '</div>',
          '<div style="font-size:11px;color:#94a3b8;margin-bottom:12px">' + p.offres.length + ' offre(s)</div>',
          p.offres.slice(0, 3).map(function(o) {
            return '<div style="font-size:11px;padding:4px 6px;background:#f8fafc;border-radius:6px;margin-bottom:4px;display:flex;justify-content:space-between">' +
              '<span style="color:#64748b;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:80px">' + (o.marchand_nom||'') + '</span>' +
              '<span style="font-weight:700;color:#1e293b">' + fcfa(o.prix) + '</span>' +
            '</div>';
          }).join(''),
          '<a href="' + (p.offres[0] && p.offres[0].url_achat ? p.offres[0].url_achat : '#') + '" target="_blank" ' +
            'style="display:block;margin-top:8px;padding:8px;background:' + (isCheapest?'#10b981':'#1d4ed8') + ';color:#fff;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none">Acheter →</a>',
        '</div>',
      ].join('');
    }).join('');

    render([
      '<div style="padding:16px 5%;max-width:800px;margin:0 auto">',
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">',
          '<button onclick="retourListe()" style="background:none;border:none;color:#1d4ed8;font-size:14px;font-weight:600;cursor:pointer;padding:0">← Retour</button>',
          '<h2 style="font-size:17px;font-weight:800;color:#1e293b;margin:0">⚖ Comparaison côte à côte</h2>',
          '<button onclick="state.comparer=[];retourListe()" style="margin-left:auto;padding:6px 12px;background:#fef2f2;color:#ef4444;border:1px solid #fecaca;border-radius:8px;font-size:12px;cursor:pointer">✕ Vider</button>',
        '</div>',
        '<div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:8px">',
          colonnes,
        '</div>',
      '</div>',
    ].join(''));
  } catch(err) {
    dbgErr('ouvrirComparaison', err);
    render('<div style="padding:24px 5%"><button onclick="retourListe()" style="background:none;border:none;color:#1d4ed8;cursor:pointer;font-weight:600">← Retour</button><p style="color:#ef4444;margin-top:12px">' + err.message + '</p></div>');
  }
}

// ── Mode comparaison ─────────────────────────────────────────────
function toggleComparer(id) {
  var idx = state.comparer.indexOf(id);
  if (idx !== -1) { state.comparer.splice(idx, 1); }
  else { if (state.comparer.length >= 3) { toast('Maximum 3 produits à comparer', '#f97316'); return; } state.comparer.push(id); }
  // Mise à jour barre + cartes sans rechargement
  chargerProduits(state.query, state.categorie, state.page);
}

// ═══════════════════════════════════════════════════════════════
//  ACTIONS & NAVIGATION
// ═══════════════════════════════════════════════════════════════

var _searchTimer = null;
function onSearchInput(val) {
  clearTimeout(_acTimer);
  var inp = document.getElementById('search-input');
  if (inp && val.length >= 2) {
    _acTimer = setTimeout(function() { chargerSuggestions(val, inp); }, 280);
  } else { fermerSuggestions(); }
}

function doSearch() {
  var inp = document.getElementById('search-input');
  if (!inp) return;
  var parsed = parseSearch(inp.value);
  if (parsed.prixMax) state.prixMax = parsed.prixMax;
  if (parsed.prixMin) state.prixMin = parsed.prixMin;
  chargerProduits(parsed.q, state.categorie, 1);
}

function goHome()              { state.prixMax=''; state.prixMin=''; chargerProduits('','',1); }
function retourListe() {
  // Réinitialiser le conteneur
  var appEl = document.getElementById('app');
  if (appEl) {
    appEl.style.maxWidth  = '';
    appEl.style.padding   = '';
    appEl.style.margin    = '';
    appEl.style.width     = '';
  }
  chargerProduits(state.query, state.categorie, state.page||1);
}
function changeVille(v)        { state.ville = v; chargerProduits(state.query, state.categorie, 1); }
function loadPromos()          { chargerProduits('promo','',1); }
function filtrerCategorie(s)   { chargerProduits(state.query, s===state.categorie?'':s, 1); }
function changerTri(v)         { state.tri = v; chargerProduits(state.query, state.categorie, 1); }
function changerVue(v)         { state.vue = v; chargerProduits(state.query, state.categorie, state.page); }
function filtrerBudget(max, min) { state.prixMax = max||''; state.prixMin = min||''; chargerProduits(state.query, state.categorie, 1); }
function changerTri(v)         { state.tri = v; chargerProduits(state.query, state.categorie, 1); }
function reinitialiserFiltres() { state.prixMax=''; state.prixMin=''; state.categorie=''; state.tri='pertinence'; chargerProduits('','',1); }

function _appSimFiltres(id) {
  ouvrirProduit(id, {
    prixMax:  parseInt(document.getElementById('sf-max').value||'0',10)||null,
    marchand: document.getElementById('sf-site').value||null,
  });
}

function showAccount() {
  toast(state.user ? 'Connecté : ' + state.user.nom : 'Connexion bientôt disponible 🔐', '#6366f1');
}

function afficherLogs() {
  navigator.clipboard && navigator.clipboard.writeText(PM_LOGS())
    .then(function() { toast('Logs copiés ✅', '#6366f1'); })
    .catch(function() { alert(PM_LOGS()); });
}

document.addEventListener('DOMContentLoaded', function() {
  dbg('DOMContentLoaded');
  goHome();
});
