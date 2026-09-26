/**
 * Service de base de données locale (IndexedDB) pour la caisse enregistreuse POS en mode offline.
 *
 * v3 — Refonte majeure :
 *  - Isolation complète par userId + boutiqueId dans toutes les clés.
 *  - Champ `status` dans ventes_queue ('pending' | 'syncing' | 'done') pour éviter les doubles syncs.
 *  - Suppression de `viderVentesHorsLigne` (trop dangereux).
 *  - Tracing de diagnostic explicite 💾 [IndexedDB v3].
 */

const DB_NAME = 'nopalou_pos_offline';
const DB_VERSION = 5;

export interface OfflineSale {
  id_temporaire: string;    // UUID unique généré côté client — utilisé comme idempotency_key
  boutique_id: string;
  user_id: string;          // Isolation par utilisateur
  session_id?: string | null; // ID de la session de caisse POS
  caissier_id?: string | null; // ID du caissier
  items: Array<{
    id: string | null;
    nom: string;
    quantite: number;
    prix: number;
  }>;
  caissier: string;
  modePaiement: string;
  client_id?: string | null;
  total: number;
  date: string;
  status: 'pending' | 'syncing' | 'done'; // Verrou de synchronisation
}

export interface OfflineDebtTransaction {
  id_temporaire: string;    // UUID unique d'idempotence
  boutique_id: string;
  user_id: string;
  client_id: string;
  type: 'vente_credit' | 'remboursement' | 'depot_avance';
  montant: number;
  mode_paiement?: string;
  note?: string | null;
  produits?: Array<{ nom: string; quantite: number; prix: number }>;
  date_echeance?: string | null;
  relance_auto_whatsapp?: boolean;
  date: string;
  status: 'pending' | 'syncing' | 'done';
}

export interface OfflineClotureSession {
  id_temporaire: string;
  boutique_id: string;
  session_id: string;
  especes_comptees: number;
  detail_billets?: Record<string, number>;
  ventes_especes?: number;
  ventes_wave?: number;
  ventes_orange_money?: number;
  ventes_carte?: number;
  ventes_total?: number;
  nb_ventes?: number;
  caissier_nom?: string;
  date: string;
  status: 'pending' | 'syncing' | 'done';
}

export function initialiserBaseLocale(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error("IndexedDB n'est pas disponible côté serveur"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("❌ 💾 [IndexedDB v5] Erreur d'ouverture d'IndexedDB:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;

      if (!db.objectStoreNames.contains('produits')) {
        const produitsStore = db.createObjectStore('produits', { keyPath: 'cache_key' });
        produitsStore.createIndex('by_boutique', ['user_id', 'boutique_id'], { unique: false });
      }

      if (!db.objectStoreNames.contains('clients')) {
        const clientsStore = db.createObjectStore('clients', { keyPath: 'cache_key' });
        clientsStore.createIndex('by_boutique', ['user_id', 'boutique_id'], { unique: false });
      }

      if (!db.objectStoreNames.contains('ventes_queue')) {
        const ventesStore = db.createObjectStore('ventes_queue', { keyPath: 'id_temporaire' });
        ventesStore.createIndex('by_boutique_status', ['boutique_id', 'status'], { unique: false });
        ventesStore.createIndex('by_user_boutique', ['user_id', 'boutique_id'], { unique: false });
      }

      // Store v4 : file d'attente des transactions du carnet de dettes
      if (!db.objectStoreNames.contains('dettes_queue')) {
        const dettesStore = db.createObjectStore('dettes_queue', { keyPath: 'id_temporaire' });
        dettesStore.createIndex('by_boutique_status', ['boutique_id', 'status'], { unique: false });
        dettesStore.createIndex('by_user_boutique', ['user_id', 'boutique_id'], { unique: false });
      }

      // Store v5 : Caissiers persistés hors-ligne (résout l'oubli des codes PIN)
      if (!db.objectStoreNames.contains('caissiers')) {
        const caissiersStore = db.createObjectStore('caissiers', { keyPath: 'cache_key' });
        caissiersStore.createIndex('by_boutique', ['user_id', 'boutique_id'], { unique: false });
      }

      // Store v5 : File d'attente des clôtures de session Z hors-ligne
      if (!db.objectStoreNames.contains('clotures_queue')) {
        const cloturesStore = db.createObjectStore('clotures_queue', { keyPath: 'id_temporaire' });
        cloturesStore.createIndex('by_boutique_status', ['boutique_id', 'status'], { unique: false });
      }

      // Store v5 : Cache des boutiques du marchand (résout le rechargement F5 hors-ligne)
      if (!db.objectStoreNames.contains('marchand_boutiques')) {
        const mbStore = db.createObjectStore('marchand_boutiques', { keyPath: 'cache_key' });
        mbStore.createIndex('by_user', 'user_id', { unique: false });
      }
    };
  });
}

