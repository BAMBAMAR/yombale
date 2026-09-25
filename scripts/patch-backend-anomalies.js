const fs = require('fs');
const path = require('path');

// 1. Patch locatif-immo.js
const locatifPath = path.join(__dirname, '../backend/routes/locatif-immo.js');
let locatif = fs.readFileSync(locatifPath, 'utf8');

const oldLocatifFragment = `             CASE
               WHEN bx.proprietaire_id IS NOT NULL AND bx.proprietaire_id IN (
                 SELECT pr.id FROM proprietaires_immo pr
                 WHERE (
                   ($2 != '' AND LOWER(pr.email) = $2)
                   OR ($3 != '' AND RIGHT(REPLACE(REPLACE(pr.telephone, ' ', ''), '+', ''), 9) = $3)
                 )
               ) THEN 'bailleur'
               ELSE 'locataire'
             END AS role_vue
      FROM baux_immo bx
      JOIN biens_immo b ON bx.bien_id = b.id
      JOIN agences_immo a ON bx.agence_id = a.id
      JOIN contacts_immo c ON bx.locataire_id = c.id
      LEFT JOIN proprietaires_immo p ON bx.proprietaire_id = p.id
      WHERE (
        c.utilisateur_id = $1
        OR ($2 != '' AND LOWER(c.email) = $2)
        OR ($3 != '' AND RIGHT(REPLACE(REPLACE(c.telephone, ' ', ''), '+', ''), 9) = $3)
        OR (
          bx.proprietaire_id IS NOT NULL AND bx.proprietaire_id IN (
            SELECT pr.id FROM proprietaires_immo pr
            WHERE (
              ($2 != '' AND LOWER(pr.email) = $2)
              OR ($3 != '' AND RIGHT(REPLACE(REPLACE(pr.telephone, ' ', ''), '+', ''), 9) = $3)
            )
          )
        )
      )`;

const newLocatifFragment = `             CASE
               WHEN COALESCE(bx.proprietaire_id, b.proprietaire_id) IN (
                 SELECT pr.id FROM proprietaires_immo pr
                 WHERE (
                   pr.utilisateur_id = $1
                   OR ($2 != '' AND LOWER(pr.email) = $2)
                   OR ($3 != '' AND RIGHT(REPLACE(REPLACE(pr.telephone, ' ', ''), '+', ''), 9) = $3)
                 )
               ) THEN 'bailleur'
               ELSE 'locataire'
             END AS role_vue
      FROM baux_immo bx
      JOIN biens_immo b ON bx.bien_id = b.id
      JOIN agences_immo a ON bx.agence_id = a.id
      JOIN contacts_immo c ON bx.locataire_id = c.id
      LEFT JOIN proprietaires_immo p ON p.id = COALESCE(bx.proprietaire_id, b.proprietaire_id)
      WHERE (
        c.utilisateur_id = $1
        OR ($2 != '' AND LOWER(c.email) = $2)
        OR ($3 != '' AND RIGHT(REPLACE(REPLACE(c.telephone, ' ', ''), '+', ''), 9) = $3)
        OR (
          COALESCE(bx.proprietaire_id, b.proprietaire_id) IN (
            SELECT pr.id FROM proprietaires_immo pr
            WHERE (
              pr.utilisateur_id = $1
              OR ($2 != '' AND LOWER(pr.email) = $2)
              OR ($3 != '' AND RIGHT(REPLACE(REPLACE(pr.telephone, ' ', ''), '+', ''), 9) = $3)
            )
          )
        )
      )`;

if (locatif.includes(oldLocatifFragment)) {
  locatif = locatif.replace(oldLocatifFragment, newLocatifFragment);
  fs.writeFileSync(locatifPath, locatif, 'utf8');
  console.log('✅ locatif-immo.js patched with COALESCE proprietaire_id matching');
} else {
  console.log('⚠️ oldLocatifFragment not found in locatif-immo.js');
}

// 2. Patch crm-immo.js
const crmPath = path.join(__dirname, '../backend/routes/crm-immo.js');
let crm = fs.readFileSync(crmPath, 'utf8');

// A. Filter actif in GET contacts
if (crm.includes('WHERE c.agence_id = $1')) {
  crm = crm.replace(
    'WHERE c.agence_id = $1',
    "WHERE c.agence_id = $1 AND COALESCE(c.actif, true) = true AND COALESCE(c.statut_crm, '') != 'archive'"
  );
  console.log('✅ crm-immo.js GET /contacts patched to filter archived/inactive');
}

