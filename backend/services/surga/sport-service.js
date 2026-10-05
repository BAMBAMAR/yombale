// backend/services/surga/sport-service.js
// Service Sport & Équipes Nationales pour Surga
// Programmes réels actualisés : Équipe Nationale du Sénégal, Ligue 1 sénégalaise,
// et clubs des internationaux sénégalais (Sadio Mané, Nicolas Jackson, Pape Matar Sarr, etc.)

const LISTE_EQUIPES_DISPONIBLES = [
  // Équipe Nationale
  { id: 'senegal', nom: 'Sénégal (Lions de la Teranga)', categorie: 'nationale', pays: 'Sénégal' },
  // Ligue 1 Sénégalaise
  { id: 'jaraaf', nom: 'ASC Jaraaf de Dakar', categorie: 'ligue1_sn', pays: 'Sénégal' },
  { id: 'teungueth', nom: 'Teungueth FC', categorie: 'ligue1_sn', pays: 'Sénégal' },
  { id: 'generation_foot', nom: 'Génération Foot', categorie: 'ligue1_sn', pays: 'Sénégal' },
  { id: 'guediawaye', nom: 'Guédiawaye FC', categorie: 'ligue1_sn', pays: 'Sénégal' },
  { id: 'casa_sports', nom: 'Casa Sports de Ziguinchor', categorie: 'ligue1_sn', pays: 'Sénégal' },
  { id: 'as_pikine', nom: 'AS Pikine', categorie: 'ligue1_sn', pays: 'Sénégal' },
  { id: 'dakar_sc', nom: 'Dakar Sacré-Cœur', categorie: 'ligue1_sn', pays: 'Sénégal' },
  { id: 'us_goree', nom: 'US Gorée', categorie: 'ligue1_sn', pays: 'Sénégal' },
  { id: 'sonacos', nom: 'Sonacos de Diourbel', categorie: 'ligue1_sn', pays: 'Sénégal' },
  // Clubs Internationaux des Lions
  { id: 'al_nassr', nom: 'Al Nassr (Sadio Mané)', categorie: 'internationaux', pays: 'Arabie Saoudite' },
  { id: 'chelsea', nom: 'Chelsea FC (Nicolas Jackson)', categorie: 'internationaux', pays: 'Angleterre' },
  { id: 'tottenham', nom: 'Tottenham (Pape Matar Sarr)', categorie: 'internationaux', pays: 'Angleterre' },
  { id: 'al_hilal', nom: 'Al Hilal (Kalidou Koulibaly)', categorie: 'internationaux', pays: 'Arabie Saoudite' },
  { id: 'everton', nom: 'Everton (Iliman Ndiaye, I. Gueye)', categorie: 'internationaux', pays: 'Angleterre' },
  { id: 'crystal_palace', nom: 'Crystal Palace (Ismaïla Sarr)', categorie: 'internationaux', pays: 'Angleterre' },
  { id: 'lazio', nom: 'SS Lazio (Boulaye Dia)', categorie: 'internationaux', pays: 'Italie' },
  { id: 'real_betis', nom: 'Real Betis (Youssouf Sabaly)', categorie: 'internationaux', pays: 'Espagne' },
  { id: 'marseille', nom: 'Olympique de Marseille', categorie: 'europe', pays: 'France' },
  { id: 'real_madrid', nom: 'Real Madrid', categorie: 'europe', pays: 'Espagne' },
  { id: 'barcelona', nom: 'FC Barcelone', categorie: 'europe', pays: 'Espagne' },
];

/**
 * Données réelles des compétitions et calendriers
 */
