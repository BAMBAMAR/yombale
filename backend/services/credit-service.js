// backend/services/credit-service.js — Service Métier Carnet de Dettes & Plans Échelonnés
const { pool } = require('../models/db');
const creditCalc = require('../lib/creditCalculator');

let _creditSchemaMigrated = false;

async function ensureCreditSchema() {
  if (_creditSchemaMigrated) return;
  try {
    await pool.query(`
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS echelonnement_actif BOOLEAN DEFAULT FALSE;
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS echelonnement_config JSONB DEFAULT '{
        "actif": false,
        "montant_min_vente": 10000,
        "montant_max_vente": 5000000,
        "apport_min_pct": 20,
        "apport_min_fcfa": 5000,
        "echeance_min_fcfa": 5000,
        "nb_echeances_autorisees": [2, 3, 4, 6],
        "frequences_autorisees": ["mensuel", "bimensuel", "hebdomadaire"],
        "delai_premiere_echeance_jours": 30,
        "frais_dossier_fixes": 0,
        "frais_pourcentage": 0
      }'::jsonb;

      CREATE TABLE IF NOT EXISTS caisse_credit_plans (
        id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id      UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        client_id        UUID NOT NULL REFERENCES caisse_clients_credits(id) ON DELETE CASCADE,
        commande_id      UUID REFERENCES commandes_boutique(id) ON DELETE SET NULL,
        reference        VARCHAR(100) UNIQUE NOT NULL,
        montant_total    NUMERIC(12,2) NOT NULL,
        frais_dossier    NUMERIC(12,2) NOT NULL DEFAULT 0,
        apport_initial   NUMERIC(12,2) NOT NULL DEFAULT 0,
        montant_finance  NUMERIC(12,2) NOT NULL,
        montant_paye     NUMERIC(12,2) NOT NULL DEFAULT 0,
        montant_restant  NUMERIC(12,2) NOT NULL,
        nb_echeances     INT NOT NULL DEFAULT 3,
        frequence        VARCHAR(30) NOT NULL DEFAULT 'mensuel',
        statut           VARCHAR(30) NOT NULL DEFAULT 'en_cours',
        date_debut       DATE NOT NULL DEFAULT CURRENT_DATE,
        snapshot_regles  JSONB NOT NULL DEFAULT '{}'::jsonb,
        articles         JSONB NOT NULL DEFAULT '[]'::jsonb,
        notes            TEXT,
        idempotency_key  VARCHAR(128),
        created_at       TIMESTAMPTZ DEFAULT NOW(),
        updated_at       TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_credit_plans_bq_client ON caisse_credit_plans(boutique_id, client_id);
      CREATE INDEX IF NOT EXISTS idx_credit_plans_statut ON caisse_credit_plans(boutique_id, statut);
      CREATE INDEX IF NOT EXISTS idx_credit_plans_ref ON caisse_credit_plans(boutique_id, reference);

      CREATE TABLE IF NOT EXISTS caisse_credit_echeances (
        id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        plan_id                    UUID NOT NULL REFERENCES caisse_credit_plans(id) ON DELETE CASCADE,
        boutique_id                UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        client_id                  UUID NOT NULL REFERENCES caisse_clients_credits(id) ON DELETE CASCADE,
        numero_echeance            INT NOT NULL,
        date_echeance              DATE NOT NULL,
        montant_prevu              NUMERIC(12,2) NOT NULL,
        montant_paye               NUMERIC(12,2) NOT NULL DEFAULT 0,
        montant_restant            NUMERIC(12,2) NOT NULL,
        statut                     VARCHAR(30) NOT NULL DEFAULT 'a_venir',
        date_paiement_complet      TIMESTAMPTZ,
        derniere_relance_whatsapp  TIMESTAMPTZ,
        created_at                 TIMESTAMPTZ DEFAULT NOW(),
        updated_at                 TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_credit_ech_plan ON caisse_credit_echeances(plan_id, numero_echeance);
      CREATE INDEX IF NOT EXISTS idx_credit_ech_date ON caisse_credit_echeances(boutique_id, date_echeance, statut);
      CREATE INDEX IF NOT EXISTS idx_credit_ech_client ON caisse_credit_echeances(client_id, statut);
      ALTER TABLE caisse_credit_historique ADD COLUMN IF NOT EXISTS reference VARCHAR(128);
      CREATE INDEX IF NOT EXISTS idx_credit_hist_ref ON caisse_credit_historique(boutique_id, reference);
    `);
    _creditSchemaMigrated = true;
  } catch {
    _creditSchemaMigrated = true;
  }
}

/**
 * Récupère les clients avec ou sans historique
 */
async function getClientsAvecHistorique(boutiqueId, includeHistorique = false) {
  await ensureCreditSchema();
  const { rows: clients } = await pool.query(
    `SELECT * FROM caisse_clients_credits WHERE boutique_id=$1 ORDER BY nom ASC`,
    [boutiqueId]
  );

  if (includeHistorique && clients.length > 0) {
    const { rows: historiqueRows } = await pool.query(
      `SELECT * FROM caisse_credit_historique WHERE boutique_id=$1 ORDER BY created_at DESC`,
      [boutiqueId]
    );

    const histMap = new Map();
    historiqueRows.forEach((h) => {
      if (!histMap.has(h.client_id)) histMap.set(h.client_id, []);
      histMap.get(h.client_id).push(h);
    });

    clients.forEach((c) => {
      c.historique = histMap.get(c.id) || [];
    });
  }

  return clients;
}

/**
 * Récupère l'historique complet des mouvements pour un client
 */
async function getHistoriqueClient(boutiqueId, clientId) {
  const { rows } = await pool.query(
    `SELECT * FROM caisse_credit_historique WHERE client_id=$1 AND boutique_id=$2 ORDER BY created_at DESC`,
    [clientId, boutiqueId]
  );
  return rows;
}

/**
 * Calcule les métriques globales du carnet pour une boutique
 */
async function getMetriquesCarnet(boutiqueId) {
  const { rows } = await pool.query(
    `SELECT 
       COUNT(*) FILTER (WHERE solde > 0) as nb_debiteurs,
       COALESCE(SUM(solde) FILTER (WHERE solde > 0), 0) as total_dettes,
       COALESCE(SUM(ABS(solde)) FILTER (WHERE solde < 0), 0) as total_avances,
       COUNT(*) as total_clients
     FROM caisse_clients_credits 
     WHERE boutique_id=$1`,
    [boutiqueId]
  );
  return rows[0] || { nb_debiteurs: 0, total_dettes: 0, total_avances: 0, total_clients: 0 };
}

module.exports = {
  ensureCreditSchema,
  getClientsAvecHistorique,
  getHistoriqueClient,
  getMetriquesCarnet,
};
