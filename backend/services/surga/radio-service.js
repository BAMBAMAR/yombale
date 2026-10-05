// backend/services/surga/radio-service.js
// Service de gestion et streaming des radios locales sénégalaises
// Conforme philosophie Surga / Nopalou : Low-Data, Zéro Emoji, Fiabilité territoriale

const http = require('http');
const https = require('https');

/**
 * Bouquet officiel des radios locales sénégalaises
 * Flux vérifiés compatibles Icecast / Shoutcast / Direct MP3-AAC
 */
const RADIOS_SENEGAL = [
  {
    id: 'rfm',
    nom: 'RFM 94.0 Dakar',
    slogan: 'Radio Futurs Médias • Première radio d’information du Sénégal',
    frequence: '94.0 FM',
    region: 'Dakar & National',
    categorie: 'information',
    langues: ['Wolof', 'Français'],
    url: 'https://stream.zenolive.com/kuk0syz5puquv',
    directMp3: true,
    bitrateKbps: 128,
    description: 'Actualités nationales, revues de presse matinales, grands débats politiques et journal parlé de référence.',
  },
  {
    id: 'zik-fm',
    nom: 'Zik FM 89.7',
    slogan: 'Groupe D-Média • La radio populaire et citoyenne',
    frequence: '89.7 FM',
    region: 'Dakar & National',
    categorie: 'information',
    langues: ['Wolof', 'Français'],
    url: 'https://stream.zeno.fm/z97k8ry9sxquv',
    directMp3: true,
    bitrateKbps: 128,
    description: 'Débats de société, revues des titres populaires, libre antenne citoyenne et actualités.',
  },
  {
    id: 'walf-fm',
    nom: 'Walf FM 99.0',
    slogan: 'Groupe Walfadjri • La voix des sans-voix',
    frequence: '99.0 FM',
    region: 'Dakar & National',
    categorie: 'information',
    langues: ['Wolof', 'Français'],
    url: 'https://10gb1.acangroup.org:8000/walffm',
    directMp3: true,
    bitrateKbps: 128,
    description: 'Pionnière de l’information indépendante au Sénégal, débats démocratiques et actualité en direct.',
  },
  {
    id: 'lamp-fall',
    nom: 'Lamp Fall FM',
    slogan: 'La voix du Mouridisme et des Khassaïdes',
    frequence: '101.7 FM',
    region: 'Touba & National',
    categorie: 'religieux',
    langues: ['Wolof', 'Arabe'],
    url: 'https://stream.zeno.fm/bgy95ndrbxquv',
    directMp3: true,
    bitrateKbps: 128,
    description: 'Enseignements de Cheikh Ahmadou Bamba, récitation continue de Khassaïdes et spiritualité mouride.',
  },
  {
    id: 'touba-fm',
    nom: 'Touba FM Live',
    slogan: 'Spiritualité mouride, culture et Magal de Touba',
    frequence: '89.3 FM',
    region: 'Touba & Sénégal',
    categorie: 'religieux',
    langues: ['Wolof', 'Arabe'],
    url: 'https://stream.zeno.fm/b5ve4dw7u0hvv',
    directMp3: true,
    bitrateKbps: 128,
    description: 'Émissions religieuses, causeries islamiques, histoire de Touba et chants de dévotion.',
  },
  {
    id: 'fayda-tidiane',
    nom: 'Radio Fayda Tidianiya',
    slogan: 'Spiritualité tidjane, Hadra et chants soufis',
    frequence: 'Kaolack & Web',
    region: 'Kaolack & Sénégal',
    categorie: 'religieux',
    langues: ['Wolof', 'Arabe', 'Français'],
    url: 'http://listen.senemultimedia.net:5526/;',
    directMp3: true,
    bitrateKbps: 128,
    description: 'Enseignements de Cheikh Ibrahima Niasse (Baye), zikr, Hadratoul Joumou’a et spiritualité soufie.',
  },
  {
    id: 'rfi-afrique',
    nom: 'RFI Afrique 92.0',
    slogan: 'Radio France Internationale • Actualités mondiales et panafricaines',
    frequence: '92.0 FM',
    region: 'Afrique & International',
    categorie: 'information',
    langues: ['Français'],
    url: 'http://live02.rfi.fr/rfiafrique-64.mp3',
    directMp3: true,
    bitrateKbps: 64,
    description: 'Journaux Afrique et monde, correspondances internationales, grands reportages et débats géopolitiques.',
  },
  {
    id: 'rts-rsi',
    nom: 'RTS 92.5 RSI',
    slogan: 'Radio Sénégal Internationale • Chaîne Nationale',
    frequence: '92.5 FM',
    region: 'Dakar & National',
    categorie: 'information',
    langues: ['Français', 'Wolof', 'Pulaar', 'Sereer', 'Mandingue', 'Diola'],
    url: 'https://10gb1.acangroup.org:8000/rsi',
    directMp3: true,
    bitrateKbps: 64,
    description: 'Service public sénégalais, informations nationales, journal parlé et programmes éducatifs.',
  },
  {
    id: 'sud-fm',
    nom: 'Sud FM Sen Radio',
    slogan: 'Première radio privée du Sénégal',
    frequence: '98.5 FM',
    region: 'Dakar & National',
    categorie: 'information',
    langues: ['Français', 'Wolof'],
    url: 'http://stream.zenolive.com/rq40edfn3reuv',
    directMp3: true,
    bitrateKbps: 64,
    description: 'Actualité politique, revues de presse matinales, grands débats citoyens.',
  },
  {
    id: 'rewmi-fm',
    nom: 'Rewmi FM',
    slogan: 'L’information au cœur de la nation',
    frequence: '97.5 FM',
    region: 'Dakar',
    categorie: 'information',
    langues: ['Wolof', 'Français'],
    url: 'https://stream-61.zeno.fm/nkzsqg16t8quv',
    directMp3: true,
    bitrateKbps: 128,
    description: 'Revues de presse percutantes, débats d’actualité et société.',
  },
  {
    id: 'oxy-jeunes',
    nom: 'Radio Oxy Jeunes',
    slogan: 'La voix de la banlieue dakaroise',
    frequence: '103.4 FM',
    region: 'Pikine & Banlieue',
    categorie: 'societe',
    langues: ['Wolof', 'Français'],
    url: 'http://s9.voscast.com:7994/;stream.nsv',
    directMp3: true,
    bitrateKbps: 96,
    description: 'Radio communautaire de Pikine, initiatives de jeunesse, culture urbaine et proximité.',
  },
  {
    id: 'fm-senegal',
    nom: 'FM Sénégal',
    slogan: '100% Sénégal • Dakar',
    frequence: '103.1 FM',
    region: 'Dakar',
    categorie: 'culture',
    langues: ['Wolof', 'Français'],
    url: 'https://stream-154.zeno.fm/t8gcyq6ts0quv',
    directMp3: true,
    bitrateKbps: 128,
    description: 'Musique sénégalaise, société, actualités culturelles et débats.',
  },
  {
    id: 'afia-fm',
    nom: 'Afia FM',
    slogan: 'Radio communautaire de proximité',
    frequence: '93.0 FM',
    region: 'Dakar',
    categorie: 'societe',
    langues: ['Wolof', 'Français'],
    url: 'https://stream.zeno.fm/skjrn6kzzxptv',
    directMp3: true,
    bitrateKbps: 128,
    description: 'Informations citoyennes, vie des quartiers et musique locale.',
  },
  {
    id: 'al-fayda',
    nom: 'Radio Al Fayda',
    slogan: 'La voix du Bassin arachidier',
    frequence: '90.1 FM',
    region: 'Kaolack & Centre',
    categorie: 'terroir',
    langues: ['Wolof', 'Français', 'Arabe'],
    url: 'https://usa5.fastcast4u.com/proxy/lyartech?mp=/stream/1/',
    directMp3: true,
    bitrateKbps: 112,
    description: 'Actualité du Saloum, spiritualité, économie agricole et culture.',
  },
  {
    id: 'gms-casamance',
    nom: 'GMS FM Ziguinchor',
    slogan: 'Génération Média Sud • Voix de la Casamance',
    frequence: '89.3 FM',
    region: 'Ziguinchor & Casamance',
    categorie: 'terroir',
    langues: ['Français', 'Wolof', 'Diola', 'Mandingue'],
    url: 'https://myfm.acan.group/radio/8140/radio.mp3?1690707378',
    directMp3: true,
    bitrateKbps: 128,
    description: 'Actualités du Sud, paix, développement territorial et culture casamançaise.',
  },
  {
    id: 'zig-fm',
    nom: 'Zig FM Casamance',
    slogan: 'Radio régionale du Sud',
    frequence: '100.8 FM',
    region: 'Ziguinchor & Casamance',
    categorie: 'terroir',
    langues: ['Français', 'Diola', 'Wolof'],
    url: 'https://stream.zeno.fm/zfdk0c69d3quv',
    directMp3: true,
    bitrateKbps: 128,
    description: 'Informations régionales, émissions locales et musique du terroir.',
  },
  {
    id: 'rts-matam',
    nom: 'RTS Matam',
    slogan: 'La voix du Fouta Toro',
    frequence: '89.1 FM',
    region: 'Matam & Fouta',
    categorie: 'terroir',
    langues: ['Pulaar', 'Français'],
    url: 'https://stream.zeno.fm/kxud8vhqt1duv',
    directMp3: true,
    bitrateKbps: 128,
    description: 'Émissions en Pulaar, informations locales du Fouta, pastoralisme et société.',
  },
  {
    id: 'rts-tamba',
    nom: 'RTS Tambacounda',
    slogan: 'La voix du Sénégal Oriental',
    frequence: '92.0 FM',
    region: 'Tambacounda & Est',
    categorie: 'terroir',
    langues: ['Mandingue', 'Pulaar', 'Wolof', 'Français'],
    url: 'https://stream.zeno.fm/nqxg7p8pt1duv',
    directMp3: true,
    bitrateKbps: 128,
    description: 'Informations territoriales, désenclavement, culture et actualités transfrontalières.',
  },
  {
    id: 'fulbe-fm',
    nom: 'Radio Fulbe FM',
    slogan: 'Culture et pastoralisme',
    frequence: '102.6 FM',
    region: 'Dakar & Diaspora',
    categorie: 'culture',
    langues: ['Pulaar'],
    url: 'https://stream.zeno.fm/e0grbn8e3rquv',
    directMp3: true,
    bitrateKbps: 128,
    description: 'Programmes dédiés à la langue et culture peule, actualités et débats.',
  },
  {
    id: 'dakar-musique',
    nom: 'Dakar Musique',
    slogan: '100% Musique & Mbalax sénégalais',
    frequence: 'Web & Direct',
    region: 'Sénégal & Monde',
    categorie: 'musique',
    langues: ['Wolof', 'Français'],
    url: 'https://stream.dakarmusique.com/',
    directMp3: true,
    bitrateKbps: 128,
    description: 'Mbalax, acoustique, afro-jazz sénégalais et musiques traditionnelles 24h/24.',
  },
];

