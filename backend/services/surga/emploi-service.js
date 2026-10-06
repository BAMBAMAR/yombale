// backend/services/surga/emploi-service.js
// Service de gestion du profil professionnel, CV PDF et lettres de motivation (Tranche 18)
// Zéro-hallucination, génération PDF via pdfkit, modèles sobres, vouvoiement strict D19
// Monétisation mixte : 1 CV gratuit avec mention, 1 lettre/mois, achat à l'acte 500 FCFA

const PDFDocument = require('pdfkit');
const { pool } = require('../../models/db');

// Stockage mémoire en cas d'absence de base de données (ex: tests unitaires Jest)
const profilsMemoire = new Map();
const documentsMemoire = new Map();
const usagesMemoire = new Map(); // key: `${userId}:${service}:${periode}` -> count

/**
 * Nettoie une chaîne de texte pour compatibilité PDFKit (suppression des \r Windows)
 */
function cleanPdfText(str) {
  return String(str || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

/**
 * Formate le mois actuel (AAAA-MM) pour les quotas périodiques
 */
function getPeriodeMoisCourant() {
  const d = new Date();
  const annee = d.getFullYear();
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  return `${annee}-${mois}`;
}

/**
 * Harmonise les alias de champs entre frontend et backend
 */
function formaterProfilPourClient(profil) {
  if (!profil) return null;
  const titre = cleanPdfText(profil.titre_professionnel || profil.titre_poste || '');
  const adresse = cleanPdfText(profil.adresse_ville || profil.adresse || '');
  const resume = cleanPdfText(profil.resume_pro || profil.resume || '');

  const experiences = (Array.isArray(profil.experiences) ? profil.experiences : []).map((exp) => ({
    ...exp,
    titre: cleanPdfText(exp.titre || exp.poste || ''),
    poste: cleanPdfText(exp.poste || exp.titre || ''),
    entreprise: cleanPdfText(exp.entreprise || ''),
    lieu: cleanPdfText(exp.lieu || ''),
    date_debut: cleanPdfText(exp.date_debut || ''),
    date_fin: cleanPdfText(exp.date_fin || ''),
    description: cleanPdfText(exp.description || ''),
  }));

  const formations = (Array.isArray(profil.formations) ? profil.formations : []).map((form) => ({
    ...form,
    diplome: cleanPdfText(form.diplome || form.titre || ''),
    titre: cleanPdfText(form.titre || form.diplome || ''),
    etablissement: cleanPdfText(form.etablissement || form.ecole || ''),
    ecole: cleanPdfText(form.ecole || form.etablissement || ''),
    annee: cleanPdfText(form.annee || form.date || ''),
    date: cleanPdfText(form.date || form.annee || ''),
  }));

  return {
    ...profil,
    titre_poste: titre,
    titre_professionnel: titre,
    adresse,
    adresse_ville: adresse,
    resume,
    resume_pro: resume,
    experiences,
    formations,
  };
}

/**
 * Récupère le profil professionnel d'un utilisateur
 */
async function getProfilPro(userId) {
  if (!userId) return null;

  let profil = null;
  if (pool) {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM surga_profil_pro WHERE user_id = $1',
        [userId]
      );
      if (rows.length > 0) {
        profil = rows[0];
      }
    } catch (err) {
      // repli mémoire
    }
  }

  if (!profil) {
    profil = profilsMemoire.get(userId) || null;
  }

  return profil ? formaterProfilPourClient(profil) : null;
}

/**
 * Crée ou met à jour le profil professionnel d'un utilisateur (Anti-Hallucination)
 */
