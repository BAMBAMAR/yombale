// Yombale — JavaScript frontend
var API   = '/api';
var state = {
  user:      null,
  ville:     'Dakar',
  token:     localStorage.getItem('pm_token'),
  page:      1,
  pageTotal: 1,
  query:     '',
  categorie: '',
  tri:       'pertinence',  // pertinence | prix_asc | prix_desc | nom_asc
  prixMax:   ''
};

// ── Diagnostic logger ────────────────────────────────────────
var _log = [];
function dbg(etape, detail) {
  var ts   = new Date().toISOString().slice(11, 23);
  var line = '[' + ts + '] ' + etape + (detail !== undefined ? ' → ' + JSON.stringify(detail) : '');
  _log.push(line);
  console.log('%c[PM]', 'color:#1d4ed8;font-weight:bold', etape, detail !== undefined ? detail : '');
}
function dbgErr(etape, err) {
  var ts   = new Date().toISOString().slice(11, 23);
  var line = '[' + ts + '] ❌ ' + etape + ' → ' + (err && err.message ? err.message : String(err));
  _log.push(line);
  console.error('%c[PM]', 'color:#ef4444;font-weight:bold', etape, err);
}

// Depuis la console du navigateur : copy(PM_LOGS())
window.PM_LOGS = function() { return _log.join('\n'); };

// ── apiFetch avec timeout + logs ─────────────────────────────
function apiFetch(endpoint, options) {
  options = options || {};
  var headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = 'Bearer ' + state.token;

  var url        = API + endpoint;
  var controller = new AbortController();
  var tid        = setTimeout(function() {
    dbgErr('apiFetch TIMEOUT', { url: url });
    controller.abort();
  }, 10000);

  dbg('apiFetch START', url);

  return fetch(url, Object.assign({}, options, {
    headers: headers,
    signal:  controller.signal
  }))
    .then(function(res) {
      clearTimeout(tid);
      dbg('apiFetch RESPONSE', { url: url, status: res.status, ok: res.ok });
      return res.json().then(function(data) {
        if (!res.ok) {
          dbgErr('apiFetch HTTP ' + res.status, data);
          throw new Error(data.error || 'Erreur serveur ' + res.status);
        }
        dbg('apiFetch OK', { url: url, keys: Object.keys(data) });
        return data;
      });
    })
    .catch(function(err) {
      clearTimeout(tid);
      if (err.name === 'AbortError') {
        var e = new Error('Délai dépassé (10 s) — serveur trop lent');
        dbgErr('apiFetch ABORT', e);
        throw e;
      }
      dbgErr('apiFetch CATCH', err);
      throw err;
    });
}

function toast(msg, couleur) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.style.background = couleur || '#10b981';
  el.classList.add('show');
  setTimeout(function() { el.classList.remove('show'); }, 3000);
}

function fcfa(n) { return Number(n || 0).toLocaleString('fr-FR') + ' FCFA'; }
function render(html) {
  var app = document.getElementById('app');
  if (app) app.innerHTML = html;
}

// ── Afficher / copier les logs ────────────────────────────────
function afficherLogs() {
  var txt = PM_LOGS();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(txt)
      .then(function() { toast('Logs copiés dans le presse-papiers ✅', '#6366f1'); })
      .catch(function() { _showLogsModal(txt); });
  } else {
    _showLogsModal(txt);
  }
}

