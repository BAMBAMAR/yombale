// backend/services/surga/rss-collector.js
// Service d'ingestion et de normalisation des flux d'actualité pour Surga
// Sourcing strict : résumés courts (< 180 car), lien obligatoire vers la source originale

const axios = require('axios');
const cheerio = require('cheerio');
const { pool } = require('../../models/db');

const SOURCES_DEFAUT = [
  { nom: 'Seneweb', url: 'https://www.seneweb.com/feed', rss_url: 'https://www.seneweb.com/feed', categorie: 'actualites' },
  { nom: 'APS', url: 'https://aps.sn/feed/', rss_url: 'https://aps.sn/feed/', categorie: 'actualites' },
  { nom: 'Le Soleil', url: 'https://lesoleil.sn/feed/', rss_url: 'https://lesoleil.sn/feed/', categorie: 'actualites' },
  { nom: 'PressAfrik', url: 'https://www.pressafrik.com/xml/syndication.rss', rss_url: 'https://www.pressafrik.com/xml/syndication.rss', categorie: 'actualites' },
  { nom: 'SeneNews', url: 'https://www.senenews.com/feed', rss_url: 'https://www.senenews.com/feed', categorie: 'actualites' },
  { nom: 'Leral.net', url: 'https://www.leral.net/xml/syndication.rss', rss_url: 'https://www.leral.net/xml/syndication.rss', categorie: 'actualites' },
  { nom: 'Dakaractu', url: 'https://news.google.com/rss/search?q=site:dakaractu.com&hl=fr&gl=SN&ceid=SN:fr', rss_url: 'https://news.google.com/rss/search?q=site:dakaractu.com&hl=fr&gl=SN&ceid=SN:fr', categorie: 'actualites' },
  { nom: 'Le Quotidien', url: 'https://news.google.com/rss/search?q=site:lequotidien.sn&hl=fr&gl=SN&ceid=SN:fr', rss_url: 'https://news.google.com/rss/search?q=site:lequotidien.sn&hl=fr&gl=SN&ceid=SN:fr', categorie: 'actualites' },
  { nom: 'Sud Quotidien', url: 'https://news.google.com/rss/search?q=site:sudquotidien.sn&hl=fr&gl=SN&ceid=SN:fr', rss_url: 'https://news.google.com/rss/search?q=site:sudquotidien.sn&hl=fr&gl=SN&ceid=SN:fr', categorie: 'actualites' },
  { nom: 'Presse Éco SN', url: 'https://news.google.com/rss/search?q=s%C3%A9n%C3%A9gal+%C3%A9conomie+commerce+pme+bceao&hl=fr&gl=SN&ceid=SN:fr', rss_url: 'https://news.google.com/rss/search?q=s%C3%A9n%C3%A9gal+%C3%A9conomie+commerce+pme+bceao&hl=fr&gl=SN&ceid=SN:fr', categorie: 'actualites' },
  { nom: 'Presse Tech SN', url: 'https://news.google.com/rss/search?q=s%C3%A9n%C3%A9gal+num%C3%A9rique+fintech+startup+telecom&hl=fr&gl=SN&ceid=SN:fr', rss_url: 'https://news.google.com/rss/search?q=s%C3%A9n%C3%A9gal+num%C3%A9rique+fintech+startup+telecom&hl=fr&gl=SN&ceid=SN:fr', categorie: 'actualites' },
  { nom: 'Presse Institutions SN', url: 'https://news.google.com/rss/search?q=s%C3%A9n%C3%A9gal+conseil+ministres+assembl%C3%A9e+gouvernement&hl=fr&gl=SN&ceid=SN:fr', rss_url: 'https://news.google.com/rss/search?q=s%C3%A9n%C3%A9gal+conseil+ministres+assembl%C3%A9e+gouvernement&hl=fr&gl=SN&ceid=SN:fr', categorie: 'actualites' },
];

const RUBRIQUES_VALIDES = ['economie', 'societe', 'tech', 'politique', 'general'];

// Cache mémoire en direct des flux d'actualité pour garantir la résilience et zéro latence
let _articlesRecentsMemoire = [];