async function upsertProfilPro(userId, data) {
  if (!userId) throw new Error('Identifiant utilisateur requis.');

  const nomComplet = cleanPdfText(data.nom_complet || '');
  const telephone = cleanPdfText(data.telephone || '');
  const email = cleanPdfText(data.email || '');
  const adresse = cleanPdfText(data.adresse_ville || data.adresse || '');
  const titrePoste = cleanPdfText(data.titre_professionnel || data.titre_poste || '');
  const resume = cleanPdfText(data.resume_pro || data.resume || '');
  const experiences = (Array.isArray(data.experiences) ? data.experiences : []).map((exp) => ({
    ...exp,
    titre: cleanPdfText(exp.titre || exp.poste || ''),
    poste: cleanPdfText(exp.poste || exp.titre || ''),
    entreprise: cleanPdfText(exp.entreprise || ''),
    lieu: cleanPdfText(exp.lieu || ''),
    date_debut: cleanPdfText(exp.date_debut || ''),
    date_fin: cleanPdfText(exp.date_fin || ''),
    description: cleanPdfText(exp.description || ''),
  }));
  const formations = (Array.isArray(data.formations) ? data.formations : []).map((form) => ({
    ...form,
    diplome: cleanPdfText(form.diplome || form.titre || ''),
    titre: cleanPdfText(form.titre || form.diplome || ''),
    etablissement: cleanPdfText(form.etablissement || form.ecole || ''),
    ecole: cleanPdfText(form.ecole || form.etablissement || ''),
    annee: cleanPdfText(form.annee || form.date || ''),
    date: cleanPdfText(form.date || form.annee || ''),
  }));
  const competences = Array.isArray(data.competences) ? data.competences : [];
  const langues = Array.isArray(data.langues) ? data.langues : [];

  if (pool) {
    try {
      const query = `
        INSERT INTO surga_profil_pro (
          user_id, nom_complet, telephone, email, adresse, titre_poste, resume,
          experiences, formations, competences, langues, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          nom_complet = EXCLUDED.nom_complet,
          telephone = EXCLUDED.telephone,
          email = EXCLUDED.email,
          adresse = EXCLUDED.adresse,
          titre_poste = EXCLUDED.titre_poste,
          resume = EXCLUDED.resume,
          experiences = EXCLUDED.experiences,
          formations = EXCLUDED.formations,
          competences = EXCLUDED.competences,
          langues = EXCLUDED.langues,
          updated_at = NOW()
        RETURNING *
      `;
      const params = [
        userId,
        nomComplet,
        telephone,
        email,
        adresse,
        titrePoste,
        resume,
        JSON.stringify(experiences),
        JSON.stringify(formations),
        JSON.stringify(competences),
        JSON.stringify(langues),
      ];
      const { rows } = await pool.query(query, params);
      return formaterProfilPourClient(rows[0]);
    } catch (err) {
      // repli mémoire
    }
  }

  const profil = {
    user_id: userId,
    nom_complet: nomComplet,
    telephone,
    email,
    adresse,
    adresse_ville: adresse,
    titre_poste: titrePoste,
    titre_professionnel: titrePoste,
    resume,
    resume_pro: resume,
    experiences,
    formations,
    competences,
    langues,
    updated_at: new Date().toISOString(),
  };
  profilsMemoire.set(userId, profil);
  return formaterProfilPourClient(profil);
}

/**
 * Vérifie si un utilisateur dispose du statut Premium actif
 */
async function verifierEstPremium(userId) {
  if (!userId) return false;

  if (pool) {
    try {
      const { rows } = await pool.query(
        `SELECT id FROM surga_abonnements
         WHERE user_id = $1 AND statut = 'actif' AND (fin IS NULL OR fin > NOW())
         LIMIT 1`,
        [userId]
      );
      return rows.length > 0;
    } catch (err) {
      // repli
    }
  }

  return false;
}

/**
 * Récupère le compteur d'usage d'un service pour un utilisateur
 */
async function getUsageCompteur(userId, service, periode) {
  if (!userId) return 0;

  if (pool) {
    try {
      const { rows } = await pool.query(
        'SELECT quantite FROM surga_usages WHERE user_id = $1 AND service = $2 AND periode = $3',
        [userId, service, periode]
      );
      if (rows.length > 0) return rows[0].quantite;
    } catch (err) {
      // repli mémoire
    }
  }

  const key = `${userId}:${service}:${periode}`;
  return usagesMemoire.get(key) || 0;
}

/**
 * Incrémente le compteur d'usage d'un service
 */
