// Sources externes de Surga (D43, D53, D57, D65) : lecture des réponses, sans réseau.
// Chaque test échoue si une donnée est inventée là où la source n'en donne pas.
const sources = require('../../backend/services/surga/sources-externes');
const interrupteurs = require('../../backend/services/surga/interrupteurs');

const entree = (time, temperature, extra = {}) => ({
  time,
  data: {
    instant: { details: { air_temperature: temperature, relative_humidity: 70.5, wind_speed: 3.0, wind_from_direction: 40.2, ultraviolet_index_clear_sky: 6.4 } },
    next_1_hours: { summary: { symbol_code: 'cloudy' } },
    next_6_hours: { summary: { symbol_code: 'partlycloudy_day' }, details: {} },
    ...extra,
  },
});
// Série horaire du 8 octobre à midi au 10 octobre à 23 h : le 8 n'est couvert qu'à partir de midi.
const serieMetNo = () => {
  const serie = [];
  for (let h = 12; h <= 23; h++) serie.push(entree(`2026-10-08T${String(h).padStart(2, '0')}:00:00Z`, 29 - (h - 12) * 0.2));
  for (const jour of ['2026-10-09', '2026-10-10']) {
    for (let h = 0; h <= 23; h++) serie.push(entree(`${jour}T${String(h).padStart(2, '0')}:00:00Z`, 25 + (h >= 8 && h <= 16 ? 5 : 0)));
  }
  return { properties: { meta: { updated_at: '2026-10-08T11:19:33Z' }, timeseries: serie } };
};

describe('météo : MET Norway', () => {
  const maintenant = new Date('2026-10-08T12:20:00Z');

  test('le relevé de l’heure en cours est lu tel quel, vent converti en km/h', () => {
    const m = sources.interpreterMetNo(serieMetNo(), maintenant);
    expect(m.temperature).toBe(29);
    expect(m.humidite).toBe(71);
    expect(m.vent_vitesse_kmh).toBe(11);
    expect(m.vent_direction).toBe('Nord-Est');
    expect(m.condition_texte).toBe('Couvert');
    expect(m.source).toBe('MET Norway');
    expect(m.updated_at).toBe('2026-10-08T11:19:33.000Z');
    expect(m.non_actualise).toBe(false);
  });

  test('aucun ressenti ni extrême du jour n’est inventé quand la source ne les donne pas', () => {
    const m = sources.interpreterMetNo(serieMetNo(), maintenant);
    expect(m.ressenti).toBeNull();
    expect(m.temp_min).toBeNull(); // la série ne couvre pas la matinée du 8
    expect(m.temp_max).toBeNull();
    expect(m.previsions_3j.map((p) => p.date)).toEqual(['2026-10-09', '2026-10-10']);
    expect(m.previsions_3j[0]).toMatchObject({ jour: 'Vendredi', temp_min: 25, temp_max: 30 });
  });

  test('une prévision calculée il y a plus de douze heures est marquée non actualisée', () => {
    const m = sources.interpreterMetNo(serieMetNo(), new Date('2026-10-09T08:00:00Z'));
    expect(m.non_actualise).toBe(true);
  });

  test('réponse vide, sans température ou au symbole inconnu : rien', () => {
    expect(sources.interpreterMetNo({}, maintenant)).toBeNull();
    expect(sources.interpreterMetNo({ properties: { timeseries: [] } }, maintenant)).toBeNull();
    expect(sources.interpreterMetNo({ properties: { timeseries: [entree('2026-10-08T12:00:00Z', undefined)] } }, maintenant)).toBeNull();
    expect(sources.interpreterSymbole('inconnu_day')).toBeNull();
  });

  test('symboles de jour et de nuit', () => {
    expect(sources.interpreterSymbole('clearsky_day').texte).toBe('Ensoleillé');
    expect(sources.interpreterSymbole('clearsky_night').texte).toBe('Ciel dégagé');
    expect(sources.interpreterSymbole('heavyrainshowersandthunder_day').code).toBe('orage');
    expect(sources.interpreterSymbole('lightrain').texte).toBe('Pluie faible');
  });
});