// B. Duplicate check in POST /contacts
const oldPostContact = `    if (!nom || nom.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Le nom du contact est obligatoire.' });
    }`;

const newPostContact = `    if (!nom || nom.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Le nom du contact est obligatoire.' });
    }

    // Anti-doublon par numéro de téléphone dans la même agence
    const cleanPh = telephone ? String(telephone).replace(/\\D/g, '') : '';
    const shortPh = cleanPh.length >= 9 ? cleanPh.slice(-9) : cleanPh;
    if (shortPh && !req.body.forcer_doublon) {
      const { rows: existants } = await pool.query(
        \`SELECT id, nom, prenom, type_contact, telephone 
         FROM contacts_immo 
         WHERE agence_id = $1 AND RIGHT(REPLACE(REPLACE(telephone, ' ', ''), '+', ''), 9) = $2 LIMIT 1\`,
        [agenceId, shortPh]
      );
      if (existants.length > 0) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_CONTACT',
          error: \`Un contact avec ce numéro de téléphone existe déjà (\${existants[0].prenom ? existants[0].prenom + ' ' : ''}\${existants[0].nom}, \${existants[0].type_contact}).\`,
          existant: existants[0]
        });
      }
    }`;

if (crm.includes(oldPostContact)) {
  crm = crm.replace(oldPostContact, newPostContact);
  console.log('✅ crm-immo.js POST /contacts patched with duplicate prevention');
}

// C. Duplicate check in POST /proprietaires
const oldPostProp = `    if (!nom || nom.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Le nom du propriétaire/bailleur est requis.' });
    }`;

const newPostProp = `    if (!nom || nom.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Le nom du propriétaire/bailleur est requis.' });
    }

    // Anti-doublon par numéro de téléphone dans la même agence
    const cleanPhProp = telephone ? String(telephone).replace(/\\D/g, '') : '';
    const shortPhProp = cleanPhProp.length >= 9 ? cleanPhProp.slice(-9) : cleanPhProp;
    if (shortPhProp && !req.body.forcer_doublon) {
      const { rows: existantsProp } = await pool.query(
        \`SELECT id, nom, prenom, telephone 
         FROM proprietaires_immo 
         WHERE agence_id = $1 AND RIGHT(REPLACE(REPLACE(telephone, ' ', ''), '+', ''), 9) = $2 LIMIT 1\`,
        [agenceId, shortPhProp]
      );
      if (existantsProp.length > 0) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_BAILLEUR',
          error: \`Un propriétaire avec ce numéro de téléphone existe déjà (\${existantsProp[0].prenom ? existantsProp[0].prenom + ' ' : ''}\${existantsProp[0].nom}).\`,
          existant: existantsProp[0]
        });
      }
    }`;

if (crm.includes(oldPostProp)) {
  crm = crm.replace(oldPostProp, newPostProp);
  console.log('✅ crm-immo.js POST /proprietaires patched with duplicate prevention');
}