async function incrementerUsage(userId, service, periode) {
  if (!userId) return;

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO surga_usages (user_id, service, periode, quantite, updated_at)
         VALUES ($1, $2, $3, 1, NOW())
         ON CONFLICT (user_id, service, periode)
         DO UPDATE SET quantite = surga_usages.quantite + 1, updated_at = NOW()`,
        [userId, service, periode]
      );
      return;
    } catch (err) {
      // repli mémoire
    }
  }

  const key = `${userId}:${service}:${periode}`;
  const actuel = usagesMemoire.get(key) || 0;
  usagesMemoire.set(key, actuel + 1);
}

/**
 * Vérifie les droits de génération d'un CV (Gratuit 1 avec mention, Payant sans mention)
 */
async function verifierDroitCv(userId) {
  const estPremium = await verifierEstPremium(userId);
  if (estPremium) {
    return { autorise: true, avecMention: false, motif: 'premium' };
  }

  const nbCvGeneres = await getUsageCompteur(userId, 'cv_generation', 'global');
  if (nbCvGeneres === 0) {
    return { autorise: true, avecMention: true, motif: 'gratuit_decouverte' };
  }

  return {
    autorise: false,
    avecMention: false,
    motif: 'limite_atteinte',
    message: 'Vous avez déjà généré votre CV gratuit. Passez à Surga Premium ou débloquez ce CV sans mention pour 500 FCFA.',
  };
}

/**
 * Vérifie les droits de génération d'une lettre de motivation (Gratuit 1 par mois)
 */
async function verifierDroitLettre(userId) {
  const estPremium = await verifierEstPremium(userId);
  if (estPremium) {
    return { autorise: true, motif: 'premium' };
  }

  const periode = getPeriodeMoisCourant();
  const nbLettresMois = await getUsageCompteur(userId, 'lettre_generation', periode);
  if (nbLettresMois < 1) {
    return { autorise: true, motif: 'gratuit_mensuel' };
  }

  return {
    autorise: false,
    motif: 'limite_atteinte',
    message: 'Vous avez atteint votre quota gratuit d une lettre de motivation ce mois-ci. Passez à Surga Premium pour continuer.',
  };
}

/**
 * Enregistre un document d'emploi (CV ou Lettre)
 */
async function sauvegarderDocumentEmploi({ id, userId, type, titre, contenu, modele = 'sobre_moderne', offreTexte = null, estAchete = false }) {
  const docId = id || `doc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

  if (pool) {
    try {
      const query = `
        INSERT INTO surga_documents_emploi (id, user_id, type, titre, contenu, modele, offre_texte, est_achete, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (id) DO UPDATE SET
          titre = EXCLUDED.titre,
          contenu = EXCLUDED.contenu,
          modele = EXCLUDED.modele,
          offre_texte = EXCLUDED.offre_texte,
          est_achete = EXCLUDED.est_achete,
          updated_at = NOW()
        RETURNING *
      `;
      const { rows } = await pool.query(query, [docId, userId, type, titre, JSON.stringify(contenu), modele, offreTexte, !!estAchete]);
      return rows[0];
    } catch (err) {
      // repli mémoire
    }
  }

  const doc = {
    id: docId,
    user_id: userId,
    type,
    titre,
    contenu,
    modele,
    offre_texte: offreTexte,
    est_achete: !!estAchete,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  documentsMemoire.set(docId, doc);
  return doc;
}

/**
 * Récupère un document d'emploi avec vérification stricte du propriétaire (Anti-IDOR)
 */
async function getDocumentEmploi(docId, userId) {
  if (!docId || !userId) return null;

  if (pool) {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM surga_documents_emploi WHERE id = $1 AND user_id = $2',
        [docId, userId]
      );
      if (rows.length > 0) return rows[0];
    } catch (err) {
      // repli mémoire
    }
  }

  const doc = documentsMemoire.get(docId);
  if (doc && doc.user_id === userId) {
    return doc;
  }
  return null;
}

/**
 * Liste les documents d'un utilisateur
 */