/**
 * Récupérer la liste des stations avec filtrage optionnel
 * @param {Object} options
 * @param {string} [options.categorie]
 * @param {string} [options.region]
 * @param {string} [options.recherche]
 * @returns {Array}
 */
function listerRadios(options = {}) {
  let radios = [...RADIOS_SENEGAL];

  if (options.categorie && options.categorie !== 'toutes') {
    radios = radios.filter(
      (r) => r.categorie === options.categorie || (options.categorie === 'religieux' && (r.id === 'al-fayda' || r.categorie === 'religieux'))
    );
  }

  if (options.region && options.region !== 'toutes') {
    radios = radios.filter((r) =>
      r.region.toLowerCase().includes(options.region.toLowerCase())
    );
  }

  if (options.recherche) {
    const q = options.recherche.toLowerCase().trim();
    radios = radios.filter(
      (r) =>
        r.nom.toLowerCase().includes(q) ||
        r.slogan.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q) ||
        r.frequence.toLowerCase().includes(q)
    );
  }

  // Renvoi avec URLs prêtes (soit direct HTTPS, soit proxifiée via notre API)
  return radios.map((r) => ({
    ...r,
    streamUrlProxy: `/api/surga/radios/${r.id}/stream`,
  }));
}

/**
 * Trouver une radio par son identifiant
 * @param {string} id
 * @returns {Object|null}
 */
