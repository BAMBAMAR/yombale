// backend/services/surga/statistiques-admin.js
// Statistiques d'usage de Surga pour la console d'administration.
// Règles :
//  - tout est lu dans les tables surga_* (aucun traceur, aucune donnée personnelle rendue : seulement des comptes) ;
//  - une requête qui échoue (table absente, colonne différente) laisse sa valeur à null au lieu de faire échouer la page,
//    et la console affiche alors « non mesuré » : jamais un zéro qui ferait croire à une absence d'usage ;
//  - les visiteurs sans compte et les installations de l'application ne sont pas comptés : Surga n'en garde aucune
//    trace (pas de traceur publicitaire, voulu). La réponse le dit dans `non_mesure`.

async function lire(pool, sql, params = []) {
  try {
    return (await pool.query(sql, params)).rows;
  } catch (err) {
    console.warn('[SURGA STATS]', err.message.split('\n')[0]);
    return null;
  }
}
const un = (rows, champ = 'n') => (rows && rows[0] && rows[0][champ] != null ? Number(rows[0][champ]) : null);

// Ensemble des comptes qui ont une trace dans Surga.
const COMPTES = `
  SELECT user_id::text AS u FROM surga_preferences
  UNION SELECT user_id::text FROM surga_notes
  UNION SELECT user_id::text FROM surga_depenses
  UNION SELECT user_id::text FROM surga_agenda
  UNION SELECT user_id::text FROM surga_abonnements
  UNION SELECT user_id::text FROM surga_push_subscriptions`;

// Une ligne par action d'un compte, avec son heure : sert aux comptes actifs sur 7 et 30 jours.
const ACTIVITE = `
  SELECT user_id::text AS u, COALESCE(updated_at, created_at) AS t FROM surga_notes
  UNION ALL SELECT user_id::text, COALESCE(updated_at, created_at) FROM surga_depenses
  UNION ALL SELECT user_id::text, COALESCE(updated_at, created_at) FROM surga_agenda
  UNION ALL SELECT user_id::text, updated_at FROM surga_preferences
  UNION ALL SELECT user_id::text, updated_at FROM surga_usages`;

