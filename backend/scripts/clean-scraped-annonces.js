// backend/scripts/clean-scraped-annonces.js
// Script de nettoyage et d'assainissement massif des annonces classifiées scrapées (ultra-rapide)
// Usage:
//   node backend/scripts/clean-scraped-annonces.js --dry-run   (Aperçu sans modification BDD)
//   node backend/scripts/clean-scraped-annonces.js           (Exécution et mise à jour ultra-rapide en BDD)

require('dotenv').config();
const { pool } = require('../models/db');

const dryRun = process.argv.includes('--dry-run');

// 1. Suppression du bruit d'obfuscation stealth Facebook (combinaisons diacritiques, soft hyphens, zero-width chars)
function purgerUnicodeStealthFB(txt) {
  if (!txt) return '';
  return txt
    .replace(/[\u0300-\u036F\u0370-\u03FF\u00AD\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// 2. Supprimer les textes parasites d'interface utilisateur Facebook
function purgerUiFacebook(txt) {
  if (!txt) return '';
  let s = txt;
  s = s.replace(/(?:Facebook\s*){2,}/gi, ' ');
  s = s.replace(/Envoyer un message\s*(?:\d+)?/gi, '');
  s = s.replace(/Voir la traduction\s*(?:\d+)?/gi, '');
  s = s.replace(/…?\s*(?:En\s+)?[Vv]oir\s+plus\b/gi, '');
  s = s.replace(/Voir plus de commentaires|Voir \d+ commentaires?/gi, '');
  s = s.replace(/Envoyez votre premier commentaire|Écrivez un commentaire public/gi, '');
  s = s.replace(/Indicateur de statut\s*En ligne(?:\s*En ligne)?/gi, '');
  s = s.replace(/J'aime\s*Répondre\s*Partager/gi, '');
  s = s.replace(/Commenter en tant que\s*.*$/gi, '');
  s = s.replace(/\b\d{1,2}:\d{2}\s*\/\s*\d{1,2}:\d{2}\b/g, '');
  s = s.replace(/(?:Les commentaires ont été désactivés pour cette publication\.?)/gi, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

// 3. Décodage des '+' en espaces quand le texte ressemble à un encodage URL
function decoderChainePlus(txt) {
  if (!txt) return '';
  if (txt.includes('+') && !txt.match(/\+\d{2,3}/)) {
    const parts = txt.split('+').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      return parts.join(' ');
    }
  }
  return txt;
}

// 4. Extraction Regex intelligente du prix dans le texte
function extrairePrixDepuisTexte(texte) {
  if (!texte) return null;
  const t = texte.toLowerCase();

  let m = t.match(/(?:prix\s*[:=-]?\s*)?(\d[\d\s.]{3,12})\s*(?:fcfa|xof|f\b|fr\b)/i);
  if (m) {
    const val = parseInt(m[1].replace(/[\s.]/g, ''), 10);
    if (val >= 500 && val < 500_000_000) return val;
  }

  m = t.match(/(?:prix|à|a)\s*[:=-]?\s*(\d{4,9})\b/i);
  if (m) {
    const val = parseInt(m[1], 10);
    if (val >= 1000 && val < 500_000_000) return val;
  }

  m = t.match(/(\d+(?:[.,]\d+)?)\s*k\b/i);
  if (m) {
    const val = Math.round(parseFloat(m[1].replace(',', '.')) * 1000);
    if (val >= 1000 && val < 500_000_000) return val;
  }

  return null;
}

// 5. Nettoyage intelligent du Titre
function nettoyerTitre(titre, description) {
  if (!titre) return 'Annonce';
  let t = decoderChainePlus(titre);
  t = purgerUnicodeStealthFB(t);
  t = purgerUiFacebook(t);

  t = t.replace(/\s*\+\d{1,3}\s*$/, '');
  t = t.replace(/\s*·\s*.*$/, '');

  if (t.length < 6 || t.match(/^(annonce|non spécifié|undefined|null|photo|image|voir details)$/i) || t.match(/^[0-9\s\+\.\-\/]{1,15}$/)) {
    if (description) {
      let descPropre = purgerUnicodeStealthFB(description);
      descPropre = purgerUiFacebook(descPropre);
      const lignes = descPropre.split('\n').map(l => l.trim()).filter(l => l.length >= 8);
      if (lignes.length > 0) {
        t = lignes[0].slice(0, 120);
      }
    }
  }

  return t.slice(0, 250).trim() || 'Annonce';
}

// 6. Test si l'annonce est un Spam irrécupérable
function estSpamIrrécupérable(titre, description) {
  const tCombined = `${titre} ${description}`.toLowerCase();
  
  if (tCombined.match(/cliquez sur le lien/i) && tCombined.match(/chat\.whatsapp\.com/i) && tCombined.length < 150) {
    return true;
  }
  if (titre.match(/^[0-9\s\+\.\-\/]{1,15}$/) && (!description || description.length < 20)) {
    return true;
  }
  if (tCombined.match(/rejoindre ma chaîne/i) && tCombined.length < 100) {
    return true;
  }
  return false;
}

async function exécuterNettoyage() {
  console.log(`=== DÉMARRAGE NETTOYAGE ANNONCES (${dryRun ? 'MODE DRY-RUN' : 'MODE RÉEL BULK-QUERY'}) ===\n`);

  try {
    const { rows: annonces } = await pool.query(`
      SELECT id, titre, description, prix, photos, source, actif
      FROM annonces_classifiees
    `);

    let compteTitrePropre = 0;
    let compteUnicodeStealth = 0;
    let comptePrixRepare = 0;
    let compteDesactiveSpam = 0;
    let compteMasqueSansPhoto = 0;

    const updates = [];

    for (const a of annonces) {
      let modifie = false;
      let desactiver = false;

      const titreInitial = a.titre || '';
      const descInitiale = a.description || '';
      const prixInitial = a.prix;

      if (titreInitial.match(/[\u0300-\u036F\u0370-\u03FF\u00AD]/) || descInitiale.match(/[\u0300-\u036F\u0370-\u03FF\u00AD]/)) {
        compteUnicodeStealth++;
      }

      const nouveauTitre = nettoyerTitre(titreInitial, descInitiale);
      const nouvelleDesc = purgerUiFacebook(purgerUnicodeStealthFB(descInitiale)).slice(0, 2000);

      if (nouveauTitre !== titreInitial || nouvelleDesc !== descInitiale) {
        modifie = true;
        compteTitrePropre++;
      }

      let nouveauPrix = prixInitial;
      if (!prixInitial || prixInitial <= 0) {
        const prixExtrait = extrairePrixDepuisTexte(`${nouveauTitre} ${nouvelleDesc}`);
        if (prixExtrait) {
          nouveauPrix = prixExtrait;
          modifie = true;
          comptePrixRepare++;
        }
      }

      if (estSpamIrrécupérable(nouveauTitre, nouvelleDesc)) {
        desactiver = true;
        compteDesactiveSpam++;
      }

      const aPhotos = a.photos && Array.isArray(a.photos) && a.photos.length > 0;
      if (!aPhotos && (!nouveauPrix || nouveauPrix <= 0)) {
        desactiver = true;
        compteMasqueSansPhoto++;
      }

      if (modifie || desactiver) {
        updates.push({ id: a.id, titre: nouveauTitre, description: nouvelleDesc, prix: nouveauPrix, desactiver });
      }
    }

    if (!dryRun && updates.length > 0) {
      console.log(`Application en BDD de ${updates.length} mises à jour via Bulk Query...`);
      // Par paquets de 200 items par requête bulk
      const CHUNK_SIZE = 200;
      for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
        const chunk = updates.slice(i, i + CHUNK_SIZE);
        const params = [];
        const valueStrings = chunk.map((u, idx) => {
          const base = idx * 5;
          params.push(u.id, u.titre, u.description, u.prix, u.desactiver);
          return `($${base + 1}::uuid, $${base + 2}::text, $${base + 3}::text, $${base + 4}::numeric, $${base + 5}::boolean)`;
        });

        const sql = `
          UPDATE annonces_classifiees AS a
          SET titre = v.titre,
              description = v.description,
              prix = v.prix,
              actif = CASE WHEN v.desactiver = true THEN false ELSE a.actif END,
              updated_at = NOW()
          FROM (VALUES ${valueStrings.join(', ')}) AS v(id, titre, description, prix, desactiver)
          WHERE a.id = v.id
        `;
        await pool.query(sql, params);
      }
      console.log("✅ Toutes les mises à jour ont été appliquées avec succès en BDD.");
    }

    console.log("\n=== BILAN DU NETTOYAGE ===");
    console.table([
      { Métrique: 'Total Annonces Analysées', Valeur: annonces.length },
      { Métrique: 'Titres & Descriptions Assainis (UI FB / Plus / Formats)', Valeur: compteTitrePropre },
      { Métrique: 'Annonces Débarrassées d\'Obfuscation Unicode FB', Valeur: compteUnicodeStealth },
      { Métrique: 'Prix Restaurés / Réparés depuis le Texte', Valeur: comptePrixRepare },
      { Métrique: 'Annonces Spams WhatsApp Désactivées', Valeur: compteDesactiveSpam },
      { Métrique: 'Annonces Incomplets Sans Photo & Sans Prix Masquées', Valeur: compteMasqueSansPhoto },
    ]);

  } catch (err) {
    console.error("Erreur durant le nettoyage:", err);
  } finally {
    await pool.end();
  }
}

exécuterNettoyage();