function trouverRadioParId(id) {
  return RADIOS_SENEGAL.find((r) => r.id === id) || null;
}

/**
 * Proxy streaming pour une radio (évite tout problème de mixed-content HTTP/HTTPS)
 * @param {string} radioId
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function proxifierFlux(radioId, req, res) {
  const radio = trouverRadioParId(radioId);
  if (!radio) {
    return res.status(404).json({ success: false, error: 'Station radio introuvable' });
  }

  const targetUrl = radio.url;
  const client = targetUrl.startsWith('https') ? https : http;

  const streamReq = client.get(
    targetUrl,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Icy-MetaData': '1',
        Accept: '*/*',
      },
      timeout: 10000,
    },
    (streamRes) => {
      // Si redirection (301, 302, 307)
      if (
        streamRes.statusCode >= 300 &&
        streamRes.statusCode < 400 &&
        streamRes.headers.location
      ) {
        return res.redirect(streamRes.headers.location);
      }

      res.writeHead(streamRes.statusCode || 200, {
        'Content-Type': streamRes.headers['content-type'] || 'audio/mpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        Connection: 'keep-alive',
      });

      streamRes.pipe(res);
    }
  );

  streamReq.on('error', (err) => {
    console.error(`[SurgaRadio] Erreur flux ${radio.nom}:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({
        success: false,
        error: `Impossible de joindre le flux de ${radio.nom}`,
      });
    }
  });

  // Nettoyage immédiat si le client coupe l'écoute (économie de bande passante)
  req.on('close', () => {
    streamReq.destroy();
  });
}

module.exports = {
  RADIOS_SENEGAL,
  listerRadios,
  trouverRadioParId,
  proxifierFlux,
};