async function listerDocumentsUtilisateur(userId, type = null) {
  if (!userId) return [];

  if (pool) {
    try {
      const conditions = ['user_id = $1'];
      const params = [userId];
      if (type) {
        params.push(type.toUpperCase());
        conditions.push(`type = $${params.length}`);
      }
      const { rows } = await pool.query(
        `SELECT id, user_id, type, titre, modele, offre_texte, est_achete, created_at, updated_at
         FROM surga_documents_emploi
         WHERE ${conditions.join(' AND ')}
         ORDER BY created_at DESC`,
        params
      );
      return rows;
    } catch (err) {
      // repli
    }
  }

  const docs = Array.from(documentsMemoire.values()).filter((d) => {
    if (d.user_id !== userId) return false;
    if (type && d.type !== type.toUpperCase()) return false;
    return true;
  });
  return docs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * Supprime un document d'emploi (Anti-IDOR)
 */
async function supprimerDocumentEmploi(docId, userId) {
  if (!docId || !userId) return false;

  if (pool) {
    try {
      const res = await pool.query(
        'DELETE FROM surga_documents_emploi WHERE id = $1 AND user_id = $2',
        [docId, userId]
      );
      return res.rowCount > 0;
    } catch (err) {
      // repli
    }
  }

  const doc = documentsMemoire.get(docId);
  if (doc && doc.user_id === userId) {
    documentsMemoire.delete(docId);
    return true;
  }
  return false;
}

/**
 * Génère une proposition de lettre de motivation déterministe et formelle (Vouvoiement D19, sans invention)
 */
function genererPropositionLettre({ profil, titrePosteOffre, entrepriseOffre, offreTexte }) {
  if (!profil) throw new Error('Profil professionnel requis.');

  const nomCandidat = profil.nom_complet || 'Candidat';
  const telCandidat = profil.telephone || '';
  const emailCandidat = profil.email || '';
  const adresseCandidat = profil.adresse || 'Dakar, Sénégal';

  const posteCible = cleanPdfText(titrePosteOffre || profil.titre_poste || 'Poste à pourvoir');
  const entreprise = cleanPdfText(entrepriseOffre || 'Madame, Monsieur les membres du comité de recrutement');

  const competencesList = Array.isArray(profil.competences)
    ? profil.competences.map((c) => (typeof c === 'string' ? c : c.nom)).filter(Boolean)
    : [];

  const competenceTexte = competencesList.length > 0
    ? `Mes compétences acquises, notamment en ${competencesList.slice(0, 4).join(', ')}, constituent un atout directement mobilisable au service de vos objectifs.`
    : 'Mon parcours m a permis de développer une rigueur et une capacité d adaptation éprouvées.';

  // Extraction d'expériences clés réelles
  let experienceTexte = '';
  if (Array.isArray(profil.experiences) && profil.experiences.length > 0) {
    const premiereExp = profil.experiences[0];
    experienceTexte = `Au cours de mon expérience en tant que ${premiereExp.poste || 'professionnel'} chez ${premiereExp.entreprise || 'mon précédent employeur'}, j ai eu l opportunité de mener à bien des missions exigeantes qui confirment ma motivation pour ce poste.`;
  }

  const dateJour = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const contenu = {
    expediteur: {
      nom: nomCandidat,
      telephone: telCandidat,
      email: emailCandidat,
      adresse: adresseCandidat,
    },
    destinataire: entreprise,
    lieuEtDate: `Dakar, le ${dateJour}`,
    objet: `Candidature au poste de ${posteCible}`,
    salutation: 'Madame, Monsieur,',
    paragrapheIntroduction: `Vivement intéressé(e) par les perspectives professionnelles offertes au sein de votre structure, je vous soumets par la présente ma candidature pour le poste de ${posteCible}.`,
    paragrapheParcours: experienceTexte || competenceTexte,
    paragrapheMotivation: `Intégrer vos équipes représente pour moi l opportunité d apporter mon dynamisme, ma conscience professionnelle et mon sens des responsabilités.`,
    paragrapheConclusion: `Je reste à votre entière disposition pour convenir d un entretien afin de vous exposer plus en détail mes motivations et l adéquation de mon profil avec vos attentes.`,
    formulePolitesse: 'Je vous prie d agréer, Madame, Monsieur, l expression de mes salutations distinguées.',
    signature: nomCandidat,
  };

  return contenu;
}

/**
 * Génère le document PDF pour un CV ou une Lettre de motivation (Stream ou Buffer)
 */
function construireDocumentPdf(type, donnees, { modele = 'sobre_moderne', avecMention = false } = {}) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  const NAVY = '#1C2B4A';
  const SLATE = '#475569';
  const LIGHT_BORDER = '#CBD5E1';
  const DARK = '#0F172A';

  if (type === 'CV') {
    // En-tête CV
    const nom = cleanPdfText(donnees.nom_complet || 'CURRICULUM VITAE');
    const titrePoste = cleanPdfText(donnees.titre_professionnel || donnees.titre_poste || '');

    doc.fillColor(NAVY).fontSize(20).font('Helvetica-Bold').text(nom, 40, 40);
    if (titrePoste) {
      doc.fillColor('#C75B00').fontSize(12).font('Helvetica-Bold').text(titrePoste.toUpperCase(), 40, 66);
    }

    // Coordonnées
    const coords = [donnees.telephone, donnees.email, donnees.adresse_ville || donnees.adresse].filter(Boolean).join('  •  ');
    if (coords) {
      doc.fillColor(SLATE).fontSize(9).font('Helvetica').text(coords, 40, 84);
    }

    // Ligne de séparation
    doc.moveTo(40, 102).lineTo(555, 102).strokeColor(LIGHT_BORDER).lineWidth(1).stroke();

    let currentY = 115;

    // Résumé
    const resumeTexte = donnees.resume_pro || donnees.resume;
    if (resumeTexte) {
      doc.fillColor(NAVY).fontSize(11).font('Helvetica-Bold').text('PROFIL & OBJECTIF', 40, currentY);
      currentY += 16;
      doc.fillColor(DARK).fontSize(9.5).font('Helvetica').text(cleanPdfText(resumeTexte), 40, currentY, { width: 515, lineHeight: 1.25 });
      currentY = doc.y + 16;
    }

    // Expériences professionnelles
    if (Array.isArray(donnees.experiences) && donnees.experiences.length > 0) {
      doc.fillColor(NAVY).fontSize(11).font('Helvetica-Bold').text('EXPÉRIENCES PROFESSIONNELLES', 40, currentY);
      currentY += 16;

      for (const exp of donnees.experiences) {
        const poste = cleanPdfText(exp.titre || exp.poste || '');
        const entreprise = cleanPdfText(exp.entreprise || '');
        const dates = [exp.date_debut, exp.date_fin || (exp.en_cours ? 'Présent' : '')].filter(Boolean).join(' - ');

        doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text(poste, 40, currentY);
        if (dates) {
          doc.fillColor(SLATE).fontSize(8.5).font('Helvetica').text(dates, 420, currentY, { align: 'right', width: 135 });
        }
        currentY += 14;

        if (entreprise) {
          doc.fillColor(SLATE).fontSize(9).font('Helvetica-Oblique').text(entreprise, 40, currentY);
          currentY += 12;
        }

        if (exp.description) {
          doc.fillColor(DARK).fontSize(9).font('Helvetica').text(cleanPdfText(exp.description), 40, currentY, { width: 515 });
          currentY = doc.y + 10;
        } else {
          currentY += 6;
        }
      }
      currentY += 6;
    }

    // Formations
    if (Array.isArray(donnees.formations) && donnees.formations.length > 0) {
      doc.fillColor(NAVY).fontSize(11).font('Helvetica-Bold').text('FORMATIONS & DIPLÔMES', 40, currentY);
      currentY += 16;

      for (const form of donnees.formations) {
        const diplome = cleanPdfText(form.diplome || form.titre || '');
        const ecole = cleanPdfText(form.etablissement || form.ecole || '');
        const annee = cleanPdfText(form.annee || form.date || '');

        doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text(diplome, 40, currentY);
        if (annee) {
          doc.fillColor(SLATE).fontSize(8.5).font('Helvetica').text(annee, 450, currentY, { align: 'right', width: 105 });
        }
        currentY += 13;

        if (ecole) {
          doc.fillColor(SLATE).fontSize(9).font('Helvetica').text(ecole, 40, currentY);
          currentY += 14;
        }
      }
      currentY += 6;
    }

    // Compétences & Langues
    const compList = Array.isArray(donnees.competences)
      ? donnees.competences.map((c) => (typeof c === 'string' ? c : c.nom)).filter(Boolean)
      : [];

    const langList = Array.isArray(donnees.langues)
      ? donnees.langues.map((l) => (typeof l === 'string' ? l : `${l.langue} (${l.niveau || ''})`)).filter(Boolean)
      : [];

    if (compList.length > 0 || langList.length > 0) {
      doc.fillColor(NAVY).fontSize(11).font('Helvetica-Bold').text('COMPÉTENCES & LANGUES', 40, currentY);
      currentY += 16;

      if (compList.length > 0) {
        doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text('Compétences : ', 40, currentY, { continued: true });
        doc.font('Helvetica').text(compList.join('  •  '));
        currentY = doc.y + 8;
      }

      if (langList.length > 0) {
        doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text('Langues : ', 40, currentY, { continued: true });
        doc.font('Helvetica').text(langList.join('  •  '));
        currentY = doc.y + 8;
      }
    }
  } else {
    // LETTRE DE MOTIVATION
    const exp = donnees.expediteur || {};
    doc.fillColor(NAVY).fontSize(12).font('Helvetica-Bold').text(cleanPdfText(exp.nom || ''), 40, 40);
    doc.fillColor(SLATE).fontSize(9).font('Helvetica')
      .text(cleanPdfText(exp.adresse || ''), 40, 56)
      .text(cleanPdfText(exp.telephone || ''), 40, 68)
      .text(cleanPdfText(exp.email || ''), 40, 80);

    // Destinataire
    doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text(cleanPdfText(donnees.destinataire || ''), 330, 95);

    // Date
    doc.fillColor(SLATE).fontSize(9).font('Helvetica').text(cleanPdfText(donnees.lieuEtDate || ''), 330, 115);

    // Objet
    doc.fillColor(NAVY).fontSize(10.5).font('Helvetica-Bold').text(cleanPdfText(donnees.objet || 'Objet : Candidature'), 40, 155);

    // Corps de la lettre
    let currentY = 185;
    doc.fillColor(DARK).fontSize(10).font('Helvetica').text(cleanPdfText(donnees.salutation || 'Madame, Monsieur,'), 40, currentY);
    currentY += 24;

    const paragraphes = [
      donnees.paragrapheIntroduction,
      donnees.paragrapheParcours,
      donnees.paragrapheMotivation,
      donnees.paragrapheConclusion,
      donnees.formulePolitesse,
    ].filter(Boolean);

    for (const para of paragraphes) {
      doc.fillColor(DARK).fontSize(10).font('Helvetica').text(cleanPdfText(para), 40, currentY, { width: 515, align: 'justify', lineHeight: 1.35 });
      currentY = doc.y + 14;
    }

    // Signature
    currentY += 15;
    doc.fillColor(NAVY).fontSize(10.5).font('Helvetica-Bold').text(cleanPdfText(donnees.signature || exp.nom || ''), 40, currentY);
  }

  // Mention discrète en bas de page si version gratuite
  if (avecMention) {
    doc.fontSize(8).fillColor('#94A3B8').font('Helvetica')
      .text('Conçu avec Surga • Assistant personnel du Sénégal', 40, 800, { align: 'center', width: 515 });
  }

  return doc;
}

