// backend/routes/surga/emploi.js
// Routes REST pour la brique Emploi : Profil pro, CV PDF, Lettres de motivation (Tranche 18)
// Anti-IDOR strict, monétisation mixte, identification universelle client PWA

const express = require('express');
const router = express.Router();
const { tokenOptional } = require('../../middlewares/surga-auth');
const emploiService = require('../../services/surga/emploi-service');

/**
 * Middleware d'identification pour Surga Emploi :
 * 1. Décode le JWT s'il est présent (session Nopalou / Surga)
 * 2. Si pas de JWT, utilise l'identifiant matériel/local (x-surga-user-id / x-device-id)
 * 3. En repli, attribue un identifiant invité stable sans bloquer l'usage
 */
function identifierSurgaUser(req, res, next) {
  tokenOptional(req, res, () => {
    let uid = req.user?.userId || req.user?.id;
    if (!uid) {
      // SRG-A1-008 : l'identité ne vient jamais d'un en-tête ou d'un paramètre fourni par le client.
      // Un visiteur sans session valide est un invité sans identifiant : aucune route ne peut agir en son nom.
      req.user = { id: null, userId: null, guest: true };
    } else {
      req.user.id = uid;
      req.user.userId = uid;
    }
    next();
  });
}

/**
 * GET /api/surga/emploi/profil
 * Récupère le profil professionnel de l'utilisateur
 */