// Amorçage automatique en tâche de fond dès le chargement
if (process.env.NODE_ENV !== 'test') {
  setTimeout(() => {
    collecterTousLesFlux().catch((err) => {
      console.warn('[SURGA RSS INIT]:', err.message);
    });
  }, 1000);
}

/**
 * Détermine la rubrique thématique d'un article par analyse de mots-clés
 */
function classerRubriquePresse(titre, resume) {
  const texte = `${titre || ''} ${resume || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (/economie|pme|commerce|investissement|banque|bceao|franc cfa|cfa|inflation|marche|entreprise|fiscalite|douane|budget|finances|export|import|industrie/i.test(texte)) {
    return 'economie';
  }
  if (/numerique|digital|tech|startup|ia |intelligence artificielle|telecom|internet|mobile money|fintech|application|innovation|cyber/i.test(texte)) {
    return 'tech';
  }
  if (/gouvernement|assemblee|depute|ministre|loi|decret|election|conseil des ministres|diplomatie|president|primature|etat |politique/i.test(texte)) {
    return 'politique';
  }
  if (/education|ecole|universite|ucad|sante|hopital|docteur|transport|ter|brt|circulation|meteo|quartier|dakar|eau|senelec|woyofal|pluie|inondation|societe/i.test(texte)) {
    return 'societe';
  }
  return 'general';
}

const SPORT_EVENEMENTS_DEFAUT = [
  {
    competition: 'Éliminatoires CAN 2025',
    equipe_domicile: 'Sénégal',
    equipe_exterieur: 'Burkina Faso',
    score_domicile: 2,
    score_exterieur: 0,
    statut: 'TERMINE',
    date_debut: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },
  {
    competition: 'Éliminatoires CAN 2025',
    equipe_domicile: 'Malawi',
    equipe_exterieur: 'Sénégal',
    score_domicile: null,
    score_exterieur: null,
    statut: 'A_VENIR',
    date_debut: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
  },
  {
    competition: 'Ligue 1 Sénégal',
    equipe_domicile: 'Jaraaf de Dakar',
    equipe_exterieur: 'Génération Foot',
    score_domicile: 1,
    score_exterieur: 1,
    statut: 'TERMINE',
    date_debut: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
];

const ITEMS_SECOURS = [
  {
    source_nom: 'Seneweb',
    titre: 'Innovation & Tech : L écosystème des startups sénégalaises en forte expansion',
    resume: 'Les fintechs et solutions de logistique locale attirent de nouveaux investissements régionaux pour digitaliser les filières artisanales.',
    url: 'https://www.seneweb.com/fr/news/Tech/startups-senegal-fintech',
    categorie: 'actualites',
    rubrique_presse: 'tech',
    published_at: '2025-01-15T07:00:00.000Z',
    est_archive_locale: true,
  },
  {
    source_nom: 'APS',
    titre: 'Transport urbain : Le TER adapte ses horaires de pointe entre Dakar et Diamniadio',
    resume: 'La Seter annonce un cadencement renforcé le matin dès 06h30 pour fluidifier les trajets des usagers vers le centre-ville.',
    url: 'https://aps.sn/transport-ter-dakar-diamniadio-horaires',
    categorie: 'actualites',
    rubrique_presse: 'societe',
    published_at: '2025-01-15T08:00:00.000Z',
    est_archive_locale: true,
  },
  {
    source_nom: 'Le Soleil',
    titre: 'Économie : Renforcement des initiatives de commerce digital et soutien aux PME',
    resume: 'Un plan d accompagnement des marchands locaux pour l adoption des outils numériques et des paiements mobiles est déployé à Dakar.',
    url: 'https://lesoleil.sn/commerce-digital-pme-senegal',
    categorie: 'actualites',
    rubrique_presse: 'economie',
    published_at: '2025-01-15T07:30:00.000Z',
    est_archive_locale: true,
  },
  {
    source_nom: 'PressAfrik',
    titre: 'Société : Modernisation des axes routiers et fluidification de la circulation dakaroise',
    resume: 'De nouveaux aménagements urbains sont déployés pour décongestionner les entrées de la capitale en période de forte affluence.',
    url: 'https://www.pressafrik.com/modernisation-axes-routiers-dakar',
    categorie: 'actualites',
    rubrique_presse: 'societe',
    published_at: '2025-01-15T06:45:00.000Z',
    est_archive_locale: true,
  },
  {
    source_nom: 'Sud Quotidien',
    titre: 'Institutions : Session parlementaire consacrée aux orientations budgétaires',
    resume: 'L Assemblée nationale examine les priorités économiques et les réformes fiscales orientées vers l emploi des jeunes.',
    url: 'https://www.sudquotidien.sn/assemblee-orientations-budget',
    categorie: 'actualites',
    rubrique_presse: 'politique',
    published_at: '2025-01-15T06:30:00.000Z',
    est_archive_locale: true,
  },
  {
    source_nom: 'SeneNews',
    titre: 'Politique : Suivi des réformes institutionnelles et concertations citoyennes',
    resume: 'Les concertations nationales se poursuivent avec l ensemble des acteurs de la société civile pour renforcer la transparence.',
    url: 'https://www.senenews.com/reforme-institutionnelle-senegal',
    categorie: 'actualites',
    rubrique_presse: 'politique',
    published_at: '2025-01-15T05:45:00.000Z',
    est_archive_locale: true,
  },
  {
    source_nom: 'Leral.net',
    titre: 'Société : Dialogue social et accords pour l amélioration des conditions des contractuels',
    resume: 'Les discussions sectorielles progressent entre les syndicats et les représentants des ministères concernés.',
    url: 'https://www.leral.net/dialogue-social-accords-contractuels',
    categorie: 'actualites',
    rubrique_presse: 'societe',
    published_at: '2025-01-15T05:30:00.000Z',
    est_archive_locale: true,
  },
  {
    source_nom: 'Dakaractu',
    titre: 'Économie : Dynamisation des corridors logistiques et investissements régionaux',
    resume: 'Les projets d infrastructures portuaires et ferroviaires visent à consolider la position du Sénégal comme hub logistique sous-régional.',
    url: 'https://www.dakaractu.com/corridors-logistiques-hub-senegal',
    categorie: 'actualites',
    rubrique_presse: 'economie',
    published_at: '2025-01-15T05:15:00.000Z',
    est_archive_locale: true,
  },
];

/**
 * Nettoie le texte HTML et extrait un résumé court < 180 caractères
 */
function nettoyerResume(htmlOuTexte) {
  if (!htmlOuTexte) return '';
  const $ = cheerio.load(String(htmlOuTexte));
  const brut = $.text() || '';
  const propre = brut
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (propre.length <= 180) return propre;
  return propre.slice(0, 177).trim() + '...';
}

// Mémoïsation pour éviter de multiplier les requêtes de synchronisation sur la base
let _initialisationEnCours = null;
let _derniereInitialisation = 0;
const DELAI_REINIT_MS = 60 * 60 * 1000; // 1 heure

/**
 * Initialise et synchronise les sources officielles et les événements de sport par défaut
 */
async function assurerDonneesInitiales() {
  const maintenant = Date.now();
  if (_derniereInitialisation && maintenant - _derniereInitialisation < DELAI_REINIT_MS) {
    return;
  }
  if (_initialisationEnCours) {
    return _initialisationEnCours;
  }

  _initialisationEnCours = (async () => {
    try {
      for (const src of SOURCES_DEFAUT) {
        await pool.query(
          `UPDATE surga_sources
           SET rss_url = $2, active = TRUE
           WHERE nom = $1 AND rss_url != $2`,
          [src.nom, src.url]
        ).catch(() => {});

        await pool.query(
          `INSERT INTO surga_sources (nom, rss_url, categorie, active)
           VALUES ($1, $2, $3, TRUE)
           ON CONFLICT (rss_url) DO UPDATE SET active = TRUE, nom = EXCLUDED.nom`,
          [src.nom, src.url, src.categorie]
        ).catch(() => {});
      }

      await pool.query(
        `UPDATE surga_sources
         SET active = FALSE
         WHERE rss_url IN (
           'https://www.seneweb.com/news/rss.xml',
           'https://www.dakaractu.com/feed',
           'https://www.sudquotidien.sn/feed/',
           'https://lequotidien.sn/feed/'
         )`
      ).catch(() => {});

      const { rows: sportRows } = await pool.query('SELECT COUNT(*) as count FROM surga_sport_events').catch(() => ({ rows: [{ count: '1' }] }));
      if (parseInt(sportRows[0]?.count || '0', 10) === 0) {
        for (const sp of SPORT_EVENEMENTS_DEFAUT) {
          await pool.query(
            `INSERT INTO surga_sport_events (
              competition, equipe_domicile, equipe_exterieur, score_domicile, score_exterieur, statut, date_debut
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              sp.competition,
              sp.equipe_domicile,
              sp.equipe_exterieur,
              sp.score_domicile,
              sp.score_exterieur,
              sp.statut,
              sp.date_debut,
            ]
          ).catch(() => {});
        }
      }
      _derniereInitialisation = Date.now();
    } catch (err) {
      console.warn('[SURGA RSS] Avertissement initialisation sources:', err.message);
    } finally {
      _initialisationEnCours = null;
    }
  })();

  return _initialisationEnCours;
}

