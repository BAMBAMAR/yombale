-- database/test-fixtures.sql
-- Fixtures pour initialiser une base de données de test isolée (Nopalou)
-- ATTENTION : Ne JAMAIS exécuter sur la base de données de production !

INSERT INTO utilisateurs (id, email, password_hash, nom, role) VALUES
  ('test-acheteur-001', 'acheteur@test-nopalou.com', '$2b$10$testhashedpwd', 'Acheteur Test', 'acheteur'),
  ('test-marchand-001', 'marchand@test-nopalou.com', '$2b$10$testhashedpwd', 'Marchand Test', 'marchand'),
  ('test-marchand-002', 'marchand-b@test-nopalou.com', '$2b$10$testhashedpwd', 'Marchand B Test', 'marchand')
ON CONFLICT (id) DO NOTHING;

INSERT INTO boutiques (id, utilisateur_id, nom, slug, actif) VALUES
  ('test-boutique-001', 'test-marchand-001', 'Boutique Test A', 'boutique-test-a', true),
  ('test-boutique-002', 'test-marchand-002', 'Boutique Test B', 'boutique-test-b', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO boutique_produits (id, boutique_id, nom, prix, stock_quantite, actif) VALUES
  ('test-produit-001', 'test-boutique-001', 'Produit Test', 5000, 100, true)
ON CONFLICT (id) DO NOTHING;
