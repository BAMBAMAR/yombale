// backend/routes/admin-surga.js
// Routeur d'administration complète de Surga — Tout dynamique et administrable
// Gère en direct : Bonnes Adresses, Concours Nationaux, Kiosque des Unes, Modération Trafic

const router = require('express').Router();
let pool = null;
try {
  pool = require('../models/db').pool;
} catch {
  try {
    pool = require('../db');
  } catch {
    // Mode offline / test
  }
}

const { requireAdminAuth, requireAdminRole } = require('../middlewares/admin-rbac');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

// Protection RBAC obligatoire
router.use(requireAdminAuth);
router.use(requireAdminRole('super_admin', 'admin_operationnel', 'moderateur'));

// ─────────────────────────────────────────────────────────────────────────────
// 1. STATISTIQUES GLOBALES SURGA
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        stats: {
          nb_places: 0,
          nb_concours: 0,
          nb_unes: 0,
          nb_signalements_attente: 0,
        },
      });
    }

    const [placesRes, concoursRes, unesRes, signalementsRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM surga_places WHERE actif = true`).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query(`SELECT COUNT(*)::int AS count FROM surga_concours WHERE actif = true`).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query(`SELECT COUNT(*)::int AS count FROM surga_unes_presse`).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query(`SELECT COUNT(*)::int AS count FROM surga_trafic_signalements WHERE statut = 'en_attente'`).catch(() => ({ rows: [{ count: 0 }] })),
    ]);

    res.json({
      success: true,
      stats: {
        nb_places: placesRes.rows[0]?.count || 0,
        nb_concours: concoursRes.rows[0]?.count || 0,
        nb_unes: unesRes.rows[0]?.count || 0,
        nb_signalements_attente: signalementsRes.rows[0]?.count || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. BONNES ADRESSES & BONS PLANS (surga_places)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/places', async (req, res) => {
  try {
    const { q, categorie, quartier, actif, page = 1, limit = 50 } = req.query;
    const l = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const offset = (Math.max(1, parseInt(page) || 1) - 1) * l;

    if (!pool) {
      const placesDemo = require('../services/surga/places-service').PLACES_DAKAR_DEMO || [];
      return res.json({ success: true, places: placesDemo, total: placesDemo.length, page: 1 });
    }

    const conds = [];
    const vals = [];
    let i = 1;

    if (categorie && categorie !== 'tous') {
      conds.push(`categorie = $${i}`);
      vals.push(categorie);
      i++;
    }
    if (quartier && quartier !== 'Tous les quartiers') {
      conds.push(`quartier ILIKE $${i}`);
      vals.push(`%${quartier}%`);
      i++;
    }
    if (actif !== undefined && actif !== '') {
      conds.push(`actif = $${i}`);
      vals.push(actif === 'true');
      i++;
    }
    if (q && q.trim()) {
      conds.push(`(nom ILIKE $${i} OR specialite ILIKE $${i} OR resume_honnete ILIKE $${i} OR quartier ILIKE $${i})`);
      vals.push(`%${q.trim()}%`);
      i++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM surga_places ${where}`, vals);
    const { rows } = await pool.query(
      `SELECT * FROM surga_places ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, l, offset]
    );

    res.json({
      success: true,
      places: rows,
      total: countRes.rows[0]?.total || 0,
      page: parseInt(page) || 1,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/places', async (req, res) => {
  try {
    const {
      nom,
      categorie,
      quartier,
      ville = 'Dakar',
      adresse,
      budget_moyen_xof = 5000,
      fourchette_prix = '€€',
      tags_ambiance = [],
      specialite,
      note_moyenne = 4.5,
      nb_avis = 10,
      resume_honnete,
      contact_tel,
      contact_whatsapp,
      horaires,
      photos = [],
      verifie = true,
      actif = true,
    } = req.body;

    if (!nom || !categorie || !quartier || !resume_honnete || !specialite) {
      return res.status(400).json({ success: false, error: 'Champs obligatoires manquants (nom, catégorie, quartier, spécialité, résumé honnête)' });
    }

    const id = `place-${Date.now()}`;
    const slug = `${nom.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${quartier.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    if (!pool) {
      return res.json({ success: true, place: { id, slug, ...req.body } });
    }

    const insertRes = await pool.query(
      `INSERT INTO surga_places (
        id, slug, nom, categorie, quartier, ville, adresse, budget_moyen_xof,
        fourchette_prix, tags_ambiance, specialite, note_moyenne, nb_avis,
        resume_honnete, contact_tel, contact_whatsapp, horaires, photos, verifie, actif
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING *`,
      [
        id,
        slug,
        nom.trim(),
        categorie,
        quartier.trim(),
        ville,
        adresse || quartier,
        parseInt(budget_moyen_xof) || 0,
        fourchette_prix,
        JSON.stringify(tags_ambiance),
        specialite.trim(),
        parseFloat(note_moyenne) || 4.5,
        parseInt(nb_avis) || 10,
        resume_honnete.trim(),
        contact_tel || null,
        contact_whatsapp || null,
        horaires || null,
        JSON.stringify(photos),
        Boolean(verifie),
        Boolean(actif),
      ]
    );

    if (enregistrerAdminLog) {
      enregistrerAdminLog(req, 'surga_place_creee', { id, nom });
    }

    res.json({ success: true, place: insertRes.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/places/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nom,
      categorie,
      quartier,
      ville,
      adresse,
      budget_moyen_xof,
      fourchette_prix,
      tags_ambiance,
      specialite,
      note_moyenne,
      nb_avis,
      resume_honnete,
      contact_tel,
      contact_whatsapp,
      horaires,
      photos,
      verifie,
      actif,
    } = req.body;

    if (!pool) {
      return res.json({ success: true, place: { id, ...req.body } });
    }

    const updateRes = await pool.query(
      `UPDATE surga_places SET
        nom = COALESCE($1, nom),
        categorie = COALESCE($2, categorie),
        quartier = COALESCE($3, quartier),
        ville = COALESCE($4, ville),
        adresse = COALESCE($5, adresse),
        budget_moyen_xof = COALESCE($6, budget_moyen_xof),
        fourchette_prix = COALESCE($7, fourchette_prix),
        tags_ambiance = CASE WHEN $8::text IS NOT NULL THEN $8::jsonb ELSE tags_ambiance END,
        specialite = COALESCE($9, specialite),
        note_moyenne = COALESCE($10, note_moyenne),
        nb_avis = COALESCE($11, nb_avis),
        resume_honnete = COALESCE($12, resume_honnete),
        contact_tel = COALESCE($13, contact_tel),
        contact_whatsapp = COALESCE($14, contact_whatsapp),
        horaires = COALESCE($15, horaires),
        photos = CASE WHEN $16::text IS NOT NULL THEN $16::jsonb ELSE photos END,
        verifie = COALESCE($17, verifie),
        actif = COALESCE($18, actif),
        updated_at = NOW()
      WHERE id = $19
      RETURNING *`,
      [
        nom ? nom.trim() : null,
        categorie || null,
        quartier ? quartier.trim() : null,
        ville || null,
        adresse || null,
        budget_moyen_xof !== undefined ? parseInt(budget_moyen_xof) : null,
        fourchette_prix || null,
        tags_ambiance ? JSON.stringify(tags_ambiance) : null,
        specialite ? specialite.trim() : null,
        note_moyenne !== undefined ? parseFloat(note_moyenne) : null,
        nb_avis !== undefined ? parseInt(nb_avis) : null,
        resume_honnete ? resume_honnete.trim() : null,
        contact_tel || null,
        contact_whatsapp || null,
        horaires || null,
        photos ? JSON.stringify(photos) : null,
        verifie !== undefined ? Boolean(verifie) : null,
        actif !== undefined ? Boolean(actif) : null,
        id,
      ]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Adresse introuvable' });
    }

    res.json({ success: true, place: updateRes.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/places/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (pool) {
      await pool.query(`DELETE FROM surga_places WHERE id = $1`, [id]);
    }
    res.json({ success: true, message: 'Adresse supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. CONCOURS & EXAMENS DU SÉNÉGAL (surga_concours)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/concours', async (req, res) => {
  try {
    const { statut, categorie, q } = req.query;

    if (!pool) {
      const concoursDemo = require('../services/surga/concours-service').CONCOURS_SENEGAL_DEMO || [];
      return res.json({ success: true, concours: concoursDemo, total: concoursDemo.length });
    }

    const conds = [];
    const vals = [];
    let i = 1;

    if (statut && statut !== 'tous') {
      conds.push(`statut = $${i}`);
      vals.push(statut);
      i++;
    }
    if (categorie && categorie !== 'tous') {
      conds.push(`categorie = $${i}`);
      vals.push(categorie);
      i++;
    }
    if (q && q.trim()) {
      conds.push(`(titre ILIKE $${i} OR organisme ILIKE $${i} OR sigle ILIKE $${i})`);
      vals.push(`%${q.trim()}%`);
      i++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT * FROM surga_concours ${where} ORDER BY date_cloture ASC`,
      vals
    );

    res.json({ success: true, concours: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/concours', async (req, res) => {
  try {
    const {
      titre,
      sigle,
      organisme,
      categorie,
      niveau_requis,
      age_max,
      frais_dossier_xof = 5000,
      statut = 'ouvert',
      date_ouverture,
      date_cloture,
      date_epreuves,
      pieces_a_fournir = [],
      centres_prepa = [],
      description,
      lien_officiel,
    } = req.body;

    if (!titre || !organisme || !categorie || !date_cloture) {
      return res.status(400).json({ success: false, error: 'Titre, organisme, catégorie et date de clôture sont obligatoires' });
    }

    const id = `concours-${Date.now()}`;
    const slug = (sigle || titre).toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (!pool) {
      return res.json({ success: true, concours: { id, slug, ...req.body } });
    }

    const insertRes = await pool.query(
      `INSERT INTO surga_concours (
        id, slug, titre, sigle, organisme, categorie, niveau_requis, age_max,
        frais_dossier_xof, statut, date_ouverture, date_cloture, date_epreuves,
        pieces_a_fournir, centres_prepa, description, lien_officiel
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *`,
      [
        id,
        slug,
        titre.trim(),
        sigle ? sigle.trim().toUpperCase() : null,
        organisme.trim(),
        categorie,
        niveau_requis || 'Baccalauréat',
        age_max ? parseInt(age_max) : null,
        parseInt(frais_dossier_xof) || 0,
        statut,
        date_ouverture || new Date().toISOString().slice(0, 10),
        date_cloture,
        date_epreuves || null,
        JSON.stringify(pieces_a_fournir),
        JSON.stringify(centres_prepa),
        description || '',
        lien_officiel || '',
      ]
    );

    res.json({ success: true, concours: insertRes.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/concours/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titre,
      sigle,
      organisme,
      categorie,
      niveau_requis,
      age_max,
      frais_dossier_xof,
      statut,
      date_ouverture,
      date_cloture,
      date_epreuves,
      pieces_a_fournir,
      centres_prepa,
      description,
      lien_officiel,
    } = req.body;

    if (!pool) {
      return res.json({ success: true, concours: { id, ...req.body } });
    }

    const updateRes = await pool.query(
      `UPDATE surga_concours SET
        titre = COALESCE($1, titre),
        sigle = COALESCE($2, sigle),
        organisme = COALESCE($3, organisme),
        categorie = COALESCE($4, categorie),
        niveau_requis = COALESCE($5, niveau_requis),
        age_max = COALESCE($6, age_max),
        frais_dossier_xof = COALESCE($7, frais_dossier_xof),
        statut = COALESCE($8, statut),
        date_ouverture = COALESCE($9, date_ouverture),
        date_cloture = COALESCE($10, date_cloture),
        date_epreuves = COALESCE($11, date_epreuves),
        pieces_a_fournir = CASE WHEN $12::text IS NOT NULL THEN $12::jsonb ELSE pieces_a_fournir END,
        centres_prepa = CASE WHEN $13::text IS NOT NULL THEN $13::jsonb ELSE centres_prepa END,
        description = COALESCE($14, description),
        lien_officiel = COALESCE($15, lien_officiel),
        updated_at = NOW()
      WHERE id = $16
      RETURNING *`,
      [
        titre ? titre.trim() : null,
        sigle ? sigle.trim().toUpperCase() : null,
        organisme ? organisme.trim() : null,
        categorie || null,
        niveau_requis || null,
        age_max !== undefined ? parseInt(age_max) : null,
        frais_dossier_xof !== undefined ? parseInt(frais_dossier_xof) : null,
        statut || null,
        date_ouverture || null,
        date_cloture || null,
        date_epreuves || null,
        pieces_a_fournir ? JSON.stringify(pieces_a_fournir) : null,
        centres_prepa ? JSON.stringify(centres_prepa) : null,
        description || null,
        lien_officiel || null,
        id,
      ]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Concours introuvable' });
    }

    res.json({ success: true, concours: updateRes.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/concours/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (pool) {
      await pool.query(`DELETE FROM surga_concours WHERE id = $1`, [id]);
    }
    res.json({ success: true, message: 'Concours supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. KIOSQUE DES UNES DE LA PRESSE (surga_unes_presse)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/unes', async (req, res) => {
  try {
    const { date, journal } = req.query;

    if (!pool) {
      const unesDemo = (require('../services/surga/kiosque-service').UNES_DEFAUT || []).map((u, i) => ({
        id: `demo-${i}`,
        ...u,
        url_image: u.image_url,
      }));
      return res.json({ success: true, unes: unesDemo, total: unesDemo.length });
    }

    const conds = [];
    const vals = [];
    let i = 1;

    if (date) {
      conds.push(`date_parution = $${i}`);
      vals.push(date);
      i++;
    }
    if (journal) {
      conds.push(`nom_journal ILIKE $${i}`);
      vals.push(`%${journal}%`);
      i++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT id, nom_journal, date_parution, image_url, description, created_at
       FROM surga_unes_presse ${where}
       ORDER BY date_parution DESC, nom_journal ASC`,
      vals
    );

    const unesNormalisees = rows.map((r) => ({
      ...r,
      url_image: r.image_url,
      titre_principal: r.description || '',
    }));

    res.json({ success: true, unes: unesNormalisees, total: unesNormalisees.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/unes', async (req, res) => {
  try {
    const {
      nom_journal,
      date_parution,
      url_image,
      image_url,
      titre_principal = '',
      description_courte = '',
      description = '',
    } = req.body;

    const imageUrlFinale = (image_url || url_image || '').trim();
    if (!nom_journal || !imageUrlFinale) {
      return res.status(400).json({ success: false, error: 'Nom du journal et URL de la photo obligatoires' });
    }

    const dateParutionCalculee = date_parution || new Date().toISOString().slice(0, 10);
    const descFinale = (description || titre_principal || description_courte || '').trim();

    if (!pool) {
      return res.json({
        success: true,
        une: {
          id: `une-${Date.now()}`,
          nom_journal,
          date_parution: dateParutionCalculee,
          image_url: imageUrlFinale,
          url_image: imageUrlFinale,
          description: descFinale,
        },
      });
    }

    // Vérifier si une entrée existe déjà pour ce journal à cette date
    const checkExistant = await pool.query(
      `SELECT id FROM surga_unes_presse WHERE nom_journal = $1 AND date_parution = $2 LIMIT 1`,
      [nom_journal.trim(), dateParutionCalculee]
    );

    let row;
    if (checkExistant.rows.length > 0) {
      const updateRes = await pool.query(
        `UPDATE surga_unes_presse
         SET image_url = $1, description = $2, created_at = NOW()
         WHERE id = $3
         RETURNING id, nom_journal, date_parution, image_url, description, created_at`,
        [imageUrlFinale, descFinale, checkExistant.rows[0].id]
      );
      row = updateRes.rows[0];
    } else {
      const insertRes = await pool.query(
        `INSERT INTO surga_unes_presse (nom_journal, date_parution, image_url, description)
         VALUES ($1, $2, $3, $4)
         RETURNING id, nom_journal, date_parution, image_url, description, created_at`,
        [nom_journal.trim(), dateParutionCalculee, imageUrlFinale, descFinale]
      );
      row = insertRes.rows[0];
    }

    res.json({
      success: true,
      une: {
        ...row,
        url_image: row.image_url,
        titre_principal: row.description,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/unes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (pool) {
      await pool.query(`DELETE FROM surga_unes_presse WHERE id = $1`, [id]);
    }
    res.json({ success: true, message: 'Une de presse supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. MODÉRATION DU TRAFIC & SIGNALEMENTS (surga_trafic_signalements)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/signalements', async (req, res) => {
  try {
    const { statut } = req.query;

    if (!pool) {
      return res.json({ success: true, signalements: [], total: 0 });
    }

    const conds = [];
    const vals = [];
    let i = 1;

    if (statut && statut !== 'tous') {
      conds.push(`statut = $${i}`);
      vals.push(statut);
      i++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT s.*, u.nom AS utilisateur_nom, u.telephone AS utilisateur_tel
       FROM surga_trafic_signalements s
       LEFT JOIN utilisateurs u ON u.id = s.utilisateur_id
       ${where}
       ORDER BY s.created_at DESC
       LIMIT 100`,
      vals
    );

    res.json({ success: true, signalements: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/signalements/:id/statut', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body; // 'valide', 'rejete'

    if (!['valide', 'rejete', 'en_attente'].includes(statut)) {
      return res.status(400).json({ success: false, error: 'Statut invalide' });
    }

    if (!pool) {
      return res.json({ success: true, signalement: { id, statut } });
    }

    const updateRes = await pool.query(
      `UPDATE surga_trafic_signalements SET statut = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [statut, id]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Signalement introuvable' });
    }

    res.json({ success: true, signalement: updateRes.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/signalements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (pool) {
      await pool.query(`DELETE FROM surga_trafic_signalements WHERE id = $1`, [id]);
    }
    res.json({ success: true, message: 'Signalement supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ABONNEMENTS & GESTION FINANCIÈRE (Tranche 15)
// ==========================================
const {
  getStatistiquesFinancieresAdmin,
  listerAbonnementsAdmin,
  getCataloguePlansAsync,
  mettreAJourPlan,
  creerPlan,
  supprimerPlan,
} = require('../services/surga/abonnement-service');

router.get('/abonnements', async (req, res) => {
  try {
    const { page = 1, limit = 20, statut, plan } = req.query;

    if (!pool) {
      return res.json({
        success: true,
        stats: {
          abonnementsActifs: 0,
          enAttente: 0,
          mrrEstimeXof: 0,
          volumeEncaisseXof: 0,
        },
        repartition: [],
        abonnements: [],
        total: 0,
      });
    }

    const statsFin = await getStatistiquesFinancieresAdmin();
    const liste = await listerAbonnementsAdmin({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      statut,
      plan,
    });

    res.json({
      success: true,
      stats: statsFin.kpis,
      repartition: statsFin.repartition,
      ...liste,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/abonnements/:id/statut', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['actif', 'en_attente', 'expire', 'resilie'].includes(statut)) {
      return res.status(400).json({ success: false, error: 'Statut invalide' });
    }

    if (!pool) {
      return res.json({ success: true, abonnement: { id, statut } });
    }

    const updateRes = await pool.query(
      `UPDATE surga_abonnements SET statut = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [statut, id]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Abonnement introuvable' });
    }

    res.json({ success: true, abonnement: updateRes.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// GESTION DES PLANS & TARIFICATION DYNAMIQUE
// ==========================================
router.get('/plans', async (req, res) => {
  try {
    const plans = await getCataloguePlansAsync();
    res.json({ success: true, plans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/plans', async (req, res) => {
  try {
    const { id, nom, type, description, tarifMensuel, tarifAnnuel, avantages, badgePromo } = req.body;
    if (!nom || tarifMensuel === undefined || tarifAnnuel === undefined) {
      return res.status(400).json({ success: false, error: 'Nom, tarif mensuel et tarif annuel requis.' });
    }
    const nouveauPlan = await creerPlan({ id, nom, type, description, tarifMensuel, tarifAnnuel, avantages, badgePromo });
    res.json({ success: true, plan: nouveauPlan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description, tarifMensuel, tarifAnnuel, avantages, actif, badgePromo } = req.body;
    const planModifie = await mettreAJourPlan(id, { nom, description, tarifMensuel, tarifAnnuel, avantages, actif, badgePromo });
    res.json({ success: true, plan: planModifie });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await supprimerPlan(id);
    res.json({ success: true, message: 'Plan désactivé avec succès.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// GESTION DES COMPTES & UTILISATEURS SURGA
// ==========================================
router.get('/utilisateurs', async (req, res) => {
  try {
    const { page = 1, limit = 20, q = '', statut = '' } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    if (!pool) {
      return res.json({
        success: true,
        total: 2,
        page: 1,
        limit: 20,
        utilisateurs: [
          {
            id: 'mock-user-1',
            nom_complet: 'Bamba Mar (VIP Testeur)',
            telephone: '+221 77 123 45 67',
            email: 'bamba@surga.sn',
            statut: 'actif',
            created_at: new Date().toISOString(),
            plan_actif: 'b2c_premium',
            echeance_plan: new Date(Date.now() + 30 * 86400000).toISOString(),
            quota_vocal_utilise: 4,
            quartier_prefere: 'Dakar Plateau',
          },
          {
            id: 'mock-user-2',
            nom_complet: 'Aïssatou Sow (Utilisatrice)',
            telephone: '+221 78 456 78 90',
            email: 'aissatou@gmail.com',
            statut: 'actif',
            created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
            plan_actif: null,
            echeance_plan: null,
            quota_vocal_utilise: 12,
            quartier_prefere: 'Almadies',
          },
        ],
      });
    }

    const conditions = [];
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(u.nom_complet ILIKE $${params.length} OR u.telephone ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }

    if (statut === 'premium') {
      conditions.push(`EXISTS (SELECT 1 FROM surga_abonnements a WHERE (a.user_id = u.id OR (a.phone IS NOT NULL AND u.telephone IS NOT NULL AND a.phone = u.telephone)) AND a.statut = 'actif' AND a.fin > NOW())`);
    } else if (statut === 'freemium') {
      conditions.push(`NOT EXISTS (SELECT 1 FROM surga_abonnements a WHERE (a.user_id = u.id OR (a.phone IS NOT NULL AND u.telephone IS NOT NULL AND a.phone = u.telephone)) AND a.statut = 'actif' AND a.fin > NOW())`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*)::int as count FROM utilisateurs u ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.count || 0;

    params.push(parseInt(limit, 10), offset);
    const query = `
      SELECT
        u.id, u.nom_complet, u.telephone, u.email, u.created_at,
        p.quartier as quartier_prefere, p.heure_briefing, p.equipe_sport,
        (
          SELECT a.plan
          FROM surga_abonnements a
          WHERE (a.user_id = u.id OR (a.phone IS NOT NULL AND u.telephone IS NOT NULL AND a.phone = u.telephone))
            AND a.statut = 'actif' AND a.fin > NOW()
          ORDER BY a.fin DESC LIMIT 1
        ) as plan_actif,
        (
          SELECT a.fin
          FROM surga_abonnements a
          WHERE (a.user_id = u.id OR (a.phone IS NOT NULL AND u.telephone IS NOT NULL AND a.phone = u.telephone))
            AND a.statut = 'actif' AND a.fin > NOW()
          ORDER BY a.fin DESC LIMIT 1
        ) as echeance_plan,
        COALESCE(
          (SELECT q.nb_requetes FROM surga_quotas q WHERE (q.user_id = u.id OR q.phone = u.telephone) AND q.date_jour = CURRENT_DATE LIMIT 1),
          0
        ) as quota_vocal_utilise
      FROM utilisateurs u
      LEFT JOIN surga_preferences p ON u.id = p.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      utilisateurs: rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/utilisateurs/:id/premium', async (req, res) => {
  try {
    const { id } = req.params;
    const { action = 'accorder', mois = 1, plan = 'b2c_premium' } = req.body;

    if (!pool) {
      return res.json({ success: true, message: 'Statut Premium mis à jour avec succès (mode local).' });
    }

    if (action === 'revoquer') {
      await pool.query(
        `UPDATE surga_abonnements SET statut = 'resilie', updated_at = NOW() WHERE user_id = $1 AND statut = 'actif'`,
        [id]
      );
      return res.json({ success: true, message: 'Abonnement révoqué avec succès.' });
    }

    const { rows: userRows } = await pool.query(`SELECT id, telephone FROM utilisateurs WHERE id = $1`, [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
    }

    const user = userRows[0];
    const debut = new Date();
    const fin = new Date(debut.getTime() + mois * 30 * 86400000);
    const ref = `SURGA-VIP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

    await pool.query(
      `INSERT INTO surga_abonnements (
         user_id, phone, plan, cycle, montant_xof, provider, statut, reference_paiement, debut, fin
       ) VALUES ($1, $2, $3, $4, 0, 'admin_vip', 'actif', $5, $6, $7)`,
      [id, user.telephone, plan, mois >= 12 ? 'annuel' : 'mensuel', ref, debut, fin]
    );

    res.json({ success: true, message: `Accès Premium accordé pour ${mois} mois.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/utilisateurs/:id/reset-quota', async (req, res) => {
  try {
    const { id } = req.params;
    if (pool) {
      await pool.query(`DELETE FROM surga_quotas WHERE user_id = $1 AND date_jour = CURRENT_DATE`, [id]);
    }
    res.json({ success: true, message: 'Quota vocal journalier réinitialisé à zéro.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// RÉSEAUX SOCIAUX & CANAUX DE DIFFUSION
// ==========================================
let canauxMemoire = {
  whatsapp_numero: '+221 77 845 00 00',
  whatsapp_statut: 'connecte',
  telegram_channel: 'https://t.me/surga_senegal',
  facebook_page: 'https://facebook.com/surga.sn',
  instagram_compte: 'https://instagram.com/surga.sn',
  twitter_compte: 'https://x.com/surga_sn',
  tiktok_compte: 'https://tiktok.com/@surga.sn',
  templates_messages: {
    bienvenue: "As-salamu alaykum ! Je suis Surga, votre assistant personnel de poche au Sénégal. Comment puis-je vous aider aujourd'hui ?",
    briefing_matin: "Bonjour ! Voici votre briefing Surga du jour avec la météo, le trafic et l'essentiel de l'actualité.",
    alerte_concours: "Rappel officiel Surga : le concours auquel vous participez a une échéance proche.",
    alerte_trafic: "Alerte circulation Dakar : perturbation majeure signalée sur votre axe habituel."
  }
};

router.get('/canaux', (req, res) => {
  res.json({ success: true, canaux: canauxMemoire });
});

router.put('/canaux', (req, res) => {
  try {
    const updates = req.body;
    canauxMemoire = {
      ...canauxMemoire,
      ...updates,
      templates_messages: {
        ...canauxMemoire.templates_messages,
        ...(updates.templates_messages || {})
      }
    };
    res.json({ success: true, canaux: canauxMemoire });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/canaux/test-whatsapp', (req, res) => {
  try {
    const { telephone, message } = req.body;
    if (!telephone) {
      return res.status(400).json({ success: false, error: 'Numéro de téléphone requis.' });
    }
    // Simulation / déclenchement de message de test
    res.json({
      success: true,
      message: `Message de test transmis avec succès vers ${telephone}.`,
      contenu: message || canauxMemoire.templates_messages.bienvenue
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

