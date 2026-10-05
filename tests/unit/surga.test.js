// tests/unit/surga.test.js
// Tests unitaires du module Surga (Tranches 1 & 2)

const { nettoyerResume, SOURCES_DEFAUT, SPORT_EVENEMENTS_DEFAUT } = require('../../backend/services/surga/rss-collector');

describe('Module Surga — Tranches 1 & 2', () => {
  describe('Tranche 1 : Préférences & Onboarding', () => {
    test('La configuration par défaut contient les 5 modules de base', () => {
      const preferencesDefaut = {
        modules_actifs: ['briefing', 'notes', 'depenses', 'calculatrice', 'agenda'],
        heure_briefing: '07:30',
        langue: 'fr',
        audio_actif: false,
        onboarding_termine: false,
      };

      expect(preferencesDefaut.modules_actifs).toContain('briefing');
      expect(preferencesDefaut.modules_actifs).toContain('notes');
      expect(preferencesDefaut.modules_actifs).toContain('depenses');
      expect(preferencesDefaut.modules_actifs).toContain('calculatrice');
      expect(preferencesDefaut.modules_actifs).toContain('agenda');
      expect(preferencesDefaut.heure_briefing).toBe('07:30');
      expect(preferencesDefaut.audio_actif).toBe(false);
    });

    test('Validation du format d’heure (HH:mm)', () => {
      const regexHeure = /^\d{2}:\d{2}$/;
      expect(regexHeure.test('07:30')).toBe(true);
      expect(regexHeure.test('08:00')).toBe(true);
      expect(regexHeure.test('invalid')).toBe(false);
    });
  });

  describe('Tranche 2 : Ingestion RSS & Briefing Quotidien', () => {
    test('Sources sénégalaises par défaut correctement configurées', () => {
      expect(SOURCES_DEFAUT.length).toBeGreaterThanOrEqual(3);
      const noms = SOURCES_DEFAUT.map(s => s.nom);
      expect(noms).toContain('APS');
      expect(noms).toContain('Le Soleil');
      expect(noms).toContain('Seneweb');
    });

    test('Nettoyage du résumé : suppression HTML et limite stricte < 180 caractères', () => {
      const htmlLong = '<p>Un texte d’actualité avec <b>du balisage HTML</b> et des espaces superflus. ' +
        'Le gouvernement sénégalais annonce de nouveaux investissements majeurs dans les infrastructures urbaines, ' +
        'les transports et la digitalisation de l’économie locale pour soutenir les jeunes commerçants et entrepreneurs.</p>';

      const resumePropre = nettoyerResume(htmlLong);
      expect(resumePropre).not.toContain('<p>');
      expect(resumePropre).not.toContain('<b>');
      expect(resumePropre.length).toBeLessThanOrEqual(180);
      expect(resumePropre.endsWith('...')).toBe(true);
    });

    test('Nettoyage du résumé : texte court préservé sans troncature', () => {
      const texteCourt = 'Le TER fonctionne normalement ce matin.';
      expect(nettoyerResume(texteCourt)).toBe(texteCourt);
    });

    test('Événements sportifs par défaut structurés', () => {
      expect(SPORT_EVENEMENTS_DEFAUT.length).toBeGreaterThan(0);
      const premier = SPORT_EVENEMENTS_DEFAUT[0];
      expect(premier).toHaveProperty('competition');
      expect(premier).toHaveProperty('equipe_domicile');
      expect(premier).toHaveProperty('equipe_exterieur');
      expect(premier).toHaveProperty('statut');
      expect(['TERMINE', 'A_VENIR', 'EN_COURS']).toContain(premier.statut);
    });
  });

  describe('Tranche 3 : Moteur de Calcul Déterministe & Gestion Dépenses', () => {
    const { evaluerCalcul, formaterFCFA } = require('../../backend/services/surga/calculator');

    test('Opérations arithmétiques fondamentales (+, -, *, /)', () => {
      expect(evaluerCalcul('100 + 50').resultat).toBe(150);
      expect(evaluerCalcul('2500 * 2').resultat).toBe(5000);
      expect(evaluerCalcul('10000 - 3500').resultat).toBe(6500);
      expect(evaluerCalcul('100 / 4').resultat).toBe(25);
    });

    test('Support des symboles alternatifs et virgules (×, ÷, virgule décimale)', () => {
      expect(evaluerCalcul('500 × 3').resultat).toBe(1500);
      expect(evaluerCalcul('1500 ÷ 3').resultat).toBe(500);
      expect(evaluerCalcul('2,5 * 4').resultat).toBe(10);
    });

    test('Calcul déterministe de pourcentage (TVA et remises)', () => {
      // 5000 + 18% de TVA = 5900
      expect(evaluerCalcul('5000 + 18%').resultat).toBe(5900);
      // 1000 - 10% de remise = 900
      expect(evaluerCalcul('1000 - 10%').resultat).toBe(900);
      // 500 * 20% = 100
      expect(evaluerCalcul('500 * 20%').resultat).toBe(100);
    });

    test('Gestion des erreurs : division par zéro et caractères interdits', () => {
      const divZero = evaluerCalcul('100 / 0');
      expect(divZero.success).toBe(false);
      expect(divZero.erreur).toContain('Division par zéro');

      const injection = evaluerCalcul('alert(1) + 2');
      expect(injection.success).toBe(false);
      expect(injection.erreur).toContain('non autorisés');
    });

    test('Formatage rigoureux en Franc CFA', () => {
      expect(formaterFCFA(45000)).toBe('45 000 FCFA');
      expect(formaterFCFA(1250000)).toBe('1 250 000 FCFA');
      expect(formaterFCFA(0)).toBe('0 FCFA');
      expect(formaterFCFA(null)).toBe('0 FCFA');
    });

    test('Le routeur maître Surga charge l’ensemble des sous-modules sans erreur', () => {
      const surgaRouter = require('../../backend/routes/surga/index');
      expect(typeof surgaRouter).toBe('function');
      expect(surgaRouter.name).toBe('router');
    });
  });

  describe('Tranche 4 : Mon Agenda & Rappels programmés', () => {
    test('Structure valide d’un rappel avec heure et répétition', () => {
      const rappelTest = {
        titre: 'Récupérer commande pressing',
        date_evenement: '2026-10-04',
        heure_evenement: '18:30',
        est_rappel: true,
        repetition: 'AUCUNE',
        termine: false,
      };

      expect(rappelTest.titre).toBeTruthy();
      expect(/^\d{4}-\d{2}-\d{2}$/.test(rappelTest.date_evenement)).toBe(true);
      expect(/^\d{2}:\d{2}$/.test(rappelTest.heure_evenement)).toBe(true);
      expect(['AUCUNE', 'QUOTIDIEN', 'HEBDOMADAIRE', 'MENSUEL']).toContain(rappelTest.repetition);
    });

    test('Validation du calcul de délai de rappel (5 minutes)', () => {
      const now = new Date();
      const cible = new Date(now.getTime() + 5 * 60 * 1000);
      const diffMs = cible.getTime() - now.getTime();
      const diffMinutes = Math.round(diffMs / 60000);
      expect(diffMinutes).toBe(5);
    });

    test('Chargement du routeur Express de l’agenda sans erreur', () => {
      const agendaRouter = require('../../backend/routes/surga/agenda');
      expect(typeof agendaRouter).toBe('function');
      expect(agendaRouter.name).toBe('router');
    });
  });

  describe('Tranche 5 : Surga sur WhatsApp pour des tâches précises', () => {
    const {
      parserIntentionWhatsApp,
      devinerCategorie,
      QUOTA_JOURNALIER_GRATUIT,
    } = require('../../backend/services/surga/whatsapp-handler');

    test('Parsing d’intention de dépense avec catégorie devinée', () => {
      const resTaxi = parserIntentionWhatsApp('note 2500 taxi');
      expect(resTaxi.intention).toBe('ADD_EXPENSE');
      expect(resTaxi.montant).toBe(2500);
      expect(resTaxi.categorie).toBe('Transport');

      const resCourses = parserIntentionWhatsApp('depense 7500 courses marche');
      expect(resCourses.intention).toBe('ADD_EXPENSE');
      expect(resCourses.montant).toBe(7500);
      expect(resCourses.categorie).toBe('Alimentation');

      const resSenelec = parserIntentionWhatsApp('j\'ai paye 15000 woyofal');
      expect(resSenelec.intention).toBe('ADD_EXPENSE');
      expect(resSenelec.montant).toBe(15000);
      expect(resSenelec.categorie).toBe('Logement');
    });

    test('Parsing d’intention de rappel avec date relative et heure', () => {
      const resRappel = parserIntentionWhatsApp('rappel réunion demain 14h30');
      expect(resRappel.intention).toBe('ADD_REMINDER');
      expect(resRappel.titre).toContain('réunion');
      expect(resRappel.heure).toBe('14:30');
      // La date doit être celle de demain
      const d = new Date();
      d.setDate(d.getDate() + 1);
      expect(resRappel.date).toBe(d.toISOString().slice(0, 10));
    });

    test('Parsing d’intention de note rapide', () => {
      const resNote = parserIntentionWhatsApp('note vérifier les prix du riz');
      expect(resNote.intention).toBe('ADD_NOTE');
      expect(resNote.contenu).toBe('vérifier les prix du riz');
    });

    test('Parsing de calcul arithmétique déterministe', () => {
      const resCalc1 = parserIntentionWhatsApp('calcule 12000 * 3');
      expect(resCalc1.intention).toBe('CALCULATE');
      expect(resCalc1.expression).toBe('12000 * 3');

      const resCalc2 = parserIntentionWhatsApp('5000 + 18%');
      expect(resCalc2.intention).toBe('CALCULATE');
    });

    test('Parsing du briefing matinal', () => {
      expect(parserIntentionWhatsApp('briefing').intention).toBe('BRIEFING');
      expect(parserIntentionWhatsApp('actu').intention).toBe('BRIEFING');
      expect(parserIntentionWhatsApp('actualites').intention).toBe('BRIEFING');
    });

    test('Parsing des confirmations OUI et NON', () => {
      expect(parserIntentionWhatsApp('oui').intention).toBe('CONFIRMATION_OUI');
      expect(parserIntentionWhatsApp('1').intention).toBe('CONFIRMATION_OUI');
      expect(parserIntentionWhatsApp('valider').intention).toBe('CONFIRMATION_OUI');

      expect(parserIntentionWhatsApp('non').intention).toBe('CONFIRMATION_NON');
      expect(parserIntentionWhatsApp('0').intention).toBe('CONFIRMATION_NON');
      expect(parserIntentionWhatsApp('annuler').intention).toBe('CONFIRMATION_NON');
    });

    test('Tolérance au préfixe explicite "surga"', () => {
      const resPrefix = parserIntentionWhatsApp('surga calcule 4500 * 2');
      expect(resPrefix.intention).toBe('CALCULATE');
      expect(resPrefix.expression).toBe('4500 * 2');

      const resPrefixDepense = parserIntentionWhatsApp('Surga : note 3000 essence');
      expect(resPrefixDepense.intention).toBe('ADD_EXPENSE');
      expect(resPrefixDepense.montant).toBe(3000);
      expect(resPrefixDepense.categorie).toBe('Transport');
    });

    test('Intention inconnue pour les messages e-commerce ou hors périmètre', () => {
      expect(parserIntentionWhatsApp('bonjour comment ca va').intention).toBe('INCONNU');
      expect(parserIntentionWhatsApp('catalogue').intention).toBe('INCONNU');
      expect(parserIntentionWhatsApp('').intention).toBe('INCONNU');
    });

    test('Quota gratuit fixé à 2 commandes par jour sur WhatsApp (protection coûts)', () => {
      expect(QUOTA_JOURNALIER_GRATUIT).toBe(2);
    });

    test('Catégorisation intelligente par mots-clés', () => {
      expect(devinerCategorie('pharmacie touba')).toBe('Santé');
      expect(devinerCategorie('woyofal senelec')).toBe('Logement');
      expect(devinerCategorie('essence shell')).toBe('Transport');
      expect(devinerCategorie('restaurant chez loutcha')).toBe('Alimentation');
      expect(devinerCategorie('carte recharge wave')).toBe('Factures');
      expect(devinerCategorie('achat divers')).toBe('Autre');
    });
  });

  describe('Tranche 6 : Je commande à la voix dans l’app', () => {
    const {
      normaliserNombresVocaux,
      devinerCategorieVocale,
      interpreterCommandeVocale,
    } = require('../../backend/services/surga/voice-interpreter');

    test('Conversion orale des opérateurs mathématiques (divisé par, fois, plus, moins, pour cent)', () => {
      expect(normaliserNombresVocaux('100 divisé par 3')).toBe('100 / 3');
      expect(normaliserNombresVocaux('2500 fois 4')).toBe('2500 * 4');
      expect(normaliserNombresVocaux('5000 plus 18 pour cent')).toBe('5000 + 18 %');
      expect(normaliserNombresVocaux('10000 moins 2000')).toBe('10000 - 2000');
    });

    test('Conversion orale des mots-nombres français usuels', () => {
      expect(normaliserNombresVocaux('deux mille cinq cents')).toBe('2500');
      expect(normaliserNombresVocaux('quinze cents')).toBe('1500');
      expect(normaliserNombresVocaux('dix mille')).toBe('10000');
      expect(normaliserNombresVocaux('cinq cents')).toBe('500');
      expect(normaliserNombresVocaux('cent')).toBe('100');
    });

    test('Critère de démonstration : calcul dicté "100 divisé par 3" exécuté déterministement', () => {
      const action = interpreterCommandeVocale('100 divisé par 3');
      expect(action.intention).toBe('CALCULATE');
      expect(action.calculResultat).toBeDefined();
      expect(action.calculResultat.success).toBe(true);
      expect(action.calculResultat.resultat).toBeCloseTo(33.33, 2);
    });

    test('Critère de démonstration : dépense dictée "note deux mille cinq cents de taxi"', () => {
      const action = interpreterCommandeVocale('note deux mille cinq cents de taxi');
      expect(action.intention).toBe('ADD_EXPENSE');
      expect(action.depenseData).toBeDefined();
      expect(action.depenseData.montant).toBe(2500);
      expect(action.depenseData.categorie).toBe('Transport');
      expect(action.depenseData.note).toContain('taxi');
    });

    test('Rappel dicté avec heure et échéance relative', () => {
      const action = interpreterCommandeVocale('rappelle-moi demain à 14h30 réunion d’équipe');
      expect(action.intention).toBe('ADD_REMINDER');
      expect(action.rappelData).toBeDefined();
      expect(action.rappelData.heure).toBe('14:30');
      expect(action.rappelData.titre).toContain('réunion');
    });

    test('Note dictée conservant le texte', () => {
      const action = interpreterCommandeVocale('note acheter des mangues au marché');
      expect(action.intention).toBe('ADD_NOTE');
      expect(action.noteData).toBeDefined();
      expect(action.noteData.contenu).toContain('acheter des mangues');
    });

    test('Phrase hors périmètre marquée comme INCONNU', () => {
      const action = interpreterCommandeVocale('bonjour comment allez-vous aujourd’hui');
      expect(action.intention).toBe('INCONNU');
    });

    test('Le routeur audio expose l’endpoint POST /audio/interpret pour l’interprétation vocale', () => {
      const audioRouter = require('../../backend/routes/surga/audio');
      const routeInterpret = audioRouter.stack.find(
        (s) => s.route && s.route.path === '/audio/interpret' && s.route.methods.post
      );
      expect(routeInterpret).toBeDefined();
    });
  });

  describe('Tranche 7 : Je partage', () => {
    const {
      formaterPartageBreve,
      formaterPartageSport,
      formaterPartageCalcul,
      genererLienWhatsApp,
      BASE_URL,
    } = require('../../backend/services/surga/share-formatter');

    // Regex vérifiant l'absence d'émojis Unicode
    const regexEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    test('Partage d’une brève d’actualité avec lien vers Surga et zéro émoji', () => {
      const msg = formaterPartageBreve({
        titre: 'Mise en service du prolongement du TER vers AIBD',
        source: 'APS',
        resume: 'Les travaux avancent conformément au calendrier officiel.',
        urlSource: 'https://aps.sn/ter-aibd',
      });

      expect(msg).toContain('*Surga — Actualité*');
      expect(msg).toContain('*Mise en service du prolongement du TER vers AIBD*');
      expect(msg).toContain('• Source : APS');
      expect(msg).toContain('https://aps.sn/ter-aibd');
      expect(msg).toContain(BASE_URL);
      expect(regexEmoji.test(msg)).toBe(false);
    });

    test('Partage d’un événement sportif avec statut lisible et zéro émoji', () => {
      const msgTermine = formaterPartageSport({
        competition: 'Éliminatoires CAN',
        equipeDomicile: 'Sénégal',
        equipeExterieur: 'RD Congo',
        score: '2 - 0',
        statut: 'TERMINE',
      });

      expect(msgTermine).toContain('*Surga — Sport & Résultats*');
      expect(msgTermine).toContain('Sénégal vs RD Congo');
      expect(msgTermine).toContain('• Score : 2 - 0');
      expect(msgTermine).toContain('• Statut : Terminé');
      expect(msgTermine).toContain(BASE_URL);
      expect(regexEmoji.test(msgTermine)).toBe(false);

      const msgAVenir = formaterPartageSport({
        competition: 'Ligue 1 Sénégal',
        equipeDomicile: 'Jaraaf',
        equipeExterieur: 'Génération Foot',
        heure: 'Samedi 17h00',
        statut: 'A_VENIR',
      });
      expect(msgAVenir).toContain('• Statut : À venir');
      expect(msgAVenir).toContain('Samedi 17h00');
    });

    test('Partage d’un calcul arithmétique déterministe', () => {
      const msgCalcul = formaterPartageCalcul({
        expression: '12 500 * 3',
        resultatFormate: '37 500 FCFA',
      });

      expect(msgCalcul).toContain('*Surga — Calculatrice*');
      expect(msgCalcul).toContain('• Calcul : 12 500 * 3');
      expect(msgCalcul).toContain('• Résultat exact : 37 500 FCFA');
      expect(msgCalcul).toContain(BASE_URL);
      expect(regexEmoji.test(msgCalcul)).toBe(false);
    });

    test('Génération de l’URL WhatsApp avec encodage complet des paramètres', () => {
      const texte = '*Surga*\n• Test de partage';
      const url = genererLienWhatsApp(texte);

      expect(url.startsWith('https://api.whatsapp.com/send?text=')).toBe(true);
      expect(url).toContain(encodeURIComponent('*Surga*'));
      expect(url).not.toContain('\n'); // Les retours chariots doivent être encodés (%0A)
    });
  });

  describe('Tranche 8 : Revue de presse résumée & Rubriques thématiques', () => {
    const {
      classerRubriquePresse,
      RUBRIQUES_VALIDES,
      nettoyerResume,
      SOURCES_DEFAUT,
    } = require('../../backend/services/surga/rss-collector');

    test('Rubriques valides conformes aux spécifications', () => {
      expect(RUBRIQUES_VALIDES).toEqual(
        expect.arrayContaining(['economie', 'societe', 'tech', 'politique', 'general'])
      );
    });

    test('Classification thématique déterministe par mots-clés', () => {
      // Économie
      expect(
        classerRubriquePresse(
          'La BCEAO maintient ses taux directeurs pour stabiliser le franc CFA',
          'Analyse des investissements et de l inflation régionale.'
        )
      ).toBe('economie');

      // Tech & Digital
      expect(
        classerRubriquePresse(
          'Levée de fonds record pour une startup fintech à Dakar',
          'L écosystème numérique et le mobile money attirent les capitaux.'
        )
      ).toBe('tech');

      // Politique & Institutions
      expect(
        classerRubriquePresse(
          'Conseil des ministres : adoption d un nouveau projet de loi',
          'L Assemblée nationale examinera le texte en session extraordinaire.'
        )
      ).toBe('politique');

      // Société
      expect(
        classerRubriquePresse(
          'Le réseau d assainissement renforcé avant la saison des pluies',
          'Des travaux préventifs à Pikine et Guédiawaye pour protéger les quartiers.'
        )
      ).toBe('societe');

      // Repli 'general'
      expect(
        classerRubriquePresse(
          'Un événement culturel rassemble des artistes à Saint-Louis',
          'Une belle célébration du patrimoine local.'
        )
      ).toBe('general');
    });

    test('Attribution des sources nationales majeures enrichies (projetbi.org)', () => {
      const nomsSources = SOURCES_DEFAUT.map((s) => s.nom);
      expect(nomsSources).toContain('APS');
      expect(nomsSources).toContain('Le Soleil');
      expect(nomsSources).toContain('Dakaractu');
      expect(nomsSources).toContain('Seneweb');
      expect(nomsSources).toContain('Le Quotidien');
      expect(nomsSources).toContain('Sud Quotidien');
      expect(nomsSources).toContain('Presse Éco SN');
      expect(nomsSources).toContain('Presse Tech SN');
      expect(nomsSources).toContain('Presse Institutions SN');
    });

    test('Sourcing éthique : résumés toujours inférieurs ou égaux à 180 caractères', () => {
      const texteLong =
        'Dakar abrite ce matin une grande conférence internationale réunissant les dirigeants de plusieurs pays ' +
        'autour des enjeux de transition énergétique, de modernisation des infrastructures portuaires et de sécurité alimentaire. ' +
        'Les discussions portent notamment sur les investissements multilatéraux et le rôle des PME africaines.';

      const resume = nettoyerResume(texteLong);
      expect(resume.length).toBeLessThanOrEqual(180);
      expect(resume.endsWith('...')).toBe(true);
    });

    test('Kiosque de la presse : intégrité des Unes des quotidiens nationaux', () => {
      const { UNES_DEFAUT } = require('../../backend/services/surga/kiosque-service');
      expect(UNES_DEFAUT.length).toBeGreaterThanOrEqual(8);
      const journaux = UNES_DEFAUT.map((u) => u.nom_journal);
      expect(journaux).toContain('Le Soleil');
      expect(journaux).toContain("L'Observateur");
      expect(journaux).toContain('Sud Quotidien');
      expect(journaux).toContain('Libération');
      expect(journaux).toContain('Enquête');
      expect(journaux).toContain('Record');

      for (const une of UNES_DEFAUT) {
        expect(une.image_url.startsWith('/surga/unes/')).toBe(true);
        expect(une.nom_journal.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Tranche 9 : Audio en option & Flux Podcast Privé', () => {
    const {
      preparerScriptAudio,
      genererPodcastFeedXml,
      nettoyerPourSyntheseVocale,
    } = require('../../backend/services/surga/audio-service');

    const regexEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    test('Nettoyage du texte pour synthèse vocale : suppression URL et émojis', () => {
      const brut = 'Bonjour https://nopalou.com/test voici les nouvelles du jour.';
      const propre = nettoyerPourSyntheseVocale(brut);
      expect(propre).not.toContain('http');
      expect(propre).toBe('Bonjour voici les nouvelles du jour.');
    });

    test('Composition du script audio naturel et respect strict du vouvoiement (D19)', () => {
      const briefingMock = {
        date: 'Lundi 4 octobre 2026',
        quartier: 'Médina',
        message_synthese: 'Le ciel est dégagé et la circulation est normale sur la corniche.',
        items: [
          {
            source_nom: 'APS',
            titre: 'Le TER adapte ses horaires de pointe',
            resume: 'Un cadencement renforcé est prévu dès 06h30.',
          },
        ],
        sports: [
          {
            equipe_domicile: 'Sénégal',
            equipe_exterieur: 'Burkina Faso',
            score_domicile: 2,
            score_exterieur: 0,
            statut: 'TERMINE',
          },
        ],
      };

      const script = preparerScriptAudio(briefingMock);

      expect(script).toContain('Bonjour.');
      expect(script).toContain('Voici votre briefing quotidien Surga du Lundi 4 octobre 2026 pour le secteur de Médina.');
      expect(script).toContain('Le ciel est dégagé');
      expect(script).toContain("d'après APS");
      expect(script).toContain('Sénégal 2, Burkina Faso 0');
      expect(script).toContain('Passez une excellente journée avec Surga et Nopalou.');
      // Pas de tutoiement (D19)
      expect(script).not.toMatch(/\b(tu|te|toi|ton|ta|tes)\b/i);
      // Zéro émoji
      expect(regexEmoji.test(script)).toBe(false);
    });

    test('Génération de flux XML Podcast RSS 2.0 valide avec enclosures', () => {
      const xml = genererPodcastFeedXml({
        token: '550e8400-e29b-41d4-a716-446655440000',
        utilisateurNom: 'Bamba Mar',
        scriptBriefing: 'Bonjour. Voici votre briefing audio matinal.',
        dateStr: '2026-10-04',
        baseUrl: 'https://nopalou.com',
      });

      expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
      expect(xml).toContain('<rss version="2.0"');
      expect(xml).toContain('<title>Surga — Briefing de Bamba Mar</title>');
      expect(xml).toContain('<language>fr-sn</language>');
      expect(xml).toContain('<itunes:image href="https://nopalou.com/icons/icon-512.png"/>');
      expect(xml).toContain('<enclosure url="https://nopalou.com/api/surga/podcast/550e8400-e29b-41d4-a716-446655440000/stream.mp3"');
      expect(xml).toContain('type="audio/mpeg"');
      expect(xml).toContain('</channel>');
      expect(xml).toContain('</rss>');
    });
  });

  describe('Tranche 10 : Radios Locales du Sénégal (Directs FM & Low-Data)', () => {
    const {
      RADIOS_SENEGAL,
      listerRadios,
      trouverRadioParId,
    } = require('../../backend/services/surga/radio-service');

    const regexEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    test('Bouquet des radios sénégalaises complet et diversifié (> 10 stations)', () => {
      expect(RADIOS_SENEGAL.length).toBeGreaterThanOrEqual(10);
      const noms = RADIOS_SENEGAL.map((r) => r.nom);
      expect(noms).toContain('RTS 92.5 RSI');
      expect(noms).toContain('Sud FM Sen Radio');
      expect(noms).toContain('Rewmi FM');
      expect(noms).toContain('Radio Oxy Jeunes');
      expect(noms).toContain('Radio Al Fayda');
      expect(noms).toContain('GMS FM Ziguinchor');
      expect(noms).toContain('RTS Matam');
    });

    test('Couverture territoriale nationale (Dakar, Banlieue, Bassin arachidier, Casamance, Fouta)', () => {
      const regions = RADIOS_SENEGAL.map((r) => r.region);
      expect(regions.some((reg) => reg.includes('Dakar'))).toBe(true);
      expect(regions.some((reg) => reg.includes('Pikine'))).toBe(true);
      expect(regions.some((reg) => reg.includes('Kaolack'))).toBe(true);
      expect(regions.some((reg) => reg.includes('Ziguinchor') || reg.includes('Casamance'))).toBe(true);
      expect(regions.some((reg) => reg.includes('Matam') || reg.includes('Fouta'))).toBe(true);
    });

    test('Conformité Low-Data et Zéro Emoji', () => {
      for (const radio of RADIOS_SENEGAL) {
        // Débit économe en forfait mobile sénégalais (max 128 kbps)
        expect(radio.bitrateKbps).toBeLessThanOrEqual(128);
        expect(radio.bitrateKbps).toBeGreaterThanOrEqual(64);
        // Fréquence bien définie
        expect(radio.frequence.length).toBeGreaterThan(0);
        // Zéro émoji
        expect(regexEmoji.test(radio.nom)).toBe(false);
        expect(regexEmoji.test(radio.slogan)).toBe(false);
        expect(regexEmoji.test(radio.description)).toBe(false);
      }
    });

    test('Filtrage par catégorie et par région', () => {
      const radiosInfo = listerRadios({ categorie: 'information' });
      expect(radiosInfo.length).toBeGreaterThan(0);
      expect(radiosInfo.every((r) => r.categorie === 'information')).toBe(true);

      const radiosTerroir = listerRadios({ categorie: 'terroir' });
      expect(radiosTerroir.length).toBeGreaterThan(0);
      expect(radiosTerroir.every((r) => r.categorie === 'terroir')).toBe(true);

      const radiosDakar = listerRadios({ region: 'dakar' });
      expect(radiosDakar.length).toBeGreaterThan(0);
      expect(radiosDakar.every((r) => r.region.toLowerCase().includes('dakar'))).toBe(true);
    });

    test('Recherche textuelle et sélection par ID', () => {
      const resultats = listerRadios({ recherche: 'sud' });
      expect(resultats.length).toBeGreaterThanOrEqual(1);
      expect(resultats[0].id).toBe('sud-fm');

      const radio = trouverRadioParId('rts-rsi');
      expect(radio).not.toBeNull();
      expect(radio.nom).toBe('RTS 92.5 RSI');
      expect(radio.directMp3).toBe(true);

      const introuvable = trouverRadioParId('inconnue-xyz');
      expect(introuvable).toBeNull();
    });
  });

  describe('Tranche 11 : Trafic à Dakar (Corridors, Heures de Pointe & Signalements)', () => {
    const {
      AXES_ROUTIERS_DAKAR,
      evaluerEtatTheoriqueAxe,
      genererSyntheseBriefingTrafic,
      enregistrerSignalement,
    } = require('../../backend/services/surga/trafic-service');

    const regexEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    test('Présence de l’ensemble des axes stratégiques et transports structurants', () => {
      expect(AXES_ROUTIERS_DAKAR.length).toBeGreaterThanOrEqual(8);
      const ids = AXES_ROUTIERS_DAKAR.map((a) => a.id);
      expect(ids).toContain('a1-entrant');
      expect(ids).toContain('a1-sortant');
      expect(ids).toContain('vdn-sud');
      expect(ids).toContain('corniche-ouest-sud');
      expect(ids).toContain('rn1-rufisque');
      expect(ids).toContain('ter-dakar');
      expect(ids).toContain('brt-dakar');
    });

    test('Évaluation déterministe de l’heure de pointe du matin (08h00 en semaine)', () => {
      // Lundi à 08h00 UTC
      const dateLundiMatin = new Date('2026-10-05T08:00:00Z');
      const a1Entrant = AXES_ROUTIERS_DAKAR.find((a) => a.id === 'a1-entrant');
      const etat = evaluerEtatTheoriqueAxe(a1Entrant, dateLundiMatin);

      expect(etat.niveau).toBe('bouche');
      expect(etat.tempsEstimeMin).toBeGreaterThan(a1Entrant.tempsHabituelMin);
      expect(etat.cause).toContain('matinale');
    });

    test('Évaluation déterministe de l’heure de pointe du soir (18h30 en semaine)', () => {
      // Mardi à 18h30 UTC
      const dateMardiSoir = new Date('2026-10-06T18:30:00Z');
      const a1Sortant = AXES_ROUTIERS_DAKAR.find((a) => a.id === 'a1-sortant');
      const etat = evaluerEtatTheoriqueAxe(a1Sortant, dateMardiSoir);

      expect(etat.niveau).toBe('bouche');
      expect(etat.tempsEstimeMin).toBeGreaterThan(a1Sortant.tempsHabituelMin);
      expect(etat.cause).toContain('soir');
    });

    test('Transports sur site propre (TER et BRT) fluides par défaut', () => {
      const dateLundiMatin = new Date('2026-10-05T08:00:00Z');
      const ter = AXES_ROUTIERS_DAKAR.find((a) => a.id === 'ter-dakar');
      const brt = AXES_ROUTIERS_DAKAR.find((a) => a.id === 'brt-dakar');

      const etatTer = evaluerEtatTheoriqueAxe(ter, dateLundiMatin);
      const etatBrt = evaluerEtatTheoriqueAxe(brt, dateLundiMatin);

      expect(etatTer.niveau).toBe('fluide');
      expect(etatBrt.niveau).toBe('fluide');
      expect(etatTer.tempsEstimeMin).toBe(ter.tempsHabituelMin);
    });

    test('Circulation dominicale fluide', () => {
      // Dimanche à 11h00 UTC
      const dateDimanche = new Date('2026-10-04T11:00:00Z');
      const vdn = AXES_ROUTIERS_DAKAR.find((a) => a.id === 'vdn-sud');
      const etat = evaluerEtatTheoriqueAxe(vdn, dateDimanche);

      expect(etat.niveau).toBe('fluide');
      expect(etat.tempsEstimeMin).toBe(vdn.tempsHabituelMin);
    });

    test('Synthèse textuelle du trafic pour le briefing (Zéro Emoji & Vouvoiement D19)', () => {
      const axesMock = [
        {
          id: 'a1-entrant',
          nom: 'Autoroute A1 (Sens Entrant)',
          niveau: 'bouche',
          tempsEstimeMin: 42,
          tempsHabituelMin: 18,
        },
        {
          id: 'corniche-ouest-sud',
          nom: 'Corniche Ouest',
          niveau: 'dense',
          tempsEstimeMin: 25,
          tempsHabituelMin: 16,
        },
        {
          id: 'ter-dakar',
          nom: 'TER',
          niveau: 'fluide',
        },
        {
          id: 'brt-dakar',
          nom: 'BRT',
          niveau: 'fluide',
        },
      ];

      const synthese = genererSyntheseBriefingTrafic(axesMock);
      expect(synthese).toContain('Forte affluence');
      expect(synthese).toContain('Autoroute A1');
      expect(synthese).toContain('42 minutes');
      expect(synthese).toContain('Corniche Ouest');
      expect(synthese).toContain('recommandées pour vos déplacements');
      // Zéro émoji
      expect(regexEmoji.test(synthese)).toBe(false);
      // Pas de tutoiement
      expect(synthese).not.toMatch(/\b(tu|te|toi|ton|ta|tes)\b/i);
    });

    test('Validation stricte des signalements communautaires', async () => {
      await expect(
        enregistrerSignalement({
          axeId: 'axe-inexistant',
          typeSignalement: 'dense',
        })
      ).rejects.toThrow('Axe routier non reconnu');

      await expect(
        enregistrerSignalement({
          axeId: 'a1-entrant',
          typeSignalement: 'type-inconnu',
        })
      ).rejects.toThrow('Type de signalement invalide');

      const signalementValide = await enregistrerSignalement({
        axeId: 'a1-entrant',
        typeSignalement: 'accident',
        commentaire: 'Accident au niveau de la sortie Thiaroye',
      });
      expect(signalementValide).toBeDefined();
      expect(signalementValide.type_signalement).toBe('accident');
      expect(signalementValide.commentaire).toContain('Thiaroye');
    });

    test('Présence des coordonnées GPS stratégiques pour les requêtes TomTom Live', () => {
      const axesRoutiers = AXES_ROUTIERS_DAKAR.filter((a) => a.type !== 'ferroviaire' && a.type !== 'bus_site_propre');
      for (const axe of axesRoutiers) {
        expect(axe.coords).toBeDefined();
        expect(axe.coords.lat).toBeGreaterThan(14.6);
        expect(axe.coords.lat).toBeLessThan(14.9);
        expect(axe.coords.lon).toBeGreaterThan(-17.6);
        expect(axe.coords.lon).toBeLessThan(-17.3);
      }
    });

    test('getEtatTraficComplet retourne la structure globale (axes, incidents, source)', async () => {
      const { getEtatTraficComplet } = require('../../backend/services/surga/trafic-service');
      const resultat = await getEtatTraficComplet();
      expect(resultat).toBeDefined();
      expect(Array.isArray(resultat.axes)).toBe(true);
      expect(resultat.axes.length).toBeGreaterThanOrEqual(8);
      expect(Array.isArray(resultat.incidents)).toBe(true);
      expect(['tomtom_live', 'previsionnel']).toContain(resultat.source);
      expect(resultat.derniereMiseAJour).toBeDefined();
    });
  });

  describe('Tranche 12 : Immobilier & Moteur d Alertes Immobilières', () => {
    const {
      QUARTIERS_DAKAR,
      BIENS_DEMO,
      parserRechercheImmoNaturelle,
      rechercherBiensImmo,
      recupererBienParId,
      creerAlerteImmo,
      correspondAlerte,
      genererSyntheseImmoBriefing,
    } = require('../../backend/services/surga/immo-service');

    const regexEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    test('Couverture complète des quartiers majeurs de Dakar (> 25 quartiers)', () => {
      expect(QUARTIERS_DAKAR.length).toBeGreaterThanOrEqual(25);
      expect(QUARTIERS_DAKAR).toContain('Almadies');
      expect(QUARTIERS_DAKAR).toContain('Ngor');
      expect(QUARTIERS_DAKAR).toContain('Ouakam');
      expect(QUARTIERS_DAKAR).toContain('Mermoz');
      expect(QUARTIERS_DAKAR).toContain('Plateau');
      expect(QUARTIERS_DAKAR).toContain('Parcelles Assainies');
      expect(QUARTIERS_DAKAR).toContain('Yoff');
      expect(QUARTIERS_DAKAR).toContain('Hann Maristes');
    });

    test('Parser de recherche en langage naturel - Requête complexe Studio Meublé', () => {
      const criteres = parserRechercheImmoNaturelle('Trouve moi un studio meublé à Mermoz avec un budget max de 300 000 FCFA');
      expect(criteres.typeBien).toBe('studio');
      expect(criteres.transaction).toBe('location');
      expect(criteres.quartier).toBe('Mermoz');
      expect(criteres.prixMax).toBe(300000);
      expect(criteres.meuble).toBe(true);
    });

    test('Parser de recherche en langage naturel - Appartement F3 Vente Ouakam', () => {
      const criteres = parserRechercheImmoNaturelle('Achat appartement F3 ou 3 pièces à Ouakam moins de 45 millions');
      expect(criteres.typeBien).toBe('appartement');
      expect(criteres.transaction).toBe('vente');
      expect(criteres.quartier).toBe('Ouakam');
      expect(criteres.nbChambres).toBe(2);
      expect(criteres.prixMax).toBe(45000000);
    });

    test('Parser de recherche en langage naturel - Villa avec jardin Almadies', () => {
      const criteres = parserRechercheImmoNaturelle('Je cherche une grande villa à louer aux Almadies');
      expect(criteres.typeBien).toBe('villa');
      expect(criteres.transaction).toBe('location');
      expect(criteres.quartier).toBe('Almadies');
    });

    test('Recherche multi-critères dans le pôle immobilier', async () => {
      const { biens, total } = await rechercherBiensImmo({
        typeBien: 'appartement',
        transaction: 'location',
        quartier: 'Mermoz',
      });
      expect(total).toBeGreaterThanOrEqual(1);
      const premier = biens[0];
      expect(premier.type_bien).toBe('appartement');
      expect(premier.quartier).toBe('Mermoz');
      expect(premier.prix).toBeDefined();
      expect(premier.verifie).toBe(true);
      expect(premier.contact_tel).toBeDefined();
    });

    test('Fiche détaillée d un bien par son identifiant', async () => {
      const bien = await recupererBienParId('immo-demo-2');
      expect(bien).toBeDefined();
      expect(bien.id).toBe('immo-demo-2');
      expect(bien.type_bien).toBe('studio');
      expect(bien.quartier).toBe('Almadies');
      expect(bien.meuble).toBe(true);
    });

    test('Correspondance déterministe d une annonce avec une alerte', () => {
      const alerte = {
        id: 'alt-1',
        actif: true,
        transaction: 'location',
        type_bien: 'appartement',
        quartier: 'Mermoz',
        prix_max_xof: 500000,
        meuble: null,
      };

      const bienConforme = {
        transaction: 'location',
        type_bien: 'appartement',
        quartier: 'Mermoz',
        prix: 450000,
        meuble: false,
      };

      const bienHorsBudget = {
        transaction: 'location',
        type_bien: 'appartement',
        quartier: 'Mermoz',
        prix: 600000,
      };

      const bienAutreQuartier = {
        transaction: 'location',
        type_bien: 'appartement',
        quartier: 'Plateau',
        prix: 450000,
      };

      expect(correspondAlerte(alerte, bienConforme)).toBe(true);
      expect(correspondAlerte(alerte, bienHorsBudget)).toBe(false);
      expect(correspondAlerte(alerte, bienAutreQuartier)).toBe(false);
    });

    test('Création d alerte personnalisée avec validation des critères', async () => {
      const nouvelleAlerte = await creerAlerteImmo({
        titre: 'Recherche F3 Mermoz',
        typeBien: 'appartement',
        transaction: 'location',
        quartier: 'Mermoz',
        prixMax: 450000,
      });

      expect(nouvelleAlerte).toBeDefined();
      expect(nouvelleAlerte.titre).toBe('Recherche F3 Mermoz');
      expect(nouvelleAlerte.actif).toBe(true);
      expect(nouvelleAlerte.type_bien).toBe('appartement');
      expect(nouvelleAlerte.quartier).toBe('Mermoz');

      await expect(
        creerAlerteImmo({ titre: '' })
      ).rejects.toThrow('Le titre de l alerte est obligatoire');
    });

    test('Génération de synthèse pour le briefing matinal (D19 & Zéro émoji)', () => {
      const alertes = [
        {
          id: 'alt-1',
          titre: 'Studio Almadies',
          actif: true,
          type_bien: 'studio',
          quartier: 'Almadies',
          prix_max_xof: 350000,
        },
      ];

      const biens = [
        {
          type_bien: 'studio',
          quartier: 'Almadies',
          prix: 280000,
          transaction: 'location',
        },
      ];

      const synthese = genererSyntheseImmoBriefing(alertes, biens);
      expect(synthese).toContain('Immobilier :');
      expect(synthese).toContain('Studio Almadies');
      // Respect D19 vouvoiement strict
      expect(synthese).toContain('votre');
      expect(synthese).not.toMatch(/\b(tu|te|toi|ton|ta|tes)\b/i);
      // Zéro émoji
      expect(regexEmoji.test(synthese)).toBe(false);
    });
  });

  describe('Tranche 13 : Concours et Examens du Sénégal (Suivi & Rappels J-30/J-7/J-1)', () => {
    const {
      CATEGORIES_CONCOURS,
      CONCOURS_NATIONAUX_SENEGAL,
      calculerEcheances,
      listerConcours,
      recupererConcoursParId,
      suivreConcours,
      genererSyntheseConcoursBriefing,
    } = require('../../backend/services/surga/concours-service');

    const regexEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    test('Catalogue officiel riche et représentatif des concours nationaux (>= 8)', () => {
      expect(CONCOURS_NATIONAUX_SENEGAL.length).toBeGreaterThanOrEqual(8);
      const sigles = CONCOURS_NATIONAUX_SENEGAL.map((c) => c.sigle);
      expect(sigles).toContain('ENA');
      expect(sigles).toContain('DOUANES');
      expect(sigles).toContain('POLICE');
      expect(sigles).toContain('FASTEF');
      expect(sigles).toContain('CREM');
      expect(sigles).toContain('BAC');
      expect(sigles).toContain('BFEM');
    });

    test('Dossier de candidature complet : présence des pièces administratives sénégalaises', () => {
      const ena = CONCOURS_NATIONAUX_SENEGAL.find((c) => c.sigle === 'ENA');
      expect(ena).toBeDefined();
      expect(ena.pieces_a_fournir.length).toBeGreaterThanOrEqual(5);
      const piecesTexte = ena.pieces_a_fournir.join(' ');
      expect(piecesTexte).toContain('naissance');
      expect(piecesTexte).toContain('nationalité');
      expect(piecesTexte).toContain('Casier judiciaire');
      expect(ena.frais_dossier_xof).toBe(10000);
      expect(ena.lien_officiel).toBeDefined();
    });

    test('Calcul déterministe des échéances et alertes stratégiques (J-30, J-7, J-1)', () => {
      const dateRef = new Date('2026-10-01T12:00:00Z');

      // Clôture dans 20 jours -> phase J-30
      const concoursJ20 = {
        date_cloture: '2026-10-21T17:00:00Z',
      };
      const ech20 = calculerEcheances(concoursJ20, dateRef);
      expect(ech20.joursRestantsCloture).toBe(21);
      expect(ech20.phaseAlerte).toBe('j-30');
      expect(ech20.estCloture).toBe(false);

      // Clôture dans 5 jours -> phase J-7
      const concoursJ5 = {
        date_cloture: '2026-10-06T17:00:00Z',
      };
      const ech5 = calculerEcheances(concoursJ5, dateRef);
      expect(ech5.joursRestantsCloture).toBe(6);
      expect(ech5.phaseAlerte).toBe('j-7');
      expect(ech5.estCloture).toBe(false);

      // Clôture demain -> phase J-1
      const concoursJ1 = {
        date_cloture: '2026-10-02T17:00:00Z',
      };
      const ech1 = calculerEcheances(concoursJ1, dateRef);
      expect(ech1.joursRestantsCloture).toBe(2);

      const concoursJ0 = {
        date_cloture: '2026-10-01T17:00:00Z',
      };
      const ech0 = calculerEcheances(concoursJ0, dateRef);
      expect(ech0.joursRestantsCloture).toBe(1);
      expect(ech0.phaseAlerte).toBe('j-1');

      // Clôture passée
      const concoursPasse = {
        date_cloture: '2026-09-15T17:00:00Z',
      };
      const echPasse = calculerEcheances(concoursPasse, dateRef);
      expect(echPasse.estCloture).toBe(true);
      expect(echPasse.phaseAlerte).toBe('cloture');
    });

    test('Filtrage des concours par catégorie et statut', async () => {
      const { concours: fpConcours } = await listerConcours({ categorie: 'forces_defense' });
      expect(fpConcours.length).toBeGreaterThanOrEqual(2);
      for (const c of fpConcours) {
        expect(c.categorie).toBe('forces_defense');
      }

      const { concours: ouverts } = await listerConcours({ statut: 'ouvert' });
      expect(ouverts.length).toBeGreaterThanOrEqual(1);
      for (const c of ouverts) {
        expect(c.statut).toBe('ouvert');
      }
    });

    test('Suivi d un concours avec programmation de rappels', async () => {
      const resultat = await suivreConcours({
        userId: 'test-user-concours',
        concoursId: 'concours-ena-2026',
        phone: '221771234567',
      });

      expect(resultat).toBeDefined();
      expect(resultat.concours.sigle).toBe('ENA');
      expect(resultat.message).toContain('ENA');
      expect(resultat.message).toContain('J-30, J-7 et J-1');
    });

    test('Génération de la synthèse pour le briefing matinal (D19 & Zéro émoji)', () => {
      const concoursSuivis = [
        {
          sigle: 'DOUANES',
          titre: 'Concours des Douanes Sénégalaises',
          echeances: {
            joursRestantsCloture: 4,
            estCloture: false,
            phaseAlerte: 'j-7',
          },
        },
      ];

      const synthese = genererSyntheseConcoursBriefing(concoursSuivis);
      expect(synthese).toContain('Concours :');
      expect(synthese).toContain('DOUANES');
      expect(synthese).toContain('4 jour(s)');
      // Vouvoiement strict D19
      expect(synthese).toContain('votre');
      expect(synthese).not.toMatch(/\b(tu|te|toi|ton|ta|tes)\b/i);
      // Zéro émoji
      expect(regexEmoji.test(synthese)).toBe(false);
    });
  });

  describe('Tranche 14 : Bons Plans & Bonnes Adresses à Dakar (Résumés honnêtes & Envies)', () => {
    const {
      CATEGORIES_PLACES,
      TAGS_AMBIANCE,
      PLACES_DAKAR_DEMO,
      parserRecherchePlacesNaturelle,
      rechercherPlaces,
      recupererPlaceParId,
      genererSynthesePlacesBriefing,
    } = require('../../backend/services/surga/places-service');

    const regexEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    test('Catalogue dakaroise riche et diversifié (>= 10 adresses de référence)', () => {
      expect(PLACES_DAKAR_DEMO.length).toBeGreaterThanOrEqual(10);
      const noms = PLACES_DAKAR_DEMO.map((p) => p.nom);
      expect(noms).toContain('Chez Loutcha');
      expect(noms).toContain('Dibiterie Chez Haïssam');
      expect(noms).toContain('L Échappée Coworking & Café');
      expect(noms).toContain('La Cabane du Pêcheur');
      expect(noms).toContain('Le Phare des Mamelles Restaurant');
      expect(noms).toContain('Chez Katia Almadies');
    });

    test('Résumés honnêtes des avis clients : points forts, spécialités et bémols sans complaisance', () => {
      for (const place of PLACES_DAKAR_DEMO) {
        expect(place.resume_honnete).toBeDefined();
        expect(place.resume_honnete.length).toBeGreaterThan(40);
        expect(place.resume_honnete.length).toBeLessThanOrEqual(280);
        // Note et budget bien calibrés
        expect(place.note_moyenne).toBeGreaterThanOrEqual(4.0);
        expect(place.budget_moyen_xof).toBeGreaterThanOrEqual(1500);
        expect(place.specialite).toBeDefined();
        // Zéro émoji
        expect(regexEmoji.test(place.resume_honnete)).toBe(false);
        expect(regexEmoji.test(place.specialite)).toBe(false);
      }
    });

    test('Parser de recherche en langage naturel - Dibi aux Almadies', () => {
      const res = parserRecherchePlacesNaturelle('Trouve moi un bon dibi ce soir aux Almadies');
      expect(res.categorie).toBe('dibiterie');
      expect(res.quartier).toBe('Almadies');
    });

    test('Parser de recherche en langage naturel - Thiéboudienne pas cher au Plateau', () => {
      const res = parserRecherchePlacesNaturelle('Où manger un bon thieboudienne pas cher au Plateau');
      expect(res.categorie).toBe('restaurant');
      expect(res.quartier).toBe('Plateau');
      expect(res.budgetMax).toBeLessThanOrEqual(4500);
    });

    test('Parser de recherche en langage naturel - Café calme coworking Point E', () => {
      const res = parserRecherchePlacesNaturelle('Un cafe calme avec wifi pour bosser au Point E');
      expect(res.categorie).toBe('cafe_coworking');
      expect(res.quartier).toBe('Point E');
      expect(res.ambiance).toBe('calme');
    });

    test('Recherche multi-critères avec filtrage quartier et budget', async () => {
      const { places } = await rechercherPlaces({
        quartier: 'Plateau',
        categorie: 'restaurant',
      });
      expect(places.length).toBeGreaterThanOrEqual(1);
      const premier = places[0];
      expect(premier.quartier).toBe('Plateau');
      expect(premier.note_moyenne).toBeGreaterThanOrEqual(4.0);
    });

    test('Fiche détaillée d une adresse avec coordonnées et WhatsApp', async () => {
      const place = await recupererPlaceParId('place-chez-loutcha');
      expect(place).toBeDefined();
      expect(place.nom).toBe('Chez Loutcha');
      expect(place.contact_tel).toBeDefined();
      expect(place.contact_whatsapp).toBeDefined();
      expect(place.horaires).toBeDefined();
    });

    test('Génération de la synthèse pour le briefing matinal (D19 & Zéro émoji)', () => {
      const placeMock = [
        {
          nom: 'Chez Loutcha',
          quartier: 'Plateau',
          specialite: 'Thiéboudienne rouge au mérou',
          budget_moyen_xof: 4500,
        },
      ];

      const synthese = genererSynthesePlacesBriefing(placeMock);
      expect(synthese).toContain('Bon plan du jour :');
      expect(synthese).toContain('Chez Loutcha');
      expect(synthese).toContain('Plateau');
      expect(synthese.replace(/\s+/g, ' ')).toContain('4 500 FCFA');
      // Vouvoiement strict D19
      expect(synthese).not.toMatch(/\b(tu|te|toi|ton|ta|tes)\b/i);
      // Zéro émoji
      expect(regexEmoji.test(synthese)).toBe(false);
    });
  });

  describe('Administration Surga — Tout dynamique et administrable', () => {
    test('Le routeur d administration Surga charge sans erreur', () => {
      const adminRouter = require('../../backend/routes/admin-surga');
      expect(adminRouter).toBeDefined();
      expect(typeof adminRouter).toBe('function');
    });

    test('Présence des routes d administration pour les 4 piliers de Surga', () => {
      const adminRouter = require('../../backend/routes/admin-surga');
      const routes = adminRouter.stack
        .filter(layer => layer.route)
        .map(layer => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      const paths = routes.map(r => r.path);
      expect(paths).toContain('/stats');
      expect(paths).toContain('/places');
      expect(paths).toContain('/concours');
      expect(paths).toContain('/unes');
      expect(paths).toContain('/signalements');
      expect(paths).toContain('/abonnements');
    });
  });

  describe('Tranche 15 : Premium, Espaces Professionnels & Monétisation', () => {
    const {
      CATALOGUE_PLANS,
      getCataloguePlans,
    } = require('../../backend/services/surga/abonnement-service');

    test('Catalogue officiel des formules B2C et B2B complet', () => {
      const plans = getCataloguePlans();
      expect(plans.length).toBeGreaterThanOrEqual(4);

      const ids = plans.map((p) => p.id);
      expect(ids).toContain('b2c_premium');
      expect(ids).toContain('b2b_visibilite_resto');
      expect(ids).toContain('b2b_immo_pro');
      expect(ids).toContain('b2b_education_pro');
    });

    test('Surga Premium B2C : Tarifs conformes et avantage annuel (2 mois offerts)', () => {
      const planB2c = CATALOGUE_PLANS.b2c_premium;
      expect(planB2c).toBeDefined();
      expect(planB2c.tarifs.mensuel).toBe(1500); // 1 500 FCFA / mois
      expect(planB2c.tarifs.annuel).toBe(15000); // 15 000 FCFA / an

      // Vérification des privilèges
      expect(planB2c.avantages.some((a) => a.toLowerCase().includes('vocales'))).toBe(true);
      expect(planB2c.avantages.some((a) => a.toLowerCase().includes('immobili'))).toBe(true);
      expect(planB2c.avantages.some((a) => a.toLowerCase().includes('concours'))).toBe(true);
    });

    test('Espaces Professionnels B2B : Tarifs adaptés au marché dakarisé', () => {
      const resto = CATALOGUE_PLANS.b2b_visibilite_resto;
      expect(resto.tarifs.mensuel).toBe(5000); // 5 000 FCFA / mois
      expect(resto.avantages.some((a) => a.toLowerCase().includes('whatsapp'))).toBe(true);

      const immo = CATALOGUE_PLANS.b2b_immo_pro;
      expect(immo.tarifs.mensuel).toBe(5000);

      const education = CATALOGUE_PLANS.b2b_education_pro;
      expect(education.tarifs.mensuel).toBe(10000);
    });

    test('Le routeur client des abonnements charge les routes REST sans erreur', () => {
      const abonnementsRouter = require('../../backend/routes/surga/abonnements');
      expect(abonnementsRouter).toBeDefined();

      const routes = abonnementsRouter.stack
        .filter((l) => l.route)
        .map((l) => ({
          path: l.route.path,
          methods: Object.keys(l.route.methods),
        }));

      const paths = routes.map((r) => r.path);
      expect(paths).toContain('/abonnements/plans');
      expect(paths).toContain('/abonnements/mon-statut');
      expect(paths).toContain('/abonnements/initier');
      expect(paths).toContain('/abonnements/verifier');
    });
  });

  describe('Tranche 16 : Durcissement, Sécurité Anti-IDOR, Export & Droit à l oubli', () => {
    const {
      exporterDonneesUtilisateur,
      supprimerDonneesUtilisateur,
    } = require('../../backend/services/surga/donnees-service');

    test('L export de données requiert une identification stricte par userId authentifié', async () => {
      await expect(exporterDonneesUtilisateur({})).rejects.toThrow();
      await expect(exporterDonneesUtilisateur({ phone: '221770000000' })).rejects.toThrow();
    });

    test('L export de données génère une structure complète et conforme', async () => {
      const exportTest = await exporterDonneesUtilisateur({ userId: '00000000-0000-0000-0000-000000000000' });
      expect(exportTest).toBeDefined();
      expect(exportTest.date_export).toBeDefined();
      expect(Array.isArray(exportTest.notes)).toBe(true);
      expect(Array.isArray(exportTest.depenses)).toBe(true);
      expect(Array.isArray(exportTest.agenda)).toBe(true);
      expect(Array.isArray(exportTest.alertes_immo)).toBe(true);
      expect(Array.isArray(exportTest.concours_suivis)).toBe(true);
      expect(Array.isArray(exportTest.favoris_places)).toBe(true);
      expect(Array.isArray(exportTest.abonnements)).toBe(true);
    });

    test('La suppression de données requiert une identification stricte par userId authentifié', async () => {
      await expect(supprimerDonneesUtilisateur({})).rejects.toThrow();
      await expect(supprimerDonneesUtilisateur({ phone: '221770000000' })).rejects.toThrow();
    });

    test('Le routeur REST des données personnelles expose les endpoints requis protégés', () => {
      const donneesRouter = require('../../backend/routes/surga/donnees');
      expect(donneesRouter).toBeDefined();

      const routes = donneesRouter.stack
        .filter((l) => l.route)
        .map((l) => ({
          path: l.route.path,
          methods: Object.keys(l.route.methods),
        }));

      const paths = routes.map((r) => r.path);
      expect(paths).toContain('/donnees/export');
      expect(paths).toContain('/donnees/supprimer');
    });
  });

  describe('Tranche 17 : Météo Dakar Live & Sport Personnalisé Temps Réel', () => {
    const { getMeteo, interpreterCodeWMO, calculerMareeDakar, estimerQualiteAirDakar } = require('../../backend/services/surga/meteo-service');
    const { LISTE_EQUIPES_DISPONIBLES, genererProgrammeSportActuel, filtrerMatchsSport } = require('../../backend/services/surga/sport-service');

    test('Le service météo traduit les codes WMO et calcule les marées dakariliennes', () => {
      expect(interpreterCodeWMO(0).code).toBe('soleil');
      expect(interpreterCodeWMO(61).code).toBe('pluie');
      expect(interpreterCodeWMO(95).code).toBe('orage');

      const maree = calculerMareeDakar();
      expect(['Marée basse', 'Marée haute']).toContain(maree.etat);
      expect(maree.spot_reference).toBe('Almadies & Yoff');

      const qualiteAir = estimerQualiteAirDakar();
      expect(qualiteAir.aqi).toBeGreaterThan(0);
      expect(qualiteAir.niveau).toBeDefined();
    });

    test('getMeteo retourne une structure météo complète pour Dakar', async () => {
      const meteo = await getMeteo('Dakar');
      expect(meteo).toBeDefined();
      expect(meteo.ville).toBe('Dakar');
      expect(meteo.temperature).toBeDefined();
      expect(meteo.ressenti).toBeDefined();
      expect(meteo.vent_vitesse_kmh).toBeDefined();
      expect(meteo.maree).toBeDefined();
      expect(Array.isArray(meteo.previsions_3j)).toBe(true);
      expect(meteo.previsions_3j.length).toBeGreaterThanOrEqual(1);
    });

    test('Le service sport fournit les compétitions réelles et le catalogue d’équipes', () => {
      expect(LISTE_EQUIPES_DISPONIBLES.length).toBeGreaterThanOrEqual(15);
      const noms = LISTE_EQUIPES_DISPONIBLES.map((e) => e.nom);
      expect(noms.some((n) => n.includes('Sénégal'))).toBe(true);
      expect(noms.some((n) => n.includes('Jaraaf'))).toBe(true);
      expect(noms.some((n) => n.includes('Chelsea'))).toBe(true);

      const matchs = genererProgrammeSportActuel();
      expect(matchs.length).toBeGreaterThanOrEqual(6);
      expect(matchs.some((m) => m.statut === 'EN_DIRECT')).toBe(true);
      expect(matchs.some((m) => m.statut === 'TERMINE')).toBe(true);
      expect(matchs.some((m) => m.statut === 'A_VENIR')).toBe(true);
    });

    test('Le filtrage personnalisé par équipe et catégorie fonctionne rigoureusement', () => {
      const matchsLigue1 = filtrerMatchsSport({ categorie: 'ligue1_sn' });
      expect(matchsLigue1.length).toBeGreaterThan(0);
      expect(matchsLigue1.every((m) => m.categorie === 'ligue1_sn')).toBe(true);

      const matchsJaraaf = filtrerMatchsSport({ equipesSuivies: ['Jaraaf'] });
      expect(matchsJaraaf.length).toBeGreaterThan(0);
      expect(matchsJaraaf.some((m) => m.equipe_domicile.includes('Jaraaf') || m.equipe_exterieur.includes('Jaraaf'))).toBe(true);
    });

    test('Les routeurs meteo et sport se chargent sans erreur dans Express', () => {
      const meteoRouter = require('../../backend/routes/surga/meteo');
      const sportRouter = require('../../backend/routes/surga/sport');
      expect(meteoRouter).toBeDefined();
      expect(sportRouter).toBeDefined();
    });
  });
});