router.get('/emploi/profil', identifierSurgaUser, async (req, res) => {
  try {
    if (req.user.guest) {
      return res.json({ success: true, profil: null, guest: true });
    }
    const userId = req.user.id;
    const profil = await emploiService.getProfilPro(userId);
    return res.json({ success: true, profil, guest: false });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/surga/emploi/profil
 * Met à jour le profil professionnel de l'utilisateur
 */
router.put('/emploi/profil', identifierSurgaUser, async (req, res) => {
  try {
    const data = req.body || {};
    if (req.user.guest) {
      return res.json({ success: true, guest: true, profil: data, message: 'Brouillon sauvegardé localement.' });
    }
    const userId = req.user.id;
    const profil = await emploiService.upsertProfilPro(userId, data);
    return res.json({ success: true, profil, message: 'Profil professionnel mis à jour avec succès.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/surga/emploi/droits
 * Vérifie l'état des droits et quotas pour le CV et la lettre
 */
router.get('/emploi/droits', identifierSurgaUser, async (req, res) => {
  try {
    if (req.user.guest) {
      return res.json({
        success: true,
        guest: true,
        droitCv: { autorise: false, motif: 'require_auth', message: 'Connectez-vous via WhatsApp pour activer votre 1er CV gratuit.' },
        droitLettre: { autorise: false, motif: 'require_auth', message: 'Connectez-vous via WhatsApp pour générer votre lettre.' },
        droits: {
          estPremium: false,
          quotaCvAtteint: false,
          cvTelecharges: 0,
          quotaLettreAtteint: false,
          lettresMoisEnCours: 0,
          guest: true,
        },
      });
    }
    const userId = req.user.id;
    const droitCv = await emploiService.verifierDroitCv(userId);
    const droitLettre = await emploiService.verifierDroitLettre(userId);
    return res.json({
      success: true,
      droitCv,
      droitLettre,
      droits: {
        estPremium: droitCv.motif === 'premium',
        quotaCvAtteint: !droitCv.autorise,
        cvTelecharges: droitCv.autorise ? 0 : 1,
        quotaLettreAtteint: !droitLettre.autorise,
        lettresMoisEnCours: droitLettre.autorise ? 0 : 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/surga/emploi/cv/generer
 * Génère et enregistre un CV à partir du profil pro (Anti-Hallucination)
 */
router.post('/emploi/cv/generer', identifierSurgaUser, async (req, res) => {
  try {
    if (req.user.guest) {
      return res.status(401).json({
        success: false,
        requireAuth: true,
        quotaAtteint: false,
        error: 'Veuillez vous connecter avec votre numéro WhatsApp pour activer votre 1er CV gratuit et télécharger votre document.',
      });
    }
    const userId = req.user.id;
    const { attestationExactitude = false, profil: profilTransmis } = req.body;
    const modele = req.body.modele || req.body.modele_design || 'sobre_moderne';

    if (!attestationExactitude) {
      return res.status(400).json({
        success: false,
        error: 'Vous devez obligatoirement confirmer l exactitude des informations renseignées avant de générer votre CV.',
      });
    }

    // Si le client transmet son profil mis à jour, l'enregistrer d'abord
    if (profilTransmis && typeof profilTransmis === 'object') {
      await emploiService.upsertProfilPro(userId, profilTransmis);
    }

    const profil = (await emploiService.getProfilPro(userId)) || profilTransmis;
    const nomComplet = (profil?.nom_complet || profilTransmis?.nom_complet || '').trim();
    const titrePoste = (profil?.titre_professionnel || profil?.titre_poste || profilTransmis?.titre_professionnel || profilTransmis?.titre_poste || '').trim();

    if (!profil || !nomComplet || !titrePoste) {
      return res.status(400).json({
        success: false,
        error: 'Votre profil est incomplet. Veuillez renseigner au moins votre nom complet, votre titre de poste et vos coordonnées.',
      });
    }

    const droit = await emploiService.verifierDroitCv(userId);
    if (!droit.autorise) {
      return res.status(403).json({
        success: false,
        error: droit.message,
        motif: droit.motif,
        quotaAtteint: true,
        prix_acte_xof: 500,
        requireAuth: !!req.user.guest,
      });
    }

    // SRG-A1-023 : le CV gratuit est pris avant la génération, en une instruction ; des demandes simultanées
    // n'en obtiennent qu'un.
    const cvGratuit = droit.motif === 'gratuit_decouverte';
    if (cvGratuit && !(await emploiService.reserverUsage(userId, 'cv_generation', 'global', 1))) {
      return res.status(403).json({
        success: false,
        error: 'Vous avez déjà généré votre CV gratuit. Passez à Surga Premium ou débloquez ce CV sans mention pour 500 FCFA.',
        motif: 'limite_atteinte',
        quotaAtteint: true,
        prix_acte_xof: 500,
        requireAuth: !!req.user.guest,
      });
    }

    const titre = `CV - ${nomComplet} (${titrePoste || 'Professionnel'})`;
    let doc;
    try {
      doc = await emploiService.sauvegarderDocumentEmploi({
        userId,
        type: 'CV',
        titre,
        contenu: profil,
        modele,
        estAchete: !droit.avecMention,
      });
    } catch (erreur) {
      if (cvGratuit) await emploiService.libererUsage(userId, 'cv_generation', 'global');
      throw erreur;
    }

    // Si le client préfère recevoir directement le binaire PDF
    if (req.query.format === 'pdf' || req.headers.accept?.includes('application/pdf')) {
      const filename = `cv_${doc.id}.pdf`;
      return emploiService.genererPdfStream(res, 'CV', profil, filename, {
        modele,
        avecMention: droit.avecMention,
      });
    }

    return res.json({
      success: true,
      document: doc,
      avecMention: droit.avecMention,
      message: 'CV généré avec succès.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/surga/emploi/lettre/generer
 * Génère et enregistre une lettre de motivation adaptée à une offre
 */
router.post('/emploi/lettre/generer', identifierSurgaUser, async (req, res) => {
  try {
    if (req.user.guest) {
      return res.status(401).json({
        success: false,
        requireAuth: true,
        quotaAtteint: false,
        error: 'Veuillez vous connecter avec votre numéro WhatsApp pour générer votre lettre de motivation.',
      });
    }
    const userId = req.user.id;
    const { titrePosteOffre, entrepriseOffre, offreTexte, attestationExactitude = false, profil: profilTransmis } = req.body;

    if (!attestationExactitude) {
      return res.status(400).json({
        success: false,
        error: 'Vous devez obligatoirement confirmer l exactitude des informations avant de générer votre lettre.',
      });
    }

    if (profilTransmis && typeof profilTransmis === 'object') {
      await emploiService.upsertProfilPro(userId, profilTransmis);
    }

    const profil = await emploiService.getProfilPro(userId) || profilTransmis;
    if (!profil || !profil.nom_complet) {
      return res.status(400).json({
        success: false,
        error: 'Votre profil professionnel doit contenir au moins votre nom et vos coordonnées pour éditer une lettre de motivation.',
      });
    }

    const droit = await emploiService.verifierDroitLettre(userId);
    if (!droit.autorise) {
      return res.status(403).json({
        success: false,
        error: droit.message,
        motif: droit.motif,
        quotaAtteint: true,
        requireAuth: !!req.user.guest,
      });
    }

    // SRG-A1-023 : la lettre gratuite du mois est prise avant la génération, en une instruction.
    const moisCourant = new Date();
    const periodeLettre = `${moisCourant.getFullYear()}-${String(moisCourant.getMonth() + 1).padStart(2, '0')}`;
    const lettreGratuite = droit.motif === 'gratuit_mensuel';
    if (lettreGratuite && !(await emploiService.reserverUsage(userId, 'lettre_generation', periodeLettre, 1))) {
      return res.status(403).json({
        success: false,
        error: 'Vous avez atteint votre quota gratuit d une lettre de motivation ce mois-ci. Passez à Surga Premium pour continuer.',
        motif: 'limite_atteinte',
        quotaAtteint: true,
        requireAuth: !!req.user.guest,
      });
    }

    const proposition = emploiService.genererPropositionLettre({
      profil,
      titrePosteOffre,
      entrepriseOffre,
      offreTexte,
    });

    const titre = `Lettre de motivation - ${titrePosteOffre || profil.titre_poste || 'Candidature'}`;
    let doc;
    try {
      doc = await emploiService.sauvegarderDocumentEmploi({
        userId,
        type: 'LETTRE',
        titre,
        contenu: proposition,
        modele: 'sobre_moderne',
        offreTexte,
      });
    } catch (erreur) {
      if (lettreGratuite) await emploiService.libererUsage(userId, 'lettre_generation', periodeLettre);
      throw erreur;
    }
    // Un compte Premium n'a pas de quota : son usage est seulement compté.
    if (!lettreGratuite) await emploiService.incrementerUsage(userId, 'lettre_generation', periodeLettre);

    if (req.query.format === 'pdf' || req.headers.accept?.includes('application/pdf')) {
      const filename = `lettre_${doc.id}.pdf`;
      return emploiService.genererPdfStream(res, 'LETTRE', proposition, filename, {
        modele: 'sobre_moderne',
        avecMention: false,
      });
    }

    return res.json({
      success: true,
      document: doc,
      message: 'Lettre de motivation générée avec succès.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/surga/emploi/documents
 * Liste les documents créés par l'utilisateur
 */
router.get('/emploi/documents', identifierSurgaUser, async (req, res) => {
  try {
    if (req.user.guest) {
      return res.json({ success: true, documents: [], guest: true });
    }
    const userId = req.user.id;
    const type = req.query.type || null;
    const documents = await emploiService.listerDocumentsUtilisateur(userId, type);
    return res.json({ success: true, documents });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/surga/emploi/documents/:id/pdf
 * Télécharge le PDF d'un document avec vérification Anti-IDOR
 */
router.get('/emploi/documents/:id/pdf', identifierSurgaUser, async (req, res) => {
  try {
    if (req.user.guest) {
      return res.status(401).json({ success: false, requireAuth: true, error: 'Connexion requise pour télécharger ce document.' });
    }
    const userId = req.user.id;
    const docId = req.params.id;

    const doc = await emploiService.getDocumentEmploi(docId, userId);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document introuvable ou accès non autorisé.' });
    }

    const droit = await emploiService.verifierDroitCv(userId);
    const avecMention = !doc.est_achete && droit.avecMention;
    const filename = `${doc.type.toLowerCase()}_${doc.id}.pdf`;

    return emploiService.genererPdfStream(res, doc.type, doc.contenu, filename, {
      modele: doc.modele || 'sobre_moderne',
      avecMention,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/surga/emploi/documents/:id
 * Supprime un document (Anti-IDOR)
 */
router.delete('/emploi/documents/:id', identifierSurgaUser, async (req, res) => {
  try {
    if (req.user.guest) {
      return res.status(401).json({ success: false, requireAuth: true, error: 'Connexion requise pour supprimer ce document.' });
    }
    const userId = req.user.id;
    const docId = req.params.id;

    const supprime = await emploiService.supprimerDocumentEmploi(docId, userId);
    if (!supprime) {
      return res.status(404).json({ success: false, error: 'Document introuvable ou vous n en êtes pas propriétaire.' });
    }

    return res.json({ success: true, message: 'Document supprimé avec succès.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/surga/emploi/entretien/banque
 * Récupère la banque de questions types pour un secteur donné
 */
router.get('/emploi/entretien/banque', (req, res) => {
  try {
    const { secteur = 'general' } = req.query;
    const questions = emploiService.getBanqueQuestions(secteur);
    return res.json({ success: true, secteur, questions });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/surga/emploi/entretien/droits
 * Vérifie le quota hebdomadaire pour les simulations d'entretien
 */
router.get('/emploi/entretien/droits', identifierSurgaUser, async (req, res) => {
  try {
    if (req.user.guest) {
      return res.json({ success: true, guest: true, droits: { autorise: false, motif: 'require_auth', message: 'Connectez-vous pour lancer une simulation d entretien.' } });
    }
    const userId = req.user.id;
    const droits = await emploiService.verifierDroitSimulationEntretien(userId);
    return res.json({ success: true, droits });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/surga/emploi/entretien/evaluer
 * Analyse constructive et déterministe d'une réponse fournie à une question
 */
router.post('/emploi/entretien/evaluer', (req, res) => {
  try {
    const { question, reponse, poste = '', secteur = '' } = req.body;
    if (!question || !reponse) {
      return res.status(400).json({
        success: false,
        error: 'La question et votre réponse sont obligatoires pour l analyse.',
      });
    }

    const evaluation = emploiService.evaluerReponseEntretien({
      question,
      reponse,
      poste,
      secteur,
    });

    return res.json({ success: true, evaluation });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/surga/emploi/entretien/session
 * Valide la réalisation d'une simulation et incrémente le compteur hebdomadaire si gratuit
 */
router.post('/emploi/entretien/session', identifierSurgaUser, async (req, res) => {
  try {
    if (req.user.guest) {
      return res.status(401).json({
        success: false,
        requireAuth: true,
        quotaAtteint: false,
        error: 'Veuillez vous connecter avec votre numéro WhatsApp pour lancer votre simulation d entretien.',
      });
    }
    const userId = req.user.id;
    const droits = await emploiService.verifierDroitSimulationEntretien(userId);

    if (!droits.autorise) {
      return res.status(403).json({
        success: false,
        error: droits.message,
        quotaAtteint: true,
      });
    }

    // SRG-A1-023 : la simulation gratuite de la semaine est prise en une instruction, sur la même période que
    // celle que lit le contrôle des droits.
    if (!droits.estPremium && !(await emploiService.reserverUsage(userId, 'entretien_simulation', emploiService.getPeriodeSemaineCourante(), 1))) {
      return res.status(403).json({
        success: false,
        error: 'Quota hebdomadaire atteint (1 simulation gratuite par semaine). Passez à Surga Premium pour vous entraîner sans limite.',
        quotaAtteint: true,
      });
    }

    return res.json({
      success: true,
      message: 'Session de simulation d entretien validée avec succès.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/surga/emploi/entretien/fiche-revision
 * Génère une fiche de révision textuelle complète pour l'enregistrement en Notes
 */
router.post('/emploi/entretien/fiche-revision', (req, res) => {
  try {
    const { poste, secteur, evaluations = [] } = req.body;
    const fiche = emploiService.genererFicheRevisionEntretien({
      poste,
      secteur,
      evaluations,
    });

    return res.json({ success: true, fiche });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
