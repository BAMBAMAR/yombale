// PrixMalin — JavaScript frontend principal
var API   = '/api';
var state = {
  user:  null,
  ville: 'Dakar',
  token: localStorage.getItem('pm_token')
};

// Appel API avec JWT automatique
async function apiFetch(endpoint, options) {
  options = options || {};
  var headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = 'Bearer ' + state.token;
  var res  = await fetch(API + endpoint, Object.assign({}, options, { headers: headers }));
  var data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

function toast(msg, couleur) {
  var el = document.getElementById('toast');
  el.textContent  = msg;
  el.style.background = couleur || '#10b981';
  el.classList.add('show');
  setTimeout(function() { el.classList.remove('show'); }, 3000);
}

function fcfa(n) { return Number(n).toLocaleString('fr-FR') + ' FCFA'; }
function render(html) { document.getElementById('app').innerHTML = html; }

async function chargerProduits(query, categorie) {
  render('<div class="loader"><div class="spin"></div><p>Chargement...</p></div>');
  try {
    var p    = new URLSearchParams({ q: query || '', categorie: categorie || '', limit: 12 });
    var data = await apiFetch('/produits?' + p.toString());
    render(templateProduits(data.produits || []));
  } catch (err) {
    render('<div class="loader"><p>' + err.message + '</p></div>');
  }
}

function templateProduits(produits) {
  if (!produits.length) return '<div class="loader"><p>Aucun produit trouvé.</p></div>';

  var cartes = produits.map(function(p) {
    return [
      '<div class="pcard" onclick="ouvrirProduit(\'' + p.id + '\')">',
        '<div class="pimg">',
          p.image_url
            ? '<img src="' + p.image_url + '" alt="' + p.nom + '">'
            : '<span style="font-size:48px">📦</span>',
        '</div>',
        '<div class="pbody">',
          '<div class="pname">'   + p.nom              + '</div>',
          '<div class="pbrand">'  + (p.marque || '')   + '</div>',
          '<div class="pprice">'  + fcfa(p.prix_min||0) + '</div>',
          '<div class="poffers">' + (p.nb_offres||0)   + ' offre(s) · ' + state.ville + '</div>',
          '<button class="btn-voir">Comparer les offres</button>',
        '</div>',
      '</div>'
    ].join('');
  }).join('');

  return [
    '<section class="hero">',
      '<h1>Meilleur prix au <span>Sénégal</span></h1>',
      '<p style="opacity:.85;margin-bottom:20px">Jumia · Expat-Dakar · Dakar-Deal · CoinAfrique</p>',
      '<div class="sbar">',
        '<input type="text" id="search-input" placeholder="Samsung Galaxy, TV Hisense, Nike..." onkeydown="if(event.key===\'Enter\')doSearch()">',
        '<button onclick="doSearch()">Rechercher</button>',
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
    var res     = await Promise.all([apiFetch('/produits/' + id), apiFetch('/produits/' + id + '/offres')]);
    var produit = res[0], offres = res[1];

    var lignes = offres.map(function(o, i) {
      return [
        '<div class="orow' + (i === 0 ? ' best' : '') + '">',
          '<span>' + o.marchand_nom + '</span>',
          '<strong>' + fcfa(o.prix) + '</strong>',
          '<a href="' + (o.url_achat || '#') + '" target="_blank" class="btn-go">Acheter</a>',
        '</div>'
      ].join('');
    }).join('');

    render([
      '<div style="padding:24px 5%">',
        '<button onclick="goHome()" style="background:none;border:none;color:#1d4ed8;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:16px">← Retour</button>',
        '<h2 style="font-size:22px;font-weight:800;margin-bottom:6px">'  + produit.nom             + '</h2>',
        '<p style="color:#94a3b8;margin-bottom:16px">'                   + (produit.marque || '')   + ' · ' + state.ville + '</p>',
        '<div class="offres">' + lignes + '</div>',
        '<button onclick="ouvrirAlerteModal(\'' + id + '\')" style="margin-top:12px;background:#fff;color:#1d4ed8;border:1.5px solid #1d4ed8;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer">',
          '🔔 Créer une alerte prix',
        '</button>',
      '</div>'
    ].join(''));
  } catch (err) {
    render('<div class="loader"><p>Erreur : ' + err.message + '</p></div>');
  }
}

function goHome()      { chargerProduits(''); }
function loadPromos()  { chargerProduits('promo solde'); }
function changeVille(v){ state.ville = v; chargerProduits(''); }

function showAccount() {
  if (!state.user) {
    toast('Connexion requise', '#f97316');
    return;
  }
  toast('Bonjour ' + state.user.nom + ' !');
}

function ouvrirAlerteModal(produitId) {
  var email = prompt('Votre email pour l\'alerte :');
  var prix  = prompt('Prix cible en FCFA :');
  if (!email || !prix) return;
  apiFetch('/alertes', {
    method: 'POST',
    body:   JSON.stringify({ produit_id: produitId, prix_cible: parseInt(prix), email: email })
  }).then(function() {
    toast('✅ Alerte créée !');
  }).catch(function(err) {
    toast('Erreur : ' + err.message, '#ef4444');
  });
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