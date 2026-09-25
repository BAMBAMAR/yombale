// backend/migrate-inline.js
// Migration idempotente appelée au démarrage de app.js (ne ferme PAS le pool principal)
// BUG FIX : l'ancienne migrate.js appelait pool.end() ce qui cassait tout
const { Pool } = require('pg');
require('dotenv').config();

module.exports = async function migrateInline(customConnStr = null) {
  const connStr = customConnStr || process.env.DATABASE_URL;
  const isLocal = !connStr || connStr.includes('localhost') || connStr.includes('127.0.0.1');
  const pool = new Pool({
    connectionString: connStr,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 2,                           // Limiter à 2 connexions pour la migration
    connectionTimeoutMillis: 30000,   // 30s pour Render.com
    idleTimeoutMillis: 5000,          // Fermer les connexions idle rapidement
  });
  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pg_trgm";

      CREATE TABLE IF NOT EXISTS categories (
        id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nom        VARCHAR(100) NOT NULL,
        slug       VARCHAR(100) UNIQUE NOT NULL,
        icone      VARCHAR(10),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS ordre INT DEFAULT 0;
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT TRUE;
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;

      CREATE TABLE IF NOT EXISTS produits (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nom          VARCHAR(255) NOT NULL,
        description  TEXT,
        categorie_id UUID REFERENCES categories(id),
        marque       VARCHAR(100),
        ean          VARCHAR(20),
        image_url    TEXT,
        prix_min     NUMERIC(12,2),
        nb_offres    INT DEFAULT 0,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_produits_nom ON produits USING gin(nom gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_produits_ean ON produits(ean);

      CREATE TABLE IF NOT EXISTS marchands (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nom           VARCHAR(100) NOT NULL,
        site_url      TEXT,
        methode       VARCHAR(20) DEFAULT 'scraper',
        actif         BOOLEAN DEFAULT TRUE,
        derniere_sync TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS offres (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        produit_id      UUID NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
        marchand_id     UUID NOT NULL REFERENCES marchands(id),
        prix            NUMERIC(12,2) NOT NULL,
        devise          CHAR(3) DEFAULT 'XOF',
        stock           BOOLEAN DEFAULT TRUE,
        url_achat       TEXT,
        titre_marchand  TEXT,
        scraped_at      TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(produit_id, marchand_id)
      );
      -- Colonne titre_marchand ajoutée post-création (idempotent pour DBs existantes)
      DO $$ BEGIN
        ALTER TABLE offres ADD COLUMN IF NOT EXISTS titre_marchand TEXT;
      EXCEPTION WHEN others THEN NULL; END $$;
      -- Specs structurées extraites du titre (stockage_go, ram_go, couleur, etat) — affichage uniquement
      DO $$ BEGIN
        ALTER TABLE offres ADD COLUMN IF NOT EXISTS specs JSONB;
      EXCEPTION WHEN others THEN NULL; END $$;
      CREATE INDEX IF NOT EXISTS idx_offres_produit ON offres(produit_id);
      CREATE INDEX IF NOT EXISTS idx_offres_prix    ON offres(prix);
      CREATE INDEX IF NOT EXISTS idx_offres_produit_stock_prix ON offres(produit_id, stock, prix);

      -- Dédoublonnage robuste d'offres & Index UNIQUE (TECH-02)
      DO $$ 
      DECLARE
        r RECORD;
      BEGIN
        IF EXISTS (
          SELECT 1 FROM offres GROUP BY produit_id, marchand_id HAVING count(*) > 1 LIMIT 1
        ) THEN
          FOR r IN 
            SELECT produit_id, marchand_id, 
                   (SELECT id FROM offres o2 WHERE o2.produit_id = o1.produit_id AND o2.marchand_id = o1.marchand_id ORDER BY prix ASC, scraped_at DESC LIMIT 1) AS winner_id
            FROM offres o1
            GROUP BY produit_id, marchand_id
            HAVING count(*) > 1
          LOOP
            UPDATE historique_prix SET offre_id = r.winner_id 
            WHERE offre_id IN (SELECT id FROM offres WHERE produit_id = r.produit_id AND marchand_id = r.marchand_id AND id != r.winner_id);
            
            DELETE FROM offres WHERE produit_id = r.produit_id AND marchand_id = r.marchand_id AND id != r.winner_id;
          END LOOP;
        END IF;
      EXCEPTION WHEN others THEN NULL; END $$;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_offres_produit_marchand ON offres(produit_id, marchand_id);

      CREATE TABLE IF NOT EXISTS historique_prix (
        id       BIGSERIAL PRIMARY KEY,
        offre_id UUID NOT NULL REFERENCES offres(id) ON DELETE CASCADE,
        prix     NUMERIC(12,2) NOT NULL,
        date     TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_hist_offre ON historique_prix(offre_id);
      CREATE INDEX IF NOT EXISTS idx_hist_date  ON historique_prix(date);

      CREATE TABLE IF NOT EXISTS utilisateurs (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nom               VARCHAR(100) NOT NULL,
        email             VARCHAR(255) UNIQUE NOT NULL,
        mot_de_passe_hash TEXT NOT NULL,
        telephone         VARCHAR(20),
        ville             VARCHAR(100) DEFAULT 'Dakar',
        created_at        TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS email_verifie BOOLEAN DEFAULT FALSE;
      ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS a2f_actif BOOLEAN DEFAULT FALSE;
      ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS a2f_telephone VARCHAR(20);

      CREATE TABLE IF NOT EXISTS alertes (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        utilisateur_id UUID REFERENCES utilisateurs(id) ON DELETE CASCADE,
        produit_id     UUID REFERENCES produits(id),
        prix_cible     NUMERIC(12,2) NOT NULL,
        email          VARCHAR(255),
        active         BOOLEAN DEFAULT TRUE,
        created_at     TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commandes (
        id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        reference        VARCHAR(100) UNIQUE NOT NULL,
        montant          NUMERIC(12,2) NOT NULL,
        methode_paiement VARCHAR(20),
        statut           VARCHAR(20) DEFAULT 'en_attente',
        created_at       TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS forfaits_telecom (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        operateur      VARCHAR(50)  NOT NULL,
        nom            VARCHAR(255) NOT NULL,
        type           VARCHAR(20)  NOT NULL,
        data_mo        INT,
        minutes        INT,
        sms            INT,
        validite_jours INT,
        prix           NUMERIC(12,2) NOT NULL,
        devise         CHAR(3) DEFAULT 'XOF',
        description    TEXT,
        image_url      TEXT,
        source         VARCHAR(20) DEFAULT 'manuel',
        actif          BOOLEAN DEFAULT TRUE,
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        updated_at     TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_forfaits_operateur ON forfaits_telecom(operateur);
      CREATE INDEX IF NOT EXISTS idx_forfaits_prix      ON forfaits_telecom(prix);
      CREATE UNIQUE INDEX IF NOT EXISTS uidx_forfaits_op_nom ON forfaits_telecom(operateur, nom);

      CREATE TABLE IF NOT EXISTS annonces_immo (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        titre         VARCHAR(500)  NOT NULL,
        type_bien     VARCHAR(50)   DEFAULT 'appartement',
        transaction   VARCHAR(20)   DEFAULT 'location',
        prix          NUMERIC(15,2),
        surface_m2    INT,
        nb_pieces     INT,
        nb_chambres   INT,
        ville         VARCHAR(100)  DEFAULT 'Dakar',
        quartier      VARCHAR(200),
        description   TEXT,
        photos        JSONB         DEFAULT '[]',
        url_source    TEXT,
        source        VARCHAR(100)  DEFAULT 'manuel',
        ref_externe   VARCHAR(300),
        actif         BOOLEAN       DEFAULT TRUE,
        created_at    TIMESTAMPTZ   DEFAULT NOW(),
        updated_at    TIMESTAMPTZ   DEFAULT NOW()
      );

      ALTER TABLE annonces_immo ADD COLUMN IF NOT EXISTS contact_nom VARCHAR(150);
      ALTER TABLE annonces_immo ADD COLUMN IF NOT EXISTS contact_tel VARCHAR(30);
      ALTER TABLE annonces_immo ADD COLUMN IF NOT EXISTS utilisateur_id UUID;
      ALTER TABLE annonces_immo ADD COLUMN IF NOT EXISTS sponsorisee BOOLEAN DEFAULT FALSE;
      ALTER TABLE annonces_immo ADD COLUMN IF NOT EXISTS sponsorisee_jusqu_au TIMESTAMPTZ;
      ALTER TABLE annonces_immo ADD COLUMN IF NOT EXISTS demande_sponsorisation BOOLEAN DEFAULT FALSE;
      ALTER TABLE annonces_immo ADD COLUMN IF NOT EXISTS supprimee BOOLEAN DEFAULT FALSE;

      CREATE INDEX IF NOT EXISTS idx_immo_utilisateur ON annonces_immo(utilisateur_id);

      CREATE INDEX IF NOT EXISTS idx_immo_ville       ON annonces_immo(ville);
      CREATE INDEX IF NOT EXISTS idx_immo_type        ON annonces_immo(type_bien);
      CREATE INDEX IF NOT EXISTS idx_immo_prix        ON annonces_immo(prix);
      CREATE INDEX IF NOT EXISTS idx_immo_transaction ON annonces_immo(transaction);
      CREATE UNIQUE INDEX IF NOT EXISTS uidx_immo_source_ref
        ON annonces_immo(source, ref_externe)
        WHERE ref_externe IS NOT NULL;

      CREATE TABLE IF NOT EXISTS demandes_partenaires (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        utilisateur_id UUID REFERENCES utilisateurs(id),
        nom_entreprise VARCHAR(200) NOT NULL,
        secteur        VARCHAR(100),
        contact_nom    VARCHAR(150),
        contact_tel    VARCHAR(30),
        email          VARCHAR(255) NOT NULL,
        description    TEXT,
        statut         VARCHAR(20) DEFAULT 'en_attente',
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        updated_at     TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_partenaires_statut ON demandes_partenaires(statut);

      CREATE TABLE IF NOT EXISTS annonces_classifiees (
        id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        utilisateur_id   UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
        categorie_slug   VARCHAR(100) NOT NULL,
        titre            VARCHAR(500) NOT NULL,
        description      TEXT,
        prix             NUMERIC(15,2),
        ville            VARCHAR(100) DEFAULT 'Dakar',
        quartier         VARCHAR(200),
        photos           JSONB DEFAULT '[]',
        contact_nom      VARCHAR(150),
        contact_tel      VARCHAR(30) NOT NULL,
        actif            BOOLEAN DEFAULT FALSE,
        supprimee        BOOLEAN DEFAULT FALSE,
        payee            BOOLEAN DEFAULT FALSE,
        commande_ref     VARCHAR(100),
        created_at       TIMESTAMPTZ DEFAULT NOW(),
        updated_at       TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_annonces_cat  ON annonces_classifiees(categorie_slug, actif, supprimee);
      CREATE INDEX IF NOT EXISTS idx_annonces_user ON annonces_classifiees(utilisateur_id);

      CREATE TABLE IF NOT EXISTS boutique_utilisateurs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(boutique_id, utilisateur_id)
      );
      CREATE INDEX IF NOT EXISTS idx_boutique_utilisateurs_bq ON boutique_utilisateurs(boutique_id);
      CREATE INDEX IF NOT EXISTS idx_boutique_utilisateurs_user ON boutique_utilisateurs(utilisateur_id);

      CREATE TABLE IF NOT EXISTS boutique_avis (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id  UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        produit_id   UUID REFERENCES boutique_produits(id) ON DELETE CASCADE,
        nom_client   VARCHAR(100) NOT NULL,
        note         INT CHECK (note >= 1 AND note <= 5),
        commentaire  TEXT,
        verifie      BOOLEAN DEFAULT TRUE,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_boutique_avis_bq ON boutique_avis(boutique_id);

      CREATE TABLE IF NOT EXISTS paniers_abandonnes (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id  UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        client_nom   VARCHAR(100),
        client_tel   VARCHAR(30) NOT NULL,
        articles     JSONB NOT NULL DEFAULT '[]',
        total        NUMERIC(12,2) NOT NULL,
        relance_envoyee BOOLEAN DEFAULT FALSE,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_paniers_abandonnes_bq ON paniers_abandonnes(boutique_id);

      CREATE TABLE IF NOT EXISTS caisse_clients_credits (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id  UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        nom          VARCHAR(100) NOT NULL,
        telephone    VARCHAR(30) NOT NULL,
        solde        NUMERIC(12,2) DEFAULT 0,
        plafond_max  NUMERIC(12,2) DEFAULT 200000,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_caisse_clients_bq ON caisse_clients_credits(boutique_id);

      ALTER TABLE caisse_clients_credits ADD COLUMN IF NOT EXISTS adresse VARCHAR(255);
      ALTER TABLE caisse_clients_credits ADD COLUMN IF NOT EXISTS note_client TEXT;
      ALTER TABLE caisse_clients_credits ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'actif';
      ALTER TABLE caisse_clients_credits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

      CREATE TABLE IF NOT EXISTS caisse_credit_historique (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id    UUID NOT NULL REFERENCES caisse_clients_credits(id) ON DELETE CASCADE,
        boutique_id  UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        type         VARCHAR(30) NOT NULL,
        montant      NUMERIC(12,2) NOT NULL,
        mode_paiement VARCHAR(30) DEFAULT 'especes',
        note         TEXT,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_caisse_hist_client ON caisse_credit_historique(client_id);

      ALTER TABLE caisse_credit_historique ADD COLUMN IF NOT EXISTS produits JSONB DEFAULT '[]';
      ALTER TABLE caisse_credit_historique ADD COLUMN IF NOT EXISTS date_echeance DATE;
      ALTER TABLE caisse_credit_historique ADD COLUMN IF NOT EXISTS relance_auto_whatsapp BOOLEAN DEFAULT TRUE;
      ALTER TABLE caisse_credit_historique ADD COLUMN IF NOT EXISTS derniere_relance_whatsapp TIMESTAMPTZ;

      ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS code_barre VARCHAR(100);

      CREATE TABLE IF NOT EXISTS boutique_caissiers (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id  UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        nom          VARCHAR(100) NOT NULL,
        prenom       VARCHAR(100),
        code_pin     VARCHAR(10) NOT NULL,
        role         VARCHAR(20) DEFAULT 'caissier',
        actif        BOOLEAN DEFAULT TRUE,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_boutique_caissiers_bq ON boutique_caissiers(boutique_id);

      CREATE TABLE IF NOT EXISTS boutique_pos_sessions (
        id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id          UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        caissier_id          UUID REFERENCES boutique_caissiers(id) ON DELETE SET NULL,
        caissier_nom         VARCHAR(150) NOT NULL,
        fond_caisse_initial  NUMERIC(12,2) DEFAULT 0,
        ventes_especes       NUMERIC(12,2) DEFAULT 0,
        ventes_wave          NUMERIC(12,2) DEFAULT 0,
        ventes_orange_money NUMERIC(12,2) DEFAULT 0,
        ventes_carte         NUMERIC(12,2) DEFAULT 0,
        ventes_total         NUMERIC(12,2) DEFAULT 0,
        nb_ventes            INT DEFAULT 0,
        especes_comptees     NUMERIC(12,2),
        ecart_caisse         NUMERIC(12,2),
        date_ouverture       TIMESTAMPTZ DEFAULT NOW(),
        date_cloture         TIMESTAMPTZ,
        statut               VARCHAR(20) DEFAULT 'ouverte'
      );
      CREATE INDEX IF NOT EXISTS idx_boutique_sessions_bq ON boutique_pos_sessions(boutique_id);

      ALTER TABLE boutique_pos_sessions ADD COLUMN IF NOT EXISTS detail_billets JSONB DEFAULT '{}';
      ALTER TABLE boutique_pos_sessions ADD COLUMN IF NOT EXISTS total_remises NUMERIC(12,2) DEFAULT 0;
      ALTER TABLE boutique_pos_sessions ADD COLUMN IF NOT EXISTS total_entrees_especes NUMERIC(12,2) DEFAULT 0;
      ALTER TABLE boutique_pos_sessions ADD COLUMN IF NOT EXISTS total_sorties_especes NUMERIC(12,2) DEFAULT 0;

      -- Table de gestion des mouvements d'espèces de caisse (coursiers, monnaie, retraits)
      CREATE TABLE IF NOT EXISTS boutique_pos_mouvements_caisse (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id  UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        session_id   UUID NOT NULL REFERENCES boutique_pos_sessions(id) ON DELETE CASCADE,
        type         VARCHAR(20) NOT NULL, -- 'entree' | 'sortie'
        montant      NUMERIC(12,2) NOT NULL,
        motif        VARCHAR(255) NOT NULL,
        beneficiaire VARCHAR(150),
        caissier_nom VARCHAR(150),
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_pos_mouv_session ON boutique_pos_mouvements_caisse(session_id);
      CREATE INDEX IF NOT EXISTS idx_pos_mouv_boutique ON boutique_pos_mouvements_caisse(boutique_id);

      -- ── TABLES FIDÉLISATION CLIENT & RÉCOMPENSES POS ─────────────────────────
      CREATE TABLE IF NOT EXISTS boutique_clients_fidelite (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id         UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        client_id           UUID REFERENCES caisse_clients_credits(id) ON DELETE SET NULL,
        telephone           VARCHAR(30) NOT NULL,
        nom                 VARCHAR(100) NOT NULL,
        points_solde        INT DEFAULT 0,
        cagnotte_fcfa       NUMERIC(12,2) DEFAULT 0,
        nb_visites          INT DEFAULT 0,
        total_depense       NUMERIC(12,2) DEFAULT 0,
        tampons_actuels     INT DEFAULT 0,
        rang_fidelite       VARCHAR(30) DEFAULT 'bronze',
        derniere_visite     TIMESTAMPTZ DEFAULT NOW(),
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uidx_bq_client_fidelite_tel ON boutique_clients_fidelite(boutique_id, telephone);
      CREATE INDEX IF NOT EXISTS idx_bq_client_fidelite_bq ON boutique_clients_fidelite(boutique_id);

      CREATE TABLE IF NOT EXISTS boutique_fidelite_mouvements (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id         UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        client_fidelite_id  UUID NOT NULL REFERENCES boutique_clients_fidelite(id) ON DELETE CASCADE,
        vente_reference     VARCHAR(100),
        type_mouvement      VARCHAR(30) NOT NULL,
        valeur_fcfa         NUMERIC(12,2) NOT NULL DEFAULT 0,
        points              INT DEFAULT 0,
        description         TEXT,
        created_at          TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_bq_fidelite_mouv_client ON boutique_fidelite_mouvements(client_fidelite_id);

      -- ── TABLE BONS D'AVOIR & STORE CREDIT ────────────────────────────────────
      CREATE TABLE IF NOT EXISTS caisse_avoirs (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id         UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        code                VARCHAR(50) NOT NULL,
        montant_initial     NUMERIC(12,2) NOT NULL,
        montant_restant     NUMERIC(12,2) NOT NULL,
        client_nom          VARCHAR(100),
        client_telephone    VARCHAR(30),
        ticket_origine_ref  VARCHAR(100),
        statut              VARCHAR(20) DEFAULT 'actif',
        date_expiration     DATE,
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uidx_caisse_avoirs_code ON caisse_avoirs(boutique_id, code);

      -- Colonnes de personnalisation des reçus, fidélité et règles de remises dans boutiques
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS fidelite_actif BOOLEAN DEFAULT TRUE;
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS fidelite_type VARCHAR(30) DEFAULT 'cagnotte';
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS fidelite_taux_cashback NUMERIC(5,2) DEFAULT 3.00;
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS fidelite_tampons_max INT DEFAULT 10;
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS fidelite_seuil_tampon NUMERIC(12,2) DEFAULT 2000;
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS message_bas_ticket TEXT DEFAULT '';
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS pos_remise_max_caissier NUMERIC(5,2) DEFAULT 10.00;
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS pos_remise_seuil_auto_montant NUMERIC(12,2) DEFAULT 0;
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS pos_remise_seuil_auto_pct NUMERIC(5,2) DEFAULT 0;
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS pos_remise_motifs JSONB DEFAULT '[{"id":"anti_gaspi","nom":"🍌 Date courte / Anti-gaspi","pct":30},{"id":"defaut","nom":"📦 Défaut emballage","pct":15},{"id":"personnel","nom":"👥 Personnel / Employé","pct":10},{"id":"geste","nom":"👑 Geste commercial","pct":5}]';

      ALTER TABLE annonces_classifiees ADD COLUMN IF NOT EXISTS caracteristiques JSONB DEFAULT '{}';
      ALTER TABLE annonces_classifiees ADD COLUMN IF NOT EXISTS rejete BOOLEAN DEFAULT FALSE;
      ALTER TABLE annonces_classifiees ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'manuel';
      ALTER TABLE annonces_classifiees ADD COLUMN IF NOT EXISTS ref_externe VARCHAR(300);
      ALTER TABLE annonces_classifiees ADD COLUMN IF NOT EXISTS url_source TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS uidx_annonces_source_ref
        ON annonces_classifiees(source, ref_externe)
        WHERE ref_externe IS NOT NULL;

      INSERT INTO categories (nom, slug, icone) VALUES
        ('Telephones',   'smartphones', '📱'),
        ('Informatique', 'informatique','💻'),
        ('TV & Electro', 'tv-electro',  '📺'),
        ('Mode',         'mode',        '👕'),
        ('Maison',       'maison',      '🏠'),
        ('Auto & Moto',  'auto-moto',   '🛵'),
        ('Beaute',       'beaute',      '💄'),
        ('Jeux',         'jeux',        '🎮'),
        ('Telecom & Forfaits', 'telecom', '📶'),
        ('Immobilier',   'immo',        '🏡'),
        ('Emploi & Job', 'emploi',      '💼'),
        ('Divers',       'divers',      '📦')
      ON CONFLICT (slug) DO NOTHING;

      CREATE TABLE IF NOT EXISTS whatsapp_sessions (
        phone       TEXT PRIMARY KEY,
        state       TEXT NOT NULL DEFAULT 'IDLE',
        context     JSONB NOT NULL DEFAULT '{}',
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS whatsapp_processed_messages (
        message_id   TEXT PRIMARY KEY,
        processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS whatsapp_blacklist (
        phone       TEXT PRIMARY KEY,
        reason      TEXT DEFAULT 'optout',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_wpm_processed_at
        ON whatsapp_processed_messages(processed_at);
    `);

    // Colonnes pour les alertes créées via le chatbot WhatsApp (sans compte utilisateur ni produit_id)
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE alertes ADD COLUMN IF NOT EXISTS telephone TEXT;
      EXCEPTION WHEN others THEN NULL; END $$;
      DO $$ BEGIN
        ALTER TABLE alertes ADD COLUMN IF NOT EXISTS produit_nom TEXT;
      EXCEPTION WHEN others THEN NULL; END $$;
    `);

    // Requis par l'INSERT ... ON CONFLICT DO NOTHING du chatbot WhatsApp (whatsapp-chatbot.js)
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uidx_alertes_telephone_produit_nom
        ON alertes(telephone, produit_nom) WHERE telephone IS NOT NULL;
    `);

    // Catalogue WhatsApp par boutique (optionnel — upgrade Pro/Business)
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS whatsapp_catalog_id TEXT;
      EXCEPTION WHEN others THEN NULL; END $$;
    `);

    // Contrainte unique sur marchands.nom — nécessaire pour getMarchandId()
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'marchands_nom_unique' AND conrelid = 'marchands'::regclass
        ) THEN
          DELETE FROM marchands a USING marchands b
          WHERE a.id > b.id AND a.nom = b.nom;
          ALTER TABLE marchands ADD CONSTRAINT marchands_nom_unique UNIQUE (nom);
        END IF;
      END $$;
    `);

    // Insertion marchands (APRÈS la contrainte unique)
    await pool.query(`
      INSERT INTO marchands (nom, site_url, methode) VALUES
        ('Jumia Senegal', 'https://www.jumia.sn',          'scraper'),
        ('Expat-Dakar',   'https://www.expat-dakar.com',   'scraper'),
        ('Dakar-Deal',    'https://www.dakar-deal.com',     'scraper'),
        ('CoinAfrique',   'https://sn.coinafrique.com',     'scraper'),
        ('SenMarket',     'https://www.senmarket.sn',       'feed')
      ON CONFLICT (nom) DO NOTHING;
    `);

    console.log('[MIGRATE] ✅ Tables OK, catégories et marchands insérés');
  } catch (err) {
    console.error('[MIGRATE] ❌', err.message);
  }

  // Colonnes ajoutées en cours de route — exécutées séparément pour garantir leur présence
  // même si le bloc principal a partiellement échoué sur une autre instruction
  // Table boutiques — créée en bloc séparé pour éviter l'échec global
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boutiques (
        id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        utilisateur_id   UUID REFERENCES utilisateurs(id) ON DELETE CASCADE,
        nom              VARCHAR(200) NOT NULL,
        description      TEXT,
        categorie        VARCHAR(100),
        telephone        VARCHAR(30),
        adresse          VARCHAR(300),
        ville            VARCHAR(100) DEFAULT 'Dakar',
        logo_url         TEXT,
        actif            BOOLEAN DEFAULT TRUE,
        created_at       TIMESTAMPTZ DEFAULT NOW(),
        updated_at       TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_boutiques_user ON boutiques(utilisateur_id);
      CREATE INDEX IF NOT EXISTS idx_boutiques_actif ON boutiques(actif, ville);
    `);
    console.log('[MIGRATE] ✅ Table boutiques OK');
  } catch (e) { console.warn('[MIGRATE] boutiques:', e.message); }

  const colonnesSupplementaires = [
    `ALTER TABLE annonces_classifiees ADD COLUMN IF NOT EXISTS caracteristiques JSONB DEFAULT '{}'`,
    `ALTER TABLE annonces_classifiees ADD COLUMN IF NOT EXISTS rejete BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE annonces_immo ADD COLUMN IF NOT EXISTS supprimee BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE annonces_immo ADD COLUMN IF NOT EXISTS meuble BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE annonces_immo ADD COLUMN IF NOT EXISTS rejete BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS prenom VARCHAR(100)`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS sponsorise BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS sponsor_jusqu_au TIMESTAMPTZ`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS derniere_relance_catalogue_at TIMESTAMPTZ`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS nb_relances_catalogue INT DEFAULT 0`,
    `ALTER TABLE produits ADD COLUMN IF NOT EXISTS sponsorise BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE produits ADD COLUMN IF NOT EXISTS sponsor_jusqu_au TIMESTAMPTZ`,
  ];
  for (const sql of colonnesSupplementaires) {
    try { await pool.query(sql); }
    catch (e) { console.warn('[MIGRATE] colonne:', e.message); }
  }
  console.log('[MIGRATE] ✅ Colonnes supplémentaires vérifiées');

  // Table publications Facebook/Instagram (brouillons → approuvés → publiés)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS facebook_posts (
        id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        message               TEXT NOT NULL,
        lien                  VARCHAR(500),
        image_url             TEXT,
        publier_instagram     BOOLEAN DEFAULT FALSE,
        statut                VARCHAR(20) DEFAULT 'brouillon',
        date_publication      TIMESTAMPTZ,
        date_publie           TIMESTAMPTZ,
        post_fb_id            VARCHAR(100),
        post_ig_id            VARCHAR(100),
        erreur                TEXT,
        created_at            TIMESTAMPTZ DEFAULT NOW(),
        updated_at            TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_fb_posts_statut ON facebook_posts(statut, date_publication);
    `);
    await pool.query(`
      ALTER TABLE facebook_posts ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE facebook_posts ADD COLUMN IF NOT EXISTS publier_instagram BOOLEAN DEFAULT FALSE;
      ALTER TABLE facebook_posts ADD COLUMN IF NOT EXISTS post_ig_id VARCHAR(100);
    `);
    console.log('[MIGRATE] ✅ Table facebook_posts OK');
  } catch (e) { console.warn('[MIGRATE] facebook_posts:', e.message); }

  // Table settings (clé-valeur pour stocker tokens et config dynamique)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key        VARCHAR(100) PRIMARY KEY,
        value      TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('[MIGRATE] ✅ Table settings OK');
  } catch (e) { console.warn('[MIGRATE] settings:', e.message); }

  // Table feature_flags (interrupteurs de fonctionnalités à chaud)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        key         VARCHAR(100) PRIMARY KEY,
        label       VARCHAR(200) NOT NULL,
        description TEXT,
        categorie   VARCHAR(50) DEFAULT 'general',
        enabled     BOOLEAN DEFAULT TRUE,
        scope       VARCHAR(30) DEFAULT 'global',
        meta        JSONB DEFAULT '{}',
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_feature_flags_cat ON feature_flags(categorie);
      CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);

      INSERT INTO feature_flags (key, label, description, categorie, enabled, scope) VALUES
        ('POS_ENABLED', 'Caisse POS tactile en magasin', 'Permet aux commerçants d''encaisser en caisse magasin, imprimer des tickets et gérer les caissiers.', 'pos', TRUE, 'global'),
        ('WHATSAPP_CHATBOT', 'Assistant & Commerce WhatsApp', 'Active le catalogue interactif, la commande par message et les relances IA WhatsApp.', 'whatsapp', TRUE, 'global'),
        ('STOCK_MANAGEMENT', 'Gestion avancée des stocks & alertes', 'Permet le suivi des stocks en temps réel, alertes de rupture et valorisation d''inventaire.', 'stock', TRUE, 'global'),
        ('DEBT_LEDGER', 'Carnet de dettes client & créances', 'Permet d''enregistrer les ventes à crédit et d''envoyer des rappels d''échéance.', 'commerce', TRUE, 'global'),
        ('AI_MAGIC_IMPORT', 'Import magique de produits par IA', 'Génération automatique de fiches produits par photo ou catalogue via vision artificielle.', 'ia', TRUE, 'global'),
        ('OFFLINE_POS', 'Mode Hors-Ligne Caisse POS', 'Encaissement local sans connexion internet avec synchronisation en arrière-plan.', 'pos', TRUE, 'global'),
        ('PRICE_ALERTS', 'Alertes de baisse de prix', 'Système de notifications push et WhatsApp sur les chutes de prix des produits suivis.', 'marketing', TRUE, 'global'),
        ('LOYALTY_PROGRAM', 'Programme fidélité & cashback', 'Gestion des points, cagnottes et cartes à tampons pour les clients fidèles.', 'marketing', TRUE, 'global'),
        ('COMMISSIONS_APPORTEURS', 'Programme Apporteurs d''Affaires', 'Affiliation et reversement de commissions automatiques aux prescripteurs.', 'finance', TRUE, 'global'),
        ('DEVELOPER_PORTAL', 'Portail Développeur API & Webhooks', 'Accès aux clés API REST et notifications de webhooks pour les tiers.', 'tech', TRUE, 'global')
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('[MIGRATE] ✅ Table feature_flags OK');
  } catch (e) { console.warn('[MIGRATE] feature_flags:', e.message); }

  // Table plans (plans tarifaires 100% administrables sans code)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        slug          VARCHAR(50) UNIQUE NOT NULL,
        label         VARCHAR(100) NOT NULL,
        prix_mensuel  NUMERIC(10,2) NOT NULL DEFAULT 0,
        badge         VARCHAR(100),
        couleur       VARCHAR(30) DEFAULT '#0284c7',
        avantages     JSONB DEFAULT '[]',
        limites       JSONB DEFAULT '{}',
        ordre         INT DEFAULT 0,
        actif         BOOLEAN DEFAULT TRUE,
        visibilite    VARCHAR(20) DEFAULT 'public',
        description   TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_plans_slug ON plans(slug);
      CREATE INDEX IF NOT EXISTS idx_plans_actif ON plans(actif, ordre);
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS categorie VARCHAR(50) DEFAULT 'boutique';
      CREATE INDEX IF NOT EXISTS idx_plans_categorie ON plans(categorie);

      INSERT INTO plans (slug, label, prix_mensuel, badge, couleur, avantages, limites, ordre, actif, description, categorie) VALUES
        ('gratuit', 'Boutique Gratuite', 0, 'Départ', '#64748b', '["Page boutique vitrine visible sur Nopalou", "Coordonnées et contact WhatsApp direct", "Jusqu''à 2 annonces classées incluses"]', '{"max_produits": 10, "max_caissiers": 1, "pos": false, "whatsapp_chatbot": false}', 0, TRUE, 'Pour lancer sa visibilité sur internet sans frais.', 'boutique'),
        ('decouverte', 'Boutique Taf Taf', 2500, 'Populaire', '#10b981', '["Carnet de dettes client & relances WhatsApp", "Catalogue connecté avec commandes WhatsApp", "Encaissement direct Wave & Orange Money", "Import IA magique de produits", "0% de commission", "1er mois 100% OFFERT"]', '{"max_produits": 50, "max_caissiers": 1, "pos": false, "whatsapp_chatbot": true}', 1, TRUE, 'Pour les commerçants souhaitant digitaliser leurs ventes et carnet de crédits.', 'boutique'),
        ('pro', 'Boutique Pro', 5000, 'Recommandé', '#f59e0b', '["Tout le contenu Taf Taf", "Caisse POS tactile magasin & tickets", "Saisie express & scanner code-barres", "Référencement prioritaire & Badge Certifié", "5 annonces classées incluses / mois", "Analytics avancés", "1er mois 100% OFFERT"]', '{"max_produits": 300, "max_caissiers": 3, "pos": true, "whatsapp_chatbot": true}', 2, TRUE, 'Pour les boutiques avec point de vente physique nécessitant une caisse POS.', 'boutique'),
        ('business', 'Boutique Business VIP', 10000, '👑 VIP', '#6366f1', '["Tout le contenu Pro", "Relances automatiques WhatsApp des dettes & paniers", "Multi-caissiers avec codes PIN & clôtures Z", "Multi-magasins & transferts de stock", "Portail Développeur API & Webhooks", "Comptabilité fournisseurs & Bons de commande", "Bannière sponsorisée en tête de catégorie", "15 annonces classées incluses", "Account Manager VIP 7j/7", "1er mois 100% OFFERT"]', '{"max_produits": 2000, "max_caissiers": 10, "pos": true, "whatsapp_chatbot": true, "api_access": true}', 3, TRUE, 'La solution tout-en-un pour les moyennes et grandes enseignes.', 'boutique'),
        ('immo_essentiel', 'Plan Agence Essentiel', 0, 'Inclus de Base', '#0A5C36', '["Portefeuille de biens illimité", "CRM Prospects & Pipeline Vente complet", "Gestion Locative, Baux OHADA & Quittances Wave/OM", "Social Shop & Smart Matching Vidéo", "Gestion des Agents & Courtiers"]', '{"secteur": "immo", "max_biens": -1, "max_agents": 5, "gestion_locative": true, "multi_agence": false, "sponsoring": false}', 10, TRUE, 'Offert pour digitaliser votre agence sans frais fixes mensuels. Comprend tous les modules métier essentiels.', 'immo'),
        ('immo_pro', 'Plan Agence Pro & Croissance', 10000, 'Recommandé Pro', '#1C2B4A', '["Tout le forfait Essentiel", "Relances automatiques WhatsApp des loyers impayés", "Export comptable des baux et états locatifs", "Gestion multi-agents illimitée (jusqu''à 20 agents)", "Badge Agence Certifiée & Référencement prioritaire", "Support prioritaire 7j/7"]', '{"secteur": "immo", "max_biens": -1, "max_agents": 20, "gestion_locative": true, "multi_agence": false, "sponsoring": false}', 11, TRUE, 'Pour les cabinets et agences en plein développement. Multidiffusion, alertes WhatsApp locataires et export comptable.', 'immo'),
        ('immo_multi_agence', 'Option Réseau Multi-Agences', 15000, 'Multi-Succursales', '#7C3AED', '["Création et gestion de plusieurs agences et filiales", "Tableau de bord consolidé du réseau immobilier", "Partage inter-agences de mandats et fichiers acquéreurs", "Comptes administrateurs de filiales dédiés", "Facturation unifiée Wave & Orange Money"]', '{"secteur": "immo", "max_biens": -1, "max_agents": -1, "gestion_locative": true, "multi_agence": true, "sponsoring": false}', 12, TRUE, 'Supervision consolidée de plusieurs succursales, cabinets ou agences sous un compte maître unique.', 'immo'),
        ('immo_sponsoring', 'Mise en Avant Annuaire (Sponsoring)', 5000, 'En Vedette', '#C75B00', '["Affichage en tête d''annuaire des agences immobilières", "Badge ''En Vedette'' doré sur toutes les annonces de biens", "Priorité absolue dans le moteur de recherche et le chatbot", "Visibilité maximale auprès des propriétaires bailleurs"]', '{"secteur": "immo", "sponsoring": true, "duree_jours": 30}', 13, TRUE, 'Propulse votre agence en 1ère position de l''annuaire public Nopalou pour capter un maximum de mandats exclusifs.', 'immo')
      ON CONFLICT (slug) DO UPDATE SET
        label = EXCLUDED.label,
        badge = EXCLUDED.badge,
        couleur = EXCLUDED.couleur,
        avantages = EXCLUDED.avantages,
        limites = EXCLUDED.limites,
        description = EXCLUDED.description,
        categorie = EXCLUDED.categorie;
    `);
    console.log('[MIGRATE] ✅ Table plans OK');
  } catch (e) { console.warn('[MIGRATE] plans:', e.message); }

  // Table admin_audit_logs (traçabilité complète des actions de gestion)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        admin_nom       VARCHAR(150) NOT NULL DEFAULT 'Admin',
        admin_role      VARCHAR(50) DEFAULT 'super_admin',
        action          VARCHAR(100) NOT NULL,
        cible_type      VARCHAR(50) NOT NULL,
        cible_id        VARCHAR(100),
        description     TEXT NOT NULL,
        ancienne_valeur JSONB,
        nouvelle_valeur JSONB,
        ip_adresse      VARCHAR(100),
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_cible ON admin_audit_logs(cible_type, cible_id);
      CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_date ON admin_audit_logs(created_at DESC);
    `);
    console.log('[MIGRATE] ✅ Table admin_audit_logs OK');
  } catch (e) { console.warn('[MIGRATE] admin_audit_logs:', e.message); }

  // Table admin_utilisateurs (comptes nominatifs et RBAC pour le personnel administratif)
  try {
    const bcrypt = require('bcryptjs');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_utilisateurs (
        id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nom                   VARCHAR(150) NOT NULL,
        email                 VARCHAR(255) UNIQUE NOT NULL,
        mot_de_passe_hash     VARCHAR(255) NOT NULL,
        role                  VARCHAR(50) NOT NULL DEFAULT 'admin_operationnel' CHECK (role IN ('super_admin', 'admin_operationnel', 'support_client', 'moderateur', 'finance')),
        permissions           JSONB DEFAULT '{}'::jsonb,
        actif                 BOOLEAN DEFAULT TRUE,
        derniere_connexion_at TIMESTAMPTZ,
        created_at            TIMESTAMPTZ DEFAULT NOW(),
        updated_at            TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_admin_utilisateurs_email ON admin_utilisateurs(email);
      CREATE INDEX IF NOT EXISTS idx_admin_utilisateurs_role ON admin_utilisateurs(role);
    `);

    // Bootstrap du compte Super Admin initial si la table est vide
    const { rows: countAdmins } = await pool.query('SELECT COUNT(*)::int AS count FROM admin_utilisateurs');
    if (countAdmins[0]?.count === 0) {
      const defaultEmail = process.env.ADMIN_EMAIL || 'admin@nopalou.com';
      const initialPassword = process.env.ADMIN_SECRET || 'NopalouAdmin2026!';
      const hash = await bcrypt.hash(initialPassword, 10);
      await pool.query(
        `INSERT INTO admin_utilisateurs (nom, email, mot_de_passe_hash, role, actif, permissions)
         VALUES ($1, $2, $3, 'super_admin', TRUE, '{"all": true}')
         ON CONFLICT (email) DO NOTHING`,
        ['Super Administrateur', defaultEmail, hash]
      );
      console.log(`[MIGRATE] 👤 Compte Super Admin bootstrapé : ${defaultEmail}`);
    }
    console.log('[MIGRATE] ✅ Table admin_utilisateurs OK');
  } catch (e) { console.warn('[MIGRATE] admin_utilisateurs:', e.message); }

  // Table clics_affiliation — tracking des clics vers marchands externes
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clics_affiliation (
        id          BIGSERIAL PRIMARY KEY,
        offre_id    UUID REFERENCES offres(id) ON DELETE SET NULL,
        produit_id  UUID REFERENCES produits(id) ON DELETE SET NULL,
        marchand_id UUID REFERENCES marchands(id) ON DELETE SET NULL,
        url_cible   TEXT NOT NULL,
        user_agent  TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_clics_offre    ON clics_affiliation(offre_id);
      CREATE INDEX IF NOT EXISTS idx_clics_marchand ON clics_affiliation(marchand_id);
      CREATE INDEX IF NOT EXISTS idx_clics_date     ON clics_affiliation(created_at);
    `);
    console.log('[MIGRATE] ✅ Table clics_affiliation OK');
  } catch (e) { console.warn('[MIGRATE] clics_affiliation:', e.message); }

  // Table affiliate_clicks — tracking avancé des clics affiliés (Phase 5)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS affiliate_clicks (
        id            BIGSERIAL PRIMARY KEY,
        click_ref     VARCHAR(100) UNIQUE NOT NULL,
        apporteur_id  UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
        apporteur_code VARCHAR(20),
        geo           VARCHAR(5) DEFAULT 'SN',
        device        VARCHAR(20) DEFAULT 'web',
        ip_hash       VARCHAR(64),
        converted     BOOLEAN DEFAULT FALSE,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        converted_at  TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_apporteur ON affiliate_clicks(apporteur_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_converted ON affiliate_clicks(converted, created_at);
      CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_date       ON affiliate_clicks(created_at);
    `);
    console.log('[MIGRATE] ✅ Table affiliate_clicks OK');
  } catch (e) { console.warn('[MIGRATE] affiliate_clicks:', e.message); }

  // Table quarantines_log — historique des quarantines (Phase 6)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quarantines_log (
        id               BIGSERIAL PRIMARY KEY,
        offre_id         UUID NOT NULL REFERENCES offres(id) ON DELETE CASCADE,
        raison           VARCHAR(100) NOT NULL,
        prix             NUMERIC(12,2),
        prix_moyen_30j   NUMERIC(12,2),
        status           VARCHAR(20) DEFAULT 'quarantined' CHECK (status IN ('quarantined', 'validated', 'rejected')),
        validated_by     VARCHAR(100),
        validated_at     TIMESTAMPTZ,
        created_at       TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_quarantines_offre  ON quarantines_log(offre_id);
      CREATE INDEX IF NOT EXISTS idx_quarantines_status ON quarantines_log(status, created_at);
      CREATE INDEX IF NOT EXISTS idx_quarantines_date   ON quarantines_log(created_at);
    `);
    console.log('[MIGRATE] ✅ Table quarantines_log OK');
  } catch (e) { console.warn('[MIGRATE] quarantines_log:', e.message); }

  // Colonne offres.quarantinee (Phase 6)
  try {
    await pool.query(`
      ALTER TABLE offres ADD COLUMN IF NOT EXISTS quarantinee BOOLEAN DEFAULT FALSE;
      CREATE INDEX IF NOT EXISTS idx_offres_quarantinee ON offres(quarantinee);
    `);
    console.log('[MIGRATE] ✅ Colonne offres.quarantinee OK');
  } catch (e) { console.warn('[MIGRATE] offres.quarantinee:', e.message); }

  // Table analytics_events — tracking vues/clics boutiques et annonces
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id          BIGSERIAL PRIMARY KEY,
        type        VARCHAR(50) NOT NULL,
        boutique_id UUID REFERENCES boutiques(id) ON DELETE CASCADE,
        annonce_id  UUID,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_analytics_boutique ON analytics_events(boutique_id, type, created_at);
    `);
    console.log('[MIGRATE] ✅ Table analytics_events OK');
  } catch (e) { console.warn('[MIGRATE] analytics_events:', e.message); }

  // Table abonnements (plans Pro/Business pour les boutiques)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS abonnements (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        plan           VARCHAR(20) NOT NULL CHECK (plan IN ('gratuit', 'decouverte', 'taf_taf', 'pro', 'business', 'immo')),
        statut         VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'expire', 'annule')),
        prix_mensuel   NUMERIC(10,2) NOT NULL,
        debut          TIMESTAMPTZ DEFAULT NOW(),
        fin            TIMESTAMPTZ NOT NULL,
        commande_ref   VARCHAR(100),
        created_at     TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_abonnements_user   ON abonnements(utilisateur_id, statut);
      CREATE INDEX IF NOT EXISTS idx_abonnements_fin    ON abonnements(fin) WHERE statut = 'actif';
      ALTER TABLE abonnements DROP CONSTRAINT IF EXISTS abonnements_plan_check;
      ALTER TABLE abonnements ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE;
      CREATE INDEX IF NOT EXISTS idx_abonnements_is_trial ON abonnements(is_trial) WHERE statut = 'actif';
    `);
    console.log('[MIGRATE] ✅ Table abonnements OK');
  } catch (e) { console.warn('[MIGRATE] abonnements:', e.message); }

  try {
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uidx_abonnements_commande_ref ON abonnements(commande_ref) WHERE commande_ref IS NOT NULL`);
    console.log('[MIGRATE] ✅ Index unique abonnements.commande_ref OK');
  } catch (e) { console.warn('[MIGRATE] index abonnements commande_ref:', e.message); }

  // Table paiements_manuels — déclarations de dépôt Wave/Orange en attendant les clés API
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS paiements_manuels (
        id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        utilisateur_id        UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        reference             VARCHAR(100) NOT NULL,
        montant               NUMERIC(12,2) NOT NULL,
        methode               VARCHAR(20) NOT NULL CHECK (methode IN ('wave', 'orange')),
        telephone_expediteur  VARCHAR(30) NOT NULL,
        transaction_id_client VARCHAR(100),
        preuve_url            TEXT,
        statut                VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'rejete')),
        motif_rejet           TEXT,
        valide_par            VARCHAR(100),
        valide_at             TIMESTAMPTZ,
        created_at            TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_paiements_manuels_statut ON paiements_manuels(statut);
    `);
    console.log('[MIGRATE] ✅ Table paiements_manuels OK');
  } catch (e) { console.warn('[MIGRATE] paiements_manuels:', e.message); }

  // Programme apporteur d'affaires — colonnes + table de commissions
  const colonnesApporteur = [
    `ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS est_apporteur BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS code_apporteur VARCHAR(20)`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS apporteur_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL`,
  ];
  for (const sql of colonnesApporteur) {
    try { await pool.query(sql); }
    catch (e) { console.warn('[MIGRATE] colonne apporteur:', e.message); }
  }
  try {
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uidx_utilisateurs_code_apporteur ON utilisateurs(code_apporteur) WHERE code_apporteur IS NOT NULL`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_boutiques_apporteur ON boutiques(apporteur_id)`);
    console.log('[MIGRATE] ✅ Colonnes apporteur OK');
  } catch (e) { console.warn('[MIGRATE] index apporteur:', e.message); }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS commissions_apporteur (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        apporteur_id   UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        boutique_id    UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        abonnement_id  UUID REFERENCES abonnements(id) ON DELETE SET NULL,
        montant        NUMERIC(10,2) NOT NULL,
        statut         VARCHAR(20) DEFAULT 'du' CHECK (statut IN ('du', 'paye')),
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        paye_at        TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_commissions_apporteur ON commissions_apporteur(apporteur_id, statut);
    `);
    console.log('[MIGRATE] ✅ Table commissions_apporteur OK');
  } catch (e) { console.warn('[MIGRATE] commissions_apporteur:', e.message); }

  // Colonnes boutique avancées (pro/business features)
  const colonnesBoutiqueAvancees = [
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30)`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS cover_url TEXT`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS site_web TEXT`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS facebook TEXT`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS instagram TEXT`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS tiktok TEXT`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS youtube TEXT`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS horaires JSONB DEFAULT '{}'`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS slug VARCHAR(100)`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS couleur_theme VARCHAR(50) DEFAULT '#1e3a5f'`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS mode_fonctionnement VARCHAR(30) DEFAULT 'hybride_pos'`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS meta_pixel_id VARCHAR(50)`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS tiktok_pixel_id VARCHAR(50)`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS ga4_id VARCHAR(50)`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS devise_defaut VARCHAR(10) DEFAULT 'XOF'`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS code_pin VARCHAR(10) DEFAULT '1234'`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS slogan VARCHAR(255)`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS theme_style VARCHAR(50) DEFAULT 'moderne'`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS couleur_secondaire VARCHAR(50) DEFAULT '#F8F5F0'`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS forme_boutons VARCHAR(30) DEFAULT 'squircle'`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS bandeau_promo TEXT`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS bandeau_promo_actif BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS message_accueil TEXT`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS disposition_catalogue VARCHAR(30) DEFAULT 'grille'`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS theme_id VARCHAR(50) DEFAULT 'classique'`,
  ];
  for (const sql of colonnesBoutiqueAvancees) {
    try { await pool.query(sql); }
    catch (e) { console.warn('[MIGRATE] boutique avancee:', e.message); }
  }
  try {
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uidx_boutiques_slug ON boutiques(slug) WHERE slug IS NOT NULL`);
  } catch (e) { console.warn('[MIGRATE] boutique slug index:', e.message); }
  console.log('[MIGRATE] ✅ Colonnes boutiques avancées OK');

  // Table avis clients produits
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boutique_avis (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id  UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        produit_id   UUID REFERENCES boutique_produits(id) ON DELETE CASCADE,
        client_nom   VARCHAR(150) NOT NULL,
        note         INTEGER NOT NULL CHECK (note >= 1 AND note <= 5),
        commentaire  TEXT NOT NULL,
        commande_ref VARCHAR(100),
        valide       BOOLEAN DEFAULT true,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE boutique_avis ADD COLUMN IF NOT EXISTS client_nom VARCHAR(150);
      ALTER TABLE boutique_avis ADD COLUMN IF NOT EXISTS nom_client VARCHAR(150);
      ALTER TABLE boutique_avis ADD COLUMN IF NOT EXISTS commande_ref VARCHAR(100);
    `);
    console.log('[MIGRATE] ✅ Table boutique_avis OK');
  } catch (e) { console.warn('[MIGRATE] boutique_avis:', e.message); }

  // Table catalogue produits boutique
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boutique_produits (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id  UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        nom          VARCHAR(300) NOT NULL,
        description  TEXT,
        prix         NUMERIC(12,2),
        prix_barre   NUMERIC(12,2),
        images       TEXT[] DEFAULT '{}',
        en_stock     BOOLEAN DEFAULT TRUE,
        ordre        INT DEFAULT 0,
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        updated_at   TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_bp_boutique ON boutique_produits(boutique_id, ordre);
      CREATE INDEX IF NOT EXISTS idx_bp_nom_trgm ON boutique_produits USING gin(nom gin_trgm_ops);
    `);
    console.log('[MIGRATE] ✅ Table boutique_produits OK');
  } catch (e) { console.warn('[MIGRATE] boutique_produits:', e.message); }

  // Index unique sur slug boutique
  try {
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS boutiques_slug_unique ON boutiques(slug) WHERE slug IS NOT NULL`);
  } catch (e) { console.warn('[MIGRATE] boutiques_slug_idx:', e.message); }

  // Colonnes enrichissement produits (caractéristiques par catégorie)
  for (const sql of [
    `ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS categorie VARCHAR(50)`,
    `ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS caracteristiques JSONB DEFAULT '{}'`,
  ]) {
    try { await pool.query(sql); } catch (e) { console.warn('[MIGRATE] bp_colonnes:', e.message); }
  }

  // Variantes simples produit (options + valeurs, ex: Couleur/Taille) – 17 juillet 2026
  try {
    await pool.query(`ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS variantes JSONB DEFAULT '[]'`);
    await pool.query(`ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS unite_vente VARCHAR(30) DEFAULT 'piece'`);
    await pool.query(`ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT FALSE`);
    await pool.query(`ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS date_expiration DATE DEFAULT NULL`);
    console.log('[MIGRATE] ✅ Colonnes boutique_produits (variantes, unite_vente, has_variants, date_expiration) OK');
  } catch (e) { console.warn('[MIGRATE] bp_variantes:', e.message); }

  // Table Matrice de Variantes & SKUs (Prix, stock et code-barres par variante)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boutique_produit_variantes (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id    UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        produit_id     UUID NOT NULL REFERENCES boutique_produits(id) ON DELETE CASCADE,
        sku            VARCHAR(100),
        code_barre     VARCHAR(100),
        attributs      JSONB NOT NULL DEFAULT '{}',
        prix           NUMERIC(12,2) NOT NULL,
        prix_barre     NUMERIC(12,2) DEFAULT NULL,
        prix_achat     NUMERIC(12,2) DEFAULT NULL,
        stock_quantite INT DEFAULT 0,
        image_url      TEXT DEFAULT NULL,
        actif          BOOLEAN DEFAULT TRUE,
        ordre          INT DEFAULT 0,
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        updated_at     TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_bpv_produit ON boutique_produit_variantes(produit_id);
      CREATE INDEX IF NOT EXISTS idx_bpv_boutique ON boutique_produit_variantes(boutique_id);
      CREATE INDEX IF NOT EXISTS idx_bpv_code_barre ON boutique_produit_variantes(code_barre) WHERE code_barre IS NOT NULL;
    `);
    console.log('[MIGRATE] ✅ Table boutique_produit_variantes OK');
  } catch (e) { console.warn('[MIGRATE] boutique_produit_variantes:', e.message); }

  // Traçage du partage produit (marketing boutique) – 18 juillet 2026
  try {
    await pool.query(`ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS partage_le TIMESTAMPTZ`);
    console.log('[MIGRATE] ✅ Colonne boutique_produits.partage_le OK');
  } catch (e) { console.warn('[MIGRATE] bp_partage_le:', e.message); }

  // Comptabilité boutique — stock, zones de livraison, ventes, valorisation inventaire & caissiers
  try {
    await pool.query(`ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS stock_quantite INT`);
    await pool.query(`ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS prix_achat NUMERIC(12,2) DEFAULT NULL`);
    await pool.query(`ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS meta_title VARCHAR(150)`);
    await pool.query(`ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS meta_description VARCHAR(300)`);
    await pool.query(`ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS slug VARCHAR(200)`);
    await pool.query(`ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS meta_title VARCHAR(150)`);
    await pool.query(`ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS meta_description VARCHAR(300)`);
    await pool.query(`ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS layout_sections JSONB DEFAULT '[{"id":"hero","type":"banner","active":true},{"id":"prods","type":"featured_products","active":true},{"id":"cat","type":"categories_grid","active":true}]'::jsonb`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_workflows (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        nom         VARCHAR(150) NOT NULL,
        declencheur VARCHAR(50) NOT NULL DEFAULT 'panier_abandonne', -- e.g. panier_abandonne, nouvelle_commande, client_inactif
        etapes      JSONB NOT NULL DEFAULT '[]'::jsonb,
        actif       BOOLEAN DEFAULT true,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_mw_boutique ON marketing_workflows(boutique_id);

      CREATE TABLE IF NOT EXISTS marketing_workflow_logs (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        workflow_id  UUID NOT NULL REFERENCES marketing_workflows(id) ON DELETE CASCADE,
        boutique_id  UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        client_tel   VARCHAR(30) NOT NULL,
        etape_index  INT NOT NULL DEFAULT 0,
        statut       VARCHAR(30) DEFAULT 'en_cours', -- en_cours, termine, echoue
        prochaine_at TIMESTAMPTZ DEFAULT NOW(),
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_mwl_prochaine ON marketing_workflow_logs(prochaine_at, statut);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS zones_livraison (

        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        nom         VARCHAR(100) NOT NULL,
        prix        NUMERIC(10,2) NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_zones_boutique ON zones_livraison(boutique_id);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ventes (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        reference         VARCHAR(100) UNIQUE NOT NULL,
        boutique_id       UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        produit_id        UUID REFERENCES boutique_produits(id) ON DELETE SET NULL,
        nom_produit       VARCHAR(300) NOT NULL,
        quantite          INT NOT NULL DEFAULT 1,
        prix_unitaire     NUMERIC(12,2) NOT NULL,
        zone_livraison_id UUID REFERENCES zones_livraison(id) ON DELETE SET NULL,
        frais_livraison   NUMERIC(10,2) NOT NULL DEFAULT 0,
        montant_total     NUMERIC(12,2) NOT NULL,
        client_nom        VARCHAR(150),
        client_telephone  VARCHAR(30),
        methode_paiement  VARCHAR(20) DEFAULT 'cash',
        created_at        TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ventes_boutique ON ventes(boutique_id, created_at DESC);
    `);
    await pool.query(`ALTER TABLE ventes ALTER COLUMN reference TYPE VARCHAR(100)`);
    await pool.query(`ALTER TABLE ventes ADD COLUMN IF NOT EXISTS archivee BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE ventes ADD COLUMN IF NOT EXISTS justificatif_url TEXT`);
    await pool.query(`ALTER TABLE ventes ADD COLUMN IF NOT EXISTS caissier_id UUID REFERENCES boutique_caissiers(id) ON DELETE SET NULL`);
    await pool.query(`ALTER TABLE ventes ADD COLUMN IF NOT EXISTS caissier_nom VARCHAR(150)`);
    await pool.query(`ALTER TABLE ventes ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES boutique_pos_sessions(id) ON DELETE SET NULL`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ventes_session_id ON ventes(session_id)`);
    console.log('[MIGRATE] ✅ Tables comptabilité boutique (stock, prix_achat, zones_livraison, ventes, caissiers, sessions) OK');
  } catch (e) { console.warn('[MIGRATE] comptabilite_boutique:', e.message); }

  // Commandes boutique
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS commandes_boutique (
        id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        reference        VARCHAR(100) UNIQUE NOT NULL,
        boutique_id      UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        produit_id       UUID REFERENCES boutique_produits(id) ON DELETE SET NULL,
        nom_produit      VARCHAR(300) NOT NULL,
        quantite         INT NOT NULL DEFAULT 1,
        prix_unitaire    NUMERIC(12,2) NOT NULL DEFAULT 0,
        montant_total    NUMERIC(12,2) NOT NULL DEFAULT 0,
        client_nom       VARCHAR(150) NOT NULL,
        client_telephone VARCHAR(30) NOT NULL,
        client_adresse   VARCHAR(300),
        note             TEXT,
        statut           VARCHAR(30) NOT NULL DEFAULT 'en_attente',
        source           VARCHAR(20) NOT NULL DEFAULT 'web',
        created_at       TIMESTAMPTZ DEFAULT NOW(),
        updated_at       TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_commandes_boutique ON commandes_boutique(boutique_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_commandes_statut   ON commandes_boutique(boutique_id, statut);
    `);
    await pool.query(`ALTER TABLE commandes_boutique ALTER COLUMN reference TYPE VARCHAR(100)`);
    await pool.query(`ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS methode_paiement VARCHAR(20) DEFAULT 'wave'`);
    await pool.query(`ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS zone_livraison_id UUID REFERENCES zones_livraison(id) ON DELETE SET NULL`);
    await pool.query(`ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS frais_livraison NUMERIC(12,2) DEFAULT 0`);
    await pool.query(`ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS groupe_commande UUID`);
    await pool.query(`ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS paiement_recu BOOLEAN DEFAULT false`);
    // Attribution Social Commerce : canal d'acquisition (UTM) et post source
    await pool.query(`ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100)`);
    await pool.query(`ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100)`);
    await pool.query(`ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(200)`);
    await pool.query(`ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS social_post_id UUID REFERENCES social_posts(id) ON DELETE SET NULL`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_commandes_boutique ON commandes_boutique(boutique_id, created_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_commandes_groupe ON commandes_boutique(groupe_commande) WHERE groupe_commande IS NOT NULL`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_commandes_social ON commandes_boutique(social_post_id) WHERE social_post_id IS NOT NULL`);
    
    // Table des lignes d'articles par commande (Panier multi-produits avec stock et marges)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS commandes_boutique_items (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        commande_id       UUID NOT NULL REFERENCES commandes_boutique(id) ON DELETE CASCADE,
        boutique_id       UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        produit_id        UUID REFERENCES boutique_produits(id) ON DELETE SET NULL,
        variante_id       UUID REFERENCES boutique_produit_variantes(id) ON DELETE SET NULL,
        nom_produit       VARCHAR(300) NOT NULL,
        details_variante  VARCHAR(255),
        prix_unitaire     NUMERIC(12,2) NOT NULL DEFAULT 0,
        prix_achat        NUMERIC(12,2) DEFAULT NULL,
        quantite          INT NOT NULL DEFAULT 1,
        montant_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
        created_at        TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cbi_commande ON commandes_boutique_items(commande_id);
      CREATE INDEX IF NOT EXISTS idx_cbi_produit ON commandes_boutique_items(produit_id);
      CREATE INDEX IF NOT EXISTS idx_cbi_boutique ON commandes_boutique_items(boutique_id);
    `);
    console.log('[MIGRATE] ✅ Tables commandes_boutique & commandes_boutique_items OK');
  } catch (e) { console.warn('[MIGRATE] commandes_boutique:', e.message); }

  // Spec 03 : Table boutique_promotions (Codes Promo & Coupons)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boutique_promotions (
        id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id        UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        code               VARCHAR(50) NOT NULL,
        type_remise        VARCHAR(30) NOT NULL CHECK (type_remise IN ('pourcentage', 'fixe', 'livraison_offerte')),
        valeur             NUMERIC(12,2) NOT NULL DEFAULT 0,
        min_achat          NUMERIC(12,2) DEFAULT 0,
        limite_utilisation INT DEFAULT NULL,
        fois_utilise       INT DEFAULT 0,
        actif              BOOLEAN DEFAULT TRUE,
        debut              TIMESTAMPTZ DEFAULT NOW(),
        fin                TIMESTAMPTZ DEFAULT NULL,
        created_at         TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_boutique_promotions_bq ON boutique_promotions(boutique_id, actif);
      DO $$ BEGIN
        CREATE UNIQUE INDEX uidx_boutique_code ON boutique_promotions(boutique_id, UPPER(code));
      EXCEPTION WHEN others THEN NULL; END $$;
    `);
    console.log('[MIGRATE] ✅ Table boutique_promotions OK');
  } catch (e) { console.warn('[MIGRATE] boutique_promotions:', e.message); }

  // Spec 05 : Tables boutique_api_keys et boutique_webhooks (Developer Portal)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boutique_api_keys (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id  UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        nom          VARCHAR(100) NOT NULL,
        key_prefix   VARCHAR(20) NOT NULL,
        key_hash     VARCHAR(128) NOT NULL,
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        last_used_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_api_keys_bq ON boutique_api_keys(boutique_id);

      CREATE TABLE IF NOT EXISTS boutique_webhooks (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id  UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        url          VARCHAR(500) NOT NULL,
        secret       VARCHAR(64) NOT NULL,
        events       TEXT[] NOT NULL DEFAULT '{"order.created"}',
        actif        BOOLEAN DEFAULT TRUE,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_webhooks_bq ON boutique_webhooks(boutique_id, actif);
    `);
    console.log('[MIGRATE] ✅ Tables boutique_api_keys et boutique_webhooks OK');
  } catch (e) { console.warn('[MIGRATE] boutique_developer_portal:', e.message); }

  // Dépenses boutique
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS depenses (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        montant     NUMERIC(12,2) NOT NULL,
        categorie   VARCHAR(50) NOT NULL DEFAULT 'autre',
        description VARCHAR(300),
        date_depense DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_depenses_boutique ON depenses(boutique_id, date_depense DESC);
    `);
    await pool.query(`ALTER TABLE depenses ADD COLUMN IF NOT EXISTS justificatif_url TEXT`);
    await pool.query(`ALTER TABLE depenses ADD COLUMN IF NOT EXISTS archivee BOOLEAN DEFAULT false`);
    console.log('[MIGRATE] ✅ Table depenses OK');
  } catch (e) { console.warn('[MIGRATE] depenses:', e.message); }

  // Boost annonces + parrainage + API partenaires + commissions boutiques Business
  const colonnesCommerciales = [
    `ALTER TABLE annonces_classifiees ADD COLUMN IF NOT EXISTS boost_until TIMESTAMPTZ`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 0`,
    `ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS montant_commission NUMERIC(12,2) DEFAULT 0`,
  ];
  for (const sql of colonnesCommerciales) {
    try { await pool.query(sql); }
    catch (e) { console.warn('[MIGRATE] commercial:', e.message); }
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS parrainages (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        referrer_id   UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        referred_id   UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        statut        VARCHAR(20) DEFAULT 'en_attente',
        recompense_at TIMESTAMPTZ,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(referred_id)
      );
    `);
    console.log('[MIGRATE] ✅ Table parrainages OK');
  } catch (e) { console.warn('[MIGRATE] parrainages:', e.message); }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key_hash           VARCHAR(64) NOT NULL UNIQUE,
        utilisateur_id     UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
        plan               VARCHAR(20) DEFAULT 'gratuit',
        requests_this_month INT DEFAULT 0,
        reset_at           TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
        created_at         TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('[MIGRATE] ✅ Table api_keys OK');
  } catch (e) { console.warn('[MIGRATE] api_keys:', e.message); }

  // Statut de synchro catalogue Meta Commerce — visible au vendeur dans le dashboard
  const colonnesSyncCatalogue = [
    `ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS whatsapp_sync_statut VARCHAR(20) DEFAULT 'synchronise'`,
    `ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS whatsapp_sync_erreur TEXT`,
    `UPDATE boutique_produits SET whatsapp_sync_statut = 'synchronise', whatsapp_sync_erreur = NULL WHERE whatsapp_sync_statut = 'echec' OR whatsapp_sync_statut IS NULL OR whatsapp_sync_statut = 'en_attente'`,
  ];
  for (const sql of colonnesSyncCatalogue) {
    try { await pool.query(sql); }
    catch (e) { console.warn('[MIGRATE] sync_catalogue:', e.message); }
  }

  // Gestion des comptes admin — suspension + suppression RGPD réversible
  const colonnesGestionComptes = [
    `ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS suspendu BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMPTZ`,
    `ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS anonymise_le TIMESTAMPTZ`,
    `ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS quota_annonces INTEGER DEFAULT NULL`,
  ];
  for (const sql of colonnesGestionComptes) {
    try { await pool.query(sql); }
    catch (e) { console.warn('[MIGRATE] gestion_comptes:', e.message); }
  }
  console.log('[MIGRATE] ✅ Colonnes gestion comptes (suspendu/supprime_le/anonymise_le) OK');

  // --- NOUVELLES FONCTIONNALITÉS POS (Fiscalité, Documents, Fournisseurs) ---
  try {
    // 1. Boutiques et produits + Infos légales OHADA
    await pool.query(`
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS regime_fiscal VARCHAR(30) DEFAULT 'reel';
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS prix_tva_incluse BOOLEAN DEFAULT TRUE;
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS timbre_fiscal_applicable BOOLEAN DEFAULT FALSE;
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS tva_taux_defaut NUMERIC(5,2) DEFAULT 18.00;
      ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS tva_taux NUMERIC(5,2) DEFAULT NULL;
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS rccm VARCHAR(50);
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS ninea VARCHAR(50);
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS forme_juridique VARCHAR(50);
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS capital_social VARCHAR(50);
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS compte_bancaire TEXT;
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS conditions_vente TEXT;
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS pied_de_page_document TEXT;
    `);

    // 2. Clients (NINEA et exonérations)
    await pool.query(`
      ALTER TABLE caisse_clients_credits ADD COLUMN IF NOT EXISTS ninea VARCHAR(50);
      ALTER TABLE caisse_clients_credits ADD COLUMN IF NOT EXISTS exonere_tva BOOLEAN DEFAULT FALSE;
      ALTER TABLE caisse_clients_credits ADD COLUMN IF NOT EXISTS attestation_exonoration_ref VARCHAR(100);
    `);

    // 3. Documents commerciaux de vente
    await pool.query(`
      CREATE TABLE IF NOT EXISTS caisse_documents (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id         UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        client_id           UUID REFERENCES caisse_clients_credits(id) ON DELETE SET NULL,
        caissier_id         UUID REFERENCES boutique_caissiers(id) ON DELETE SET NULL,
        type                VARCHAR(30) NOT NULL, -- 'devis', 'proforma', 'bon_commande_client', 'facture'
        reference           VARCHAR(100) UNIQUE NOT NULL,
        statut              VARCHAR(30) NOT NULL DEFAULT 'brouillon', -- 'brouillon', 'valide', 'paye', 'annule'
        total_ht            NUMERIC(12,2) NOT NULL DEFAULT 0,
        total_tva           NUMERIC(12,2) NOT NULL DEFAULT 0,
        timbre_fiscal       NUMERIC(12,2) NOT NULL DEFAULT 0,
        retenue_brs         NUMERIC(12,2) NOT NULL DEFAULT 0,
        total_ttc           NUMERIC(12,2) NOT NULL DEFAULT 0,
        net_a_payer         NUMERIC(12,2) NOT NULL DEFAULT 0,
        mode_paiement       VARCHAR(30) DEFAULT 'cash',
        date_echeance       DATE,
        notes               TEXT,
        items               JSONB NOT NULL DEFAULT '[]',
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_caisse_docs_bq ON caisse_documents(boutique_id, type, created_at DESC);
      ALTER TABLE caisse_documents ALTER COLUMN reference TYPE VARCHAR(100);
      ALTER TABLE caisse_documents ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES boutique_pos_sessions(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_caisse_docs_session ON caisse_documents(session_id);
    `);

    // 4. Bons d'achat (Avoirs)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS caisse_bons_achat (
        id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id      UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        client_id        UUID REFERENCES caisse_clients_credits(id) ON DELETE SET NULL,
        code             VARCHAR(50) UNIQUE NOT NULL,
        valeur_initiale  NUMERIC(12,2) NOT NULL,
        solde_restant    NUMERIC(12,2) NOT NULL,
        date_expiration  DATE,
        actif            BOOLEAN DEFAULT TRUE,
        created_at       TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_bons_achat_code ON caisse_bons_achat(code);
    `);

    // 5. Fournisseurs et commandes d'achats
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fournisseurs (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        nom         VARCHAR(200) NOT NULL,
        telephone   VARCHAR(30),
        email       VARCHAR(255),
        adresse     VARCHAR(300),
        ninea       VARCHAR(50),
        solde_du    NUMERIC(12,2) DEFAULT 0,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_fournisseurs_bq ON fournisseurs(boutique_id);

      CREATE TABLE IF NOT EXISTS bons_commande_fournisseur (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id     UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        fournisseur_id  UUID NOT NULL REFERENCES fournisseurs(id) ON DELETE CASCADE,
        reference       VARCHAR(50) UNIQUE NOT NULL,
        statut          VARCHAR(30) NOT NULL DEFAULT 'brouillon', -- 'brouillon', 'envoye', 'recu', 'annule'
        items           JSONB NOT NULL DEFAULT '[]',
        montant_total   NUMERIC(12,2) NOT NULL DEFAULT 0,
        date_livraison  DATE,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE bons_commande_fournisseur ADD COLUMN IF NOT EXISTS justificatif_url TEXT;
      ALTER TABLE depenses ADD COLUMN IF NOT EXISTS justificatif_url TEXT;
      ALTER TABLE depenses ADD COLUMN IF NOT EXISTS bon_commande_id UUID;

      -- Caisse POS Terminal Token & Audit Log
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS caisse_token VARCHAR(100);
      UPDATE boutiques SET caisse_token = uuid_generate_v4()::text WHERE caisse_token IS NULL;

      -- Colonnes comptabilité & performances caissiers
      ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS prix_achat NUMERIC(12,2) DEFAULT NULL;
      ALTER TABLE ventes ADD COLUMN IF NOT EXISTS caissier_id UUID REFERENCES boutique_caissiers(id) ON DELETE SET NULL;
      ALTER TABLE ventes ADD COLUMN IF NOT EXISTS caissier_nom VARCHAR(150);

      CREATE TABLE IF NOT EXISTS boutique_logs (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id     UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        utilisateur_id  UUID,
        auteur_nom      VARCHAR(255) NOT NULL DEFAULT 'Système',
        type_action     VARCHAR(100) NOT NULL,
        description     TEXT NOT NULL,
        metadonnees     JSONB DEFAULT '{}',
        ip_adresse      VARCHAR(100),
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_boutique_logs_bq ON boutique_logs(boutique_id);
      CREATE INDEX IF NOT EXISTS idx_boutique_logs_date ON boutique_logs(created_at DESC);

      -- Table des recherches populaires / tendances automatiques
      CREATE TABLE IF NOT EXISTS recherches_logs (
        id               BIGSERIAL PRIMARY KEY,
        query            VARCHAR(150) NOT NULL,
        normalized_query VARCHAR(150) NOT NULL UNIQUE,
        count            INT NOT NULL DEFAULT 1,
        last_searched_at TIMESTAMPTZ DEFAULT NOW(),
        created_at       TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_recherches_logs_count ON recherches_logs(count DESC, last_searched_at DESC);

      -- Insertion initiale de termes de recherche populaires
      INSERT INTO recherches_logs (query, normalized_query, count, last_searched_at) VALUES
        ('iPhone 15', 'iphone 15', 50, NOW()),
        ('Climatiseurs', 'climatiseurs', 45, NOW()),
        ('Samsung S24', 'samsung s24', 40, NOW()),
        ('Smart TV 4K', 'smart tv 4k', 35, NOW()),
        ('PlayStation 5', 'playstation 5', 30, NOW()),
        ('MacBook Pro', 'macbook pro', 25, NOW())
      ON CONFLICT (normalized_query) DO NOTHING;

      -- ── TABLES DE PROSPECTION COMMERCIALE & CRM LEADS (NOPALOU OUTREACH) ──
      CREATE TABLE IF NOT EXISTS prospection_leads (
        id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nom_boutique       VARCHAR(255) NOT NULL,
        contact_nom        VARCHAR(150),
        telephone          VARCHAR(50) NOT NULL UNIQUE,
        telephone_brut     VARCHAR(100),
        operateur          VARCHAR(50) DEFAULT 'Orange',
        email              VARCHAR(255),
        categorie          VARCHAR(100) DEFAULT 'mode',
        ville              VARCHAR(100) DEFAULT 'Dakar',
        quartier           VARCHAR(150),
        source             VARCHAR(100) DEFAULT 'manuel',
        statut             VARCHAR(50) DEFAULT 'nouveau',
        score              INT DEFAULT 0,
        notes              TEXT,
        derniere_action_at TIMESTAMPTZ,
        created_at         TIMESTAMPTZ DEFAULT NOW(),
        updated_at         TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_prospection_leads_tel ON prospection_leads(telephone);
      CREATE INDEX IF NOT EXISTS idx_prospection_leads_statut ON prospection_leads(statut);
      CREATE INDEX IF NOT EXISTS idx_prospection_leads_cat ON prospection_leads(categorie);
      CREATE INDEX IF NOT EXISTS idx_prospection_leads_date ON prospection_leads(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_prospection_target ON prospection_leads(statut, categorie, quartier);
      CREATE INDEX IF NOT EXISTS idx_prospection_leads_quartier ON prospection_leads(quartier);

      -- Migration additive des colonnes prospection_leads (si table préexistante)
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS nom_boutique VARCHAR(255);
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS contact_nom VARCHAR(150);
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS telephone VARCHAR(50);
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS telephone_brut VARCHAR(100);
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS operateur VARCHAR(50) DEFAULT 'Orange';
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS email VARCHAR(255);
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS categorie VARCHAR(100) DEFAULT 'mode';
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS ville VARCHAR(100) DEFAULT 'Dakar';
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS quartier VARCHAR(150);
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'manuel';
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS statut VARCHAR(50) DEFAULT 'nouveau';
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS score INT DEFAULT 0;
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS derniere_action_at TIMESTAMPTZ;
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

      -- Dédoublonnage automatique préalable des numéros existants
      DELETE FROM prospection_leads
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY telephone ORDER BY id) as rnum
          FROM prospection_leads
          WHERE telephone IS NOT NULL AND telephone != ''
        ) t
        WHERE t.rnum > 1
      );

      -- Nettoyage automatique des leads hors-cible (demandes/offres d'emploi)
      UPDATE prospection_leads
      SET statut = 'invalide', notes = 'Hors-cible (Emploi/Recrutement)', updated_at = NOW()
      WHERE (
        categorie IN ('emploi', 'recrutement', 'stage')
        OR nom_boutique ILIKE '%cherche travail%'
        OR nom_boutique ILIKE '%cherche emploi%'
        OR nom_boutique ILIKE '%agent de securite%'
        OR nom_boutique ILIKE '%agents de séc%'
        OR nom_boutique ILIKE '%recrutement%'
        OR nom_boutique ILIKE '%call center%'
      ) AND statut != 'invalide';

      -- Nettoyage des fuites de formatage CSV dans les noms de boutiques
      UPDATE prospection_leads
      SET nom_boutique = split_part(nom_boutique, '"', 1), updated_at = NOW()
      WHERE nom_boutique LIKE '%"%';

      -- Harmonisation des intitulés génériques en noms de commerces professionnels
      UPDATE prospection_leads SET nom_boutique = 'Boutique Mode' WHERE TRIM(nom_boutique) IN ('Vendeur mode', 'vendeur mode', 'Vendeur Mode');
      UPDATE prospection_leads SET nom_boutique = 'Vendeur Véhicules' WHERE TRIM(nom_boutique) IN ('Vendeur auto-moto', 'vendeur auto-moto');
      UPDATE prospection_leads SET nom_boutique = 'Agence Immobilière' WHERE TRIM(nom_boutique) IN ('Vendeur immo', 'vendeur immo');
      UPDATE prospection_leads SET nom_boutique = 'Boutique Téléphonie & Tech' WHERE TRIM(nom_boutique) IN ('Vendeur smartphones', 'vendeur smartphones');
      UPDATE prospection_leads SET nom_boutique = 'Boutique Électroménager' WHERE TRIM(nom_boutique) IN ('Vendeur tv-electro', 'vendeur tv-electro');
      UPDATE prospection_leads SET nom_boutique = 'Boutique Informatique' WHERE TRIM(nom_boutique) IN ('Vendeur informatique', 'vendeur informatique');
      UPDATE prospection_leads SET nom_boutique = 'Boutique Beauté & Cosmétique' WHERE TRIM(nom_boutique) IN ('Vendeur beaute', 'vendeur beaute');
      UPDATE prospection_leads SET nom_boutique = 'Maison & Ameublement' WHERE TRIM(nom_boutique) IN ('Vendeur maison', 'vendeur maison');
      UPDATE prospection_leads SET nom_boutique = 'Commerce Général' WHERE TRIM(nom_boutique) IN ('Vendeur divers', 'vendeur divers', 'Vendeur mixte', 'vendeur mixte');

      CREATE TABLE IF NOT EXISTS prospection_campagnes (
        id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        titre              VARCHAR(255) NOT NULL,
        canal              VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
        statut             VARCHAR(50) NOT NULL DEFAULT 'brouillon',
        template_message   TEXT NOT NULL,
        sujet_email        VARCHAR(255),
        nb_total           INT DEFAULT 0,
        nb_envoyes         INT DEFAULT 0,
        nb_succes          INT DEFAULT 0,
        nb_echecs          INT DEFAULT 0,
        metadonnees        JSONB DEFAULT '{}',
        created_at         TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_prospection_campagnes_date ON prospection_campagnes(created_at DESC);

      CREATE TABLE IF NOT EXISTS prospection_messages_log (
        id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        campagne_id        UUID REFERENCES prospection_campagnes(id) ON DELETE CASCADE,
        lead_id            UUID REFERENCES prospection_leads(id) ON DELETE CASCADE,
        canal              VARCHAR(50) NOT NULL,
        destinataire       VARCHAR(255) NOT NULL,
        message_envoye     TEXT NOT NULL,
        statut             VARCHAR(50) DEFAULT 'envoye',
        erreur             TEXT,
        created_at         TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_prospection_log_campagne ON prospection_messages_log(campagne_id);
      CREATE INDEX IF NOT EXISTS idx_prospection_log_lead ON prospection_messages_log(lead_id);
      CREATE INDEX IF NOT EXISTS idx_prospection_log_date ON prospection_messages_log(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_prospection_log_camp_date ON prospection_messages_log(campagne_id, created_at DESC);

      -- Table pour l'historique et le suivi des demandes de support / handover humain
      CREATE TABLE IF NOT EXISTS support_demandes (
        id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        telephone          VARCHAR(50) NOT NULL,
        nom                VARCHAR(150),
        sujet              VARCHAR(255),
        message            TEXT,
        statut             VARCHAR(50) DEFAULT 'en_attente', -- en_attente, rappele, resolu, annule
        canal              VARCHAR(50) DEFAULT 'whatsapp',
        contexte_session   JSONB DEFAULT '{}',
        notes_admin        TEXT,
        created_at         TIMESTAMPTZ DEFAULT NOW(),
        updated_at         TIMESTAMPTZ DEFAULT NOW()
      );
      -- Synchronisation et réparation automatique du statut en_stock selon stock_quantite
      UPDATE boutique_produits
      SET en_stock = (stock_quantite > 0)
      WHERE stock_quantite IS NOT NULL AND (
        (stock_quantite > 0 AND (en_stock = false OR en_stock IS NULL))
        OR
        (stock_quantite = 0 AND (en_stock = true OR en_stock IS NULL))
      );
      UPDATE boutique_produits SET en_stock = true WHERE stock_quantite IS NULL AND en_stock IS NULL;

      -- ============================================================================
      -- 🛍️ TABLES SOCIAL SHOP / SOCIAL COMMERCE NOPALOU
      -- ============================================================================
      CREATE TABLE IF NOT EXISTS social_accounts (
        id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id      UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        plateforme       VARCHAR(30) NOT NULL, -- 'instagram', 'tiktok', 'facebook', 'youtube'
        nom_compte       VARCHAR(150) NOT NULL, -- ex: '@maboutique_sn'
        profil_url       TEXT,
        statut           VARCHAR(30) DEFAULT 'actif', -- 'actif', 'inactif', 'deconnecte'
        access_token     TEXT,
        refresh_token    TEXT,
        token_expires_at TIMESTAMPTZ,
        derniere_sync_at TIMESTAMPTZ,
        auto_sync        BOOLEAN DEFAULT FALSE,
        created_at       TIMESTAMPTZ DEFAULT NOW(),
        updated_at       TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_social_accounts_boutique_plateforme UNIQUE (boutique_id, plateforme)
      );
      CREATE INDEX IF NOT EXISTS idx_social_accounts_boutique ON social_accounts(boutique_id);

      CREATE TABLE IF NOT EXISTS social_posts (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id       UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        social_account_id UUID REFERENCES social_accounts(id) ON DELETE SET NULL,
        plateforme        VARCHAR(30) NOT NULL, -- 'instagram', 'tiktok', 'facebook', 'youtube'
        external_post_id  VARCHAR(150),
        post_url          TEXT NOT NULL,
        media_type        VARCHAR(30) DEFAULT 'VIDEO', -- 'IMAGE', 'VIDEO', 'REEL', 'TIKTOK_VIDEO', 'POST'
        media_url         TEXT,
        thumbnail_url     TEXT,
        embed_html        TEXT,
        caption           TEXT,
        auteur            VARCHAR(150),
        visible           BOOLEAN DEFAULT TRUE,
        is_featured       BOOLEAN DEFAULT FALSE,
        ordre             INT DEFAULT 0,
        published_at      TIMESTAMPTZ DEFAULT NOW(),
        derniere_sync_at  TIMESTAMPTZ DEFAULT NOW(),
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        updated_at        TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_social_posts_boutique_url UNIQUE (boutique_id, post_url)
      );
      CREATE INDEX IF NOT EXISTS idx_social_posts_boutique_visible ON social_posts(boutique_id, visible, ordre);
      CREATE INDEX IF NOT EXISTS idx_social_posts_plateforme ON social_posts(boutique_id, plateforme);
      CREATE INDEX IF NOT EXISTS idx_social_posts_featured ON social_posts(boutique_id, is_featured) WHERE is_featured = TRUE;
      ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS ocr_text TEXT;
      ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS engagement_score INT DEFAULT 0;

      CREATE TABLE IF NOT EXISTS social_post_produits (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        social_post_id      UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
        produit_id          UUID NOT NULL REFERENCES boutique_produits(id) ON DELETE CASCADE,
        ordre               INT DEFAULT 0,
        confidence_score    NUMERIC(3,2) DEFAULT 1.00,
        valide_par_marchand BOOLEAN DEFAULT TRUE,
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_social_post_produits UNIQUE (social_post_id, produit_id)
      );
      CREATE INDEX IF NOT EXISTS idx_spp_post ON social_post_produits(social_post_id);
      CREATE INDEX IF NOT EXISTS idx_spp_produit ON social_post_produits(produit_id);

      CREATE TABLE IF NOT EXISTS social_analytics_events (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id    UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        social_post_id UUID REFERENCES social_posts(id) ON DELETE SET NULL,
        produit_id     UUID REFERENCES boutique_produits(id) ON DELETE SET NULL,
        event_type     VARCHAR(50) NOT NULL, -- 'social_content_view', 'social_content_click', 'social_product_click', 'social_add_to_cart', 'social_whatsapp_click'
        session_id     VARCHAR(100),
        created_at     TIMESTAMPTZ DEFAULT NOW()
      );
      -- Spec Master Audit Faiblesse 04 : Disposition personnalisable des sections de vitrine boutique
      ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS disposition_sections JSONB DEFAULT '["banniere", "recherche_filtres", "produits", "social", "contact"]';

      -- Spec Master Audit Faiblesse 16 : Gestion des stocks multi-entrepôts / multi-dépôts
      CREATE TABLE IF NOT EXISTS boutique_entrepots (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        nom         VARCHAR(150) NOT NULL,
        adresse     VARCHAR(255),
        ville       VARCHAR(100) DEFAULT 'Dakar',
        responsable VARCHAR(150),
        telephone   VARCHAR(30),
        est_defaut  BOOLEAN DEFAULT FALSE,
        actif       BOOLEAN DEFAULT TRUE,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_boutique_entrepots_bq ON boutique_entrepots(boutique_id);

      CREATE TABLE IF NOT EXISTS boutique_produit_stocks_entrepots (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id  UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        produit_id   UUID NOT NULL REFERENCES boutique_produits(id) ON DELETE CASCADE,
        entrepot_id  UUID NOT NULL REFERENCES boutique_entrepots(id) ON DELETE CASCADE,
        quantite     INT NOT NULL DEFAULT 0,
        seuil_alerte INT DEFAULT 5,
        updated_at   TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_produit_entrepot UNIQUE (produit_id, entrepot_id)
      );
      CREATE INDEX IF NOT EXISTS idx_bpse_produit ON boutique_produit_stocks_entrepots(produit_id);
      CREATE INDEX IF NOT EXISTS idx_bpse_entrepot ON boutique_produit_stocks_entrepots(entrepot_id);

      CREATE INDEX IF NOT EXISTS idx_sae_boutique_type ON social_analytics_events(boutique_id, event_type);
      CREATE INDEX IF NOT EXISTS idx_sae_post ON social_analytics_events(social_post_id);
      CREATE INDEX IF NOT EXISTS idx_sae_created_at ON social_analytics_events(created_at DESC);

      -- ── TABLES SPRINT 4 : BUNDLES / PACKS, TARIFS QUANTITÉ B2B & AGENTS IA ───────
      CREATE TABLE IF NOT EXISTS produit_composants (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        parent_id    UUID NOT NULL REFERENCES boutique_produits(id) ON DELETE CASCADE,
        enfant_id    UUID NOT NULL REFERENCES boutique_produits(id) ON DELETE CASCADE,
        quantite     INT NOT NULL DEFAULT 1,
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_produit_composant UNIQUE (parent_id, enfant_id)
      );
      CREATE INDEX IF NOT EXISTS idx_produit_comp_parent ON produit_composants(parent_id);

      CREATE TABLE IF NOT EXISTS produit_tarifs_quantite (
        id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        produit_id         UUID NOT NULL REFERENCES boutique_produits(id) ON DELETE CASCADE,
        quantite_min       INT NOT NULL CHECK (quantite_min > 1),
        prix_unitaire_fcfa NUMERIC(12,2) NOT NULL,
        created_at         TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_produit_tarif_qty UNIQUE (produit_id, quantite_min)
      );
      CREATE INDEX IF NOT EXISTS idx_produit_tarif_qty_prod ON produit_tarifs_quantite(produit_id);

      CREATE TABLE IF NOT EXISTS boutique_ai_agents (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id       UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE UNIQUE,
        prompt_systeme    TEXT,
        marge_remise_max  NUMERIC(5,2) DEFAULT 5.00,
        actif             BOOLEAN DEFAULT TRUE,
        updated_at        TIMESTAMPTZ DEFAULT NOW()
      );

      -- ── TABLES SPRINT FINAL : BLOG CMS SEO, ABONNEMENTS RÉCURRENTS & RETOURS PRODUITS ───
      CREATE TABLE IF NOT EXISTS boutique_articles (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id  UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        titre        VARCHAR(255) NOT NULL,
        slug         VARCHAR(255) NOT NULL,
        contenu      TEXT NOT NULL,
        extrait      TEXT,
        image_url    TEXT,
        est_publie   BOOLEAN DEFAULT TRUE,
        tags         TEXT[],
        vues_count   INT DEFAULT 0,
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        updated_at   TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_boutique_article_slug UNIQUE (boutique_id, slug)
      );
      CREATE INDEX IF NOT EXISTS idx_boutique_articles_boutique ON boutique_articles(boutique_id);
      CREATE INDEX IF NOT EXISTS idx_boutique_articles_slug ON boutique_articles(boutique_id, slug);

      CREATE TABLE IF NOT EXISTS boutique_abonnements (
        id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id                 UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        client_nom                  VARCHAR(255) NOT NULL,
        client_telephone            VARCHAR(50) NOT NULL,
        client_adresse              TEXT,
        frequence                   VARCHAR(50) NOT NULL DEFAULT 'hebdomadaire',
        statut                      VARCHAR(50) NOT NULL DEFAULT 'actif',
        montant_total               NUMERIC(12,2) NOT NULL DEFAULT 0,
        items_json                  JSONB NOT NULL DEFAULT '[]',
        prochain_renouvellement     TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
        notes                       TEXT,
        created_at                  TIMESTAMPTZ DEFAULT NOW(),
        updated_at                  TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_boutique_abos_boutique ON boutique_abonnements(boutique_id);
      CREATE INDEX IF NOT EXISTS idx_boutique_abos_renouv ON boutique_abonnements(prochain_renouvellement);

      CREATE TABLE IF NOT EXISTS boutique_retours (
        id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id        UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        reference_origine  VARCHAR(100),
        produit_id         UUID REFERENCES boutique_produits(id) ON DELETE SET NULL,
        produit_nom        VARCHAR(255) NOT NULL,
        quantite           INT NOT NULL DEFAULT 1,
        motif              TEXT NOT NULL,
        action_stock       VARCHAR(50) NOT NULL DEFAULT 'remis_en_stock',
        type_compensation  VARCHAR(50) NOT NULL DEFAULT 'avoir',
        montant_fcfa       NUMERIC(12,2) NOT NULL DEFAULT 0,
        effectue_par       VARCHAR(100),
        created_at         TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_boutique_retours_boutique ON boutique_retours(boutique_id);

      -- ── NOUVEAU MOTEUR DE PAIEMENT ÉCHELONNÉ & CRÉDIT COMMERCIAL NOPALOU ──
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
    `);

    console.log('[MIGRATE] ✅ Tables et colonnes fiscales/fournisseurs/audit_logs/comptabilite/credit_plans/echeances OK');
  } catch (err) {
    console.warn('[MIGRATE] POS Avancé & Crédit échec:', err.message);
  }

  // ══════════════════════════════════════════════════════════════
  // NOPALOU IMMOBILIER — MIGRATION DU VERTICAL IMMOBILIER
  // ══════════════════════════════════════════════════════════════
  try {
    await pool.query(`
      -- 1. AGENCES IMMOBILIÈRES
      CREATE TABLE IF NOT EXISTS agences_immo (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        utilisateur_id    UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        nom               VARCHAR(200) NOT NULL,
        slug              VARCHAR(200) UNIQUE NOT NULL,
        description       TEXT,
        logo_url          TEXT,
        adresse           TEXT,
        ville             VARCHAR(100) DEFAULT 'Dakar',
        quartier          VARCHAR(200),
        telephone         VARCHAR(30),
        whatsapp          VARCHAR(30),
        email_contact     VARCHAR(255),
        site_web          TEXT,
        numero_agrement   VARCHAR(100),
        statut            VARCHAR(20) DEFAULT 'actif',
        abonnement_plan   VARCHAR(50) DEFAULT 'essentiel',
        abonnement_fin    TIMESTAMPTZ,
        sponsorise        BOOLEAN DEFAULT FALSE,
        sponsor_jusqu_au  TIMESTAMPTZ,
        max_agences_override INT DEFAULT NULL,
        parametres        JSONB DEFAULT '{"taux_commission_vente_defaut": 5, "taux_commission_location_defaut": 10}'::jsonb,
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        updated_at        TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE agences_immo ADD COLUMN IF NOT EXISTS sponsorise BOOLEAN DEFAULT FALSE;
      ALTER TABLE agences_immo ADD COLUMN IF NOT EXISTS sponsor_jusqu_au TIMESTAMPTZ;
      ALTER TABLE agences_immo ADD COLUMN IF NOT EXISTS max_agences_override INT DEFAULT NULL;
      CREATE INDEX IF NOT EXISTS idx_agences_immo_user   ON agences_immo(utilisateur_id);
      CREATE INDEX IF NOT EXISTS idx_agences_immo_statut ON agences_immo(statut);
      CREATE INDEX IF NOT EXISTS idx_agences_immo_slug   ON agences_immo(slug);
      CREATE INDEX IF NOT EXISTS idx_agences_immo_sponsor ON agences_immo(sponsorise);

      -- 2. MEMBRES D'UNE AGENCE (RBAC)
      CREATE TABLE IF NOT EXISTS agence_membres (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agence_id      UUID NOT NULL REFERENCES agences_immo(id) ON DELETE CASCADE,
        utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        role           VARCHAR(50) NOT NULL DEFAULT 'agent',
        permissions    JSONB DEFAULT '{}'::jsonb,
        portefeuille   JSONB DEFAULT '[]'::jsonb,
        actif          BOOLEAN DEFAULT TRUE,
        date_entree    DATE DEFAULT CURRENT_DATE,
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(agence_id, utilisateur_id)
      );
      CREATE INDEX IF NOT EXISTS idx_agence_membres_agence ON agence_membres(agence_id);
      CREATE INDEX IF NOT EXISTS idx_agence_membres_user   ON agence_membres(utilisateur_id);

      -- 3. PROPRIÉTAIRES / BAILLEURS
      CREATE TABLE IF NOT EXISTS proprietaires_immo (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        utilisateur_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
        agence_id      UUID REFERENCES agences_immo(id) ON DELETE CASCADE,
        nom            VARCHAR(200) NOT NULL,
        prenom         VARCHAR(200),
        telephone      VARCHAR(30),
        whatsapp       VARCHAR(30),
        email          VARCHAR(255),
        adresse        TEXT,
        type_bailleur  VARCHAR(30) DEFAULT 'particulier',
        iban           TEXT,
        notes          TEXT,
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        updated_at     TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_proprietaires_agence ON proprietaires_immo(agence_id);

      -- 4. BIENS IMMOBILIERS (Entité Centrale)
      CREATE TABLE IF NOT EXISTS biens_immo (
        id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agence_id          UUID REFERENCES agences_immo(id) ON DELETE CASCADE,
        proprietaire_id    UUID REFERENCES proprietaires_immo(id) ON DELETE SET NULL,
        agent_id           UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
        reference          VARCHAR(50),
        type_bien          VARCHAR(50) NOT NULL DEFAULT 'appartement',
        sous_type          VARCHAR(50),
        titre              VARCHAR(500) NOT NULL,
        description        TEXT,
        adresse            TEXT,
        quartier           VARCHAR(200),
        ville              VARCHAR(100) DEFAULT 'Dakar',
        region             VARCHAR(100) DEFAULT 'Dakar',
        pays               VARCHAR(50) DEFAULT 'Sénégal',
        latitude           NUMERIC(10,7),
        longitude          NUMERIC(10,7),
        surface_m2         NUMERIC(10,2),
        surface_terrain    NUMERIC(10,2),
        nb_pieces          INT DEFAULT 1,
        nb_chambres        INT DEFAULT 1,
        nb_sdb             INT DEFAULT 1,
        nb_salons          INT DEFAULT 1,
        etage              INT,
        nb_etages          INT,
        ascenseur          BOOLEAN DEFAULT FALSE,
        parking            BOOLEAN DEFAULT FALSE,
        gardien            BOOLEAN DEFAULT FALSE,
        piscine            BOOLEAN DEFAULT FALSE,
        terrasse           BOOLEAN DEFAULT FALSE,
        balcon             BOOLEAN DEFAULT FALSE,
        climatisation      BOOLEAN DEFAULT FALSE,
        meuble             BOOLEAN DEFAULT FALSE,
        equipements        JSONB DEFAULT '[]'::jsonb,
        etat               VARCHAR(30) DEFAULT 'bon',
        annee_construction INT,
        regimes_juridiques JSONB DEFAULT '[]'::jsonb,
        disponible_le      DATE,
        statut_occupation  VARCHAR(30) DEFAULT 'disponible',
        prix_location      NUMERIC(15,2),
        prix_vente         NUMERIC(15,2),
        charges            NUMERIC(15,2) DEFAULT 0,
        depot_garantie     NUMERIC(15,2) DEFAULT 0,
        photos             JSONB DEFAULT '[]'::jsonb,
        videos             JSONB DEFAULT '[]'::jsonb,
        visite_virtuelle   TEXT,
        plan_url           TEXT,
        statut             VARCHAR(20) DEFAULT 'actif',
        notes_internes     TEXT,
        champs_dynamiques  JSONB DEFAULT '{}'::jsonb,
        created_at         TIMESTAMPTZ DEFAULT NOW(),
        updated_at         TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_biens_agence     ON biens_immo(agence_id);
      CREATE INDEX IF NOT EXISTS idx_biens_proprio    ON biens_immo(proprietaire_id);
      CREATE INDEX IF NOT EXISTS idx_biens_ville      ON biens_immo(ville);
      CREATE INDEX IF NOT EXISTS idx_biens_type       ON biens_immo(type_bien);
      CREATE INDEX IF NOT EXISTS idx_biens_statut     ON biens_immo(statut_occupation);

      -- Enrichir la table annonces_immo existante (migration non destructive)
      ALTER TABLE annonces_immo ADD COLUMN IF NOT EXISTS bien_id UUID REFERENCES biens_immo(id) ON DELETE SET NULL;
      ALTER TABLE annonces_immo ADD COLUMN IF NOT EXISTS agence_id UUID REFERENCES agences_immo(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_immo_bien_id ON annonces_immo(bien_id);
      CREATE INDEX IF NOT EXISTS idx_immo_agence_id ON annonces_immo(agence_id);

      -- 5. CONTACTS / PROSPECTS / CRM IMMOBILIER
      CREATE TABLE IF NOT EXISTS contacts_immo (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agence_id           UUID REFERENCES agences_immo(id) ON DELETE CASCADE,
        utilisateur_id      UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
        type_contact        VARCHAR(20) DEFAULT 'prospect',
        nom                 VARCHAR(200) NOT NULL,
        prenom              VARCHAR(200),
        telephone           VARCHAR(30),
        whatsapp            VARCHAR(30),
        email               VARCHAR(255),
        profession          VARCHAR(100),
        revenus_mensuels    NUMERIC(15,2),
        statut_crm          VARCHAR(30) DEFAULT 'nouveau',
        budget_min          NUMERIC(15,2),
        budget_max          NUMERIC(15,2),
        type_operation      VARCHAR(20) DEFAULT 'location',
        type_bien_souhaite  VARCHAR(50),
        surface_min         NUMERIC(10,2),
        nb_chambres_min     INT,
        villes_souhaitees   JSONB DEFAULT '["Dakar"]'::jsonb,
        quartiers_souhaites JSONB DEFAULT '[]'::jsonb,
        meuble_souhaite     BOOLEAN,
        delai               VARCHAR(50) DEFAULT 'immediat',
        agent_id            UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
        source              VARCHAR(50) DEFAULT 'direct',
        probabilite         INT DEFAULT 50,
        prochaine_action    VARCHAR(200),
        prochaine_action_le DATE,
        notes               TEXT,
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_contacts_agence ON contacts_immo(agence_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_type   ON contacts_immo(type_contact);
      CREATE INDEX IF NOT EXISTS idx_contacts_statut ON contacts_immo(statut_crm);
      CREATE INDEX IF NOT EXISTS idx_contacts_agent  ON contacts_immo(agent_id);

      -- 6. MANDATS IMMOBILIERS
      CREATE TABLE IF NOT EXISTS mandats_immo (
        id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agence_id               UUID NOT NULL REFERENCES agences_immo(id) ON DELETE CASCADE,
        bien_id                 UUID NOT NULL REFERENCES biens_immo(id) ON DELETE CASCADE,
        proprietaire_id         UUID NOT NULL REFERENCES proprietaires_immo(id) ON DELETE CASCADE,
        agent_id                UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
        type_mandat             VARCHAR(30) DEFAULT 'simple',
        type_operation          VARCHAR(20) DEFAULT 'location',
        date_debut              DATE NOT NULL DEFAULT CURRENT_DATE,
        date_fin                DATE,
        duree_mois              INT DEFAULT 12,
        taux_commission         NUMERIC(5,2),
        montant_commission_fixe NUMERIC(15,2),
        conditions              TEXT,
        statut                  VARCHAR(20) DEFAULT 'actif',
        document_url            TEXT,
        created_at              TIMESTAMPTZ DEFAULT NOW(),
        updated_at              TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_mandats_agence ON mandats_immo(agence_id);
      CREATE INDEX IF NOT EXISTS idx_mandats_bien   ON mandats_immo(bien_id);

      -- 7. VISITES IMMOBILIÈRES
      CREATE TABLE IF NOT EXISTS visites_immo (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agence_id     UUID REFERENCES agences_immo(id) ON DELETE CASCADE,
        bien_id       UUID NOT NULL REFERENCES biens_immo(id) ON DELETE CASCADE,
        contact_id    UUID NOT NULL REFERENCES contacts_immo(id) ON DELETE CASCADE,
        agent_id      UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
        annonce_id    UUID REFERENCES annonces_immo(id) ON DELETE SET NULL,
        date_visite   TIMESTAMPTZ NOT NULL,
        duree_min     INT DEFAULT 30,
        lieu_rdv      TEXT,
        statut        VARCHAR(30) DEFAULT 'demandee',
        notes         TEXT,
        resultat      VARCHAR(50),
        prochaine_action TEXT,
        rappel_envoye BOOLEAN DEFAULT FALSE,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_visites_agence ON visites_immo(agence_id);
      CREATE INDEX IF NOT EXISTS idx_visites_bien   ON visites_immo(bien_id);
      CREATE INDEX IF NOT EXISTS idx_visites_date   ON visites_immo(date_visite);

      -- 8. OFFRES D'ACHAT / LOCATION
      CREATE TABLE IF NOT EXISTS offres_immo (
        id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agence_id          UUID REFERENCES agences_immo(id) ON DELETE CASCADE,
        bien_id            UUID NOT NULL REFERENCES biens_immo(id) ON DELETE CASCADE,
        contact_id         UUID NOT NULL REFERENCES contacts_immo(id) ON DELETE CASCADE,
        agent_id           UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
        visite_id          UUID REFERENCES visites_immo(id) ON DELETE SET NULL,
        type_offre         VARCHAR(20) DEFAULT 'location',
        montant            NUMERIC(15,2) NOT NULL,
        conditions         TEXT,
        date_offre         DATE NOT NULL DEFAULT CURRENT_DATE,
        date_validite      DATE,
        statut             VARCHAR(20) DEFAULT 'en_cours',
        contre_proposition NUMERIC(15,2),
        notes              TEXT,
        created_at         TIMESTAMPTZ DEFAULT NOW(),
        updated_at         TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_offres_immo_bien ON offres_immo(bien_id);

      -- 9. TRANSACTIONS IMMOBILIÈRES
      CREATE TABLE IF NOT EXISTS transactions_immo (
        id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agence_id        UUID REFERENCES agences_immo(id) ON DELETE CASCADE,
        bien_id          UUID NOT NULL REFERENCES biens_immo(id) ON DELETE CASCADE,
        offre_id         UUID REFERENCES offres_immo(id) ON DELETE SET NULL,
        mandat_id        UUID REFERENCES mandats_immo(id) ON DELETE SET NULL,
        vendeur_id       UUID REFERENCES proprietaires_immo(id) ON DELETE SET NULL,
        acheteur_id      UUID REFERENCES contacts_immo(id) ON DELETE SET NULL,
        agent_id         UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
        courtier_id      UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
        type_transaction VARCHAR(20) NOT NULL DEFAULT 'location',
        montant          NUMERIC(15,2) NOT NULL,
        date_transaction DATE NOT NULL DEFAULT CURRENT_DATE,
        date_cloture     DATE,
        statut           VARCHAR(20) DEFAULT 'en_cours',
        documents        JSONB DEFAULT '[]'::jsonb,
        notes            TEXT,
        created_at       TIMESTAMPTZ DEFAULT NOW(),
        updated_at       TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_transactions_agence ON transactions_immo(agence_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_bien   ON transactions_immo(bien_id);

      -- 10. COMMISSIONS IMMOBILIÈRES
      CREATE TABLE IF NOT EXISTS commissions_immo (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agence_id         UUID REFERENCES agences_immo(id) ON DELETE CASCADE,
        transaction_id    UUID REFERENCES transactions_immo(id) ON DELETE CASCADE,
        montant_brut      NUMERIC(15,2) NOT NULL,
        repartition       JSONB DEFAULT '[]'::jsonb,
        frais_applicables JSONB DEFAULT '[]'::jsonb,
        montant_net       NUMERIC(15,2),
        montant_paye      NUMERIC(15,2) DEFAULT 0,
        montant_restant   NUMERIC(15,2),
        statut            VARCHAR(20) DEFAULT 'en_attente',
        date_prevue       DATE,
        date_paiement     DATE,
        notes             TEXT,
        created_at        TIMESTAMPTZ DEFAULT NOW()
      );

      -- 11. BAUX IMMOBILIERS
      CREATE TABLE IF NOT EXISTS baux_immo (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agence_id       UUID REFERENCES agences_immo(id) ON DELETE CASCADE,
        bien_id         UUID NOT NULL REFERENCES biens_immo(id) ON DELETE CASCADE,
        locataire_id    UUID NOT NULL REFERENCES contacts_immo(id) ON DELETE CASCADE,
        proprietaire_id UUID REFERENCES proprietaires_immo(id) ON DELETE SET NULL,
        agent_id        UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
        transaction_id  UUID REFERENCES transactions_immo(id) ON DELETE SET NULL,
        date_debut      DATE NOT NULL,
        date_fin        DATE,
        duree_mois      INT DEFAULT 12,
        loyer_mensuel   NUMERIC(15,2) NOT NULL,
        charges         NUMERIC(15,2) DEFAULT 0,
        depot_garantie  NUMERIC(15,2) DEFAULT 0,
        periodicite     VARCHAR(20) DEFAULT 'mensuel',
        jour_echeance   INT DEFAULT 5,
        statut          VARCHAR(20) DEFAULT 'actif',
        conditions      TEXT,
        document_url    TEXT,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_baux_bien      ON baux_immo(bien_id);
      CREATE INDEX IF NOT EXISTS idx_baux_locataire ON baux_immo(locataire_id);
      CREATE INDEX IF NOT EXISTS idx_baux_agence    ON baux_immo(agence_id);

      -- 12. LOYERS / ÉCHÉANCES
      CREATE TABLE IF NOT EXISTS loyers_echeances (
        id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        bail_id            UUID NOT NULL REFERENCES baux_immo(id) ON DELETE CASCADE,
        agence_id          UUID REFERENCES agences_immo(id) ON DELETE CASCADE,
        periode            VARCHAR(20) NOT NULL,
        date_echeance      DATE NOT NULL,
        montant_du         NUMERIC(15,2) NOT NULL,
        montant_paye       NUMERIC(15,2) DEFAULT 0,
        montant_restant    NUMERIC(15,2),
        statut             VARCHAR(20) DEFAULT 'en_attente',
        date_paiement      DATE,
        mode_paiement      VARCHAR(30),
        reference_paiement VARCHAR(100),
        quittance_url      TEXT,
        retard_jours       INT DEFAULT 0,
        frais_retard       NUMERIC(15,2) DEFAULT 0,
        rappels_envoyes    INT DEFAULT 0,
        dernier_rappel     TIMESTAMPTZ,
        notes              TEXT,
        created_at         TIMESTAMPTZ DEFAULT NOW(),
        updated_at         TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_loyers_bail    ON loyers_echeances(bail_id);
      CREATE INDEX IF NOT EXISTS idx_loyers_statut  ON loyers_echeances(statut);
      CREATE INDEX IF NOT EXISTS idx_loyers_periode ON loyers_echeances(periode);
      CREATE INDEX IF NOT EXISTS idx_loyers_agence  ON loyers_echeances(agence_id);

      -- 13. MAINTENANCE / TRAVAUX IMMOBILIERS
      CREATE TABLE IF NOT EXISTS maintenance_immo (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agence_id    UUID REFERENCES agences_immo(id) ON DELETE CASCADE,
        bien_id      UUID NOT NULL REFERENCES biens_immo(id) ON DELETE CASCADE,
        bail_id      UUID REFERENCES baux_immo(id) ON DELETE SET NULL,
        type         VARCHAR(50) DEFAULT 'autre',
        description  TEXT NOT NULL,
        priorite     VARCHAR(20) DEFAULT 'normale',
        demandeur    VARCHAR(30) DEFAULT 'locataire',
        technicien   VARCHAR(200),
        cout_estime  NUMERIC(15,2),
        cout_reel    NUMERIC(15,2),
        a_charge_de  VARCHAR(20) DEFAULT 'proprietaire',
        statut       VARCHAR(20) DEFAULT 'signale',
        date_signal  TIMESTAMPTZ DEFAULT NOW(),
        date_debut   DATE,
        date_resolu  DATE,
        photos       JSONB DEFAULT '[]'::jsonb,
        notes        TEXT,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_maintenance_agence ON maintenance_immo(agence_id);
      CREATE INDEX IF NOT EXISTS idx_maintenance_bien   ON maintenance_immo(bien_id);

      -- 14. FACTURES IMMOBILIÈRES (Honoraires, Gestion, Débours, Quittances)
      CREATE TABLE IF NOT EXISTS factures_immo (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agence_id       UUID REFERENCES agences_immo(id) ON DELETE CASCADE,
        numero_facture  VARCHAR(50) NOT NULL,
        type_facture    VARCHAR(30) DEFAULT 'honoraires',
        client_nom      VARCHAR(150) NOT NULL,
        client_tel      VARCHAR(30),
        client_email    VARCHAR(150),
        bien_id         UUID REFERENCES biens_immo(id) ON DELETE SET NULL,
        montant_ht      NUMERIC(15,2) NOT NULL,
        taux_tva        NUMERIC(5,2) DEFAULT 0,
        montant_tva     NUMERIC(15,2) DEFAULT 0,
        timbre_fiscal   NUMERIC(10,2) DEFAULT 0,
        montant_ttc     NUMERIC(15,2) NOT NULL,
        statut          VARCHAR(20) DEFAULT 'en_attente',
        date_emission   DATE DEFAULT CURRENT_DATE,
        date_echeance   DATE,
        mode_paiement   VARCHAR(30),
        lignes          JSONB DEFAULT '[]'::jsonb,
        notes           TEXT,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_factures_agence ON factures_immo(agence_id);
      CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures_immo(statut);

      -- 15. CRÉDITS & PLANS D'ÉCHELONNEMENT IMMO (Caution 3x, Frais étalés, Terrains VEFA)
      CREATE TABLE IF NOT EXISTS credits_immo (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agence_id         UUID REFERENCES agences_immo(id) ON DELETE CASCADE,
        type_credit       VARCHAR(30) DEFAULT 'caution_echelonnee',
        beneficiaire_nom  VARCHAR(150) NOT NULL,
        beneficiaire_tel  VARCHAR(30),
        bien_id           UUID REFERENCES biens_immo(id) ON DELETE SET NULL,
        bail_id           UUID REFERENCES baux_immo(id) ON DELETE SET NULL,
        montant_total     NUMERIC(15,2) NOT NULL,
        apport_initial    NUMERIC(15,2) DEFAULT 0,
        solde_restant     NUMERIC(15,2) NOT NULL,
        nb_echeances      INT DEFAULT 3,
        frequence         VARCHAR(20) DEFAULT 'mensuel',
        statut            VARCHAR(20) DEFAULT 'actif',
        echeances         JSONB DEFAULT '[]'::jsonb,
        notes             TEXT,
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        updated_at        TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_credits_immo_agence ON credits_immo(agence_id);
      CREATE INDEX IF NOT EXISTS idx_credits_immo_statut ON credits_immo(statut);

      -- 16. JOURNAL D'AUDIT / LOGS D'ACTIVITÉ AGENCE IMMOBILIÈRE
      CREATE TABLE IF NOT EXISTS agence_logs (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agence_id      UUID NOT NULL REFERENCES agences_immo(id) ON DELETE CASCADE,
        utilisateur_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
        auteur_nom     VARCHAR(100),
        type_action    VARCHAR(50),
        description    TEXT,
        metadonnees    JSONB,
        ip_adresse     VARCHAR(45),
        created_at     TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_agence_logs_agence ON agence_logs(agence_id);
      CREATE INDEX IF NOT EXISTS idx_agence_logs_date   ON agence_logs(created_at DESC);

      -- Colonnes d'archivage / statut pour contacts et propriétaires
      ALTER TABLE contacts_immo ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT TRUE;
      ALTER TABLE proprietaires_immo ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT TRUE;
      ALTER TABLE baux_immo ADD COLUMN IF NOT EXISTS clauses_personnalisees JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE baux_immo ADD COLUMN IF NOT EXISTS pieces_jointes JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE contacts_immo ADD COLUMN IF NOT EXISTS pieces_jointes JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE baux_immo ADD COLUMN IF NOT EXISTS signature_locataire TEXT;
      ALTER TABLE baux_immo ADD COLUMN IF NOT EXISTS date_signature_locataire TIMESTAMPTZ;
      ALTER TABLE baux_immo ADD COLUMN IF NOT EXISTS nom_signataire_locataire VARCHAR(255);
      ALTER TABLE baux_immo ADD COLUMN IF NOT EXISTS signature_bailleur TEXT;
      ALTER TABLE baux_immo ADD COLUMN IF NOT EXISTS date_signature_bailleur TIMESTAMPTZ;
      ALTER TABLE baux_immo ADD COLUMN IF NOT EXISTS nom_signataire_bailleur VARCHAR(255);
      ALTER TABLE baux_immo ADD COLUMN IF NOT EXISTS statut_signature VARCHAR(30) DEFAULT 'en_attente';

      -- Réparation de rétrocompatibilité : peupler proprietaire_id sur baux_immo si manquant
      UPDATE baux_immo bx
      SET proprietaire_id = b.proprietaire_id
      FROM biens_immo b
      WHERE bx.bien_id = b.id AND bx.proprietaire_id IS NULL AND b.proprietaire_id IS NOT NULL;
    `);

    console.log('[MIGRATE] ✅ Nopalou Immobilier: 16 tables & colonnes créées avec succès');
  } catch (err) {
    console.warn('[MIGRATE] Nopalou Immobilier échec:', err.message);
  }

  // ── SAMA XAALIS : MODULE UNIFIÉ DE GESTION SIMPLE DE L'ARGENT ──
  try {
    await pool.query(`
      -- 1. Abonnement / Activation indépendante Sama Xaalis
      CREATE TABLE IF NOT EXISTS kalpe_abonnements (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        utilisateur_id UUID NOT NULL UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
        statut         VARCHAR(30) NOT NULL DEFAULT 'actif',
        type_acces     VARCHAR(30) NOT NULL DEFAULT 'standard',
        debut          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        fin            TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '365 days'),
        is_trial       BOOLEAN NOT NULL DEFAULT TRUE,
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        updated_at     TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_kalpe_abmt_user ON kalpe_abonnements(utilisateur_id, statut);

      -- 2. Journal unifié des opérations financières (Revenus, Dépenses, Ventes Express)
      CREATE TABLE IF NOT EXISTS kalpe_operations (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        boutique_id    UUID REFERENCES boutiques(id) ON DELETE SET NULL,
        contexte       VARCHAR(20) NOT NULL DEFAULT 'personnel',
        type           VARCHAR(30) NOT NULL,
        direction      VARCHAR(10) NOT NULL,
        montant        NUMERIC(12,2) NOT NULL CHECK (montant > 0),
        categorie      VARCHAR(60) NOT NULL,
        libelle        VARCHAR(255) NOT NULL,
        tiers_nom      VARCHAR(150),
        tiers_tel      VARCHAR(30),
        date_operation DATE NOT NULL DEFAULT CURRENT_DATE,
        reference      VARCHAR(128) UNIQUE,
        metadata       JSONB DEFAULT '{}'::jsonb,
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        updated_at     TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_kalpe_ops_user ON kalpe_operations(utilisateur_id, date_operation DESC);
      CREATE INDEX IF NOT EXISTS idx_kalpe_ops_contexte ON kalpe_operations(utilisateur_id, contexte);
      CREATE INDEX IF NOT EXISTS idx_kalpe_ops_type ON kalpe_operations(utilisateur_id, type);

      -- 3. Dettes & Créances (Bor) — Tiers, solde, échéance et relance
      CREATE TABLE IF NOT EXISTS kalpe_dettes (
        id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        utilisateur_id   UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        boutique_id      UUID REFERENCES boutiques(id) ON DELETE SET NULL,
        contexte         VARCHAR(20) NOT NULL DEFAULT 'personnel',
        direction        VARCHAR(20) NOT NULL DEFAULT 'a_recevoir',
        tiers_nom        VARCHAR(150) NOT NULL,
        tiers_telephone  VARCHAR(30),
        montant_initial  NUMERIC(12,2) NOT NULL CHECK (montant_initial > 0),
        montant_paye     NUMERIC(12,2) NOT NULL DEFAULT 0,
        montant_restant  NUMERIC(12,2) NOT NULL CHECK (montant_restant >= 0),
        date_pret        DATE NOT NULL DEFAULT CURRENT_DATE,
        date_echeance    DATE,
        statut           VARCHAR(30) NOT NULL DEFAULT 'en_cours',
        note             TEXT,
        derniere_relance TIMESTAMPTZ,
        legacy_client_id UUID,
        created_at       TIMESTAMPTZ DEFAULT NOW(),
        updated_at       TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_kalpe_dettes_user ON kalpe_dettes(utilisateur_id, statut);
      CREATE INDEX IF NOT EXISTS idx_kalpe_dettes_echeance ON kalpe_dettes(utilisateur_id, date_echeance);

      -- 4. Remboursements partiels ou totaux des dettes
      CREATE TABLE IF NOT EXISTS kalpe_dette_remboursements (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        dette_id       UUID NOT NULL REFERENCES kalpe_dettes(id) ON DELETE CASCADE,
        utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        montant        NUMERIC(12,2) NOT NULL CHECK (montant > 0),
        date_reglement DATE NOT NULL DEFAULT CURRENT_DATE,
        mode_paiement  VARCHAR(30) DEFAULT 'especes',
        note           VARCHAR(255),
        created_at     TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_kalpe_remb_dette ON kalpe_dette_remboursements(dette_id);

      -- 5. Objectifs d'Épargne & Buts financiers
      CREATE TABLE IF NOT EXISTS kalpe_objectifs (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        titre          VARCHAR(150) NOT NULL,
        montant_cible  NUMERIC(12,2) NOT NULL CHECK (montant_cible > 0),
        montant_actuel NUMERIC(12,2) NOT NULL DEFAULT 0,
        date_echeance  DATE,
        categorie      VARCHAR(50) DEFAULT 'projet',
        statut         VARCHAR(30) NOT NULL DEFAULT 'en_cours',
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        updated_at     TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_kalpe_obj_user ON kalpe_objectifs(utilisateur_id, statut);

      -- 6. Mouvements d'Épargne (Versements & Retraits)
      CREATE TABLE IF NOT EXISTS kalpe_epargne_mouvements (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        objectif_id    UUID NOT NULL REFERENCES kalpe_objectifs(id) ON DELETE CASCADE,
        utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        montant        NUMERIC(12,2) NOT NULL CHECK (montant > 0),
        type           VARCHAR(20) NOT NULL DEFAULT 'versement',
        note           VARCHAR(255),
        date_mouvement DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at     TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_kalpe_epargne_obj ON kalpe_epargne_mouvements(objectif_id);

      -- Indexation des clés étrangères critiques (TECH-04)
      CREATE INDEX IF NOT EXISTS idx_ventes_produit_id ON ventes(produit_id);
      CREATE INDEX IF NOT EXISTS idx_ventes_caissier_id ON ventes(caissier_id);
      CREATE INDEX IF NOT EXISTS idx_ventes_boutique_id ON ventes(boutique_id);
      CREATE INDEX IF NOT EXISTS idx_commandes_boutique_produit_id ON commandes_boutique(produit_id);
      CREATE INDEX IF NOT EXISTS idx_commandes_boutique_boutique_id ON commandes_boutique(boutique_id);
      CREATE INDEX IF NOT EXISTS idx_produits_categorie_id ON produits(categorie_id);
      CREATE INDEX IF NOT EXISTS idx_caisse_docs_client_id ON caisse_documents(client_id);
      CREATE INDEX IF NOT EXISTS idx_caisse_docs_caissier_id ON caisse_documents(caissier_id);
      CREATE INDEX IF NOT EXISTS idx_boutique_pos_sessions_caissier_id ON boutique_pos_sessions(caissier_id);
      CREATE INDEX IF NOT EXISTS idx_clics_affiliation_produit_id ON clics_affiliation(produit_id);
    `);
    console.log('[MIGRATE] ✅ Sama Xaalis: 6 tables créées avec succès');
  } catch (err) {
    console.warn('[MIGRATE] Sama Xaalis échec:', err.message);
  }

  // ── Écosystème Conversationnel & Traçabilité WhatBot (Sprint 2) ──
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_otp_codes (
        id          SERIAL      PRIMARY KEY,
        phone       VARCHAR(20) NOT NULL,
        code        VARCHAR(6)  NOT NULL,
        boutique_id UUID        REFERENCES boutiques(id) ON DELETE CASCADE,
        expires_at  TIMESTAMPTZ NOT NULL,
        used_at     TIMESTAMPTZ DEFAULT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_otp_phone   ON whatsapp_otp_codes(phone);
      CREATE INDEX IF NOT EXISTS idx_otp_expires ON whatsapp_otp_codes(expires_at);

      CREATE TABLE IF NOT EXISTS whatsapp_conversation_log (
        id           BIGSERIAL   PRIMARY KEY,
        phone        VARCHAR(20) NOT NULL,
        direction    VARCHAR(3)  NOT NULL CHECK (direction IN ('IN', 'OUT')),
        message_type VARCHAR(30) DEFAULT 'text',
        content      TEXT,
        state_before VARCHAR(50),
        state_after  VARCHAR(50),
        boutique_id  UUID        REFERENCES boutiques(id) ON DELETE SET NULL,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_conv_log_phone ON whatsapp_conversation_log(phone, created_at DESC);

      CREATE TABLE IF NOT EXISTS notification_echecs (
        id           SERIAL      PRIMARY KEY,
        type         VARCHAR(50) NOT NULL,
        reference_id TEXT,
        erreur       TEXT,
        resolved_at  TIMESTAMPTZ DEFAULT NULL,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_notif_echecs_type ON notification_echecs(type, created_at DESC);

      -- Performance Indexes (Sprint 3)
      CREATE INDEX IF NOT EXISTS idx_commandes_boutique_perf
        ON commandes_boutique(boutique_id, created_at DESC, statut)
        WHERE statut != 'annulee';

      CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_updated
        ON whatsapp_sessions(updated_at DESC);

      -- Tampon Photos DB (Sprint 4)
      CREATE TABLE IF NOT EXISTS whatsapp_photo_buffer (
        phone       VARCHAR(20) NOT NULL,
        produit_id  UUID        NOT NULL REFERENCES boutique_produits(id) ON DELETE CASCADE,
        boutique_id UUID,
        photos      TEXT[]      DEFAULT '{}',
        expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (phone, produit_id)
      );
      CREATE INDEX IF NOT EXISTS idx_photo_buffer_exp ON whatsapp_photo_buffer(expires_at);

      -- Table de synchronisation cloud multi-appareils des favoris (IMM-002)
      CREATE TABLE IF NOT EXISTS utilisateurs_favoris (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        type_entite    VARCHAR(30) NOT NULL,
        entite_id      TEXT NOT NULL,
        boutique_id    TEXT,
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(utilisateur_id, type_entite, entite_id)
      );
      CREATE INDEX IF NOT EXISTS idx_utilisateurs_favoris_user ON utilisateurs_favoris(utilisateur_id);
      CREATE INDEX IF NOT EXISTS idx_utilisateurs_favoris_lookup ON utilisateurs_favoris(utilisateur_id, type_entite, entite_id);

      -- Table des exécutions des tâches planifiées (Crons)
      CREATE TABLE IF NOT EXISTS cron_executions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nom_cron VARCHAR(100) NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ended_at TIMESTAMPTZ,
        statut VARCHAR(50) NOT NULL DEFAULT 'en_cours',
        stats JSONB DEFAULT '{}'::jsonb,
        erreur TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_cron_executions_nom_date ON cron_executions(nom_cron, started_at DESC);

      -- Colonnes Payout Wave sur commandes_boutique
      ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS payout_ref VARCHAR(100);
      ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS payout_date TIMESTAMPTZ;

      -- Système de Helpdesk, Support Client & Litiges
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        numero_ticket VARCHAR(50) UNIQUE NOT NULL,
        utilisateur_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
        commande_id UUID REFERENCES commandes_boutique(id) ON DELETE SET NULL,
        boutique_id UUID REFERENCES boutiques(id) ON DELETE SET NULL,
        sujet VARCHAR(255) NOT NULL,
        categorie VARCHAR(50) NOT NULL DEFAULT 'autre',
        priorite VARCHAR(20) NOT NULL DEFAULT 'normale',
        statut VARCHAR(30) NOT NULL DEFAULT 'ouvert',
        assigne_a UUID REFERENCES admin_utilisateurs(id) ON DELETE SET NULL,
        messages JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_support_tickets_statut ON support_tickets(statut);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(utilisateur_id);

      -- Colonnes étendues Helpdesk multi-canaux (Web, WhatsApp, Guest)
      ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS contact_nom VARCHAR(150);
      ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS contact_email VARCHAR(150);
      ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS contact_telephone VARCHAR(50);
      ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS canal VARCHAR(30) DEFAULT 'web';
      ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS pieces_jointes JSONB DEFAULT '[]'::jsonb;

      -- Système de modération et signalements d'abus
      CREATE TABLE IF NOT EXISTS signalements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        type_cible VARCHAR(50) NOT NULL,
        cible_id VARCHAR(100) NOT NULL,
        signale_par UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
        auteur_telephone VARCHAR(30),
        motif VARCHAR(100) NOT NULL,
        description TEXT,
        statut VARCHAR(30) NOT NULL DEFAULT 'en_attente',
        decision TEXT,
        traite_par UUID REFERENCES admin_utilisateurs(id) ON DELETE SET NULL,
        traite_le TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_signalements_statut ON signalements(statut);
      CREATE INDEX IF NOT EXISTS idx_signalements_cible ON signalements(type_cible, cible_id);

      ALTER TABLE signalements ADD COLUMN IF NOT EXISTS auteur_email VARCHAR(150);
      ALTER TABLE signalements ADD COLUMN IF NOT EXISTS pieces_jointes JSONB DEFAULT '[]'::jsonb;

      -- Journal d'audit immuable des accès de sécurité et violations IDOR
      CREATE TABLE IF NOT EXISTS security_audit_vault (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        event_type VARCHAR(100) NOT NULL,
        user_id VARCHAR(100),
        tenant_type VARCHAR(50) DEFAULT 'boutique',
        target_id VARCHAR(100),
        ip_address VARCHAR(100),
        user_agent TEXT,
        endpoint VARCHAR(255),
        method VARCHAR(20),
        details JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_security_vault_event ON security_audit_vault(event_type, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_security_vault_user ON security_audit_vault(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_security_vault_created ON security_audit_vault(created_at DESC);
    `);
    console.log('[MIGRATE] ✅ Écosystème Conversationnel, Crons, Support, Signalements & Audit Vault créés');
  } catch (err) {
    console.warn('[MIGRATE] Écosystème Conversationnel échec:', err.message);
  }
};