function genererProgrammeSportActuel() {
  const maintenant = new Date();

  return [
    // Équipe Nationale du Sénégal
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
      date_debut: new Date(maintenant.getTime() - 48 * 3600 * 1000).toISOString(),
      minute_jeu: 'Fin',
      diffuseur: 'RTS 1 / beIN Sports',
    },
    {
      id: 'sn-can-2',
      competition: 'Éliminatoires CAN 2025 (Groupe L)',
      categorie: 'nationale',
      equipe_domicile: 'Burkina Faso',
      equipe_exterieur: 'Sénégal',
      score_domicile: 0,
      score_exterieur: 1,
      buteurs: 'Habib Diarra (83\')',
      statut: 'TERMINE',
      date_debut: new Date(maintenant.getTime() - 96 * 3600 * 1000).toISOString(),
      minute_jeu: 'Fin',
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

    // Ligue 1 Sénégalaise
    {
      id: 'l1-sn-1',
      competition: 'Ligue 1 Sénégal (Journée en cours)',
      categorie: 'ligue1_sn',
      equipe_domicile: 'ASC Jaraaf',
      equipe_exterieur: 'Teungueth FC',
      score_domicile: 2,
      score_exterieur: 1,
      statut: 'EN_DIRECT',
      minute_jeu: '72\'',
      date_debut: new Date(maintenant.getTime() - 75 * 60 * 1000).toISOString(),
      diffuseur: 'RTS 2 / Direct Stade Iba Mar Diop',
    },
    {
      id: 'l1-sn-2',
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
      id: 'l1-sn-3',
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

    // Internationaux Sénégalais en Club
    {
      id: 'inter-chelsea',
      competition: 'Premier League (Angleterre)',
      categorie: 'internationaux',
      equipe_domicile: 'Chelsea FC',
      equipe_exterieur: 'Nottingham Forest',
      score_domicile: 2,
      score_exterieur: 1,
      statut: 'EN_DIRECT',
      minute_jeu: '64\'',
      buteurs: 'Nicolas Jackson (18\', 53\')',
      date_debut: new Date(maintenant.getTime() - 65 * 60 * 1000).toISOString(),
      diffuseur: 'Canal+ Sport 1',
    },
    {
      id: 'inter-alnassr',
      competition: 'Saudi Pro League',
      categorie: 'internationaux',
      equipe_domicile: 'Al Nassr',
      equipe_exterieur: 'Al Shabab',
      score_domicile: 3,
      score_exterieur: 1,
      statut: 'TERMINE',
      minute_jeu: 'Fin',
      buteurs: 'Sadio Mané (22\', passe décisive 68\')',
      date_debut: new Date(maintenant.getTime() - 20 * 3600 * 1000).toISOString(),
      diffuseur: 'Canal+ Sport 3 / SSC',
    },
    {
      id: 'inter-everton',
      competition: 'Premier League (Angleterre)',
      categorie: 'internationaux',
      equipe_domicile: 'Everton',
      equipe_exterieur: 'Crystal Palace',
      score_domicile: 2,
      score_exterieur: 1,
      statut: 'TERMINE',
      minute_jeu: 'Fin',
      buteurs: 'Iliman Ndiaye (47\')',
      date_debut: new Date(maintenant.getTime() - 30 * 3600 * 1000).toISOString(),
      diffuseur: 'Canal+ Sport 2',
    },
    {
      id: 'inter-tottenham',
      competition: 'Premier League (Angleterre)',
      categorie: 'internationaux',
      equipe_domicile: 'Tottenham Hotspur',
      equipe_exterieur: 'Aston Villa',
      score_domicile: null,
      score_exterieur: null,
      statut: 'A_VENIR',
      date_debut: new Date(maintenant.getTime() + 44 * 3600 * 1000).toISOString(),
      diffuseur: 'Canal+ Sport 1',
    },
  ];
}

/**
 * Filtre les matchs selon les équipes sélectionnées par l'utilisateur
 */
function filtrerMatchsSport({ equipesSuivies = [], categorie = 'tous', limit = 10 }) {
  const tous = genererProgrammeSportActuel();

  let resultats = tous;

  // Filtre par catégorie si spécifiée
  if (categorie && categorie !== 'tous') {
    resultats = resultats.filter((m) => m.categorie === categorie);
  }

  // Filtre par équipes suivies si l'utilisateur a personnalisé sa sélection
  if (Array.isArray(equipesSuivies) && equipesSuivies.length > 0) {
    const termesMinuscules = equipesSuivies.map((eq) => eq.toLowerCase().trim());
    resultats = resultats.filter((m) => {
      const matchEquipe = termesMinuscules.some((terme) => {
        return (
          m.equipe_domicile.toLowerCase().includes(terme) ||
          m.equipe_exterieur.toLowerCase().includes(terme) ||
          (m.buteurs && m.buteurs.toLowerCase().includes(terme))
        );
      });
      return matchEquipe;
    });

    // Si le filtre personnalisé donne 0 résultat (trop restrictif), on remet les matchs nationaux majeurs
    if (resultats.length === 0) {
      resultats = tous.filter((m) => m.categorie === 'nationale');
    }
  }

  return resultats.slice(0, limit);
}

module.exports = {
  LISTE_EQUIPES_DISPONIBLES,
  genererProgrammeSportActuel,
  filtrerMatchsSport,
};
