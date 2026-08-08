const path = require('path');
require('dotenv').config();
const { pool } = require(path.resolve(__dirname, '../backend/models/db'));

async function runAudit() {
  try {
    console.log("=================================================");
    console.log(" AUDIT COMPLET DU NOMBRE DE BOUTIQUES PAR COMPTE ");
    console.log("=================================================\n");

    // 1. All users owning boutiques
    const distQuery = `
      SELECT 
        b.utilisateur_id as user_id,
        u.nom,
        u.email,
        u.telephone,
        COUNT(b.id)::int as nb_boutiques,
        ARRAY_AGG(b.nom) as boutiques_noms,
        ARRAY_AGG(b.id) as boutiques_ids
      FROM boutiques b
      LEFT JOIN utilisateurs u ON b.utilisateur_id = u.id
      GROUP BY b.utilisateur_id, u.nom, u.email, u.telephone
      ORDER BY nb_boutiques DESC;
    `;
    const distRes = await pool.query(distQuery);
    
    console.log("=== 1. DETAIL DES COMPTES ET DE LEURS BOUTIQUES POSSÉDÉES ===");
    distRes.rows.forEach((row, idx) => {
      console.log(`[${idx + 1}] Utilisateur ID: ${row.user_id}`);
      console.log(`    Nom: ${row.nom || 'N/A'}`);
      console.log(`    Email: ${row.email || 'N/A'}`);
      console.log(`    Téléphone: ${row.telephone || 'N/A'}`);
      console.log(`    Nombre de boutiques: ${row.nb_boutiques}`);
      console.log(`    Boutiques: ${row.boutiques_noms ? row.boutiques_noms.join(', ') : 'Aucune'}`);
      console.log('--------------------------------------------------');
    });

    // 2. Statistique de la distribution
    const statsQuery = `
      WITH counts AS (
        SELECT utilisateur_id, COUNT(*)::int as qty
        FROM boutiques
        GROUP BY utilisateur_id
      )
      SELECT 
        qty as nb_boutiques_possedees,
        COUNT(*)::int as nombre_de_comptes
      FROM counts
      GROUP BY qty
      ORDER BY qty ASC;
    `;
    const statsRes = await pool.query(statsQuery);
    console.log("\n=== 2. TABLEAU DE RÉPARTITION STATISTIQUE ===");
    console.table(statsRes.rows);

    // 3. Roles et accès délégués via boutique_utilisateurs
    const buDistQuery = `
      SELECT 
        bu.utilisateur_id,
        u.nom,
        u.email,
        COUNT(DISTINCT bu.boutique_id)::int as nb_boutiques_associees,
        ARRAY_AGG(DISTINCT bu.role) as roles
      FROM boutique_utilisateurs bu
      LEFT JOIN utilisateurs u ON bu.utilisateur_id = u.id
      GROUP BY bu.utilisateur_id, u.nom, u.email
      ORDER BY nb_boutiques_associees DESC;
    `;
    const buDistRes = await pool.query(buDistQuery);
    console.log("\n=== 3. ACCÈS DÉLÉGUÉS VIA BOUTIQUE_UTILISATEURS ===");
    console.table(buDistRes.rows.map(r => ({
      utilisateur_id: r.utilisateur_id,
      nom: r.nom || 'N/A',
      email: r.email || 'N/A',
      nb_boutiques_associees: r.nb_boutiques_associees,
      roles: (r.roles || []).join(', ')
    })));

    // 4. Accounts breakdown metrics
    const totalUsersRes = await pool.query('SELECT COUNT(*)::int as total FROM utilisateurs');
    const totalBoutiquesRes = await pool.query('SELECT COUNT(*)::int as total FROM boutiques');
    const noBoutiqueRes = await pool.query(`
      SELECT COUNT(*)::int as sans_boutique
      FROM utilisateurs u
      LEFT JOIN boutiques b ON u.id = b.utilisateur_id
      WHERE b.id IS NULL;
    `);

    const totalUsers = totalUsersRes.rows[0].total;
    const totalBoutiques = totalBoutiquesRes.rows[0].total;
    const usersWithoutBoutiques = noBoutiqueRes.rows[0].sans_boutique;
    const usersWithBoutiques = distRes.rows.filter(r => r.email).length;
    const orphanBoutiquesCount = distRes.rows.filter(r => !r.email).reduce((acc, r) => acc + r.nb_boutiques, 0);

    console.log("\n=== 4. MÉTRIQUES ET SYNTHÈSE ===");
    console.log(`- Nombre total d'utilisateurs inscrits  : ${totalUsers}`);
    console.log(`- Nombre total de boutiques créées       : ${totalBoutiques}`);
    console.log(`- Nombre de comptes propriétaires        : ${usersWithBoutiques} (${((usersWithBoutiques/totalUsers)*100).toFixed(1)}% des utilisateurs)`);
    console.log(`- Nombre de comptes sans aucune boutique : ${usersWithoutBoutiques} (${((usersWithoutBoutiques/totalUsers)*100).toFixed(1)}% des utilisateurs)`);
    console.log(`- Boutiques orphelines (utilisateur non trouvé) : ${orphanBoutiquesCount}`);

    // 5. Audit Abonnements
    const abonnementsRes = await pool.query(`
      SELECT 
        a.id as abonnement_id,
        a.utilisateur_id,
        u.email,
        u.nom,
        a.plan,
        a.statut,
        a.prix_mensuel,
        a.debut,
        a.fin,
        a.created_at
      FROM abonnements a
      LEFT JOIN utilisateurs u ON a.utilisateur_id = u.id
      ORDER BY a.created_at DESC;
    `);
    console.log("\n=== 5. ABONNEMENTS REGISTRÉS PAR COMPTE ===");
    console.table(abonnementsRes.rows);

  } catch (err) {
    console.error("Erreur durant l'audit :", err);
  } finally {
    await pool.end();
  }
}

runAudit();