function _showLogsModal(txt) {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;' +
    'display:flex;align-items:center;justify-content:center;padding:16px';
  overlay.innerHTML =
    '<div style="background:#fff;border-radius:12px;padding:20px;max-width:600px;width:100%;' +
      'max-height:80vh;display:flex;flex-direction:column;gap:12px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<strong style="color:#1e293b">Logs de diagnostic Yombale</strong>' +
        '<button onclick="this.closest(\'div[style*=position]\').remove()" ' +
          'style="background:none;border:none;font-size:20px;cursor:pointer;color:#64748b">✕</button>' +
      '</div>' +
      '<textarea readonly style="font-family:monospace;font-size:11px;flex:1;min-height:300px;' +
        'border:1px solid #e2e8f0;border-radius:6px;padding:10px;color:#334155;resize:vertical">' +
        txt +
      '</textarea>' +
      '<button onclick="navigator.clipboard&&navigator.clipboard.writeText(this.previousElementSibling.value).then(function(){alert(\'Copié !\')})" ' +
        'style="padding:8px;background:#1d4ed8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">' +
        '📋 Copier</button>' +
    '</div>';
  document.body.appendChild(overlay);
}

// ── Retour à la liste en conservant la recherche ─────────────
function retourListe() {
  chargerProduits(state.query, state.categorie, state.page || 1);
}

