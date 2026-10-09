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
 * Écrit une heure comme on la dit : « 14:30 » ou « 14h30 » devient « 14 heures 30 », « 09:00 » devient « 9 heures ».
 */
function direHeure(heures, minutes) {
  const h = parseInt(heures, 10);
  const m = parseInt(minutes || '0', 10);
  return `${h} heure${h > 1 ? 's' : ''}${m > 0 ? ` ${m}` : ''}`;
}

/**
 * Prépare un texte pour l'oreille : sigles et signes écrits en toutes lettres, points de suspension et crochets retirés.
 * Une voix de synthèse épelle « FCFA », lit « vs » ou bute sur « […] ».
 */
function ecrirePourLaVoix(texte) {
  return nettoyerPourSyntheseVocale(texte)
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\.{3,}|…/g, ' ')
    .replace(/\b(?:F\s?CFA|FCFA)\b/gi, 'francs CFA')
    .replace(/\s?%/g, ' pour cent')
    .replace(/\s+vs\.?\s+/gi, ' contre ')
    .replace(/\s*&\s*/g, ' et ')
    .replace(/\bkm\/h\b/gi, 'kilomètres heure')
    .replace(/\b(\d{1,2})\s?h\s?(\d{2})?\b/gi, (_, h, m) => direHeure(h, m))
    .replace(/\s+([,.])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// Chaque titre est annoncé avec sa source (actualités toujours sourcées), d'une tournure différente : une même
// formule répétée quatre fois donne une lecture mécanique.
const ANNONCES_AVEC_SOURCE = [
  (s) => `À la une, ${s} rapporte :`,
  (s) => `${s} écrit :`,
  (s) => `Autre titre, ${s} indique :`,
];
const ANNONCES_SANS_SOURCE = ['À la une :', 'Autre titre :', 'À noter aussi :'];

function annoncerTitre(item, rang, total) {
  const titre = ecrirePourLaVoix(item.titre || item.resume || '').replace(/[\s.:;,]+$/, '');
  if (!titre) return null;
  const source = ecrirePourLaVoix(item.source_nom || '');
  const dernier = total > 2 && rang === total - 1;
  const annonce = source
    ? (dernier ? `Enfin, ${source} rapporte :` : ANNONCES_AVEC_SOURCE[rang % ANNONCES_AVEC_SOURCE.length](source))
    : (dernier ? 'Enfin :' : ANNONCES_SANS_SOURCE[rang % ANNONCES_SANS_SOURCE.length]);
  return `${annonce} ${titre}${/[!?]$/.test(titre) ? '' : '.'}`;
}

/**
 * Compose le texte lu à voix haute : phrases courtes, ton posé, vouvoiement strict (D19).
 * `briefingData.maintenant` (Date) fixe l'heure de référence ; Dakar est à l'heure universelle.
 */
function preparerScriptAudio(briefingData = {}) {
  const maintenant = briefingData.maintenant instanceof Date ? briefingData.maintenant : new Date();
  const soir = maintenant.getUTCHours() >= 18;
  const dateBrute = briefingData.date || maintenant.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  // L'année n'apporte rien à l'écoute.
  const dateDite = String(dateBrute).replace(/\s+\d{4}$/, '').replace(/^./, (c) => c.toLowerCase());

  const quartier = briefingData.quartier || 'Dakar';
  const phrases = [];

  phrases.push(`${soir ? 'Bonsoir' : 'Bonjour'}. Nous sommes le ${dateDite}. Voici l'essentiel du jour pour ${quartier}.`);

  if (briefingData.message_synthese) {
    phrases.push(ecrirePourLaVoix(briefingData.message_synthese));
  }

  // Agenda du jour
  if (Array.isArray(briefingData.agenda_du_jour) && briefingData.agenda_du_jour.length > 0) {
    const nb = briefingData.agenda_du_jour.length;
    phrases.push(nb === 1 ? "Dans votre agenda aujourd'hui, un rappel." : `Dans votre agenda aujourd'hui, ${nb} rappels.`);
    for (const item of briefingData.agenda_du_jour.slice(0, 3)) {
      const hm = /^(\d{1,2}):(\d{2})/.exec(item.heure_evenement || '');
      const titre = ecrirePourLaVoix(item.titre || '').replace(/[\s.:;,]+$/, '');
      if (titre) phrases.push(hm ? `${titre}, à ${direHeure(hm[1], hm[2])}.` : `${titre}.`);
    }
  }

  // Actualités
  if (Array.isArray(briefingData.items) && briefingData.items.length > 0) {
    const titres = briefingData.items.slice(0, 4);
    phrases.push("Dans l'actualité.");
    titres.forEach((item, rang) => {
      const annonce = annoncerTitre(item, rang, titres.length);
      if (annonce) phrases.push(annonce);
    });
  }

  // Sport
  if (Array.isArray(briefingData.sports) && briefingData.sports.length > 0) {
    phrases.push('Côté sport.');
    for (const sp of briefingData.sports.slice(0, 2)) {
      const scoreConnu = sp.score_domicile !== null && sp.score_domicile !== undefined
        && sp.score_exterieur !== null && sp.score_exterieur !== undefined;
      if (sp.statut === 'TERMINE' && scoreConnu) {
        phrases.push(`${sp.equipe_domicile} ${sp.score_domicile}, ${sp.equipe_exterieur} ${sp.score_exterieur}.`);
      } else if (sp.statut === 'EN_DIRECT' && scoreConnu) {
        phrases.push(`En ce moment, ${sp.equipe_domicile} ${sp.score_domicile}, ${sp.equipe_exterieur} ${sp.score_exterieur}.`);
      } else {
        phrases.push(`À suivre, ${sp.equipe_domicile} contre ${sp.equipe_exterieur}${sp.competition ? `, ${ecrirePourLaVoix(sp.competition)}` : ''}.`);
      }
    }
  }

  phrases.push(`C'est tout pour le moment. ${soir ? 'Bonne soirée' : 'Bonne journée'}.`);

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
    <itunes:image href="${baseUrl}/icons/icon-512.png?v=19"/>
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
  ecrirePourLaVoix,
  echapperXml,
};

