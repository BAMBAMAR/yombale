// backend/routes/surga/audio.js
// API Audio & Podcast privé pour l'assistant Surga (Tranche 9)

const express = require('express');
const router = express.Router();
const { pool } = require('../../models/db');
const { tokenOptional, verifierToken } = require('../../middlewares/surga-auth');
const {
  preparerScriptAudio,
  genererPodcastFeedXml,
  getOrCreatePodcastToken,
  regenererPodcastToken,
  genererOuRecupererAudioMp3,
} = require('../../services/surga/audio-service');
const { getBriefingItems, getSportEvents } = require('../../services/surga/rss-collector');
const { interpreterCommandeVocale } = require('../../services/surga/voice-interpreter');

// POST /api/surga/audio/interpret
// Interprète une commande vocale via architecture hybride L0 Fast Path + L1 Structured Output
router.post('/audio/interpret', async (req, res) => {
  try {
    const { texte } = req.body || {};
    if (!texte || typeof texte !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Le champ texte est obligatoire pour l\'interprétation vocale.',
      });
    }

    const { interpreterCommandeHybride } = require('../../services/surga/ai-interpreter');
    const interpretation = await interpreterCommandeHybride(texte);
    return res.json({
      success: true,
      data: interpretation,
    });
  } catch (err) {
    console.error('[SURGA VOICE INTERPRET ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'interprétation de la commande vocale.',
    });
  }
});

// GET /api/surga/audio/script
// Fournit le script formaté du briefing du jour pour la synthèse vocale locale
router.get('/audio/script', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId;
    let audioActif = false;
    let quartier = 'Dakar';

    if (userId) {
      try {
        const { rows } = await pool.query(
          'SELECT audio_actif, quartiers FROM surga_preferences WHERE user_id = $1',
          [userId]
        );
        if (rows.length > 0) {
          audioActif = !!rows[0].audio_actif;
          if (Array.isArray(rows[0].quartiers) && typeof rows[0].quartiers[0] === 'string' && rows[0].quartiers[0].trim()) {
            quartier = rows[0].quartiers[0];
          }
        }
      } catch {}
    }

    const [items, sports] = await Promise.all([
      getBriefingItems({ categories: ['actualites'], limit: 4 }),
      getSportEvents({ limit: 2 }),
    ]);

    const briefingData = {
      date: new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      quartier,
      items,
      sports,
    };

    const script = preparerScriptAudio(briefingData);

    return res.json({
      success: true,
      audio_actif: audioActif,
      script,
      date: briefingData.date,
      quartier,
    });
  } catch (err) {
    console.error('[SURGA AUDIO SCRIPT ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la préparation du script audio.',
    });
  }
});

// GET /api/surga/podcast/token
// Récupère ou génère l'URL du flux podcast privé de l'utilisateur
router.get('/podcast/token', tokenOptional, async (req, res) => {
  // D54 / SRG-A4-017 : podcast retiré du lancement (il servait trois secondes de silence). Route fermée tant que l'interrupteur est éteint.
  if (!require('../../services/surga/interrupteurs').podcastActif()) return res.status(404).json({ success: false, error: 'Not Found' });
  try {
    const userId = req.user?.userId;
    if (!userId) {
      // Pour les utilisateurs non connectés, retourner un token de démonstration local
      return res.json({
        success: true,
        connecte: false,
        token: 'invite-demo-token',
        feed_url: `${req.protocol}://${req.get('host')}/api/surga/podcast/invite-demo-token/feed.xml`,
      });
    }

    const token = await getOrCreatePodcastToken(userId);
    const feedUrl = `${req.protocol}://${req.get('host')}/api/surga/podcast/${token}/feed.xml`;

    return res.json({
      success: true,
      connecte: true,
      token,
      feed_url: feedUrl,
    });
  } catch (err) {
    console.error('[SURGA PODCAST TOKEN ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du token podcast.',
    });
  }
});

