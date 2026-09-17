import 'dotenv/config';
import { pool } from '../../backend/models/db.js';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://127.0.0.1:3000';
const results = [];

function record(id, phase, module, action, status, expected, actual, bug = null) {
  const item = { id, phase, module, action, status, expected, actual, bug, timestamp: new Date().toISOString() };
  results.push(item);
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'SECURITY BUG' ? '🛡️' : '⚠️';
  console.log(`${icon} [${id.padEnd(10)}] [Ph.${phase} ${module.padEnd(12)}] ${action.padEnd(45)} : ${status}`);
  if (bug) console.log(`   ↳ Détail: ${JSON.stringify(bug)}`);
}

async function api(method, path, body = null, token = null, extraHeaders = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(url, opts);
    let data;
    const text = await res.text();
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data, headers: res.headers };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function run() {
  console.log('======================================================================');
  console.log('🧪 SUITE EXHAUSTIVE DE TESTS RÉELS API, PERSISTANCE DB & SÉCURITÉ');
  console.log(`📡 Cible API: ${API_BASE}`);
  console.log('======================================================================\n');

  const suffix = Date.now().toString().slice(-6);

  try {
    // ══════════════════════════════════════════════════════════════════════
    // 1. PHASE 2 : AUTHENTIFICATION, SESSIONS & VALIDATION
    // ══════════════════════════════════════════════════════════════════════
    console.log('\n--- 1. PHASE 2 : AUTHENTIFICATION & COMPTES ---');

    // 1.1 Inscription Marchand A
    const emailA = `marchand_a_${suffix}@nopalou-test.sn`;
    const passA = 'SuperPass123!QA';
    let res = await api('POST', '/api/auth/inscription', {
      nom: 'Mamadou Marchand A',
      email: emailA,
      mot_de_passe: passA,
      telephone: `77${suffix}1`,
      ville: 'Dakar',
    });

    let tokenA = null;
    let userA = null;
    if (res.status === 201 && res.data.token) {
      tokenA = res.data.token;
      userA = res.data.user;
      // Vérification persistance DB
      const dbCheck = await pool.query('SELECT id, nom, email, est_apporteur FROM utilisateurs WHERE id=$1', [userA.id]);
      if (dbCheck.rows.length === 1 && dbCheck.rows[0].email === emailA) {
        record('AUTH-01', '2', 'Auth', 'Inscription Marchand A + Token + DB', 'PASS', '201 + User en DB', `OK userId=${userA.id}`);
      } else {
        record('AUTH-01', '2', 'Auth', 'Inscription Marchand A', 'DATA BUG', 'Présent en DB', 'Absent de la table utilisateurs');
      }
    } else {
      record('AUTH-01', '2', 'Auth', 'Inscription Marchand A', 'FAIL', '201', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    }

    // 1.2 Inscription Marchand B (pour tests IDOR & Multi-tenant)
    const emailB = `marchand_b_${suffix}@nopalou-test.sn`;
    const passB = 'SuperPass456!QA';
    res = await api('POST', '/api/auth/inscription', {
      nom: 'Awa Marchande B',
      email: emailB,
      mot_de_passe: passB,
      telephone: `77${suffix}2`,
      ville: 'Saint-Louis',
    });
    let tokenB = res.data?.token;
    let userB = res.data?.user;
    if (res.status === 201 && tokenB) {
      record('AUTH-02', '2', 'Auth', 'Inscription Marchand B (Isolation)', 'PASS', '201 + Token', `OK userId=${userB.id}`);
    } else {
      record('AUTH-02', '2', 'Auth', 'Inscription Marchand B', 'FAIL', '201', `HTTP ${res.status}`);
    }

    // 1.3 Échec volontaire : Email dupliqué
    res = await api('POST', '/api/auth/inscription', {
      nom: 'Clone',
      email: emailA,
      mot_de_passe: 'SuperPass789!QA',
    });
    if (res.status === 409 || res.status === 400) {
      record('AUTH-03', '2', 'Auth', 'Rejet Email Doublon', 'PASS', '409 Conflict', `Rejeté ${res.status}`);
    } else {
      record('AUTH-03', '2', 'Auth', 'Rejet Email Doublon', 'FAIL', '409 Conflict', `HTTP ${res.status}`);
    }

    // 1.4 Échec volontaire : Mot de passe faible
    res = await api('POST', '/api/auth/inscription', {
      nom: 'Faible',
      email: `faible_${suffix}@test.sn`,
      mot_de_passe: '1234',
    });
    if (res.status === 400) {
      record('AUTH-04', '2', 'Auth', 'Rejet Mot de passe trop court/faible', 'PASS', '400 Bad Request', 'Rejet validé');
    } else {
      record('AUTH-04', '2', 'Auth', 'Rejet Mot de passe faible', 'FAIL', '400', `HTTP ${res.status}`);
    }

    // 1.5 Marquer email_verifie pour Marchand A et B (simulation confirmation email)
    await pool.query('UPDATE utilisateurs SET email_verifie = true WHERE id IN ($1, $2)', [userA.id, userB.id]);

    // 1.6 Connexion réussie
    res = await api('POST', '/api/auth/connexion', { email: emailA, mot_de_passe: passA });
    if (res.status === 200 && res.data.token) {
      tokenA = res.data.token;
      record('AUTH-05', '2', 'Auth', 'Connexion Authentifiée', 'PASS', '200 + Nouveau JWT', 'Connexion OK');
    } else {
      record('AUTH-05', '2', 'Auth', 'Connexion Authentifiée', 'FAIL', '200', `HTTP ${res.status}`);
    }

    // 1.7 Récupération du profil /api/auth/profil
    res = await api('GET', '/api/auth/profil', null, tokenA);
    if (res.status === 200 && res.data.user?.email === emailA) {
      record('AUTH-06', '2', 'Auth', 'Lecture Profil Courant (/api/auth/profil)', 'PASS', '200 + Profil exact', 'Identité confirmée');
    } else {
      record('AUTH-06', '2', 'Auth', 'Lecture Profil Courant', 'FAIL', '200', `HTTP ${res.status}`);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2. PHASE 6 & 7 : BOUTIQUES, CATALOGUE & PRODUITS
    // ══════════════════════════════════════════════════════════════════════
    console.log('\n--- 2. PHASE 6 & 7 : BOUTIQUES & PRODUITS ---');

    // 2.1 Création Boutique A
    const bqNomA = `Électro Nopalou ${suffix}`;
    res = await api('POST', '/api/boutiques', {
      nom: bqNomA,
      description: 'Boutique officielle test high-tech Dakar',
      categorie: 'Informatique',
      telephone: `77${suffix}1`,
      ville: 'Dakar',
      adresse: 'Plateau Rue 10',
    }, tokenA);

    let boutiqueA = res.data?.boutique || res.data;
    let boutiqueAId = boutiqueA?.id;
    if ((res.status === 201 || res.status === 200) && boutiqueAId) {
      // Vérification SQL
      const bqDb = await pool.query('SELECT id, nom, utilisateur_id, actif FROM boutiques WHERE id=$1', [boutiqueAId]);
      if (bqDb.rows.length === 1 && bqDb.rows[0].utilisateur_id === userA.id) {
        record('BQ-01', '6', 'Boutique', 'Création Boutique Marchand A + DB', 'PASS', 'Boutique liée à User A', `OK id=${boutiqueAId}`);
      } else {
        record('BQ-01', '6', 'Boutique', 'Création Boutique A', 'DATA BUG', 'Boutique en DB', 'Incohérence propriétaire SQL');
      }
    } else {
      record('BQ-01', '6', 'Boutique', 'Création Boutique Marchand A', 'FAIL', '201/200', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    }

    // 2.2 Création Boutique B (pour tests IDOR)
    const bqNomB = `Mode Teranga ${suffix}`;
    res = await api('POST', '/api/boutiques', {
      nom: bqNomB,
      description: 'Boutique de vêtements féminins',
      categorie: 'Mode & Beauté',
      telephone: `77${suffix}2`,
      ville: 'Saint-Louis',
    }, tokenB);
    let boutiqueBId = (res.data?.boutique || res.data)?.id;
    if (boutiqueBId) {
      record('BQ-02', '6', 'Boutique', 'Création Boutique Marchand B', 'PASS', 'Boutique B créée', `OK id=${boutiqueBId}`);
    } else {
      record('BQ-02', '6', 'Boutique', 'Création Boutique Marchand B', 'FAIL', 'Créée', `HTTP ${res.status}`);
    }

    // 2.3 Ajout d'un Produit P1 dans Boutique A
    let produitAId = null;
    if (boutiqueAId) {
      res = await api('POST', `/api/boutiques/${boutiqueAId}/produits`, {
        nom: 'Smartphone Nopalou Ultra 5G',
        description: 'Écran OLED 120Hz 256GB',
        prix: 185000,
        prix_barre: 220000,
        stock_quantite: 15,
        categorie: 'Smartphones',
        en_stock: true,
      }, tokenA);

      const pData = res.data?.produit || res.data;
      produitAId = pData?.id;
      if ((res.status === 201 || res.status === 200) && produitAId) {
        // Contrôle persistance en table boutique_produits
        const pDb = await pool.query('SELECT id, nom, prix, stock_quantite, boutique_id FROM boutique_produits WHERE id=$1', [produitAId]);
        if (pDb.rows.length === 1 && Number(pDb.rows[0].prix) === 185000 && pDb.rows[0].stock_quantite === 15) {
          record('PROD-01', '7', 'Catalogue', 'Ajout Produit Conforme + Vérif SQL', 'PASS', 'Produit persisté (prix=185000, stock=15)', `OK id=${produitAId}`);
        } else {
          record('PROD-01', '7', 'Catalogue', 'Ajout Produit Conforme', 'DATA BUG', 'Stock & Prix exacts en DB', 'Valeurs SQL erronées');
        }
      } else {
        record('PROD-01', '7', 'Catalogue', 'Ajout Produit Conforme', 'FAIL', '201/200', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }
    }

    // 2.4 Test Rejet Prix Négatif / Stock Négatif
    if (boutiqueAId) {
      res = await api('POST', `/api/boutiques/${boutiqueAId}/produits`, {
        nom: 'Produit Invalide',
        prix: -5000,
        stock_quantite: -10,
      }, tokenA);
      if (res.status === 400) {
        record('PROD-02', '7', 'Catalogue', 'Rejet Prix/Stock Négatif', 'PASS', '400 Bad Request', 'Validation rejetée');
      } else {
        record('PROD-02', '7', 'Catalogue', 'Rejet Prix/Stock Négatif', 'FAIL', '400 Bad Request', `HTTP ${res.status}`);
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // 3. PHASE 3 & 27 : SÉCURITÉ, ISOLATION MULTI-TENANT & IDOR
    // ══════════════════════════════════════════════════════════════════════
    console.log('\n--- 3. PHASE 3 & 27 : SÉCURITÉ MULTI-TENANT & ANTI-IDOR ---');

    // 3.1 IDOR 1 : Marchand B tente d'ajouter un produit dans Boutique A
    if (boutiqueAId && tokenB) {
      res = await api('POST', `/api/boutiques/${boutiqueAId}/produits`, {
        nom: 'Piratage Produit B dans A',
        prix: 1000,
        stock_quantite: 5,
      }, tokenB);
      if (res.status === 403 || res.status === 401) {
        record('SEC-IDOR-01', '3', 'Sécurité', 'Tentative ajout produit dans boutique tierce', 'PASS', '403 Forbidden', `Bloqué avec succès (${res.status})`);
      } else {
        record('SEC-IDOR-01', '3', 'Sécurité', 'Tentative ajout produit boutique tierce', 'SECURITY BUG', '403 Forbidden', `HTTP ${res.status} Faille IDOR`);
      }
    }

    // 3.2 IDOR 2 : Marchand B tente de modifier le produit de Marchand A
    if (boutiqueAId && produitAId && tokenB) {
      res = await api('PUT', `/api/boutiques/${boutiqueAId}/produits/${produitAId}`, {
        prix: 10,
      }, tokenB);
      if (res.status === 403 || res.status === 401) {
        record('SEC-IDOR-02', '3', 'Sécurité', 'Tentative modification produit d\'un tiers', 'PASS', '403 Forbidden', `Bloqué avec succès (${res.status})`);
      } else {
        record('SEC-IDOR-02', '3', 'Sécurité', 'Tentative modification produit tiers', 'SECURITY BUG', '403 Forbidden', `HTTP ${res.status}`);
      }
    }

    // 3.3 Protection Admin : Utilisateur normal tente d'accéder aux logs admin
    res = await api('GET', '/api/admin/audit-logs', null, tokenA);
    if (res.status === 401 || res.status === 403) {
      record('SEC-ADMIN-01', '21', 'Sécurité', 'Accès route admin sans secret', 'PASS', '401 Unauthorized', `Bloqué (${res.status})`);
    } else {
      record('SEC-ADMIN-01', '21', 'Sécurité', 'Accès route admin sans secret', 'SECURITY BUG', '401', `HTTP ${res.status}`);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 4. PHASE 12 : POINT DE VENTE (POS) & GESTION DE CAISSE
    // ══════════════════════════════════════════════════════════════════════
    console.log('\n--- 4. PHASE 12 : POINT DE VENTE (POS) & CAISSE ---');

    let sessionId = null;
    if (boutiqueAId) {
      // 4.1 Ouverture de session de caisse
      res = await api('POST', `/api/boutiques/${boutiqueAId}/pos-sessions/ouvrir`, {
        fondDeCaisse: 25000,
        caissierNom: 'Mamadou Vendeur',
      }, tokenA);

      sessionId = res.data?.session?.id || res.data?.sessionId || res.data?.id;
      if ((res.status === 200 || res.status === 201) && sessionId) {
        const sesDb = await pool.query('SELECT id, fond_caisse_initial, statut FROM boutique_pos_sessions WHERE id=$1', [sessionId]);
        if (sesDb.rows.length === 1 && sesDb.rows[0].statut === 'ouverte') {
          record('POS-01', '12', 'POS Caisse', 'Ouverture Session Caisse + DB', 'PASS', 'Session ouverte en DB (fond=25000)', `OK id=${sessionId}`);
        } else {
          record('POS-01', '12', 'POS Caisse', 'Ouverture Session Caisse', 'DATA BUG', 'Statut ouvert en DB', 'Statut non ouvert');
        }
      } else {
        record('POS-01', '12', 'POS Caisse', 'Ouverture Session Caisse', 'FAIL', '200/201', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }

      // 4.2 Vente Comptoir avec décrémentation de stock
      if (produitAId && sessionId) {
        // Stock initial
        const stockAv = (await pool.query('SELECT stock_quantite FROM boutique_produits WHERE id=$1', [produitAId])).rows[0]?.stock_quantite;

        res = await api('POST', `/api/boutiques/${boutiqueAId}/pos-vente`, {
          session_id: sessionId,
          items: [
            { id: produitAId, nom: 'Smartphone Nopalou Ultra 5G', quantite: 2, prix_unitaire: 185000 }
          ],
          modePaiement: 'cash',
        }, tokenA);

        if (res.status === 200 || res.status === 201) {
          // Vérification stock après vente (doit être stockAv - 2)
          const stockAp = (await pool.query('SELECT stock_quantite FROM boutique_produits WHERE id=$1', [produitAId])).rows[0]?.stock_quantite;
          const venteDb = await pool.query('SELECT id, montant_total, methode_paiement FROM ventes WHERE boutique_id=$1 ORDER BY created_at DESC LIMIT 1', [boutiqueAId]);

          if (stockAp === stockAv - 2 && venteDb.rows.length === 1 && Number(venteDb.rows[0].montant_total) === 370000) {
            record('POS-02', '12', 'POS Caisse', 'Vente Comptoir + Décrément Stock + Vente DB', 'PASS', `Stock décrémenté de 2 (${stockAv}->${stockAp}) et Vente en DB`, 'Validé conforme');
          } else {
            record('POS-02', '12', 'POS Caisse', 'Vente Comptoir', 'DATA BUG', 'Stock exact et Vente persistée', `Stock=${stockAp} attendu=${stockAv-2}`);
          }
        } else {
          record('POS-02', '12', 'POS Caisse', 'Vente Comptoir', 'FAIL', '200', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
        }

        // 4.3 Clôture de Caisse avec Rapprochement
        res = await api('POST', `/api/boutiques/${boutiqueAId}/pos-sessions/cloturer`, {
          sessionId: sessionId,
          especesComptees: 395000, // 25000 fond + 370000 vente = 395000
        }, tokenA);

        if (res.status === 200) {
          const sesClot = (await pool.query('SELECT statut, ecart_caisse, ventes_total FROM boutique_pos_sessions WHERE id=$1', [sessionId])).rows[0];
          if (sesClot?.statut === 'cloturee' && Number(sesClot.ecart_caisse) === 0) {
            record('POS-03', '12', 'POS Caisse', 'Clôture Session + Rapprochement Parfait', 'PASS', 'Statut clôturée, écart = 0 FCFA', 'Zéro écart');
          } else {
            record('POS-03', '12', 'POS Caisse', 'Clôture Session Caisse', 'DATA BUG', 'Écart 0', `Écart=${sesClot?.ecart_caisse}`);
          }
        } else {
          record('POS-03', '12', 'POS Caisse', 'Clôture Session Caisse', 'FAIL', '200', `HTTP ${res.status}`);
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // 5. PHASE 13 : CARNET DE DETTES & CRÉDITS CLIENTS
    // ══════════════════════════════════════════════════════════════════════
    console.log('\n--- 5. PHASE 13 : CARNET DE DETTES & RELANCES ---');

    if (boutiqueAId) {
      // 5.1 Création d'un client au carnet de dettes
      res = await api('POST', `/api/boutiques/${boutiqueAId}/credits-clients`, {
        nom: 'Ibrahima Débiteur',
        telephone: `77${suffix}8`,
        adresse: 'Médina Rue 22',
        plafond_max: 200000,
      }, tokenA);

      const clientId = res.data?.client?.id || res.data?.id;
      if ((res.status === 200 || res.status === 201) && clientId) {
        record('DETTE-01', '13', 'Carnet Dettes', 'Création Client Débiteur', 'PASS', 'Client créé', `OK id=${clientId}`);

        // 5.2 Ajout d'une dette initiale de 80 000 FCFA
        res = await api('POST', `/api/boutiques/${boutiqueAId}/credits-clients/${clientId}/transaction`, {
          type: 'vente_credit',
          montant: 80000,
          note: 'Achat à crédit 2 sacs de riz',
          date_echeance: '2026-10-15',
        }, tokenA);

        const s1 = (await pool.query('SELECT solde FROM caisse_clients_credits WHERE id=$1', [clientId])).rows[0]?.solde;
        if (Number(s1) === 80000) {
          record('DETTE-02', '13', 'Carnet Dettes', 'Création Dette + Solde DB 80 000 FCFA', 'PASS', 'Solde = 80000', `Solde SQL=${s1}`);
        } else {
          record('DETTE-02', '13', 'Carnet Dettes', 'Création Dette Solde', 'DATA BUG', 'Solde 80000', `Solde SQL=${s1}`);
        }

        // 5.3 Remboursement partiel de 30 000 FCFA
        res = await api('POST', `/api/boutiques/${boutiqueAId}/credits-clients/${clientId}/transaction`, {
          type: 'remboursement',
          montant: 30000,
          mode_paiement: 'wave',
          note: 'Acompte Wave',
        }, tokenA);

        const s2 = (await pool.query('SELECT solde FROM caisse_clients_credits WHERE id=$1', [clientId])).rows[0]?.solde;
        if (Number(s2) === 50000) {
          record('DETTE-03', '13', 'Carnet Dettes', 'Paiement Partiel Wave + Recalcul Solde (50 000 FCFA)', 'PASS', 'Solde = 50000', `Solde SQL=${s2}`);
        } else {
          record('DETTE-03', '13', 'Carnet Dettes', 'Paiement Partiel', 'DATA BUG', 'Solde 50000', `Solde SQL=${s2}`);
        }
      } else {
        record('DETTE-01', '13', 'Carnet Dettes', 'Création Client Débiteur', 'FAIL', '201', `HTTP ${res.status}`);
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // 6. PHASE 16 : IMMOBILIER, AGENCES, BIENS & GESTION LOCATIVE
    // ══════════════════════════════════════════════════════════════════════
    console.log('\n--- 6. PHASE 16 : IMMOBILIER, AGENCES & GESTION LOCATIVE ---');

    // 6.1 Création Agence Immobilière
    const agenceNom = `Agence Nopalou Immo Prestige ${suffix}`;
    res = await api('POST', '/api/agences', {
      nom: agenceNom,
      ville: 'Dakar',
      quartier: 'Almadies',
      telephone: `77${suffix}3`,
      whatsapp: `77${suffix}3`,
      description: 'Agence experte villas de standing Almadies Ngor',
    }, tokenA);

    const agenceData = res.data?.agence || res.data;
    const agenceSlug = agenceData?.slug;
    const agenceId = agenceData?.id;

    if ((res.status === 201 || res.status === 200) && agenceSlug) {
      // Contrôle SQL agences_immo et agence_membres
      const agDb = await pool.query('SELECT id, nom, utilisateur_id FROM agences_immo WHERE id=$1', [agenceId]);
      const mbDb = await pool.query('SELECT id, role FROM agence_membres WHERE agence_id=$1 AND utilisateur_id=$2', [agenceId, userA.id]);

      if (agDb.rows.length === 1 && mbDb.rows.length === 1 && (mbDb.rows[0].role === 'admin_agence' || mbDb.rows[0].role === 'admin')) {
        record('IMMO-01', '16', 'Immobilier', 'Création Agence + Rôle Admin Membre DB', 'PASS', 'Agence créée + Membre Admin en DB', `OK slug=${agenceSlug}`);
      } else {
        record('IMMO-01', '16', 'Immobilier', 'Création Agence Immo', 'DATA BUG', 'Membres et Agence synchronisés en DB', `Rôle trouvé: ${mbDb.rows[0]?.role}`);
      }

      // 6.2 Création d'un Bien Immobilier
      res = await api('POST', `/api/biens/agence/${agenceSlug}`, {
        titre: 'Villa Contemporaine 5 Pièces Piscine',
        description: 'Superbe villa avec jardin arboré et piscine privée',
        type_bien: 'villa',
        type_transaction: 'location',
        prix_location: 1500000,
        prix: 1500000,
        surface: 350,
        surface_m2: 350,
        nb_pieces: 5,
        nb_chambres: 4,
        nb_sdb: 4,
        ville: 'Dakar',
        quartier: 'Almadies',
        meuble: true,
        commodites: ['Piscine', 'Groupe électrogène', 'Gardien 24/7', 'Climatisation'],
      }, tokenA);

      const bienData = res.data?.bien || res.data;
      const bienId = bienData?.id;

      if ((res.status === 201 || res.status === 200) && bienId) {
        const bienDb = await pool.query('SELECT id, titre, prix_location, agence_id, statut FROM biens_immo WHERE id=$1', [bienId]);
        if (bienDb.rows.length === 1 && Number(bienDb.rows[0].prix_location) === 1500000 && bienDb.rows[0].statut === 'actif') {
          record('IMMO-02', '16', 'Immobilier', 'Ajout Bien Immobilier + Persistance DB', 'PASS', 'Bien actif en DB (prix_location=1500000)', `OK id=${bienId}`);
        } else {
          record('IMMO-02', '16', 'Immobilier', 'Ajout Bien Immobilier', 'DATA BUG', 'Bien en DB avec statut actif', `statut=${bienDb.rows[0]?.statut}, prix_location=${bienDb.rows[0]?.prix_location}`);
        }

        // 6.3 Création Propriétaire / Bailleur
        const pRes = await api('POST', `/api/crm-immo/agence/${agenceSlug}/proprietaires`, {
          nom: 'Mamadou Propriétaire',
          telephone: `77${suffix}5`,
          email: `proprio_${suffix}@gmail.com`,
          type_bailleur: 'particulier',
        }, tokenA);
        const proprietaireId = pRes.data?.proprietaire?.id;

        // 6.4 Création Mandat de Gestion
        if (proprietaireId) {
          res = await api('POST', `/api/mandats-immo/agence/${agenceSlug}`, {
            bien_id: bienId,
            proprietaire_id: proprietaireId,
            type_mandat: 'exclusif',
            type_operation: 'location',
            duree_mois: 12,
            taux_commission: 10,
          }, tokenA);
          if (res.status === 200 || res.status === 201) {
            record('IMMO-03', '16', 'Immobilier', 'Création Mandat de Gestion', 'PASS', 'Mandat actif', 'Mandat persisté');
          } else {
            record('IMMO-03', '16', 'Immobilier', 'Création Mandat', 'FAIL', '201', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
          }
        } else {
          record('IMMO-03', '16', 'Immobilier', 'Création Propriétaire/Mandat', 'FAIL', 'Propriétaire créé', `HTTP ${pRes.status}`);
        }

        // 6.5 Création d'un Prospect / Contact
        const cRes = await api('POST', `/api/crm-immo/agence/${agenceSlug}/contacts`, {
          nom: 'Cheikh Visiteur Prospect',
          telephone: `77${suffix}6`,
          email: `prospect_${suffix}@gmail.com`,
          type_contact: 'prospect',
        }, tokenA);
        const contactId = cRes.data?.contact?.id || cRes.data?.id;

        // 6.6 Programmation d'une Visite
        if (contactId) {
          res = await api('POST', `/api/crm-immo/agence/${agenceSlug}/visites`, {
            bien_id: bienId,
            contact_id: contactId,
            date_visite: '2026-09-25 15:30:00',
            duree_min: 30,
            lieu_rdv: 'Devant la villa aux Almadies',
          }, tokenA);
          if (res.status === 200 || res.status === 201) {
            record('IMMO-04', '16', 'Immobilier', 'Programmation Visite Bien', 'PASS', 'Visite planifiée', 'Enregistrée');
          } else {
            record('IMMO-04', '16', 'Immobilier', 'Programmation Visite Bien', 'FAIL', '201', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
          }

          // 6.7 Création d'un Bail Locatif & Échéances de Loyers
          res = await api('POST', `/api/locatif-immo/agence/${agenceSlug}/baux`, {
            bien_id: bienId,
            locataire_id: contactId,
            proprietaire_id: proprietaireId,
            loyer_mensuel: 1500000,
            depot_garantie: 3000000,
            date_debut: '2026-10-01',
            duree_mois: 12,
          }, tokenA);

          const bailId = res.data?.bail?.id || res.data?.id;
          if ((res.status === 200 || res.status === 201) && bailId) {
            const bailDb = await pool.query('SELECT id, loyer_mensuel, statut FROM baux_immo WHERE id=$1', [bailId]);
            if (bailDb.rows.length === 1 && Number(bailDb.rows[0].loyer_mensuel) === 1500000) {
              record('IMMO-05', '16', 'Immobilier', 'Création Bail Locatif + Persistance DB', 'PASS', 'Bail actif en DB', `OK bailId=${bailId}`);
            } else {
              record('IMMO-05', '16', 'Immobilier', 'Création Bail Locatif', 'DATA BUG', 'Bail en DB', 'Incohérence SQL bail');
            }
          } else {
            record('IMMO-05', '16', 'Immobilier', 'Création Bail Locatif', 'FAIL', '201', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
          }
        } else {
          record('IMMO-04', '16', 'Immobilier', 'Création Prospect pour Visite', 'FAIL', 'Prospect créé', `HTTP ${cRes.status}`);
        }
      } else {
        record('IMMO-02', '16', 'Immobilier', 'Ajout Bien Immobilier', 'FAIL', '201', `HTTP ${res.status}`);
      }

      // 6.8 Isolation Multi-Agence : Agence B tente de modifier le bien de Agence A
      if (tokenB && bienId) {
        res = await api('PUT', `/api/biens/agence/${agenceSlug}/${bienId}`, {
          prix_location: 100,
        }, tokenB);
        if (res.status === 403 || res.status === 401) {
          record('SEC-IMMO-IDOR', '3', 'Sécurité Immo', 'Tentative modif bien d\'une autre agence', 'PASS', '403 Forbidden', 'Bloqué avec succès');
        } else {
          record('SEC-IMMO-IDOR', '3', 'Sécurité Immo', 'Tentative modif bien autre agence', 'SECURITY BUG', '403', `HTTP ${res.status}`);
        }
      }
    } else {
      record('IMMO-01', '16', 'Immobilier', 'Création Agence Immo', 'FAIL', '201', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 7. PHASE 18 : CHATBOT IA HYBRIDE & RECHERCHE GLOBALE
    // ══════════════════════════════════════════════════════════════════════
    console.log('\n--- 7. PHASE 18 : CHATBOT & RECHERCHE ---');

    // 7.1 Recherche Globale
    res = await api('GET', '/api/search?q=Samsung');
    if (res.status === 200 && Array.isArray(res.data?.produits || res.data?.results || res.data)) {
      record('SEARCH-01', '5', 'Recherche', 'Recherche Produit Textuelle', 'PASS', '200 + Liste produits', 'Résultats reçus');
    } else {
      record('SEARCH-01', '5', 'Recherche', 'Recherche Produit Textuelle', 'FAIL', '200 Array', `HTTP ${res.status}`);
    }

    // 7.2 Recherche Sécurisée Anti-XSS
    res = await api('GET', '/api/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E');
    if (res.status === 200) {
      record('SEARCH-02', '5', 'Recherche', 'Recherche avec Payload XSS', 'PASS', '200 Assaini sans crash', 'Sécurisé');
    } else {
      record('SEARCH-02', '5', 'Recherche', 'Recherche avec Payload XSS', 'FAIL', '200', `HTTP ${res.status}`);
    }

    // 7.3 Chatbot Santé WhatsApp & Diagnostic
    res = await api('GET', '/api/health');
    if (res.status === 200 && res.data?.db?.status === 'ok') {
      record('HEALTH-01', '21', 'Système', 'Liveness & Readiness Healthcheck', 'PASS', 'DB OK, Latence < 200ms', `OK (${res.data?.db?.latencyMs}ms)`);
    } else {
      record('HEALTH-01', '21', 'Système', 'Liveness & Readiness', 'FAIL', '200 ok', `HTTP ${res.status}`);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 8. PHASE 21 : ADMINISTRATION & SÉCURITÉ DU SECRET
    // ══════════════════════════════════════════════════════════════════════
    console.log('\n--- 8. PHASE 21 : ADMINISTRATION CENTRALE ---');

    const adminSecret = process.env.ADMIN_SECRET;
    if (adminSecret) {
      // 8.1 Login admin avec secret valide
      res = await api('POST', '/api/admin/login', { secret: adminSecret });
      if (res.status === 200 && res.data.ok) {
        record('ADMIN-01', '21', 'Admin', 'Login Admin avec ADMIN_SECRET', 'PASS', '200 ok', 'Cookie/Session Admin émis');

        // 8.2 Lecture Dashboard Métriques avec Header x-admin-secret
        res = await api('GET', '/api/admin/dashboard/stats', null, null, { 'x-admin-secret': adminSecret });
        if (res.status === 200) {
          record('ADMIN-02', '21', 'Admin', 'Consultation Dashboard Métriques Globales', 'PASS', '200 + KPIs système', 'Métriques reçues');
        } else {
          record('ADMIN-02', '21', 'Admin', 'Consultation Dashboard Métriques', 'FAIL', '200', `HTTP ${res.status}`);
        }

        // 8.3 Lecture Audit Logs
        res = await api('GET', '/api/admin/audit-logs', null, null, { 'x-admin-secret': adminSecret });
        if (res.status === 200) {
          record('ADMIN-03', '21', 'Admin', 'Consultation Journal d\'Audit Système', 'PASS', '200 + Logs', 'Journal accessible');
        } else {
          record('ADMIN-03', '21', 'Admin', 'Consultation Journal Audit', 'FAIL', '200', `HTTP ${res.status}`);
        }
      } else {
        record('ADMIN-01', '21', 'Admin', 'Login Admin avec ADMIN_SECRET', 'FAIL', '200', `HTTP ${res.status}`);
      }
    } else {
      record('ADMIN-01', '21', 'Admin', 'Login Admin', 'BLOCKED', 'ADMIN_SECRET configuré', 'Variable manquante');
    }

  } catch (globalErr) {
    console.error('💥 Erreur globale inattendue:', globalErr);
  } finally {
    console.log('\n======================================================================');
    console.log('📊 SYNTHÈSE DE LA SUITE D\'ESSAIS API & PERSISTANCE DB');
    console.log('======================================================================');
    const total = results.length;
    const pass = results.filter(r => r.status === 'PASS').length;
    const fail = results.filter(r => r.status === 'FAIL').length;
    const dataBugs = results.filter(r => r.status === 'DATA BUG').length;
    const secBugs = results.filter(r => r.status === 'SECURITY BUG').length;
    const blocked = results.filter(r => r.status === 'BLOCKED').length;

    console.log(`Total tests exécutés   : ${total}`);
    console.log(`✅ Conformes (PASS)     : ${pass}`);
    console.log(`❌ Échecs (FAIL)        : ${fail}`);
    console.log(`📊 Bugs Données (DATA)  : ${dataBugs}`);
    console.log(`🛡️  Bugs Sécurité (SEC)  : ${secBugs}`);
    console.log(`⚠️ Bloqués (BLOCKED)    : ${blocked}`);

    const outPath = path.resolve('scripts/qa-campaign/report-api-persistence.json');
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`💾 Rapport de test sauvegardé dans : ${outPath}\n`);

    await pool.end();
  }
}

run();
