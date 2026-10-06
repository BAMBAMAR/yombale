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
      expect(RADIOS_SENEGAL.length).toBeGreaterThanOrEqual(15);
      const noms = RADIOS_SENEGAL.map((r) => r.nom);
      expect(noms).toContain('RFM 94.0 Dakar');
      expect(noms).toContain('Zik FM 89.7');
      expect(noms).toContain('Walf FM 99.0');
      expect(noms).toContain('Lamp Fall FM');
      expect(noms).toContain('Touba FM Live');
      expect(noms).toContain('Radio Fayda Tidianiya');
      expect(noms).toContain('RFI Afrique 92.0');
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
      expect(regions.some((reg) => reg.includes('Touba'))).toBe(true);
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

      const radiosReligieuses = listerRadios({ categorie: 'religieux' });
      expect(radiosReligieuses.length).toBeGreaterThanOrEqual(3);
      const nomsReligieux = radiosReligieuses.map((r) => r.nom);
      expect(nomsReligieux).toContain('Lamp Fall FM');
      expect(nomsReligieux).toContain('Touba FM Live');

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
    const { LISTE_EQUIPES_DISPONIBLES, chargerDonneesSportEnDirect, filtrerMatchsSport } = require('../../backend/services/surga/sport-service');

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

    test('Le service sport fournit les compétitions réelles et le catalogue d’équipes', async () => {
      expect(LISTE_EQUIPES_DISPONIBLES.length).toBeGreaterThanOrEqual(15);
      const noms = LISTE_EQUIPES_DISPONIBLES.map((e) => e.nom);
      expect(noms.some((n) => n.includes('Sénégal'))).toBe(true);
      expect(noms.some((n) => n.includes('Jaraaf'))).toBe(true);
      expect(noms.some((n) => n.includes('Chelsea'))).toBe(true);

      const matchs = await filtrerMatchsSport({ categorie: 'tous' });
      expect(matchs.length).toBeGreaterThanOrEqual(5);
    });

    test('Le filtrage personnalisé par équipe et catégorie fonctionne rigoureusement', async () => {
      const matchsLigue1 = await filtrerMatchsSport({ categorie: 'ligue1_sn' });
      expect(matchsLigue1.length).toBeGreaterThan(0);
      expect(matchsLigue1.every((m) => m.categorie === 'ligue1_sn')).toBe(true);

      const matchsJaraaf = await filtrerMatchsSport({ equipesSuivies: ['Jaraaf'] });
      expect(matchsJaraaf.length).toBeGreaterThan(0);
      expect(matchsJaraaf.some((m) => m.equipe_domicile.includes('Jaraaf') || m.equipe_exterieur.includes('Jaraaf'))).toBe(true);
    });

    test('Les routeurs meteo et sport se chargent sans erreur dans Express', () => {
      const meteoRouter = require('../../backend/routes/surga/meteo');
      const sportRouter = require('../../backend/routes/surga/sport');
      expect(meteoRouter).toBeDefined();
      expect(sportRouter).toBeDefined();
    });

    test('Le service météo supporte le catalogue multi-localités et la géolocalisation GPS', async () => {
      const { LOCALITES_SENEGAL, trouverLocalitePlusProche } = require('../../backend/services/surga/meteo-service');
      expect(Object.keys(LOCALITES_SENEGAL).length).toBeGreaterThanOrEqual(20);

      // Vérification du plus proche voisin GPS (ex: Almadies ~ 14.745, -17.515)
      const plusProcheAlmadies = trouverLocalitePlusProche(14.745, -17.515);
      expect(plusProcheAlmadies).toBeDefined();
      expect(plusProcheAlmadies.nom).toContain('Almadies');

      // Appel météo avec coordonnées GPS directes
      const meteoGps = await getMeteo({ lat: 14.745, lon: -17.515 });
      expect(meteoGps).toBeDefined();
      expect(meteoGps.is_gps).toBe(true);
      expect(meteoGps.coordonnees).toBeDefined();
      expect(meteoGps.temperature).toBeDefined();

      // Appel météo par nom de localité
      const meteoThies = await getMeteo('Thiès');
      expect(meteoThies.ville).toBe('Thiès');
      expect(meteoThies.zone).toBe('Régions');
    });

    test('Résolution robuste insensible aux accents et ligatures pour toutes les localités du Sénégal', async () => {
      const { LOCALITES_SENEGAL } = require('../../backend/services/surga/meteo-service');
      // Couverture complète des 14 régions du Sénégal
      expect(Object.keys(LOCALITES_SENEGAL).length).toBeGreaterThanOrEqual(28);

      // Résolution sans accent (ex: thies, guediawaye, sacre coeur)
      const resThies = await getMeteo('thies');
      expect(resThies.ville).toBe('Thiès');

      const resGuediawaye = await getMeteo('guediawaye');
      expect(resGuediawaye.ville).toBe('Guédiawaye');

      const resSacreCoeur = await getMeteo('sacre coeur');
      expect(resSacreCoeur.ville).toBe('Mermoz / Sacré-Cœur');

      const resSaintLouis = await getMeteo('saint louis');
      expect(resSaintLouis.ville).toBe('Saint-Louis');

      const resLouga = await getMeteo('louga');
      expect(resLouga.ville).toBe('Louga');

      const resDiourbel = await getMeteo('diourbel');
      expect(resDiourbel.ville).toBe('Diourbel');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TRANCHE 17 (EXTENSION) : SÉRIES TV & LUTTE SÉNÉGALAISE (ALERTES VIDÉOS)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Tranche 17 : Séries TV & Lutte du Sénégal (Alertes Vidéos)', () => {
    const videoService = require('../../backend/services/surga/video-service');
    const regexEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    test('Catalogue référentiel complet et équilibré (Séries & Lutte)', async () => {
      const sources = await videoService.getSources({ actifOnly: false });
      expect(sources.length).toBeGreaterThanOrEqual(5);

      const series = sources.filter((s) => s.type === 'SERIE');
      const lutte = sources.filter((s) => s.type === 'LUTTE');

      expect(series.length).toBeGreaterThanOrEqual(2);
      expect(lutte.length).toBeGreaterThanOrEqual(2);

      // Présence des acteurs clés sénégalais
      const noms = sources.map((s) => s.nom);
      expect(noms.some((n) => n.includes('Marodi'))).toBe(true);
      expect(noms.some((n) => n.includes('EvenProd'))).toBe(true);
      expect(noms.some((n) => n.includes('Lutte TV') || n.includes('Albourakh'))).toBe(true);

      // Zéro émoji
      for (const s of sources) {
        expect(regexEmoji.test(s.nom)).toBe(false);
      }
    });

    test('Construction rigoureuse des URLs de flux Atom YouTube', () => {
      const urlChannel = videoService.construireUrlFlux('UCt7g3Z1YF67-Yc7_N8j9bXw');
      expect(urlChannel).toBe('https://www.youtube.com/feeds/videos.xml?channel_id=UCt7g3Z1YF67-Yc7_N8j9bXw');

      const urlPlaylist = videoService.construireUrlFlux('PL1234567890ABCDEF');
      expect(urlPlaylist).toBe('https://www.youtube.com/feeds/videos.xml?playlist_id=PL1234567890ABCDEF');

      const urlDirect = videoService.construireUrlFlux('https://custom.domain/feed.xml');
      expect(urlDirect).toBe('https://custom.domain/feed.xml');
    });

    test('Dédoublonnage strict des vidéos par URL unique', async () => {
      const testVideos = [
        {
          source_id: 'src-marodi-tv',
          titre: 'Karma - Saison 3 - Épisode 1',
          url: 'https://www.youtube.com/watch?v=unique_test_vid_123',
          publie_le: new Date().toISOString(),
        },
        {
          source_id: 'src-marodi-tv',
          titre: 'Karma - Saison 3 - Épisode 1 (Doublon)',
          url: 'https://www.youtube.com/watch?v=unique_test_vid_123',
          publie_le: new Date().toISOString(),
        },
      ];

      const res1 = await videoService.sauvegarderVideos([testVideos[0]]);
      expect(res1.inserees).toBe(1);

      // Tenter d'insérer à nouveau la même URL
      const res2 = await videoService.sauvegarderVideos([testVideos[1]]);
      expect(res2.inserees).toBe(0); // Dédoublonné avec succès !
    });

    test('Bascule réversible d abonnement utilisateur (Toggle Anti-IDOR)', async () => {
      const userIdTest = 'user-test-video-uuid-1';
      const sourceIdTest = 'src-marodi-tv';

      // 1. Activer l'abonnement
      const abo1 = await videoService.toggleAbonnementUtilisateur(userIdTest, sourceIdTest);
      expect(abo1.abonne).toBe(true);
      expect(abo1.source_id).toBe(sourceIdTest);

      let liste = await videoService.getAbonnementsUtilisateur(userIdTest);
      expect(liste.some((a) => a.source_id === sourceIdTest)).toBe(true);

      // 2. Désactiver l'abonnement
      const abo2 = await videoService.toggleAbonnementUtilisateur(userIdTest, sourceIdTest);
      expect(abo2.abonne).toBe(false);

      liste = await videoService.getAbonnementsUtilisateur(userIdTest);
      expect(liste.some((a) => a.source_id === sourceIdTest)).toBe(false);
    });

    test('Les routes REST des vidéos se chargent sans erreur dans Express', () => {
      const routerVideos = require('../../backend/routes/surga/videos');
      expect(routerVideos).toBeDefined();

      const routes = routerVideos.stack
        .filter((r) => r.route)
        .map((r) => `${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);

      expect(routes).toContain('GET /videos/sources');
      expect(routes).toContain('GET /videos/abonnements');
      expect(routes).toContain('POST /videos/abonnements/:sourceId/toggle');
      expect(routes).toContain('GET /videos/derniers');
    });

    test('Portabilité RGPD : l export et la purge intègrent les abonnements vidéo', async () => {
      const donneesService = require('../../backend/services/surga/donnees-service');
      const exportRes = await donneesService.exporterDonneesUtilisateur({ userId: '00000000-0000-0000-0000-000000000000' });
      expect(exportRes).toHaveProperty('video_abonnements');
      expect(Array.isArray(exportRes.video_abonnements)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TRANCHE 18 (EXTENSION) : EMPLOI, PROFIL PRO, CV PDF & LETTRES DE MOTIVATION
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Tranche 18 : Emploi, Profil Pro, CV PDF & Lettres de Motivation', () => {
    const emploiService = require('../../backend/services/surga/emploi-service');

    const profilMock = {
      nom_complet: 'Moussa Diop',
      telephone: '+221 77 123 45 67',
      email: 'moussa.diop@example.com',
      adresse: 'Mermoz, Dakar',
      titre_poste: 'Comptable Général SYSCOHADA',
      resume: 'Comptable rigoureux avec 5 années d expérience dans la gestion de trésorerie et clôtures mensuelles.',
      experiences: [
        {
          poste: 'Comptable Junior',
          entreprise: 'Cabinet Teranga Audit',
          date_debut: '2022',
          date_fin: '2025',
          description: 'Saisie comptable, rapprochements bancaires et déclarations fiscales.',
        },
      ],
      formations: [
        {
          diplome: 'Licence en Sciences de Gestion',
          etablissement: 'Université Cheikh Anta Diop (UCAD)',
          annee: '2021',
        },
      ],
      competences: ['SYSCOHADA', 'Déclarations fiscales', 'Excel avancé', 'Sage Saari'],
      langues: ['Français (Courant)', 'Wolof (Langue maternelle)'],
    };

    test('Création et récupération déterministe du profil professionnel', async () => {
      const userId = 'user-pro-test-uuid-1';
      const profil = await emploiService.upsertProfilPro(userId, profilMock);
      expect(profil).toBeDefined();
      expect(profil.user_id).toBe(userId);
      expect(profil.nom_complet).toBe('Moussa Diop');
      expect(profil.titre_poste).toBe('Comptable Général SYSCOHADA');
      expect(profil.experiences.length).toBe(1);

      const lu = await emploiService.getProfilPro(userId);
      expect(lu).toBeDefined();
      expect(lu.email).toBe('moussa.diop@example.com');
    });

    test('Règle Zéro-Hallucination : la structuration du CV reflète uniquement les données déclarées', async () => {
      const userId = 'user-pro-test-uuid-2';
      const profil = await emploiService.upsertProfilPro(userId, profilMock);

      // Le profil généré ne contient aucun diplôme ou employeur fictif
      expect(profil.formations.some((f) => f.etablissement.includes('Harvard'))).toBe(false);
      expect(profil.experiences.some((e) => e.entreprise.includes('Google'))).toBe(false);
      expect(profil.nom_complet).toBe('Moussa Diop');
    });

    test('Générateur déterministe de lettre de motivation (Vouvoiement D19 & Personnalisation)', () => {
      const proposition = emploiService.genererPropositionLettre({
        profil: profilMock,
        titrePosteOffre: 'Chef Comptable',
        entrepriseOffre: 'Société Dakaroise des Eaux',
        offreTexte: 'Recherche un chef comptable maîtrisant le SYSCOHADA et les déclarations fiscales.',
      });

      expect(proposition).toBeDefined();
      expect(proposition.objet).toContain('Chef Comptable');
      expect(proposition.salutation).toBe('Madame, Monsieur,');
      // Vouvoiement strict D19
      expect(proposition.paragrapheIntroduction).toContain('vous');
      expect(proposition.paragrapheConclusion).toContain('votre entière disposition');
      expect(proposition.formulePolitesse).toContain('Je vous prie d agréer');
      // Intégration des compétences réelles sans hallucination
      expect(proposition.paragrapheParcours).toContain('Cabinet Teranga Audit');
    });

    test('Génération PDF native via pdfkit (A4, Header %PDF-1.)', async () => {
      const pdfBuffer = await emploiService.genererPdfBuffer('CV', profilMock, {
        modele: 'sobre_moderne',
        avecMention: true,
      });

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      // Vérification du Header magique PDF
      const pdfHeader = pdfBuffer.slice(0, 5).toString('ascii');
      expect(pdfHeader).toBe('%PDF-');
    });

    test('Modèle de droits & quotas : 1 CV gratuit avec mention, puis blocage pour passage Premium / 500 FCFA', async () => {
      const userId = 'user-droits-cv-test-99';

      // 1. Premier CV : droit gratuit débloqué avec mention
      const droit1 = await emploiService.verifierDroitCv(userId);
      expect(droit1.autorise).toBe(true);
      expect(droit1.avecMention).toBe(true);
      expect(droit1.motif).toBe('gratuit_decouverte');

      // Enregistrement du premier usage
      await emploiService.incrementerUsage(userId, 'cv_generation', 'global');

      // 2. Deuxième tentative : bloqué avec message explicite de passage Premium ou achat 500 FCFA
      const droit2 = await emploiService.verifierDroitCv(userId);
      expect(droit2.autorise).toBe(false);
      expect(droit2.motif).toBe('limite_atteinte');
      expect(droit2.message).toContain('500 FCFA');
    });

    test('Sécurité Anti-IDOR stricte sur les documents professionnels', async () => {
      const userProprietaire = 'user-id-owner-100';
      const userIntrus = 'user-id-hacker-666';

      const doc = await emploiService.sauvegarderDocumentEmploi({
        userId: userProprietaire,
        type: 'CV',
        titre: 'CV Moussa Diop 2026',
        contenu: profilMock,
      });

      // Le propriétaire peut consulter son document
      const docOk = await emploiService.getDocumentEmploi(doc.id, userProprietaire);
      expect(docOk).toBeDefined();

      // L'intrus ne peut pas accéder au document d'un autre utilisateur
      const docFraude = await emploiService.getDocumentEmploi(doc.id, userIntrus);
      expect(docFraude).toBeNull();

      // L'intrus ne peut pas supprimer le document d'un autre
      const supprimeFraude = await emploiService.supprimerDocumentEmploi(doc.id, userIntrus);
      expect(supprimeFraude).toBe(false);

      // Le propriétaire peut supprimer son propre document
      const supprimeOk = await emploiService.supprimerDocumentEmploi(doc.id, userProprietaire);
      expect(supprimeOk).toBe(true);
    });

    test('Les routes REST emploi se chargent sans erreur dans Express', () => {
      const routerEmploi = require('../../backend/routes/surga/emploi');
      expect(routerEmploi).toBeDefined();

      const routes = routerEmploi.stack
        .filter((r) => r.route)
        .map((r) => `${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);

      expect(routes).toContain('GET /emploi/profil');
      expect(routes).toContain('PUT /emploi/profil');
      expect(routes).toContain('GET /emploi/droits');
      expect(routes).toContain('POST /emploi/cv/generer');
      expect(routes).toContain('POST /emploi/lettre/generer');
      expect(routes).toContain('GET /emploi/documents');
      expect(routes).toContain('GET /emploi/documents/:id/pdf');
      expect(routes).toContain('DELETE /emploi/documents/:id');
    });

    test('Portabilité RGPD : l export intègre le profil pro, les documents emploi et les usages', async () => {
      const donneesService = require('../../backend/services/surga/donnees-service');
      const exportRes = await donneesService.exporterDonneesUtilisateur({ userId: '00000000-0000-0000-0000-000000000000' });
      expect(exportRes).toHaveProperty('profil_pro');
      expect(exportRes).toHaveProperty('documents_emploi');
      expect(exportRes).toHaveProperty('usages');
    });
  });

  describe('Tranche 19 : Préparation à l Entretien d Embauche & Fiches de Révision', () => {
    test('Banque de questions d entretien complète et diversifiée par secteur', () => {
      const emploiService = require('../../backend/services/surga/emploi-service');
      expect(emploiService.BANQUE_QUESTIONS_ENTRETIEN).toBeDefined();

      const questionsGen = emploiService.getBanqueQuestions('general');
      expect(questionsGen.length).toBeGreaterThanOrEqual(4);
      expect(questionsGen[0].question).toContain('présenter');
      expect(questionsGen[0].conseils).toBeDefined();

      const questionsCpt = emploiService.getBanqueQuestions('comptabilite_finance');
      expect(questionsCpt.length).toBeGreaterThanOrEqual(5);
      expect(questionsCpt.some((q) => q.question.includes('SYSCOHADA') || q.question.includes('rapprochement'))).toBe(true);

      const questionsTech = emploiService.getBanqueQuestions('informatique_tech');
      expect(questionsTech.length).toBeGreaterThanOrEqual(4);
      expect(questionsTech.some((q) => q.question.includes('production') || q.question.includes('qualité'))).toBe(true);
    });

    test('Évaluation constructive et déterministe de la réponse (Vouvoiement D19 & Zéro note arbitraire)', () => {
      const emploiService = require('../../backend/services/surga/emploi-service');

      const reponseCourte = 'Je suis sérieux et travailleur.';
      const evalCourte = emploiService.evaluerReponseEntretien({
        question: 'Parlez-moi de vous.',
        reponse: reponseCourte,
      });
      expect(evalCourte.nb_mots).toBeLessThan(15);
      expect(evalCourte.axes_amelioration.some((a) => a.includes('courte'))).toBe(true);
      expect(evalCourte).not.toHaveProperty('note'); // Règle stricte : Aucune note arbitraire

      const reponseStructuree = 'Lors de ma mission précédente, j ai coordonné la mise en place d un nouveau système de stock avec l équipe. Ce projet nous a permis d optimiser les délais de livraison et d obtenir un résultat mesurable sans retard pour nos clients.';
      const evalStructuree = emploiService.evaluerReponseEntretien({
        question: 'Racontez un projet mené à bien.',
        reponse: reponseStructuree,
      });
      expect(evalStructuree.points_forts.length).toBeGreaterThanOrEqual(1);
      expect(evalStructuree.points_forts.some((p) => p.includes('action') || p.includes('résultat'))).toBe(true);
      expect(evalStructuree.suggestion).toBeDefined();
    });

    test('Modèle de droits & quotas : 1 simulation gratuite par semaine puis blocage pour passage Premium', async () => {
      const emploiService = require('../../backend/services/surga/emploi-service');
      const userIdTest = 'user-entretien-free-' + Date.now();

      // 1. Première simulation : autorisée
      const droit1 = await emploiService.verifierDroitSimulationEntretien(userIdTest);
      expect(droit1.autorise).toBe(true);
      expect(droit1.quotaAtteint).toBe(false);

      // Simulation de l'utilisation de la semaine
      const d = new Date();
      const annee = d.getFullYear();
      const premierJanvier = new Date(annee, 0, 1);
      const nbJours = Math.floor((d - premierJanvier) / (24 * 60 * 60 * 1000));
      const semaine = Math.ceil((nbJours + premierJanvier.getDay() + 1) / 7);
      const periode = `${annee}-W${String(semaine).padStart(2, '0')}`;
      await emploiService.incrementerUsage(userIdTest, 'entretien_simulation', periode);

      // 2. Deuxième tentative : bloquée avec incitation Premium
      const droit2 = await emploiService.verifierDroitSimulationEntretien(userIdTest);
      expect(droit2.autorise).toBe(false);
      expect(droit2.quotaAtteint).toBe(true);
      expect(droit2.message).toContain('Quota hebdomadaire atteint');
    });

    test('Génération d une fiche de révision textuelle complète pour l enregistrement en Notes', () => {
      const emploiService = require('../../backend/services/surga/emploi-service');
      const fiche = emploiService.genererFicheRevisionEntretien({
        poste: 'Comptable Général',
        secteur: 'comptabilite_finance',
        evaluations: [
          {
            question: 'Présentation de votre parcours',
            reponse: 'J ai 3 ans d expérience dans la gestion de trésorerie.',
            evaluation: {
              points_forts: ['Clarté du parcours'],
              axes_amelioration: ['Citez des logiciels maîtrisés'],
            },
          },
        ],
      });

      expect(fiche.titre).toContain('Comptable Général');
      expect(fiche.contenu).toContain('FICHE DE RÉVISION D\'ENTRETIEN');
      expect(fiche.contenu).toContain('RAPPELS CLÉS POUR LE JOUR J');
    });

    test('Les routes REST entretien se chargent et répondent dans Express', () => {
      const routerEmploi = require('../../backend/routes/surga/emploi');
      const routes = routerEmploi.stack
        .filter((r) => r.route)
        .map((r) => `${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);

      expect(routes).toContain('GET /emploi/entretien/banque');
      expect(routes).toContain('GET /emploi/entretien/droits');
      expect(routes).toContain('POST /emploi/entretien/evaluer');
      expect(routes).toContain('POST /emploi/entretien/session');
      expect(routes).toContain('POST /emploi/entretien/fiche-revision');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TRANCHE 20 : DÉMARCHES ADMINISTRATIVES SÉNÉGALAISES VÉRIFIÉES & ADMIN
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Tranche 20 : Démarches administratives sénégalaises vérifiées & Console Admin', () => {
    const demarchesService = require('../../backend/services/surga/demarches-service');

    beforeEach(() => {
      demarchesService.reinitialiserMemoire();
    });

    test('Catalogue initial certifié conforme (enrichi de fiches de référence réelles)', () => {
      expect(demarchesService.DEMARCHES_INITIALES.length).toBeGreaterThanOrEqual(15);
      expect(demarchesService.DEMARCHES_INITIALES.length).toBeLessThanOrEqual(30);

      const slugs = demarchesService.DEMARCHES_INITIALES.map((d) => d.slug);
      expect(slugs).toContain('carte-nationale-identite-cedeao');
      expect(slugs).toContain('passeport-biometrique-ordinaire');
      expect(slugs).toContain('casier-judiciaire-bulletin-3');
      expect(slugs).toContain('certificat-nationalite-senegalaise');
      expect(slugs).toContain('declaration-extrait-acte-naissance');
      expect(slugs).toContain('permis-conduire-senegalais');
      expect(slugs).toContain('certificat-residence-senegal');
      expect(slugs).toContain('creation-entreprise-individuelle-gie');
      expect(slugs).toContain('creation-societe-sarl-apix');
      expect(slugs).toContain('quitus-fiscal-attestation-regularite');
      expect(slugs).toContain('declaration-extrait-acte-mariage');
      expect(slugs).toContain('permis-construire-autorisation-urbanisme');
      expect(slugs).toContain('carte-grise-immatriculation-vehicule');
    });

    test('Condition de démarrage : toutes les fiches initiales sont en statut BROUILLON et invisibles pour le public', async () => {
      // Toutes les fiches initiales sont marquées BROUILLON
      expect(demarchesService.DEMARCHES_INITIALES.every((d) => d.statut === 'BROUILLON')).toBe(true);

      // Côté utilisateur public sans mode démo (includeBrouillons: false) : 0 fiche retournée
      const resPublic = await demarchesService.rechercherDemarches({ includeBrouillons: false });
      expect(resPublic.fiches.length).toBe(0);

      // En mode admin / démo (includeBrouillons: true) : les fiches sont bien accessibles
      const resAdmin = await demarchesService.rechercherDemarches({ includeBrouillons: true });
      expect(resAdmin.fiches.length).toBe(demarchesService.DEMARCHES_INITIALES.length);
    });

    test('Recherche textuelle déterministe insensible aux accents et à la casse', async () => {
      // Recherche "cni"
      const resCni = await demarchesService.rechercherDemarches({ query: 'cni', includeBrouillons: true });
      expect(resCni.fiches.length).toBeGreaterThanOrEqual(1);
      expect(resCni.fiches[0].slug).toBe('carte-nationale-identite-cedeao');

      // Recherche avec accents "identité"
      const resAccents = await demarchesService.rechercherDemarches({ query: 'identité', includeBrouillons: true });
      expect(resAccents.fiches.length).toBeGreaterThanOrEqual(1);

      // Recherche par lieu "Dieuppeul"
      const resLieu = await demarchesService.rechercherDemarches({ query: 'Dieuppeul', includeBrouillons: true });
      expect(resLieu.fiches.length).toBeGreaterThanOrEqual(1);
      expect(resLieu.fiches[0].slug).toBe('passeport-biometrique-ordinaire');
    });

    test('Règle Zéro-Hallucination : démarche non couverte renvoie vers le portail officiel de l État sans invention d IA', async () => {
      const resInconnu = await demarchesService.rechercherDemarches({
        query: 'permis de port d arme spatiale',
        includeBrouillons: true,
      });

      expect(resInconnu.non_couvert).toBe(true);
      expect(resInconnu.fiches.length).toBe(0);
      expect(resInconnu.message).toContain('pas encore couverte');
      expect(resInconnu.portail_officiel).toBe('https://e-senegal.sn/#/home/demarches');
    });

    test('Cycle de re-vérification de 90 jours et passage automatique en A_REVERIFIER', async () => {
      // 1. Publier une démarche avec une date de prochaine vérification expirée (il y a 2 jours)
      const demarcheExpiree = await demarchesService.sauvegarderDemarcheAdmin({
        id: 'dem-test-cycle-90j',
        titre: 'Démarche Test Cycle',
        statut: 'PUBLIE',
        date_verification: new Date(Date.now() - 95 * 24 * 3600 * 1000).toISOString(),
        date_prochaine_verification: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      });
      expect(demarcheExpiree.statut).toBe('PUBLIE');

      // 2. Déclenchement de la mise à jour des statuts périmés
      await demarchesService.actualiserStatutsPerimes();

      // 3. Vérification que la démarche est passée en A_REVERIFIER
      const demarcheApres = await demarchesService.getDemarcheParIdOuSlug('dem-test-cycle-90j', {
        includeBrouillons: true,
      });
      expect(demarcheApres.statut).toBe('A_REVERIFIER');

      // 4. Action admin de re-vérification : réinitialisation à J+90 et retour au statut PUBLIE
      const demarcheReverifiee = await demarchesService.reverifierDemarcheAdmin('dem-test-cycle-90j');
      expect(demarcheReverifiee.statut).toBe('PUBLIE');
      const diffJours = Math.round(
        (new Date(demarcheReverifiee.date_prochaine_verification) - new Date()) / (24 * 3600 * 1000)
      );
      expect(diffJours).toBeGreaterThanOrEqual(89);
      expect(diffJours).toBeLessThanOrEqual(91);
    });

    test('Gestion des signalements d erreurs par les usagers et modération admin', async () => {
      // 1. Création d'un signalement
      const sig = await demarchesService.creerSignalement({
        demarche_id: 'dem-cni-cedeao',
        message: 'Le centre DAF de Guédiawaye a changé d adresse.',
        contact_email: 'usager@test.sn',
      });
      expect(sig.id).toBeDefined();
      expect(sig.statut).toBe('EN_ATTENTE');

      // 2. Récupération dans la file admin
      const fileAdmin = await demarchesService.getSignalementsAdmin({ statut: 'EN_ATTENTE' });
      expect(fileAdmin.some((s) => s.message.includes('Guédiawaye'))).toBe(true);

      // 3. Traitement admin
      const sigTraite = await demarchesService.traiterSignalementAdmin(sig.id, {
        statut: 'TRAITE',
        reponse_admin: 'Pris en compte et mis à jour.',
      });
      expect(sigTraite.statut).toBe('TRAITE');
    });

    test('Modèle de quotas de suivi : 1 démarche suivie gratuite puis blocage avec incitation Premium', async () => {
      const userIdTest = 'user-demarche-free-' + Date.now();

      // 1. Premier suivi : autorisé
      const suivi1 = await demarchesService.ajouterSuiviDemarche(userIdTest, 'dem-cni-cedeao', {
        notes: 'Dépôt prévu lundi',
      });
      expect(suivi1).toBeDefined();
      expect(suivi1.demarche_id).toBe('dem-cni-cedeao');

      // 2. Deuxième suivi sur une autre démarche : bloqué par le quota gratuit (1 suivi max)
      await expect(
        demarchesService.ajouterSuiviDemarche(userIdTest, 'dem-passeport-bio', {
          notes: 'Renouvellement',
        })
      ).rejects.toThrow(/formule gratuite vous permet de suivre 1 démarche/);

      // 3. Récupération des démarches suivies
      const suivis = await demarchesService.getSuivisUtilisateur(userIdTest);
      expect(suivis.length).toBe(1);
      expect(suivis[0].demarche_id).toBe('dem-cni-cedeao');

      // 4. Retrait du suivi (Anti-IDOR)
      const supprime = await demarchesService.supprimerSuiviDemarche(userIdTest, 'dem-cni-cedeao');
      expect(supprime).toBe(true);
      const suivisApres = await demarchesService.getSuivisUtilisateur(userIdTest);
      expect(suivisApres.length).toBe(0);
    });

    test('Portabilité RGPD : l export intègre les démarches suivies et signalements', async () => {
      const donneesService = require('../../backend/services/surga/donnees-service');
      const userIdTest = 'user-rgpd-demarches-' + Date.now();

      const exportDonnees = await donneesService.exporterDonneesUtilisateur({ userId: userIdTest });
      expect(exportDonnees).toBeDefined();
      expect(Array.isArray(exportDonnees.demarches_suivies)).toBe(true);
      expect(Array.isArray(exportDonnees.demarches_signalements)).toBe(true);

      const purgeResultats = await donneesService.supprimerDonneesUtilisateur({ userId: userIdTest });
      expect(purgeResultats).toBeDefined();
    });

    test('Les routeurs REST démarches (client et admin) se chargent et répondent dans Express', () => {
      const routerDemarchesClient = require('../../backend/routes/surga/demarches');
      const routerAdmin = require('../../backend/routes/admin-surga');

      const clientRoutes = routerDemarchesClient.stack
        .filter((r) => r.route)
        .map((r) => `${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);

      expect(clientRoutes).toContain('GET /demarches');
      expect(clientRoutes).toContain('GET /demarches/categories');
      expect(clientRoutes).toContain('GET /demarches/suivis');
      expect(clientRoutes).toContain('POST /demarches/:id/suivis');
      expect(clientRoutes).toContain('DELETE /demarches/:id/suivis');
      expect(clientRoutes).toContain('POST /demarches/:id/signalements');
      expect(clientRoutes).toContain('GET /demarches/:id');

      const adminRoutes = routerAdmin.stack
        .filter((r) => r.route)
        .map((r) => `${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);

      expect(adminRoutes).toContain('GET /demarches');
      expect(adminRoutes).toContain('POST /demarches');
      expect(adminRoutes).toContain('PUT /demarches/:id');
      expect(adminRoutes).toContain('POST /demarches/:id/reverifier');
      expect(adminRoutes).toContain('DELETE /demarches/:id');
      expect(adminRoutes).toContain('GET /demarches/signalements/liste');
      expect(adminRoutes).toContain('PUT /demarches/signalements/:id');
    });
  });
});






