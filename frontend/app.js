// ═══════════════════════════════════════════════════════════════
//  Yombale — Comparateur de prix Sénégal
//  app.js VERSION 6 — 2026-05-14
//  Si vous voyez ceci dans la console, le bon fichier est chargé
// ═══════════════════════════════════════════════════════════════
console.log('%c✅ Yombale app.js VERSION 7 chargé', 'color:#10b981;font-size:16px;font-weight:bold');

var API = '/api';

var _prefsDefaut = {
  sections:   ['prix', 'specs', 'historique'], // sections visibles
  poidsPrice: 3,   // poids prix dans le score (1=peu important … 5=très important)
  marchand:   '',  // filtre offres sur ce marchand ('' = tous)
  budgetMax:  '',  // budget max FCFA ('': pas de limite)
};
var state = {
  token:     localStorage.getItem('pm_token'),
  user:      JSON.parse(localStorage.getItem('pm_user') || 'null'),
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
  comparerCat: '',             // catégorie_id commune des produits en comparaison
  favoris:   JSON.parse(localStorage.getItem('yomb_favoris') || '[]'),
  currentPage: 'home',
  telecomOperateur:  '',
  telecomType:       '',
  telecomTri:        '',
  telecomOperateurs: null,
  comparerForfaits:  [],    // ids sélectionnés pour comparaison télécom
  forfaitCache:      {},    // id → objet forfait complet
  telecomProfil:     'mixte', // profil d'usage : 'internet' | 'appel' | 'mixte'
  telecomRecommandes: {},    // {id: true} — meilleur de chaque opérateur (page courante)
  wizardForfait: { budget: '', profil: 'mixte', dataMin: '', minutesMin: '' },
  recents:   JSON.parse(localStorage.getItem('yomb_recents') || '[]'),
  comparePrefs: Object.assign({}, _prefsDefaut,
    JSON.parse(localStorage.getItem('yomb_compare_prefs') || '{}')),
  comparePrefsOpen: false,     // panneau paramètres ouvert ou non
};

