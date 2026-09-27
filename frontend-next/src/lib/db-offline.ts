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
const DB_VERSION = 6;

/**
 * Hache un code PIN à l'aide de SHA-256 avec l'ID de la boutique comme sel.
 * Garantit qu'aucun code PIN en clair n'est stocké dans IndexedDB ou localStorage.
 */
export async function hashPin(pin: string, boutiqueId: string): Promise<string> {
  if (!pin) return '';
  try {
    const cleanPin = String(pin).trim();
    const cleanSalt = String(boutiqueId || '').trim();
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      // Fallback si WebCrypto n'est pas dispo (SSR / environnement très restreint)
      let hash = 0;
      const str = `${cleanSalt}:${cleanPin}`;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return 'fb_' + Math.abs(hash).toString(16);
    }
    const msgUint8 = new TextEncoder().encode(`${cleanSalt}:${cleanPin}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('[hashPin] Erreur hachage:', err);
    return '';
  }
}

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

export interface OfflineExpense {
  id_temporaire: string;    // UUID unique d'idempotence
  boutique_id: string;
  user_id: string;
  montant: number;
  categorie: string;
  description?: string | null;
  date_depense?: string | null;
  date: string;
  status: 'pending' | 'syncing' | 'done';
}

export interface OfflineNewClient {
  id_temporaire: string;    // UUID / ID temporaire unique
  boutique_id: string;
  user_id: string;
  nom: string;
  telephone: string;
  adresse?: string | null;
  plafond_max?: number | null;
  note_client?: string | null;
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
      console.error("❌ 💾 [IndexedDB v6] Erreur d'ouverture d'IndexedDB:", request.error);
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

      // Store v6 : File d'attente des dépenses hors-ligne (comptabilité / caisse)
      if (!db.objectStoreNames.contains('depenses_queue')) {
        const depensesStore = db.createObjectStore('depenses_queue', { keyPath: 'id_temporaire' });
        depensesStore.createIndex('by_boutique_status', ['boutique_id', 'status'], { unique: false });
        depensesStore.createIndex('by_user_boutique', ['user_id', 'boutique_id'], { unique: false });
      }

      // Store v6 : File d'attente des nouveaux clients créés hors-ligne
      if (!db.objectStoreNames.contains('nouveaux_clients_queue')) {
        const ncStore = db.createObjectStore('nouveaux_clients_queue', { keyPath: 'id_temporaire' });
        ncStore.createIndex('by_boutique_status', ['boutique_id', 'status'], { unique: false });
        ncStore.createIndex('by_user_boutique', ['user_id', 'boutique_id'], { unique: false });
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

  // Hachage sécurisé SHA-256 avec sel boutiqueId pour protéger les PINs en local
  const caissiersHaches = await Promise.all(
    caissiers.map(async (c) => {
      let pin_hash = c.pin_hash;
      if (!pin_hash && c.code_pin) {
        pin_hash = await hashPin(String(c.code_pin), boutiqueId);
      }
      const { code_pin: _plainPin, ...rest } = c;
      return {
        ...rest,
        pin_hash,
      };
    })
  );

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
        caissiersHaches.forEach((c) => {
          store.put({
            ...c,
            user_id: userId,
            boutique_id: boutiqueId,
            cache_key: `${userId}:${boutiqueId}:${c.id || c.pin_hash || Math.random()}`,
          });
        });
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => {
      console.error(`💾 [IndexedDB v6] ❌ Erreur sauvegarde caissiers:`, tx.error);
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

// --- SYNCHRONISATION DES DÉPENSES HORS-LIGNE ---

export async function ajouterDepenseHorsLigne(depense: Omit<OfflineExpense, 'status'>): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('depenses_queue', 'readwrite');
    const store = tx.objectStore('depenses_queue');
    const payload = { ...depense, status: 'pending' as const };
    store.put(payload);

    tx.oncomplete = () => resolve();
    tx.onerror = () => {
      console.error(`💾 [IndexedDB v6] ❌ Erreur ajout dépense hors-ligne:`, tx.error);
      reject(tx.error);
    };
  });
}

export async function obtenirDepensesHorsLigne(
  boutiqueId?: string,
  userId?: string
): Promise<OfflineExpense[]> {
  const db = await initialiserBaseLocale();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('depenses_queue', 'readonly');
    const store = tx.objectStore('depenses_queue');

    const request = store.getAll();
    request.onsuccess = () => {
      let list: OfflineExpense[] = request.result || [];
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

export async function marquerDepenseSyncing(id_temporaire: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('depenses_queue', 'readwrite');
    const store = tx.objectStore('depenses_queue');
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

export async function supprimerDepenseHorsLigne(id_temporaire: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('depenses_queue', 'readwrite');
    const store = tx.objectStore('depenses_queue');
    store.delete(id_temporaire);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function revertDepenseSyncing(id_temporaire: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('depenses_queue', 'readwrite');
    const store = tx.objectStore('depenses_queue');
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

// --- SYNCHRONISATION DES NOUVEAUX CLIENTS HORS-LIGNE ---

export async function ajouterNouveauClientHorsLigne(client: Omit<OfflineNewClient, 'status'>): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('nouveaux_clients_queue', 'readwrite');
    const store = tx.objectStore('nouveaux_clients_queue');
    const payload = { ...client, status: 'pending' as const };
    store.put(payload);

    tx.oncomplete = () => resolve();
    tx.onerror = () => {
      console.error(`💾 [IndexedDB v6] ❌ Erreur ajout nouveau client hors-ligne:`, tx.error);
      reject(tx.error);
    };
  });
}

export async function obtenirNouveauxClientsHorsLigne(
  boutiqueId?: string,
  userId?: string
): Promise<OfflineNewClient[]> {
  const db = await initialiserBaseLocale();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('nouveaux_clients_queue', 'readonly');
    const store = tx.objectStore('nouveaux_clients_queue');

    const request = store.getAll();
    request.onsuccess = () => {
      let list: OfflineNewClient[] = request.result || [];
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

export async function marquerNouveauClientSyncing(id_temporaire: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('nouveaux_clients_queue', 'readwrite');
    const store = tx.objectStore('nouveaux_clients_queue');
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

export async function supprimerNouveauClientHorsLigne(id_temporaire: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('nouveaux_clients_queue', 'readwrite');
    const store = tx.objectStore('nouveaux_clients_queue');
    store.delete(id_temporaire);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function revertNouveauClientSyncing(id_temporaire: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('nouveaux_clients_queue', 'readwrite');
    const store = tx.objectStore('nouveaux_clients_queue');
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