describe('marées : niveau de la mer heure par heure', () => {
  // Valeurs rendues par la source pour Dakar le 8 octobre 2026 (essai du 8 octobre).
  const niveaux = [-0.39, -0.37, -0.23, -0.01, 0.26, 0.49, 0.64, 0.67, 0.56, 0.32, 0.02, -0.26, -0.44, -0.50, -0.43, -0.25, 0.0, 0.26, 0.45, 0.54, 0.50, 0.31, 0.05, -0.22, -0.41, -0.48, -0.40, -0.20];
  const json = { hourly: { time: niveaux.map((_, i) => `2026-10-${i < 24 ? '08' : '09'}T${String(i % 24).padStart(2, '0')}:00`), sea_level_height_msl: niveaux } };

  test('prochaine pleine mer, heure affinée entre deux points horaires', () => {
    const m = sources.interpreterMaree(json, new Date('2026-10-08T15:30:00Z'));
    expect(m.etat).toBe('Marée montante');
    expect(m.prochaine_type).toBe('Pleine mer');
    expect(m.prochaine_heure).toBe('19 h 10');
    expect(m.hauteur_m).toBe('+0,5');
    expect(m.estimation).toBe(true);
  });

  test('prochaine basse mer', () => {
    const m = sources.interpreterMaree(json, new Date('2026-10-08T09:10:00Z'));
    expect(m.etat).toBe('Marée descendante');
    expect(m.prochaine_type).toBe('Basse mer');
    expect(m.prochaine_heure).toBe('13 h 00');
  });

  test('un sommet dont l’heure est passée n’est pas rendu comme « prochain »', () => {
    const m = sources.interpreterMaree(json, new Date('2026-10-08T19:30:00Z'));
    expect(m.prochaine_type).toBe('Basse mer');
  });

  test('série qui ne couvre pas l’heure en cours, ou point à l’intérieur des terres : rien', () => {
    expect(sources.interpreterMaree(json, new Date('2026-10-10T10:00:00Z'))).toBeNull();
    expect(sources.interpreterMaree(json, new Date('2026-10-07T10:00:00Z'))).toBeNull();
    expect(sources.interpreterMaree({ hourly: { time: json.hourly.time, sea_level_height_msl: niveaux.map(() => null) } }, new Date('2026-10-08T15:30:00Z'))).toBeNull();
    expect(sources.interpreterMaree({}, new Date())).toBeNull();
  });
});

describe('qualité de l’air', () => {
  const json = { current: { time: '2026-10-08T12:00', us_aqi: 52, pm2_5: 23.6, pm10: 79.9 } };

  test('indice, palier et particules lus tels quels', () => {
    const a = sources.interpreterQualiteAir(json, new Date('2026-10-08T12:40:00Z'));
    expect(a).toMatchObject({ aqi: 52, indice: 'AQI US', niveau: 'Modérée', particules: 'PM2,5 : 24 µg/m³ · PM10 : 80 µg/m³', estimation: true });
  });

  test('estimation de plus de trois heures, ou sans indice : rien', () => {
    expect(sources.interpreterQualiteAir(json, new Date('2026-10-08T16:00:00Z'))).toBeNull();
    expect(sources.interpreterQualiteAir({ current: { time: '2026-10-08T12:00' } }, new Date('2026-10-08T12:40:00Z'))).toBeNull();
  });
});

describe('Ligue 1 du Sénégal', () => {
  const maintenant = new Date('2026-10-08T12:00:00Z');
  const ev = (o) => ({ idEvent: '1', strHomeTeam: 'Jaraaf', strAwayTeam: 'AJEL Rufisque', dateEvent: '2026-10-17', strTime: '17:00:00', intHomeScore: null, intAwayScore: null, strStatus: 'NS', intRound: '1', ...o });

  test('rencontre à venir : pas de score, pas de diffuseur inventé', () => {
    const [m] = sources.interpreterTheSportsDb([ev()], maintenant);
    expect(m).toMatchObject({ categorie: 'ligue1_sn', statut: 'A_VENIR', score_domicile: null, score_exterieur: null, diffuseur: null, date_debut: '2026-10-17T17:00:00.000Z', heure_inconnue: false, source: 'TheSportsDB' });
    expect(m.competition).toBe('Ligue 1 Sénégal · Journée 1');
  });

  test('rencontre terminée avec son score', () => {
    const [m] = sources.interpreterTheSportsDb([ev({ idEvent: '2', strHomeTeam: 'Cambérène', strAwayTeam: 'Jaraaf', dateEvent: '2026-06-04', intHomeScore: '0', intAwayScore: '2', strStatus: 'FT', intRound: '30' })], maintenant);
    expect(m).toMatchObject({ statut: 'TERMINE', score_domicile: 0, score_exterieur: 2 });
  });

  test('heure absente : signalée, pas remplacée par une heure plausible', () => {
    const [m] = sources.interpreterTheSportsDb([ev({ strTime: '00:00:00' })], maintenant);
    expect(m.heure_inconnue).toBe(true);
  });

  test('un résultat de plus de trois semaines n’est pas servi comme une actualité', () => {
    const matchs = sources.interpreterTheSportsDb([ev(), ev({ idEvent: '2', dateEvent: '2026-06-04', intHomeScore: '0', intAwayScore: '2', strStatus: 'FT' }), ev({ idEvent: '3', dateEvent: '2026-12-20' })], maintenant);
    expect(sources.dansLaFenetre(matchs, maintenant).map((m) => m.id)).toEqual(['tsdb-1']);
  });

  test('rencontre reportée ou incomplète : écartée', () => {
    expect(sources.interpreterTheSportsDb([ev({ strPostponed: 'yes' }), ev({ strStatus: 'PST' }), ev({ strAwayTeam: '' }), null], maintenant)).toEqual([]);
    expect(sources.interpreterTheSportsDb(null, maintenant)).toEqual([]);
  });
});