// Cache léger des produits affichés (id → {nom, image_url}) — alimenté par carteHTML/guide
var _productCache = {};

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
function render(html) {
  var m = document.getElementById('modal-generique');
  if (m) m.style.display = 'none';
  var a = document.getElementById('app');
  if (a) a.innerHTML = html;
}
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
  { slug: 'telecom',      label: 'Télécom & Forfaits', icon: '📶' },
  { slug: 'immo',         label: 'Immobilier',         icon: '🏡' },
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
  state.currentPage = 'home';

  if (categorie === 'telecom') { chargerForfaits(page); return; }
  if (categorie === 'immo')   { chargerImmo(page);    return; }

  dbg('chargerProduits', { q: query, cat: categorie, page: page });

  if (page === 1) {
    render('<div class="loader"><div class="spin"></div><p>Recherche en cours...</p></div>');
  } else {
    var s = document.querySelector('.products');
    if (s) { var sp = document.createElement('div'); sp.id = 'sp'; sp.className = 'loader'; sp.innerHTML = '<div class="spin"></div>'; s.appendChild(sp); }
  }

  // En mode comparaison, filtrer par catégorie + sous-type précis
  var catSousType = (state.comparer.length > 0 && state.comparerCat) ? state.comparerCat : '';
  var catFiltre   = catSousType ? (_CAT_DB_SLUG[catSousType] || catSousType) : (categorie || '');
  var params = new URLSearchParams({
    q: query || '', categorie: catFiltre,
    sousType: catSousType || '',
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

// ── Bandeau filtrage comparaison ─────────────────────────────────
function htmlBannerCompare() {
  var nomCat = _NOMS_CAT[state.comparerCat] || state.comparerCat || '';
  var premier = (_productCache[state.comparer[0]] || {}).nom || '';
  var label = premier.length > 35 ? premier.slice(0, 35) + '…' : premier;
  return '<div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:10px;' +
    'padding:10px 16px;margin:0 5% 12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
    '<span style="font-size:13px;color:#1d4ed8;font-weight:700">⚖ Comparaison active</span>' +
    '<span style="font-size:12px;color:#475569;flex:1">Affichage limité aux <strong>' + nomCat +
      '</strong> compatibles avec <em>' + label + '</em></span>' +
    '<button onclick="viderComparaison()" style="padding:4px 10px;background:#fff;border:1px solid #bfdbfe;' +
      'border-radius:6px;font-size:11px;font-weight:600;color:#ef4444;cursor:pointer">✕ Annuler</button>' +
  '</div>';
}

// ── Template liste — avec dashboard si résultats ────────────────
function templateListe(produits, data) {
  var isSearch = !!(state.query || state.categorie || state.prixMax || state.prixMin);
  return [
    htmlHero(),
    htmlChipsBudget(),
    state.comparer.length > 0 ? htmlBannerCompare() : '',
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
    htmlMarchands(),
    htmlFooter(),
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
      '<p>Comparez instantanément les prix chez les meilleurs marchands du Sénégal</p>',
      '<div class="sbar" style="position:relative">',
        '<input type="text" id="search-input" autocomplete="off"',
          ' value="' + (state.query || '') + '"',
          ' placeholder="Ex: Samsung Galaxy A55, climatiseur 18000 BTU..."',
          ' onkeydown="if(event.key===\'Enter\'){fermerSuggestions();doSearch()}"',
          ' oninput="onSearchInput(this.value)">',
        '<button onclick="fermerSuggestions();doSearch()">🔍 Comparer</button>',
      '</div>',
      htmlCategories(),
      '<div class="hero-stats">',
        '<div class="hstat"><strong>9+</strong><span>Sites partenaires</span></div>',
        '<div class="hstat"><strong>3 000+</strong><span>Produits indexés</span></div>',
        '<div class="hstat"><strong>100%</strong><span>Gratuit</span></div>',
        '<div class="hstat"><strong>Dakar</strong><span>& partout au Sénégal</span></div>',
      '</div>',
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

// ── Inférence de catégorie depuis le nom produit ─────────────────
// Priorités ordonnées : les plus spécifiques en premier
function _inferCat(nom) {
  if (!nom) return '';
  var n = nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // 1. Audio / wearables (avant smartphones — "Galaxy Buds/Watch" sinon → smartphones)
  if (/ecouteur|airpod|galaxy.buds|freebuds|redmi.buds|nothing.ear|casque.(audio|bluetooth|sans.fil|anc|noise)|\btws\b|enceinte.(bluetooth|portable|sans.fil)|haut.parleur|soundbar|barre.de.son|montre.connect|smartwatch|bracelet.connect|galaxy.watch|galaxy.fit|redmi.watch|xiaomi.watch/.test(n)) return 'audio';

  // 2. Téléviseurs (avant smartphones — "Samsung TV" sinon → smartphones)
  if (/television|televiseur|tv.4k|tv.led|tv.oled|tv.qled|smart.tv|android.tv|led.tv|\bpouces?.tv\b|hisense.tv|lg.tv|samsung.tv|tcl.tv|bruhm|skyworth|ecran.tv|astech.tv|finix.tv/.test(n)) return 'tv';

  // 3. Réfrigération
  if (/refrigerat|frigo\b|congelat|armoire.refrig|vitrine.refrig/.test(n)) return 'froid';

  // 4. Climatisation
  if (/climatiseur|\bsplit\s|\bsplit.inv|pompe.a.chaleur/.test(n)) return 'clim';

  // 5. Électroménager (petit + gros sauf clim/froid)
  if (/lave.linge|machine.{0,5}laver|seche.linge|lave.vaisselle|micro.onde|four.(electrique|gaz)|chauffe.eau|ventilateur|air.fryer|friteuse|induction|plaque.de.cuisson|mixeur|blender|aspirateur|fer.a.repasser|cafetiere|bouilloire|grille.pain/.test(n)) return 'electro';

  // 6. Tablettes (avant smartphones — "Galaxy Tab", "iPad")
  if (/galaxy.tab|samsung.tab|\btablette\b|\bipad\b|lenovo.tab|matepad|xiaomi.pad/.test(n)) return 'tablette';

  // 7. Smartphones
  if (/iphone|tecno\s|infinix\s|oppo\s|realme\s|\bitel\s|vivo\s|redmi\s|samsung.galaxy.[asmzf]|xiaomi.(mi|poco)\s|huawei.[pyn]|nokia\s|oneplus\s|google.pixel|motorola.moto|smartphone|telephone.portable/.test(n)) return 'smartphones';
  if (/\bgalaxy\b/.test(n) && !/tab|watch|buds|fit/.test(n)) return 'smartphones';

  // 8. Informatique
  if (/\blaptop\b|ordinateur|macbook|chromebook|lenovo|dell\s|\bpc\s|\basus\b|\bacer\b|imprimante|disque.dur|\bssd\b|moniteur|routeur|clavier\s|souris\s/.test(n)) return 'informatique';

  // 9. Maison
  if (/canape|\bchaise\b|matelas|\blit\s|\barmoire\b|\bmeuble\b|fontaine|table.basse|commode/.test(n)) return 'maison';

  // 10. Mode
  if (/\brobe\b|chaussure|sac.a.main|chemise\s|\bpantalon\b|sneaker|\bbasket\b|\bparfum\b|eau.de.toilette|jean.homme|t-shirt/.test(n)) return 'mode';

  // 11. Auto-moto
  if (/\bvoiture\b|\bmoto\s|\bscooter\b|trottinette|piece.auto|batterie.voiture/.test(n)) return 'auto-moto';

  // 12. Jeux
  if (/playstation|\bps[45]\b|\bxbox\b|nintendo|manette.jeu|jeu.video|\bgaming\b|casque.gamer/.test(n)) return 'jeux';

  return '';
}

// ── Carte grille ─────────────────────────────────────────────────
function carteHTML(p) {
  _productCache[p.id] = { nom: p.nom, image_url: p.image_url };
  var enCompare = state.comparer.indexOf(p.id) !== -1;
  var enFavori  = state.favoris.indexOf(p.id) !== -1;
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
          '<button onclick="event.stopPropagation();toggleComparer(\'' + p.id + '\',\'' + _inferCat(p.nom||'') + '\')" ' +
            'title="' + (enCompare ? 'Retirer de la comparaison' : 'Ajouter à la comparaison') + '" ' +
            'style="padding:6px 8px;border-radius:6px;border:1px solid ' + (enCompare ? '#1d4ed8' : '#e2e8f0') + ';' +
            'background:' + (enCompare ? '#eff6ff' : '#fff') + ';cursor:pointer;font-size:14px">⚖</button>',
          '<button onclick="event.stopPropagation();toggleFavori(\'' + p.id + '\')" ' +
            'title="' + (enFavori ? 'Retirer des favoris' : 'Ajouter aux favoris') + '" ' +
            'style="padding:6px 8px;border-radius:6px;border:1px solid ' + (enFavori ? '#ef4444' : '#e2e8f0') + ';' +
            'background:' + (enFavori ? '#fef2f2' : '#fff') + ';cursor:pointer;font-size:14px">' +
            (enFavori ? '❤' : '🤍') + '</button>',
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

// ═══════════════════════════════════════════════════════════════
//  VERTICALE TÉLÉCOM & FORFAITS
// ═══════════════════════════════════════════════════════════════

// ── Scoring forfaits ────────────────────────────────────────────
function _scoreForfait(f, profil) {
  // Toutes les métriques sont normalisées 0→1 dans la fonction appelante.
  // Ici on retourne les composantes brutes pour normalisation.
  var data    = f.data_mo   || 0;
  var minutes = f.minutes   || 0;
  var jours   = f.validite_jours || 1;
  var prix    = f.prix      || 9999999;
  // Efficacité : data par franc, minutes par franc
  var effData = data    > 0 ? data    / prix : 0;
  var effVoix = minutes > 0 ? minutes / prix : 0;
  var effJour = jours / prix;
  if (profil === 'internet') return effData * 0.65 + effJour * 0.20 + (1 / prix) * 0.15;
  if (profil === 'appel')    return effVoix * 0.65 + effJour * 0.20 + (1 / prix) * 0.15;
  // mixte
  return effData * 0.35 + effVoix * 0.35 + effJour * 0.15 + (1 / prix) * 0.15;
}

// Classe un forfait dans son groupe de validité
function _groupeValidite(f) {
  var j = f.validite_jours || 0;
  if (j <= 1)  return '1j';
  if (j <= 10) return '7j';
  if (j <= 31) return '30j';
  return 'autre';
}

// Retourne { groupes: {1j:{label,icone,best[]}, 7j:{...}, 30j:{...}}, ids:{id:true} }
// best[] = un forfait par opérateur, le mieux scoré dans ce groupe de validité
function _meilleursParValidite(forfaits, profil) {
  var DEF = {
    '1j':  { label: '1 jour',    icone: '☀️', best: {}, ordre: 0 },
    '7j':  { label: '1 semaine', icone: '📅', best: {}, ordre: 1 },
    '30j': { label: '1 mois',    icone: '📆', best: {}, ordre: 2 },
  };

  forfaits.forEach(function(f) {
    var grp = _groupeValidite(f);
    if (!DEF[grp]) return;
    var s = _scoreForfait(f, profil);
    var cur = DEF[grp].best[f.operateur];
    if (!cur || s > cur.score) {
      DEF[grp].best[f.operateur] = { f: f, score: s };
    }
  });

  var ids = {};
  var groupes = {};
  ['1j', '7j', '30j'].forEach(function(key) {
    var g = DEF[key];
    var liste = Object.keys(g.best).map(function(op) { return g.best[op].f; });
    // Trier les cartes par opérateur pour cohérence visuelle
    liste.sort(function(a, b) { return a.operateur.localeCompare(b.operateur); });
    if (liste.length) {
      groupes[key] = { label: g.label, icone: g.icone, best: liste };
      liste.forEach(function(f) { ids[f.id] = true; });
    }
  });

  return { groupes: groupes, ids: ids };
}

// Compat — conservé pour l'ancienne modale comparaison
function _meilleursParOperateur(forfaits, profil) {
  return _meilleursParValidite(forfaits, profil).ids;
}

function _dataLabel(data_mo) {
  if (!data_mo) return '';
  return data_mo >= 1000 ? (data_mo / 1000) + ' Go' : data_mo + ' Mo';
}

function carteForfaitHTML(f) {
  state.forfaitCache[f.id] = f;
  var dataLabel    = _dataLabel(f.data_mo);
  var enCompare    = state.comparerForfaits.indexOf(f.id) !== -1;
  var isRecommande = !!(state.telecomRecommandes && state.telecomRecommandes[f.id]);
  return [
    '<div class="pcard telecom' + (isRecommande ? ' best-choice' : '') + '" onclick="ouvrirForfait(\'' + f.id + '\')">',
      isRecommande ? '<div class="pbadge-eco" style="background:#10b981">🏆 Recommandé</div>' : '',
      '<div class="pimg" style="background:linear-gradient(135deg,#fff7ed,#ffedd5)">',
        f.image_url
          ? '<img src="' + f.image_url + '" alt="" loading="lazy" style="width:100%;height:100%;object-fit:contain">'
          : '<span style="font-size:40px">📶</span>',
      '</div>',
      '<div class="pbody">',
        '<div style="font-size:11px;font-weight:700;color:#f97316;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">' + (f.operateur || '') + '</div>',
        '<div class="pname">' + f.nom + '</div>',
        '<div style="display:flex;flex-wrap:wrap;gap:4px;margin:6px 0">',
          dataLabel ? '<span style="font-size:11px;font-weight:600;color:#1d4ed8;background:#eff6ff;padding:2px 8px;border-radius:10px">📶 ' + dataLabel + '</span>' : '',
          f.minutes ? '<span style="font-size:11px;font-weight:600;color:#10b981;background:#ecfdf5;padding:2px 8px;border-radius:10px">📞 ' + f.minutes + ' min</span>' : '',
          f.sms     ? '<span style="font-size:11px;font-weight:600;color:#7c3aed;background:#f5f3ff;padding:2px 8px;border-radius:10px">✉ ' + f.sms + ' SMS</span>' : '',
        '</div>',
        '<div class="pprice">' + fcfa(f.prix) + '</div>',
        f.validite_jours ? '<div class="poffers">Validité ' + f.validite_jours + ' j · ' + fcfa(Math.round(f.prix / f.validite_jours)) + '/jour</div>' : '<div class="poffers"></div>',
        '<div style="display:flex;gap:6px;margin-top:6px">',
          '<button class="btn-voir" style="flex:1" onclick="event.stopPropagation();ouvrirForfait(\'' + f.id + '\')">Voir →</button>',
          '<button onclick="event.stopPropagation();toggleComparerForfait(\'' + f.id + '\')" ' +
            'title="' + (enCompare ? 'Retirer' : 'Comparer') + '" ' +
            'style="padding:6px 9px;border-radius:6px;border:1.5px solid ' + (enCompare ? '#f97316' : '#e2e8f0') + ';' +
            'background:' + (enCompare ? '#fff7ed' : '#fff') + ';cursor:pointer;font-size:14px">⚖</button>',
        '</div>',
      '</div>',
    '</div>',
  ].join('');
}

function htmlBarreTelecom() {
  var sStyle = 'padding:6px 8px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;background:#fff;cursor:pointer;outline:none';
  var nb     = state.comparerForfaits.length;
  var profil = state.telecomProfil || 'mixte';
  function pTab(p, label) {
    var act = p === profil;
    return '<button onclick="changerProfilGrille(\'' + p + '\')" ' +
      'style="padding:4px 10px;border-radius:14px;border:1px solid ' + (act ? '#10b981' : '#e2e8f0') + ';' +
      'background:' + (act ? '#f0fdf4' : '#fff') + ';color:' + (act ? '#059669' : '#64748b') + ';' +
      'font-size:11px;font-weight:' + (act ? '700' : '500') + ';cursor:pointer">' + label + '</button>';
  }
  return [
    '<div style="display:flex;flex-direction:column;gap:6px;padding:8px 5%;border-bottom:1px solid #f1f5f9">',
      // Ligne 1 : filtres
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">',
        '<select onchange="filtrerTelecomOperateur(this.value)" style="' + sStyle + '">',
          '<option value="">Tous opérateurs</option>',
          (state.telecomOperateurs || []).map(function(o) {
            return '<option value="' + o + '"' + (state.telecomOperateur === o ? ' selected' : '') + '>' + o + '</option>';
          }).join(''),
        '</select>',
        '<select onchange="filtrerTelecomType(this.value)" style="' + sStyle + '">',
          [['', 'Tous types'], ['internet', 'Internet'], ['appel', 'Appel'], ['sms', 'SMS'], ['combo', 'Combo']].map(function(t) {
            return '<option value="' + t[0] + '"' + (state.telecomType === t[0] ? ' selected' : '') + '>' + t[1] + '</option>';
          }).join(''),
        '</select>',
        '<select onchange="changerTriTelecom(this.value)" style="' + sStyle + '">',
          [['', '🎯 Pertinence'], ['prix_asc', '⬆ Prix ↑'], ['prix_desc', '⬇ Prix ↓'], ['data_desc', '📶 Plus de data']].map(function(t) {
            return '<option value="' + t[0] + '"' + (state.telecomTri === t[0] ? ' selected' : '') + '>' + t[1] + '</option>';
          }).join(''),
        '</select>',
        '<button onclick="ouvrirWizardForfait()" style="margin-left:auto;padding:6px 14px;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">🎯 Trouver mon forfait</button>',
        nb > 0
          ? '<button onclick="ouvrirComparaisonForfaits()" style="padding:6px 14px;background:#f97316;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">⚖ (' + nb + ')</button>' +
            '<button onclick="viderComparaisonForfaits()" style="padding:6px 10px;border-radius:8px;border:1px solid #fecaca;background:#fef2f2;color:#ef4444;font-size:11px;font-weight:600;cursor:pointer">✕</button>'
          : '',
      '</div>',
      // Ligne 2 : profil usage (influence le badge Recommandé)
      '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">',
        '<span style="font-size:11px;color:#64748b;font-weight:500">🏆 Recommandé pour :</span>',
        pTab('internet', '🌐 Internet'),
        pTab('appel', '📞 Appels'),
        pTab('mixte', '🔀 Mixte'),
      '</div>',
    '</div>',
  ].join('');
}

function changerProfilGrille(profil) {
  state.telecomProfil = profil;
  chargerForfaits(1);
}

// ═══════════════════════════════════════════════════════════════
//  VERTICALE IMMOBILIER
// ═══════════════════════════════════════════════════════════════

var _immoState = {
  transaction: 'location',
  ville: '',
  quartier: '',
  type_bien: '',
  prixMin: '',
  prixMax: '',
  surfaceMin: '',
  nbPieces: '',
  tri: 'recent',
  villes: null,
  compare: [],   // annonces sélectionnées pour comparaison (max 3)
};

var TYPE_BIEN_LABELS = {
  '':                   'Tous types',
  'appartement':        'Appartement',
  'appartement_meuble': 'Appart. meublé',
  'villa':              'Villa',
  'maison':             'Maison',
  'studio':             'Studio',
  'chambre':            'Chambre',
  'chambre_meuble':     'Chambre meublée',
  'bureau':             'Bureau',
  'terrain':            'Terrain',
};

function _immoIcon(type) {
  var MAP = { appartement:'🏢', appartement_meuble:'🛋', villa:'🏡', maison:'🏠', studio:'🛏', chambre:'🛏', chambre_meuble:'🛋', bureau:'🏗', terrain:'🌿' };
  return MAP[type] || '🏠';
}

function _sourceBadge(source) {
  if (!source) return '';
  if (source.startsWith('facebook'))   return '<span style="font-size:10px;font-weight:700;color:#1877f2;background:#e7f0fd;padding:1px 6px;border-radius:6px">fb</span>';
  if (source === 'expat-dakar')        return '<span style="font-size:10px;font-weight:700;color:#e65c00;background:#fff0e6;padding:1px 6px;border-radius:6px">expat</span>';
  if (source === 'coinafrique')        return '<span style="font-size:10px;font-weight:700;color:#059669;background:#ecfdf5;padding:1px 6px;border-radius:6px">coin</span>';
  return '<span style="font-size:10px;color:#64748b;background:#f1f5f9;padding:1px 6px;border-radius:6px">' + source + '</span>';
}

// ── Carte annonce immo ───────────────────────────────────────────
function carteImmoHTML(a) {
  var photo   = (a.photos && a.photos.length) ? a.photos[0] : null;
  var infos   = [];
  if (a.surface_m2)  infos.push('📐 ' + a.surface_m2 + ' m²');
  if (a.nb_pieces)   infos.push('🚪 ' + a.nb_pieces + ' p.');
  if (a.nb_chambres) infos.push('🛏 ' + a.nb_chambres + ' ch.');
  var inCmp   = _immoState.compare.some(function(x) { return x.id === a.id; });
  var prixM2  = (a.prix && a.surface_m2) ? Math.round(a.prix / a.surface_m2) : null;
  return [
    '<div class="pcard immo' + (inCmp ? ' immo-selected' : '') + '" onclick="ouvrirImmo(\'' + a.id + '\')">',
      '<div class="pimg" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);position:relative">',
        photo
          ? '<img src="' + photo + '" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\'">'
          : '<span style="font-size:40px">' + _immoIcon(a.type_bien) + '</span>',
        '<div style="position:absolute;top:8px;left:8px;display:flex;gap:4px;flex-wrap:wrap">',
          '<span style="font-size:10px;font-weight:700;color:#fff;background:' + (a.transaction === 'vente' ? '#7c3aed' : '#059669') + ';padding:2px 7px;border-radius:6px">' + (a.transaction === 'vente' ? 'Vente' : 'Location') + '</span>',
          '<span style="font-size:10px;font-weight:700;color:#1e293b;background:rgba(255,255,255,.85);padding:2px 7px;border-radius:6px">' + (TYPE_BIEN_LABELS[a.type_bien] || a.type_bien || '') + '</span>',
        '</div>',
        '<button onclick="event.stopPropagation();_immoToggleCompare(' + JSON.stringify(a).replace(/'/g,"\\'") + ')" ' +
          'style="position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;border:2px solid ' + (inCmp ? '#059669' : 'rgba(255,255,255,.8)') + ';background:' + (inCmp ? '#059669' : 'rgba(255,255,255,.85)') + ';color:' + (inCmp ? '#fff' : '#475569') + ';font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700" title="Comparer">' + (inCmp ? '✓' : '+') + '</button>',
      '</div>',
      '<div class="pbody">',
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px">',
          '<div style="font-size:11px;color:#64748b">' + (a.quartier || a.ville || '') + '</div>',
          _sourceBadge(a.source),
        '</div>',
        '<div class="pname" style="font-size:13px">' + (a.titre || '') + '</div>',
        infos.length ? '<div style="display:flex;flex-wrap:wrap;gap:4px;margin:5px 0;font-size:11px;color:#475569">' + infos.join(' · ') + (prixM2 ? ' · <span style="color:#059669;font-weight:700">' + fcfa(prixM2) + '/m²</span>' : '') + '</div>' : '',
        a.prix
          ? '<div class="pprice" style="color:#059669">' + fcfa(a.prix) + (a.transaction === 'location' ? '<span style="font-size:11px;font-weight:400;color:#64748b">/mois</span>' : '') + '</div>'
          : '<div class="pprice" style="color:#94a3b8">Prix à négocier</div>',
        '<button class="btn-voir" style="width:100%;margin-top:8px" onclick="event.stopPropagation();ouvrirImmo(\'' + a.id + '\')">Voir détail →</button>',
      '</div>',
    '</div>',
  ].join('');
}

// ── Barre de filtres immo ───────────────────────────────────────
function htmlBarreImmo() {
  var si = 'padding:5px 8px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;background:#fff;outline:none';
  var im = _immoState;
  var cmpN = im.compare.length;
  function tBtn(label, val) {
    var act = im.transaction === val;
    return '<button onclick="_immoTransaction(\'' + val + '\')" style="padding:5px 16px;border-radius:16px;border:1.5px solid ' + (act ? '#059669' : '#e2e8f0') + ';background:' + (act ? '#f0fdf4' : '#fff') + ';color:' + (act ? '#059669' : '#64748b') + ';font-size:12px;font-weight:' + (act ? '700' : '500') + ';cursor:pointer">' + label + '</button>';
  }
  var hasFilters = im.ville || im.quartier || im.type_bien || im.prixMin || im.prixMax || im.surfaceMin || im.nbPieces;
  return [
    '<div style="padding:8px 5%;border-bottom:1px solid #f1f5f9;display:flex;flex-direction:column;gap:8px">',

      // Ligne 1 : transaction + wizard + reset
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">',
        tBtn('🏠 Location', 'location'),
        tBtn('🔑 Vente', 'vente'),
        '<button onclick="ouvrirWizardImmo()" style="padding:6px 16px;border-radius:16px;border:2px solid #2563eb;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;font-size:12px;font-weight:700;cursor:pointer;display:flex;flex-direction:column;align-items:center;line-height:1.2;box-shadow:0 2px 8px rgba(37,99,235,.35)"><span>🔍 Trouver mon bien</span><span style="font-size:9px;font-weight:500;opacity:.85">Budget · Quartier · Type → Top 5</span></button>',
        '<button onclick="ouvrirPublierAnnonce()" style="padding:6px 16px;border-radius:16px;border:2px solid #059669;background:#fff;color:#059669;font-size:12px;font-weight:700;cursor:pointer">📢 Publier une annonce (gratuit)</button>',
        cmpN >= 2 ? '<button onclick="_immoOuvrirComparaison()" style="padding:5px 14px;border-radius:16px;border:1.5px solid #7c3aed;background:#f5f3ff;color:#7c3aed;font-size:12px;font-weight:700;cursor:pointer">⚖ Comparer ' + cmpN + ' biens</button>' : '',
        hasFilters ? '<button onclick="_immoResetFiltres()" style="padding:5px 12px;border-radius:16px;border:1.5px solid #fca5a5;background:#fff5f5;color:#e63946;font-size:11px;font-weight:600;cursor:pointer;margin-left:auto">✕ Réinitialiser</button>' : '',
      '</div>',

      // Ligne 2 : filtres principaux
      '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">',
        '<select onchange="_immoFiltreVille(this.value)" style="' + si + ';cursor:pointer">',
          '<option value="">📍 Toutes villes</option>',
          (im.villes || []).map(function(v) {
            return '<option value="' + v.ville + '"' + (im.ville === v.ville ? ' selected' : '') + '>' + v.ville + ' (' + v.nb + ')</option>';
          }).join(''),
        '</select>',
        '<input type="text" placeholder="🗺 Quartier" value="' + (im.quartier || '') + '" ' +
          'oninput="_immoFiltreQuartier(this.value)" onchange="_immoSearchFromInput()" style="' + si + ';width:110px">',
        '<select onchange="_immoFiltreType(this.value)" style="' + si + ';cursor:pointer">',
          Object.keys(TYPE_BIEN_LABELS).map(function(k) {
            return '<option value="' + k + '"' + (im.type_bien === k ? ' selected' : '') + '>' + TYPE_BIEN_LABELS[k] + '</option>';
          }).join(''),
        '</select>',
        '<select onchange="_immoNbPieces(this.value)" style="' + si + ';cursor:pointer">',
          [['','Nb pièces'],['1','1 pièce+'],['2','2 pièces+'],['3','3 pièces+'],['4','4 pièces+'],['5','5 pièces+']].map(function(t) {
            return '<option value="' + t[0] + '"' + (im.nbPieces === t[0] ? ' selected' : '') + '>' + t[1] + '</option>';
          }).join(''),
        '</select>',
        '<input type="number" placeholder="📐 Surface min m²" value="' + (im.surfaceMin || '') + '" ' +
          'oninput="_immoSurfaceMin(this.value)" onchange="_immoSearchFromInput()" style="' + si + ';width:110px">',
        '<div style="display:flex;gap:4px;align-items:center;margin-left:auto">',
          '<input type="number" placeholder="Prix min" value="' + (im.prixMin || '') + '" ' +
            'oninput="_immoPrixMin(this.value)" onchange="_immoSearchFromInput()" style="' + si + ';width:88px">',
          '<span style="font-size:11px;color:#94a3b8">–</span>',
          '<input type="number" placeholder="Prix max" value="' + (im.prixMax || '') + '" ' +
            'oninput="_immoPrixMax(this.value)" onchange="_immoSearchFromInput()" style="' + si + ';width:88px">',
          '<select onchange="_immoFiltreTri(this.value)" style="' + si + ';cursor:pointer">',
            [['recent','🕐 Récent'],['prix_asc','⬆ Prix'],['prix_desc','⬇ Prix'],['surface_desc','📐 Surface']].map(function(t) {
              return '<option value="' + t[0] + '"' + (im.tri === t[0] ? ' selected' : '') + '>' + t[1] + '</option>';
            }).join(''),
          '</select>',
        '</div>',
      '</div>',

    '</div>',
  ].join('');
}

function _immoTransaction(v)   { _immoState.transaction = v;  chargerImmo(1); }
function _immoFiltreVille(v)   { _immoState.ville = v;        chargerImmo(1); }
function _immoFiltreType(v)    { _immoState.type_bien = v;    chargerImmo(1); }
function _immoFiltreTri(v)     { _immoState.tri = v;          chargerImmo(1); }
function _immoNbPieces(v)      { _immoState.nbPieces = v;     chargerImmo(1); }
// Inputs texte/nombre : oninput = mise à jour état seule (pas de recherche)
//                        onchange = déclenchement recherche (blur ou Entrée)
function _immoFiltreQuartier(v){ _immoState.quartier = v; }
function _immoPrixMin(v)       { _immoState.prixMin = v; }
function _immoPrixMax(v)       { _immoState.prixMax = v; }
function _immoSurfaceMin(v)    { _immoState.surfaceMin = v; }
function _immoSearchFromInput(){ chargerImmo(1); }
function _immoResetFiltres()   {
  var im = _immoState;
  im.ville = ''; im.quartier = ''; im.type_bien = ''; im.prixMin = ''; im.prixMax = '';
  im.surfaceMin = ''; im.nbPieces = ''; im.tri = 'recent';
  chargerImmo(1);
}

// ── Comparaison immo ─────────────────────────────────────────────
function _immoToggleCompare(a) {
  var im = _immoState;
  var idx = im.compare.findIndex(function(x) { return x.id === a.id; });
  if (idx !== -1) {
    im.compare.splice(idx, 1);
  } else {
    if (im.compare.length >= 3) { toast('Maximum 3 biens à comparer', '#f97316'); return; }
    im.compare.push(a);
  }
  chargerImmo(state.page);
}

function _immoOuvrirComparaison() {
  var biens = _immoState.compare;
  if (biens.length < 2) { toast('Sélectionnez au moins 2 biens', '#f97316'); return; }

  var ROWS = [
    ['🏷 Type',      function(a) { return TYPE_BIEN_LABELS[a.type_bien] || a.type_bien || '—'; }],
    ['📍 Ville',     function(a) { return a.ville || '—'; }],
    ['🗺 Quartier',  function(a) { return a.quartier || '—'; }],
    ['💰 Prix',      function(a) { return a.prix ? fcfa(a.prix) : 'N/C'; }],
    ['📐 Surface',   function(a) { return a.surface_m2 ? a.surface_m2 + ' m²' : '—'; }],
    ['💵 Prix/m²',   function(a) { return (a.prix && a.surface_m2) ? fcfa(Math.round(a.prix / a.surface_m2)) : '—'; }],
    ['🚪 Pièces',    function(a) { return a.nb_pieces || '—'; }],
    ['🛏 Chambres',  function(a) { return a.nb_chambres || '—'; }],
    ['🔁 Transaction',function(a){ return a.transaction === 'vente' ? 'Vente' : 'Location'; }],
  ];

  // Meilleur prix/m² → surligné en vert
  var meilleurPrixM2Id = null;
  var minPM2 = Infinity;
  biens.forEach(function(a) {
    if (a.prix && a.surface_m2) { var pm2 = a.prix / a.surface_m2; if (pm2 < minPM2) { minPM2 = pm2; meilleurPrixM2Id = a.id; } }
  });

  var cols = biens.map(function(a) { return '<th style="min-width:140px;padding:8px;text-align:center;font-size:12px">' + a.titre.slice(0,40) + (a.titre.length > 40 ? '…' : '') + '</th>'; }).join('');
  var rows = ROWS.map(function(r) {
    var label = r[0]; var fn = r[1];
    var cells = biens.map(function(a) {
      var val = fn(a);
      var isBest = label === '💵 Prix/m²' && a.id === meilleurPrixM2Id;
      return '<td style="padding:8px;text-align:center;font-size:13px;' + (isBest ? 'color:#059669;font-weight:700;background:#f0fdf4' : '') + '">' + val + (isBest ? ' 🏆' : '') + '</td>';
    }).join('');
    return '<tr><td style="padding:8px 12px;font-size:12px;font-weight:700;color:#64748b;white-space:nowrap">' + label + '</td>' + cells + '</tr>';
  }).join('');

  var html = '<div style="overflow-x:auto">' +
    '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<thead><tr style="background:#f8fafc"><th style="padding:8px;text-align:left;font-size:12px;color:#94a3b8">Critère</th>' + cols + '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table></div>' +
    '<div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">' +
      biens.map(function(a) {
        return '<a href="' + (a.url_source || '#') + '" target="_blank" rel="noopener" style="flex:1;min-width:120px;padding:10px;background:#059669;color:#fff;border-radius:10px;text-align:center;font-size:12px;font-weight:700;text-decoration:none">Voir →<br><span style="font-weight:400">' + (a.ville || '') + '</span></a>';
      }).join('') +
    '</div>';

  ouvrirModal('⚖ Comparaison — ' + biens.length + ' biens', html);
}

// ── Modal générique (utilisée par wizard immo + comparaison) ────
function ouvrirModal(titre, html) {
  var m = document.getElementById('modal-generique');
  if (!m) {
    m = document.createElement('div');
    m.id = 'modal-generique';
    document.body.appendChild(m);
  }
  m.innerHTML = '<div style="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto" onclick="if(event.target===this)fermerModal()">' +
    '<div style="background:#fff;border-radius:16px;width:100%;max-width:540px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,.18)">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #f1f5f9;position:sticky;top:0;background:#fff;z-index:1">' +
        '<span style="font-size:16px;font-weight:800;color:#1e293b">' + titre + '</span>' +
        '<button onclick="fermerModal()" style="border:none;background:none;font-size:20px;color:#94a3b8;cursor:pointer;padding:0 4px">✕</button>' +
      '</div>' +
      '<div style="padding:20px">' + html + '</div>' +
    '</div>' +
  '</div>';
  m.style.display = 'block';
}
function fermerModal() {
  var m = document.getElementById('modal-generique');
  if (m) m.style.display = 'none';
}

// ── Wizard "Trouver mon bien" ────────────────────────────────────
var _wzImmo = { budget: '', transaction: 'location', type_bien: '', ville: '', quartier: '', surfaceMin: '', nbChambres: '' };

function ouvrirWizardImmo() {
  var s = 'width:100%;padding:9px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;margin-bottom:10px;outline:none;box-sizing:border-box';
  var w = _wzImmo;
  function tBtn(label, val, field) {
    var act = w[field] === val;
    return '<button onclick="_wzImmoField(\'' + field + '\',\'' + val + '\')" style="padding:7px 18px;border-radius:20px;border:1.5px solid ' + (act ? '#2563eb' : '#e2e8f0') + ';background:' + (act ? '#eff6ff' : '#fff') + ';color:' + (act ? '#2563eb' : '#64748b') + ';font-size:13px;font-weight:' + (act ? '700' : '500') + ';cursor:pointer">' + label + '</button>';
  }
  var html = [
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">',
      tBtn('🏠 Location', 'location', 'transaction'),
      tBtn('🔑 Vente',    'vente',    'transaction'),
    '</div>',
    '<label style="font-size:12px;font-weight:700;color:#64748b">Budget max (FCFA)</label>',
    '<input id="wzi-budget" type="number" placeholder="ex: 300000" value="' + (w.budget||'') + '" style="' + s + '" oninput="_wzImmo.budget=this.value">',
    '<label style="font-size:12px;font-weight:700;color:#64748b">Type de bien</label>',
    '<select id="wzi-type" style="' + s + '" onchange="_wzImmo.type_bien=this.value">',
      Object.keys(TYPE_BIEN_LABELS).map(function(k) {
        return '<option value="' + k + '"' + (w.type_bien === k ? ' selected' : '') + '>' + TYPE_BIEN_LABELS[k] + '</option>';
      }).join(''),
    '</select>',
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:0">',
      '<div><label style="font-size:12px;font-weight:700;color:#64748b">Ville</label>',
      '<select id="wzi-ville" style="' + s + '" onchange="_wzImmo.ville=this.value">',
        '<option value="">Toutes</option>',
        (_immoState.villes || []).map(function(v) { return '<option value="' + v.ville + '"' + (w.ville === v.ville ? ' selected' : '') + '>' + v.ville + '</option>'; }).join(''),
      '</select></div>',
      '<div><label style="font-size:12px;font-weight:700;color:#64748b">Quartier <span style="font-weight:400;color:#94a3b8">(optionnel)</span></label>',
      '<input id="wzi-quartier" type="text" placeholder="ex: Plateau, Almadies…" value="' + (w.quartier||'') + '" style="' + s + '" oninput="_wzImmo.quartier=this.value"></div>',
    '</div>',
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">',
      '<div><label style="font-size:12px;font-weight:700;color:#64748b">Surface min (m²)</label>',
      '<input id="wzi-surface" type="number" placeholder="ex: 60" value="' + (w.surfaceMin||'') + '" style="' + s + '" oninput="_wzImmo.surfaceMin=this.value"></div>',
      '<div><label style="font-size:12px;font-weight:700;color:#64748b">Chambres min</label>',
      '<input id="wzi-ch" type="number" placeholder="ex: 2" value="' + (w.nbChambres||'') + '" style="' + s + '" oninput="_wzImmo.nbChambres=this.value"></div>',
    '</div>',
    '<button onclick="lancerRechercheWizardImmo()" style="width:100%;padding:12px;background:#2563eb;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:800;cursor:pointer;margin-top:4px">🔍 Trouver les meilleures annonces</button>',
  ].join('');
  ouvrirModal('🔍 Trouver mon bien', html);
}

function _wzImmoField(field, val) {
  _wzImmo[field] = val;
  ouvrirWizardImmo();
}

async function lancerRechercheWizardImmo() {
  var w = _wzImmo;
  var params = new URLSearchParams({
    transaction: w.transaction,
    type_bien:   w.type_bien  || '',
    ville:       w.ville      || '',
    quartier:    w.quartier   || '',
    prixMax:     w.budget     || '',
    surfaceMin:  w.surfaceMin || '',
    nbPieces:    w.nbChambres || '',
    tri:         'prix_asc',
    limit: 50, page: 1,
  });
  try {
    var data = await apiFetch('/immo?' + params.toString());
    var annonces = (data.annonces || []).filter(function(a) { return a.prix; });
    var btnRetour = '<button onclick="ouvrirWizardImmo()" style="width:100%;padding:9px;border:1.5px solid #e2e8f0;border-radius:8px;background:#f8fafc;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:12px">← Modifier ma recherche</button>';
    if (!annonces.length) {
      ouvrirModal('🔍 Résultats', btnRetour + '<p style="text-align:center;color:#64748b;padding:12px 0">Aucun bien trouvé avec ces critères.<br>Élargissez votre budget ou vos filtres.</p>');
      return;
    }
    // Score : 0→1 en fonction de l'adéquation budget (plus c'est proche du budget = mieux)
    var budget = parseFloat(w.budget) || Infinity;
    function score(a) {
      var s = 0;
      if (a.prix) s += 0.5 * (1 - Math.min(a.prix, budget) / Math.max(a.prix, budget));
      if (a.surface_m2 && w.surfaceMin) s += 0.3 * Math.min(a.surface_m2 / parseFloat(w.surfaceMin), 1);
      if (a.nb_chambres && w.nbChambres) s += 0.2 * Math.min(a.nb_chambres / parseFloat(w.nbChambres), 1);
      return s;
    }
    annonces.sort(function(a, b) { return score(b) - score(a); });
    var top = annonces.slice(0, 5);
    var medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
    var html = btnRetour + '<div style="display:flex;flex-direction:column;gap:10px">' +
      top.map(function(a, i) {
        var sc = Math.round(score(a) * 100);
        var prixM2 = (a.prix && a.surface_m2) ? fcfa(Math.round(a.prix / a.surface_m2)) + '/m²' : '';
        return '<div style="border:1.5px solid #e2e8f0;border-radius:12px;padding:12px;display:flex;gap:12px;align-items:center;cursor:pointer" onclick="fermerModal();ouvrirImmo(\'' + a.id + '\')">' +
          '<div style="font-size:28px">' + medals[i] + '</div>' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-size:13px;font-weight:700;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + a.titre + '</div>' +
            '<div style="font-size:11px;color:#64748b">' + (a.quartier || a.ville || '') + (a.surface_m2 ? ' · ' + a.surface_m2 + ' m²' : '') + (prixM2 ? ' · ' + prixM2 : '') + '</div>' +
            '<div style="margin-top:4px;background:#e2e8f0;border-radius:4px;height:5px"><div style="background:#2563eb;height:5px;border-radius:4px;width:' + sc + '%"></div></div>' +
          '</div>' +
          '<div style="text-align:right;flex-shrink:0"><div style="font-size:15px;font-weight:800;color:#059669">' + fcfa(a.prix) + '</div><div style="font-size:10px;color:#94a3b8">' + sc + '% match</div></div>' +
        '</div>';
      }).join('') +
    '</div>';
    ouvrirModal('🎯 Top ' + top.length + ' résultats', html);
  } catch(e) {
    ouvrirModal('Erreur', '<p style="color:#e63946">' + e.message + '</p>');
  }
}

// ── Publier une annonce gratuite ─────────────────────────────────
var _pubImmo = { titre:'', type_bien:'appartement', transaction:'location', prix:'', surface_m2:'', nb_pieces:'', nb_chambres:'', ville:'Dakar', quartier:'', description:'', contact_nom:'', contact_tel:'' };

function ouvrirPublierAnnonce() {
  if (!state.user) {
    toast('Connectez-vous pour publier une annonce', '#f97316');
    openLoginModal();
    return;
  }
  var s = 'width:100%;padding:9px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;margin-bottom:10px;outline:none;box-sizing:border-box';
  var p = _pubImmo;
  if (!p.contact_nom) p.contact_nom = state.user.nom || '';
  if (!p.contact_tel) p.contact_tel = state.user.telephone || '';
  function tBtn(label, val, field) {
    var act = p[field] === val;
    return '<button onclick="_pubImmoField(\'' + field + '\',\'' + val + '\')" style="padding:7px 18px;border-radius:20px;border:1.5px solid ' + (act ? '#059669' : '#e2e8f0') + ';background:' + (act ? '#f0fdf4' : '#fff') + ';color:' + (act ? '#059669' : '#64748b') + ';font-size:13px;font-weight:' + (act ? '700' : '500') + ';cursor:pointer">' + label + '</button>';
  }
  var html = [
    '<p style="font-size:12px;color:#64748b;margin:0 0 12px">Votre annonce sera vérifiée avant publication.</p>',
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">',
      tBtn('🏠 Location', 'location', 'transaction'),
      tBtn('🔑 Vente',    'vente',    'transaction'),
    '</div>',
    '<label style="font-size:12px;font-weight:700;color:#64748b">Titre *</label>',
    '<input type="text" placeholder="ex: Appartement F3 meublé à Sacré-Cœur" value="' + (p.titre||'') + '" style="' + s + '" oninput="_pubImmo.titre=this.value">',
    '<label style="font-size:12px;font-weight:700;color:#64748b">Type de bien</label>',
    '<select style="' + s + '" onchange="_pubImmo.type_bien=this.value">',
      Object.keys(TYPE_BIEN_LABELS).map(function(k) {
        return '<option value="' + k + '"' + (p.type_bien === k ? ' selected' : '') + '>' + TYPE_BIEN_LABELS[k] + '</option>';
      }).join(''),
    '</select>',
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">',
      '<div><label style="font-size:12px;font-weight:700;color:#64748b">Ville</label>',
      '<input type="text" value="' + (p.ville||'Dakar') + '" style="' + s + '" oninput="_pubImmo.ville=this.value"></div>',
      '<div><label style="font-size:12px;font-weight:700;color:#64748b">Quartier</label>',
      '<input type="text" placeholder="ex: Sacré-Cœur" value="' + (p.quartier||'') + '" style="' + s + '" oninput="_pubImmo.quartier=this.value"></div>',
    '</div>',
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">',
      '<div><label style="font-size:12px;font-weight:700;color:#64748b">Prix (FCFA)</label>',
      '<input type="number" placeholder="ex: 150000" value="' + (p.prix||'') + '" style="' + s + '" oninput="_pubImmo.prix=this.value"></div>',
      '<div><label style="font-size:12px;font-weight:700;color:#64748b">Surface m²</label>',
      '<input type="number" value="' + (p.surface_m2||'') + '" style="' + s + '" oninput="_pubImmo.surface_m2=this.value"></div>',
      '<div><label style="font-size:12px;font-weight:700;color:#64748b">Chambres</label>',
      '<input type="number" value="' + (p.nb_chambres||'') + '" style="' + s + '" oninput="_pubImmo.nb_chambres=this.value"></div>',
    '</div>',
    '<label style="font-size:12px;font-weight:700;color:#64748b">Description</label>',
    '<textarea rows="3" style="' + s + ';resize:vertical" oninput="_pubImmo.description=this.value">' + (p.description||'') + '</textarea>',
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">',
      '<div><label style="font-size:12px;font-weight:700;color:#64748b">Votre nom</label>',
      '<input type="text" value="' + (p.contact_nom||'') + '" style="' + s + '" oninput="_pubImmo.contact_nom=this.value"></div>',
      '<div><label style="font-size:12px;font-weight:700;color:#64748b">Téléphone WhatsApp *</label>',
      '<input type="tel" placeholder="ex: 771234567" value="' + (p.contact_tel||'') + '" style="' + s + '" oninput="_pubImmo.contact_tel=this.value"></div>',
    '</div>',
    '<button onclick="envoyerPublierAnnonce()" style="width:100%;padding:12px;background:#059669;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:800;cursor:pointer;margin-top:4px">📢 Publier mon annonce</button>',
  ].join('');
  ouvrirModal('📢 Publier une annonce gratuite', html);
}

function _pubImmoField(field, val) {
  _pubImmo[field] = val;
  ouvrirPublierAnnonce();
}

async function envoyerPublierAnnonce() {
  var p = _pubImmo;
  if (!p.titre || !p.contact_tel) {
    toast('Titre et téléphone sont obligatoires', '#e63946');
    return;
  }
  try {
    await apiFetch('/immo/public', { method: 'POST', body: JSON.stringify(p) });
    fermerModal();
    toast('Annonce envoyée ! Elle sera visible après validation.', '#059669');
    _pubImmo = { titre:'', type_bien:'appartement', transaction:'location', prix:'', surface_m2:'', nb_pieces:'', nb_chambres:'', ville:'Dakar', quartier:'', description:'', contact_nom:'', contact_tel:'' };
  } catch(e) {
    toast(e.message || 'Erreur lors de la publication', '#e63946');
  }
}

// ── Publier une annonce depuis le menu compte ────────────────────
function depuisMenuPublierAnnonce() {
  if (state.user) {
    _pubImmo.contact_nom = _pubImmo.contact_nom || state.user.nom || '';
    _pubImmo.contact_tel = _pubImmo.contact_tel || state.user.telephone || '';
  }
  state.categorie = 'immo';
  chargerImmo(1);
  setTimeout(ouvrirPublierAnnonce, 300);
}

// ── Mes annonces (utilisateur connecté) ──────────────────────────
async function afficherMesAnnonces() {
  try {
    var annonces = await apiFetch('/immo/mine');
    if (!annonces.length) {
      ouvrirModal('📋 Mes annonces', '<p style="text-align:center;color:#64748b;padding:12px 0">Vous n\'avez publié aucune annonce.</p>');
      return;
    }
    var html = '<div style="display:flex;flex-direction:column;gap:10px">' +
      annonces.map(function(a) {
        var statut = a.actif
          ? '<span style="font-size:10px;font-weight:700;color:#059669;background:#f0fdf4;padding:2px 8px;border-radius:8px">✓ Publiée</span>'
          : '<span style="font-size:10px;font-weight:700;color:#f97316;background:#fff7ed;padding:2px 8px;border-radius:8px">⏳ En attente</span>';
        return '<div style="border:1.5px solid #e2e8f0;border-radius:12px;padding:12px;' + (a.actif ? 'cursor:pointer' : '') + '"' +
          (a.actif ? ' onclick="fermerModal();ouvrirImmo(\'' + a.id + '\')"' : '') + '>' +
          '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">' +
            '<div style="font-size:13px;font-weight:700;color:#1e293b">' + a.titre + '</div>' +
            statut +
          '</div>' +
          '<div style="font-size:11px;color:#64748b;margin-top:4px">' + (a.quartier || a.ville || '') + (a.prix ? ' · ' + fcfa(a.prix) : '') + '</div>' +
        '</div>';
      }).join('') +
    '</div>';
    ouvrirModal('📋 Mes annonces', html);
  } catch(e) {
    ouvrirModal('Erreur', '<p style="color:#e63946">' + e.message + '</p>');
  }
}

// ── Devenir partenaire ────────────────────────────────────────────
var _partenaire = { nom_entreprise:'', secteur:'', contact_nom:'', contact_tel:'', email:'', description:'' };

function ouvrirDevenirPartenaire() {
  if (!state.user) {
    toast('Connectez-vous pour devenir partenaire', '#f97316');
    openLoginModal();
    return;
  }
  var s = 'width:100%;padding:9px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;margin-bottom:10px;outline:none;box-sizing:border-box';
  var p = _partenaire;
  if (!p.contact_nom) p.contact_nom = state.user.nom || '';
  if (!p.email)       p.email       = state.user.email || '';
  var html =
    '<input style="' + s + '" placeholder="Nom de l\'entreprise / boutique *" value="' + p.nom_entreprise + '" oninput="_partenaireField(\'nom_entreprise\',this.value)">' +
    '<input style="' + s + '" placeholder="Secteur (ex: électronique, mode, immobilier…)" value="' + p.secteur + '" oninput="_partenaireField(\'secteur\',this.value)">' +
    '<input style="' + s + '" placeholder="Nom du contact" value="' + p.contact_nom + '" oninput="_partenaireField(\'contact_nom\',this.value)">' +
    '<input style="' + s + '" placeholder="Téléphone" value="' + p.contact_tel + '" oninput="_partenaireField(\'contact_tel\',this.value)">' +
    '<input style="' + s + '" placeholder="Email *" value="' + p.email + '" oninput="_partenaireField(\'email\',this.value)">' +
    '<textarea style="' + s + ';min-height:80px;resize:vertical" placeholder="Description de votre activité" oninput="_partenaireField(\'description\',this.value)">' + p.description + '</textarea>' +
    '<button onclick="envoyerDevenirPartenaire()" style="width:100%;padding:12px;background:#059669;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">Envoyer ma demande</button>';
  ouvrirModal('🤝 Devenir partenaire', html);
}

function _partenaireField(field, val) { _partenaire[field] = val; }

async function envoyerDevenirPartenaire() {
  var p = _partenaire;
  if (!p.nom_entreprise || !p.email) {
    toast('Nom de l\'entreprise et email sont obligatoires', '#e63946');
    return;
  }
  try {
    await apiFetch('/partenaires', { method: 'POST', body: JSON.stringify(p) });
    fermerModal();
    toast('Demande envoyée ! Nous vous contacterons bientôt.', '#059669');
    _partenaire = { nom_entreprise:'', secteur:'', contact_nom:'', contact_tel:'', email:'', description:'' };
  } catch(e) {
    toast(e.message || 'Erreur lors de l\'envoi', '#e63946');
  }
}

// ── Scoring & recommandations immo ──────────────────────────────
// Score 0→∞ : meilleur rapport surface/prix + bonus complétude
function _scoreImmo(a) {
  var s = 0;
  // Rapport m²/FCFA (principal) — plus c'est élevé, meilleur le rapport
  if (a.prix && a.surface_m2) s += (a.surface_m2 / a.prix) * 1000000;
  // Bonus complétude : photo, surface, chambres, description
  if (a.photos && a.photos.length) s += 0.3;
  if (a.surface_m2)   s += 0.2;
  if (a.nb_chambres)  s += 0.1;
  if (a.nb_pieces)    s += 0.1;
  if (a.description)  s += 0.1;
  // Bonus si prix dans la fourchette de l'utilisateur
  var im = _immoState;
  if (a.prix && im.prixMax && a.prix <= parseFloat(im.prixMax)) s += 0.3;
  if (a.prix && im.prixMin && a.prix >= parseFloat(im.prixMin)) s += 0.1;
  return s;
}

// Calcule les recommandations : meilleure annonce par ville (ou type si ville fixée)
function _recommandationsImmo(annonces) {
  var im = _immoState;
  var ids = {};
  // Grouper par ville, garder le mieux scoré dans chaque ville
  var parVille = {};
  annonces.forEach(function(a) {
    var key = im.ville ? (a.type_bien || 'autre') : (a.ville || 'Dakar');
    var sc  = _scoreImmo(a);
    if (!parVille[key] || sc > parVille[key].score) {
      parVille[key] = { a: a, score: sc };
    }
  });
  // Prendre les 4 meilleurs groupes seulement
  var groupes = Object.keys(parVille)
    .sort(function(ka, kb) { return parVille[kb].score - parVille[ka].score; })
    .slice(0, 4);
  groupes.forEach(function(k) { ids[parVille[k].a.id] = true; });
  return { ids: ids, bests: groupes.map(function(k) { return parVille[k].a; }) };
}

// ── Template principal immo ──────────────────────────────────────
function templateImmo(annonces, data) {
  var nb = data.total || 0;
  var labelTx = _immoState.transaction === 'vente' ? 'Vente' : 'Location';

  // Recommandations (seulement si on a assez d'annonces et page 1)
  var rec = (annonces.length >= 4) ? _recommandationsImmo(annonces) : { ids: {}, bests: [] };
  _immoState._recIds = rec.ids;  // utilisé par carteImmoHTML via _immoState

  var reste = annonces.filter(function(a) { return !rec.ids[a.id]; });

  var secRec = '';
  if (rec.bests.length >= 2) {
    // Injecter le badge dans les cartes recommandées
    var oldIds = _immoState._recIds;
    secRec = [
      '<div style="padding:0 5% 4px">',
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">',
          '<span style="font-size:18px">🏆</span>',
          '<span style="font-size:14px;font-weight:800;color:#1e293b">Nos coups de cœur</span>',
          '<span style="font-size:11px;color:#94a3b8;background:#f1f5f9;padding:2px 8px;border-radius:8px">Meilleur rapport qualité/prix</span>',
        '</div>',
        '<div class="pgrid pgrid-recommandes">' + rec.bests.map(function(a) {
          // Ajouter badge recommandé temporairement
          var orig = a._rec;
          a._rec = true;
          var html = carteImmoRecoHTML(a);
          a._rec = orig;
          return html;
        }).join('') + '</div>',
      '</div>',
      reste.length ? '<div style="padding:4px 5% 2px;border-top:1px solid #f1f5f9;margin-top:8px"><span style="font-size:12px;font-weight:700;color:#64748b">Toutes les annonces</span> <span style="font-size:11px;color:#94a3b8">(' + nb + ')</span></div>' : '',
    ].join('');
  }

  return [
    htmlHero(),
    htmlBarreImmo(),
    '<section class="products">',
      nb > 0 && !secRec ? '<p style="font-size:12px;color:#94a3b8;padding:4px 5% 10px">' + nb + ' annonce(s) — ' + labelTx + '</p>' : '',
      annonces.length ? [
        secRec,
        '<div class="pgrid">' + (secRec ? reste : annonces).map(carteImmoHTML).join('') + '</div>',
      ].join('') : '<div style="text-align:center;padding:48px 20px;color:#64748b"><div style="font-size:52px;margin-bottom:12px">🏡</div><h3>Aucune annonce trouvée</h3><p style="font-size:13px">Essayez de changer les filtres.</p></div>',
      data.page < data.pages ? _btnPlusImmo(data) : (nb > 24 ? '<p id="fin-liste" style="text-align:center;padding:16px;color:#94a3b8;font-size:13px">✅ ' + nb + ' annonces affichées</p>' : ''),
    '</section>',
    htmlFooter(),
  ].join('');
}

// Carte recommandée : même que carteImmoHTML mais avec badge 🏆
function carteImmoRecoHTML(a) {
  var photo   = (a.photos && a.photos.length) ? a.photos[0] : null;
  var infos   = [];
  if (a.surface_m2)  infos.push('📐 ' + a.surface_m2 + ' m²');
  if (a.nb_pieces)   infos.push('🚪 ' + a.nb_pieces + ' p.');
  if (a.nb_chambres) infos.push('🛏 ' + a.nb_chambres + ' ch.');
  var prixM2  = (a.prix && a.surface_m2) ? Math.round(a.prix / a.surface_m2) : null;
  var inCmp   = _immoState.compare.some(function(x) { return x.id === a.id; });
  return [
    '<div class="pcard immo best-choice' + (inCmp ? ' immo-selected' : '') + '" onclick="ouvrirImmo(\'' + a.id + '\')">',
      '<div class="pbadge-eco" style="background:#059669">🏆 Recommandé</div>',
      '<div class="pimg" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);position:relative">',
        photo
          ? '<img src="' + photo + '" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\'">'
          : '<span style="font-size:40px">' + _immoIcon(a.type_bien) + '</span>',
        '<div style="position:absolute;top:8px;left:8px;display:flex;gap:4px;flex-wrap:wrap">',
          '<span style="font-size:10px;font-weight:700;color:#fff;background:' + (a.transaction === 'vente' ? '#7c3aed' : '#059669') + ';padding:2px 7px;border-radius:6px">' + (a.transaction === 'vente' ? 'Vente' : 'Location') + '</span>',
          '<span style="font-size:10px;font-weight:700;color:#1e293b;background:rgba(255,255,255,.85);padding:2px 7px;border-radius:6px">' + (TYPE_BIEN_LABELS[a.type_bien] || a.type_bien || '') + '</span>',
        '</div>',
        '<button onclick="event.stopPropagation();_immoToggleCompare(' + JSON.stringify(a).replace(/'/g,"\\'") + ')" ' +
          'style="position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;border:2px solid ' + (inCmp ? '#059669' : 'rgba(255,255,255,.8)') + ';background:' + (inCmp ? '#059669' : 'rgba(255,255,255,.85)') + ';color:' + (inCmp ? '#fff' : '#475569') + ';font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700">'+( inCmp?'✓':'+')+'</button>',
      '</div>',
      '<div class="pbody">',
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px">',
          '<div style="font-size:11px;color:#64748b">' + (a.quartier || a.ville || '') + '</div>',
          _sourceBadge(a.source),
        '</div>',
        '<div class="pname" style="font-size:13px">' + (a.titre || '') + '</div>',
        infos.length ? '<div style="display:flex;flex-wrap:wrap;gap:4px;margin:5px 0;font-size:11px;color:#475569">' + infos.join(' · ') + (prixM2 ? ' · <span style="color:#059669;font-weight:700">' + fcfa(prixM2) + '/m²</span>' : '') + '</div>' : '',
        a.prix
          ? '<div class="pprice" style="color:#059669">' + fcfa(a.prix) + (a.transaction === 'location' ? '<span style="font-size:11px;font-weight:400;color:#64748b">/mois</span>' : '') + '</div>'
          : '<div class="pprice" style="color:#94a3b8">Prix à négocier</div>',
        '<button class="btn-voir" style="width:100%;margin-top:8px" onclick="event.stopPropagation();ouvrirImmo(\'' + a.id + '\')">Voir détail →</button>',
      '</div>',
    '</div>',
  ].join('');
}

function _btnPlusImmo(data) {
  var restant = Math.max(0, data.total - data.page * data.limit);
  return '<div id="btn-plus-immo" style="text-align:center;padding:20px">' +
    '<button onclick="chargerImmo(' + (data.page + 1) + ')" ' +
      'style="padding:12px 36px;background:#059669;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">' +
      '⬇ Voir plus (' + restant + ' annonces)' +
    '</button>' +
  '</div>';
}

// ── Chargement ───────────────────────────────────────────────────
function chargerImmo(page) {
  page = page || 1;
  state.page = page;
  state.currentPage = 'home';
  var im = _immoState;

  if (page === 1) render('<div class="loader"><div class="spin"></div><p>Chargement des annonces…</p></div>');
  else {
    var s = document.querySelector('.products');
    if (s) { var sp = document.createElement('div'); sp.id = 'sp-immo'; sp.className = 'loader'; sp.innerHTML = '<div class="spin"></div>'; s.appendChild(sp); }
  }

  var params = new URLSearchParams({
    transaction: im.transaction,
    ville:       im.ville      || '',
    quartier:    im.quartier   || '',
    type_bien:   im.type_bien  || '',
    prixMin:     im.prixMin    || '',
    prixMax:     im.prixMax    || '',
    surfaceMin:  im.surfaceMin || '',
    nbPieces:    im.nbPieces   || '',
    tri:         im.tri        || 'recent',
    limit: 24, page: page,
  });

  var pAnnonces = apiFetch('/immo?' + params.toString());
  var pVilles   = im.villes
    ? Promise.resolve(im.villes)
    : apiFetch('/immo/villes').catch(function() { return []; });

  Promise.all([pAnnonces, pVilles])
    .then(function(res) {
      var data     = res[0];
      if (!im.villes) im.villes = Array.isArray(res[1]) ? res[1] : [];
      var annonces = (data && Array.isArray(data.annonces)) ? data.annonces : [];

      if (page === 1) {
        render(templateImmo(annonces, data));
        setTimeout(function() { setupAutocomplete('search-input'); }, 50);
      } else {
        var sp2 = document.getElementById('sp-immo'); if (sp2) sp2.remove();
        var oldBtn = document.getElementById('btn-plus-immo'); if (oldBtn) oldBtn.remove();
        var finMsg = document.getElementById('fin-liste'); if (finMsg) finMsg.remove();
        var grid = document.querySelector('.pgrid');
        if (grid) { var tmp = document.createElement('div'); tmp.innerHTML = annonces.map(carteImmoHTML).join(''); while (tmp.firstChild) grid.appendChild(tmp.firstChild); }
        var s2 = document.querySelector('.products');
        if (s2) s2.insertAdjacentHTML('beforeend', data.page < data.pages ? _btnPlusImmo(data) : '<p id="fin-liste" style="text-align:center;padding:16px;color:#94a3b8;font-size:13px">✅ ' + data.total + ' annonces affichées</p>');
      }
    })
    .catch(function(err) {
      dbgErr('chargerImmo', err);
      if (page === 1) renderErreur(err);
    });
}

// ── Détail annonce immo ──────────────────────────────────────────
async function ouvrirImmo(id) {
  try {
    render('<div class="loader"><div class="spin"></div><p>Chargement…</p></div>');
    var a = await apiFetch('/immo/' + id);
    var photos = Array.isArray(a.photos) ? a.photos : (typeof a.photos === 'string' ? JSON.parse(a.photos) : []);
    var infos = [
      a.surface_m2  ? ['📐 Surface',    a.surface_m2 + ' m²'] : null,
      a.nb_pieces   ? ['🚪 Pièces',     a.nb_pieces + ''] : null,
      a.nb_chambres ? ['🛏 Chambres',   a.nb_chambres + ''] : null,
      a.ville       ? ['📍 Ville',      a.ville] : null,
      a.quartier    ? ['🗺 Quartier',   a.quartier] : null,
      ['🏷 Type',   TYPE_BIEN_LABELS[a.type_bien] || a.type_bien || '—'],
    ].filter(Boolean);

    render([
      htmlHero(),
      '<div style="max-width:760px;margin:0 auto;padding:16px 5% 40px">',
        '<button onclick="chargerImmo(1)" style="background:none;border:none;color:#059669;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:16px">← Retour</button>',

        // Galerie photos
        photos.length ? [
          '<div style="border-radius:14px;overflow:hidden;margin-bottom:16px;background:#f1f5f9;max-height:320px">',
            '<img src="' + photos[0] + '" style="width:100%;max-height:320px;object-fit:cover" onerror="this.style.display=\'none\'">',
          '</div>',
          photos.length > 1 ? '<div style="display:flex;gap:8px;overflow-x:auto;margin-bottom:16px">' +
            photos.slice(1, 6).map(function(p) {
              return '<img src="' + p + '" style="height:72px;width:100px;object-fit:cover;border-radius:8px;flex-shrink:0" onerror="this.style.display=\'none\'">';
            }).join('') + '</div>' : '',
        ].join('') : '<div style="height:180px;border-radius:14px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);display:flex;align-items:center;justify-content:center;font-size:64px;margin-bottom:16px">' + _immoIcon(a.type_bien) + '</div>',

        // Titre + badges
        '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;flex-wrap:wrap">',
          '<span style="font-size:11px;font-weight:700;color:#fff;background:' + (a.transaction === 'vente' ? '#7c3aed' : '#059669') + ';padding:3px 9px;border-radius:8px">' + (a.transaction === 'vente' ? 'Vente' : 'Location') + '</span>',
          '<span style="font-size:11px;font-weight:700;color:#1e293b;background:#f1f5f9;padding:3px 9px;border-radius:8px">' + (TYPE_BIEN_LABELS[a.type_bien] || a.type_bien || '') + '</span>',
          _sourceBadge(a.source),
        '</div>',
        '<h2 style="font-size:18px;font-weight:800;color:#1e293b;margin:0 0 12px">' + a.titre + '</h2>',

        // Prix
        a.prix ? '<div style="font-size:26px;font-weight:900;color:#059669;margin-bottom:16px">' + fcfa(a.prix) + (a.transaction === 'location' ? '<span style="font-size:14px;font-weight:400;color:#64748b"> / mois</span>' : '') + '</div>' : '<div style="font-size:16px;color:#94a3b8;margin-bottom:16px">Prix à négocier</div>',

        // Infos
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:20px">',
          infos.map(function(row) {
            return '<div style="background:#f8fafc;border-radius:10px;padding:10px 14px">' +
              '<div style="font-size:11px;color:#94a3b8;margin-bottom:2px">' + row[0] + '</div>' +
              '<div style="font-size:14px;font-weight:700;color:#1e293b">' + row[1] + '</div>' +
            '</div>';
          }).join(''),
        '</div>',

        // Description
        a.description ? '<div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:20px">' +
          '<div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:8px">📝 Description</div>' +
          '<p style="font-size:13px;color:#334155;line-height:1.6;white-space:pre-line;margin:0">' + a.description + '</p>' +
        '</div>' : '',

        // CTA
        a.contact_tel ? '<a href="https://wa.me/' + a.contact_tel.replace(/[^0-9]/g, '') + '" target="_blank" rel="noopener" ' +
          'style="display:block;text-align:center;padding:14px;background:#25d366;color:#fff;border-radius:12px;font-size:15px;font-weight:800;text-decoration:none;margin-bottom:10px">💬 Contacter ' + (a.contact_nom ? a.contact_nom : 'le propriétaire') + ' (WhatsApp)</a>' : '',
        a.url_source ? '<a href="' + a.url_source + '" target="_blank" rel="noopener" ' +
          'style="display:block;text-align:center;padding:14px;background:#059669;color:#fff;border-radius:12px;font-size:15px;font-weight:800;text-decoration:none">Voir l\'annonce originale →</a>' : '',
      '</div>',
      htmlFooter(),
    ].join(''));
  } catch (err) {
    renderErreur(err);
  }
}

function toggleComparerForfait(id) {
  var idx = state.comparerForfaits.indexOf(id);
  if (idx !== -1) {
    state.comparerForfaits.splice(idx, 1);
  } else {
    if (state.comparerForfaits.length >= 4) {
      toast('Maximum 4 forfaits à comparer', '#f97316'); return;
    }
    state.comparerForfaits.push(id);
  }
  chargerForfaits(state.page);
}

function viderComparaisonForfaits() {
  state.comparerForfaits = [];
  chargerForfaits(state.page);
}

function changerProfilTelecom(profil) {
  state.telecomProfil = profil;
  // Mise à jour des onglets dans la modale si ouverte
  ['internet', 'appel', 'mixte'].forEach(function(p) {
    var btn = document.getElementById('profil-tab-' + p);
    if (btn) {
      btn.style.background  = p === profil ? '#f97316' : '#fff';
      btn.style.color       = p === profil ? '#fff'    : '#64748b';
      btn.style.borderColor = p === profil ? '#f97316' : '#e2e8f0';
      btn.style.fontWeight  = p === profil ? '700'     : '500';
    }
  });
  // Re-rendre le contenu de la modale avec le nouveau profil
  _renderComparaisonContent();
}

function _barHtml(val, maxVal, couleur) {
  var pct = (maxVal > 0 && val > 0) ? Math.round((val / maxVal) * 100) : 0;
  return '<div style="height:6px;border-radius:3px;background:#e2e8f0;margin-top:3px;overflow:hidden">' +
    '<div style="height:100%;width:' + pct + '%;background:' + couleur + ';border-radius:3px;transition:width .4s"></div>' +
  '</div>';
}

function _renderComparaisonContent() {
  var forfaits = state.comparerForfaits.map(function(id) { return state.forfaitCache[id]; }).filter(Boolean);
  var profil   = state.telecomProfil || 'mixte';

  // ── Scoring ───────────────────────────────────────────────────
  var scores   = forfaits.map(function(f) { return _scoreForfait(f, profil); });
  var scoreMax = Math.max.apply(null, scores);
  var bestIdx  = scores.indexOf(scoreMax);
  var bestId   = forfaits[bestIdx] ? forfaits[bestIdx].id : null;

  // ── Métriques pour highlight ──────────────────────────────────
  var prixMin    = Math.min.apply(null, forfaits.map(function(f){ return f.prix; }));
  var dataMax    = Math.max.apply(null, forfaits.map(function(f){ return f.data_mo || 0; }));
  var minutesMax = Math.max.apply(null, forfaits.map(function(f){ return f.minutes || 0; }));
  var jouMax     = Math.max.apply(null, forfaits.map(function(f){ return f.validite_jours || 0; }));

  function prixParGo(f)  { return (f.data_mo  && f.data_mo  > 0) ? Math.round(f.prix / (f.data_mo / 1000)) : null; }
  function prixParMin(f) { return (f.minutes  && f.minutes  > 0) ? (f.prix / f.minutes).toFixed(1)         : null; }
  function prixParJour(f){ return (f.validite_jours && f.validite_jours > 0) ? Math.round(f.prix / f.validite_jours) : null; }

  var prixGoList  = forfaits.map(prixParGo).filter(function(v){ return v !== null; });
  var prixGoMin   = prixGoList.length ? Math.min.apply(null, prixGoList)  : Infinity;
  var prixMinList = forfaits.map(prixParMin).filter(function(v){ return v !== null; });
  var prixMinMin  = prixMinList.length ? Math.min.apply(null, prixMinList.map(Number)) : Infinity;
  var prixJList   = forfaits.map(prixParJour).filter(function(v){ return v !== null; });
  var prixJMin    = prixJList.length ? Math.min.apply(null, prixJList) : Infinity;

  // ── Colonnes ─────────────────────────────────────────────────
  var cols = forfaits.map(function(f, idx) {
    return {
      f:     f,
      score: scores[idx],
      isBest: f.id === bestId,
      pg:    prixParGo(f),
      pm:    prixParMin(f),
      pj:    prixParJour(f),
      dataLabel: _dataLabel(f.data_mo),
    };
  });

  // ── Onglets profil ───────────────────────────────────────────
  function tabBtn(p, label) {
    var act = p === profil;
    return '<button id="profil-tab-' + p + '" onclick="changerProfilTelecom(\'' + p + '\')" ' +
      'style="padding:6px 16px;border-radius:20px;border:1.5px solid ' + (act ? '#f97316' : '#e2e8f0') + ';' +
      'background:' + (act ? '#f97316' : '#fff') + ';color:' + (act ? '#fff' : '#64748b') + ';' +
      'font-weight:' + (act ? '700' : '500') + ';font-size:12px;cursor:pointer">' + label + '</button>';
  }
  var profilTabs = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
    '<span style="font-size:12px;color:#64748b;font-weight:600">Mon profil :</span>' +
    tabBtn('internet', '🌐 Internet') + tabBtn('appel', '📞 Appels') + tabBtn('mixte', '🔀 Mixte') +
    '<span style="font-size:11px;color:#94a3b8;margin-left:4px">— influence le score Recommandé</span>' +
  '</div>';

  // ── Header colonnes ──────────────────────────────────────────
  var thStyle      = 'padding:12px 10px;text-align:center;border-bottom:2px solid #e2e8f0;min-width:110px';
  var thBestStyle  = 'padding:12px 10px;text-align:center;border-bottom:2px solid #10b981;min-width:110px;background:#f0fdf4';
  var labelStyle   = 'font-weight:600;color:#475569;font-size:12px;white-space:nowrap;padding:10px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;vertical-align:middle';

  var headerRow = '<tr>' +
    '<th style="' + labelStyle + '"></th>' +
    cols.map(function(c) {
      var th = c.isBest ? thBestStyle : thStyle;
      return '<th style="' + th + '">' +
        (c.isBest ? '<div style="font-size:10px;font-weight:700;color:#10b981;letter-spacing:.04em;margin-bottom:4px">🏆 MEILLEUR CHOIX</div>' : '') +
        (c.f.image_url ? '<img src="' + c.f.image_url + '" style="height:28px;object-fit:contain;margin-bottom:4px"><br>' : '') +
        '<span style="font-size:11px;font-weight:700;color:#f97316">' + c.f.operateur + '</span><br>' +
        '<span style="font-size:12px;font-weight:600;color:#1e293b">' + c.f.nom + '</span>' +
      '</th>';
    }).join('') +
  '</tr>';

  // ── Ligne utilitaire ─────────────────────────────────────────
  function row(label, fn) {
    return '<tr><td style="' + labelStyle + '">' + label + '</td>' +
      cols.map(function(c) {
        var r = fn(c);
        var bg = c.isBest ? 'background:#f0fdf4;' : '';
        var hl = r.hl ? 'color:#10b981;font-weight:800;' : '';
        return '<td style="text-align:center;padding:10px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;' + bg + hl + '">' +
          r.v + (r.bar || '') + '</td>';
      }).join('') +
    '</tr>';
  }

  var tableHtml = [
    '<div style="overflow-x:auto">',
    '<table style="width:100%;border-collapse:collapse">',
      '<thead>' + headerRow + '</thead>',
      '<tbody>',
        row('💰 Prix', function(c) {
          return { v: fcfa(c.f.prix), hl: c.f.prix === prixMin };
        }),
        row('📅 Prix / jour', function(c) {
          var v = c.pj !== null ? fcfa(c.pj) + '/j' : '—';
          return { v: v, hl: c.pj !== null && c.pj === prixJMin };
        }),
        row('📶 Data', function(c) {
          var v = c.dataLabel || '—';
          var bar = (dataMax > 0 && c.f.data_mo) ? _barHtml(c.f.data_mo, dataMax, '#3b82f6') : '';
          return { v: v, hl: c.f.data_mo === dataMax && dataMax > 0, bar: bar };
        }),
        row('📞 Voix incluse', function(c) {
          var v = c.f.minutes ? c.f.minutes + ' min' : '—';
          var bar = (minutesMax > 0 && c.f.minutes) ? _barHtml(c.f.minutes, minutesMax, '#10b981') : '';
          return { v: v, hl: c.f.minutes === minutesMax && minutesMax > 0, bar: bar };
        }),
        row('✉ SMS inclus', function(c) {
          return { v: c.f.sms ? c.f.sms + ' SMS' : '—', hl: false };
        }),
        row('⏳ Validité', function(c) {
          return { v: c.f.validite_jours ? c.f.validite_jours + ' j' : '—', hl: c.f.validite_jours === jouMax && jouMax > 0 };
        }),
        row('📊 Prix / Go', function(c) {
          return { v: c.pg !== null ? fcfa(c.pg) + '/Go' : '—', hl: c.pg !== null && c.pg === prixGoMin };
        }),
        row('📊 Prix / min', function(c) {
          return { v: c.pm !== null ? c.pm + ' F/min' : '—', hl: c.pm !== null && Number(c.pm) === prixMinMin };
        }),
      '</tbody>',
    '</table>',
    '</div>',
  ].join('');

  // ── Verdict adapté au profil ──────────────────────────────────
  var winner = forfaits[bestIdx];
  var profilLabel = profil === 'internet' ? '🌐 Internet' : profil === 'appel' ? '📞 Appels' : '🔀 Mixte';
  var meilleurPrix = forfaits.reduce(function(a,b){ return a.prix < b.prix ? a : b; });
  var meilleurData = dataMax > 0 ? forfaits.reduce(function(a,b){ return (a.data_mo||0) > (b.data_mo||0) ? a : b; }) : null;

  var verdictLines = [
    '<div style="padding:16px 20px;background:#f0fdf4;border-top:2px solid #bbf7d0">',
      '<div style="font-size:13px;font-weight:700;color:#166534;margin-bottom:10px">🏆 Verdict — profil ' + profilLabel + '</div>',
      winner ? '<div style="font-size:13px;color:#166534;margin-bottom:6px">✅ <strong>Meilleur choix global :</strong> ' + winner.operateur + ' — ' + winner.nom + ' (' + fcfa(winner.prix) + ')</div>' : '',
      '<div style="font-size:13px;color:#166534;margin-bottom:4px">💰 <strong>Moins cher :</strong> ' + meilleurPrix.operateur + ' — ' + meilleurPrix.nom + ' (' + fcfa(meilleurPrix.prix) + ')</div>',
      meilleurData ? '<div style="font-size:13px;color:#166534;margin-bottom:4px">📶 <strong>Plus de data :</strong> ' + meilleurData.operateur + ' — ' + meilleurData.nom + ' (' + _dataLabel(meilleurData.data_mo) + ')</div>' : '',
      (prixGoMin && prixGoMin !== Infinity) ? '<div style="font-size:13px;color:#166534">📊 <strong>Meilleur rapport data/prix :</strong> ' + fcfa(prixGoMin) + '/Go</div>' : '',
    '</div>',
  ].join('');

  // ── Injection dans la modale ──────────────────────────────────
  var conteneur = document.getElementById('cmp-content');
  if (conteneur) {
    conteneur.innerHTML = profilTabs + tableHtml + verdictLines;
  }
}

function ouvrirComparaisonForfaits() {
  var forfaits = state.comparerForfaits.map(function(id) { return state.forfaitCache[id]; }).filter(Boolean);
  if (forfaits.length < 2) { toast('Sélectionnez au moins 2 forfaits à comparer', '#f97316'); return; }

  var modal = document.getElementById('modal-comparaison-forfaits');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-comparaison-forfaits';
    document.body.appendChild(modal);
  }
  modal.innerHTML = [
    '<div style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;display:flex;align-items:flex-start;justify-content:center;padding:24px 12px;overflow-y:auto">',
      '<div style="background:#fff;border-radius:14px;max-width:900px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden">',
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:#fff7ed;border-bottom:1px solid #fed7aa">',
          '<span style="font-size:15px;font-weight:700;color:#1e293b">⚖ Comparaison intelligente — forfaits télécom</span>',
          '<button onclick="fermerComparaisonForfaits()" style="padding:6px 12px;background:none;border:1px solid #e2e8f0;border-radius:8px;font-size:20px;cursor:pointer;color:#64748b">✕</button>',
        '</div>',
        '<div style="padding:14px 20px 0;background:#fafafa;border-bottom:1px solid #e2e8f0" id="cmp-profil-bar"></div>',
        '<div id="cmp-content" style="overflow:hidden"></div>',
      '</div>',
    '</div>',
  ].join('');
  modal.style.display = 'block';
  modal.onclick = function(e) { if (e.target === modal.firstChild) fermerComparaisonForfaits(); };

  _renderComparaisonContent();
}

function fermerComparaisonForfaits() {
  var modal = document.getElementById('modal-comparaison-forfaits');
  if (modal) modal.style.display = 'none';
}

// ── Assistant "Trouver mon forfait" ───────────────────────────

function ouvrirWizardForfait() {
  var w = state.wizardForfait;
  var modal = document.getElementById('modal-wizard-forfait');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-wizard-forfait';
    document.body.appendChild(modal);
  }
  modal.innerHTML = _wizardFormHtml(w);
  modal.style.display = 'block';
  modal.onclick = function(e) { if (e.target === modal.firstChild) fermerWizardForfait(); };
}

function fermerWizardForfait() {
  var modal = document.getElementById('modal-wizard-forfait');
  if (modal) modal.style.display = 'none';
}

function _wizardFormHtml(w) {
  function pBtn(p, label, couleur) {
    var act = (w.profil === p);
    return '<button type="button" onclick="_wzProfil(\'' + p + '\')" id="wz-p-' + p + '" ' +
      'style="flex:1;padding:14px 8px;border-radius:10px;border:2px solid ' + (act ? couleur : '#e2e8f0') + ';' +
      'background:' + (act ? couleur : '#fff') + ';color:' + (act ? '#fff' : '#475569') + ';' +
      'font-weight:' + (act ? '700' : '500') + ';font-size:13px;cursor:pointer;transition:all .15s">' + label + '</button>';
  }
  return [
    '<div style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1001;display:flex;align-items:flex-start;justify-content:center;padding:24px 12px;overflow-y:auto">',
      '<div style="background:#fff;border-radius:16px;max-width:480px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,.28);overflow:hidden">',

        // En-tête
        '<div style="padding:20px 24px 16px;background:linear-gradient(135deg,#1e3a8a,#3b82f6)">',
          '<div style="display:flex;align-items:center;justify-content:space-between">',
            '<div>',
              '<div style="font-size:18px;font-weight:800;color:#fff">🎯 Trouvez votre forfait idéal</div>',
              '<div style="font-size:12px;color:#bfdbfe;margin-top:2px">Décrivez vos besoins, on s\'occupe du reste</div>',
            '</div>',
            '<button onclick="fermerWizardForfait()" style="background:rgba(255,255,255,.2);border:none;border-radius:8px;padding:6px 10px;color:#fff;font-size:18px;cursor:pointer">✕</button>',
          '</div>',
        '</div>',

        // Formulaire
        '<div style="padding:24px" id="wz-form">',

          // Budget
          '<div style="margin-bottom:20px">',
            '<label style="display:block;font-size:13px;font-weight:700;color:#1e293b;margin-bottom:8px">💰 Votre budget maximum</label>',
            '<div style="display:flex;align-items:center;gap:8px">',
              '<input id="wz-budget" type="number" min="100" step="100" placeholder="ex: 3000" value="' + (w.budget || '') + '" ' +
                'oninput="state.wizardForfait.budget=this.value" ' +
                'style="flex:1;padding:10px 14px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;outline:none" ' +
                'onfocus="this.style.borderColor=\'#3b82f6\'" onblur="this.style.borderColor=\'#e2e8f0\'">',
              '<span style="font-size:13px;font-weight:600;color:#64748b;white-space:nowrap">FCFA</span>',
            '</div>',
            '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">',
              [1000,2000,3000,5000,10000].map(function(v) {
                return '<button type="button" onclick="document.getElementById(\'wz-budget\').value=' + v + ';state.wizardForfait.budget=' + v + '" ' +
                  'style="padding:4px 10px;border-radius:14px;border:1px solid #e2e8f0;background:#f8fafc;font-size:11px;color:#475569;cursor:pointer">' +
                  v.toLocaleString() + ' F</button>';
              }).join(''),
            '</div>',
          '</div>',

          // Profil usage
          '<div style="margin-bottom:20px">',
            '<label style="display:block;font-size:13px;font-weight:700;color:#1e293b;margin-bottom:8px">📱 Votre usage principal</label>',
            '<div style="display:flex;gap:8px">',
              pBtn('internet', '🌐 Internet', '#2563eb'),
              pBtn('appel',    '📞 Appels',   '#10b981'),
              pBtn('mixte',    '🔀 Mixte',    '#f97316'),
            '</div>',
          '</div>',

          // Critères optionnels
          '<div style="margin-bottom:20px">',
            '<label style="display:block;font-size:13px;font-weight:700;color:#1e293b;margin-bottom:8px">⚙️ Critères minimum <span style="font-weight:400;color:#94a3b8">(optionnel)</span></label>',
            '<div style="display:flex;gap:10px;flex-wrap:wrap">',
              '<div style="flex:1;min-width:140px">',
                '<div style="font-size:11px;color:#64748b;margin-bottom:4px">📶 Data minimale (Mo)</div>',
                '<input id="wz-data" type="number" min="0" step="100" placeholder="ex: 1000" value="' + (w.dataMin || '') + '" ' +
                  'oninput="state.wizardForfait.dataMin=this.value" ' +
                  'style="width:100%;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;box-sizing:border-box;outline:none" ' +
                  'onfocus="this.style.borderColor=\'#3b82f6\'" onblur="this.style.borderColor=\'#e2e8f0\'">',
              '</div>',
              '<div style="flex:1;min-width:140px">',
                '<div style="font-size:11px;color:#64748b;margin-bottom:4px">📞 Minutes minimales</div>',
                '<input id="wz-min" type="number" min="0" step="10" placeholder="ex: 30" value="' + (w.minutesMin || '') + '" ' +
                  'oninput="state.wizardForfait.minutesMin=this.value" ' +
                  'style="width:100%;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;box-sizing:border-box;outline:none" ' +
                  'onfocus="this.style.borderColor=\'#3b82f6\'" onblur="this.style.borderColor=\'#e2e8f0\'">',
              '</div>',
            '</div>',
          '</div>',

          // Bouton lancer
          '<button onclick="lancerRechercheWizard()" ' +
            'style="width:100%;padding:14px;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#fff;border:none;border-radius:12px;' +
            'font-size:15px;font-weight:800;cursor:pointer;letter-spacing:.02em">',
            '🔍 Trouver les meilleurs forfaits',
          '</button>',
        '</div>',

        // Zone résultats (remplie dynamiquement)
        '<div id="wz-results"></div>',
      '</div>',
    '</div>',
  ].join('');
}

function _wzProfil(p) {
  state.wizardForfait.profil = p;
  var colors = { internet: '#2563eb', appel: '#10b981', mixte: '#f97316' };
  ['internet', 'appel', 'mixte'].forEach(function(x) {
    var btn = document.getElementById('wz-p-' + x);
    if (!btn) return;
    var act = x === p;
    btn.style.background  = act ? colors[x] : '#fff';
    btn.style.color       = act ? '#fff'     : '#475569';
    btn.style.borderColor = act ? colors[x] : '#e2e8f0';
    btn.style.fontWeight  = act ? '700'      : '500';
  });
}

function lancerRechercheWizard() {
  var w = state.wizardForfait;
  var budget    = parseFloat(document.getElementById('wz-budget')?.value || w.budget || 0);
  var dataMin   = parseInt(document.getElementById('wz-data')?.value   || w.dataMin   || 0, 10);
  var minutesMin= parseInt(document.getElementById('wz-min')?.value    || w.minutesMin|| 0, 10);
  var profil    = w.profil || 'mixte';

  if (!budget || budget <= 0) {
    document.getElementById('wz-budget').style.borderColor = '#ef4444';
    document.getElementById('wz-budget').focus();
    toast('Veuillez saisir votre budget maximum', '#ef4444');
    return;
  }

  var zone = document.getElementById('wz-results');
  zone.innerHTML = '<div style="padding:24px;text-align:center"><div class="spin" style="margin:0 auto 12px"></div><p style="color:#64748b;font-size:13px">Recherche en cours…</p></div>';

  // Lancer scroll vers les résultats
  zone.scrollIntoView({ behavior: 'smooth', block: 'start' });

  var params = new URLSearchParams({
    prixMax: budget,
    limit: 50, page: 1,
  });
  if (dataMin > 0)    params.set('dataMin', dataMin);
  if (w.profil === 'appel') params.set('type', 'appel');
  else if (w.profil === 'internet') params.set('type', 'internet');

  apiFetch('/telecom?' + params.toString())
    .then(function(data) {
      var forfaits = (data && Array.isArray(data.forfaits)) ? data.forfaits : [];

      // Filtrer minutes minimum côté client (pas de param API dédié)
      if (minutesMin > 0) {
        forfaits = forfaits.filter(function(f) { return (f.minutes || 0) >= minutesMin; });
      }

      if (!forfaits.length) {
        zone.innerHTML = [
          '<div style="padding:24px;text-align:center;border-top:1px solid #f1f5f9">',
            '<div style="font-size:32px;margin-bottom:8px">😔</div>',
            '<div style="font-size:14px;font-weight:700;color:#1e293b">Aucun forfait trouvé</div>',
            '<div style="font-size:12px;color:#64748b;margin-top:4px">Essayez d\'augmenter le budget ou d\'assouplir les critères</div>',
            '<button onclick="state.wizardForfait.dataMin=\'\';state.wizardForfait.minutesMin=\'\';ouvrirWizardForfait()" ' +
              'style="margin-top:14px;padding:8px 20px;border-radius:8px;border:1.5px solid #3b82f6;color:#3b82f6;background:#fff;font-size:13px;font-weight:600;cursor:pointer">',
              '← Modifier les critères',
            '</button>',
          '</div>',
        ].join('');
        return;
      }

      // Scorer et trier
      forfaits.forEach(function(f) { state.forfaitCache[f.id] = f; });
      var scored = forfaits.map(function(f) {
        return { f: f, score: _scoreForfait(f, profil) };
      });
      scored.sort(function(a, b) { return b.score - a.score; });

      // Normaliser scores 0→100
      var scoreMax = scored[0].score || 1;
      scored.forEach(function(s) { s.pct = Math.round((s.score / scoreMax) * 100); });

      var top = scored.slice(0, 5);
      var medals = ['🥇', '🥈', '🥉', '4e', '5e'];
      var medalColors = ['#f59e0b', '#94a3b8', '#cd7c2e', '#64748b', '#64748b'];
      var profilLabel = profil === 'internet' ? '🌐 Internet' : profil === 'appel' ? '📞 Appels' : '🔀 Mixte';

      var html = [
        '<div style="border-top:2px solid #e2e8f0">',
          // Résumé résultats
          '<div style="padding:14px 24px;background:#f8fafc;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">',
            '<span style="font-size:13px;font-weight:700;color:#1e293b">' +
              'Top ' + top.length + ' forfaits — budget ' + fcfa(budget) + ' · profil ' + profilLabel + '</span>',
            '<span style="font-size:11px;color:#64748b">' + forfaits.length + ' forfait(s) correspondent</span>',
          '</div>',
          // Cartes résultats
          top.map(function(s, i) {
            var f = s.f;
            var dataLabel = _dataLabel(f.data_mo);
            var pj = f.validite_jours ? Math.round(f.prix / f.validite_jours) : null;
            return [
              '<div style="padding:16px 24px;border-bottom:1px solid #f1f5f9;' + (i === 0 ? 'background:#fffbeb' : '') + '">',
                // Rang + score bar
                '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">',
                  '<span style="font-size:20px">' + medals[i] + '</span>',
                  '<div style="flex:1">',
                    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">',
                      '<span style="font-size:11px;font-weight:700;color:' + medalColors[i] + '">' +
                        (i === 0 ? 'Meilleur choix' : i === 1 ? '2e choix' : i === 2 ? '3e choix' : medals[i] + ' choix') + '</span>',
                      '<span style="font-size:11px;font-weight:700;color:#475569">' + s.pct + ' pts</span>',
                    '</div>',
                    '<div style="height:6px;border-radius:3px;background:#e2e8f0;overflow:hidden">',
                      '<div style="height:100%;width:' + s.pct + '%;background:' +
                        (i === 0 ? 'linear-gradient(90deg,#f59e0b,#f97316)' : i === 1 ? '#94a3b8' : '#cbd5e1') +
                        ';border-radius:3px"></div>',
                    '</div>',
                  '</div>',
                '</div>',
                // Détail forfait
                '<div style="display:flex;align-items:flex-start;gap:12px">',
                  f.image_url
                    ? '<img src="' + f.image_url + '" style="width:36px;height:36px;object-fit:contain;flex-shrink:0">'
                    : '<div style="width:36px;height:36px;border-radius:8px;background:#eff6ff;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">📶</div>',
                  '<div style="flex:1;min-width:0">',
                    '<div style="font-size:11px;font-weight:700;color:#f97316;text-transform:uppercase">' + f.operateur + '</div>',
                    '<div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:5px">' + f.nom + '</div>',
                    '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">',
                      dataLabel ? '<span style="font-size:11px;font-weight:600;color:#1d4ed8;background:#eff6ff;padding:2px 7px;border-radius:8px">📶 ' + dataLabel + '</span>' : '',
                      f.minutes ? '<span style="font-size:11px;font-weight:600;color:#10b981;background:#ecfdf5;padding:2px 7px;border-radius:8px">📞 ' + f.minutes + ' min</span>' : '',
                      f.sms     ? '<span style="font-size:11px;font-weight:600;color:#7c3aed;background:#f5f3ff;padding:2px 7px;border-radius:8px">✉ ' + f.sms + ' SMS</span>' : '',
                      f.validite_jours ? '<span style="font-size:11px;color:#64748b;background:#f8fafc;padding:2px 7px;border-radius:8px;border:1px solid #e2e8f0">⏳ ' + f.validite_jours + ' j</span>' : '',
                    '</div>',
                    '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">',
                      '<div>',
                        '<span style="font-size:17px;font-weight:800;color:#f97316">' + fcfa(f.prix) + '</span>',
                        pj ? '<span style="font-size:11px;color:#94a3b8;margin-left:6px">· ' + fcfa(pj) + '/jour</span>' : '',
                      '</div>',
                      '<div style="display:flex;gap:6px">',
                        '<button onclick="fermerWizardForfait();ouvrirForfait(\'' + f.id + '\')" ' +
                          'style="padding:6px 12px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">',
                          'Voir →',
                        '</button>',
                        '<button onclick="fermerWizardForfait();toggleComparerForfait(\'' + f.id + '\')" ' +
                          'style="padding:6px 10px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;font-size:14px;cursor:pointer" title="Comparer">',
                          '⚖',
                        '</button>',
                      '</div>',
                    '</div>',
                  '</div>',
                '</div>',
              '</div>',
            ].join('');
          }).join('') +
          // Bouton modifier / voir tous
          '<div style="padding:16px 24px;display:flex;gap:8px;flex-wrap:wrap">',
            '<button onclick="ouvrirWizardForfait()" style="flex:1;padding:10px;border-radius:10px;border:1.5px solid #3b82f6;color:#3b82f6;background:#fff;font-size:13px;font-weight:600;cursor:pointer">← Modifier</button>',
            '<button onclick="fermerWizardForfait()" style="flex:1;padding:10px;border-radius:10px;background:#f8fafc;border:1.5px solid #e2e8f0;color:#475569;font-size:13px;font-weight:600;cursor:pointer">Voir tous →</button>',
          '</div>',
        '</div>',
      ].join('');

      zone.innerHTML = html;
      zone.scrollIntoView({ behavior: 'smooth', block: 'start' });
    })
    .catch(function(err) {
      zone.innerHTML = '<div style="padding:20px;text-align:center;color:#ef4444;font-size:13px">Erreur : ' + err.message + '</div>';
    });
}

function btnPlusForfaits(data) {
  var restant = Math.max(0, data.total - state.page * 24);
  return '<div id="btn-plus" style="text-align:center;padding:20px">' +
    '<button onclick="chargerForfaits(state.page+1)" ' +
      'style="padding:12px 36px;background:#1d4ed8;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">' +
      '⬇ Voir plus (' + restant + ' restants)' +
    '</button>' +
    '<p style="font-size:11px;color:#94a3b8;margin-top:6px">Page ' + data.page + '/' + data.pages + '</p>' +
  '</div>';
}

function templateForfaits(forfaits, data) {
  var profil = state.telecomProfil || 'mixte';
  var rec    = _meilleursParValidite(forfaits, profil);
  state.telecomRecommandes = rec.ids;
  var reste  = forfaits.filter(function(f) { return !rec.ids[f.id]; });

  // ── Section recommandés : une sous-section par groupe de validité ──
  var CLE_ORDRE = ['1j', '7j', '30j'];
  var secGroupes = CLE_ORDRE.filter(function(k) { return rec.groupes[k]; }).map(function(key) {
    var g = rec.groupes[key];
    return [
      '<div style="padding:8px 5% 4px;display:flex;align-items:center;gap:8px">',
        '<span style="font-size:14px">' + g.icone + '</span>',
        '<span style="font-size:13px;font-weight:700;color:#1e293b">' + g.label + '</span>',
        '<span style="font-size:11px;color:#94a3b8">— meilleur par opérateur</span>',
      '</div>',
      '<div class="pgrid pgrid-recommandes">' + g.best.map(carteForfaitHTML).join('') + '</div>',
    ].join('');
  }).join('');

  var secRecommandes = secGroupes ? [
    '<div style="padding:10px 5% 6px;display:flex;align-items:center;gap:10px;border-bottom:2px solid #f0fdf4">',
      '<span style="font-size:15px;font-weight:800;color:#059669">🏆 Recommandés</span>',
      '<span style="font-size:11px;color:#94a3b8">Profil ' + (profil === 'internet' ? '🌐 Internet' : profil === 'appel' ? '📞 Appels' : '🔀 Mixte') + '</span>',
    '</div>',
    secGroupes,
  ].join('') : '';

  // ── Section tous les forfaits ──────────────────────────────────
  var secTous = reste.length ? [
    '<div style="padding:10px 5% 6px;margin-top:12px;border-top:2px solid #f1f5f9;display:flex;align-items:center;gap:8px">',
      '<span style="font-size:13px;font-weight:700;color:#64748b">Tous les forfaits</span>',
      '<span style="font-size:11px;color:#94a3b8">(' + data.total + ' au total)</span>',
    '</div>',
    '<div class="pgrid">' + reste.map(carteForfaitHTML).join('') + '</div>',
  ].join('') : '';

  return [
    htmlHero(),
    htmlBarreTelecom(),
    '<section class="products">',
      secRecommandes,
      secTous,
      !secRecommandes && !secTous ? '<div style="text-align:center;padding:40px;color:#94a3b8">Aucun forfait trouvé</div>' : '',
    '</section>',
    htmlFooter(),
  ].join('');
}

function chargerForfaits(page) {
  page = page || 1;
  state.page = page;
  state.currentPage = 'home';

  dbg('chargerForfaits', { page: page });

  if (page === 1) {
    render('<div class="loader"><div class="spin"></div><p>Recherche en cours...</p></div>');
  } else {
    var s = document.querySelector('.products');
    if (s) { var sp = document.createElement('div'); sp.id = 'sp'; sp.className = 'loader'; sp.innerHTML = '<div class="spin"></div>'; s.appendChild(sp); }
  }

  // limit=200 : récupère tous les forfaits en une seule requête pour couvrir
  // tous les opérateurs et calculer les recommandés par groupe de validité
  var params = new URLSearchParams({
    operateur: state.telecomOperateur || '',
    type:      state.telecomType      || '',
    tri:       state.telecomTri       || '',
    prixMax:   state.prixMax          || '',
    prixMin:   state.prixMin          || '',
    limit: 200, page: 1
  });

  var pForfaits   = apiFetch('/telecom?' + params.toString());
  var pOperateurs = state.telecomOperateurs
    ? Promise.resolve(state.telecomOperateurs)
    : apiFetch('/telecom/operateurs').catch(function() { return []; });

  Promise.all([pForfaits, pOperateurs])
    .then(function(results) {
      var data     = results[0];
      state.telecomOperateurs = Array.isArray(results[1]) ? results[1] : [];
      var forfaits = (data && Array.isArray(data.forfaits)) ? data.forfaits : [];
      state.total  = data.total || 0;
      dbg('chargerForfaits OK', { nb: forfaits.length, total: data.total });

      if (!forfaits.length) { renderVideTelecom(); return; }

      render(templateForfaits(forfaits, data));
      setTimeout(function() { setupAutocomplete('search-input'); }, 50);
    })
    .catch(function(err) {
      dbgErr('chargerForfaits', err);
      renderErreur(err);
    });
}

function renderVideTelecom() {
  render([
    htmlHero(),
    '<div style="text-align:center;padding:48px 20px;color:#64748b">',
      '<div style="font-size:52px;margin-bottom:12px">📶</div>',
      '<h3 style="margin-bottom:8px">Aucun forfait trouvé</h3>',
      '<p style="font-size:13px;margin-bottom:20px">Essayez de changer les filtres opérateur / type / budget.</p>',
      '<button onclick="reinitialiserFiltresTelecom()" style="padding:10px 24px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">Réinitialiser les filtres</button>',
    '</div>',
  ].join(''));
  setTimeout(function() { setupAutocomplete('search-input'); }, 50);
}

async function ouvrirForfait(id) {
  dbg('ouvrirForfait', id);
  var appEl = document.getElementById('app');
  if (appEl) appEl.style.cssText = 'width:100%;max-width:100%;padding:0;margin:0;background:#f1f5f9;min-height:100vh;box-sizing:border-box';

  render('<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:16px"><div class="spin" style="width:44px;height:44px;border-width:4px"></div><p style="color:#64748b;font-size:14px">Chargement du forfait...</p></div>');

  try {
    var f = await apiFetch('/telecom/' + id);
    var dataLabel = f.data_mo
      ? (f.data_mo >= 1000 ? (f.data_mo / 1000) + ' Go' : f.data_mo + ' Mo')
      : '';

    var navHtml = [
      '<nav style="position:sticky;top:0;z-index:100;background:#fff;border-bottom:1px solid #e2e8f0;',
               'box-shadow:0 1px 4px rgba(0,0,0,.08);padding:0 16px;height:52px;',
               'display:flex;align-items:center;gap:10px">',
        '<button onclick="retourListe()" style="display:flex;align-items:center;gap:6px;background:none;border:none;',
                'color:#1d4ed8;font-size:14px;font-weight:700;cursor:pointer;padding:6px 10px;border-radius:8px">',
          '← Retour',
        '</button>',
        '<div style="width:1px;height:20px;background:#e2e8f0"></div>',
        '<span style="font-size:13px;font-weight:600;color:#334155;flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">',
          f.operateur + ' — ' + f.nom,
        '</span>',
      '</nav>',
    ].join('');

    var heroHtml = [
      '<div style="background:#fff;border-bottom:1px solid #e2e8f0">',
        '<div style="display:grid;grid-template-columns:minmax(200px,30%) 1fr;max-width:1000px;margin:0 auto">',
          '<div style="background:linear-gradient(145deg,#fff7ed,#ffedd5);display:flex;align-items:center;justify-content:center;padding:32px;min-height:240px;border-right:1px solid #e2e8f0">',
            f.image_url
              ? '<img src="' + f.image_url + '" style="max-width:100%;max-height:200px;object-fit:contain">'
              : '<div style="font-size:90px">📶</div>',
          '</div>',
          '<div style="padding:32px 36px;display:flex;flex-direction:column;gap:14px">',
            '<div><span style="font-size:11px;font-weight:700;color:#f97316;background:#fff7ed;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:.05em">' + f.operateur + '</span></div>',
            '<h1 style="font-size:22px;font-weight:800;color:#1e293b;margin:0">' + f.nom + '</h1>',
            '<div style="font-size:28px;font-weight:800;color:#f97316;font-family:\'Sora\',sans-serif">' + fcfa(f.prix) + '</div>',
            '<div style="display:flex;flex-wrap:wrap;gap:8px">',
              dataLabel ? '<span style="font-size:13px;font-weight:700;color:#1d4ed8;background:#eff6ff;padding:6px 14px;border-radius:10px">📶 ' + dataLabel + '</span>' : '',
              f.minutes ? '<span style="font-size:13px;font-weight:700;color:#10b981;background:#ecfdf5;padding:6px 14px;border-radius:10px">📞 ' + f.minutes + ' min</span>' : '',
              f.sms ? '<span style="font-size:13px;font-weight:700;color:#7c3aed;background:#f5f3ff;padding:6px 14px;border-radius:10px">✉ ' + f.sms + ' SMS</span>' : '',
              f.validite_jours ? '<span style="font-size:13px;font-weight:700;color:#475569;background:#f1f5f9;padding:6px 14px;border-radius:10px">⏳ ' + f.validite_jours + ' jours</span>' : '',
            '</div>',
            f.description ? '<p style="font-size:13px;color:#64748b;line-height:1.6;margin:0">' + f.description + '</p>' : '',
          '</div>',
        '</div>',
      '</div>',
    ].join('');

    render([navHtml, heroHtml, htmlFooter()].join(''));
  } catch (err) {
    dbgErr('ouvrirForfait', err);
    renderErreur(err);
  }
}

function filtrerTelecomOperateur(v) { state.telecomOperateur = v; chargerForfaits(1); }
function filtrerTelecomType(v)      { state.telecomType = v; chargerForfaits(1); }
function changerTriTelecom(v)       { state.telecomTri = v; chargerForfaits(1); }
function reinitialiserFiltresTelecom() {
  state.telecomOperateur = ''; state.telecomType = ''; state.telecomTri = '';
  state.prixMax = ''; state.prixMin = '';
  chargerForfaits(1);
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

// ═══════════════════════════════════════════════════════════════
//  PAGE PRODUIT — Layout 2 colonnes pleine largeur
// ═══════════════════════════════════════════════════════════════
var MARCHAND_ICONS = {
  'Jumia Senegal': '🛍️',
  'Expat-Dakar':   '📋',
  'CoinAfrique':   '🌍',
  'Dakar-Deal':    '💼',
  'SenMarket':     '🏪',
};

async function ouvrirProduit(id, simFiltres) {
  simFiltres = simFiltres || {};
  dbg('ouvrirProduit', id);

  // Pleine largeur — AUCUN max-width sur l'app
  var appEl = document.getElementById('app');
  if (appEl) appEl.style.cssText = 'width:100%;max-width:100%;padding:0;margin:0;background:#f1f5f9;min-height:100vh;box-sizing:border-box';

  render([
    '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:16px">',
      '<div class="spin" style="width:44px;height:44px;border-width:4px"></div>',
      '<p style="color:#64748b;font-size:14px">Chargement du produit...</p>',
    '</div>',
  ].join(''));

  try {
    var res    = await apiFetch('/produits/' + id);
    var offres = await apiFetch('/produits/' + id + '/offres');
    var histo  = await apiFetch('/produits/' + id + '/historique').catch(function(){ return []; });
    var simP   = new URLSearchParams({ limit:8, prixMax:simFiltres.prixMax||'', marchand:simFiltres.marchand||'' });
    var simRes = await apiFetch('/produits/' + id + '/similaires?' + simP).catch(function(){ return {produits:[]}; });

    ajouterRecent(res);

    var offresArr = Array.isArray(offres) ? offres : [];
    // ── DEBUG titre_affiche ──────────────────────────────────
    if (offresArr.length) {
      console.log('%c[OFFRES DEBUG]', 'color:#f97316;font-weight:bold', 
        offresArr.map(function(o) { return { 
          marchand: o.marchand_nom, 
          titre_affiche: o.titre_affiche, 
          produit_nom: o.produit_nom,
          titre_marchand: o.titre_marchand,
          url: o.url_achat ? o.url_achat.slice(0,60) : null
        }; })
      );
    }
    var prixMin   = offresArr.length ? Math.min.apply(null, offresArr.map(function(o){ return +o.prix; })) : 0;
    var prixMaxO  = offresArr.length ? Math.max.apply(null, offresArr.map(function(o){ return +o.prix; })) : 0;
    var economie  = prixMaxO > prixMin ? prixMaxO - prixMin : 0;
    var bestOffre = offresArr.length ? offresArr.reduce(function(a,b){ return +a.prix < +b.prix ? a : b; }) : null;

    // ── Navbar sticky ─────────────────────────────────────────
    var navHtml = [
      '<nav style="position:sticky;top:0;z-index:100;background:#fff;border-bottom:1px solid #e2e8f0;',
               'box-shadow:0 1px 4px rgba(0,0,0,.08);padding:0 16px;height:52px;',
               'display:flex;align-items:center;gap:10px">',
        '<button onclick="retourListe()" style="display:flex;align-items:center;gap:6px;background:none;border:none;',
                'color:#1d4ed8;font-size:14px;font-weight:700;cursor:pointer;padding:6px 10px;',
                'border-radius:8px;transition:background .15s" ',
                'onmouseover="this.style.background=\'#eff6ff\'" onmouseout="this.style.background=\'none\'">',
          '← Retour',
        '</button>',
        '<div style="width:1px;height:20px;background:#e2e8f0"></div>',
        '<span style="font-size:13px;font-weight:600;color:#334155;flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">',
          res.nom,
        '</span>',
        offresArr.length ? [
          '<a href="' + (bestOffre && bestOffre.url_achat ? bestOffre.url_achat : '#') + '" target="_blank" rel="noopener"',
          ' style="flex-shrink:0;padding:8px 16px;background:#10b981;color:#fff;border-radius:10px;',
          'font-size:13px;font-weight:700;text-decoration:none;white-space:nowrap">',
          'Acheter ' + fcfa(prixMin) + ' →</a>',
        ].join('') : '',
      '</nav>',
    ].join('');

    // ── Hero : image (gauche) + infos+prix (droite) ───────────
    var heroHtml = [
      '<div style="background:#fff;border-bottom:1px solid #e2e8f0">',
        '<div style="display:grid;grid-template-columns:minmax(280px,38%) 1fr;max-width:1200px;margin:0 auto">',

          // Colonne image
          '<div style="background:linear-gradient(145deg,#f8fafc,#eff6ff);',
                      'display:flex;align-items:center;justify-content:center;',
                      'padding:32px;min-height:320px;border-right:1px solid #e2e8f0">',
            res.image_url
              ? '<img src="' + res.image_url + '" style="max-width:100%;max-height:280px;object-fit:contain;drop-shadow:0 8px 24px rgba(0,0,0,.12)">'
              : '<div style="font-size:100px;filter:grayscale(.3)">📦</div>',
          '</div>',

          // Colonne infos
          '<div style="padding:32px 36px;display:flex;flex-direction:column;gap:16px">',
            // Badge catégorie
            res.categorie_nom
              ? '<div><span style="font-size:11px;font-weight:700;color:#1d4ed8;background:#eff6ff;' +
                'padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:.05em">' +
                res.categorie_nom + '</span></div>'
              : '',

            // Nom & marque
            '<div>',
              '<h1 style="font-size:24px;font-weight:800;color:#0f172a;line-height:1.3;margin:0 0 6px">',
                res.nom,
              '</h1>',
              res.marque
                ? '<p style="font-size:13px;color:#64748b;margin:0">Marque : <strong style="color:#334155">' + res.marque + '</strong></p>'
                : '',
            '</div>',

            // Prix bloc
            offresArr.length ? [
              '<div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:14px;padding:20px 24px">',
                '<div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">',
                  '🏷 Meilleur prix trouvé',
                '</div>',
                '<div style="font-size:36px;font-weight:900;color:#15803d;line-height:1">',
                  fcfa(prixMin),
                '</div>',
                economie > 0
                  ? '<div style="margin-top:8px;font-size:12px;color:#f97316;font-weight:700;background:#fff7ed;display:inline-block;padding:3px 10px;border-radius:8px">' +
                    '💰 Économie possible : ' + fcfa(economie) + '</div>'
                  : '',
                '<p style="margin:10px 0 0;font-size:12px;color:#16a34a">',
                  offresArr.length + ' marchand' + (offresArr.length > 1 ? 's' : '') + ' comparé' + (offresArr.length > 1 ? 's' : ''),
                '</p>',
              '</div>',
            ].join('')
            : '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;color:#94a3b8;font-size:14px">Aucune offre disponible pour le moment.</div>',

            // CTA bouton
            bestOffre ? [
              '<a href="' + (bestOffre.url_achat||'#') + '" target="_blank" rel="noopener"',
              ' style="display:block;text-align:center;padding:14px 24px;background:linear-gradient(135deg,#10b981,#059669);',
              'color:#fff;border-radius:12px;font-size:16px;font-weight:800;text-decoration:none;',
              'box-shadow:0 4px 12px rgba(16,185,129,.35);letter-spacing:.01em">',
              '🛒 Acheter au meilleur prix →',
              '</a>',
            ].join('') : '',

            // Badges de confiance
            '<div style="display:flex;gap:10px;flex-wrap:wrap">',
              _badge('🔒', 'Paiement sécurisé'),
              _badge('🚚', 'Livraison Dakar'),
              _badge('✅', 'Prix vérifiés'),
            '</div>',
          '</div>',

        '</div>',
      '</div>',
    ].join('');

    // ── Corps : offres + historique + similaires ──────────────
    var bodyHtml = [
      '<div style="max-width:1200px;margin:0 auto;padding:28px 20px 80px;display:grid;',
                  'grid-template-columns:1fr 340px;gap:24px;align-items:start">',

        // Colonne gauche : offres + historique
        '<div style="display:flex;flex-direction:column;gap:20px">',
          _sectionOffres(offresArr, prixMin),
          htmlHistorique(histo),
          '<div>',
            htmlSimilaires(id, simRes, simFiltres),
          '</div>',
        '</div>',

        // Colonne droite : résumé sticky
        '<div style="position:sticky;top:64px">',
          _sectionResume(res, offresArr, prixMin, bestOffre),
        '</div>',

      '</div>',
    ].join('');

    render(navHtml + heroHtml + bodyHtml);

  } catch(err) {
    dbgErr('ouvrirProduit', err);
    var appEl2 = document.getElementById('app');
    if (appEl2) appEl2.style.cssText = '';
    render([
      '<div style="padding:60px 20px;max-width:560px;margin:0 auto;text-align:center">',
        '<button onclick="retourListe()" style="background:none;border:none;color:#1d4ed8;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:24px;display:block">← Retour</button>',
        '<div style="font-size:56px;margin-bottom:12px">⚠️</div>',
        '<h3 style="color:#b91c1c;font-size:18px;margin-bottom:8px">Erreur de chargement</h3>',
        '<p style="color:#64748b;font-size:14px;margin-bottom:24px">' + err.message + '</p>',
        '<button onclick="ouvrirProduit(\'' + id + '\')" style="padding:12px 28px;background:#1d4ed8;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">🔄 Réessayer</button>',
      '</div>',
    ].join(''));
  }
}

// ── Helpers internes ─────────────────────────────────────────────
function _badge(icon, label) {
  return '<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;padding:4px 10px;border-radius:20px">' +
    '<span>' + icon + '</span><span>' + label + '</span></div>';
}

function _sectionOffres(offresArr, prixMin) {
  var header = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">' +
    '<h2 style="font-size:14px;font-weight:800;color:#0f172a;margin:0">📊 Comparer les prix</h2>' +
    '<span style="font-size:12px;color:#94a3b8">' + offresArr.length + ' offre(s)</span>' +
  '</div>';

  if (!offresArr.length) {
    return '<div style="background:#fff;border-radius:14px;border:1px solid #e2e8f0;padding:24px">' + header +
      '<div style="text-align:center;padding:24px;color:#94a3b8;font-size:14px">Aucune offre disponible pour ce produit.<br>' +
      '<span style="font-size:12px;margin-top:8px;display:block">Les marchands seront ajoutés après le prochain scraping (toutes les 4h).</span></div></div>';
  }

  var lignes = offresArr.map(function(o) {
    var best  = +o.prix === prixMin;
    var ecart = best ? 0 : +o.prix - prixMin;
    var icon  = MARCHAND_ICONS[o.marchand_nom] || '🏪';
    return [
      '<div style="display:flex;align-items:center;gap:14px;padding:16px 20px;',
           'border-bottom:1px solid #f1f5f9;',
           (best ? 'background:#f0fdf4;border-left:4px solid #10b981' : 'border-left:4px solid transparent') + '">',

        // Icône + nom marchand
        '<div style="width:44px;height:44px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;',
             'display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">',
          icon,
        '</div>',
        '<div style="flex:1;min-width:0">',
          best ? '<span style="display:inline-block;background:#10b981;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;margin-bottom:4px">🏆 Meilleur prix</span><br>' : '',
          '<a href="' + (o.site_url||'#') + '" target="_blank" rel="noopener" onclick="event.stopPropagation()" ',
          'style="font-size:15px;font-weight:700;color:#1e293b;text-decoration:none">',
            o.marchand_nom || 'Marchand',
          '</a>',
          // Nom du produit chez ce marchand
          (function() {
            var t = o.titre_affiche || o.produit_nom || '';
            if (!t) return '';
            // Capitaliser
            t = t.split(' ').map(function(w) {
              return w.length > 1 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase();
            }).join(' ');
            return '<div style="font-size:12px;color:#64748b;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + t + '">' +
              t.slice(0, 60) + (t.length > 60 ? '…' : '') +
            '</div>';
          })(),
          ecart > 0 ? '<div style="font-size:11px;color:#f97316;margin-top:2px">+' + fcfa(ecart) + ' de plus que le moins cher</div>' : '',
        '</div>',

        // Prix + bouton
        '<div style="text-align:right;flex-shrink:0">',
          '<div style="font-size:22px;font-weight:900;color:' + (best ? '#15803d' : '#1e293b') + ';white-space:nowrap">',
            fcfa(o.prix),
          '</div>',
          '<a href="' + (o.url_achat||'#') + '" target="_blank" rel="noopener" onclick="event.stopPropagation()" ',
          'style="display:inline-block;margin-top:6px;padding:8px 20px;',
          'background:' + (best ? '#10b981' : '#1d4ed8') + ';color:#fff;',
          'border-radius:10px;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap">',
            'Voir l\'offre →',
          '</a>',
        '</div>',

      '</div>',
    ].join('');
  }).join('');

  return [
    '<div style="background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;',
                'box-shadow:0 2px 8px rgba(0,0,0,.04)">',
      '<div style="padding:20px 20px 4px">', header, '</div>',
      lignes,
    '</div>',
  ].join('');
}

function _sectionResume(res, offresArr, prixMin, bestOffre) {
  if (!offresArr.length) return '';
  return [
    '<div style="background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;',
                'box-shadow:0 2px 8px rgba(0,0,0,.04)">',
      '<div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:16px 20px;color:#fff">',
        '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;opacity:.8">',
          'Résumé',
        '</div>',
        '<div style="font-size:18px;font-weight:800;margin-top:4px;line-height:1.3">',
          res.nom,
        '</div>',
      '</div>',
      '<div style="padding:16px 20px;display:flex;flex-direction:column;gap:12px">',
        '<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid #f1f5f9">',
          '<span style="font-size:12px;color:#64748b">Prix le plus bas</span>',
          '<span style="font-size:20px;font-weight:900;color:#15803d">' + fcfa(prixMin) + '</span>',
        '</div>',
        offresArr.length > 1 ? [
          '<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid #f1f5f9">',
            '<span style="font-size:12px;color:#64748b">Prix le plus haut</span>',
            '<span style="font-size:16px;font-weight:700;color:#64748b">' + fcfa(Math.max.apply(null,offresArr.map(function(o){return+o.prix;}))) + '</span>',
          '</div>',
        ].join('') : '',
        '<div style="display:flex;justify-content:space-between;align-items:center">',
          '<span style="font-size:12px;color:#64748b">Marchands</span>',
          '<span style="font-size:14px;font-weight:700;color:#334155">' + offresArr.length + '</span>',
        '</div>',
        bestOffre ? [
          '<a href="' + (bestOffre.url_achat||'#') + '" target="_blank" rel="noopener"',
          ' style="display:block;text-align:center;padding:13px;background:#10b981;color:#fff;',
          'border-radius:10px;font-size:14px;font-weight:800;text-decoration:none;margin-top:4px">',
          '🛒 Meilleur prix chez ' + (bestOffre.marchand_nom||'ce marchand') + '</a>',
        ].join('') : '',
      '</div>',
    '</div>',
  ].join('');
}

// ── Tableau des offres (comparaison côte à côte avec détails) ────
function htmlTableauOffres(offresArr, prixMin) {
  if (!offresArr || !offresArr.length) return '';

  // Icônes par marchand
  var icons = {
    'kanje': '🛍️', 'electronic corp': '📱', 'master office': '🖥️',
    'electrolux': '❄️', 'soumari': '🏪', 'kaynoo': '🛒',
    'dakar mondial': '📞', 'electroménager dakar': '🏠', 'coinafrique': '🌍',
    'jumia': '🟠', 'expat': '🟡',
  };
  function getIcon(nom) {
    var n = (nom||'').toLowerCase();
    for (var k in icons) { if (n.indexOf(k) !== -1) return icons[k]; }
    return '🏪';
  }

  var lignes = offresArr.map(function(o, i) {
    var best  = +o.prix === prixMin;
    var ecart = best ? 0 : +o.prix - prixMin;
    var pct   = prixMin > 0 && !best ? Math.round(ecart / prixMin * 100) : 0;
    var icon  = getIcon(o.marchand_nom);

    return [
      '<div style="border-bottom:1px solid #f1f5f9;' + (best ? 'background:#f0fdf4' : 'background:#fff') + '">',
        // Ligne principale
        '<div style="display:flex;align-items:center;gap:10px;padding:12px 16px">',
          // Rang
          '<div style="width:24px;height:24px;border-radius:50%;background:' + (best ? '#10b981' : '#f1f5f9') + ';',
            'color:' + (best ? '#fff' : '#64748b') + ';font-size:11px;font-weight:800;',
            'display:flex;align-items:center;justify-content:center;flex-shrink:0">' + (i+1) + '</div>',
          // Nom marchand
          '<div style="flex:1;min-width:0">',
            '<div style="display:flex;align-items:center;gap:5px">',
              '<span style="font-size:15px">' + icon + '</span>',
              '<span style="font-weight:700;font-size:13px;color:#1e293b">' + (o.marchand_nom||'Marchand') + '</span>',
              best ? '<span style="background:#10b981;color:#fff;font-size:9px;font-weight:700;padding:1px 7px;border-radius:8px">MEILLEUR PRIX</span>' : '',
            '</div>',
            // Détails marchand
            // Titre exact du produit chez ce marchand (depuis slug URL ou titre normalisé)
            (function() {
              var t = o.titre_affiche || o.produit_nom || '';
              // Capitaliser la première lettre de chaque mot
              t = t.split(' ').map(function(w) {
                return w.length > 1 ? w.charAt(0).toUpperCase() + w.slice(1) : w.toUpperCase();
              }).join(' ');
              return '<div style="font-size:11px;color:#475569;margin-top:3px;overflow:hidden;text-overflow:ellipsis;font-style:italic" title="' + t + '">' +
                t.slice(0, 65) + (t.length > 65 ? '…' : '') +
              '</div>';
            })(),
            '<div style="font-size:11px;color:#94a3b8;margin-top:2px">',
              (o.site_url ? o.site_url.replace('https://','').replace('www.','').split('/')[0] : '') +
              (o.scraped_at ? ' · ' + new Date(o.scraped_at).toLocaleDateString('fr-FR') : ''),
            '</div>',
          '</div>',
          // Prix + écart
          '<div style="text-align:right;flex-shrink:0">',
            '<div style="font-weight:800;font-size:16px;color:' + (best ? '#10b981' : '#1e293b') + ';font-family:Sora,sans-serif">' + fcfa(o.prix) + '</div>',
            ecart > 0 ? '<div style="font-size:10px;color:#ef4444;font-weight:600">+' + fcfa(ecart) + ' (+' + pct + '%)</div>' : '<div style="font-size:10px;color:#10b981;font-weight:600">✓ le moins cher</div>',
          '</div>',
          // Bouton
          '<a href="' + (o.url_achat||'#') + '" target="_blank" onclick="event.stopPropagation()" ',
            'style="flex-shrink:0;padding:8px 16px;background:' + (best ? '#10b981' : '#1d4ed8') + ';',
            'color:#fff;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap">',
            'Voir l\'offre →',
          '</a>',
        '</div>',
      '</div>',
    ].join('');
  }).join('');

  var nomProduit = offresArr[0] && offresArr[0].produit_nom ? offresArr[0].produit_nom : '';
  return [
    '<div style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:20px">',
      // En-tête tableau avec nom du produit
      '<div style="padding:10px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0">',
        '<div style="display:flex;justify-content:space-between;align-items:center">',
          '<span style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">📊 Comparaison des prix</span>',
          '<span style="font-size:11px;color:#94a3b8">' + offresArr.length + ' marchand' + (offresArr.length>1?'s':'') + '</span>',
        '</div>',
        nomProduit ? '<div style="font-size:12px;color:#475569;margin-top:4px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">📦 ' + nomProduit.slice(0,90) + '</div>' : '',
      '</div>',
      lignes,
    '</div>',
  ].join('');
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

  // Titre adaptatif selon la qualité des résultats
  var hasMarque = similaires.produits && similaires.produits.some(function(p){ return p.similarite === 'meme_marque'; });
  var simTitre  = hasMarque ? '🏷️ Même marque, autres modèles' : '🔄 Produits de la même catégorie';

  if (!similaires.produits || !similaires.produits.length) {
    return [
      '<div>',
        '<h3 style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">' + simTitre + '</h3>',
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

// ── Extraction de specs depuis le nom du produit ─────────────────
function extraireSpecs(nom) {
  var s = ' ' + (nom || '') + ' ';
  var specs = {};

  // Format RAM/Stockage : "8Go/256Go" ou "8 Go / 256 Go"
  var slash = s.match(/(\d+)\s*[Gg][Oo]\s*\/\s*(\d+)\s*[Gg][Oo]/i);
  if (slash) {
    specs['RAM']     = { val: parseInt(slash[1]), label: slash[1] + ' Go', plus: true };
    specs['Stockage']= { val: parseInt(slash[2]), label: slash[2] + ' Go', plus: true };
  }

  // RAM explicite : "8Go RAM" | "RAM 8Go" | "8GB RAM"
  if (!specs['RAM']) {
    var ram = s.match(/(\d+)\s*[Gg][Oo]\s+[Rr][Aa][Mm]|[Rr][Aa][Mm]\s*:?\s*(\d+)\s*[Gg][Oo]/i);
    if (ram) specs['RAM'] = { val: parseInt(ram[1]||ram[2]), label: (ram[1]||ram[2]) + ' Go', plus: true };
  }

  // Stockage seul (valeurs typiques puissances de 2)
  if (!specs['Stockage']) {
    var stRe = /(\d+)\s*[Gg][Oo](?!\s*[Rr][Aa][Mm])|(\d+)\s*[Gg][Bb](?!\s*[Rr][Aa][Mm])/gi;
    var stVals = [], sm2;
    while ((sm2 = stRe.exec(s)) !== null) {
      var sv = parseInt(sm2[1]||sm2[2]);
      if ([16,32,64,128,256,512,1024].indexOf(sv) !== -1) stVals.push(sv);
    }
    if (stVals.length) { var sb = Math.max.apply(null,stVals); specs['Stockage'] = { val: sb, label: sb + ' Go', plus: true }; }
    var tb = s.match(/(\d+)\s*[Tt][Oo]|(\d+)\s*[Tt][Bb]/i);
    if (tb) { var tv = parseInt(tb[1]||tb[2]); specs['Stockage'] = { val: tv*1024, label: tv + ' To', plus: true }; }
  }

  // Écran (pouces / " / inch)
  var ecr = s.match(/(\d+(?:[.,]\d+)?)\s*(?:pouces?|"|\binch(?:es)?\b)/i);
  if (ecr) { var ev = parseFloat(ecr[1].replace(',','.')); specs['Écran'] = { val: ev, label: ev + '"', plus: true }; }

  // Résolution
  if      (/\b8[Kk]\b/.test(s))              specs['Résolution'] = { val: 4, label: '8K',      plus: true };
  else if (/\b4[Kk]\b/.test(s))              specs['Résolution'] = { val: 3, label: '4K',      plus: true };
  else if (/\bFull\s*HD\b|\bFHD\b/i.test(s)) specs['Résolution'] = { val: 2, label: 'Full HD', plus: true };
  else if (/\bHD\b/.test(s))                 specs['Résolution'] = { val: 1, label: 'HD',      plus: true };

  // Batterie
  var batt = s.match(/(\d+)\s*[Mm][Aa][Hh]/);
  if (batt) specs['Batterie'] = { val: parseInt(batt[1]), label: batt[1] + ' mAh', plus: true };

  // Caméra
  var cam = s.match(/(\d+)\s*(?:[Mm][Pp]|[Mm][Éé]ga(?:pixels?)?)/i);
  if (cam) specs['Caméra'] = { val: parseInt(cam[1]), label: cam[1] + ' MP', plus: true };

  // BTU (climatiseurs)
  var btu = s.match(/(\d[\d\s]*)\s*[Bb][Tt][Uu]/i);
  if (btu) { var bv = parseInt(btu[1].replace(/\s/g,'')); specs['BTU'] = { val: bv, label: bv.toLocaleString('fr-FR'), plus: true }; }

  // Puissance watts
  var pw = s.match(/(\d+)\s*[Ww](?:atts?)?\b/);
  if (pw) specs['Puissance'] = { val: parseInt(pw[1]), label: pw[1] + ' W', plus: true };

  // Capacité litres (réfrigérateurs, lave-linge)
  var vol = s.match(/(\d+)\s*[Ll](?:itres?)?\b/);
  if (vol) specs['Capacité'] = { val: parseInt(vol[1]), label: vol[1] + ' L', plus: true };

  // Réseau mobile
  if      (/\b5[Gg]\b/.test(s)) specs['Réseau'] = { val: 2, label: '5G', plus: true };
  else if (/\b4[Gg]\b/.test(s)) specs['Réseau'] = { val: 1, label: '4G', plus: true };

  // Inverter
  if (/\b[Ii]nverter\b/.test(s)) specs['Type'] = { val: 1, label: 'Inverter', plus: false };

  return specs;
}

// ── Sparkline SVG 90j ────────────────────────────────────────────
function sparklineHTML(historique) {
  var prices = (historique||[]).map(function(h){ return parseFloat(h.prix_min)||0; }).filter(Boolean);
  if (prices.length < 2) return '<div style="height:44px;display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:10px">Pas de données</div>';
  var mn = Math.min.apply(null,prices), mx = Math.max.apply(null,prices), rng = mx-mn||1;
  var W=120, H=36, P=3;
  var pts = prices.map(function(p,i){
    return (P+(i/(prices.length-1))*(W-P*2)).toFixed(1)+','+(H-P-((p-mn)/rng)*(H-P*2)).toFixed(1);
  }).join(' ');
  var chg = Math.round((prices[prices.length-1]-prices[0])/prices[0]*100);
  var color = chg <= 0 ? '#10b981' : '#f97316';
  var lbl   = chg === 0 ? 'Stable' : (chg>0?'+'+chg+'%':chg+'%');
  return '<div style="text-align:center">' +
    '<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" style="display:block;margin:0 auto">' +
      '<polyline points="'+pts+'" fill="none" stroke="'+color+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>' +
    '<div style="font-size:10px;font-weight:700;color:'+color+'">'+lbl+' sur 90j</div>' +
  '</div>';
}

// ── Étoiles qualité/prix ─────────────────────────────────────────
function etoilesHTML(n) {
  var h = '';
  for (var i=1;i<=5;i++) h += '<span style="color:'+(i<=n?'#f59e0b':'#e2e8f0')+';font-size:15px">★</span>';
  return h;
}

// Score pondéré : combine l'écart de prix (weight poidsPrice) et les specs (inverse)
function calculerScore(prix, prixMinGlobal, nbSpecsBest, nbSpecsTotal) {
  if (!prix || !prixMinGlobal) return 3;
  var pp = state.comparePrefs.poidsPrice; // 1–5
  var r  = prix / prixMinGlobal;
  var scorePrix = r<=1.05?5 : r<=1.20?4 : r<=1.40?3 : r<=1.70?2 : 1;
  // Score specs : proportion de critères où ce produit est le meilleur
  var scoreSpecs = nbSpecsTotal > 0
    ? Math.round(1 + (nbSpecsBest / nbSpecsTotal) * 4)
    : scorePrix;
  // Pondération : poidsPrice/5 pour prix, (5-poidsPrice)/5 pour specs
  var w = pp / 5;
  return Math.round(w * scorePrix + (1 - w) * scoreSpecs);
}

// ── Paramètres de comparaison ─────────────────────────────────────
function sauvegarderPrefs() {
  try { localStorage.setItem('yomb_compare_prefs', JSON.stringify(state.comparePrefs)); } catch(e) {}
}

function toggleSection(key) {
  var idx = state.comparePrefs.sections.indexOf(key);
  if (idx !== -1) state.comparePrefs.sections.splice(idx, 1);
  else state.comparePrefs.sections.push(key);
  sauvegarderPrefs();
  ouvrirComparaison();
}

function setPoidsPrice(val) {
  state.comparePrefs.poidsPrice = parseInt(val);
  sauvegarderPrefs();
  document.getElementById('poids-label') && (document.getElementById('poids-label').textContent = ['','Prix peu important','Prix secondaire','Équilibré','Prix important','Prix prioritaire'][state.comparePrefs.poidsPrice]);
}

function appliquerPrefs() {
  var m = document.getElementById('pref-marchand');
  var b = document.getElementById('pref-budget');
  if (m) state.comparePrefs.marchand  = m.value.trim();
  if (b) state.comparePrefs.budgetMax = b.value.trim();
  sauvegarderPrefs();
  ouvrirComparaison();
}

function reinitPrefs() {
  state.comparePrefs = Object.assign({}, _prefsDefaut);
  sauvegarderPrefs();
  ouvrirComparaison();
}

function htmlParametres() {
  var p = state.comparePrefs;
  var sections = [
    { key: 'prix',       label: '💰 Prix' },
    { key: 'specs',      label: '📊 Caractéristiques' },
    { key: 'historique', label: '📈 Historique des prix' },
  ];
  var poidsLabels = ['','Prix peu important','Prix secondaire','Équilibré','Prix important','Prix prioritaire'];
  return '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.06)">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">' +
      '<span style="font-size:14px;font-weight:800;color:#1e293b">⚙ Paramètres de comparaison</span>' +
      '<button onclick="state.comparePrefsOpen=false;ouvrirComparaison()" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;line-height:1">×</button>' +
    '</div>' +
    // Sections
    '<div style="margin-bottom:14px">' +
      '<div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">Sections à afficher</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        sections.map(function(s) {
          var actif = p.sections.indexOf(s.key) !== -1;
          return '<button onclick="toggleSection(\''+s.key+'\')" style="padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid '+(actif?'#1d4ed8':'#e2e8f0')+';background:'+(actif?'#eff6ff':'#f8fafc')+';color:'+(actif?'#1d4ed8':'#94a3b8')+'">'+s.label+'</button>';
        }).join('') +
      '</div>' +
    '</div>' +
    // Poids prix
    '<div style="margin-bottom:14px">' +
      '<div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Importance du prix dans le score</div>' +
      '<div style="display:flex;align-items:center;gap:10px">' +
        '<input type="range" min="1" max="5" value="'+p.poidsPrice+'" oninput="setPoidsPrice(this.value)" style="flex:1;accent-color:#1d4ed8">' +
        '<span id="poids-label" style="font-size:12px;color:#475569;min-width:140px">'+poidsLabels[p.poidsPrice]+'</span>' +
      '</div>' +
    '</div>' +
    // Filtres
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">' +
      '<div style="flex:1;min-width:140px">' +
        '<div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">Marchand préféré</div>' +
        '<input id="pref-marchand" type="text" value="'+p.marchand+'" placeholder="ex: Jumia" style="width:100%;padding:7px 10px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;box-sizing:border-box">' +
      '</div>' +
      '<div style="flex:1;min-width:140px">' +
        '<div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">Budget max (FCFA)</div>' +
        '<input id="pref-budget" type="number" value="'+p.budgetMax+'" placeholder="ex: 300000" style="width:100%;padding:7px 10px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;box-sizing:border-box">' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;gap:8px">' +
      '<button onclick="appliquerPrefs()" style="flex:1;padding:8px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">Appliquer</button>' +
      '<button onclick="reinitPrefs()" style="padding:8px 14px;background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;cursor:pointer">Réinitialiser</button>' +
    '</div>' +
  '</div>';
}

// ── Comparaison principale ────────────────────────────────────────
async function ouvrirComparaison() {
  if (state.comparer.length < 2) { toast('Sélectionne au moins 2 produits ⚖', '#f97316'); return; }
  state.currentPage = 'compare';
  render('<div class="loader"><div class="spin"></div><p>Préparation de la comparaison...</p></div>');
  try {
    // Charger produit + offres + historique en parallèle pour chaque produit
    var produits = await Promise.all(state.comparer.map(function(id) {
      return Promise.all([
        apiFetch('/produits/' + id),
        apiFetch('/produits/' + id + '/offres').catch(function(){ return []; }),
        apiFetch('/produits/' + id + '/historique').catch(function(){ return []; }),
      ]).then(function(r){ return Object.assign(r[0], { offres: r[1], historique: r[2] }); });
    }));

    var prefs = state.comparePrefs;

    // Appliquer filtre marchand et budget max sur les offres
    produits.forEach(function(p) {
      p.offres = p.offres.filter(function(o) {
        if (prefs.marchand && o.marchand_nom &&
            o.marchand_nom.toLowerCase().indexOf(prefs.marchand.toLowerCase()) === -1) return false;
        if (prefs.budgetMax && +o.prix > +prefs.budgetMax) return false;
        return true;
      });
    });

    // Prix minimum par produit + global
    var prixMins = produits.map(function(p){
      return p.offres.length ? Math.min.apply(null, p.offres.map(function(o){ return +o.prix; })) : null;
    });
    var prixMinGlobal = prixMins.filter(Boolean).length
      ? Math.min.apply(null, prixMins.filter(Boolean)) : null;

    // Specs extraites et union des clés présentes
    var specsParProduit = produits.map(function(p){ return extraireSpecs(p.nom); });
    var toutesSpecs = [];
    specsParProduit.forEach(function(sp){
      Object.keys(sp).forEach(function(k){ if(toutesSpecs.indexOf(k)===-1) toutesSpecs.push(k); });
    });

    // Styles partagés
    var COL  = 'flex:1;min-width:150px;padding:12px 10px;text-align:center;border-left:1px solid #f1f5f9;';
    var LBL  = 'width:130px;flex-shrink:0;padding:12px 14px;font-size:12px;color:#64748b;font-weight:600;display:flex;align-items:center;';
    var ROW  = 'display:flex;border-bottom:1px solid #f1f5f9;';
    var SECT = 'display:flex;align-items:center;background:#f8fafc;padding:8px 12px;font-size:10px;font-weight:800;color:#475569;letter-spacing:.06em;text-transform:uppercase;border-bottom:1px solid #e2e8f0;';

    // ── En-tête ────────────────────────────────────────────────
    var enTete = produits.map(function(p, i){
      var cheapest = prixMins[i] && prixMins[i]===prixMinGlobal;
      return '<div style="'+COL+'vertical-align:top">' +
        (cheapest
          ? '<div style="background:#10b981;color:#fff;font-size:9px;font-weight:800;padding:2px 8px;border-radius:10px;display:inline-block;margin-bottom:6px">🏆 MOINS CHER</div>'
          : '<div style="height:20px;margin-bottom:6px"></div>') +
        '<div style="width:64px;height:64px;margin:0 auto 8px;background:#f8fafc;border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid #e2e8f0">' +
          (p.image_url ? '<img src="'+p.image_url+'" style="max-width:60px;max-height:60px;object-fit:contain">' : '<span style="font-size:28px">📦</span>') +
        '</div>' +
        '<div style="font-size:12px;font-weight:700;color:#1e293b;line-height:1.3;margin-bottom:3px">'+(p.nom.length>42?p.nom.slice(0,42)+'…':p.nom)+'</div>' +
        (p.marque ? '<div style="font-size:11px;color:#94a3b8;margin-bottom:6px">'+p.marque+'</div>' : '<div style="margin-bottom:6px"></div>') +
        '<button onclick="event.stopPropagation();state.comparer.splice('+i+',1);if(state.comparer.length>=2){ouvrirComparaison();}else{retourListe();}" style="background:none;border:1px solid #fca5a5;color:#ef4444;border-radius:6px;font-size:10px;padding:2px 8px;cursor:pointer">✕</button>' +
      '</div>';
    }).join('');

    // ── Lignes Prix ────────────────────────────────────────────
    function cellule(contenu, highlight) {
      return '<div style="'+COL+(highlight?'background:#f0fdf4':'')+'">'+contenu+'</div>';
    }
    var lignesPrix = [
      // Meilleur prix
      '<div style="'+ROW+'">'+
        '<div style="'+LBL+'">Meilleur prix</div>'+
        produits.map(function(p,i){
          var pm=prixMins[i], best=pm&&pm===prixMinGlobal;
          return cellule('<span style="font-size:16px;font-weight:800;color:'+(best?'#10b981':'#1e293b')+'">'+(pm?fcfa(pm):'–')+'</span>', best);
        }).join('')+
      '</div>',
      // Marchand le moins cher
      '<div style="'+ROW+'">'+
        '<div style="'+LBL+'">Chez</div>'+
        produits.map(function(p){
          return '<div style="'+COL+'"><span style="font-size:11px;color:#475569">'+(p.offres[0]?p.offres[0].marchand_nom:'–')+'</span></div>';
        }).join('')+
      '</div>',
      // Toutes les offres résumées
      '<div style="'+ROW+'">'+
        '<div style="'+LBL+'">Nb offres</div>'+
        produits.map(function(p){
          return '<div style="'+COL+'"><span style="font-size:12px;color:#64748b">'+p.offres.length+' marchand(s)</span></div>';
        }).join('')+
      '</div>',
      // Écart vs le moins cher
      '<div style="'+ROW+'">'+
        '<div style="'+LBL+'">Écart</div>'+
        produits.map(function(p,i){
          var pm=prixMins[i];
          if(!pm||pm===prixMinGlobal) return '<div style="'+COL+'"><span style="font-size:11px;font-weight:700;color:#10b981">Référence</span></div>';
          var e=pm-prixMinGlobal, pct=Math.round(e/prixMinGlobal*100);
          return '<div style="'+COL+'"><span style="font-size:11px;font-weight:700;color:#f97316">+'+fcfa(e)+' (+'+pct+'%)</span></div>';
        }).join('')+
      '</div>',
      // Top 2 offres par produit
      '<div style="'+ROW+'align-items:flex-start">'+
        '<div style="'+LBL+'padding-top:12px">Top offres</div>'+
        produits.map(function(p){
          return '<div style="'+COL+'text-align:left;font-size:11px">'+
            p.offres.slice(0,2).map(function(o,i){
              return '<div style="display:flex;justify-content:space-between;padding:3px 0;'+(i?'border-top:1px solid #f1f5f9':'')+'">'+
                '<span style="color:#64748b;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(o.marchand_nom||'')+'</span>'+
                '<span style="font-weight:700;color:#1e293b;margin-left:4px">'+fcfa(o.prix)+'</span>'+
              '</div>';
            }).join('')+
          '</div>';
        }).join('')+
      '</div>',
    ].join('');

    // ── Lignes Specs ───────────────────────────────────────────
    var lignesSpecs = toutesSpecs.map(function(key){
      var vals = specsParProduit.map(function(sp){ return sp[key]?sp[key].val:null; });
      var plusGrandMieux = specsParProduit.some(function(sp){ return sp[key]&&sp[key].plus; });
      var maxVal = plusGrandMieux ? Math.max.apply(null, vals.filter(function(v){return v!==null;})) : null;
      return '<div style="'+ROW+'">'+
        '<div style="'+LBL+'">'+key+'</div>'+
        specsParProduit.map(function(sp){
          var s = sp[key];
          if(!s) return '<div style="'+COL+'"><span style="color:#cbd5e1">–</span></div>';
          var best = plusGrandMieux && s.val===maxVal;
          return '<div style="'+COL+(best?';background:#eff6ff':'')+'">'+
            (best?'<div style="font-size:9px;font-weight:800;color:#1d4ed8;margin-bottom:2px">▲ MEILLEUR</div>':'')+
            '<span style="font-size:13px;font-weight:'+(best?'800':'600')+';color:'+(best?'#1d4ed8':'#1e293b')+'">'+s.label+'</span>'+
          '</div>';
        }).join('')+
      '</div>';
    }).join('');

    // ── Historique sparklines ──────────────────────────────────
    var ligneHisto = '<div style="'+ROW+'align-items:center">'+
      '<div style="'+LBL+'">Tendance 90j</div>'+
      produits.map(function(p){
        return '<div style="'+COL+'">'+sparklineHTML(p.historique)+'</div>';
      }).join('')+
    '</div>';

    // ── Score qualité/prix pondéré ────────────────────────────
    // Compter pour chaque produit combien de specs il "gagne"
    var nbSpecsBest = produits.map(function(_, pi) {
      var best = 0;
      toutesSpecs.forEach(function(key) {
        var vals = specsParProduit.map(function(sp){ return sp[key]?sp[key].val:null; });
        var plusGrandMieux = specsParProduit.some(function(sp){ return sp[key]&&sp[key].plus; });
        if (!plusGrandMieux) return;
        var maxV = Math.max.apply(null, vals.filter(function(v){return v!==null;}));
        if (specsParProduit[pi][key] && specsParProduit[pi][key].val === maxV) best++;
      });
      return best;
    });
    var ligneScore = '<div style="'+ROW+'">'+
      '<div style="'+LBL+'">Rapport Q/P</div>'+
      produits.map(function(p,i){
        return '<div style="'+COL+'">'+
          etoilesHTML(calculerScore(prixMins[i],prixMinGlobal,nbSpecsBest[i],toutesSpecs.length))+
        '</div>';
      }).join('')+
    '</div>';

    // ── Boutons Acheter ────────────────────────────────────────
    var ligneBoutons = '<div style="'+ROW+'background:#f8fafc">'+
      '<div style="'+LBL+'"></div>'+
      produits.map(function(p,i){
        var cheap = prixMins[i]&&prixMins[i]===prixMinGlobal;
        var url = p.offres[0]&&p.offres[0].url_achat ? p.offres[0].url_achat : '#';
        return '<div style="'+COL+'">'+
          '<a href="'+url+'" target="_blank" style="display:block;padding:9px 4px;background:'+(cheap?'#10b981':'#1d4ed8')+';color:#fff;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none;text-align:center">Acheter →</a>'+
        '</div>';
      }).join('')+
    '</div>';

    // ── Rendu ──────────────────────────────────────────────────
    var hasPrix  = prefs.sections.indexOf('prix')       !== -1;
    var hasSpecs = prefs.sections.indexOf('specs')      !== -1;
    var hasHisto = prefs.sections.indexOf('historique') !== -1;

    // Badge filtre actif (marchand ou budget)
    var filtresActifs = [];
    if (prefs.marchand)  filtresActifs.push('Marchand : ' + prefs.marchand);
    if (prefs.budgetMax) filtresActifs.push('Budget ≤ ' + (+prefs.budgetMax).toLocaleString('fr-FR') + ' FCFA');

    render([
      '<div style="padding:16px 5% 80px">',
        // Barre de titre
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">',
          '<button onclick="retourListe()" style="background:none;border:none;color:#1d4ed8;font-size:14px;font-weight:600;cursor:pointer;padding:0">← Retour</button>',
          '<h2 style="font-size:16px;font-weight:800;color:#1e293b;margin:0">⚖ Comparaison côte à côte</h2>',
          filtresActifs.length ? '<span style="font-size:11px;background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-weight:600">'+filtresActifs.join(' · ')+'</span>' : '',
          '<div style="margin-left:auto;display:flex;gap:8px">',
            '<button onclick="state.comparePrefsOpen=!state.comparePrefsOpen;ouvrirComparaison()" style="padding:6px 12px;background:'+(state.comparePrefsOpen?'#1d4ed8':'#f1f5f9')+';color:'+(state.comparePrefsOpen?'#fff':'#64748b')+';border:1px solid '+(state.comparePrefsOpen?'#1d4ed8':'#e2e8f0')+';border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">⚙ Paramètres</button>',
            '<button onclick="partagerComparaison()" style="padding:6px 12px;background:#f0fdf4;color:#059669;border:1px solid #bbf7d0;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">📤 Partager</button>',
            '<button onclick="viderComparaison()" style="padding:6px 12px;background:#fef2f2;color:#ef4444;border:1px solid #fecaca;border-radius:8px;font-size:12px;cursor:pointer">✕ Vider</button>',
          '</div>',
        '</div>',
        // Panneau paramètres (conditionnel)
        state.comparePrefsOpen ? htmlParametres() : '',
        // Tableau comparaison
        '<div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:12px;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.06)">',
          // En-tête produits
          '<div style="display:flex;border-bottom:2px solid #e2e8f0;background:#f8fafc">',
            '<div style="width:110px;flex-shrink:0;padding:12px"></div>',
            enTete,
          '</div>',
          // Section Prix
          hasPrix ? '<div style="'+SECT+'">💰 Prix</div>'+lignesPrix : '',
          // Section Specs
          hasSpecs && toutesSpecs.length
            ? '<div style="'+SECT+'">📊 Caractéristiques techniques</div>'+lignesSpecs
            : '',
          // Section Historique
          hasHisto ? '<div style="'+SECT+'">📈 Historique des prix (90j)</div>'+ligneHisto : '',
          // Score Q/P
          '<div style="'+SECT+'">⭐ Rapport qualité / prix</div>',
          ligneScore,
          // Boutons Acheter
          ligneBoutons,
        '</div>',
        '<p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:10px">Prix mis à jour toutes les 4h — vérifiez le prix final sur le site du marchand avant d\'acheter.</p>',
      '</div>',
    ].join(''));
  } catch(err) {
    dbgErr('ouvrirComparaison', err);
    render('<div style="padding:24px 5%"><button onclick="retourListe()" style="background:none;border:none;color:#1d4ed8;cursor:pointer;font-weight:600">← Retour</button><p style="color:#ef4444;margin-top:12px">'+err.message+'</p></div>');
  }
}

// ── Mode comparaison ─────────────────────────────────────────────
var _NOMS_CAT = {
  'smartphones' : 'smartphones',
  'tablette'    : 'tablettes',
  'informatique': 'informatique',
  'tv'          : 'téléviseurs',
  'froid'       : 'réfrigération',
  'clim'        : 'climatisation',
  'audio'       : 'audio / hi-fi',
  'electro'     : 'électroménager',
  'maison'      : 'maison & déco',
  'mode'        : 'mode',
  'auto-moto'   : 'auto-moto',
  'jeux'        : 'jeux vidéo',
  'telecom'     : 'télécom & forfaits',
  'immo'        : 'immobilier',
};

// Mapping sous-type fin → slug DB (pour les appels API)
var _CAT_DB_SLUG = {
  'smartphones' : 'smartphones',
  'tablette'    : 'informatique',
  'informatique': 'informatique',
  'tv'          : 'tv-electro',
  'froid'       : 'tv-electro',
  'clim'        : 'tv-electro',
  'audio'       : 'tv-electro',
  'electro'     : 'tv-electro',
  'maison'      : 'maison',
  'mode'        : 'mode',
  'auto-moto'   : 'auto-moto',
  'jeux'        : 'jeux',
};

function toggleComparer(id, catKeyFallback) {
  var idx = state.comparer.indexOf(id);
  if (idx !== -1) {
    state.comparer.splice(idx, 1);
    if (!state.comparer.length) state.comparerCat = '';
  } else {
    if (state.comparer.length >= 4) { toast('Maximum 4 produits à comparer', '#f97316'); return; }
    var meta   = _productCache[id] || {};
    var effCat = _inferCat(meta.nom || '') || catKeyFallback || '';
    if (effCat && state.comparerCat && state.comparerCat !== effCat) {
      var nomCatActuelle = _NOMS_CAT[state.comparerCat] || state.comparerCat;
      toast('⚠ Type incompatible — sélection en cours : "' + nomCatActuelle + '"', '#ef4444');
      return;
    }
    state.comparer.push(id);
    if (effCat && !state.comparerCat) state.comparerCat = effCat;
  }
  updateNavCompare();
  updateCompareBar();
  if (state.currentPage === 'home') {
    chargerProduits(state.query, state.categorie, state.page);
  }
}

function viderComparaison() {
  state.comparer = [];
  state.comparerCat = '';
  updateNavCompare();
  updateCompareBar();
  toast('Sélection vidée', '#64748b');
  if (state.currentPage === 'compare') retourListe();
  else if (state.currentPage === 'home') chargerProduits(state.query, state.categorie, 1);
}

function toggleFavori(id) {
  var idx = state.favoris.indexOf(id);
  if (idx !== -1) {
    state.favoris.splice(idx, 1);
    toast('Retiré des favoris', '#64748b');
  } else {
    state.favoris.push(id);
    toast('Ajouté aux favoris ❤', '#ef4444');
  }
  localStorage.setItem('yomb_favoris', JSON.stringify(state.favoris));
  updateNavFavoris();
  if (state.currentPage === 'home') {
    chargerProduits(state.query, state.categorie, state.page);
  }
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
function changeVille(v) {
  state.ville = v;
  if (state.categorie === 'immo') {
    _immoState.ville = v;
    chargerImmo(1);
  }
}
function loadPromos()          { chargerProduits('promo','',1); }
function filtrerCategorie(s)   { chargerProduits(state.query, s===state.categorie?'':s, 1); }
function changerTri(v)         { state.tri = v; chargerProduits(state.query, state.categorie, 1); }
function changerVue(v)         { state.vue = v; chargerProduits(state.query, state.categorie, state.page); }
function filtrerBudget(max, min) { state.prixMax = max||''; state.prixMin = min||''; chargerProduits(state.query, state.categorie, 1); }
// BUG FIX : changerTri était défini deux fois (doublon supprimé)
function reinitialiserFiltres() { state.prixMax=''; state.prixMin=''; state.categorie=''; state.tri='pertinence'; chargerProduits('','',1); }

function _appSimFiltres(id) {
  ouvrirProduit(id, {
    prixMax:  parseInt(document.getElementById('sf-max').value||'0',10)||null,
    marchand: document.getElementById('sf-site').value||null,
  });
}


function afficherLogs() {
  navigator.clipboard && navigator.clipboard.writeText(PM_LOGS())
    .then(function() { toast('Logs copiés ✅', '#6366f1'); })
    .catch(function() { alert(PM_LOGS()); });
}


// ═══════════════════════════════════════════════════════════════
//  MARCHANDS
// ═══════════════════════════════════════════════════════════════
var MARCHANDS_LIST = [
  { nom: 'Kanje',                url: 'https://kanje.sn',                  flag: '🛍️' },
  { nom: 'Electronic Corp SN',   url: 'https://electroniccorp.sn',         flag: '📱' },
  { nom: 'Master Office Déco',   url: 'https://masterofficedeco.sn',       flag: '🖥️' },
  { nom: 'Electrolux Dakar',     url: 'https://electroluxdakar.com',       flag: '❄️' },
  { nom: 'Soumari',              url: 'https://www.soumari.com',           flag: '🏪' },
  { nom: 'Kaynoo',               url: 'https://www.kaynoo.sn',            flag: '🛒' },
  { nom: 'Dakar Mondial Tel.',   url: 'https://dakarmondialtelephone.com', flag: '📞' },
  { nom: 'Electroménager Dakar', url: 'https://www.electromenager-dakar.com', flag: '🏠' },
  { nom: 'CoinAfrique',          url: 'https://sn.coinafrique.com',        flag: '🌍' },
];

function htmlMarchands() {
  return [
    '<div class="marchands-section">',
      '<h3>Nos partenaires marchands</h3>',
      '<div class="marchands-grid">',
        MARCHANDS_LIST.map(function(m) {
          return '<a href="' + m.url + '" target="_blank" rel="noopener" class="marchand-chip">' +
            '<span class="dot"></span>' + m.flag + ' ' + m.nom +
          '</a>';
        }).join(''),
      '</div>',
    '</div>',
  ].join('');
}

// ═══════════════════════════════════════════════════════════════
//  FOOTER
// ═══════════════════════════════════════════════════════════════
function htmlFooter() {
  return [
    '<footer>',
      '<div class="footer-top">',

        // Colonne brand
        '<div class="footer-brand">',
          '<span class="logo">Yombale <span>🇸🇳</span></span>',
          '<p>Le premier comparateur de prix dédié au marché sénégalais. Trouvez les meilleures offres sur l\'électronique, l\'électroménager, la mode et plus encore.</p>',
          '<div class="socials">',
            '<a class="social-btn" href="#" title="Facebook">f</a>',
            '<a class="social-btn" href="#" title="Instagram">📷</a>',
            '<a class="social-btn" href="#" title="WhatsApp">💬</a>',
          '</div>',
        '</div>',

        // Liens utiles
        '<div class="footer-col">',
          '<h4>Explorer</h4>',
          '<ul>',
            '<li><a onclick="filtrerCategorie(\'smartphones\')" href="#">Téléphones & Tablettes</a></li>',
            '<li><a onclick="filtrerCategorie(\'informatique\')" href="#">Informatique</a></li>',
            '<li><a onclick="filtrerCategorie(\'tv-electro\')" href="#">TV & Électroménager</a></li>',
            '<li><a onclick="filtrerCategorie(\'mode\')" href="#">Mode & Beauté</a></li>',
            '<li><a onclick="loadPromos()" href="#">Promos du jour</a></li>',
          '</ul>',
        '</div>',

        // Informations
        '<div class="footer-col">',
          '<h4>Informations</h4>',
          '<ul>',
            '<li><a onclick="ouvrirInfoPage(\'comment-ca-marche\')" href="#">Comment ça marche ?</a></li>',
            '<li><a onclick="ouvrirInfoPage(\'signaler-erreur\')" href="#">Signaler une erreur de prix</a></li>',
            '<li><a onclick="ouvrirInfoPage(\'devenir-partenaire\')" href="#">Devenir partenaire</a></li>',
            '<li><a onclick="ouvrirInfoPage(\'ajouter-boutique\')" href="#">Ajouter votre boutique</a></li>',
            '<li><a onclick="ouvrirInfoPage(\'blog\')" href="#">Blog & Conseils</a></li>',
          '</ul>',
        '</div>',

        // Contact
        '<div class="footer-col">',
          '<h4>Contact</h4>',
          '<ul>',
            '<li><a href="mailto:contact@yombale.sn">contact@yombale.sn</a></li>',
            '<li><a href="tel:+221338001234">+221 33 800 12 34</a></li>',
            '<li><a href="#">Dakar, Sénégal</a></li>',
            '<li><a href="#">FAQ</a></li>',
          '</ul>',
        '</div>',

      '</div>',

      // Bandeau confiance
      '<div class="footer-mid">',
        '<p>Les prix affichés sont récupérés <strong>toutes les 6 heures</strong> directement depuis les sites marchands. Yombale n\'est pas vendeur et ne perçoit aucune commission sur les ventes.</p>',
        '<div class="trust-badges">',
          '<span class="tbadge">✅ Gratuit & indépendant</span>',
          '<span class="tbadge">🔄 Mis à jour toutes les 6h</span>',
          '<span class="tbadge">🇸🇳 100% Sénégal</span>',
        '</div>',
      '</div>',

      // Copyright
      '<div class="footer-bottom">',
        '<p>© 2026 Yombale — Comparateur de prix Sénégal</p>',
        '<nav>',
          '<a href="#">Confidentialité</a>',
          '<a href="#">CGU</a>',
          '<a href="#">Cookies</a>',
        '</nav>',
      '</div>',

    '</footer>',
  ].join('');
}

// ═══════════════════════════════════════════════════════════════
//  MODAL CONNEXION / INSCRIPTION
// ═══════════════════════════════════════════════════════════════
var _modalTab = 'connexion'; // connexion | inscription

function showAccount() {
  if (!state.user) { openLoginModal(); return; }
  var menu = document.getElementById('account-menu');
  if (!menu) return;
  if (menu.style.display === 'block') { menu.style.display = 'none'; return; }
  var itemStyle = 'display:block;width:100%;text-align:left;padding:10px 14px;border:none;background:none;font-size:13px;font-weight:600;color:#334155;cursor:pointer';
  menu.innerHTML = [
    '<div style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#94a3b8">Connecté en tant que</div>',
    '<div style="padding:0 14px 10px;font-size:13px;font-weight:700;color:#1e293b;border-bottom:1px solid #f1f5f9">' + state.user.nom + '</div>',
    '<button style="' + itemStyle + '" onclick="fermerMenuCompte();afficherFavoris()">❤ Mes favoris</button>',
    '<button style="' + itemStyle + '" onclick="fermerMenuCompte();depuisMenuPublierAnnonce()">📢 Publier une annonce</button>',
    '<button style="' + itemStyle + '" onclick="fermerMenuCompte();afficherMesAnnonces()">📋 Mes annonces</button>',
    '<button style="' + itemStyle + ';border-top:1px solid #f1f5f9" onclick="fermerMenuCompte();ouvrirDevenirPartenaire()">🤝 Devenir partenaire</button>',
    '<button style="' + itemStyle + ';color:#e63946;border-top:1px solid #f1f5f9" onclick="logout()">🚪 Déconnexion</button>',
  ].join('');
  menu.style.display = 'block';
}

function fermerMenuCompte() {
  var menu = document.getElementById('account-menu');
  if (menu) menu.style.display = 'none';
}

document.addEventListener('click', function(e) {
  var menu = document.getElementById('account-menu');
  if (!menu || menu.style.display !== 'block') return;
  if (!e.target.closest('#account-menu') && !e.target.closest('.nav-user')) {
    menu.style.display = 'none';
  }
});

function logout() {
  state.token = null;
  state.user  = null;
  localStorage.removeItem('pm_token');
  localStorage.removeItem('pm_user');
  updateNavUser();
  fermerMenuCompte();
  toast('Déconnecté', '#64748b');
  if (state.currentPage === 'home') chargerProduits(state.query, state.categorie, 1);
}

function openLoginModal() {
  _modalTab = 'connexion';
  var existing = document.getElementById('login-modal');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'login-modal';
  overlay.className = 'modal-overlay';
  overlay.onclick = function(e) { if (e.target === overlay) closeLoginModal(); };

  overlay.innerHTML = renderLoginModal();
  document.body.appendChild(overlay);
  setTimeout(function() { var inp = document.getElementById('modal-email'); if (inp) inp.focus(); }, 100);
}

function closeLoginModal() {
  var m = document.getElementById('login-modal');
  if (m) m.remove();
}

function switchModalTab(tab) {
  _modalTab = tab;
  var body = document.getElementById('modal-form-body');
  if (body) body.innerHTML = renderModalForm();
  var tabs = document.querySelectorAll('.modal-tab');
  tabs.forEach(function(t) {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
}

function renderLoginModal() {
  return [
    '<div class="modal-box">',
      '<div class="modal-header" style="position:relative">',
        '<button class="modal-close" onclick="closeLoginModal()">✕</button>',
        '<h2>Bienvenue sur Yombale</h2>',
        '<p>Accédez à vos alertes prix et favoris</p>',
      '</div>',
      '<div class="modal-body">',

        // Avantages
        '<div class="login-benefits">',
          '<div class="lbenefit">🔔 <div><strong>Alertes prix</strong> — Soyez notifié quand un prix baisse</div></div>',
          '<div class="lbenefit">❤️ <div><strong>Favoris</strong> — Suivez vos produits préférés</div></div>',
          '<div class="lbenefit">📊 <div><strong>Historique</strong> — Consultez l\'évolution des prix</div></div>',
        '</div>',

        // Onglets
        '<div class="modal-tabs">',
          '<button class="modal-tab active" data-tab="connexion" onclick="switchModalTab(\'connexion\')">Connexion</button>',
          '<button class="modal-tab" data-tab="inscription" onclick="switchModalTab(\'inscription\')">Créer un compte</button>',
        '</div>',

        '<div id="modal-form-body">' + renderModalForm() + '</div>',

      '</div>',
      '<div class="modal-footer">',
        '<p>En continuant, vous acceptez nos <a href="#" style="color:#2563eb">Conditions d\'utilisation</a></p>',
      '</div>',
    '</div>',
  ].join('');
}

function renderModalForm() {
  if (_modalTab === 'connexion') {
    return [
      '<div class="form-group">',
        '<label>Email</label>',
        '<input type="email" id="modal-email" placeholder="votre@email.com">',
      '</div>',
      '<div class="form-group">',
        '<label>Mot de passe</label>',
        '<input type="password" id="modal-password" placeholder="••••••••" onkeydown="if(event.key===\'Enter\')submitLogin()">',
      '</div>',
      '<button class="btn-primary" onclick="submitLogin()">Se connecter →</button>',
      '<p style="text-align:center;font-size:12px;color:#94a3b8;margin-top:12px"><a href="#" style="color:#2563eb">Mot de passe oublié ?</a></p>',
    ].join('');
  } else {
    return [
      '<div class="form-group">',
        '<label>Prénom</label>',
        '<input type="text" id="modal-nom" placeholder="Votre prénom">',
      '</div>',
      '<div class="form-group">',
        '<label>Email</label>',
        '<input type="email" id="modal-email" placeholder="votre@email.com">',
      '</div>',
      '<div class="form-group">',
        '<label>Mot de passe</label>',
        '<input type="password" id="modal-password" placeholder="Minimum 6 caractères" onkeydown="if(event.key===\'Enter\')submitInscription()">',
      '</div>',
      '<button class="btn-primary" onclick="submitInscription()">Créer mon compte →</button>',
    ].join('');
  }
}

function submitLogin() {
  var email = (document.getElementById('modal-email') || {}).value || '';
  var pass  = (document.getElementById('modal-password') || {}).value || '';
  if (!email || !pass) { toast('Remplissez tous les champs', '#ef4444'); return; }

  apiFetch('/auth/connexion', { method: 'POST', body: JSON.stringify({ email: email, mot_de_passe: pass }) })
    .then(function(data) {
      state.token = data.token;
      state.user  = data.user;
      localStorage.setItem('pm_token', data.token);
      localStorage.setItem('pm_user', JSON.stringify(data.user));
      updateNavUser();
      closeLoginModal();
      toast('Bienvenue ' + data.user.nom + ' ! 👋', '#10b981');
    })
    .catch(function(err) {
      toast('Email ou mot de passe incorrect', '#ef4444');
    });
}

function submitInscription() {
  var nom   = (document.getElementById('modal-nom') || {}).value || '';
  var email = (document.getElementById('modal-email') || {}).value || '';
  var pass  = (document.getElementById('modal-password') || {}).value || '';
  if (!nom || !email || !pass) { toast('Remplissez tous les champs', '#ef4444'); return; }
  if (pass.length < 6) { toast('Mot de passe trop court (6 min)', '#ef4444'); return; }

  apiFetch('/auth/inscription', { method: 'POST', body: JSON.stringify({ nom: nom, email: email, mot_de_passe: pass }) })
    .then(function(data) {
      state.token = data.token;
      state.user  = data.user;
      localStorage.setItem('pm_token', data.token);
      localStorage.setItem('pm_user', JSON.stringify(data.user));
      updateNavUser();
      closeLoginModal();
      toast('Compte créé ! Bienvenue ' + data.user.nom + ' 🎉', '#10b981');
    })
    .catch(function(err) {
      toast(err.message || 'Email déjà utilisé', '#ef4444');
    });
}

function updateNavUser() {
  var avatarEl = document.getElementById('nav-avatar');
  var usernameEl = document.getElementById('nav-username');
  if (state.user && avatarEl && usernameEl) {
    avatarEl.textContent = (state.user.nom || 'U').charAt(0).toUpperCase();
    usernameEl.textContent = state.user.nom;
  } else if (avatarEl && usernameEl) {
    avatarEl.textContent = '?';
    usernameEl.textContent = 'Connexion';
  }
}

function updateNavCompare() {
  var btn = document.getElementById('nav-btn-comparer');
  var vid = document.getElementById('nav-btn-vider');
  var cnt = document.getElementById('nav-compare-count');
  if (!btn) return;
  var show = state.comparer.length > 0;
  btn.style.display = show ? 'inline-block' : 'none';
  if (vid) vid.style.display = show ? 'inline-block' : 'none';
  if (cnt) cnt.textContent = state.comparer.length;
  updateCompareBar();
}

function updateCompareBar() {
  var bar    = document.getElementById('compare-bar');
  var items  = document.getElementById('compare-bar-items');
  var barBtn = document.getElementById('compare-bar-btn');
  if (!bar) return;
  if (!state.comparer.length) {
    bar.style.display = 'none';
    document.body.style.paddingBottom = '';
    return;
  }
  bar.style.display = 'flex';
  document.body.style.paddingBottom = '72px';
  if (barBtn) barBtn.textContent = state.comparer.length >= 2 ? '⚖ Comparer (' + state.comparer.length + ')' : 'Ajouter 1 produit →';
  if (items) {
    items.innerHTML = state.comparer.map(function(id) {
      var m   = _productCache[id] || {};
      var nom = m.nom ? (m.nom.length > 28 ? m.nom.slice(0, 28) + '…' : m.nom) : '…';
      return '<div style="display:inline-flex;align-items:center;gap:5px;background:#fff7ed;border:1px solid #fed7aa;' +
        'border-radius:8px;padding:4px 8px 4px 6px;flex-shrink:0;max-width:200px">' +
        (m.image_url
          ? '<img src="' + m.image_url + '" style="width:22px;height:22px;object-fit:contain;flex-shrink:0">'
          : '<span style="font-size:14px">📦</span>') +
        '<span style="font-size:11px;font-weight:600;color:#1e293b;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">' + nom + '</span>' +
        '<button onclick="toggleComparer(\'' + id + '\')" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:13px;line-height:1;padding:0 0 0 2px;flex-shrink:0">×</button>' +
      '</div>';
    }).join('');
  }
}

function updateNavFavoris() {
  var btn = document.getElementById('nav-btn-favoris');
  var cnt = document.getElementById('nav-favoris-count');
  if (!btn) return;
  btn.style.display = state.favoris.length > 0 ? 'inline-block' : 'none';
  if (cnt) cnt.textContent = state.favoris.length;
}

function ouvrirComparaisonNav() {
  if (state.comparer.length < 2) {
    toast('Sélectionne au moins 2 produits ⚖', '#f97316');
    return;
  }
  ouvrirComparaison();
}

document.addEventListener('DOMContentLoaded', function() {
  dbg('DOMContentLoaded');
  updateNavFavoris();
  updateNavUser();
  // Restaurer comparaison depuis URL (?compare=id1,id2,...)
  var urlParams = new URLSearchParams(window.location.search);
  var compareParam = urlParams.get('compare');
  if (compareParam) {
    state.comparer = compareParam.split(',').filter(Boolean).slice(0, 4);
    updateNavCompare();
    updateCompareBar();
  }
  goHome();
});

// ═══════════════════════════════════════════════════════════════
//  PAGES D'INFORMATION — Modals complètes
// ═══════════════════════════════════════════════════════════════

var INFO_PAGES = {

  'comment-ca-marche': {
    titre: 'Comment fonctionne Yombale ?',
    icone: '🔍',
    html: function() { return [
      '<div style="background:linear-gradient(135deg,#1a3a6e,#2563eb);padding:28px;margin:-28px -28px 28px;border-radius:16px 16px 0 0">',
        '<p style="color:rgba(255,255,255,.8);font-size:14px;margin-top:8px;line-height:1.6">',
          'Yombale compare automatiquement les prix chez les meilleurs marchands sénégalais pour vous aider à trouver la meilleure offre sans effort.',
        '</p>',
      '</div>',

      // Étapes
      _etape('1', '🕷️', 'Collecte automatique', 'Nos robots analysent toutes les 6 heures les catalogues de 9 marchands partenaires : Kanje, Electronic Corp, Electrolux Dakar, Soumari, Master Office Déco, Kaynoo, Dakar Mondial Téléphone, Electroménager Dakar et CoinAfrique.'),
      _etape('2', '🔗', 'Regroupement intelligent', 'Les produits identiques vendus par différents marchands sont automatiquement regroupés grâce à leur nom, leur marque et leurs caractéristiques techniques.'),
      _etape('3', '💰', 'Comparaison des prix', 'Pour chaque produit, vous voyez en un coup d\'œil le meilleur prix, l\'économie possible et l\'historique des variations sur 90 jours.'),
      _etape('4', '🛒', 'Achat direct', 'Yombale ne vend rien. Quand vous cliquez "Voir l\'offre", vous êtes redirigé directement vers le site du marchand pour finaliser votre achat.'),

      // FAQ
      '<h3 style="font-size:14px;font-weight:700;color:#1e293b;margin:28px 0 12px">Questions fréquentes</h3>',
      _faq('Les prix sont-ils toujours à jour ?', 'Nos données sont rafraîchies toutes les 6 heures. Un délai peut exister entre la mise à jour sur le site marchand et notre base de données. Vérifiez toujours le prix final sur le site du marchand avant d\'acheter.'),
      _faq('Yombale prend-il une commission ?', 'Non. Yombale est un service de comparaison gratuit et indépendant. Nous ne percevons aucune commission sur les ventes. Notre modèle économique repose sur des partenariats et la publicité.'),
      _faq('Comment un produit est-il ajouté ?', 'Les produits sont ajoutés automatiquement lors du scraping. Vous pouvez aussi signaler un marchand manquant via "Ajouter votre boutique".'),
      _faq('Mes données personnelles sont-elles protégées ?', 'Oui. Yombale respecte la loi sénégalaise n°2008-12 sur la protection des données personnelles et est enregistré auprès de la CDP (Commission de Protection des Données Personnelles).'),
    ].join(''); }
  },

  'signaler-erreur': {
    titre: 'Signaler une erreur de prix',
    icone: '⚠️',
    html: function() { return [
      '<p style="color:#64748b;font-size:14px;margin-bottom:24px;line-height:1.6">',
        'Vous avez repéré un prix incorrect, un lien cassé ou un produit mal catégorisé ? Merci de nous le signaler, nous corrigerons dans les plus brefs délais.',
      '</p>',

      '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;margin-bottom:24px">',
        '<p style="font-size:13px;color:#92400e;font-weight:600;margin:0">⚡ Traitement rapide</p>',
        '<p style="font-size:12px;color:#78350f;margin:4px 0 0">Les signalements sont traités sous 24h. Les prix sont automatiquement re-vérifiés toutes les 6h.</p>',
      '</div>',

      '<div class="form-group"><label>Type d\'erreur</label>',
        '<select style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:11px 14px;font-size:14px;outline:none;background:#fff">',
          '<option>Prix affiché incorrect</option>',
          '<option>Lien cassé (redirige vers la mauvaise page)</option>',
          '<option>Produit hors stock affiché comme disponible</option>',
          '<option>Mauvaise catégorie</option>',
          '<option>Produit en double</option>',
          '<option>Image incorrecte</option>',
          '<option>Autre</option>',
        '</select>',
      '</div>',
      '<div class="form-group"><label>URL du produit sur Yombale</label>',
        '<input type="text" placeholder="https://yombale-production.up.railway.app/..." style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:11px 14px;font-size:14px;outline:none">',
      '</div>',
      '<div class="form-group"><label>Description de l\'erreur</label>',
        '<textarea placeholder="Ex: Le prix affiché est 15 000 FCFA mais sur le site du marchand il est à 150 000 FCFA..." ',
          'style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:11px 14px;font-size:14px;outline:none;height:100px;resize:vertical;font-family:inherit"></textarea>',
      '</div>',
      '<div class="form-group"><label>Votre email (optionnel)</label>',
        '<input type="email" placeholder="pour vous tenir informé de la correction" style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:11px 14px;font-size:14px;outline:none">',
      '</div>',
      '<button onclick="toast(\'Signalement envoyé. Merci ! 🙏\',\'#10b981\');fermerInfoPage()" class="btn-primary" style="margin-top:8px">Envoyer le signalement →</button>',
    ].join(''); }
  },

  'devenir-partenaire': {
    titre: 'Devenir partenaire Yombale',
    icone: '🤝',
    html: function() { return [
      '<p style="color:#64748b;font-size:14px;margin-bottom:24px;line-height:1.6">',
        'Yombale référence déjà <strong>9 marchands</strong> et des milliers de produits. Rejoignez notre réseau pour augmenter votre visibilité auprès des consommateurs sénégalais.',
      '</p>',

      // Avantages
      '<h3 style="font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">Pourquoi rejoindre Yombale ?</h3>',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">',
        _avantage('📈', 'Visibilité accrue', 'Apparaissez dans les recherches de milliers de consommateurs cherchant vos produits'),
        _avantage('🎯', 'Trafic qualifié', 'Les visiteurs de Yombale sont en phase d\'achat actif — conversion élevée'),
        _avantage('💰', 'Gratuit pour démarrer', 'L\'intégration de base est gratuite. Des offres premium sont disponibles'),
        _avantage('🔄', 'Sync automatique', 'Vos prix sont mis à jour automatiquement toutes les 6h'),
      '</div>',

      // Offres
      '<h3 style="font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">Nos offres partenaires</h3>',
      '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px">',
        _offre('Gratuit', '0 FCFA/mois', ['Référencement automatique', 'Mise à jour toutes les 6h', 'Badge marchand vérifié'], false),
        _offre('Premium', '25 000 FCFA/mois', ['Tout le gratuit +', 'Position prioritaire dans les résultats', 'Alertes de baisse de prix pour vos clients', 'Tableau de bord analytique', 'Support dédié'], true),
      '</div>',

      // Contact
      '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px">',
        '<p style="font-size:13px;font-weight:700;color:#15803d;margin:0 0 8px">📧 Contactez-nous</p>',
        '<p style="font-size:13px;color:#166534;margin:0">partenaires@yombale.sn · +221 33 800 12 34</p>',
        '<p style="font-size:12px;color:#166534;margin:6px 0 0">Réponse sous 48h ouvrables</p>',
      '</div>',
    ].join(''); }
  },

  'ajouter-boutique': {
    titre: 'Ajouter votre boutique',
    icone: '🏪',
    html: function() { return [
      '<p style="color:#64748b;font-size:14px;margin-bottom:24px;line-height:1.6">',
        'Votre boutique en ligne n\'est pas encore référencée sur Yombale ? Soumettez votre demande et nous l\'analyserons dans les 72h.',
      '</p>',

      '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px;margin-bottom:24px">',
        '<p style="font-size:13px;color:#1e40af;font-weight:600;margin:0 0 4px">✅ Critères d\'éligibilité</p>',
        '<ul style="font-size:12px;color:#1d4ed8;margin:0;padding-left:16px;line-height:1.8">',
          '<li>Boutique en ligne avec URL publique accessible</li>',
          '<li>Produits avec prix affichés en FCFA</li>',
          '<li>Livraison au Sénégal</li>',
          '<li>Respect de la législation sénégalaise</li>',
        '</ul>',
      '</div>',

      '<div class="form-group"><label>Nom de votre boutique *</label>',
        '<input type="text" id="bq-nom" placeholder="Ex: Dakar Electronics" style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:11px 14px;font-size:14px;outline:none">',
      '</div>',
      '<div class="form-group"><label>URL de votre site *</label>',
        '<input type="url" id="bq-url" placeholder="https://votre-boutique.sn" style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:11px 14px;font-size:14px;outline:none">',
      '</div>',
      '<div class="form-group"><label>Catégories de produits *</label>',
        '<input type="text" placeholder="Ex: Téléphones, Électroménager, Informatique..." style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:11px 14px;font-size:14px;outline:none">',
      '</div>',
      '<div class="form-group"><label>Nombre approximatif de produits</label>',
        '<select style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:11px 14px;font-size:14px;outline:none;background:#fff">',
          '<option>Moins de 50 produits</option>',
          '<option>50 à 200 produits</option>',
          '<option>200 à 500 produits</option>',
          '<option>Plus de 500 produits</option>',
        '</select>',
      '</div>',
      '<div class="form-group"><label>Votre email de contact *</label>',
        '<input type="email" id="bq-email" placeholder="contact@votre-boutique.sn" style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:11px 14px;font-size:14px;outline:none">',
      '</div>',
      '<div class="form-group"><label>Numéro WhatsApp / Téléphone</label>',
        '<input type="tel" placeholder="+221 XX XXX XX XX" style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:11px 14px;font-size:14px;outline:none">',
      '</div>',
      '<button onclick="toast(\'Demande envoyée ! Nous vous contactons sous 72h 📩\',\'#10b981\');fermerInfoPage()" class="btn-primary" style="margin-top:8px">Soumettre ma boutique →</button>',
    ].join(''); }
  },

  'blog': {
    titre: 'Blog & Conseils',
    icone: '📝',
    html: function() { return [
      '<p style="color:#64748b;font-size:14px;margin-bottom:24px">Conseils pratiques pour mieux acheter au Sénégal.</p>',
      _article('💡', 'Comment éviter les arnaques en ligne au Sénégal ?', '15 mai 2026',
        'Vérifiez toujours que le marchand est référencé sur des comparateurs comme Yombale. Méfiez-vous des prix anormalement bas (plus de 50% en dessous du marché). Préférez les paiements via Wave ou Orange Money avec confirmation. Demandez toujours un reçu.'),
      _article('📱', 'Top 5 des smartphones à moins de 150 000 FCFA en 2026', '10 mai 2026',
        'Le marché sénégalais des smartphones évolue rapidement. En 2026, Tecno, Infinix et Samsung dominent le segment entrée/milieu de gamme. Comparaison des meilleurs modèles disponibles chez nos marchands partenaires.'),
      _article('❄️', 'Guide d\'achat : choisir son climatiseur pour le Sénégal', '2 mai 2026',
        'BTU, Inverter, R410A... les termes techniques peuvent intimider. Pour une pièce de 20m² à Dakar, comptez 9000 à 12000 BTU. L\'Inverter coûte plus cher à l\'achat mais économise 30-40% d\'électricité. Nos marchands proposent des splits de 50 000 à 200 000 FCFA selon la capacité.'),
      _article('🛒', '5 astuces pour comparer les prix intelligemment', '25 avril 2026',
        '1. Regardez l\'historique des prix — un prix "promotionnel" était peut-être le prix normal. 2. Comparez le prix total livraison incluse. 3. Vérifiez la garantie. 4. Lisez les avis sur le marchand. 5. Utilisez les alertes prix de Yombale pour être notifié des baisses.'),
    ].join(''); }
  },
};

// ── Helpers pour les pages info ─────────────────────────────────
function _etape(num, icon, titre, texte) {
  return '<div style="display:flex;gap:14px;margin-bottom:20px">' +
    '<div style="width:36px;height:36px;background:#1a3a6e;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0">' + num + '</div>' +
    '<div><div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:4px">' + icon + ' ' + titre + '</div>' +
    '<p style="font-size:13px;color:#64748b;margin:0;line-height:1.6">' + texte + '</p></div>' +
  '</div>';
}
function _faq(q, r) {
  return '<details style="border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;overflow:hidden">' +
    '<summary style="padding:12px 16px;font-size:13px;font-weight:600;color:#1e293b;cursor:pointer;list-style:none">' +
    '❓ ' + q + '</summary>' +
    '<p style="padding:0 16px 14px;margin:0;font-size:13px;color:#64748b;line-height:1.6">' + r + '</p>' +
  '</details>';
}
function _avantage(icon, titre, texte) {
  return '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px">' +
    '<div style="font-size:22px;margin-bottom:6px">' + icon + '</div>' +
    '<div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:4px">' + titre + '</div>' +
    '<p style="font-size:12px;color:#64748b;margin:0;line-height:1.5">' + texte + '</p>' +
  '</div>';
}
function _offre(nom, prix, items, premium) {
  return '<div style="border:' + (premium ? '2px solid #1d4ed8' : '1px solid #e2e8f0') + ';border-radius:12px;padding:16px;' + (premium ? 'background:#eff6ff' : '') + '">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
      '<span style="font-size:14px;font-weight:800;color:#1e293b">' + nom + '</span>' +
      '<span style="font-size:14px;font-weight:700;color:' + (premium ? '#1d4ed8' : '#64748b') + '">' + prix + '</span>' +
    '</div>' +
    '<ul style="margin:0;padding-left:16px;font-size:12px;color:#475569;line-height:1.9">' +
      items.map(function(i) { return '<li>' + i + '</li>'; }).join('') +
    '</ul>' +
  '</div>';
}
function _article(icon, titre, date, extrait) {
  return '<div style="border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin-bottom:14px">' +
    '<div style="font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">' + date + '</div>' +
    '<h3 style="font-size:14px;font-weight:700;color:#1e293b;margin:0 0 10px">' + icon + ' ' + titre + '</h3>' +
    '<p style="font-size:13px;color:#64748b;margin:0;line-height:1.6">' + extrait + '</p>' +
    '<a href="#" style="font-size:12px;color:#1d4ed8;font-weight:600;text-decoration:none;display:inline-block;margin-top:10px">Lire la suite →</a>' +
  '</div>';
}

// ── Rendu modal info ─────────────────────────────────────────────
function ouvrirInfoPage(pageId) {
  var page = INFO_PAGES[pageId];
  if (!page) return;

  var existing = document.getElementById('info-modal');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'info-modal';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);animation:fadeIn .2s ease;overflow-y:auto';
  overlay.onclick = function(e) { if (e.target === overlay) fermerInfoPage(); };

  overlay.innerHTML =
    '<div style="background:#fff;border-radius:20px;width:100%;max-width:540px;max-height:90vh;overflow-y:auto;' +
    'box-shadow:0 24px 80px rgba(0,0,0,.2);animation:slideUp .25s ease;margin:auto">' +
      '<div style="position:sticky;top:0;background:#fff;border-bottom:1px solid #f1f5f9;padding:18px 28px;' +
      'display:flex;justify-content:space-between;align-items:center;border-radius:20px 20px 0 0;z-index:1">' +
        '<h2 style="font-size:16px;font-weight:800;color:#0f172a;margin:0">' + page.icone + ' ' + page.titre + '</h2>' +
        '<button onclick="fermerInfoPage()" style="background:#f1f5f9;border:none;width:32px;height:32px;border-radius:50%;' +
        'font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b">✕</button>' +
      '</div>' +
      '<div style="padding:28px">' + page.html() + '</div>' +
    '</div>';

  document.body.appendChild(overlay);
}

function fermerInfoPage() {
  var m = document.getElementById('info-modal');
  if (m) m.remove();
}

// ═══════════════════════════════════════════════════════════════
//  GUIDE D'ACHAT INTELLIGENT
// ═══════════════════════════════════════════════════════════════

var _guidePrefs = {
  q:          '',
  categorie:  '',
  budgetMin:  '',
  budgetMax:  '',
  poidsPrix:  3,
  poidsSpecs: 3,
  poidsDispo: 2,
  profilActif: '',
};

var GUIDE_PROFILS = [
  { id: 'prix',    label: '💰 Meilleur prix',     desc: 'Priorité au prix le plus bas',         prefs: { poidsPrix:5, poidsSpecs:1, poidsDispo:2 } },
  { id: 'rapport', label: '⭐ Rapport Q/P',        desc: 'Équilibre prix et caractéristiques',   prefs: { poidsPrix:3, poidsSpecs:4, poidsDispo:2 } },
  { id: 'haut',    label: '🚀 Haut de gamme',      desc: 'Priorité aux meilleures specs',        prefs: { poidsPrix:1, poidsSpecs:5, poidsDispo:2 } },
  { id: 'dispo',   label: '🏪 Bien distribué',     desc: 'Disponible chez plusieurs marchands',  prefs: { poidsPrix:2, poidsSpecs:3, poidsDispo:5 } },
];

var _POIDS_LABELS = ['', 'Peu important', 'Secondaire', 'Équilibré', 'Important', 'Prioritaire'];

function ouvrirGuideAchat() {
  var appEl = document.getElementById('app');
  if (appEl) appEl.style.cssText = '';
  state.currentPage = 'guide';

  render([
    '<div style="padding:16px 5% 80px">',

      // Titre
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">',
        '<button onclick="retourListe()" style="background:none;border:none;color:#1d4ed8;font-size:14px;font-weight:600;cursor:pointer;padding:0">← Retour</button>',
        '<h2 style="font-size:18px;font-weight:800;color:#1e293b;margin:0">🏆 Guide d\'achat intelligent</h2>',
      '</div>',
      '<p style="color:#64748b;font-size:13px;margin:0 0 24px;padding-left:0">Définissez vos critères — Yombale calcule un score et classe les produits pour vous.</p>',

      // ── Profils rapides ──
      '<div style="margin-bottom:22px">',
        '<div style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Profil d\'achat</div>',
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">',
          GUIDE_PROFILS.map(function(p) {
            return [
              '<button id="profil-btn-' + p.id + '" onclick="appliquerProfilGuide(\'' + p.id + '\')" ',
                'style="padding:12px 14px;border:1.5px solid #e2e8f0;border-radius:10px;text-align:left;',
                'background:#fff;cursor:pointer;transition:all .15s">',
                '<div style="font-size:13px;font-weight:700;color:#1e293b">' + p.label + '</div>',
                '<div style="font-size:11px;color:#94a3b8;margin-top:2px">' + p.desc + '</div>',
              '</button>',
            ].join('');
          }).join(''),
        '</div>',
      '</div>',

      // ── Paramètres ──
      '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin-bottom:20px">',
        '<div style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em;margin-bottom:16px">Paramètres personnalisés</div>',

        // Recherche libre
        '<div style="margin-bottom:14px">',
          '<label style="font-size:12px;font-weight:600;color:#334155;display:block;margin-bottom:5px">🔍 Que recherchez-vous ?</label>',
          '<input id="guide-q" type="text" placeholder="ex: smartphone Samsung, TV 55 pouces, frigo 300L..." ',
            'value="' + (_guidePrefs.q||'') + '" ',
            'style="width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box" ',
            'onkeydown="if(event.key===\'Enter\')lancerGuideAchat()">',
        '</div>',

        // Catégorie
        '<div style="margin-bottom:14px">',
          '<label style="font-size:12px;font-weight:600;color:#334155;display:block;margin-bottom:5px">Catégorie</label>',
          '<select id="guide-cat" style="width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;background:#fff;color:#1e293b">',
            '<option value="">Toutes les catégories</option>',
            CATEGORIES.map(function(c) {
              return '<option value="' + c.slug + '"' + (_guidePrefs.categorie===c.slug?' selected':'') + '>' + c.icon + ' ' + c.label + '</option>';
            }).join(''),
          '</select>',
        '</div>',

        // Budget
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">',
          '<div>',
            '<label style="font-size:12px;font-weight:600;color:#334155;display:block;margin-bottom:5px">Budget min (FCFA)</label>',
            '<input id="guide-min" type="number" placeholder="ex: 5 000" value="' + (_guidePrefs.budgetMin||'') + '" ',
              'style="width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box">',
          '</div>',
          '<div>',
            '<label style="font-size:12px;font-weight:600;color:#334155;display:block;margin-bottom:5px">Budget max (FCFA)</label>',
            '<input id="guide-max" type="number" placeholder="ex: 200 000" value="' + (_guidePrefs.budgetMax||'') + '" ',
              'style="width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box">',
          '</div>',
        '</div>',

        // Sliders poids
        _sliderGuide('guide-poids-prix',  '💰 Importance du prix',              _guidePrefs.poidsPrix),
        _sliderGuide('guide-poids-specs', '📊 Importance des caractéristiques', _guidePrefs.poidsSpecs),
        _sliderGuide('guide-poids-dispo', '🏪 Importance de la disponibilité',  _guidePrefs.poidsDispo),

        // Bouton lancer
        '<button onclick="lancerGuideAchat()" ',
          'style="width:100%;padding:13px;background:linear-gradient(135deg,#1d4ed8,#3b82f6);',
          'color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-top:4px">',
          '🔍 Trouver les meilleurs produits',
        '</button>',
      '</div>',

      // Zone résultats
      '<div id="guide-resultats"></div>',

    '</div>',
  ].join(''));
}

function _sliderGuide(id, label, val) {
  return [
    '<div style="margin-bottom:12px">',
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">',
        '<label style="font-size:12px;font-weight:600;color:#334155">' + label + '</label>',
        '<span id="' + id + '-lbl" style="font-size:11px;font-weight:700;color:#6366f1;min-width:110px;text-align:right">' + _POIDS_LABELS[val] + '</span>',
      '</div>',
      '<input type="range" min="1" max="5" value="' + val + '" id="' + id + '" ',
        'oninput="document.getElementById(\'' + id + '-lbl\').textContent=' +
          '[\'\',' + _POIDS_LABELS.slice(1).map(function(l){return '\''+l+'\'';}).join(',') + '][this.value-1]" ',
        'style="width:100%;accent-color:#1d4ed8">',
    '</div>',
  ].join('');
}

function appliquerProfilGuide(profilId) {
  var profil = GUIDE_PROFILS.find(function(p){ return p.id === profilId; });
  if (!profil) return;
  _guidePrefs.profilActif = profilId;

  // Mettre à jour les sliders visuellement
  var ids = { poidsPrix:'guide-poids-prix', poidsSpecs:'guide-poids-specs', poidsDispo:'guide-poids-dispo' };
  Object.keys(ids).forEach(function(k) {
    var el = document.getElementById(ids[k]);
    var lb = document.getElementById(ids[k] + '-lbl');
    if (el) { el.value = profil.prefs[k]; }
    if (lb) { lb.textContent = _POIDS_LABELS[profil.prefs[k]]; }
  });

  // Surbrillance profil actif
  GUIDE_PROFILS.forEach(function(p) {
    var btn = document.getElementById('profil-btn-' + p.id);
    if (!btn) return;
    var actif = p.id === profilId;
    btn.style.borderColor = actif ? '#1d4ed8' : '#e2e8f0';
    btn.style.background  = actif ? '#eff6ff' : '#fff';
  });
}

async function lancerGuideAchat() {
  var q         = ((document.getElementById('guide-q')          || {}).value || '').trim();
  var cat       = (document.getElementById('guide-cat')        || {}).value || '';
  var budgetMin = parseInt((document.getElementById('guide-min') || {}).value || '0') || null;
  var budgetMax = parseInt((document.getElementById('guide-max') || {}).value || '0') || null;
  var poidsPrix  = parseInt((document.getElementById('guide-poids-prix')  || {}).value || '3');
  var poidsSpecs = parseInt((document.getElementById('guide-poids-specs') || {}).value || '3');
  var poidsDispo = parseInt((document.getElementById('guide-poids-dispo') || {}).value || '2');

  _guidePrefs = { q: q, categorie: cat, budgetMin: budgetMin||'', budgetMax: budgetMax||'',
                  poidsPrix: poidsPrix, poidsSpecs: poidsSpecs, poidsDispo: poidsDispo,
                  profilActif: _guidePrefs.profilActif };

  var resEl = document.getElementById('guide-resultats');
  if (resEl) resEl.innerHTML = '<div class="loader"><div class="spin"></div><p>Analyse en cours...</p></div>';

  try {
    var params = new URLSearchParams({
      q: q || '', categorie: cat, limit: 48, page: 1,
      prixMin: budgetMin || '', prixMax: budgetMax || '',
      tri: 'pertinence',
    });
    var data    = await apiFetch('/produits?' + params.toString());
    var produits = ((data && data.produits) || []).filter(function(p){ return +p.prix_min > 0; });

    if (!produits.length) {
      if (resEl) resEl.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:32px 0">Aucun produit trouvé avec ces critères.</p>';
      return;
    }

    // ── Valeurs de référence ──────────────────────────────────
    var prixMinRef    = Math.min.apply(null, produits.map(function(p){ return +p.prix_min; }));
    var nbOffresMaxRef= Math.max.apply(null, produits.map(function(p){ return +(p.nb_offres)||0; })) || 1;

    // Extraire les specs de chaque produit et calculer les maximums par critère
    var specsListe = produits.map(function(p){ return extraireSpecs(p.nom); });
    var specKeys   = [];
    specsListe.forEach(function(s){
      Object.keys(s).forEach(function(k){ if (specKeys.indexOf(k) === -1) specKeys.push(k); });
    });
    var specMaxes = {};
    specKeys.forEach(function(k){
      var vals = specsListe.map(function(s){ return s[k] ? s[k].val : null; }).filter(function(v){ return v !== null; });
      specMaxes[k] = vals.length ? Math.max.apply(null, vals) : null;
    });

    // ── Scoring ───────────────────────────────────────────────
    var totalPoids = poidsPrix + poidsSpecs + poidsDispo;
    produits = produits.map(function(p, i) {
      // Score prix : 1 = le moins cher, diminue avec l'écart
      var sPrix  = prixMinRef / +p.prix_min;

      // Score specs : proportion de critères où ce produit est dans le top 10%
      var sp = specsListe[i];
      var specWins = 0;
      specKeys.forEach(function(k) {
        if (!sp[k] || !specMaxes[k]) return;
        if (sp[k].val >= specMaxes[k] * 0.9) specWins++;
      });
      var sSpecs = specKeys.length > 0 ? specWins / specKeys.length : 0.5;

      // Score disponibilité : proportion du marchand le mieux distribué
      var sDispo = (+(p.nb_offres)||0) / nbOffresMaxRef;

      // Score final pondéré /10
      var score = Math.round(
        ((poidsPrix * sPrix + poidsSpecs * sSpecs + poidsDispo * sDispo) / totalPoids) * 100
      ) / 10;

      p._score  = score;
      p._sPrix  = Math.round(sPrix  * 100);
      p._sSpecs = Math.round(sSpecs * 100);
      p._sDispo = Math.round(sDispo * 100);
      return p;
    });

    // Stocker pour tri dynamique
    _guideScored = produits;
    _guideTotal  = data.total;
    afficherGuideResultats('score');

  } catch(err) {
    dbgErr('lancerGuideAchat', err);
    var resEl2 = document.getElementById('guide-resultats');
    if (resEl2) resEl2.innerHTML = '<p style="color:#ef4444;padding:16px">' + err.message + '</p>';
  }
}

function _barreScore(label, pct, couleur) {
  return '<div style="display:flex;align-items:center;gap:4px">' +
    '<span style="font-size:10px;color:#94a3b8;min-width:26px">' + label + '</span>' +
    '<div style="width:44px;height:4px;background:#f1f5f9;border-radius:2px;overflow:hidden">' +
      '<div style="width:' + pct + '%;height:100%;background:' + couleur + ';border-radius:2px"></div>' +
    '</div>' +
    '<span style="font-size:10px;font-weight:700;color:' + couleur + '">' + pct + '%</span>' +
  '</div>';
}

// ── Cache résultats guide ─────────────────────────────────────────
var _guideScored = [];
var _guideTotal  = 0;

function afficherGuideResultats(triPar) {
  var resEl = document.getElementById('guide-resultats');
  if (!resEl || !_guideScored.length) return;
  triPar = triPar || 'score';

  var sorted = _guideScored.slice();
  if      (triPar === 'prix')  sorted.sort(function(a,b){ return +a.prix_min - +b.prix_min; });
  else if (triPar === 'specs') sorted.sort(function(a,b){ return b._sSpecs - a._sSpecs; });
  else if (triPar === 'dispo') sorted.sort(function(a,b){ return +(b.nb_offres||0) - +(a.nb_offres||0); });
  else                         sorted.sort(function(a,b){ return b._score - a._score; });

  var top        = sorted.slice(0, 12);
  var poidsPrix  = _guidePrefs.poidsPrix;
  var poidsSpecs = _guidePrefs.poidsSpecs;
  var poidsDispo = _guidePrefs.poidsDispo;

  var profilLabel = '';
  if (_guidePrefs.profilActif) {
    var pf = GUIDE_PROFILS.find(function(p){ return p.id === _guidePrefs.profilActif; });
    if (pf) profilLabel = ' · Profil : ' + pf.label;
  }

  var TRIS = [
    { id:'score', label:'🏆 Score' },
    { id:'prix',  label:'💰 Prix'  },
    { id:'specs', label:'📊 Specs' },
    { id:'dispo', label:'🏪 Dispo' },
  ];

  resEl.innerHTML = [
    '<div>',
      // En-tête + tri
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">',
        '<h3 style="font-size:15px;font-weight:800;color:#1e293b;margin:0">🏆 Recommandations</h3>',
        '<span style="font-size:12px;color:#94a3b8">' + _guideTotal + ' produits analysés' + profilLabel + '</span>',
        '<div style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">',
          TRIS.map(function(t) {
            var act = t.id === triPar;
            return '<button onclick="afficherGuideResultats(\'' + t.id + '\')" ' +
              'style="padding:4px 10px;border-radius:16px;border:1px solid ' + (act?'#1d4ed8':'#e2e8f0') + ';' +
              'background:' + (act?'#1d4ed8':'#fff') + ';color:' + (act?'#fff':'#64748b') + ';' +
              'font-size:11px;font-weight:700;cursor:pointer">' + t.label + '</button>';
          }).join(''),
        '</div>',
      '</div>',

      // Critères actifs
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;padding:8px 12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">',
        '<span style="font-size:11px;color:#64748b;font-weight:600">Pondération :</span>',
        poidsPrix  > 1 ? '<span style="font-size:11px;font-weight:700;color:#10b981">💰 Prix ×' + poidsPrix  + '</span>' : '',
        poidsSpecs > 1 ? '<span style="font-size:11px;font-weight:700;color:#6366f1">📊 Specs ×' + poidsSpecs + '</span>' : '',
        poidsDispo > 1 ? '<span style="font-size:11px;font-weight:700;color:#f97316">🏪 Dispo ×' + poidsDispo + '</span>' : '',
      '</div>',

      // Grille résultats (2 colonnes sur desktop)
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:10px">',
        top.map(function(p, i) {
          _productCache[p.id] = { nom: p.nom, image_url: p.image_url };
          var medal      = i===0?'🥇':i===1?'🥈':i===2?'🥉':'<span style="font-size:13px;font-weight:700;color:#94a3b8">'+(i+1)+'</span>';
          var scoreColor = p._score>=7?'#10b981':p._score>=5?'#f97316':'#ef4444';
          var enCompare  = state.comparer.indexOf(p.id) !== -1;
          var enFavori   = state.favoris.indexOf(p.id) !== -1;
          var border     = i===0?'#10b981':'#e2e8f0';
          return [
            '<div style="background:#fff;border:1.5px solid '+border+';border-radius:12px;padding:14px;',
              'display:flex;gap:12px;align-items:flex-start;cursor:pointer;',
              (i===0?'box-shadow:0 2px 14px rgba(16,185,129,.15)':'') + '" ',
              'onclick="ouvrirProduit(\''+p.id+'\')" ',
              'onmouseover="this.style.borderColor=\'#1d4ed8\'" ',
              'onmouseout="this.style.borderColor=\''+border+'\'">',

              // Médaille + image
              '<div style="flex-shrink:0;text-align:center;width:72px">',
                '<div style="font-size:20px;margin-bottom:3px">'+medal+'</div>',
                '<div style="width:60px;height:60px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;',
                  'display:flex;align-items:center;justify-content:center;overflow:hidden;margin:0 auto">',
                  (p.image_url?'<img src="'+p.image_url+'" style="max-width:56px;max-height:56px;object-fit:contain" loading="lazy">':'<span style="font-size:24px">📦</span>'),
                '</div>',
                // Score
                '<div style="margin-top:4px;font-size:16px;font-weight:800;color:'+scoreColor+'">'+p._score+'<span style="font-size:9px;color:#94a3b8">/10</span></div>',
              '</div>',

              // Infos
              '<div style="flex:1;min-width:0">',
                i===0?'<div style="font-size:10px;font-weight:800;color:#10b981;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">✓ Meilleur choix</div>':'',
                '<div style="font-size:13px;font-weight:700;color:#1e293b;line-height:1.35;margin-bottom:2px;',
                  'overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">'+p.nom+'</div>',
                p.marque?'<div style="font-size:11px;color:#94a3b8;margin-bottom:4px">'+p.marque+'</div>':'',
                '<div style="font-size:16px;font-weight:900;color:#15803d;margin-bottom:4px">'+fcfa(p.prix_min)+'</div>',
                '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">',
                  poidsPrix  > 1 ? _barreScore('Prix',  p._sPrix,  '#10b981') : '',
                  poidsSpecs > 1 ? _barreScore('Specs', p._sSpecs, '#6366f1') : '',
                  poidsDispo > 1 ? _barreScore('Dispo', p._sDispo, '#f97316') : '',
                '</div>',
                '<div style="display:flex;gap:5px">',
                  '<button onclick="event.stopPropagation();toggleComparer(\'' + p.id + '\',\'' + _inferCat(p.nom||'') + '\')" ',
                    'style="padding:4px 9px;border-radius:6px;border:1px solid '+(enCompare?'#1d4ed8':'#e2e8f0')+';',
                    'background:'+(enCompare?'#eff6ff':'#fff')+';cursor:pointer;font-size:11px;font-weight:700;',
                    'color:'+(enCompare?'#1d4ed8':'#475569')+';white-space:nowrap">',
                    enCompare?'✓ Comparé':'⚖ Comparer',
                  '</button>',
                  '<button onclick="event.stopPropagation();toggleFavori(\''+p.id+'\')" ',
                    'style="padding:4px 8px;border-radius:6px;border:1px solid '+(enFavori?'#ef4444':'#e2e8f0')+';',
                    'background:'+(enFavori?'#fef2f2':'#fff')+';cursor:pointer;font-size:12px">',
                    enFavori?'❤':'🤍',
                  '</button>',
                '</div>',
              '</div>',
            '</div>',
          ].join('');
        }).join(''),
      '</div>',

      // Bouton lancer comparaison si ≥ 2 produits sélectionnés
      state.comparer.length >= 2
        ? '<div style="text-align:center;margin-top:16px"><button onclick="ouvrirComparaison()" ' +
            'style="padding:12px 32px;background:#f97316;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">⚖ Comparer les ' +
            state.comparer.length + ' produits sélectionnés →</button></div>'
        : '<p style="text-align:center;font-size:12px;color:#94a3b8;margin-top:12px">Sélectionne ⚖ sur 2 produits pour les comparer côte à côte.</p>',

    '</div>',
  ].join('');
}

// ── Partager comparaison ──────────────────────────────────────────
function partagerComparaison() {
  if (!state.comparer.length) return;
  var url = window.location.origin + window.location.pathname + '?compare=' + state.comparer.join(',');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function() {
      toast('Lien copié ! Partagez-le pour retrouver cette comparaison 📤', '#059669');
    });
  } else {
    var ta = document.createElement('textarea');
    ta.value = url;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); toast('Lien copié ! 📤', '#059669'); } catch(e) {}
    document.body.removeChild(ta);
  }
}

// ── Favoris ──────────────────────────────────────────────────────
async function afficherFavoris() {
  if (!state.favoris.length) {
    toast('Aucun favori — clique ❤ sur un produit pour le sauvegarder', '#64748b');
    return;
  }
  state.currentPage = 'favoris';
  render('<div class="loader"><div class="spin"></div><p>Chargement des favoris...</p></div>');
  try {
    var produits = await Promise.all(
      state.favoris.map(function(id) { return apiFetch('/produits/' + id).catch(function(){ return null; }); })
    );
    produits = produits.filter(Boolean);
    render([
      '<div style="padding:24px 5% 80px">',
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">',
          '<button onclick="retourListe()" style="background:none;border:none;color:#1d4ed8;font-size:14px;font-weight:600;cursor:pointer;padding:0">← Retour</button>',
          '<h2 style="font-size:18px;font-weight:800;color:#1e293b;margin:0">❤ Mes favoris</h2>',
          '<span style="font-size:13px;color:#94a3b8">' + produits.length + ' produit(s)</span>',
          '<button onclick="state.favoris=[];localStorage.setItem(\'yomb_favoris\',\'[]\');updateNavFavoris();retourListe()" style="margin-left:auto;padding:6px 12px;background:#fef2f2;color:#ef4444;border:1px solid #fecaca;border-radius:8px;font-size:12px;cursor:pointer">✕ Tout effacer</button>',
        '</div>',
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">',
          produits.map(function(p) { return carteHTML(p); }).join(''),
        '</div>',
      '</div>',
    ].join(''));
  } catch(err) {
    render('<div style="padding:24px 5%"><button onclick="retourListe()" style="background:none;border:none;color:#1d4ed8;cursor:pointer;font-weight:600">← Retour</button><p style="color:#ef4444;margin-top:12px">'+err.message+'</p></div>');
  }
}
