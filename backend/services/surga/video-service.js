// backend/services/surga/video-service.js
// Service de gestion et collecte des alertes vidéos : Séries TV et Lutte sénégalaise (Tranche 17)
// Sourcing officiel YouTube Atom/RSS & scraping léger, dédoublonnage strict par URL, Low-Data par défaut
// Zéro émoji Unicode, vouvoiement strict D19

const axios = require('axios');
const cheerio = require('cheerio');
const { pool } = require('../../models/db');

/**
 * Catalogue référentiel des chaînes et flux officiels sénégalais par défaut
 */
const SOURCES_DEFAUT = [
  {
    id: 'src-marodi-tv',
    nom: 'Marodi TV (Séries & Fictions)',
    chaine_nom: 'Marodi TV Sénégal',
    type: 'SERIE',
    plateforme: 'youtube',
    identifiant_flux: 'https://www.youtube.com/channel/UCqe0sSESmaQbLFdTExctQLA/videos',
    actif: true,
  },
  {
    id: 'src-evenprod',
    nom: 'EvenProd (Séries & Productions)',
    chaine_nom: 'EvenProd Sénégal',
    type: 'SERIE',
    plateforme: 'youtube',
    identifiant_flux: 'https://www.youtube.com/@EvenProd/videos',
    actif: true,
  },
  {
    id: 'src-pikini-prod',
    nom: 'Pikini Production (Séries & Théâtre)',
    chaine_nom: 'Pikini Production',
    type: 'SERIE',
    plateforme: 'youtube',
    identifiant_flux: 'https://www.youtube.com/@PikiniProduction/videos',
    actif: true,
  },
  {
    id: 'src-lutte-tv',
    nom: 'Lutte TV (Combats & Face-à-Face)',
    chaine_nom: 'Lutte TV Sénégal',
    type: 'LUTTE',
    plateforme: 'youtube',
    identifiant_flux: 'https://www.youtube.com/@LutteTV/videos',
    actif: true,
  },
  {
    id: 'src-albourakh-events',
    nom: 'Albourakh Events (Grandes Affiches)',
    chaine_nom: 'Albourakh Events',
    type: 'LUTTE',
    plateforme: 'youtube',
    identifiant_flux: 'https://www.youtube.com/@AlbourakhEventsTV/videos',
    actif: true,
  },
  {
    id: 'src-gaston-prod',
    nom: 'Gaston Productions (Lamb Ji)',
    chaine_nom: 'Gaston Productions',
    type: 'LUTTE',
    plateforme: 'youtube',
    identifiant_flux: 'https://www.youtube.com/@GastonProductions_/videos',
    actif: true,
  },
];

/**
 * Catalogue initial authentique avec liens directs YouTube valides
 */
