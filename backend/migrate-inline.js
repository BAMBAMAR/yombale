// backend/migrate-inline.js
// Migration idempotente appelée au démarrage de app.js (ne ferme PAS le pool principal)
// BUG FIX : l'ancienne migrate.js appelait pool.end() ce qui cassait tout
const { Pool } = require('pg');
require('dotenv').config();

module.exports = async function migrateInline() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
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
      -- Index composite : couvre les filtres stock=true + tri par prix (toutes les queries offres)
      CREATE INDEX IF NOT EXISTS idx_offres_produit_stock_prix ON offres(produit_id, stock, prix);

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
    `ALTER TABLE annonces_immo ADD COLUMN IF NOT EXISTS motif_rejet TEXT`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS sponsorise BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS sponsor_jusqu_au TIMESTAMPTZ`,
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
    `);
    
    // Update existing constraint for older databases
    await pool.query(`
      ALTER TABLE abonnements DROP CONSTRAINT IF EXISTS abonnements_plan_check;
      ALTER TABLE abonnements ADD CONSTRAINT abonnements_plan_check CHECK (plan IN ('gratuit', 'decouverte', 'taf_taf', 'pro', 'business', 'immo'));
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
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS horaires JSONB DEFAULT '{}'`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS slug VARCHAR(100)`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS couleur_theme VARCHAR(50) DEFAULT '#1e3a5f'`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS mode_fonctionnement VARCHAR(30) DEFAULT 'hybride_pos'`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS meta_pixel_id VARCHAR(50)`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS tiktok_pixel_id VARCHAR(50)`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS ga4_id VARCHAR(50)`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS devise_defaut VARCHAR(10) DEFAULT 'XOF'`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS code_pin VARCHAR(10) DEFAULT '1234'`,
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
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_commandes_groupe ON commandes_boutique(groupe_commande) WHERE groupe_commande IS NOT NULL`);
    
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
      CREATE INDEX IF NOT EXISTS idx_support_demandes_date ON support_demandes(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_support_demandes_statut ON support_demandes(statut);
      CREATE INDEX IF NOT EXISTS idx_support_demandes_tel ON support_demandes(telephone);
    `);

    console.log('[MIGRATE] ✅ Tables et colonnes fiscales/fournisseurs/audit_logs/comptabilite/recherches_logs/prospection/support OK');
  } catch (err) {
    console.warn('[MIGRATE] POS Avancé & Recherches échec:', err.message);
  }

  try { await pool.end(); } catch (_) {}
};
