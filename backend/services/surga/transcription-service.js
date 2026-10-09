// backend/services/surga/transcription-service.js
// Service de transcription vocale haute vitesse via Groq Whisper (Tranche Voix)
// Modèle cible : whisper-large-v3-turbo (latence < 400ms, français natif)

const axios = require('axios');
const cfg = require('../../lib/settingsCache');

const GROQ_AUDIO_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

/**
 * Récupère la clé API Groq depuis les variables d'environnement ou le cache de paramètres
 */
async function getGroqApiKey() {
  return (
    process.env.GROQ_API_KEY ||
    (await cfg.get('groq_api_key')) ||
    null
  );
}

/**
 * Transcrit un buffer audio en texte via Groq Whisper-large-v3-turbo
 * @param {Buffer} audioBuffer Données binaires du fichier audio (ogg, mp3, m4a, wav)
 * @param {Object} options
 * @param {string} [options.filename='voice.ogg'] Nom du fichier avec extension
 * @param {string} [options.language='fr'] Langue de transcription
 * @param {string} [options.prompt] Contexte ou lexique (ex: FCFA, Dakar, transport)
 * @returns {Promise<{ success: boolean, texte: string, latenceMs: number, source: string, error?: string }>}
 */
async function transcrireAudioBuffer(audioBuffer, options = {}) {
  const t0 = Date.now();
  const filename = options.filename || 'voice.ogg';
  const language = options.language || 'fr';
  const prompt = options.prompt || 'Surga assistant Sénégal, montants en FCFA, transport taxi, courses repas, agenda rappel.';

  if (!audioBuffer || !(audioBuffer instanceof Buffer) || audioBuffer.length === 0) {
    return {
      success: false,
      texte: '',
      latenceMs: 0,
      source: 'erreur_entree',
      error: 'Buffer audio vide ou non valide.',
    };
  }

  const apiKey = await getGroqApiKey();

  // Si aucune clé Groq configurée : retour propre avec explication pour dégradation gracieuse
  if (!apiKey) {
    console.warn('[GROQ WHISPER]: Aucune clé GROQ_API_KEY configurée. Bascule en mode dégradé.');
    return {
      success: false,
      texte: '',
      latenceMs: Date.now() - t0,
      source: 'no_api_key',
      error: 'Clé API Groq non configurée.',
    };
  }

  try {
    const FormData = require('form-data');
    const form = new FormData();

    form.append('file', audioBuffer, {
      filename,
      contentType: filename.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg',
    });
    form.append('model', 'whisper-large-v3-turbo');
    form.append('language', language);
    form.append('temperature', '0');
    form.append('response_format', 'json');
    if (prompt) {
      form.append('prompt', prompt);
    }

    const response = await axios.post(GROQ_AUDIO_URL, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      timeout: 10000, // 10 secondes max
      maxContentLength: 25 * 1024 * 1024,
    });

    const latenceMs = Date.now() - t0;
    const texte = response.data?.text?.trim() || '';

    return {
      success: true,
      texte,
      latenceMs,
      source: 'groq-whisper-large-v3-turbo',
    };
  } catch (err) {
    const latenceMs = Date.now() - t0;
    const errMessage = err.response?.data?.error?.message || err.message;
    console.warn('[GROQ WHISPER ERR]:', errMessage);

    return {
      success: false,
      texte: '',
      latenceMs,
      source: 'groq-error',
      error: errMessage,
    };
  }
}

/**
 * Transcrit un fichier audio accessible via une URL distante
 * @param {string} audioUrl URL du fichier audio
 * @param {Object} options
 */
async function transcrireAudioUrl(audioUrl, options = {}) {
  try {
    const res = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
    });
    const buffer = Buffer.from(res.data);
    return await transcrireAudioBuffer(buffer, options);
  } catch (err) {
    console.warn('[AUDIO URL DOWNLOAD ERR]:', err.message);
    return {
      success: false,
      texte: '',
      latenceMs: 0,
      source: 'download_error',
      error: `Impossible de télécharger l'audio: ${err.message}`,
    };
  }
}

module.exports = {
  transcrireAudioBuffer,
  transcrireAudioUrl,
  getGroqApiKey,
};