const ITEMS_MOCK = [
  {
    id: 'vid-evenprod-1',
    source_id: 'src-evenprod',
    source_nom: 'EvenProd (Séries & Productions)',
    source_type: 'SERIE',
    chaine_nom: 'EvenProd Sénégal',
    titre: 'FASSÉMA - Saison 2 - Episode 7 **VOSTFR**',
    url: 'https://www.youtube.com/watch?v=kzRCnSvgdA8',
    publie_le: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    miniature_url: 'https://i.ytimg.com/vi/kzRCnSvgdA8/hq720.jpg',
  },
  {
    id: 'vid-marodi-1',
    source_id: 'src-marodi-tv',
    source_nom: 'Marodi TV (Séries & Fictions)',
    source_type: 'SERIE',
    chaine_nom: 'Marodi TV Sénégal',
    titre: 'Série - Jeux de dames - Saison 2 - Episode 13 - VOSTFR',
    url: 'https://www.youtube.com/watch?v=jqsoI3NafG4',
    publie_le: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    miniature_url: 'https://i.ytimg.com/vi/jqsoI3NafG4/hq720.jpg',
  },
  {
    id: 'vid-lutte-1',
    source_id: 'src-lutte-tv',
    source_nom: 'Lutte TV (Combats & Face-à-Face)',
    source_type: 'LUTTE',
    chaine_nom: 'Lutte TV Sénégal',
    titre: '"Ada Fass mofiye dieulé Balla Gaye": Bébé Diène cash sur le choc de générations',
    url: 'https://www.youtube.com/watch?v=g0Lhk8uxjsk',
    publie_le: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    miniature_url: 'https://i.ytimg.com/vi/g0Lhk8uxjsk/hq720.jpg',
  },
  {
    id: 'vid-albourakh-1',
    source_id: 'src-albourakh-events',
    source_nom: 'Albourakh Events (Grandes Affiches)',
    source_type: 'LUTTE',
    chaine_nom: 'Albourakh Events',
    titre: 'Ahmeth Lac Rose attaque violemment Talfa : " Mor 2K est beaucoup plus prêt. Paréwoul "',
    url: 'https://www.youtube.com/watch?v=pXZ_sqDH7h4',
    publie_le: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    miniature_url: 'https://i.ytimg.com/vi/pXZ_sqDH7h4/hq720.jpg',
  },
  {
    id: 'vid-evenprod-2',
    source_id: 'src-evenprod',
    source_nom: 'EvenProd (Séries & Productions)',
    source_type: 'SERIE',
    chaine_nom: 'EvenProd Sénégal',
    titre: 'BÉTÉ BÉTÉ - Saison 4 - Episode 5 **VOSTFR**',
    url: 'https://www.youtube.com/watch?v=B4J_2svYKpo',
    publie_le: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    miniature_url: 'https://i.ytimg.com/vi/B4J_2svYKpo/hq720.jpg',
  },
  {
    id: 'vid-pikini-1',
    source_id: 'src-pikini-prod',
    source_nom: 'Pikini Production (Séries & Théâtre)',
    source_type: 'SERIE',
    chaine_nom: 'Pikini Production',
    titre: 'TOUMAAL GOR - EPISODE 03',
    url: 'https://www.youtube.com/watch?v=pJ5JJ2GjV5c',
    publie_le: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    miniature_url: 'https://i.ytimg.com/vi/pJ5JJ2GjV5c/hq720.jpg',
  },
  {
    id: 'vid-marodi-2',
    source_id: 'src-marodi-tv',
    source_nom: 'Marodi TV (Séries & Fictions)',
    source_type: 'SERIE',
    chaine_nom: 'Marodi TV Sénégal',
    titre: 'Série - Sous Le Masque - Episode 13',
    url: 'https://www.youtube.com/watch?v=2rtZ-LseMiw',
    publie_le: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    miniature_url: 'https://i.ytimg.com/vi/2rtZ-LseMiw/hq720.jpg',
  },
  {
    id: 'vid-gaston-1',
    source_id: 'src-gaston-prod',
    source_nom: 'Gaston Productions (Lamb Ji)',
    source_type: 'LUTTE',
    chaine_nom: 'Gaston Productions',
    titre: 'Aalhou Akbar Mor kang kang khaptalou na Talfa Damakoy Ray',
    url: 'https://www.youtube.com/watch?v=jESICALzpls',
    publie_le: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
    miniature_url: 'https://i.ytimg.com/vi/jESICALzpls/hq720.jpg',
  },
  {
    id: 'vid-lutte-2',
    source_id: 'src-lutte-tv',
    source_nom: 'Lutte TV (Combats & Face-à-Face)',
    source_type: 'LUTTE',
    chaine_nom: 'Lutte TV Sénégal',
    titre: 'Bébé Diène hausse le ton: "Zarko souma eupé doolé ma bayi lamb "',
    url: 'https://www.youtube.com/watch?v=Ma5WAm4-3Lo',
    publie_le: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    miniature_url: 'https://i.ytimg.com/vi/Ma5WAm4-3Lo/hq720.jpg',
  },
  {
    id: 'vid-albourakh-2',
    source_id: 'src-albourakh-events',
    source_nom: 'Albourakh Events (Grandes Affiches)',
    source_type: 'LUTTE',
    chaine_nom: 'Albourakh Events',
    titre: 'Serigne Ndiaye et Djimbory font de grosses révélations sur Yékini',
    url: 'https://www.youtube.com/watch?v=IJazcY396YQ',
    publie_le: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    miniature_url: 'https://i.ytimg.com/vi/IJazcY396YQ/hq720.jpg',
  },
  {
    id: 'vid-gaston-2',
    source_id: 'src-gaston-prod',
    source_nom: 'Gaston Productions (Lamb Ji)',
    source_type: 'LUTTE',
    chaine_nom: 'Gaston Productions',
    titre: 'Modou Anta alerte et lance un message fort "Combat yi dafa xadioul arène"',
    url: 'https://www.youtube.com/watch?v=Ip7a0N7gi34',
    publie_le: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    miniature_url: 'https://i.ytimg.com/vi/Ip7a0N7gi34/hq720.jpg',
  },
];

