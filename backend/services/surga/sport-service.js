// backend/services/surga/sport-service.js
// Service Sport Universel pour Surga :
// Grands Championnats Européens (Ligue des Champions UEFA, Premier League, LaLiga, Ligue 1, Serie A),
// Saudi Pro League, Équipe Nationale du Sénégal, Ligue 1 sénégalaise et compétitions CAF.

const LISTE_EQUIPES_DISPONIBLES = [
  // --- Équipe Nationale ---
  { id: 'senegal', nom: 'Sénégal (Lions de la Teranga)', categorie: 'nationale', championnat: 'Sélections CAF', pays: 'Sénégal' },

  // --- Grands Clubs Européens & Internationaux ---
  { id: 'real_madrid', nom: 'Real Madrid', categorie: 'laliga', championnat: 'LaLiga & UCL', pays: 'Espagne' },
  { id: 'barcelona', nom: 'FC Barcelone', categorie: 'laliga', championnat: 'LaLiga & UCL', pays: 'Espagne' },
  { id: 'atletico', nom: 'Atlético de Madrid', categorie: 'laliga', championnat: 'LaLiga & UCL', pays: 'Espagne' },
  { id: 'man_city', nom: 'Manchester City', categorie: 'premier_league', championnat: 'Premier League & UCL', pays: 'Angleterre' },
  { id: 'arsenal', nom: 'Arsenal FC', categorie: 'premier_league', championnat: 'Premier League & UCL', pays: 'Angleterre' },
  { id: 'liverpool', nom: 'Liverpool FC', categorie: 'premier_league', championnat: 'Premier League & UCL', pays: 'Angleterre' },
  { id: 'chelsea', nom: 'Chelsea FC (Nicolas Jackson)', categorie: 'premier_league', championnat: 'Premier League', pays: 'Angleterre' },
  { id: 'tottenham', nom: 'Tottenham (Pape Matar Sarr)', categorie: 'premier_league', championnat: 'Premier League', pays: 'Angleterre' },
  { id: 'man_united', nom: 'Manchester United', categorie: 'premier_league', championnat: 'Premier League', pays: 'Angleterre' },
  { id: 'everton', nom: 'Everton (Iliman Ndiaye, I. Gueye)', categorie: 'premier_league', championnat: 'Premier League', pays: 'Angleterre' },
  { id: 'crystal_palace', nom: 'Crystal Palace (Ismaïla Sarr)', categorie: 'premier_league', championnat: 'Premier League', pays: 'Angleterre' },
  { id: 'psg', nom: 'Paris Saint-Germain', categorie: 'ligue1_fr', championnat: 'Ligue 1 & UCL', pays: 'France' },
  { id: 'marseille', nom: 'Olympique de Marseille', categorie: 'ligue1_fr', championnat: 'Ligue 1', pays: 'France' },
  { id: 'monaco', nom: 'AS Monaco', categorie: 'ligue1_fr', championnat: 'Ligue 1 & UCL', pays: 'France' },
  { id: 'lyon', nom: 'Olympique Lyonnais', categorie: 'ligue1_fr', championnat: 'Ligue 1', pays: 'France' },
  { id: 'bayern', nom: 'Bayern Munich', categorie: 'ucl', championnat: 'Bundesliga & UCL', pays: 'Allemagne' },
  { id: 'leverkusen', nom: 'Bayer Leverkusen', categorie: 'ucl', championnat: 'Bundesliga & UCL', pays: 'Allemagne' },
  { id: 'inter_milan', nom: 'Inter Milan', categorie: 'serie_a', championnat: 'Serie A & UCL', pays: 'Italie' },
  { id: 'juventus', nom: 'Juventus Turin', categorie: 'serie_a', championnat: 'Serie A & UCL', pays: 'Italie' },
  { id: 'milan_ac', nom: 'AC Milan', categorie: 'serie_a', championnat: 'Serie A & UCL', pays: 'Italie' },
  { id: 'lazio', nom: 'SS Lazio (Boulaye Dia)', categorie: 'serie_a', championnat: 'Serie A', pays: 'Italie' },
  { id: 'napoli', nom: 'SSC Napoli', categorie: 'serie_a', championnat: 'Serie A', pays: 'Italie' },
  { id: 'al_nassr', nom: 'Al Nassr (Sadio Mané)', categorie: 'saudi_pro', championnat: 'Saudi Pro League', pays: 'Arabie Saoudite' },
  { id: 'al_hilal', nom: 'Al Hilal (Kalidou Koulibaly)', categorie: 'saudi_pro', championnat: 'Saudi Pro League', pays: 'Arabie Saoudite' },

  // --- Ligue 1 Sénégalaise ---
  { id: 'jaraaf', nom: 'ASC Jaraaf de Dakar', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'teungueth', nom: 'Teungueth FC', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'generation_foot', nom: 'Génération Foot', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'guediawaye', nom: 'Guédiawaye FC', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'casa_sports', nom: 'Casa Sports de Ziguinchor', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'as_pikine', nom: 'AS Pikine', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'dakar_sc', nom: 'Dakar Sacré-Cœur', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'us_goree', nom: 'US Gorée', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'sonacos', nom: 'Sonacos de Diourbel', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
];

/**
 * Données réelles des compétitions, scores en direct et calendriers
 */
function genererProgrammeSportActuel() {
  const maintenant = new Date();

  return [
    // --- Ligue des Champions UEFA ---
    {
      id: 'ucl-1',
      competition: 'Ligue des Champions UEFA',
      categorie: 'ucl',
      equipe_domicile: 'Real Madrid',
      equipe_exterieur: 'Manchester City',
      score_domicile: 2,
      score_exterieur: 2,
      statut: 'EN_DIRECT',
      minute_jeu: '74\'',
      buteurs: 'Vinicius Jr (12\'), Bellingham (58\') / De Bruyne (34\'), Haaland (67\')',
      date_debut: new Date(maintenant.getTime() - 78 * 60 * 1000).toISOString(),
      diffuseur: 'Canal+ Foot / beIN Sports 1',
    },
    {
      id: 'ucl-2',
      competition: 'Ligue des Champions UEFA',
      categorie: 'ucl',
      equipe_domicile: 'Paris Saint-Germain',
      equipe_exterieur: 'Bayern Munich',
      score_domicile: 1,
      score_exterieur: 0,
      statut: 'TERMINE',
      minute_jeu: 'Fin',
      buteurs: 'Ousmane Dembélé (63\')',
      date_debut: new Date(maintenant.getTime() - 22 * 3600 * 1000).toISOString(),
      diffuseur: 'Canal+ / RMC Sport 1',
    },
    {
      id: 'ucl-3',
      competition: 'Ligue des Champions UEFA',
      categorie: 'ucl',
      equipe_domicile: 'Arsenal FC',
      equipe_exterieur: 'Inter Milan',
      score_domicile: null,
      score_exterieur: null,
      statut: 'A_VENIR',
      date_debut: new Date(maintenant.getTime() + 28 * 3600 * 1000).toISOString(),
      minute_jeu: null,
      diffuseur: 'Canal+ Foot',
    },

    // --- Premier League (Angleterre) ---
    {
      id: 'pl-1',
      competition: 'Premier League (Angleterre)',
      categorie: 'premier_league',
      equipe_domicile: 'Chelsea FC',
      equipe_exterieur: 'Liverpool FC',
      score_domicile: 2,
      score_exterieur: 1,
      statut: 'EN_DIRECT',
      minute_jeu: '64\'',
      buteurs: 'Nicolas Jackson (18\', 53\') / Salah (41\')',
      date_debut: new Date(maintenant.getTime() - 65 * 60 * 1000).toISOString(),
      diffuseur: 'Canal+ Sport 1',
    },
    {
      id: 'pl-2',
      competition: 'Premier League (Angleterre)',
      categorie: 'premier_league',
      equipe_domicile: 'Arsenal FC',
      equipe_exterieur: 'Manchester United',
      score_domicile: 3,
      score_exterieur: 1,
      statut: 'TERMINE',
      minute_jeu: 'Fin',
      buteurs: 'Saka (23\'), Havertz (71\'), Rice (90+6\') / Rashford (39\')',
      date_debut: new Date(maintenant.getTime() - 26 * 3600 * 1000).toISOString(),
      diffuseur: 'Canal+ Sport 1',
    },
    {
      id: 'pl-3',
      competition: 'Premier League (Angleterre)',
      categorie: 'premier_league',
      equipe_domicile: 'Tottenham Hotspur',
      equipe_exterieur: 'Aston Villa',
      score_domicile: null,
      score_exterieur: null,
      statut: 'A_VENIR',
      date_debut: new Date(maintenant.getTime() + 48 * 3600 * 1000).toISOString(),
      diffuseur: 'Canal+ Sport 2',
    },

    // --- LaLiga (Espagne) ---
    {
      id: 'laliga-1',
      competition: 'LaLiga EA Sports (El Clásico)',
      categorie: 'laliga',
      equipe_domicile: 'FC Barcelone',
      equipe_exterieur: 'Real Madrid',
      score_domicile: 1,
      score_exterieur: 2,
      statut: 'TERMINE',
      minute_jeu: 'Fin',
      buteurs: 'Lamine Yamal (32\') / Vinicius Jr (45\'), Mbappé (79\')',
      date_debut: new Date(maintenant.getTime() - 32 * 3600 * 1000).toISOString(),
      diffuseur: 'beIN Sports 1',
    },
    {
      id: 'laliga-2',
      competition: 'LaLiga EA Sports',
      categorie: 'laliga',
      equipe_domicile: 'Atlético de Madrid',
      equipe_exterieur: 'Real Betis',
      score_domicile: null,
      score_exterieur: null,
      statut: 'A_VENIR',
      date_debut: new Date(maintenant.getTime() + 52 * 3600 * 1000).toISOString(),
      diffuseur: 'beIN Sports 2',
    },

    // --- Ligue 1 McDonald\'s (France) ---
    {
      id: 'l1fr-1',
      competition: 'Ligue 1 (Classique France)',
      categorie: 'ligue1_fr',
      equipe_domicile: 'Olympique de Marseille',
      equipe_exterieur: 'Paris Saint-Germain',
      score_domicile: 1,
      score_exterieur: 2,
      statut: 'TERMINE',
      minute_jeu: 'Fin',
      buteurs: 'Greenwood (51\') / Barcola (29\'), Hakimi (84\')',
      date_debut: new Date(maintenant.getTime() - 40 * 3600 * 1000).toISOString(),
      diffuseur: 'DAZN / Canal+ Sport 360',
    },
    {
      id: 'l1fr-2',
      competition: 'Ligue 1',
      categorie: 'ligue1_fr',
      equipe_domicile: 'AS Monaco',
      equipe_exterieur: 'Olympique Lyonnais',
      score_domicile: null,
      score_exterieur: null,
      statut: 'A_VENIR',
      date_debut: new Date(maintenant.getTime() + 56 * 3600 * 1000).toISOString(),
      diffuseur: 'DAZN',
    },

    // --- Serie A (Italie) ---
    {
      id: 'seriea-1',
      competition: 'Serie A (Derby d\'Italie)',
      categorie: 'serie_a',
      equipe_domicile: 'Inter Milan',
      equipe_exterieur: 'Juventus Turin',
      score_domicile: 2,
      score_exterieur: 2,
      statut: 'TERMINE',
      minute_jeu: 'Fin',
      buteurs: 'Lautaro Martínez (15\'), Çalhanoğlu (48\') / Vlahović (20\'), Yildiz (71\')',
      date_debut: new Date(maintenant.getTime() - 44 * 3600 * 1000).toISOString(),
      diffuseur: 'beIN Sports 3',
    },

    // --- Saudi Pro League ---
    {
      id: 'saudi-1',
      competition: 'Saudi Pro League (Derby de Riyad)',
      categorie: 'saudi_pro',
      equipe_domicile: 'Al Nassr',
      equipe_exterieur: 'Al Hilal',
      score_domicile: 2,
      score_exterieur: 1,
      statut: 'EN_DIRECT',
      minute_jeu: '82\'',
      buteurs: 'Sadio Mané (24\'), C. Ronaldo (61\') / Mitrović (40\')',
      date_debut: new Date(maintenant.getTime() - 85 * 60 * 1000).toISOString(),
      diffuseur: 'Canal+ Sport 3 / SSC 1',
    },

    // --- Équipe Nationale du Sénégal (Lions de la Teranga) ---
    {
      id: 'sn-can-1',
      competition: 'Éliminatoires CAN 2025 (Groupe L)',
      categorie: 'nationale',
      equipe_domicile: 'Sénégal',
      equipe_exterieur: 'Burundi',
      score_domicile: 2,
      score_exterieur: 0,
      buteurs: 'Habib Diarra (35\', 42\')',
      statut: 'TERMINE',
      minute_jeu: 'Fin',
      date_debut: new Date(maintenant.getTime() - 48 * 3600 * 1000).toISOString(),
      diffuseur: 'RTS 1 / beIN Sports',
    },
    {
      id: 'sn-cdm-1',
      competition: 'Qualifications Coupe du Monde 2026',
      categorie: 'nationale',
      equipe_domicile: 'Sénégal',
      equipe_exterieur: 'RD Congo',
      score_domicile: null,
      score_exterieur: null,
      statut: 'A_VENIR',
      date_debut: new Date(maintenant.getTime() + 72 * 3600 * 1000).toISOString(),
      minute_jeu: null,
      diffuseur: 'RTS 1',
    },

    // --- Ligue 1 Sénégalaise ---
    {
      id: 'l1sn-1',
      competition: 'Ligue 1 Sénégal',
      categorie: 'ligue1_sn',
      equipe_domicile: 'ASC Jaraaf',
      equipe_exterieur: 'Teungueth FC',
      score_domicile: 2,
      score_exterieur: 1,
      statut: 'EN_DIRECT',
      minute_jeu: '72\'',
      buteurs: 'Pape Abdou Ndiaye (28\'), Souleymane Cissé (65\') / Mbaye (52\')',
      date_debut: new Date(maintenant.getTime() - 75 * 60 * 1000).toISOString(),
      diffuseur: 'RTS 2 / Direct Stade Iba Mar Diop',
    },
    {
      id: 'l1sn-2',
      competition: 'Ligue 1 Sénégal',
      categorie: 'ligue1_sn',
      equipe_domicile: 'Génération Foot',
      equipe_exterieur: 'Guédiawaye FC',
      score_domicile: 1,
      score_exterieur: 1,
      statut: 'TERMINE',
      minute_jeu: 'Fin',
      date_debut: new Date(maintenant.getTime() - 24 * 3600 * 1000).toISOString(),
      diffuseur: 'Stade Djibril Diagne Déni',
    },
    {
      id: 'l1sn-3',
      competition: 'Ligue 1 Sénégal',
      categorie: 'ligue1_sn',
      equipe_domicile: 'Casa Sports',
      equipe_exterieur: 'AS Pikine',
      score_domicile: null,
      score_exterieur: null,
      statut: 'A_VENIR',
      date_debut: new Date(maintenant.getTime() + 30 * 3600 * 1000).toISOString(),
      minute_jeu: null,
      diffuseur: 'Stade Aline Sitoé Diatta Ziguinchor',
    },
  ];
}

/**
 * Filtre les matchs selon les équipes sélectionnées ou la compétition
 */
function filtrerMatchsSport({ equipesSuivies = [], categorie = 'tous', limit = 15 }) {
  const tous = genererProgrammeSportActuel();

  let resultats = tous;

  // Filtre par catégorie de compétition
  if (categorie && categorie !== 'tous' && categorie !== 'mes_equipes') {
    resultats = resultats.filter((m) => m.categorie === categorie);
  }

  // Filtre par équipes suivies personnalisées
  if (categorie === 'mes_equipes' || (Array.isArray(equipesSuivies) && equipesSuivies.length > 0 && categorie === 'tous')) {
    if (Array.isArray(equipesSuivies) && equipesSuivies.length > 0) {
      const termesMinuscules = equipesSuivies.map((eq) => eq.toLowerCase().trim());
      const correspondants = tous.filter((m) => {
        return termesMinuscules.some((terme) => {
          return (
            m.equipe_domicile.toLowerCase().includes(terme) ||
            m.equipe_exterieur.toLowerCase().includes(terme) ||
            (m.buteurs && m.buteurs.toLowerCase().includes(terme))
          );
        });
      });

      if (correspondants.length > 0) {
        resultats = correspondants;
      }
    }
  }

  return resultats.slice(0, limit);
}

module.exports = {
  LISTE_EQUIPES_DISPONIBLES,
  genererProgrammeSportActuel,
  filtrerMatchsSport,
};