// --- CATALOGUE PRODUITS ---

export async function sauvegarderProduitsLocaux(
  produits: any[],
  boutiqueId: string,
  userId: string
): Promise<void> {
  if (!boutiqueId || !userId) return;
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('produits', 'readwrite');
    const store = tx.objectStore('produits');

    const index = store.index('by_boutique');
    const range = IDBKeyRange.only([userId, boutiqueId]);
    const cursorReq = index.openCursor(range);

    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        produits.forEach((p) => {
          store.put({
            ...p,
            user_id: userId,
            boutique_id: boutiqueId,
            cache_key: `${userId}:${boutiqueId}:${p.id}`,
          });
        });
      }
    };

    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => {
      console.error(`💾 [IndexedDB v3] ❌ Erreur sauvegarde produits:`, tx.error);
      reject(tx.error);
    };
  });
}

export async function obtenirProduitsLocaux(
  boutiqueId: string,
  userId: string
): Promise<any[]> {
  if (!boutiqueId || !userId) return [];
  const db = await initialiserBaseLocale();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('produits', 'readonly');
    const store = tx.objectStore('produits');
    const index = store.index('by_boutique');
    const range = IDBKeyRange.only([userId, boutiqueId]);
    const request = index.getAll(range);

    request.onsuccess = () => {
      const results: any[] = request.result || [];
      resolve(results.map(({ cache_key, user_id, boutique_id: _b, ...prod }) => prod));
    };
    request.onerror = () => {
      console.error(`💾 [IndexedDB v3] ❌ Erreur lecture produits locaux:`, request.error);
      reject(request.error);
    };
  });
}

// --- CLIENTS ---

export async function sauvegarderClientsLocaux(
  clients: any[],
  boutiqueId: string,
  userId: string
): Promise<void> {
  if (!boutiqueId || !userId) return;
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('clients', 'readwrite');
    const store = tx.objectStore('clients');

    const index = store.index('by_boutique');
    const range = IDBKeyRange.only([userId, boutiqueId]);
    const cursorReq = index.openCursor(range);

    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        clients.forEach((c) => {
          store.put({
            ...c,
            user_id: userId,
            boutique_id: boutiqueId,
            cache_key: `${userId}:${boutiqueId}:${c.id}`,
          });
        });
      }
    };

    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => {
      console.error(`💾 [IndexedDB v3] ❌ Erreur sauvegarde clients:`, tx.error);
      reject(tx.error);
    };
  });
}

export async function obtenirClientsLocaux(
  boutiqueId: string,
  userId: string
): Promise<any[]> {
  if (!boutiqueId || !userId) return [];
  const db = await initialiserBaseLocale();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('clients', 'readonly');
    const store = tx.objectStore('clients');
    const index = store.index('by_boutique');
    const range = IDBKeyRange.only([userId, boutiqueId]);
    const request = index.getAll(range);

    request.onsuccess = () => {
      const results: any[] = request.result || [];
      resolve(results.map(({ cache_key, user_id, boutique_id: _b, ...client }) => client));
    };
    request.onerror = () => {
      console.error(`💾 [IndexedDB v3] ❌ Erreur lecture clients locaux:`, request.error);
      reject(request.error);
    };
  });
}

