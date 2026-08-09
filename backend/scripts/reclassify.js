require('dotenv').config({path: __dirname + '/../.env'});
const { pool } = require('../models/db');
const { CATEGORIES_MOTS } = require('../services/scraper-immo-facebook');

// We need to re-extract CATEGORIES_MOTS if it's not exported.
// Let's check if it's exported. It probably isn't. So I'll just copy the detecterCategorie logic here.

const CATEGORIES_MOTS_LOCAL = [
  { slug: 'auto-moto',   mots: ['voiture', 'moto', 'scooter', 'jakarta', 'vehicule', 'véhicule',
                                 'pneu', 'moteur voiture', 'ford', 'toyota', 'hyundai', 'kia', 'peugeot', 'chevrolet', 'fiat',
                                 'renault', 'nissan', 'mercedes', 'bmw', 'suv', '4x4', 'dedouane', 'dédouané', 'venant',
                                 'diesel', 'essence', 'manuelle', 'automatique', 'carburant'] },
  { slug: 'immo',        mots: ['loue', 'location', 'à louer', 'a louer', 'appartement', 'villa', 'studio',
                                 'chambre à louer', 'chambre a louer', 'chambre', 'maison à louer', 'maison', 'bureau',
                                 'terrain', 'duplex', 'immeuble', 'titre foncier', 'bail', 'caution', 'parcelle',
                                 'bâtiment', 'batiment', 'meublé', 'meuble', 'magasin', 'entrepôt', 'entrepot',
                                 'f2', 'f3', 'f4', 'f5', 'salle de bain', 'fond de commerce', 'residence', 'résidence',
                                 'colocation', 'terrain a vendre'] },
  { slug: 'emploi',      mots: ['recrutement', 'recrute', "offre d'emploi", "offres d'emploi", 'offre d emploi',
                                 'stage', 'stagiaire', 'cherche emploi', 'cherche un emploi', 'postuler', 'poste de',
                                 'avis de recrutement', 'souhaite recruter', 'cv', 'embauche', 'job', 'cherche travail',
                                 'cherche boulot', 'urgent recrutement', 'appel a candidature', 'appel à candidature', 
                                 'profil recherche', 'profil recherché', 'technicien', 'chauffeur', 'nounou', 'menagere', 
                                 'ménagère', 'gardien', 'serveuse', 'gérante', 'gerante', 'caissiere'] },
  { slug: 'smartphones', mots: ['iphone', 'samsung', 'xiaomi', 'redmi', 'tecno', 'infinix', 'huawei',
                                 'smartphone', 'portable', 'android', 'galaxy',
                                 'pro max', 'pixel', 'ipad', 'tablette', 'gb', 'go ram', 'oppo', 'realme'] },
  { slug: 'informatique', mots: ['ordinateur', 'laptop', 'pc portable', 'macbook', 'imprimante',
                                  'clavier', 'souris', 'disque dur', 'ram', 'processeur', 'ecran pc', 'écran pc'] },
  { slug: 'tv-electro',  mots: ['televiseur', 'téléviseur', 'tv ', 'tv', 'ecran', 'écran', 'climatiseur',
                                 'refrigerateur', 'réfrigérateur', 'frigo', 'congelateur', 'congélateur',
                                 'machine a laver', 'machine à laver', 'ventilateur', 'micro-onde', 'micro onde',
                                 'cuisiniere', 'cuisinière', 'split', 'gaz'] },
  { slug: 'mode',        mots: ['robe', 'chaussure', 'chaussures', 'shoes', 'sac a main', 'sac à main', 'vetement', 'vêtement',
                                 'boubou', 'basket', 'montre', 'bijoux', 'dressing', 'tissu', 'bazin', 'gagnila', 'habit',
                                 'wax', 'coton', 'getzner', 'tailleur'] },
  { slug: 'beaute',      mots: ['parfum', 'maquillage', 'creme', 'crème', 'cosmetique', 'cosmétique',
                                 'perruque', 'meche', 'mèche', 'savon', 'pommade'] },
  { slug: 'jeux',        mots: ['playstation', 'ps4', 'ps5', 'xbox', 'manette', 'console de jeux', 'nintendo'] },
  { slug: 'maison',      mots: ['meuble', 'canape', 'canapé', 'matelas', 'table a manger',
                                 'table à manger', 'lit', 'armoire', 'tapis', 'rideaux', 'fauteuil', 'salon'] },
];

function detecterCategorie(texte) {
  const t = texte.toLowerCase();
  for (const cat of CATEGORIES_MOTS_LOCAL) {
    if (cat.mots.some(m => t.includes(m))) return cat.slug;
  }
  return null;
}

async function run() {
  console.log("Démarrage du nettoyage des annonces...");
  
  // On récupère TOUTES les annonces pour les réévaluer avec la nouvelle priorité
  const { rows } = await pool.query("SELECT id, categorie_slug, titre, description FROM annonces_classifiees");
  
  let updatedCount = 0;
  
  for (const row of rows) {
    const texte = (row.titre + " " + row.description).toLowerCase();
    const newCat = detecterCategorie(texte);
    
    if (newCat && newCat !== row.categorie_slug) {
        await pool.query("UPDATE annonces_classifiees SET categorie_slug = $1 WHERE id = $2", [newCat, row.id]);
        console.log(`[CORRIGÉ] ${row.id} : ${row.categorie_slug} -> ${newCat} | Titre: ${row.titre.substring(0, 40)}`);
        updatedCount++;
    }
  }
  
  console.log(`Terminé ! ${updatedCount} annonces ont été réattribuées.`);
  process.exit(0);
}

run().catch(console.error);