/**
 * Génère le PDF sous forme de Buffer mémoire (pour les tests unitaires)
 */
function genererPdfBuffer(type, donnees, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = construireDocumentPdf(type, donnees, options);
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Envoie le PDF directement dans la réponse HTTP (Stream)
 */
function genererPdfStream(res, type, donnees, filename, options = {}) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

  const doc = construireDocumentPdf(type, donnees, options);
  doc.pipe(res);
  doc.end();
}


// ============================================================================
// TRANCHE 19 : PRÉPARATION À L'ENTRETIEN D'EMBAUCHE & FICHES DE RÉVISION
// ============================================================================

/**
 * Banque de questions types par secteur économique dakarisé & sénégalais (Sans IA, coût nul)
 */
const BANQUE_QUESTIONS_ENTRETIEN = {
  general: [
    {
      id: 'gen_1',
      categorie: 'presentation',
      question: 'Pouvez-vous vous présenter en deux minutes et résumer votre parcours professionnel ?',
      conseils: 'Structurez votre réponse : 1. Votre profil actuel, 2. Deux réussites concrètes, 3. La raison de votre intérêt pour ce poste précis. Évitez de réciter tout votre CV.',
    },
    {
      id: 'gen_2',
      categorie: 'motivation',
      question: 'Quelles sont les raisons qui vous motivent à rejoindre notre entreprise plutôt qu’une autre ?',
      conseils: 'Montrez que vous avez étudié l’entreprise (ses projets, ses valeurs, ses défis locaux) et expliquez ce que vous pouvez lui apporter concrètement.',
    },
    {
      id: 'gen_3',
      categorie: 'comportemental',
      question: 'Décrivez une situation où vous avez fait face à un imprévu ou à un conflit professionnel, et la manière dont vous l’avez résolu.',
      conseils: 'Utilisez la méthode STAR (Situation, Tâche, Action, Résultat). Restez factuel, ne critiquez jamais vos anciens employeurs et mettez en avant votre calme.',
    },
    {
      id: 'gen_4',
      categorie: 'valeur_ajoutee',
      question: 'Que pensez-vous apporter à notre équipe dès vos cent premiers jours ?',
      conseils: 'Proposez une démarche d’intégration pragmatique : écoute, prise en main rapide des outils et premiers livrables mesurables.',
    },
  ],
  comptabilite_finance: [
    {
      id: 'cpt_1',
      categorie: 'technique',
      question: 'Comment procédez-vous concrètement pour effectuer un rapprochement bancaire et traiter les suspens non régularisés ?',
      conseils: 'Détaillez votre rigueur : vérification des écritures de trésorerie, lettrage, identification des agios ou écarts de dates et communication avec l’agence bancaire.',
    },
    {
      id: 'cpt_2',
      categorie: 'technique',
      question: 'Quelle est votre expérience avec le référentiel comptable SYSCOHADA et les déclarations fiscales mensuelles (TVA, BRS) au Sénégal ?',
      conseils: 'Précisez les états financiers maîtrisés, le respect des échéances légales (15 du mois) et vos réflexes de contrôle préventif.',
    },
    {
      id: 'cpt_3',
      categorie: 'organisation',
      question: 'Comment organisez-vous la clôture des comptes dans les délais impartis par la direction générale ?',
      conseils: 'Insistez sur la planification en amont, les inventaires physiques, le calendrier partagé avec les équipes et la gestion des priorités.',
    },
  ],
  commercial_vente: [
    {
      id: 'com_1',
      categorie: 'terrain',
      question: 'Comment abordez-vous la prospection de nouveaux clients sur le marché dakarisé ?',
      conseils: 'Expliquez votre stratégie multicanale : présence terrain, réseau direct, réactivité sur WhatsApp Business et qualification du besoin client.',
    },
    {
      id: 'com_2',
      categorie: 'negociation',
      question: 'Face à un client qui juge vos prix trop élevés par rapport à la concurrence, quels sont vos arguments de persuasion ?',
      conseils: 'Déplacez la discussion du prix vers la valeur réelle : qualité du service, garanties, disponibilité locale et rapidité de livraison.',
    },
    {
      id: 'com_3',
      categorie: 'resultats',
      question: 'Racontez une vente complexe que vous avez conclue malgré des réticences initiales.',
      conseils: 'Montrez votre écoute active, votre patience et comment vous avez trouvé une solution sur-mesure répondant exactement au besoin exprimé.',
    },
  ],
  informatique_tech: [
    {
      id: 'tech_1',
      categorie: 'resolution',
      question: 'Comment réagissez-vous face à une panne critique ou un bug bloquant en production un vendredi soir ?',
      conseils: 'Insistez sur le sang-froid, la méthodologie de diagnostic (logs, monitoring), la communication transparente et la mise en place d’un correctif testé.',
    },
    {
      id: 'tech_2',
      categorie: 'qualite',
      question: 'Comment assurez-vous la qualité et la sécurité du code au sein d’une équipe de développement ?',
      conseils: 'Citez des pratiques concrètes : revues de code systématiques, tests automatisés, gestion des variables d’environnement et respect des règles anti-failles.',
    },
  ],
  administration_rh: [
    {
      id: 'rh_1',
      categorie: 'organisation',
      question: 'Comment gérez-vous les urgences administratives quotidiennes tout en assurant l’accueil professionnel des partenaires ?',
      conseils: 'Mettez en valeur votre gestion des priorités, votre courtoisie constante et votre capacité à filtrer les demandes avec discernement.',
    },
    {
      id: 'rh_2',
      categorie: 'confidentialite',
      question: 'Comment garantissez-vous la stricte confidentialité des dossiers RH et des contrats de travail ?',
      conseils: 'Expliquez vos règles de classement sécurisé, la protection des accès numériques et votre discrétion absolue au quotidien.',
    },
  ],
  logistique_transport: [
    {
      id: 'log_1',
      categorie: 'exploitation',
      question: 'Comment planifiez-vous les livraisons à Dakar en tenant compte des encombrements routiers et des imprévus ?',
      conseils: 'Évoquez le zonage géographique, les départs matinaux, l’utilisation des corridors rapides et la communication en direct avec les chauffeurs.',
    },
  ],
};

