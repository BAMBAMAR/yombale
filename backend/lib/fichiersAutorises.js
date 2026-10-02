// AUD-146 : contrôle du contenu RÉEL d'un fichier téléversé (octets de signature), pas du type déclaré par le client.
// Un fichier .html ou .svg renommé en .pdf, ou envoyé avec un faux Content-Type, est refusé.
const SIGNATURES = [
  { type: 'pdf',  test: (b) => b.length > 4 && b.slice(0, 5).toString('latin1') === '%PDF-' },
  { type: 'jpeg', test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'png',  test: (b) => b.length > 7 && b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { type: 'gif',  test: (b) => b.length > 5 && ['GIF87a', 'GIF89a'].includes(b.slice(0, 6).toString('latin1')) },
  { type: 'webp', test: (b) => b.length > 11 && b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP' },
  { type: 'heic', test: (b) => b.length > 11 && b.slice(4, 8).toString('latin1') === 'ftyp' && /^(heic|heix|hevc|mif1|msf1|heim|heis)/.test(b.slice(8, 12).toString('latin1')) },
  { type: 'avif', test: (b) => b.length > 11 && b.slice(4, 8).toString('latin1') === 'ftyp' && /^(avif|avis)/.test(b.slice(8, 12).toString('latin1')) },
  { type: 'mp4',  test: (b) => b.length > 11 && b.slice(4, 8).toString('latin1') === 'ftyp' },
  // AUD-201 : notes vocales WhatsApp (OGG/Opus), MP3, AAC (ADTS), AMR, M4A
  { type: 'ogg',  test: (b) => b.length > 3 && b.slice(0, 4).toString('latin1') === 'OggS' },
  { type: 'mp3',  test: (b) => b.length > 2 && (b.slice(0, 3).toString('latin1') === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0 && (b[1] & 0x06) !== 0)) },
  { type: 'amr',  test: (b) => b.length > 5 && b.slice(0, 6).toString('latin1') === '#!AMR\n' },
  { type: 'webm', test: (b) => b.length > 3 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
];

const IMAGES = ['jpeg', 'png', 'webp', 'gif', 'heic', 'avif'];
// uploadBuffer (resource_type image) reçoit aussi des justificatifs PDF : ils restent acceptés
const IMAGES_OU_PDF = [...IMAGES, 'pdf'];
const DOCUMENTS = ['pdf', 'jpeg', 'png', 'webp', 'heic'];
const VIDEOS = ['mp4', 'webm'];
const AUDIOS = ['ogg', 'mp3', 'amr', 'mp4', 'webm']; // mp4/webm : m4a et audio webm partagent le conteneur

function detecterType(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  const s = SIGNATURES.find((x) => x.test(buffer));
  return s ? s.type : null;
}

/** Lève une erreur (status 400) si le contenu n'est pas d'un des types autorisés. */
function exigerTypes(buffer, autorises, libelle = 'fichier') {
  const type = detecterType(buffer);
  if (!type || !autorises.includes(type)) {
    const err = new Error(`Type de ${libelle} non autorisé (formats acceptés : ${autorises.join(', ')}).`);
    err.status = 400;
    err.code = 'TYPE_FICHIER_NON_AUTORISE';
    throw err;
  }
  return type;
}

/**
 * Middleware express à placer APRÈS multer (memoryStorage) : contrôle req.file et req.files.
 * Répond 400 avec un message explicite au lieu d'envoyer un fichier douteux plus loin.
 */
function controlerFichiers(autorises = DOCUMENTS) {
  return function (req, res, next) {
    const fichiers = [];
    if (req.file) fichiers.push(req.file);
    if (Array.isArray(req.files)) fichiers.push(...req.files);
    else if (req.files && typeof req.files === 'object') Object.values(req.files).forEach((l) => fichiers.push(...l));
    for (const f of fichiers) {
      try { exigerTypes(f.buffer, autorises); }
      catch (e) { return res.status(400).json({ success: false, error: `${f.originalname || 'Fichier'} : ${e.message}` }); }
    }
    next();
  };
}

module.exports = { detecterType, exigerTypes, controlerFichiers, IMAGES, IMAGES_OU_PDF, DOCUMENTS, VIDEOS, AUDIOS };