let sourcesMemoire = JSON.parse(JSON.stringify(SOURCES_DEFAUT));
let itemsMemoire = JSON.parse(JSON.stringify(ITEMS_MOCK));
let abonnementsMemoire = []; // { id, user_id, source_id, canal, created_at }

/**
 * Assure la création idempotente et l'initialisation des sources et vidéos par défaut
 */
async function assurerSourcesInitiales() {
  if (!pool) return;
  try {
    for (const src of SOURCES_DEFAUT) {
      await pool.query(
        `INSERT INTO surga_video_sources (id, type, nom, chaine_nom, plateforme, identifiant_flux, actif)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           nom = EXCLUDED.nom,
           chaine_nom = EXCLUDED.chaine_nom,
           identifiant_flux = EXCLUDED.identifiant_flux,
           actif = EXCLUDED.actif`,
        [src.id, src.type, src.nom, src.chaine_nom, src.plateforme, src.identifiant_flux, src.actif]
      );
    }

    // Si la table surga_video_items est vide, insérer immédiatement les vidéos authentiques
    const countRes = await pool.query('SELECT COUNT(*) FROM surga_video_items');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      for (const item of ITEMS_MOCK) {
        await pool.query(
          `INSERT INTO surga_video_items (id, source_id, titre, url, publie_le, miniature_url)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (url) DO NOTHING`,
          [item.id, item.source_id, item.titre, item.url, item.publie_le, item.miniature_url]
        );
      }
    }
  } catch (err) {
    console.warn('[SURGA VIDEO SERVICE] Initialisation sources warn:', err.message);
  }
}

/**
 * Construit l'URL du flux Atom/RSS selon l'identifiant (channelId ou playlistId)
 */