/**
 * Calcule la clé de période pour la semaine en cours (AAAA-Wxx)
 */
function getPeriodeSemaineCourante() {
  const d = new Date();
  const annee = d.getFullYear();
  const premierJanvier = new Date(annee, 0, 1);
  const nbJours = Math.floor((d - premierJanvier) / (24 * 60 * 60 * 1000));
  const semaine = Math.ceil((nbJours + premierJanvier.getDay() + 1) / 7);
  return `${annee}-W${String(semaine).padStart(2, '0')}`;
}

/**
 * Récupère les questions de la banque pour un secteur donné (avec repli général)
 */
function getBanqueQuestions(secteur = 'general') {
  const specifiques = BANQUE_QUESTIONS_ENTRETIEN[secteur] || [];
  const generals = BANQUE_QUESTIONS_ENTRETIEN.general || [];
  if (secteur === 'general') return generals;
  return [...generals.slice(0, 2), ...specifiques, ...generals.slice(2)];
}

/**
 * Vérifie les droits pour la simulation d'entretien (Gratuit : 1/semaine, Premium : illimité)
 */
async function verifierDroitSimulationEntretien(userId) {
  const estPremium = await verifierEstPremium(userId);
  if (estPremium) {
    return {
      autorise: true,
      quotaAtteint: false,
      estPremium: true,
      simulationsSemaine: 0,
      message: 'Simulations d’entretien illimitées avec Surga Premium.',
    };
  }

  const periode = getPeriodeSemaineCourante();
  const nbUtilise = await getUsageCompteur(userId, 'entretien_simulation', periode);
  if (nbUtilise < 1) {
    return {
      autorise: true,
      quotaAtteint: false,
      estPremium: false,
      simulationsSemaine: nbUtilise,
      message: '1 simulation gratuite par semaine incluse.',
    };
  }

  return {
    autorise: false,
    quotaAtteint: true,
    estPremium: false,
    simulationsSemaine: nbUtilise,
    message: 'Quota hebdomadaire atteint (1 simulation gratuite par semaine). Passez à Surga Premium pour vous entraîner sans limite.',
  };
}