// --- SYNCHRONISATION DES VENTES HORS-LIGNE ---

export async function ajouterVenteHorsLigne(vente: Omit<OfflineSale, 'status'>): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('ventes_queue', 'readwrite');
    const store = tx.objectStore('ventes_queue');
    const payload = { ...vente, status: 'pending' as const };
    store.put(payload);

    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => {
      console.error(`💾 [IndexedDB v3] ❌ Erreur ajout vente hors-ligne:`, tx.error);
      reject(tx.error);
    };
  });
}

export async function obtenirVentesHorsLigne(
  boutiqueId?: string,
  userId?: string
): Promise<OfflineSale[]> {
  const db = await initialiserBaseLocale();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ventes_queue', 'readonly');
    const store = tx.objectStore('ventes_queue');

    const request = store.getAll();
    request.onsuccess = () => {
      let list: OfflineSale[] = request.result || [];
      if (boutiqueId) {
        list = list.filter((v) => {
          if (v.boutique_id !== boutiqueId) return false;
          if (userId && v.user_id && v.user_id !== userId && v.user_id !== 'commercant') return false;
          return true;
        });
      }
      resolve(list.filter((v) => v.status === 'pending'));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function marquerVenteSyncing(id_temporaire: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('ventes_queue', 'readwrite');
    const store = tx.objectStore('ventes_queue');
    const getReq = store.get(id_temporaire);

    getReq.onsuccess = () => {
      if (getReq.result) {
        store.put({ ...getReq.result, status: 'syncing' });
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function supprimerVenteHorsLigne(id_temporaire: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('ventes_queue', 'readwrite');
    const store = tx.objectStore('ventes_queue');
    store.delete(id_temporaire);

    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function revertVenteSyncing(id_temporaire: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('ventes_queue', 'readwrite');
    const store = tx.objectStore('ventes_queue');
    const getReq = store.get(id_temporaire);

    getReq.onsuccess = () => {
      if (getReq.result && getReq.result.status === 'syncing') {
        store.put({ ...getReq.result, status: 'pending' });
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- SYNCHRONISATION DES DETTES HORS-LIGNE ---

export async function ajouterDetteHorsLigne(dette: Omit<OfflineDebtTransaction, 'status'>): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('dettes_queue', 'readwrite');
    const store = tx.objectStore('dettes_queue');
    const payload = { ...dette, status: 'pending' as const };
    store.put(payload);

    tx.oncomplete = () => resolve();
    tx.onerror = () => {
      console.error(`💾 [IndexedDB v4] ❌ Erreur ajout dette hors-ligne:`, tx.error);
      reject(tx.error);
    };
  });
}

export async function obtenirDettesHorsLigne(
  boutiqueId?: string,
  userId?: string
): Promise<OfflineDebtTransaction[]> {
  const db = await initialiserBaseLocale();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('dettes_queue', 'readonly');
    const store = tx.objectStore('dettes_queue');

    const request = store.getAll();
    request.onsuccess = () => {
      let list: OfflineDebtTransaction[] = request.result || [];
      if (boutiqueId) {
        list = list.filter((v) => {
          if (v.boutique_id !== boutiqueId) return false;
          if (userId && v.user_id && v.user_id !== userId && v.user_id !== 'commercant') return false;
          return true;
        });
      }
      resolve(list.filter((v) => v.status === 'pending'));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function marquerDetteSyncing(id_temporaire: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('dettes_queue', 'readwrite');
    const store = tx.objectStore('dettes_queue');
    const getReq = store.get(id_temporaire);

    getReq.onsuccess = () => {
      if (getReq.result) {
        store.put({ ...getReq.result, status: 'syncing' });
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function supprimerDetteHorsLigne(id_temporaire: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('dettes_queue', 'readwrite');
    const store = tx.objectStore('dettes_queue');
    store.delete(id_temporaire);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function revertDetteSyncing(id_temporaire: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('dettes_queue', 'readwrite');
    const store = tx.objectStore('dettes_queue');
    const getReq = store.get(id_temporaire);

    getReq.onsuccess = () => {
      if (getReq.result && getReq.result.status === 'syncing') {
        store.put({ ...getReq.result, status: 'pending' });
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- CAISSIERS ---

export async function sauvegarderCaissiersLocaux(
  caissiers: any[],
  boutiqueId: string,
  userId: string
): Promise<void> {
  if (!boutiqueId || !userId) return;
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('caissiers', 'readwrite');
    const store = tx.objectStore('caissiers');

    const index = store.index('by_boutique');
    const range = IDBKeyRange.only([userId, boutiqueId]);
    const cursorReq = index.openCursor(range);

    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        caissiers.forEach((c) => {
          store.put({
            ...c,
            user_id: userId,
            boutique_id: boutiqueId,
            cache_key: `${userId}:${boutiqueId}:${c.id || c.code_pin}`,
          });
        });
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => {
      console.error(`💾 [IndexedDB v5] ❌ Erreur sauvegarde caissiers:`, tx.error);
      reject(tx.error);
    };
  });
}

export async function obtenirCaissiersLocaux(
  boutiqueId: string,
  userId: string
): Promise<any[]> {
  if (!boutiqueId || !userId) return [];
  const db = await initialiserBaseLocale();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('caissiers', 'readonly');
    const store = tx.objectStore('caissiers');
    const index = store.index('by_boutique');
    const range = IDBKeyRange.only([userId, boutiqueId]);
    const request = index.getAll(range);

    request.onsuccess = () => {
      const results: any[] = request.result || [];
      resolve(results.map(({ cache_key, user_id, boutique_id: _b, ...c }) => c));
    };
    request.onerror = () => {
      console.error(`💾 [IndexedDB v5] ❌ Erreur lecture caissiers locaux:`, request.error);
      reject(request.error);
    };
  });
}

// --- CLÔTURES DE CAISSE Z HORS-LIGNE ---

export async function ajouterClotureHorsLigne(cloture: OfflineClotureSession): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('clotures_queue', 'readwrite');
    const store = tx.objectStore('clotures_queue');
    const payload = { ...cloture, status: 'pending' as const };
    store.put(payload);

    tx.oncomplete = () => resolve();
    tx.onerror = () => {
      console.error(`💾 [IndexedDB v5] ❌ Erreur ajout clôture hors-ligne:`, tx.error);
      reject(tx.error);
    };
  });
}

export async function obtenirCloturesHorsLigne(
  boutiqueId?: string
): Promise<OfflineClotureSession[]> {
  const db = await initialiserBaseLocale();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('clotures_queue', 'readonly');
    const store = tx.objectStore('clotures_queue');

    const request = store.getAll();
    request.onsuccess = () => {
      let list: OfflineClotureSession[] = request.result || [];
      if (boutiqueId) {
        list = list.filter((c) => c.boutique_id === boutiqueId);
      }
      resolve(list.filter((c) => c.status === 'pending'));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function marquerClotureSyncing(id_temporaire: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('clotures_queue', 'readwrite');
    const store = tx.objectStore('clotures_queue');
    const getReq = store.get(id_temporaire);

    getReq.onsuccess = () => {
      if (getReq.result) {
        store.put({ ...getReq.result, status: 'syncing' });
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function supprimerClotureHorsLigne(id_temporaire: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('clotures_queue', 'readwrite');
    const store = tx.objectStore('clotures_queue');
    store.delete(id_temporaire);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function revertClotureSyncing(id_temporaire: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('clotures_queue', 'readwrite');
    const store = tx.objectStore('clotures_queue');
    const getReq = store.get(id_temporaire);

    getReq.onsuccess = () => {
      if (getReq.result && getReq.result.status === 'syncing') {
        store.put({ ...getReq.result, status: 'pending' });
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- BOUTIQUES DU MARCHAND (Résout F5 offline) ---

export async function sauvegarderBoutiquesLocales(
  boutiques: any[],
  userId: string
): Promise<void> {
  if (!userId) return;
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('marchand_boutiques', 'readwrite');
    const store = tx.objectStore('marchand_boutiques');
    const index = store.index('by_user');
    const range = IDBKeyRange.only(userId);
    const cursorReq = index.openCursor(range);

    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        boutiques.forEach((b) => {
          store.put({
            ...b,
            user_id: userId,
            cache_key: `${userId}:${b.id}`,
          });
        });
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => {
      console.error(`💾 [IndexedDB v5] ❌ Erreur sauvegarde boutiques locales:`, tx.error);
      reject(tx.error);
    };
  });
}

export async function obtenirBoutiquesLocales(userId: string): Promise<any[]> {
  if (!userId) return [];
  const db = await initialiserBaseLocale();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('marchand_boutiques', 'readonly');
    const store = tx.objectStore('marchand_boutiques');
    const index = store.index('by_user');
    const range = IDBKeyRange.only(userId);
    const request = index.getAll(range);

    request.onsuccess = () => {
      const results: any[] = request.result || [];
      resolve(results.map(({ cache_key, user_id, ...b }) => b));
    };
    request.onerror = () => {
      console.error(`💾 [IndexedDB v5] ❌ Erreur lecture boutiques locales:`, request.error);
      reject(request.error);
    };
  });
}

// --- DÉCRÉMENTATION DE STOCK PRODUIT HORS-LIGNE ---

export async function ajusterStockProduitLocal(
  boutiqueId: string,
  userId: string,
  produitId: string,
  quantiteVendue: number
): Promise<void> {
  if (!boutiqueId || !userId || !produitId || !quantiteVendue) return;
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve) => {
    const tx = db.transaction('produits', 'readwrite');
    const store = tx.objectStore('produits');
    const cacheKey = `${userId}:${boutiqueId}:${produitId}`;
    const getReq = store.get(cacheKey);

    getReq.onsuccess = () => {
      const item = getReq.result;
      if (item && typeof item.stock === 'number') {
        item.stock = Math.max(0, item.stock - quantiteVendue);
        store.put(item);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => {
      console.warn(`💾 [IndexedDB v5] Impossible d'ajuster le stock local pour ${produitId}`);
      resolve(); // Résolution non-bloquante pour ne pas bloquer le checkout
    };
  });
}

// --- PURGE DE SÉCURITÉ DU CACHE (Isolation multi-comptes au Logout) ---

export async function purgerCacheUtilisateur(userId: string): Promise<void> {
  if (!userId) return;
  const db = await initialiserBaseLocale();
  const storesToClean = ['produits', 'clients', 'caissiers', 'marchand_boutiques'];

  return new Promise<void>((resolve) => {
    const tx = db.transaction(storesToClean, 'readwrite');

    storesToClean.forEach((storeName) => {
      const store = tx.objectStore(storeName);
      if (store.indexNames.contains('by_user')) {
        const index = store.index('by_user');
        const cursorReq = index.openCursor(IDBKeyRange.only(userId));
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
      } else {
        const cursorReq = store.openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor) {
            if (cursor.value && cursor.value.user_id === userId) {
              cursor.delete();
            }
            cursor.continue();
          }
        };
      }
    });

    tx.oncomplete = () => {
      console.log(`💾 [IndexedDB v5] Cache utilisateur ${userId} purgé avec succès.`);
      resolve();
    };
    tx.onerror = () => {
      console.warn(`💾 [IndexedDB v5] Erreur lors de la purge du cache utilisateur ${userId}`);
      resolve();
    };
  });
}