function construireUrlFlux(identifiantFlux) {
  if (!identifiantFlux) return null;
  const id = identifiantFlux.trim();
  if (id.startsWith('http://') || id.startsWith('https://')) {
    return id;
  }
  if (id.startsWith('PL')) {
    return `https://www.youtube.com/feeds/videos.xml?playlist_id=${id}`;
  }
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`;
}

/**
 * Collecte et parse les vidéos récentes d'une source YouTube
 */
async function collecterVideosSource(source) {
  const identifiant = source.identifiant_flux;
  if (!identifiant) return [];

  // 1. Si c'est une URL de chaîne YouTube ou onglet /videos
  if (identifiant.includes('youtube.com/') && !identifiant.includes('.xml')) {
    try {
      const res = await axios.get(identifiant, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'fr-FR,fr;q=0.9',
        },
        timeout: 9000,
      });

      const jsonMatch = res.data.match(/ytInitialData\s*=\s*({.+?});/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1]);
        const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs;
        const videosTab = tabs?.find((t) => t.tabRenderer?.title === 'Vidéos' || t.tabRenderer?.title === 'Videos');
        const items = videosTab?.tabRenderer?.content?.richGridRenderer?.contents || [];

        const videos = [];
        for (const item of items) {
          const lockup = item.richItemRenderer?.content?.lockupViewModel;
          if (lockup && lockup.contentId) {
            const videoId = lockup.contentId;
            const titre = lockup.metadata?.lockupMetadataViewModel?.title?.content;
            const thumb = lockup.contentImage?.thumbnailViewModel?.image?.sources?.[0]?.url || null;
            if (titre) {
              videos.push({
                source_id: source.id,
                titre,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                publie_le: new Date().toISOString(),
                miniature_url: thumb,
              });
            }
          }
        }
        if (videos.length > 0) return videos;
      }
    } catch (err) {
      console.warn(`[SURGA VIDEO YOUTUBE] Collecte (${source.nom}):`, err.message);
    }
  }

  // 2. Repli Atom/RSS XML classique
  const urlFlux = construireUrlFlux(identifiant);
  if (!urlFlux) return [];

  try {
    const res = await axios.get(urlFlux, {
      timeout: 7000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NopalouSurgaBot/1.0',
        Accept: 'application/atom+xml,application/xml,text/xml,*/*',
      },
    });

    const $ = cheerio.load(res.data, { xmlMode: true });
    const videos = [];

    $('entry').each((_, el) => {
      const item = $(el);
      const titre = item.find('title').first().text().trim();
      let url = item.find('link[rel="alternate"]').attr('href') || item.find('link').attr('href');
      if (!url) {
        const videoId = item.find('yt\\:videoId').text().trim() || item.find('videoId').text().trim();
        if (videoId) {
          url = `https://www.youtube.com/watch?v=${videoId}`;
        }
      }

      const publieLe = item.find('published').first().text().trim() || item.find('updated').first().text().trim();
      const miniature = item.find('media\\:thumbnail').attr('url') || null;

      if (titre && url) {
        videos.push({
          source_id: source.id,
          titre,
          url,
          publie_le: publieLe ? new Date(publieLe).toISOString() : new Date().toISOString(),
          miniature_url: miniature,
        });
      }
    });

    return videos;
  } catch (err) {
    console.warn(`[SURGA VIDEO RSS] Échec collecte flux (${source.nom}):`, err.message);
    return [];
  }
}

/**
 * Enregistre les vidéos en base avec dédoublonnage strict
 */
async function sauvegarderVideos(videos) {
  if (!videos || !videos.length) return { inserees: 0, total: 0 };
  let inserees = 0;

  if (pool) {
    let dbFailed = false;
    for (const v of videos) {
      try {
        const id = `vid-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
        const res = await pool.query(
          `INSERT INTO surga_video_items (id, source_id, titre, url, publie_le, miniature_url)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (url) DO NOTHING
           RETURNING id`,
          [id, v.source_id, v.titre, v.url, v.publie_le, v.miniature_url]
        );
        if (res.rowCount > 0) {
          inserees++;
        }
      } catch (err) {
        dbFailed = true;
        break;
      }
    }
    if (!dbFailed) {
      return { inserees, total: videos.length };
    }
  }

  // Repli mémoire si DB inaccessible
  inserees = 0;
  for (const v of videos) {
    const existe = itemsMemoire.some((item) => item.url === v.url);
    if (!existe) {
      itemsMemoire.unshift({
        id: `vid-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        ...v,
      });
      inserees++;
    }
  }

  return { inserees, total: videos.length };
}

/**
 * Récupère les sources (Séries, Lutte, etc.)
 */
