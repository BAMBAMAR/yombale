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

  try { await pool.end(); } catch (_) {}
};
