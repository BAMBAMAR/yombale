// Yombale — JavaScript frontend
var API   = '/api';
var state = {
  user:      null,
  ville:     'Dakar',
  token:     localStorage.getItem('pm_token'),
  page:      1,
  pageTotal: 1,
  query:     '',
  categorie: ''
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

// ── Chargement des produits ──────────────────────────────────
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
    page:      page
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
    '<section class="products">',
      data ? '<p style="font-size:12px;color:#94a3b8;text-align:right;padding:0 5% 8px">' + data.total + ' produit(s) trouvé(s)</p>' : '',
      '<div class="pgrid">' + cartes + '</div>',
      plus,
    '</section>'
  ].join('');
}

function doSearch() {
  var q = document.getElementById('search-input');
  if (q) chargerProduits(q.value);
}

async function ouvrirProduit(id) {
  dbg('ouvrirProduit', id);
  render('<div class="loader"><div class="spin"></div><p>Chargement...</p></div>');
  try {
    var res    = await apiFetch('/produits/' + id);
    var offres = await apiFetch('/produits/' + id + '/offres');

    var lignes = (offres || []).map(function(o, i) {
      return [
        '<div class="orow' + (i === 0 ? ' best' : '') + '">',
          '<span>' + (o.marchand_nom || o.marchand || 'Marchand') + '</span>',
          '<strong>' + fcfa(o.prix) + '</strong>',
          '<a href="' + (o.url_achat || '#') + '" target="_blank" class="btn-go">Voir</a>',
        '</div>'
      ].join('');
    }).join('') || '<p style="color:#64748b;font-size:13px;padding:12px">Aucune offre disponible.</p>';

    render([
      '<div style="padding:24px 5%">',
        '<button onclick="goHome()" style="background:none;border:none;color:#1d4ed8;',
          'font-size:14px;font-weight:600;cursor:pointer;margin-bottom:16px">← Retour</button>',
        '<h2 style="font-size:20px;font-weight:800;margin-bottom:4px">' + res.nom + '</h2>',
        '<p style="color:#94a3b8;margin-bottom:16px">' + (res.marque || '') + ' · ' + state.ville + '</p>',
        '<div class="offres">' + lignes + '</div>',
      '</div>'
    ].join(''));
  } catch (err) {
    dbgErr('ouvrirProduit', err);
    render('<div style="padding:24px 5%"><button onclick="goHome()">← Retour</button>' +
      '<p style="margin-top:12px;color:#ef4444">' + err.message + '</p></div>');
  }
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
