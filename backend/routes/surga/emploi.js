// backend/routes/surga/emploi.js
// Routes REST pour la brique Emploi : Profil pro, CV PDF, Lettres de motivation (Tranche 18)
// Anti-IDOR strict, monétisation mixte, vérification serveur des droits

const express = require('express');
const router = express.Router();
const { verifierToken } = require('../../middlewares/auth');
const emploiService = require('../../services/surga/emploi-service');

/**
 * GET /api/surga/emploi/profil
 * Récupère le profil professionnel de l'utilisateur authentifié
 */
router.get('/emploi/profil', verifierToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const profil = await emploiService.getProfilPro(userId);
    return res.json({ success: true, profil });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/surga/emploi/profil
 * Met à jour le profil professionnel de l'utilisateur authentifié
 */
router.put('/emploi/profil', verifierToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body || {};
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
router.get('/emploi/droits', verifierToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const droitCv = await emploiService.verifierDroitCv(userId);
    const droitLettre = await emploiService.verifierDroitLettre(userId);
    return res.json({ success: true, droitCv, droitLettre });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/surga/emploi/cv/generer
 * Génère et enregistre un CV à partir du profil pro (Anti-Hallucination)
 */
router.post('/emploi/cv/generer', verifierToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { modele = 'sobre_moderne', attestationExactitude = false } = req.body;

    if (!attestationExactitude) {
      return res.status(400).json({
        success: false,
        error: 'Vous devez obligatoirement confirmer l exactitude des informations renseignées avant de générer votre CV.',
      });
    }

    const profil = await emploiService.getProfilPro(userId);
    if (!profil || !profil.nom_complet || !profil.titre_poste) {
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
        prix_acte_xof: 500,
      });
    }

    const titre = `CV - ${profil.nom_complet} (${profil.titre_poste})`;
    const doc = await emploiService.sauvegarderDocumentEmploi({
      userId,
      type: 'CV',
      titre,
      contenu: profil,
      modele,
      estAchete: !droit.avecMention,
    });

    // Incrémente le compteur uniquement si gratuit
    if (droit.motif === 'gratuit_decouverte') {
      await emploiService.incrementerUsage(userId, 'cv_generation', 'global');
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
router.post('/emploi/lettre/generer', verifierToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { titrePosteOffre, entrepriseOffre, offreTexte, attestationExactitude = false } = req.body;

    if (!attestationExactitude) {
      return res.status(400).json({
        success: false,
        error: 'Vous devez obligatoirement confirmer l exactitude des informations avant de générer votre lettre.',
      });
    }

    const profil = await emploiService.getProfilPro(userId);
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
      });
    }

    const proposition = emploiService.genererPropositionLettre({
      profil,
      titrePosteOffre,
      entrepriseOffre,
      offreTexte,
    });

    const titre = `Lettre de motivation - ${titrePosteOffre || profil.titre_poste || 'Candidature'}`;
    const doc = await emploiService.sauvegarderDocumentEmploi({
      userId,
      type: 'LETTRE',
      titre,
      contenu: proposition,
      modele: 'sobre_moderne',
      offreTexte,
    });

    const d = new Date();
    const periode = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    await emploiService.incrementerUsage(userId, 'lettre_generation', periode);

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
router.get('/emploi/documents', verifierToken, async (req, res) => {
  try {
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
router.get('/emploi/documents/:id/pdf', verifierToken, async (req, res) => {
  try {
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
router.delete('/emploi/documents/:id', verifierToken, async (req, res) => {
  try {
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

module.exports = router;