describe('interrupteurs des sources', () => {
  const garde = { ...process.env };
  afterEach(() => { process.env = { ...garde }; });

  test('Open-Meteo n’est pas appelé sans décision : marée et air valent null', async () => {
    delete process.env.SURGA_OPEN_METEO_CLE;
    delete process.env.SURGA_OPEN_METEO_ESSAI;
    expect(interrupteurs.openMeteo()).toBeNull();
    expect(await sources.lireMaree(14.69, -17.44)).toBeNull();
    expect(await sources.lireQualiteAir(14.69, -17.44)).toBeNull();
  });

  test('une clé d’abonnement prime sur les essais', () => {
    process.env.SURGA_OPEN_METEO_ESSAI = 'true';
    expect(interrupteurs.openMeteo()).toEqual({ cle: null });
    process.env.SURGA_OPEN_METEO_CLE = 'abc';
    expect(interrupteurs.openMeteo()).toEqual({ cle: 'abc' });
  });

  test('sans clé, la Ligue 1 du Sénégal n’est pas lue', async () => {
    delete process.env.SURGA_THESPORTSDB_CLE;
    expect(await sources.lireLigue1Senegal()).toEqual([]);
    expect(sources.ligue1SenegalBranchee()).toBe(false);
  });
});

describe('trafic mesuré (D71)', () => {
  const mesures = require('../../backend/services/surga/trafic-mesures');

  test('créneaux d’une demi-heure, de 6 h 30 à 20 h', () => {
    expect(mesures.creneauCourant(new Date('2026-10-08T06:29:00Z'))).toBeNull();
    expect(mesures.creneauCourant(new Date('2026-10-08T06:30:00Z')).toISOString()).toBe('2026-10-08T06:30:00.000Z');
    expect(mesures.creneauCourant(new Date('2026-10-08T17:47:00Z')).toISOString()).toBe('2026-10-08T17:30:00.000Z');
    expect(mesures.creneauCourant(new Date('2026-10-08T19:59:00Z')).toISOString()).toBe('2026-10-08T19:30:00.000Z');
    expect(mesures.creneauCourant(new Date('2026-10-08T20:00:00Z'))).toBeNull();
  });

  test('durées avec et sans trafic lues telles quelles, niveau tiré du retard', () => {
    const m = mesures.interpreterGoogleRoutes({ routes: [{ distanceMeters: 6600, duration: '1200s', staticDuration: '480s' }] });
    expect(m).toMatchObject({ distanceKm: 6.6, tempsEstimeMin: 20, tempsSansTraficMin: 8, retardMin: 12, vitesseReelleKmH: 20, vitesseNormaleKmH: 50 });
    expect(mesures.niveauDeLaMesure(m)).toBe('bouche');
    const libre = mesures.interpreterGoogleRoutes({ routes: [{ distanceMeters: 30000, duration: '1650s', staticDuration: '1620s' }] });
    expect(mesures.niveauDeLaMesure(libre)).toBe('fluide');
  });

  test('réponse sans durée ou sans itinéraire : aucune mesure', () => {
    expect(mesures.interpreterGoogleRoutes({})).toBeNull();
    expect(mesures.interpreterGoogleRoutes({ routes: [] })).toBeNull();
    expect(mesures.interpreterGoogleRoutes({ routes: [{ distanceMeters: 5000, duration: '600s' }] })).toBeNull();
  });

  test('sans clé, aucun appel et aucune mesure', async () => {
    const garde = process.env.SURGA_GOOGLE_ROUTES_CLE; delete process.env.SURGA_GOOGLE_ROUTES_CLE;
    const pool = { query: jest.fn() };
    const r = await mesures.lireMesures(pool, [], new Date('2026-10-08T10:00:00Z'));
    expect(r.etat).toBe('eteint'); expect(r.mesures.size).toBe(0); expect(pool.query).not.toHaveBeenCalled();
    if (garde) process.env.SURGA_GOOGLE_ROUTES_CLE = garde;
  });

  test('compteur illisible : la réservation est refusée, aucun appel payant', async () => {
    const pool = { query: jest.fn().mockRejectedValue(new Error('base en panne')) };
    expect(await mesures.reserverAppels(pool, 6)).toBe(false);
  });
});