// POST /api/surga/podcast/regenerer-token
// Révocation de sécurité : régénère un nouveau jeton d'accès au podcast
router.post('/podcast/regenerer-token', verifierToken, async (req, res) => {
  // D54 / SRG-A4-017 : podcast retiré du lancement (il servait trois secondes de silence). Route fermée tant que l'interrupteur est éteint.
  if (!require('../../services/surga/interrupteurs').podcastActif()) return res.status(404).json({ success: false, error: 'Not Found' });
  try {
    const userId = req.user.userId;
    const nouveauToken = await regenererPodcastToken(userId);
    const feedUrl = `${req.protocol}://${req.get('host')}/api/surga/podcast/${nouveauToken}/feed.xml`;

    return res.json({
      success: true,
      token: nouveauToken,
      feed_url: feedUrl,
      message: 'Votre lien de podcast a été régénéré avec succès. L ancien lien ne fonctionne plus.',
    });
  } catch (err) {
    console.error('[SURGA PODCAST REGEN ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la régénération du jeton podcast.',
    });
  }
});

// GET /api/surga/podcast/:token/feed.xml
// Sert le flux RSS 2.0 Podcast XML privé
router.get('/podcast/:token/feed.xml', async (req, res) => {
  // D54 / SRG-A4-017 : podcast retiré du lancement (il servait trois secondes de silence). Route fermée tant que l'interrupteur est éteint.
  if (!require('../../services/surga/interrupteurs').podcastActif()) return res.status(404).json({ success: false, error: 'Not Found' });
  try {
    const { token } = req.params;
    let utilisateurNom = 'Abonné Surga';

    if (token !== 'invite-demo-token') {
      try {
        const { rows } = await pool.query(
          `SELECT u.prenom, u.nom, p.quartiers
           FROM surga_preferences p
           JOIN utilisateurs u ON u.id = p.user_id
           WHERE p.podcast_token = $1`,
          [token]
        );
        if (rows.length > 0) {
          utilisateurNom = `${rows[0].prenom || ''} ${rows[0].nom || ''}`.trim() || 'Abonné Surga';
        }
      } catch {}
    }

    const items = await getBriefingItems({ categories: ['actualites'], limit: 4 });
    const briefingData = {
      date: new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      quartier: 'Dakar',
      items,
    };

    const scriptBriefing = preparerScriptAudio(briefingData);
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const xml = genererPodcastFeedXml({
      token,
      utilisateurNom,
      scriptBriefing,
      baseUrl,
    });

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800'); // 30 minutes de cache podcast
    return res.send(xml);
  } catch (err) {
    console.error('[SURGA PODCAST XML ERROR]:', err);
    return res.status(500).send('Erreur lors de la génération du flux podcast.');
  }
});

// GET /api/surga/podcast/:token/stream.mp3
// Sert le flux audio MP3 du briefing (résolution du bug 404, en-têtes streaming et Range requests)
router.get('/podcast/:token/stream.mp3', async (req, res) => {
  // D54 / SRG-A4-017 : podcast retiré du lancement (il servait trois secondes de silence). Route fermée tant que l'interrupteur est éteint.
  if (!require('../../services/surga/interrupteurs').podcastActif()) return res.status(404).json({ success: false, error: 'Not Found' });
  try {
    const { token } = req.params;

    if (token !== 'invite-demo-token') {
      try {
        const { rows } = await pool.query(
          `SELECT user_id FROM surga_preferences WHERE podcast_token = $1`,
          [token]
        );
        if (rows.length === 0) {
          return res.status(404).send('Token podcast introuvable ou expiré.');
        }
      } catch {}
    }

    const items = await getBriefingItems({ categories: ['actualites'], limit: 4 });
    const briefingData = {
      date: new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      quartier: 'Dakar',
      items,
    };

    const scriptBriefing = preparerScriptAudio(briefingData);
    const { buffer } = await genererOuRecupererAudioMp3({
      token,
      scriptBriefing,
      dateStr: new Date().toISOString().slice(0, 10),
    });

    const totalLength = buffer.length;
    const range = req.headers.range;

    // Support des requêtes partielles HTTP 206 pour lecteurs de podcasts
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
      const chunksize = end - start + 1;
      const sliced = buffer.slice(start, end + 1);

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalLength}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      });
      return res.end(sliced);
    }

    res.writeHead(200, {
      'Content-Length': totalLength,
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    });
    return res.end(buffer);
  } catch (err) {
    console.error('[SURGA PODCAST STREAM MP3 ERROR]:', err);
    return res.status(500).send('Erreur lors de la génération audio.');
  }
});

module.exports = router;
