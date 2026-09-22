import 'dotenv/config'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  const q = async (sql) => (await pool.query(sql)).rows

  console.log('=== USERS ===', await q(`SELECT COUNT(*) as total, 
                              COUNT(*) FILTER (WHERE email_verifie=true) as email_verifies,
                              COUNT(*) FILTER (WHERE est_apporteur=true) as apporteurs 
                       FROM utilisateurs`))

  console.log('=== BOUTIQUES ===', await q(`SELECT COUNT(*) as total, 
                              COUNT(*) FILTER (WHERE actif=true) as actives, 
                              COUNT(*) FILTER (WHERE sponsorise=true) as sponsorisees 
                       FROM boutiques`))

  console.log('=== AGENCES ===', await q(`SELECT COUNT(*) as total, 
                              COUNT(*) FILTER (WHERE statut='actif') as actives, 
                              COUNT(*) FILTER (WHERE sponsorise=true) as sponsorisees, 
                              COUNT(*) FILTER (WHERE abonnement_plan='immo_pro') as immo_pro, 
                              COUNT(*) FILTER (WHERE abonnement_plan='essentiel' OR abonnement_plan='immo_essentiel') as essentiel 
                       FROM agences_immo`))

  console.log('=== PLANS TABLE ===', await q(`SELECT slug, label, prix_mensuel, actif, categorie, limites FROM plans ORDER BY ordre`))

  console.log('=== ABONNEMENTS GROUPED ===', await q(`SELECT plan, statut, COALESCE(is_trial, false) as is_trial, 
                              COUNT(*) as nb, 
                              SUM(prix_mensuel) as sum_prix, 
                              COUNT(*) FILTER (WHERE fin > NOW()) as non_expires 
                       FROM abonnements 
                       GROUP BY plan, statut, is_trial 
                       ORDER BY plan, statut`))

  console.log('=== COMMANDES TABLE (PAIEMENTS REUSSIS) ===', await q(`SELECT 
    COUNT(*) as total_payees, 
    COALESCE(SUM(montant), 0) as total_montant,
    COUNT(*) FILTER (WHERE reference LIKE 'ann_%') as annonces_count,
    COALESCE(SUM(montant) FILTER (WHERE reference LIKE 'ann_%'), 0) as annonces_montant,
    COUNT(*) FILTER (WHERE reference LIKE 'immo_%') as sponsor_immo_count,
    COALESCE(SUM(montant) FILTER (WHERE reference LIKE 'immo_%'), 0) as sponsor_immo_montant,
    COUNT(*) FILTER (WHERE reference LIKE 'spimmo_%') as sponsor_agence_count,
    COALESCE(SUM(montant) FILTER (WHERE reference LIKE 'spimmo_%'), 0) as sponsor_agence_montant,
    COUNT(*) FILTER (WHERE reference LIKE 'bout_%') as sponsor_boutique_count,
    COALESCE(SUM(montant) FILTER (WHERE reference LIKE 'bout_%'), 0) as sponsor_boutique_montant,
    COUNT(*) FILTER (WHERE reference LIKE 'prod_%') as sponsor_produit_count,
    COALESCE(SUM(montant) FILTER (WHERE reference LIKE 'prod_%'), 0) as sponsor_produit_montant,
    COUNT(*) FILTER (WHERE reference LIKE 'boost_%') as boost_count,
    COALESCE(SUM(montant) FILTER (WHERE reference LIKE 'boost_%'), 0) as boost_montant,
    COUNT(*) FILTER (WHERE reference LIKE 'abmt_%') as abonnements_payes_count,
    COALESCE(SUM(montant) FILTER (WHERE reference LIKE 'abmt_%'), 0) as abmt_montant,
    COUNT(*) FILTER (WHERE reference LIKE 'loyer_%') as loyers_count,
    COALESCE(SUM(montant) FILTER (WHERE reference LIKE 'loyer_%'), 0) as loyers_montant
    FROM commandes WHERE statut='payee'`))

  console.log('=== PAIEMENTS REUSSIS PAR METHODE ===', await q(`SELECT methode_paiement, COUNT(*), COALESCE(SUM(montant), 0) as montant_total 
                       FROM commandes WHERE statut='payee' 
                       GROUP BY methode_paiement`))

  console.log('=== ALL COMMANDES REFERENCES ===', await q(`SELECT reference, montant, methode_paiement, created_at FROM commandes ORDER BY created_at DESC LIMIT 20`))

  console.log('=== PAIEMENTS MANUELS ===', await q(`SELECT statut, COUNT(*), COALESCE(SUM(montant), 0) as montant_total 
                       FROM paiements_manuels 
                       GROUP BY statut`))

  console.log('=== COMMISSIONS APPORTEUR ===', await q(`SELECT statut, COUNT(*), COALESCE(SUM(montant), 0) as montant_total 
                       FROM commissions_apporteur 
                       GROUP BY statut`))

  console.log('=== PROSPECTION LEADS ===', await q(`SELECT statut, COUNT(*) 
                       FROM prospection_leads 
                       GROUP BY statut`))

  console.log('=== GMV VENTES POS & COMMANDES WEB ===', await q(`SELECT 
    (SELECT COUNT(*) FROM ventes) as nb_ventes_pos,
    (SELECT COALESCE(SUM(montant_total),0) FROM ventes WHERE archivee IS NOT TRUE) as gmv_ventes_pos,
    (SELECT COUNT(*) FROM commandes_boutique) as nb_commandes_web,
    (SELECT COALESCE(SUM(montant_total),0) FROM commandes_boutique WHERE statut != 'annulee') as gmv_commandes_web,
    (SELECT COALESCE(SUM(montant_commission),0) FROM commandes_boutique WHERE statut = 'livree') as commissions_commandes_livrees
  `))

  console.log('=== COMMISSIONS SUR BOUTIQUES ===', await q(`SELECT commission_rate, COUNT(*) FROM boutiques GROUP BY commission_rate`))

  console.log('=== SETTINGS RELEVANT TO PRICING ===', await q(`SELECT cle, valeur FROM settings WHERE cle IN ('prix_annonce', 'prix_sponsoring', 'prix_boost', 'plan_decouverte_prix', 'plan_pro_prix', 'plan_business_prix', 'commission_business', 'reduc_3_mois', 'reduc_6_mois', 'reduc_12_mois', 'abonnement_essai_jours', 'apporteur_actif', 'apporteur_taux_commission')`))

  await pool.end()
}

run().catch(e => { console.error('RUN ERROR:', e); pool.end(); })