/**
 * Évalue de manière déterministe et constructive une réponse d'entretien
 * (Zéro note d'IA arbitraire, vouvoiement strict D19, conseils concrets méthode STAR)
 */
function evaluerReponseEntretien({ question, reponse, poste = '', secteur = '' }) {
  const texte = cleanPdfText(reponse);
  const mots = texte ? texte.split(/\s+/).filter(Boolean) : [];
  const nbMots = mots.length;

  const pointsForts = [];
  const axesAmelioration = [];

  // Mots d'action et d'engagement professionnel
  const motsAction = [
    'j\'ai', 'mis en place', 'réalisé', 'coordonné', 'géré', 'développé', 'résultat',
    'chiffre', 'équipe', 'projet', 'solution', 'optimisé', 'succès', 'client', 'délai'
  ];
  const texteMinuscule = texte.toLowerCase();
  const actionsTrouvees = motsAction.filter((m) => texteMinuscule.includes(m));

  // 1. Analyse de la concision et du volume
  if (nbMots < 15) {
    axesAmelioration.push('Votre réponse est très courte. Étoffez votre explication en détaillant une situation concrète vécue.');
  } else if (nbMots >= 30 && nbMots <= 160) {
    pointsForts.push('Longueur de réponse équilibrée et adaptée à un échange oral en entretien (ni trop brève, ni verbeuse).');
  } else if (nbMots > 200) {
    axesAmelioration.push('Votre réponse est un peu longue. Veillez à aller droit au but afin de conserver l’attention active du recruteur.');
  }

  // 2. Détection d'exemples d'action concrets
  if (actionsTrouvees.length >= 2) {
    pointsForts.push(`Vous employez un vocabulaire d'action actif (${actionsTrouvees.slice(0, 3).join(', ')}) qui valorise votre rôle direct.`);
  } else {
    axesAmelioration.push('Illustrez votre propos avec un exemple personnel précis plutôt qu’une considération générale.');
  }

  // 3. Détection de la méthode STAR (Situation, Action, Résultat)
  const aResultat = texteMinuscule.includes('résultat') || texteMinuscule.includes('succès') || texteMinuscule.includes('permis de') || texteMinuscule.includes('atteint');
  if (aResultat) {
    pointsForts.push('Vous mentionnez le résultat ou l’impact de vos démarches, ce qui crédibilise votre expérience.');
  } else if (nbMots >= 20) {
    axesAmelioration.push('Pensez à conclure en rappelant le résultat ou le bénéfice obtenu pour l’organisation (méthode STAR).');
  }

  // Suggestion de reformulation déterministe
  let suggestionReformulation = '';
  if (nbMots < 15) {
    suggestionReformulation = `« Lors de ma précédente expérience, j'ai eu l'opportunité de traiter ce type de problématique en analysant d'abord les besoins de l'équipe, puis en mettant en œuvre une solution méthodique qui a permis d'obtenir des résultats probants. »`;
  } else {
    suggestionReformulation = `« En situation réelle, je m'assure de bien cerner le contexte, puis j'agis avec méthode pour transformer le défi en résultat mesurable pour la structure. »`;
  }

  return {
    nb_mots: nbMots,
    points_forts: pointsForts.length > 0 ? pointsForts : ['Expression posée et respectueuse des convenances professionnelles.'],
    axes_amelioration: axesAmelioration.length > 0 ? axesAmelioration : ['Conservez cette clarté et restez attentif aux relances de votre interlocuteur.'],
    suggestion: suggestionReformulation,
  };
}