async function calculerStatistiques(pool, jours = 30) {
  const n = Math.min(90, Math.max(7, parseInt(jours, 10) || 30));
  const [
    comptes, actifs, serie, contenus, abonnes, finances, modules, quartiers, heures, audio, push, rappels,
    documents, profils, suivisDemarches, suivisConcours, alertesImmo, favoris, abonnementsVideos, presse, trafic,
  ] = await Promise.all([
    lire(pool, `SELECT COUNT(*)::int AS n FROM (${COMPTES}) c WHERE u IS NOT NULL`),
    lire(pool, `SELECT COUNT(DISTINCT u) FILTER (WHERE t > NOW() - INTERVAL '1 day')::int AS j1,
                       COUNT(DISTINCT u) FILTER (WHERE t > NOW() - INTERVAL '7 days')::int AS j7,
                       COUNT(DISTINCT u) FILTER (WHERE t > NOW() - INTERVAL '30 days')::int AS j30
                FROM (${ACTIVITE}) a WHERE u IS NOT NULL`),
    lire(pool, `SELECT to_char(d::date, 'YYYY-MM-DD') AS jour,
                       (SELECT COUNT(*) FROM surga_preferences WHERE created_at::date = d::date)::int AS configurations,
                       ((SELECT COUNT(*) FROM surga_notes WHERE created_at::date = d::date)
                        + (SELECT COUNT(*) FROM surga_depenses WHERE created_at::date = d::date)
                        + (SELECT COUNT(*) FROM surga_agenda WHERE created_at::date = d::date))::int AS contenus
                FROM generate_series(CURRENT_DATE - ($1::int - 1), CURRENT_DATE, INTERVAL '1 day') d ORDER BY d`, [n]),
    lire(pool, `SELECT (SELECT COUNT(*) FROM surga_notes)::int AS notes,
                       (SELECT COUNT(*) FROM surga_notes WHERE created_at > NOW() - make_interval(days => $1))::int AS notes_periode,
                       (SELECT COUNT(*) FROM surga_depenses)::int AS depenses,
                       (SELECT COUNT(*) FROM surga_depenses WHERE created_at > NOW() - make_interval(days => $1))::int AS depenses_periode,
                       (SELECT COUNT(*) FROM surga_agenda)::int AS rappels,
                       (SELECT COUNT(*) FROM surga_agenda WHERE created_at > NOW() - make_interval(days => $1))::int AS rappels_periode`, [n]),
    lire(pool, `SELECT COUNT(*) FILTER (WHERE statut = 'actif' AND fin > NOW())::int AS actifs,
                       COUNT(*) FILTER (WHERE statut = 'en_attente')::int AS en_attente,
                       COUNT(DISTINCT user_id) FILTER (WHERE statut = 'actif')::int AS payeurs
                FROM surga_abonnements`),
    lire(pool, `SELECT COALESCE(SUM(montant_xof) FILTER (WHERE statut = 'actif'), 0)::bigint AS total,
                       COALESCE(SUM(montant_xof) FILTER (WHERE statut = 'actif' AND created_at > NOW() - make_interval(days => $1)), 0)::bigint AS periode
                FROM surga_abonnements`, [n]),
    lire(pool, `SELECT m AS libelle, COUNT(*)::int AS n FROM surga_preferences, jsonb_array_elements_text(modules_actifs::jsonb) m GROUP BY m ORDER BY n DESC LIMIT 8`),
    lire(pool, `SELECT quartiers->>0 AS libelle, COUNT(*)::int AS n FROM surga_preferences WHERE quartiers->>0 IS NOT NULL GROUP BY 1 ORDER BY n DESC LIMIT 6`),
    lire(pool, `SELECT heure_briefing AS libelle, COUNT(*)::int AS n FROM surga_preferences WHERE heure_briefing IS NOT NULL GROUP BY 1 ORDER BY n DESC LIMIT 5`),
    lire(pool, `SELECT COUNT(*) FILTER (WHERE audio_actif)::int AS n FROM surga_preferences`),
    lire(pool, `SELECT COUNT(DISTINCT user_id)::int AS n FROM surga_push_subscriptions`),
    lire(pool, `SELECT COUNT(*) FILTER (WHERE statut IN ('envoye', 'succes', 'ok'))::int AS envoyes,
                       COUNT(*) FILTER (WHERE statut = 'echec')::int AS echecs
                FROM surga_notifications_logs WHERE created_at > NOW() - make_interval(days => $1)`, [n]),
    lire(pool, `SELECT COUNT(*) FILTER (WHERE type ILIKE 'cv%')::int AS cv,
                       COUNT(*) FILTER (WHERE type ILIKE 'lettre%')::int AS lettres,
                       COUNT(*) FILTER (WHERE created_at > NOW() - make_interval(days => $1))::int AS periode
                FROM surga_documents_emploi`, [n]),
    lire(pool, `SELECT COUNT(*)::int AS n FROM surga_profil_pro`),
    lire(pool, `SELECT COUNT(*)::int AS n FROM surga_demarches_suivis`),
    lire(pool, `SELECT COUNT(*)::int AS n FROM surga_suivi_concours`),
    lire(pool, `SELECT COUNT(*) FILTER (WHERE actif)::int AS n FROM surga_alertes_immo`),
    lire(pool, `SELECT COUNT(*)::int AS n FROM surga_favoris_places`),
    lire(pool, `SELECT COUNT(*)::int AS n FROM surga_video_abonnements`),
    lire(pool, `SELECT (SELECT MAX(created_at) FROM surga_briefing_items) AS derniere_depeche,
                       (SELECT COUNT(*) FROM surga_briefing_items WHERE created_at > NOW() - INTERVAL '24 hours')::int AS depeches_24h,
                       (SELECT MAX(date_parution) FROM surga_unes_presse) AS derniere_une`),
    lire(pool, `SELECT COUNT(*) FILTER (WHERE statut = 'en_attente')::int AS en_attente,
                       COUNT(*) FILTER (WHERE created_at > NOW() - make_interval(days => $1))::int AS periode
                FROM surga_trafic_signalements`, [n]),
  ]);

  const c = (rows) => (rows && rows[0]) || null;
  const nbComptes = un(comptes);
  const a = c(actifs);
  const payeurs = c(abonnes) ? Number(c(abonnes).payeurs) : null;

  return {
    periode_jours: n,
    comptes: {
      total: nbComptes,
      actifs_24h: a ? Number(a.j1) : null,
      actifs_7j: a ? Number(a.j7) : null,
      actifs_30j: a ? Number(a.j30) : null,
      nouveaux_periode: serie ? serie.reduce((s, r) => s + Number(r.configurations), 0) : null,
      payeurs,
      taux_payeurs_pct: nbComptes && payeurs != null ? Math.round((payeurs / nbComptes) * 1000) / 10 : null,
    },
    serie: serie || [],
    contenus: c(contenus),
    abonnements: { ...(c(abonnes) || {}), ...(c(finances) ? { encaisse_xof: Number(c(finances).total), encaisse_periode_xof: Number(c(finances).periode) } : {}) },
    preferences: {
      modules: modules || [],
      quartiers: quartiers || [],
      heures: heures || [],
      audio_actif: un(audio),
      notifications_activees: un(push),
    },
    rappels_envoyes: c(rappels),
    emploi: { documents: c(documents), profils: un(profils) },
    suivis: {
      demarches: un(suivisDemarches),
      concours: un(suivisConcours),
      alertes_immo_actives: un(alertesImmo),
      adresses_favorites: un(favoris),
      abonnements_videos: un(abonnementsVideos),
    },
    presse: c(presse),
    trafic: c(trafic),
    non_mesure: [
      'Les visiteurs sans compte : Surga ne les suit pas (aucun traceur).',
      'Les installations de l’application sur l’écran d’accueil.',
      'Le nombre de pages vues et le temps passé.',
    ],
  };
}

module.exports = { calculerStatistiques };