// ── Détection intelligente budget dans la recherche ──────────
// "écouteurs moins de 15000" → { q: 'écouteurs', prixMax: 15000 }
// "nike plus de 5000"        → { q: 'nike', prixMin: 5000 }
function parseSmartSearch(raw) {
  var q = raw.trim();
  var prixMax = null, prixMin = null;

  var mMax = q.match(/(?:moins\s+de|max|maximum|jusqu(?:['']|\s+)(?:à|a)|<)\s*([0-9\s]+)/i);
  var mMin = q.match(/(?:plus\s+de|min|minimum|au[-\s]dessus\s+de|>)\s*([0-9\s]+)/i);

  if (mMax) { prixMax = parseInt(mMax[1].replace(/\s/g,''), 10); q = q.replace(mMax[0], '').trim(); }
  if (mMin) { prixMin = parseInt(mMin[1].replace(/\s/g,''), 10); q = q.replace(mMin[0], '').trim(); }

  // Nettoyer les connecteurs résiduels
  q = q.replace(/\b(fcfa|cfa|f\b|pour|environ|autour|de|à|a)\b/gi, '').replace(/\s+/g, ' ').trim();

  return { q: q, prixMax: prixMax, prixMin: prixMin };
}
function chargerProduits(query, categorie, page) {
  page      = page      || 1;
  query     = query     !== undefined ? query     : state.query;
  categorie = categorie !== undefined ? categorie : state.categorie;

  // Mise à jour état global
  state.query     = query;
  state.categorie = categorie;
  state.page      = page;

  dbg('chargerProduits CALL', { query: query, categorie: categorie, page: page });

  if (page === 1) {
    render('<div class="loader"><div class="spin"></div><p>Chargement des offres...</p></div>');
  } else {
    // Ajouter spinner sous les cartes existantes
    var section = document.querySelector('.products');
    if (section) {
      var spinner = document.createElement('div');
      spinner.id  = 'load-more-spinner';
      spinner.className = 'loader';
      spinner.innerHTML = '<div class="spin"></div><p>Chargement...</p>';
      section.appendChild(spinner);
    }
  }

  var params = new URLSearchParams({
    q:         query     || '',
    categorie: categorie || '',
    limit:     24,
    page:      page,
    tri:       state.tri,
    prixMax:   state.prixMax || ''
  });

  apiFetch('/produits?' + params.toString())
    .then(function(data) {
      var produits = (data && Array.isArray(data.produits)) ? data.produits
                   : Array.isArray(data) ? data
                   : [];
      state.pageTotal = data.pages || 1;

      dbg('chargerProduits DATA', { nb: produits.length, total: data.total, pages: data.pages, keys: Object.keys(data) });

      if (!produits.length && page === 1) {
        dbg('chargerProduits EMPTY');
        render([
          '<section class="hero">',
            '<h1>Meilleur prix au <span>Sénégal</span></h1>',
            '<p style="opacity:.85;margin-bottom:20px">Bu yombale bi ! 🇸🇳</p>',
            '<div class="sbar">',
              '<input type="text" id="search-input" placeholder="Samsung, TV, Nike...">',
              '<button onclick="doSearch()">🔍</button>',
            '</div>',
          '</section>',
          '<div style="text-align:center;padding:48px 20px;color:#64748b">',
            '<div style="font-size:48px;margin-bottom:12px">🛒</div>',
            '<h3 style="margin-bottom:8px">Aucun produit pour l\'instant</h3>',
            '<p style="font-size:13px">Les produits seront ajoutés très bientôt.</p>',
            '<p style="font-size:13px;color:#f97316;margin-top:8px;font-weight:600">Bu yombale bi ! 🇸🇳</p>',
            '<button onclick="afficherLogs()" style="margin-top:24px;padding:8px 16px;',
              'background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;',
              'font-size:11px;color:#64748b;cursor:pointer">',
              '🔍 Logs de diagnostic',
            '</button>',
          '</div>'
        ].join(''));
        return;
      }

      dbg('chargerProduits RENDER', produits.length + ' produits (page ' + page + '/' + state.pageTotal + ')');

      if (page === 1) {
        render(templateProduits(produits, data));
      } else {
        // Supprimer spinner
        var sp = document.getElementById('load-more-spinner');
        if (sp) sp.remove();
        // Retirer l'ancien bouton "Charger plus"
        var oldBtn = document.getElementById('btn-charger-plus');
        if (oldBtn) oldBtn.remove();
        // Ajouter les nouvelles cartes
        var grid = document.querySelector('.pgrid');
        if (grid) {
          var tmp = document.createElement('div');
          tmp.innerHTML = produits.map(carteHTML).join('');
          while (tmp.firstChild) grid.appendChild(tmp.firstChild);
        }
        // Ré-afficher bouton si nécessaire
        if (page < state.pageTotal) {
          var section2 = document.querySelector('.products');
          if (section2) section2.insertAdjacentHTML('beforeend', btnChargerPlus(data));
        } else {
          var section3 = document.querySelector('.products');
          if (section3) section3.insertAdjacentHTML('beforeend',
            '<p id="fin-liste" style="text-align:center;padding:16px 0;color:#94a3b8;font-size:13px">' +
            '✅ Tous les ' + data.total + ' produits sont affichés</p>');
        }
      }
    })
    .catch(function(err) {
      dbgErr('chargerProduits ERROR', err);
      var sp = document.getElementById('load-more-spinner');
      if (sp) sp.remove();
      if (page === 1) {
        render([
          '<section class="hero">',
            '<h1>Meilleur prix au <span>Sénégal</span></h1>',
            '<div class="sbar">',
              '<input type="text" id="search-input" placeholder="Samsung, TV, Nike...">',
              '<button onclick="doSearch()">🔍</button>',
            '</div>',
          '</section>',
          '<div style="text-align:center;padding:48px 20px;color:#64748b">',
            '<div style="font-size:48px;margin-bottom:12px">⚙️</div>',
            '<h3 style="margin-bottom:8px">Erreur de chargement</h3>',
            '<p style="font-size:13px;color:#ef4444;font-weight:600;margin-bottom:12px">' + err.message + '</p>',
            '<div style="margin:0 auto 16px;max-width:480px;padding:12px;background:#fef2f2;',
              'border:1px solid #fecaca;border-radius:8px;text-align:left;',
              'font-size:10px;font-family:monospace;color:#991b1b;white-space:pre-wrap;',
              'max-height:200px;overflow-y:auto" id="debug-box">' + _log.join('\n') + '</div>',
            '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">',
              '<button onclick="goHome()" style="padding:8px 20px;background:#1d4ed8;color:#fff;',
                'border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer">',
                '🔄 Réessayer',
              '</button>',
              '<button onclick="afficherLogs()" style="padding:8px 16px;background:#f1f5f9;',
                'border:1px solid #e2e8f0;border-radius:6px;font-size:12px;color:#64748b;cursor:pointer">',
                '📋 Copier les logs',
              '</button>',
            '</div>',
          '</div>'
        ].join(''));
      } else {
        toast('Erreur lors du chargement de la page suivante', '#ef4444');
      }
    });
}