/**
 * Génère une fiche de révision textuelle complète prête à enregistrer en Note
 */
function genererFicheRevisionEntretien({ poste, secteur, evaluations = [] }) {
  const dateJour = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const titre = `Fiche de Révision : Entretien ${cleanPdfText(poste || 'Professionnel')} (${dateJour})`;

  let contenu = `=== FICHE DE RÉVISION D'ENTRETIEN ===\n`;
  contenu += `Poste visé : ${poste || 'Non spécifié'}\n`;
  contenu += `Secteur : ${secteur || 'Général'}\n`;
  contenu += `Date de préparation : ${dateJour}\n\n`;

  contenu += `--- QUESTIONS PRÉPARÉES & CONSEILS CIBLÉS ---\n\n`;
  evaluations.forEach((item, index) => {
    contenu += `[Question ${index + 1}] : ${item.question}\n`;
    if (item.reponse) {
      contenu += `Votre réponse préparée :\n"${item.reponse}"\n\n`;
    }
    if (item.evaluation?.points_forts?.length) {
      contenu += `Points forts : ${item.evaluation.points_forts.join(' • ')}\n`;
    }
    if (item.evaluation?.axes_amelioration?.length) {
      contenu += `Points de vigilance : ${item.evaluation.axes_amelioration.join(' • ')}\n`;
    }
    contenu += `\n--------------------------------------------\n\n`;
  });

  contenu += `RAPPELS CLÉS POUR LE JOUR J :\n`;
  contenu += `• Arriver 15 minutes en avance au lieu de l'entretien à Dakar.\n`;
  contenu += `• Se munir de 2 exemplaires imprimés de son CV et d'un carnet de notes.\n`;
  contenu += `• Garder une posture ouverte, écouter jusqu'au bout chaque question avant de répondre.\n`;

  return { titre, contenu };
}

module.exports = {
  getProfilPro,
  upsertProfilPro,
  verifierDroitCv,
  verifierDroitLettre,
  verifierDroitSimulationEntretien,
  getBanqueQuestions,
  evaluerReponseEntretien,
  genererFicheRevisionEntretien,
  incrementerUsage,
  sauvegarderDocumentEmploi,
  getDocumentEmploi,
  listerDocumentsUtilisateur,
  supprimerDocumentEmploi,
  genererPropositionLettre,
  genererPdfBuffer,
  genererPdfStream,
  profilsMemoire,
  documentsMemoire,
  BANQUE_QUESTIONS_ENTRETIEN,
};

