// backend/services/social-auto-sync.js
// Service CRON de synchronisation automatique et de veille des comptes réseaux sociaux

const { pool } = require('../models/db');
const { exploreProfile, matchProductsWithCaption } = require('./social-parser');

/**
 * Exécute un cycle complet de synchronisation pour tous les comptes avec auto_sync = true
 */
async function runAutoSyncBatch() {
  console.log('[SOCIAL_AUTO_SYNC] Début du cycle de synchronisation automatique...');
  try {
    const accQuery = `
      SELECT sa.*, b.nom AS boutique_nom
      FROM social_accounts sa
      JOIN boutiques b ON b.id = sa.boutique_id
      WHERE sa.auto_sync = TRUE AND (sa.statut IS NULL OR sa.statut != 'inactif')
    `;
    const { rows: accounts } = await pool.query(accQuery);

    if (accounts.length === 0) {
      console.log('[SOCIAL_AUTO_SYNC] Aucun compte avec Auto-Sync activé.');
      return { synced_accounts: 0, total_new_posts: 0 };
    }

    let totalNewPosts = 0;

    for (const account of accounts) {
      try {
        // Récupérer les produits pour le Smart Matching
        const prodsRes = await pool.query(
          `SELECT id, nom, description, prix, en_stock, categorie
           FROM boutique_produits
           WHERE boutique_id = $1
           ORDER BY ordre ASC, created_at DESC`,
          [account.boutique_id]
        );
        const produits = prodsRes.rows;

        // Exploration du profil
        const res = await exploreProfile(account.plateforme, account.nom_compte, {
          accessToken: account.access_token,
        });

        if (res && res.success && Array.isArray(res.posts)) {
          let accountNewPosts = 0;

          for (const item of res.posts) {
            if (!item.url || item.isProfilePlaceholder) continue;

            const insertRes = await pool.query(
              `INSERT INTO social_posts (
                boutique_id, social_account_id, plateforme, external_post_id,
                post_url, media_type, thumbnail_url, embed_html, caption, auteur, derniere_sync_at
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
              ON CONFLICT (boutique_id, post_url) DO UPDATE SET
                thumbnail_url = COALESCE(EXCLUDED.thumbnail_url, social_posts.thumbnail_url),
                derniere_sync_at = NOW()
              RETURNING id, (xmax = 0) AS is_new`,
              [
                account.boutique_id,
                account.id,
                account.plateforme,
                item.externalPostId || null,
                item.url,
                item.mediaType || 'POST',
                item.thumbnailUrl || null,
                item.embedHtml || null,
                item.caption || '',
                account.nom_compte,
              ]
            );

            if (insertRes.rows[0]?.is_new) {
              accountNewPosts++;
              totalNewPosts++;

              // Smart Matching automatique sur les nouveaux posts importés
              const suggestions = matchProductsWithCaption(item.caption, produits);
              if (suggestions.length > 0 && suggestions[0].confidence_score >= 0.85) {
                await pool.query(
                  `INSERT INTO social_post_produits (social_post_id, produit_id, confidence_score, valide_par_marchand)
                   VALUES ($1, $2, $3, TRUE)
                   ON CONFLICT (social_post_id, produit_id) DO NOTHING`,
                  [insertRes.rows[0].id, suggestions[0].produit.id, suggestions[0].confidence_score]
                );
              }
            }
          }

          // Mettre à jour le statut et la date de synchro
          await pool.query(
            `UPDATE social_accounts
             SET derniere_sync_at = NOW(), statut = 'actif', updated_at = NOW()
             WHERE id = $1`,
            [account.id]
          );

          console.log(`[SOCIAL_AUTO_SYNC] @${account.nom_compte} (${account.plateforme}) : ${accountNewPosts} nouveaux posts.`);
        }
      } catch (accErr) {
        console.warn(`[SOCIAL_AUTO_SYNC_WARN] Échec pour @${account.nom_compte}:`, accErr.message);
      }
    }

    console.log(`[SOCIAL_AUTO_SYNC] Cycle terminé : ${accounts.length} comptes vérifiés, ${totalNewPosts} nouveaux posts.`);
    return { synced_accounts: accounts.length, total_new_posts: totalNewPosts };
  } catch (err) {
    console.error('[SOCIAL_AUTO_SYNC_ERR]', err);
    return { error: err.message };
  }
}

let syncInterval = null;

/**
 * Démarre le CRON récurrent (toutes les 6 heures)
 */
function startSocialAutoSyncCron(intervalMs = 6 * 60 * 60 * 1000) {
  if (syncInterval) clearInterval(syncInterval);

  // Premier déclenchement après 2 minutes de démarrage du serveur pour éviter la charge initiale
  setTimeout(() => {
    runAutoSyncBatch().catch(e => console.warn('[AUTO_SYNC_DEFERRED_ERR]', e.message));
  }, 2 * 60 * 1000);

  // Intervalle régulier (6 heures par défaut)
  syncInterval = setInterval(() => {
    runAutoSyncBatch().catch(e => console.warn('[AUTO_SYNC_INTERVAL_ERR]', e.message));
  }, intervalMs);

  console.log('[SOCIAL_AUTO_SYNC] Planificateur activé (intervalle 6h).');
}

module.exports = {
  runAutoSyncBatch,
  startSocialAutoSyncCron,
};