function carteHTML(p) {
  return [
    '<div class="pcard" onclick="ouvrirProduit(\'' + p.id + '\')">',
      '<div class="pimg">',
        p.image_url
          ? '<img src="' + p.image_url + '" alt="' + p.nom + '" style="width:100%;height:100%;object-fit:contain">'
          : '<span style="font-size:48px">📦</span>',
      '</div>',
      '<div class="pbody">',
        '<div class="pname">' + p.nom + '</div>',
        '<div class="pbrand">' + (p.marque || '') + '</div>',
        '<div class="pprice">' + fcfa(p.prix_min) + '</div>',
        '<div class="poffers">' + (p.nb_offres || 0) + ' offre(s) · ' + state.ville + '</div>',
        '<button class="btn-voir">Comparer</button>',
      '</div>',
    '</div>'
  ].join('');
}

function btnChargerPlus(data) {
  var restant = data.total - (state.page * 24);
  return '<div id="btn-charger-plus" style="text-align:center;padding:24px 0">' +
    '<button onclick="chargerProduits(state.query, state.categorie, state.page + 1)" ' +
      'style="padding:12px 32px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;' +
      'font-size:14px;font-weight:700;cursor:pointer">' +
      '⬇ Charger plus (' + Math.max(restant, 0) + ' restants)' +
    '</button>' +
    '<p style="font-size:12px;color:#94a3b8;margin-top:8px">' +
      'Page ' + data.page + ' sur ' + data.pages +
    '</p>' +
  '</div>';
}

function barFiltres(data) {
  var categories = [
    { slug: '',               label: 'Toutes' },
    { slug: 'electronique',   label: '📱 Électronique' },
    { slug: 'electromenager', label: '🏠 Électroménager' },
    { slug: 'mode',           label: '👗 Mode' },
    { slug: 'alimentation',   label: '🛒 Alimentation' },
    { slug: 'informatique',   label: '💻 Informatique' },
    { slug: 'sport',          label: '⚽ Sport' }
  ];

  var catOptions = categories.map(function(c) {
    return '<option value="' + c.slug + '"' + (state.categorie === c.slug ? ' selected' : '') + '>' + c.label + '</option>';
  }).join('');

  var triOptions = [
    { val: 'pertinence', label: '🎯 Pertinence' },
    { val: 'prix_asc',   label: '⬆ Prix croissant' },
    { val: 'prix_desc',  label: '⬇ Prix décroissant' },
    { val: 'nom_asc',    label: '🔤 Nom A→Z' }
  ].map(function(t) {
    return '<option value="' + t.val + '"' + (state.tri === t.val ? ' selected' : '') + '>' + t.label + '</option>';
  }).join('');

  var selectStyle = 'padding:7px 10px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;' +
    'background:#fff;color:#334155;cursor:pointer;outline:none;min-width:0';

  var activeFilters = [];
  if (state.categorie) activeFilters.push(state.categorie);
  if (state.prixMax)   activeFilters.push('max ' + fcfa(state.prixMax));

  return [
    '<div id="barre-filtres" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;',
      'padding:12px 5%;background:#f8fafc;border-bottom:1px solid #e2e8f0">',

      // Catégorie
      '<select onchange="appliquerFiltre(\'categorie\',this.value)" style="' + selectStyle + '">',
        catOptions,
      '</select>',

      // Tri
      '<select onchange="appliquerFiltre(\'tri\',this.value)" style="' + selectStyle + '">',
        triOptions,
      '</select>',

      // Prix max
      '<div style="display:flex;align-items:center;gap:4px;border:1px solid #e2e8f0;',
        'border-radius:8px;background:#fff;padding:4px 8px;min-width:0">',
        '<span style="font-size:12px;color:#94a3b8;white-space:nowrap">Max</span>',
        '<input type="number" id="input-prix-max" placeholder="ex: 50000" value="' + (state.prixMax || '') + '"',
          ' min="0" step="1000"',
          ' style="border:none;outline:none;width:90px;font-size:13px;color:#334155"',
          ' onkeydown="if(event.key===\'Enter\')appliquerFiltre(\'prixMax\',this.value)">',
        '<span style="font-size:11px;color:#94a3b8">FCFA</span>',
      '</div>',

      // Bouton appliquer prix
      '<button onclick="appliquerFiltre(\'prixMax\',document.getElementById(\'input-prix-max\').value)" ',
        'style="padding:7px 12px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;',
        'font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">Appliquer</button>',

      // Reset si filtres actifs
      activeFilters.length ? [
        '<button onclick="reinitialiserFiltres()" ',
          'style="padding:7px 12px;background:#fef2f2;color:#ef4444;border:1px solid #fecaca;',
          'border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">',
          '✕ Réinitialiser</button>'
      ].join('') : '',

      // Compteur
      data ? '<span style="font-size:12px;color:#94a3b8;margin-left:auto">' + data.total + ' produit(s)</span>' : '',

    '</div>'
  ].join('');
}