async function getSources({ type = null, actifOnly = true } = {}) {
  await assurerSourcesInitiales();

  if (pool) {
    try {
      const conditions = [];
      const params = [];

      if (type) {
        params.push(type.toUpperCase());
        conditions.push(`type = $${params.length}`);
      }

      if (actifOnly) {
        conditions.push(`actif = true`);
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const { rows } = await pool.query(
        `SELECT * FROM surga_video_sources ${where} ORDER BY type ASC, nom ASC`,
        params
      );
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch (err) {
      // Repli mémoire
    }
  }

  return sourcesMemoire.filter((s) => {
    if (type && s.type.toUpperCase() !== type.toUpperCase()) return false;
    if (actifOnly && !s.actif) return false;
    return true;
  });
}

/**
 * Récupère les dernières vidéos publiées
 */
async function getDernieresVideos({ limit = 30, type = null, sourceId = null, userId = null } = {}) {
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
  await assurerSourcesInitiales();

  if (pool) {
    try {
      const conditions = ['vs.actif = true'];
      const params = [];

      if (type) {
        params.push(type.toUpperCase());
        conditions.push(`vs.type = $${params.length}`);
      }

      if (sourceId) {
        params.push(sourceId);
        conditions.push(`vi.source_id = $${params.length}`);
      }

      if (userId) {
        params.push(userId);
        conditions.push(`EXISTS (SELECT 1 FROM surga_video_abonnements va WHERE va.user_id = $${params.length} AND va.source_id = vi.source_id)`);
      }

      params.push(l);
      const query = `
        WITH RankedVideos AS (
          SELECT vi.id, vi.source_id, vi.titre, vi.url, vi.publie_le, vi.miniature_url,
                 vs.nom as source_nom, vs.type as source_type, vs.chaine_nom,
                 ROW_NUMBER() OVER (PARTITION BY vi.source_id ORDER BY vi.publie_le DESC, vi.id DESC) as rang_source
          FROM surga_video_items vi
          JOIN surga_video_sources vs ON vi.source_id = vs.id
          WHERE ${conditions.join(' AND ')}
        )
        SELECT id, source_id, titre, url, publie_le, miniature_url, source_nom, source_type, chaine_nom
        FROM RankedVideos
        ORDER BY rang_source ASC, publie_le DESC
        LIMIT $${params.length}
      `;

      const { rows } = await pool.query(query, params);
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch (err) {
      // Repli mémoire
    }
  }

  // Repli mémoire
  let resultat = itemsMemoire.map((item) => {
    const s = sourcesMemoire.find((x) => x.id === item.source_id);
    return {
      ...item,
      source_nom: s?.nom || item.source_nom,
      source_type: s?.type || item.source_type,
      chaine_nom: s?.chaine_nom || '',
    };
  });

  if (type) {
    resultat = resultat.filter((item) => item.source_type?.toUpperCase() === type.toUpperCase());
  }

  if (sourceId) {
    resultat = resultat.filter((item) => item.source_id === sourceId);
  }

  if (userId) {
    const abos = abonnementsMemoire.filter((a) => a.user_id === userId).map((a) => a.source_id);
    resultat = resultat.filter((item) => abos.includes(item.source_id));
  }

  return resultat.slice(0, l);
}

/**
 * Récupère les abonnements d'un utilisateur
 */
async function getAbonnementsUtilisateur(userId) {
  if (!userId) return [];

  if (pool) {
    try {
      const { rows } = await pool.query(
        `SELECT va.id, va.source_id, va.canal, va.created_at,
                vs.nom as source_nom, vs.type as source_type, vs.chaine_nom
         FROM surga_video_abonnements va
         JOIN surga_video_sources vs ON va.source_id = vs.id
         WHERE va.user_id = $1
         ORDER BY va.created_at DESC`,
        [userId]
      );
      return rows;
    } catch (err) {
      // Repli mémoire
    }
  }

  return abonnementsMemoire.filter((a) => a.user_id === userId);
}

/**
 * Bascule l'abonnement à une source vidéo pour un utilisateur (Toggle)
 */
async function toggleAbonnementUtilisateur(userId, sourceId, canal = 'in_app') {
  if (!userId || !sourceId) {
    throw new Error('Identifiants utilisateur et source requis.');
  }

  if (pool) {
    try {
      const checkRes = await pool.query(
        `SELECT id FROM surga_video_abonnements WHERE user_id = $1 AND source_id = $2`,
        [userId, sourceId]
      );

      if (checkRes.rows.length > 0) {
        await pool.query(
          `DELETE FROM surga_video_abonnements WHERE user_id = $1 AND source_id = $2`,
          [userId, sourceId]
        );
        return { abonne: false, source_id: sourceId };
      } else {
        await pool.query(
          `INSERT INTO surga_video_abonnements (user_id, source_id, canal)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, source_id) DO NOTHING`,
          [userId, sourceId, canal || 'in_app']
        );
        return { abonne: true, source_id: sourceId };
      }
    } catch (err) {
      // Repli mémoire
    }
  }

  const idx = abonnementsMemoire.findIndex((a) => a.user_id === userId && a.source_id === sourceId);
  if (idx >= 0) {
    abonnementsMemoire.splice(idx, 1);
    return { abonne: false, source_id: sourceId };
  } else {
    abonnementsMemoire.push({
      id: `abo-${Date.now().toString(36)}`,
      user_id: userId,
      source_id: sourceId,
      canal: canal || 'in_app',
      created_at: new Date().toISOString(),
    });
    return { abonne: true, source_id: sourceId };
  }
}

/**
 * Ajoute ou met à jour une source de vidéos (Administration)
 */
async function sauvegarderSourceAdmin({ id, nom, chaine_nom, type = 'SERIE', identifiant_flux, plateforme = 'youtube', actif = true }) {
  if (!nom || !identifiant_flux) {
    throw new Error('Le nom et l identifiant de flux sont requis.');
  }

  const sourceId = (id || `src-${nom.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`).substring(0, 50);

  if (pool) {
    try {
      const query = `
        INSERT INTO surga_video_sources (id, type, nom, chaine_nom, plateforme, identifiant_flux, actif, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (id) DO UPDATE SET
          type = EXCLUDED.type,
          nom = EXCLUDED.nom,
          chaine_nom = EXCLUDED.chaine_nom,
          plateforme = EXCLUDED.plateforme,
          identifiant_flux = EXCLUDED.identifiant_flux,
          actif = EXCLUDED.actif,
          updated_at = NOW()
        RETURNING *
      `;
      const { rows } = await pool.query(query, [sourceId, type.toUpperCase(), nom, chaine_nom || '', plateforme, identifiant_flux, !!actif]);
      return rows[0];
    } catch (err) {
      // Repli mémoire
    }
  }

  const existante = sourcesMemoire.find((s) => s.id === sourceId);
  if (existante) {
    Object.assign(existante, { nom, chaine_nom, type, identifiant_flux, plateforme, actif });
    return existante;
  }

  const nouvelle = { id: sourceId, nom, chaine_nom, type, identifiant_flux, plateforme, actif };
  sourcesMemoire.push(nouvelle);
  return nouvelle;
}

/**
 * Supprime une source de vidéos (Administration)
 */
async function supprimerSourceAdmin(id) {
  if (!id) return false;

  if (pool) {
    try {
      const res = await pool.query(`DELETE FROM surga_video_sources WHERE id = $1`, [id]);
      return res.rowCount > 0;
    } catch (err) {
      // Repli mémoire
    }
  }

  const idx = sourcesMemoire.findIndex((s) => s.id === id);
  if (idx >= 0) {
    sourcesMemoire.splice(idx, 1);
    return true;
  }
  return false;
}

/**
 * Collecte et synchronise l'ensemble des flux vidéo actifs
 */
async function synchroniserTousLesFlux() {
  const sources = await getSources({ actifOnly: true });
  let totalInserees = 0;
  const rapport = [];

  for (const src of sources) {
    try {
      const videos = await collecterVideosSource(src);
      const res = await sauvegarderVideos(videos);
      totalInserees += res.inserees;
      rapport.push({ source: src.nom, trouvees: videos.length, nouvelles: res.inserees });
    } catch (e) {
      rapport.push({ source: src.nom, erreur: e.message });
    }
  }

  return {
    succes: true,
    sources_traitees: sources.length,
    nouvelles_videos_inserees: totalInserees,
    rapport,
  };
}

module.exports = {
  getSources,
  getDernieresVideos,
  getAbonnementsUtilisateur,
  toggleAbonnementUtilisateur,
  sauvegarderSourceAdmin,
  supprimerSourceAdmin,
  collecterVideosSource,
  sauvegarderVideos,
  synchroniserTousLesFlux,
  construireUrlFlux,
  SOURCES_DEFAUT,
  ITEMS_MOCK,
};
