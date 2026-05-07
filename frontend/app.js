// Yombale — JavaScript frontend
var API   = '/api';
var state = {
  user:  null,
  ville: 'Dakar',
  token: localStorage.getItem('pm_token')
};

function apiFetch(endpoint, options) {
  options = options || {};
  var headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = 'Bearer ' + state.token;

  var controller = new AbortController();
  var tid = setTimeout(function() { controller.abort(); }, 10000);

  return fetch(API + endpoint, Object.assign({}, options, {
    headers: headers,
    signal: controller.signal
  }))
    .then(function(res) {
      clearTimeout(tid);
      return res.json().then(function(data) {
        if (!res.ok) throw new Error(data.error || 'Erreur serveur');
        return data;
      });
    })
    .catch(function(err) {
      clearTimeout(tid);
      if (err.name === 'AbortError') throw new Error('Délai dépassé — serveur trop lent');
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

// ── Chargement des produits ──────────────────────────────────
function chargerProduits(query, categorie) {
  render('<div class="loader"><div class="spin"></div><p>Chargement des offres...</p></div>');
  var params = new URLSearchParams({
    q:         query     || '',
    categorie: categorie || '',
    limit:     12
  });
  apiFetch('/produits?' + params.toString())
    .then(function(data) {
      var produits = (data && Array.isArray(data.produits)) ? data.produits
                   : Array.isArray(data) ? data
                   : [];
      if (!produits.length) {
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
          '</div>'
        ].join(''));
        return;
      }
      render(templateProduits(produits));
    })
    .catch(function(err) {
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
          '<h3 style="margin-bottom:8px">Site en cours de configuration</h3>',
          '<p style="font-size:13px">Revenez dans quelques minutes.</p>',
          '<p style="font-size:11px;color:#94a3b8;margin-top:6px">' + err.message + '</p>',
        '</div>'
      ].join(''));
    });
}

function templateProduits(produits) {
  var cartes = produits.map(function(p) {
    return [
      '<div class="pcard" onclick="ouvrirProduit(\'' + p.id + '\')">',
        '<div class="pimg">',
          '<span style="font-size:48px">📦</span>',
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
  }).join('');

  return [
    '<section class="hero">',
      '<h1>Meilleur prix au <span>Sénégal</span></h1>',
      '<p style="opacity:.85;margin-bottom:20px">Bu yombale bi ! 🇸🇳</p>',
      '<div class="sbar">',
        '<input type="text" id="search-input" placeholder="Samsung, TV Hisense, Nike..." onkeydown="if(event.key===\'Enter\')doSearch()">',
        '<button onclick="doSearch()">🔍 Comparer</button>',
      '</div>',
    '</section>',
    '<section class="products">',
      '<div class="pgrid">' + cartes + '</div>',
    '</section>'
  ].join('');
}

function doSearch() {
  var q = document.getElementById('search-input');
  if (q) chargerProduits(q.value);
}

async function ouvrirProduit(id) {
  render('<div class="loader"><div class="spin"></div><p>Chargement...</p></div>');
  try {
    var res     = await apiFetch('/produits/' + id);
    var offres  = await apiFetch('/produits/' + id + '/offres');

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
        '<button onclick="goHome()" style="background:none;border:none;color:#1d4ed8;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:16px">← Retour</button>',
        '<h2 style="font-size:20px;font-weight:800;margin-bottom:4px">' + res.nom + '</h2>',
        '<p style="color:#94a3b8;margin-bottom:16px">' + (res.marque || '') + ' · ' + state.ville + '</p>',
        '<div class="offres">' + lignes + '</div>',
      '</div>'
    ].join(''));
  } catch (err) {
    render('<div style="padding:24px 5%"><button onclick="goHome()">← Retour</button><p style="margin-top:12px;color:#ef4444">' + err.message + '</p></div>');
  }
}

function goHome()     { chargerProduits(''); }
function changeVille(v) { state.ville = v; chargerProduits(''); }
function loadPromos()   { chargerProduits('promo'); }
function showAccount()  {
  if (state.user) {
    toast('Connecté en tant que ' + state.user.nom, '#6366f1');
  } else {
    toast('Connexion bientôt disponible 🔐', '#6366f1');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  var saved = localStorage.getItem('pm_user');
  if (saved) {
    try {
      state.user = JSON.parse(saved);
      var av = document.getElementById('nav-avatar');
      var un = document.getElementById('nav-username');
      if (av) av.textContent = state.user.nom.substring(0, 2).toUpperCase();
      if (un) un.textContent = state.user.nom;
    } catch(e) {}
  }
  goHome();
});