function appliquerFiltre(cle, valeur) {
  if (cle === 'categorie') state.categorie = valeur;
  else if (cle === 'tri')  state.tri       = valeur;
  else if (cle === 'prixMax') state.prixMax = valeur ? parseInt(valeur, 10) : '';
  chargerProduits(state.query, state.categorie, 1);
}

function reinitialiserFiltres() {
  state.categorie = '';
  state.tri       = 'pertinence';
  state.prixMax   = '';
  chargerProduits(state.query, '', 1);
}

function templateProduits(produits, data) {
  var cartes = produits.map(carteHTML).join('');
  var plus   = (data && data.page < data.pages) ? btnChargerPlus(data) : (
    data && data.total > 24
      ? '<p style="text-align:center;padding:16px 0;color:#94a3b8;font-size:13px">✅ Tous les ' + data.total + ' produits sont affichés</p>'
      : ''
  );

  return [
    '<section class="hero">',
      '<h1>Meilleur prix au <span>Sénégal</span></h1>',
      '<p style="opacity:.85;margin-bottom:20px">Bu yombale bi ! 🇸🇳</p>',
      '<div class="sbar">',
        '<input type="text" id="search-input" placeholder="Samsung, TV Hisense, Nike..."',
          ' onkeydown="if(event.key===\'Enter\')doSearch()">',
        '<button onclick="doSearch()">🔍 Comparer</button>',
      '</div>',
    '</section>',
    barFiltres(data),
    '<section class="products">',
      '<div class="pgrid">' + cartes + '</div>',
      plus,
    '</section>'
  ].join('');
}

function doSearch() {
  var input = document.getElementById('search-input');
  if (!input) return;
  var parsed = parseSmartSearch(input.value);
  if (parsed.prixMax) state.prixMax = parsed.prixMax;
  if (parsed.prixMin) state.prixMin = parsed.prixMin;
  chargerProduits(parsed.q, state.categorie, 1);
}

