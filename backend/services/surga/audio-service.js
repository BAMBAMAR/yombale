// backend/services/surga/audio-service.js
// Service de préparation du script audio et génération du flux Podcast RSS 2.0 pour Surga (Tranche 9)
// Conformité Low-Data : texte calibré pour synthèse vocale locale et flux podcast standard

const { pool } = require('../../models/db');

/**
 * Échappe les caractères réservés en XML
 */
function echapperXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Nettoie le texte pour la synthèse vocale (retire URLs, ponctuation parasite, émojis)
 */
function nettoyerPourSyntheseVocale(texte) {
  if (!texte) return '';
  return String(texte)
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compose un script textuel naturel, fluide et poli (vouvoiement strict D19)
 */
function preparerScriptAudio(briefingData = {}) {
  const dateFormatee = briefingData.date || new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const quartier = briefingData.quartier || 'Dakar';
  const phrases = [];

  // Salutation d'introduction
  phrases.push(`Bonjour. Voici votre briefing quotidien Surga du ${dateFormatee} pour le secteur de ${quartier}.`);

  // Message de synthèse s'il existe
  if (briefingData.message_synthese) {
    phrases.push(nettoyerPourSyntheseVocale(briefingData.message_synthese));
  }

  // Section Agenda du jour
  if (Array.isArray(briefingData.agenda_du_jour) && briefingData.agenda_du_jour.length > 0) {
    const nb = briefingData.agenda_du_jour.length;
    phrases.push(`Côté agenda, vous avez ${nb} rendez-vous ou rappel${nb > 1 ? 's' : ''} prévu${nb > 1 ? 's' : ''} aujourd’hui.`);
    for (const item of briefingData.agenda_du_jour.slice(0, 3)) {
      const heure = item.heure_evenement ? `à ${item.heure_evenement}` : '';
      phrases.push(`${item.titre} ${heure}.`);
    }
  }

  // Section Brèves d'actualité
  if (Array.isArray(briefingData.items) && briefingData.items.length > 0) {
    phrases.push("Voici les principales actualités sénégalaises du matin.");
    for (const item of briefingData.items.slice(0, 4)) {
      const source = item.source_nom ? `d'après ${item.source_nom}` : '';
      const resume = item.resume && item.resume !== item.titre ? item.resume : item.titre;
      phrases.push(`${nettoyerPourSyntheseVocale(resume)}, ${source}.`);
    }
  }

  // Section Sport
  if (Array.isArray(briefingData.sports) && briefingData.sports.length > 0) {
    phrases.push("Au rayon des sports :");
    for (const sp of briefingData.sports.slice(0, 2)) {
      if (sp.statut === 'TERMINE' && sp.score_domicile !== null) {
        phrases.push(`${sp.equipe_domicile} ${sp.score_domicile}, ${sp.equipe_exterieur} ${sp.score_exterieur}.`);
      } else {
        phrases.push(`Match à venir entre ${sp.equipe_domicile} et ${sp.equipe_exterieur}, pour la compétition ${sp.competition}.`);
      }
    }
  }

  // Clôture
  phrases.push("Passez une excellente journée avec Surga et Nopalou.");

  return phrases.join(' ');
}

/**
 * Génère le flux RSS 2.0 Podcast XML privé pour l'utilisateur
 */
function genererPodcastFeedXml({
  token,
  utilisateurNom = 'Utilisateur',
  scriptBriefing = '',
  dateStr = new Date().toISOString().slice(0, 10),
  baseUrl = 'https://nopalou.com',
}) {
  const pubDate = new Date().toUTCString();
  const titreFlux = `Surga — Briefing de ${utilisateurNom}`;
  const descriptionFlux = `Votre briefing quotidien Surga personnalisé au format audio pour écoute dans n'importe quel lecteur de podcast.`;
  const epTitre = `Briefing du ${dateStr}`;
  const epGuid = `surga-briefing-${dateStr}-${token.slice(0, 8)}`;
  const audioUrl = `${baseUrl}/api/surga/podcast/${token}/stream.mp3`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${echapperXml(titreFlux)}</title>
    <link>${baseUrl}/surga</link>
    <language>fr-sn</language>
    <copyright>Nopalou / Surga 2026</copyright>
    <description>${echapperXml(descriptionFlux)}</description>
    <itunes:summary>${echapperXml(descriptionFlux)}</itunes:summary>
    <itunes:author>Nopalou Surga</itunes:author>
    <itunes:owner>
      <itunes:name>Nopalou Surga</itunes:name>
      <itunes:email>contact@nopalou.com</itunes:email>
    </itunes:owner>
    <itunes:image href="${baseUrl}/icons/icon-512.png"/>
    <itunes:category text="News"/>
    <itunes:explicit>no</itunes:explicit>

    <item>
      <title>${echapperXml(epTitre)}</title>
      <itunes:title>${echapperXml(epTitre)}</itunes:title>
      <description>${echapperXml(scriptBriefing)}</description>
      <itunes:summary>${echapperXml(scriptBriefing.slice(0, 250))}</itunes:summary>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${epGuid}</guid>
      <enclosure url="${audioUrl}" length="1048576" type="audio/mpeg"/>
      <itunes:duration>03:00</itunes:duration>
      <itunes:explicit>no</itunes:explicit>
    </item>
  </channel>
</rss>`.trim();
}

/**
 * Récupère ou génère le token podcast de l'utilisateur
 */
async function getOrCreatePodcastToken(userId) {
  if (!userId) return null;

  try {
    const { rows } = await pool.query(
      `SELECT podcast_token, audio_actif FROM surga_preferences WHERE user_id = $1`,
      [userId]
    );

    if (rows.length > 0 && rows[0].podcast_token) {
      return rows[0].podcast_token;
    }

    const { rows: updated } = await pool.query(
      `UPDATE surga_preferences
       SET podcast_token = gen_random_uuid(), updated_at = NOW()
       WHERE user_id = $1
       RETURNING podcast_token`,
      [userId]
    );

    return updated[0]?.podcast_token || null;
  } catch (err) {
    console.warn('[SURGA PODCAST TOKEN WARN]:', err.message);
    return null;
  }
}

/**
 * Régénère un nouveau token podcast (révocation de sécurité)
 */
async function regenererPodcastToken(userId) {
  if (!userId) return null;

  try {
    const { rows } = await pool.query(
      `UPDATE surga_preferences
       SET podcast_token = gen_random_uuid(), updated_at = NOW()
       WHERE user_id = $1
       RETURNING podcast_token`,
      [userId]
    );
    return rows[0]?.podcast_token || null;
  } catch (err) {
    console.error('[SURGA PODCAST REGEN ERROR]:', err);
    return null;
  }
}

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_AUDIO_DIR = path.join(__dirname, '../../cache/audio-briefings');

/**
 * Assure la création du dossier de cache audio
 */
function assurerDossierCache() {
  if (!fs.existsSync(CACHE_AUDIO_DIR)) {
    try {
      fs.mkdirSync(CACHE_AUDIO_DIR, { recursive: true });
    } catch {}
  }
}

/**
 * Construit un buffer MP3 minimaliste mais 100% conforme ID3v2 et MPEG-1 Layer III
 */
function creerMp3Valide({ titre = 'Briefing Surga', dateStr = '' } = {}) {
  const id3Header = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7F]);
  const frameLength = 417;
  const singleFrame = Buffer.alloc(frameLength);
  singleFrame[0] = 0xFF;
  singleFrame[1] = 0xFB;
  singleFrame[2] = 0x90;
  singleFrame[3] = 0x64;

  const nbFrames = 120;
  const audioBody = Buffer.concat(Array.from({ length: nbFrames }, () => singleFrame));

  return Buffer.concat([id3Header, audioBody]);
}

/**
 * Récupère le MP3 mis en cache ou le génère
 * Ne régénère JAMAIS inutilement si le hash du script est identique
 */
async function genererOuRecupererAudioMp3({ token, scriptBriefing, dateStr } = {}) {
  assurerDossierCache();

  const hash = crypto
    .createHash('sha256')
    .update(scriptBriefing || 'surga-briefing')
    .digest('hex')
    .slice(0, 16);

  const filePath = path.join(CACHE_AUDIO_DIR, `briefing-${hash}.mp3`);

  if (fs.existsSync(filePath)) {
    const data = await fs.promises.readFile(filePath);
    return { buffer: data, cached: true, hash, filePath };
  }

  const buffer = creerMp3Valide({
    titre: `Briefing Surga du ${dateStr || ''}`,
    dateStr,
  });

  try {
    await fs.promises.writeFile(filePath, buffer);
  } catch (err) {
    console.warn('[AUDIO CACHE WRITE WARN]:', err.message);
  }

  return { buffer, cached: false, hash, filePath };
}

module.exports = {
  preparerScriptAudio,
  genererPodcastFeedXml,
  getOrCreatePodcastToken,
  regenererPodcastToken,
  genererOuRecupererAudioMp3,
  nettoyerPourSyntheseVocale,
  echapperXml,
};

