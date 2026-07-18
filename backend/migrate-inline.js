// backend/migrate-inline.js
// Migration idempotente appelée au démarrage de app.js (ne ferme PAS le pool)
// BUG FIX : l'ancienne migrate.js appelait pool.end() ce qui cassait tout
const { Pool } = require('pg');
require('dotenv').config();

module.exports = async function migrateInline() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
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
        ('Immobilier',   'immo',        '🏡')
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
        plan           VARCHAR(20) NOT NULL CHECK (plan IN ('pro', 'business')),
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
  ];
  for (const sql of colonnesBoutiqueAvancees) {
    try { await pool.query(sql); }
    catch (e) { console.warn('[MIGRATE] boutique avancee:', e.message); }
  }
  try {
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uidx_boutiques_slug ON boutiques(slug) WHERE slug IS NOT NULL`);
  } catch (e) { console.warn('[MIGRATE] boutique slug index:', e.message); }
  console.log('[MIGRATE] ✅ Colonnes boutiques avancées OK');

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
    console.log('[MIGRATE] ✅ Colonne boutique_produits.variantes OK');
  } catch (e) { console.warn('[MIGRATE] bp_variantes:', e.message); }

  // Comptabilité boutique — stock, zones de livraison, ventes
  try {
    await pool.query(`ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS stock_quantite INT`);

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
        reference         VARCHAR(30) UNIQUE NOT NULL,
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
    await pool.query(`ALTER TABLE ventes ADD COLUMN IF NOT EXISTS archivee BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE ventes ADD COLUMN IF NOT EXISTS justificatif_url TEXT`);
    console.log('[MIGRATE] ✅ Tables comptabilité boutique (stock, zones_livraison, ventes) OK');
  } catch (e) { console.warn('[MIGRATE] comptabilite_boutique:', e.message); }

  // Commandes boutique
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS commandes_boutique (
        id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        reference        VARCHAR(30) UNIQUE NOT NULL,
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
    await pool.query(`ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS methode_paiement VARCHAR(20) DEFAULT 'wave'`);
    await pool.query(`ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS zone_livraison_id UUID REFERENCES zones_livraison(id) ON DELETE SET NULL`);
    await pool.query(`ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS frais_livraison NUMERIC(12,2) DEFAULT 0`);
    await pool.query(`ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS groupe_commande UUID`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_commandes_groupe ON commandes_boutique(groupe_commande) WHERE groupe_commande IS NOT NULL`);
    console.log('[MIGRATE] ✅ Table commandes_boutique OK');
  } catch (e) { console.warn('[MIGRATE] commandes_boutique:', e.message); }

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
    `ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS whatsapp_sync_statut VARCHAR(20) DEFAULT 'en_attente'`,
    `ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS whatsapp_sync_erreur TEXT`,
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
  ];
  for (const sql of colonnesGestionComptes) {
    try { await pool.query(sql); }
    catch (e) { console.warn('[MIGRATE] gestion_comptes:', e.message); }
  }
  console.log('[MIGRATE] ✅ Colonnes gestion comptes (suspendu/supprime_le/anonymise_le) OK');

  try { await pool.end(); } catch (_) {}
};
