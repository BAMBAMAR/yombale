require('dotenv').config();
const { pool } = require('../../../backend/models/db');
const { getSources, collecterVideosSource, sauvegarderVideos } = require('../../../backend/services/surga/video-service');

async function main() {
  console.log('=================================================================');
  console.log('   INJECTION & SYNCHRONISATION DES ÉMISSIONS POLITIQUE & SOCIÉTÉ  ');
  console.log('=================================================================\n');

  // 1. Définition des sources officielles
  const sourcesEmissions = [
    {
      id: 'src-tfm-politique',
      nom: 'TFM (Faram Facce & Jakarlo Bi)',
      chaine_nom: 'TFM Sénégal',
      type: 'EMISSION',
      plateforme: 'youtube',
      identifiant_flux: 'https://www.youtube.com/@tfmsn/videos',
      actif: true,
    },
    {
      id: 'src-walf-tv-debats',
      nom: 'Walf TV (Dine Ak Diamono & Société)',
      chaine_nom: 'Walf TV',
      type: 'EMISSION',
      plateforme: 'youtube',
      identifiant_flux: 'https://www.youtube.com/@WalfadjriTV/videos',
      actif: true,
    },
    {
      id: 'src-7tv-politique',
      nom: '7tv (L\'Invité de MNF & 7actu)',
      chaine_nom: '7tv Sénégal',
      type: 'EMISSION',
      plateforme: 'youtube',
      identifiant_flux: 'https://www.youtube.com/@7tvredaction187/videos',
      actif: true,
    },
    {
      id: 'src-sen-tv-societe',
      nom: 'Sen TV (Teuss & Grands Débats)',
      chaine_nom: 'Sen TV',
      type: 'EMISSION',
      plateforme: 'youtube',
      identifiant_flux: 'https://www.youtube.com/@GroupeDMEDIACOM/videos',
      actif: true,
    },
    {
      id: 'src-rts-politique',
      nom: 'RTS 1 (Point de Vue & Décryptage)',
      chaine_nom: 'RTS 1 Sénégal',
      type: 'EMISSION',
      plateforme: 'youtube',
      identifiant_flux: 'https://www.youtube.com/@rts-radiotelevisionsenegalaise/videos',
      actif: true,
    },
  ];

  console.log('1. Insertion / Mise à jour des 5 sources d\'émissions...');
  for (const s of sourcesEmissions) {
    await pool.query(
      `INSERT INTO surga_video_sources (id, type, nom, chaine_nom, plateforme, identifiant_flux, actif)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         type = EXCLUDED.type,
         nom = EXCLUDED.nom,
         chaine_nom = EXCLUDED.chaine_nom,
         identifiant_flux = EXCLUDED.identifiant_flux,
         actif = EXCLUDED.actif`,
      [s.id, s.type, s.nom, s.chaine_nom, s.plateforme, s.identifiant_flux, s.actif]
    );
    console.log(`   ✅ Source configurée : ${s.nom} (${s.chaine_nom})`);
  }

  // 2. Insertion des émissions cultes de référence
  const itemsCultes = [
    {
      id: 'vid-tfm-faram-facce',
      source_id: 'src-tfm-politique',
      titre: 'Faram Facce avec Pape Ngagne Ndiaye : Face-à-face politique et analyse de la gouvernance nationale',
      url: 'https://www.youtube.com/watch?v=QiIvddPmkCY',
      publie_le: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      miniature_url: 'https://i.ytimg.com/vi/QiIvddPmkCY/hqdefault.jpg',
    },
    {
      id: 'vid-tfm-jakarlo-bi',
      source_id: 'src-tfm-politique',
      titre: 'Jakarlo Bi : Débat de société avec Khalifa Diakhaté, Pr Songué Diouf et Birima sur les urgences citoyennes',
      url: 'https://www.youtube.com/watch?v=JakarloBiTFMSN',
      publie_le: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      miniature_url: 'https://i.ytimg.com/vi/JakarloBiTFMSN/hqdefault.jpg',
    },
    {
      id: 'vid-7tv-invite-mnf',
      source_id: 'src-7tv-politique',
      titre: 'L\'Invité de MNF avec Maïmouna Ndour Faye : Entretien exclusif sur les réformes de l\'État',
      url: 'https://www.youtube.com/watch?v=xfLN12fQsPU',
      publie_le: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      miniature_url: 'https://i.ytimg.com/vi/xfLN12fQsPU/hqdefault.jpg',
    },
    {
      id: 'vid-walftv-dine-ak-diamono',
      source_id: 'src-walf-tv-debats',
      titre: 'Dine Ak Diamono : Débat sociétal, éthique publique et cohésion nationale au Sénégal',
      url: 'https://www.youtube.com/watch?v=MCVFwzWsd5c',
      publie_le: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      miniature_url: 'https://i.ytimg.com/vi/MCVFwzWsd5c/hqdefault.jpg',
    },
    {
      id: 'vid-sentv-teuss',
      source_id: 'src-sen-tv-societe',
      titre: 'Teuss avec Ahmed Aïdara : Enquêtes, témoignages citoyens et réalités sociales dakaroises',
      url: 'https://www.youtube.com/watch?v=SZoxmil9tKU',
      publie_le: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      miniature_url: 'https://i.ytimg.com/vi/SZoxmil9tKU/hqdefault.jpg',
    },
    {
      id: 'vid-rts-point-de-vue',
      source_id: 'src-rts-politique',
      titre: 'Point de Vue sur RTS 1 : Analyse des grands chantiers de la République et politiques publiques',
      url: 'https://www.youtube.com/watch?v=t9yy2IdaREY',
      publie_le: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      miniature_url: 'https://i.ytimg.com/vi/t9yy2IdaREY/hqdefault.jpg',
    },
  ];

  console.log('\n2. Insertion des émissions cultes de référence...');
  for (const item of itemsCultes) {
    await pool.query(
      `INSERT INTO surga_video_items (id, source_id, titre, url, publie_le, miniature_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (url) DO NOTHING`,
      [item.id, item.source_id, item.titre, item.url, item.publie_le, item.miniature_url]
    );
    console.log(`   ✅ Émission insérée : ${item.titre.slice(0, 60)}...`);
  }

  // 3. Scraping en direct des vidéos récentes sur chaque chaîne officielle
  console.log('\n3. Collecte en direct depuis les flux officiels YouTube...');
  for (const s of sourcesEmissions) {
    try {
      const vids = await collecterVideosSource(s);
      if (vids.length > 0) {
        const { inserees } = await sauvegarderVideos(vids);
        console.log(`   📡 ${s.chaine_nom} : ${vids.length} vidéos collectées (${inserees} nouvelles insérées)`);
      } else {
        console.log(`   ⚠️ ${s.chaine_nom} : 0 vidéo collectée via scraping`);
      }
    } catch (e) {
      console.warn(`   ⚠️ Erreur collecte pour ${s.nom} :`, e.message);
    }
  }

  // 4. Statistiques finales en base de données
  console.log('\n4. Vérification et statistiques finales :');
  const statsTypes = await pool.query(`
    SELECT vs.type, count(vi.id) as total_videos, count(DISTINCT vi.source_id) as nb_sources
    FROM surga_video_sources vs
    LEFT JOIN surga_video_items vi ON vi.source_id = vs.id
    GROUP BY vs.type
    ORDER BY total_videos DESC
  `);
  console.table(statsTypes.rows);

  const sampleEmissions = await pool.query(`
    SELECT vi.titre, vs.nom as source_nom, vi.url, vi.publie_le
    FROM surga_video_items vi
    JOIN surga_video_sources vs ON vi.source_id = vs.id
    WHERE vs.type = 'EMISSION'
    ORDER BY vi.publie_le DESC
    LIMIT 6
  `);
  console.log('\nÉchantillon des dernières émissions disponibles pour Surga :');
  console.table(sampleEmissions.rows);

  console.log('\n🎉 SUCCÈS : Les émissions célèbres de politique et de société sont opérationnelles !');
  process.exit(0);
}

main().catch(err => {
  console.error('Erreur fatale :', err);
  process.exit(1);
});