// D. Add DELETE /contacts/:id and batch actions
const deleteContactRoutes = `
// ── DELETE /api/crm-immo/agence/:slugOrId/contacts/:id — Supprimer ou archiver un contact/locataire ──
router.delete('/agence/:slugOrId/contacts/:id', verifierToken, requireAgenceAccess('agent'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { id } = req.params;
    const { mode = 'auto' } = req.query; // 'auto', 'archive', 'force'

    // Vérifier si des baux sont rattachés
    const { rows: baux } = await pool.query(
      \`SELECT COUNT(*) AS total, 
              COUNT(*) FILTER (WHERE statut = 'actif') AS actifs
       FROM baux_immo WHERE locataire_id = $1 AND agence_id = $2\`,
      [id, agenceId]
    );

    const nbBaux = parseInt(baux[0]?.total, 10) || 0;
    const nbActifs = parseInt(baux[0]?.actifs, 10) || 0;

    // Si le locataire a des baux actifs, interdire la suppression physique
    if (nbActifs > 0 && mode !== 'archive') {
      return res.status(400).json({
        success: false,
        error: \`Impossible de supprimer ce locataire : il possède \${nbActifs} bail(s) actif(s) en cours. Résiliez d'abord ses baux.\`,
        code: 'HAS_ACTIVE_LEASES'
      });
    }

    // Si le locataire a un historique de baux passés (même résiliés), basculer en archivé pour préserver l'historique légal et comptable
    if (nbBaux > 0 || mode === 'archive') {
      await pool.query(
        \`UPDATE contacts_immo SET actif = false, statut_crm = 'archive', updated_at = NOW() WHERE id = $1 AND agence_id = $2\`,
        [id, agenceId]
      );
      return res.json({
        success: true,
        message: 'Locataire archivé avec succès. L\\'historique contractuel et les quittances sont préservés.',
        action: 'archived'
      });
    }

    // 0 bail rattaché : suppression physique autorisée
    const { rowCount } = await pool.query(
      \`DELETE FROM contacts_immo WHERE id = $1 AND agence_id = $2\`,
      [id, agenceId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Contact introuvable.' });
    }

    res.json({ success: true, message: 'Contact supprimé définitivement avec succès.', action: 'deleted' });
  } catch (err) {
    console.error('[DELETE /api/crm-immo/agence/:slugOrId/contacts/:id]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression du contact.' });
  }
});

// ── POST /api/crm-immo/agence/:slugOrId/contacts/batch-delete — Suppression ou archivage groupé ──
router.post('/agence/:slugOrId/contacts/batch-delete', verifierToken, requireAgenceAccess('directeur'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Liste d\\'identifiants requise.' });
    }

    let nbSupprimes = 0;
    let nbArchives = 0;

    for (const cId of ids) {
      const { rows: baux } = await pool.query(
        \`SELECT COUNT(*) AS total FROM baux_immo WHERE locataire_id = $1 AND agence_id = $2\`,
        [cId, agenceId]
      );
      if (parseInt(baux[0]?.total, 10) > 0) {
        await pool.query(
          \`UPDATE contacts_immo SET actif = false, statut_crm = 'archive', updated_at = NOW() WHERE id = $1 AND agence_id = $2\`,
          [cId, agenceId]
        );
        nbArchives++;
      } else {
        await pool.query(\`DELETE FROM contacts_immo WHERE id = $1 AND agence_id = $2\`, [cId, agenceId]);
        nbSupprimes++;
      }
    }

    res.json({
      success: true,
      message: \`Traitement terminé : \${nbSupprimes} supprimé(s), \${nbArchives} archivé(s).\`,
      nbSupprimes,
      nbArchives
    });
  } catch (err) {
    console.error('[POST /contacts/batch-delete]', err.message);
    res.status(500).json({ success: false, error: 'Erreur suppression groupée contacts.' });
  }
});

// ── POST /api/crm-immo/agence/:slugOrId/proprietaires/batch-delete — Suppression ou archivage groupé bailleurs ──
router.post('/agence/:slugOrId/proprietaires/batch-delete', verifierToken, requireAgenceAccess('directeur'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Liste d\\'identifiants requise.' });
    }

    let nbSupprimes = 0;
    let nbArchives = 0;

    for (const pId of ids) {
      const { rows: biens } = await pool.query(
        \`SELECT COUNT(*) AS total FROM biens_immo WHERE proprietaire_id = $1 AND agence_id = $2\`,
        [pId, agenceId]
      );
      if (parseInt(biens[0]?.total, 10) > 0) {
        await pool.query(
          \`UPDATE proprietaires_immo SET actif = false, updated_at = NOW() WHERE id = $1 AND agence_id = $2\`,
          [pId, agenceId]
        );
        nbArchives++;
      } else {
        await pool.query(\`DELETE FROM proprietaires_immo WHERE id = $1 AND agence_id = $2\`, [pId, agenceId]);
        nbSupprimes++;
      }
    }

    res.json({
      success: true,
      message: \`Traitement terminé : \${nbSupprimes} bailleur(s) supprimé(s), \${nbArchives} archivé(s).\`,
      nbSupprimes,
      nbArchives
    });
  } catch (err) {
    console.error('[POST /proprietaires/batch-delete]', err.message);
    res.status(500).json({ success: false, error: 'Erreur suppression groupée bailleurs.' });
  }
});
`;

// Insert delete routes right before module.exports
if (!crm.includes('/contacts/batch-delete')) {
  crm = crm.replace('module.exports = router;', deleteContactRoutes + '\nmodule.exports = router;');
  console.log('✅ crm-immo.js patched with DELETE contact and batch delete routes');
}

fs.writeFileSync(crmPath, crm, 'utf8');
console.log('All backend route patches applied successfully.');
