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
  } finally {
    await pool.end();
  }
};