async function ouvrirProduit(id, filtresSim) {
  filtresSim = filtresSim || {};
  dbg('ouvrirProduit', id);
  render('<div class="loader"><div class="spin"></div><p>Chargement...</p></div>');
  try {
    var res    = await apiFetch('/produits/' + id);
    var offres = await apiFetch('/produits/' + id + '/offres');
    var histo  = await apiFetch('/produits/' + id + '/historique').catch(function() { return []; });

    // Construire URL similaires avec filtres
    var simParams = new URLSearchParams({
      limit:   8,
      prixMax: filtresSim.prixMax || '',
      prixMin: filtresSim.prixMin || '',
      marque:  filtresSim.marque  || '',
      marchand:filtresSim.marchand|| ''
    });
    var similaires = await apiFetch('/produits/' + id + '/similaires?' + simParams.toString())
                           .catch(function() { return { produits: [] }; });

    var prixMin = offres.length ? Math.min.apply(null, offres.map(function(o) { return o.prix; })) : 0;

    // Extraire marques et marchands uniques pour les filtres
    var marques   = [...new Set(offres.map(function(o) { return o.marchand_nom; }).filter(Boolean))];
    var marchands = marques; // même données pour l'instant

    // ─── Lignes d'offres ──────────────────────────────────
    var lignes = (offres || []).map(function(o, i) {
      var isBest = o.prix === prixMin;
      var ecart  = isBest ? 0 : o.prix - prixMin;
      return [
        '<div class="orow' + (isBest ? ' best' : '') + '">',
          '<div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">',
            isBest ? '<span style="background:#10b981;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:12px;white-space:nowrap">🏆 Meilleur</span>' : '',
            '<a href="' + (o.site_url || '#') + '" target="_blank" rel="noopener" ' +
              'style="font-weight:600;color:#1e293b;text-decoration:none;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
              (o.marchand_nom || 'Marchand') +
            '</a>',
          '</div>',
          '<div style="display:flex;align-items:center;gap:10px;flex-shrink:0">',
            '<div style="text-align:right">',
              '<strong style="font-size:15px;color:' + (isBest ? '#10b981' : '#1e293b') + '">' + fcfa(o.prix) + '</strong>',
              ecart > 0 ? '<div style="font-size:11px;color:#ef4444">+' + fcfa(ecart) + '</div>' : '',
            '</div>',
            '<a href="' + (o.url_achat || '#') + '" target="_blank" rel="noopener" class="btn-go" onclick="event.stopPropagation()">Acheter →</a>',
          '</div>',
        '</div>'
      ].join('');
    }).join('') || '<p style="color:#64748b;font-size:13px;padding:12px">Aucune offre disponible.</p>';

    // ─── Historique SVG ───────────────────────────────────
    var graphHTML = '';
    if (histo && histo.length > 1) {
      var prix  = histo.map(function(h) { return parseFloat(h.prix_min); });
      var dates = histo.map(function(h) { return h.jour ? h.jour.slice(0, 10) : ''; });
      var minP  = Math.min.apply(null, prix), maxP = Math.max.apply(null, prix);
      var W = 340, H = 90, padX = 8, padY = 10, rangeP = maxP - minP || 1;
      var points = prix.map(function(v, i) {
        var x = padX + (i / (prix.length - 1)) * (W - padX * 2);
        var y = padY + (1 - (v - minP) / rangeP) * (H - padY * 2);
        return x.toFixed(1) + ',' + y.toFixed(1);
      });
      graphHTML = [
        '<div style="margin-top:20px">',
          '<h4 style="font-size:12px;font-weight:700;color:#475569;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">📈 Historique 90 jours</h4>',
          '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px">',
            '<svg viewBox="0 0 ' + W + ' ' + (H + 20) + '" style="width:100%;display:block">',
              '<line x1="' + padX + '" y1="' + (H - padY) + '" x2="' + (W - padX) + '" y2="' + (H - padY) + '" stroke="#e2e8f0" stroke-width="1"/>',
              '<polyline points="' + points.join(' ') + '" fill="none" stroke="#1d4ed8" stroke-width="2" stroke-linejoin="round"/>',
              '<circle cx="' + points[0].split(',')[0] + '" cy="' + points[0].split(',')[1] + '" r="3" fill="#1d4ed8"/>',
              '<circle cx="' + points[points.length-1].split(',')[0] + '" cy="' + points[points.length-1].split(',')[1] + '" r="3" fill="#1d4ed8"/>',
              '<text x="' + padX + '" y="' + (H + 14) + '" font-size="9" fill="#94a3b8">' + (dates[0] || '') + '</text>',
              '<text x="' + (W - padX) + '" y="' + (H + 14) + '" font-size="9" fill="#94a3b8" text-anchor="end">' + (dates[dates.length-1] || '') + '</text>',
              '<text x="' + (W - padX + 2) + '" y="' + (padY + 4) + '" font-size="9" fill="#10b981">' + fcfa(maxP) + '</text>',
              '<text x="' + (W - padX + 2) + '" y="' + (H - padY) + '" font-size="9" fill="#ef4444">' + fcfa(minP) + '</text>',
            '</svg>',
          '</div>',
        '</div>'
      ].join('');
    }

    // ─── Filtres similaires ───────────────────────────────
    var selectStyle = 'padding:6px 8px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;background:#fff;color:#334155;cursor:pointer;outline:none';

    var filtresHTML = [
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:12px">',
        '<p style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">🔎 Affiner la recherche de produits similaires</p>',
        '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">',

          // Prix max
          '<div style="display:flex;align-items:center;gap:4px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;padding:5px 8px">',
            '<span style="font-size:11px;color:#94a3b8">Max</span>',
            '<input type="number" id="sim-prix-max" placeholder="15000" value="' + (filtresSim.prixMax || '') + '"',
              ' style="border:none;outline:none;width:70px;font-size:12px;color:#334155">',
            '<span style="font-size:11px;color:#94a3b8">FCFA</span>',
          '</div>',

          // Prix min
          '<div style="display:flex;align-items:center;gap:4px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;padding:5px 8px">',
            '<span style="font-size:11px;color:#94a3b8">Min</span>',
            '<input type="number" id="sim-prix-min" placeholder="5000" value="' + (filtresSim.prixMin || '') + '"',
              ' style="border:none;outline:none;width:70px;font-size:12px;color:#334155">',
            '<span style="font-size:11px;color:#94a3b8">FCFA</span>',
          '</div>',

          // Filtre marchand
          '<select id="sim-marchand" style="' + selectStyle + '">',
            '<option value="">Tous les sites</option>',
            ['Jumia Senegal','Expat-Dakar','CoinAfrique'].map(function(m) {
              return '<option value="' + m + '"' + (filtresSim.marchand === m ? ' selected' : '') + '>' + m + '</option>';
            }).join(''),
          '</select>',

          '<button onclick="_appliquerSimFiltres(\'' + id + '\')" ',
            'style="padding:6px 14px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">',
            'Appliquer</button>',

          filtresSim.prixMax || filtresSim.prixMin || filtresSim.marchand
            ? '<button onclick="ouvrirProduit(\'' + id + '\')" style="padding:6px 10px;background:#fef2f2;color:#ef4444;border:1px solid #fecaca;border-radius:8px;font-size:11px;cursor:pointer">✕ Reset</button>'
            : '',
        '</div>',
      '</div>'
    ].join('');

    // ─── Grille similaires ────────────────────────────────
    var simHTML = '';
    if (similaires.produits && similaires.produits.length) {
      var simCartes = similaires.produits.map(function(p) {
        return [
          '<div onclick="ouvrirProduit(\'' + p.id + '\')" ',
            'style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px;cursor:pointer;',
            'display:flex;flex-direction:column;gap:6px;transition:box-shadow .15s" ',
            'onmouseover="this.style.boxShadow=\'0 4px 12px rgba(0,0,0,.1)\'" ',
            'onmouseout="this.style.boxShadow=\'none\'">',
            '<div style="width:100%;height:80px;background:#f8fafc;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:4px">',
              p.image_url
                ? '<img src="' + p.image_url + '" style="max-height:80px;object-fit:contain" loading="lazy">'
                : '<span style="font-size:32px">📦</span>',
            '</div>',
            '<div style="font-size:12px;font-weight:600;color:#1e293b;line-height:1.3">' + p.nom + '</div>',
            p.marque ? '<div style="font-size:11px;color:#94a3b8">' + p.marque + '</div>' : '',
            p.prix_min ? '<div style="font-size:14px;font-weight:800;color:#10b981">' + fcfa(p.prix_min) + '</div>' : '<div style="font-size:12px;color:#cbd5e1">Prix N/D</div>',
            '<div style="font-size:11px;color:#94a3b8">' + (p.nb_offres || 0) + ' offre(s)</div>',
          '</div>'
        ].join('');
      }).join('');
      simHTML = [
        '<div style="margin-top:24px">',
          '<h3 style="font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px">',
            '🔄 Produits similaires (' + similaires.produits.length + ')',
          '</h3>',
          filtresHTML,
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px">',
            simCartes,
          '</div>',
        '</div>'
      ].join('');
    } else {
      simHTML = [
        '<div style="margin-top:24px">',
          '<h3 style="font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px">🔄 Produits similaires</h3>',
          filtresHTML,
          '<p style="color:#94a3b8;font-size:13px;text-align:center;padding:20px 0">Aucun produit similaire trouvé avec ces filtres.</p>',
        '</div>'
      ].join('');
    }

    render([
      '<div style="padding:20px 5%;max-width:700px;margin:0 auto">',
        '<button onclick="retourListe()" style="background:none;border:none;color:#1d4ed8;',
          'font-size:14px;font-weight:600;cursor:pointer;margin-bottom:20px;padding:0">← Retour</button>',

        // En-tête
        '<div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:20px">',
          '<div style="width:80px;height:80px;flex-shrink:0;background:#f1f5f9;border-radius:10px;',
            'display:flex;align-items:center;justify-content:center;overflow:hidden">',
            res.image_url
              ? '<img src="' + res.image_url + '" style="width:100%;height:100%;object-fit:contain">'
              : '<span style="font-size:36px">📦</span>',
          '</div>',
          '<div style="flex:1;min-width:0">',
            '<h2 style="font-size:17px;font-weight:800;margin:0 0 4px;color:#1e293b">' + res.nom + '</h2>',
            '<p style="color:#94a3b8;font-size:12px;margin:0 0 6px">' +
              (res.marque || '') + (res.categorie_nom ? ' · ' + res.categorie_nom : '') +
            '</p>',
            offres.length
              ? '<div style="font-size:20px;font-weight:800;color:#10b981">' + fcfa(prixMin) +
                  '<span style="font-size:11px;color:#64748b;font-weight:400;margin-left:6px">dès</span></div>'
              : '',
            '<div style="font-size:11px;color:#94a3b8;margin-top:2px">' + offres.length + ' offre(s) · ' + state.ville + '</div>',
          '</div>',
        '</div>',

        '<h3 style="font-size:12px;font-weight:700;color:#475569;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">Comparer les prix</h3>',
        '<div class="offres">' + lignes + '</div>',
        graphHTML,
        simHTML,
      '</div>'
    ].join(''));
  } catch (err) {
    dbgErr('ouvrirProduit', err);
    render('<div style="padding:24px 5%"><button onclick="retourListe()" ' +
      'style="background:none;border:none;color:#1d4ed8;font-size:14px;font-weight:600;cursor:pointer">← Retour</button>' +
      '<p style="margin-top:12px;color:#ef4444">' + err.message + '</p></div>');
  }
}

function _appliquerSimFiltres(id) {
  ouvrirProduit(id, {
    prixMax:  parseInt(document.getElementById('sim-prix-max').value || '0', 10) || null,
    prixMin:  parseInt(document.getElementById('sim-prix-min').value || '0', 10) || null,
    marchand: document.getElementById('sim-marchand').value || null
  });
}

function goHome()       { chargerProduits('', '', 1); }
function changeVille(v) { state.ville = v; chargerProduits(state.query, state.categorie, 1); }
function loadPromos()   { chargerProduits('promo', '', 1); }
function showAccount()  {
  if (state.user) {
    toast('Connecté en tant que ' + state.user.nom, '#6366f1');
  } else {
    toast('Connexion bientôt disponible 🔐', '#6366f1');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  dbg('DOMContentLoaded');
  dbg('navigator.onLine', navigator.onLine);
  dbg('serviceWorker support', 'serviceWorker' in navigator);
  goHome();
});
