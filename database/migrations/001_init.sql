-- PrixMalin SN -- Schema base de donnees v1.0
-- Executer avec : psql $DATABASE_URL -f database/migrations/001_init.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE categories (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom        VARCHAR(100) NOT NULL,
  slug       VARCHAR(100) UNIQUE NOT NULL,
  parent_id  UUID        REFERENCES categories(id),
  icone      VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE produits (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom          VARCHAR(255) NOT NULL,
  description  TEXT,
  categorie_id UUID         REFERENCES categories(id),
  marque       VARCHAR(100),
  ean          VARCHAR(20),
  image_url    TEXT,
  prix_min     NUMERIC(12,2),
  nb_offres    INT          DEFAULT 0,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX idx_produits_nom ON produits USING gin(nom gin_trgm_ops);
CREATE INDEX idx_produits_ean ON produits(ean);

CREATE TABLE marchands (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom            VARCHAR(100) NOT NULL,
  logo_url       TEXT,
  site_url       TEXT,
  methode        VARCHAR(20)  DEFAULT 'scraper',
  actif          BOOLEAN      DEFAULT TRUE,
  derniere_sync  TIMESTAMPTZ,
  note_fiabilite SMALLINT     DEFAULT 5
);

CREATE TABLE offres (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  produit_id  UUID          NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
  marchand_id UUID          NOT NULL REFERENCES marchands(id),
  titre_brut  TEXT,
  prix        NUMERIC(12,2) NOT NULL,
  devise      CHAR(3)       DEFAULT 'XOF',
  stock       BOOLEAN       DEFAULT TRUE,
  url_achat   TEXT,
  scraped_at  TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE(produit_id, marchand_id)
);
CREATE INDEX idx_offres_produit ON offres(produit_id);
CREATE INDEX idx_offres_prix    ON offres(prix);

CREATE TABLE historique_prix (
  id       BIGSERIAL    PRIMARY KEY,
  offre_id UUID         NOT NULL REFERENCES offres(id) ON DELETE CASCADE,
  prix     NUMERIC(12,2) NOT NULL,
  date     TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX idx_hist_offre ON historique_prix(offre_id);
CREATE INDEX idx_hist_date  ON historique_prix(date);

CREATE TABLE utilisateurs (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom               VARCHAR(100) NOT NULL,
  email             VARCHAR(255) UNIQUE NOT NULL,
  mot_de_passe_hash TEXT         NOT NULL,
  telephone         VARCHAR(20),
  ville             VARCHAR(100) DEFAULT 'Dakar',
  premium           BOOLEAN      DEFAULT FALSE,
  created_at        TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE alertes (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  utilisateur_id UUID          NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  produit_id     UUID          NOT NULL REFERENCES produits(id),
  prix_cible     NUMERIC(12,2) NOT NULL,
  email          VARCHAR(255),
  active         BOOLEAN       DEFAULT TRUE,
  created_at     TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE commandes (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference        VARCHAR(100)  UNIQUE NOT NULL,
  utilisateur_id   UUID          REFERENCES utilisateurs(id),
  montant          NUMERIC(12,2) NOT NULL,
  methode_paiement VARCHAR(20),
  statut           VARCHAR(20)   DEFAULT 'en_attente',
  created_at       TIMESTAMPTZ   DEFAULT NOW()
);

INSERT INTO categories (nom, slug, icone) VALUES
  ('Telephones',   'smartphones', '📱'),
  ('Informatique', 'informatique','💻'),
  ('TV & Electro', 'tv-electro',  '📺'),
  ('Mode',         'mode',        '👕'),
  ('Maison',       'maison',      '🏠'),
  ('Auto & Moto',  'auto-moto',   '🛵'),
  ('Beaute',       'beaute',      '💄'),
  ('Jeux',         'jeux',        '🎮');

INSERT INTO marchands (nom, site_url, methode) VALUES
  ('Jumia Senegal', 'https://www.jumia.sn',        'api'),
  ('Expat-Dakar',   'https://www.expat-dakar.com', 'scraper'),
  ('Dakar-Deal',    'https://www.dakar-deal.com',  'scraper'),
  ('CoinAfrique',   'https://www.coinafrique.com', 'scraper'),
  ('SenMarket',     'https://www.senmarket.sn',    'feed');