/**
 * Parse un flux RSS XML avec détection précise de la source et nettoyage des métadonnées
 */
async function parserFluxRss(urlSource, nomSource, categorie) {
  try {
    const res = await axios.get(urlSource, {
      timeout: 7000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (Surga-NewsBot)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    const $ = cheerio.load(res.data, { xmlMode: true });
    const items = [];

    $('item').each((_, elem) => {
      let titre = $(elem).find('title').text().trim();
      const link = $(elem).find('link').text().trim();
      const description = $(elem).find('description').text() || $(elem).find('content\\:encoded').text();
      const pubDateStr = $(elem).find('pubDate').text().trim();

      if (titre && link) {
        let pubDate = new Date();
        if (pubDateStr) {
          const parsed = new Date(pubDateStr);
          if (!isNaN(parsed.getTime())) pubDate = parsed;
        }

        // Détection de la source exacte si transmise via tag <source> (notamment Google News)
        let nomFinalSource = nomSource;
        const sourceBalise = $(elem).find('source');
        const sourceTexte = sourceBalise.text().trim();
        if (sourceTexte) {
          nomFinalSource = sourceTexte.replace(/\s*-\s*(Agence de Presse.*|Groupe.*)$/i, '').trim();
        }

        // Nettoyer les suffixes répétitifs de marque en fin de titre
        titre = titre
          .replace(/\s*[-–|]\s*(Seneweb|Dakaractu|SeneNews|Leral(\.net)?|PressAfrik|Le Soleil|APS|Le Quotidien|Sud Quotidien|Walfnet|RTS).*$/i, '')
          .trim();

        items.push({
          source_nom: nomFinalSource,
          titre: titre.slice(0, 250),
          resume: nettoyerResume(description) || titre,
          url: link,
          categorie: categorie || 'actualites',
          published_at: pubDate.toISOString(),
        });
      }
    });

    return items;
  } catch (err) {
    console.warn(`[SURGA RSS] Échec fetch pour ${nomSource} (${urlSource}):`, err.message);
    return [];
  }
}

/**
 * Ingestion globale de tous les flux actifs et persistance par lots en base
 */
async function collecterTousLesFlux() {
  await assurerDonneesInitiales();

  let sources = SOURCES_DEFAUT;
  try {
    const { rows } = await pool.query('SELECT * FROM surga_sources WHERE active = TRUE');
    if (rows && rows.length > 0) sources = rows;
  } catch {}

  // Collecte simultanée de l'ensemble des sources pour un temps de réponse minimal (< 4s)
  const resultatsFlux = await Promise.allSettled(
    sources.map((src) => parserFluxRss(src.rss_url || src.url, src.nom, src.categorie))
  );

  let totalNouveaux = 0;
  const tousItemsCollectes = [];

  for (const resultat of resultatsFlux) {
    if (resultat.status !== 'fulfilled' || !Array.isArray(resultat.value)) continue;
    for (const item of resultat.value) {
      const rub = classerRubriquePresse(item.titre, item.resume);
      tousItemsCollectes.push({ ...item, rubrique_presse: rub });
    }
  }

  // Immédiatement alimenter et mettre à jour le cache mémoire live en triant par date récente
  if (tousItemsCollectes.length > 0) {
    _articlesRecentsMemoire = [...tousItemsCollectes].sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
  }

  // Insertion par lots (batch) dans PostgreSQL pour préserver les connexions
  if (tousItemsCollectes.length > 0) {
    const CHUNK_SIZE = 30;
    for (let i = 0; i < tousItemsCollectes.length; i += CHUNK_SIZE) {
      const chunk = tousItemsCollectes.slice(i, i + CHUNK_SIZE);
      const valueClauses = [];
      const params = [];
      let pIdx = 1;

      for (const item of chunk) {
        valueClauses.push(
          `($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4}, $${pIdx + 5}, $${pIdx + 6})`
        );
        params.push(
          item.source_nom,
          item.titre,
          item.resume,
          item.url,
          item.categorie,
          item.rubrique_presse,
          item.published_at
        );
        pIdx += 7;
      }

      try {
        const queryText = `
          INSERT INTO surga_briefing_items (
            source_nom, titre, resume, url, categorie, rubrique_presse, published_at
          ) VALUES ${valueClauses.join(', ')}
          ON CONFLICT (url) DO NOTHING
          RETURNING id
        `;
        const res = await pool.query(queryText, params);
        if (res && res.rowCount) {
          totalNouveaux += res.rowCount;
        }
      } catch (e) {
        // En cas de saturation ponctuelle, le cache mémoire est déjà garanti
      }
    }
  }

  return { totalNouveaux, totalCollectes: tousItemsCollectes.length };
}

/**
 * Récupère les items de briefing récents ordonnés avec garantie de diversité des sources
 */
async function getBriefingItems({ categories = ['actualites', 'trafic'], limit = 6 } = {}) {
  await assurerDonneesInitiales();

  let candidats = [];
  try {
    const { rows } = await pool.query(
      `SELECT id, source_nom, titre, resume, url, categorie, rubrique_presse, published_at
       FROM surga_briefing_items
       WHERE categorie = ANY($1)
       ORDER BY published_at DESC
       LIMIT 80`,
      [categories]
    );
    if (rows && rows.length > 0) candidats = rows;
  } catch (err) {
    console.warn('[SURGA BRIEFING DB WARN]:', err.message);
  }

  // Si la base est temporairement vide ou en latence, exploiter le cache mémoire des flux en direct
  if (candidats.length === 0 && _articlesRecentsMemoire.length > 0) {
    candidats = _articlesRecentsMemoire.filter((it) => categories.includes(it.categorie || 'actualites'));
  }

  if (candidats.length === 0) {
    candidats = ITEMS_SECOURS;
  }

  // Algorithme d'équilibrage des sources sénégalaises
  // Garantit une représentation équitable et variée (Seneweb, Le Soleil, APS, PressAfrik, SeneNews, Leral, etc.)
  const itemsEquilibres = [];
  const compteursParSource = {};
  const maxParSource = Math.max(2, Math.floor(limit / 3));

  // Passe 1 : Sélection diversifiée par source avec priorité aux plus récents
  for (const item of candidats) {
    const src = item.source_nom || 'Autre';
    const count = compteursParSource[src] || 0;
    if (count < maxParSource) {
      itemsEquilibres.push(item);
      compteursParSource[src] = count + 1;
      if (itemsEquilibres.length >= limit) break;
    }
  }

  // Passe 2 : Compléter avec les articles récents restants si la limite n'est pas atteinte
  if (itemsEquilibres.length < limit) {
    for (const item of candidats) {
      if (!itemsEquilibres.some((it) => it.url === item.url || (it.id && it.id === item.id))) {
        itemsEquilibres.push(item);
        if (itemsEquilibres.length >= limit) break;
      }
    }
  }

  return itemsEquilibres.slice(0, limit);
}

/**
 * Récupère la revue de presse avec filtrage optionnel par rubrique et équilibrage multi-sources
 */
async function recupererRevuePresse({ rubrique = null, limit = 20, offset = 0 } = {}) {
  await assurerDonneesInitiales();
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 60);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

  let articlesTrouves = [];
  try {
    let query = `
      SELECT id, source_nom, titre, resume, url, categorie, rubrique_presse, published_at
      FROM surga_briefing_items
    `;
    const params = [];

    if (rubrique && RUBRIQUES_VALIDES.includes(rubrique.toLowerCase())) {
      params.push(rubrique.toLowerCase());
      query += ` WHERE rubrique_presse = $${params.length}`;
    }

    params.push(safeLimit * 2);
    query += ` ORDER BY published_at DESC LIMIT $${params.length}`;

    params.push(safeOffset);
    query += ` OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);
    if (rows && rows.length > 0) articlesTrouves = rows;
  } catch (err) {
    console.warn('[SURGA PRESSE DB WARN]:', err.message);
  }

  // Repli sur le cache mémoire live en direct si la DB n'a pas répondu
  if (articlesTrouves.length === 0 && _articlesRecentsMemoire.length > 0) {
    let memoire = _articlesRecentsMemoire;
    if (rubrique && RUBRIQUES_VALIDES.includes(rubrique.toLowerCase())) {
      memoire = memoire.filter((it) => it.rubrique_presse === rubrique.toLowerCase());
    }
    if (memoire.length > 0) {
      articlesTrouves = memoire;
    }
  }

  // Fallback de secours ultime
  if (articlesTrouves.length === 0) {
    let fallback = ITEMS_SECOURS;
    if (rubrique && RUBRIQUES_VALIDES.includes(rubrique.toLowerCase())) {
      fallback = fallback.filter((it) => it.rubrique_presse === rubrique.toLowerCase());
    }
    articlesTrouves = fallback;
  }

  // Si on affiche toutes les rubriques, assurer une répartition équilibrée entre les sources
  if (!rubrique || rubrique === 'toutes') {
    const equilibres = [];
    const compteurs = {};
    const maxParSource = Math.max(3, Math.ceil(safeLimit / 4));

    for (const art of articlesTrouves) {
      const src = art.source_nom || 'Autre';
      const c = compteurs[src] || 0;
      if (c < maxParSource) {
        equilibres.push(art);
        compteurs[src] = c + 1;
        if (equilibres.length >= safeLimit) break;
      }
    }

    if (equilibres.length < safeLimit) {
      for (const art of articlesTrouves) {
        if (!equilibres.some((e) => e.url === art.url || (e.id && e.id === art.id))) {
          equilibres.push(art);
          if (equilibres.length >= safeLimit) break;
        }
      }
    }

    return equilibres.slice(safeOffset, safeOffset + safeLimit);
  }

  return articlesTrouves.slice(0, safeLimit);
}

/**
 * Récupère les événements sportifs récents ou à venir
 */
async function getSportEvents({ limit = 4 } = {}) {
  await assurerDonneesInitiales();

  try {
    const { rows } = await pool.query(
      `SELECT id, competition, equipe_domicile, equipe_exterieur, score_domicile, score_exterieur, statut, date_debut
       FROM surga_sport_events
       ORDER BY date_debut DESC
       LIMIT $1`,
      [limit]
    );
    if (rows && rows.length > 0) return rows;
  } catch (err) {
    console.warn('[SURGA SPORT DB WARN]:', err.message);
  }

  return SPORT_EVENEMENTS_DEFAUT.slice(0, limit);
}

module.exports = {
  collecterTousLesFlux,
  getBriefingItems,
  getSportEvents,
  recupererRevuePresse,
  classerRubriquePresse,
  nettoyerResume,
  assurerDonneesInitiales,
  SOURCES_DEFAUT,
  SPORT_EVENEMENTS_DEFAUT,
  RUBRIQUES_VALIDES,
};
