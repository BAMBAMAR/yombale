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
const DB_VERSION = 7;

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
  status: 'pending' | 'syncing' | 'done' | 'failed'; // Verrou de synchronisation
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
  status: 'pending' | 'syncing' | 'done' | 'failed';
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
  status: 'pending' | 'syncing' | 'done' | 'failed';
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
  status: 'pending' | 'syncing' | 'done' | 'failed';
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
  status: 'pending' | 'syncing' | 'done' | 'failed';
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

      // Store v7 (AUD-093) : sessions de caisse ouvertes hors-ligne, à créer côté serveur avant leurs ventes
      if (!db.objectStoreNames.contains('sessions_queue')) {
        const sStore = db.createObjectStore('sessions_queue', { keyPath: 'id_temporaire' });
        sStore.createIndex('by_boutique_status', ['boutique_id', 'status'], { unique: false });
      }

      // Store v7 (AUD-095) : commandes « WhatsApp Direct » passées hors-ligne
      if (!db.objectStoreNames.contains('commandes_queue')) {
        const cmdStore = db.createObjectStore('commandes_queue', { keyPath: 'id_temporaire' });
        cmdStore.createIndex('by_boutique_status', ['boutique_id', 'status'], { unique: false });
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
    demanderSyncArrierePlan();

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
        store.put({ ...getReq.result, status: 'syncing', syncing_since: Date.now() });
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
    demanderSyncArrierePlan();

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
        store.put({ ...getReq.result, status: 'syncing', syncing_since: Date.now() });
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
    demanderSyncArrierePlan();

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
        store.put({ ...getReq.result, status: 'syncing', syncing_since: Date.now() });
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
    demanderSyncArrierePlan();

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
        store.put({ ...getReq.result, status: 'syncing', syncing_since: Date.now() });
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
    demanderSyncArrierePlan();

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
        store.put({ ...getReq.result, status: 'syncing', syncing_since: Date.now() });
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


// ════════════════════════════════════════════════════════════════════════════
// Modèle commun des files hors-ligne (AUD-088/089/090/093/095)
//   pending → syncing (bail `syncing_since`) → supprimée une fois confirmée par le serveur
//   failed  : erreur métier (4xx) conservée avec son message, visible et traitable par le marchand
// ════════════════════════════════════════════════════════════════════════════

export const FILES_HORS_LIGNE = [
  'ventes_queue',
  'dettes_queue',
  'clotures_queue',
  'depenses_queue',
  'nouveaux_clients_queue',
  'sessions_queue',
  'commandes_queue',
] as const;
export type NomFile = (typeof FILES_HORS_LIGNE)[number];

/** Durée au-delà de laquelle une entrée `syncing` est considérée abandonnée (page rechargée ou fermée en plein envoi). */
export const BAIL_SYNCING_MS = 60_000;

/** Demande une synchronisation en arrière-plan (Chromium) ; sans effet ailleurs, le repli est applicatif (RegisterSW). */
export function demanderSyncArrierePlan(): void {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg: any) => (reg && reg.sync ? reg.sync.register('nopalou-sync') : undefined))
      .catch(() => {});
  } catch {
    /* non bloquant */
  }
}

/** Remet en `pending` toute entrée `syncing` dont le bail a expiré. À appeler au début de chaque cycle. */
export async function reclamerEntreesPerimees(): Promise<number> {
  const db = await initialiserBaseLocale();
  let reclamees = 0;
  const now = Date.now();
  await Promise.all(
    FILES_HORS_LIGNE.map(
      (nom) =>
        new Promise<void>((resolve) => {
          if (!db.objectStoreNames.contains(nom)) return resolve();
          const tx = db.transaction(nom, 'readwrite');
          const store = tx.objectStore(nom);
          const req = store.openCursor();
          req.onsuccess = () => {
            const cursor = req.result;
            if (!cursor) return;
            const v = cursor.value;
            if (v && v.status === 'syncing' && (!v.syncing_since || now - v.syncing_since > BAIL_SYNCING_MS)) {
              cursor.update({ ...v, status: 'pending', syncing_since: null });
              reclamees++;
            }
            cursor.continue();
          };
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        })
    )
  );
  return reclamees;
}

/** Passe une entrée en `failed` en conservant le message du serveur. */
export async function marquerEntreeEchec(nom: NomFile, id: string, erreur: string, code?: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve) => {
    const tx = db.transaction(nom, 'readwrite');
    const store = tx.objectStore(nom);
    const g = store.get(id);
    g.onsuccess = () => {
      if (g.result) store.put({ ...g.result, status: 'failed', syncing_since: null, last_error: erreur, last_error_code: code || null, failed_at: new Date().toISOString() });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export interface EntreeEchouee {
  file: NomFile;
  id: string;
  boutique_id: string;
  libelle: string;
  montant: number | null;
  erreur: string;
  code: string | null;
  date: string;
}

function libelleEntree(nom: NomFile, v: any): { libelle: string; montant: number | null } {
  switch (nom) {
    case 'ventes_queue':
      return { libelle: `Vente (${(v.items || []).map((i: any) => `${i.quantite}x ${i.nom}`).join(', ')})`, montant: Number(v.total) || null };
    case 'dettes_queue':
      return { libelle: v.type === 'remboursement' ? 'Remboursement de dette' : 'Dette client', montant: Number(v.montant) || null };
    case 'depenses_queue':
      return { libelle: `Dépense (${v.categorie || 'divers'})`, montant: Number(v.montant) || null };
    case 'clotures_queue':
      return { libelle: 'Clôture de caisse (Z)', montant: Number(v.ventes_total) || null };
    case 'nouveaux_clients_queue':
      return { libelle: `Nouveau client ${v.nom || ''}`.trim(), montant: null };
    case 'sessions_queue':
      return { libelle: 'Ouverture de session de caisse', montant: Number(v.fond_caisse) || null };
    default:
      return { libelle: 'Commande WhatsApp', montant: Number(v.total) || null };
  }
}

/** Entrées en erreur métier, à traiter par le marchand (réessayer ou abandonner). */
export async function obtenirEntreesEchouees(boutiqueId?: string): Promise<EntreeEchouee[]> {
  const db = await initialiserBaseLocale();
  const out: EntreeEchouee[] = [];
  await Promise.all(
    FILES_HORS_LIGNE.map(
      (nom) =>
        new Promise<void>((resolve) => {
          if (!db.objectStoreNames.contains(nom)) return resolve();
          const req = db.transaction(nom, 'readonly').objectStore(nom).getAll();
          req.onsuccess = () => {
            for (const v of req.result || []) {
              if (v.status !== 'failed') continue;
              if (boutiqueId && v.boutique_id !== boutiqueId) continue;
              const l = libelleEntree(nom, v);
              out.push({ file: nom, id: v.id_temporaire, boutique_id: v.boutique_id, libelle: l.libelle, montant: l.montant, erreur: v.last_error || 'Erreur inconnue', code: v.last_error_code || null, date: v.date || v.failed_at });
            }
            resolve();
          };
          req.onerror = () => resolve();
        })
    )
  );
  return out.sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

export async function reessayerEntreeEchouee(nom: NomFile, id: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve) => {
    const tx = db.transaction(nom, 'readwrite');
    const store = tx.objectStore(nom);
    const g = store.get(id);
    g.onsuccess = () => {
      if (g.result) store.put({ ...g.result, status: 'pending', last_error: null, last_error_code: null });
    };
    tx.oncomplete = () => {
      demanderSyncArrierePlan();
      resolve();
    };
    tx.onerror = () => resolve();
  });
}

export async function abandonnerEntreeEchouee(nom: NomFile, id: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve) => {
    const tx = db.transaction(nom, 'readwrite');
    tx.objectStore(nom).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/** Nombre total d'entrées non terminées (pending, syncing, failed) pour un utilisateur, toutes boutiques. */
export async function compterEntreesEnAttente(): Promise<number> {
  const db = await initialiserBaseLocale();
  let n = 0;
  await Promise.all(
    FILES_HORS_LIGNE.map(
      (nom) =>
        new Promise<void>((resolve) => {
          if (!db.objectStoreNames.contains(nom)) return resolve();
          const req = db.transaction(nom, 'readonly').objectStore(nom).count();
          req.onsuccess = () => {
            n += req.result || 0;
            resolve();
          };
          req.onerror = () => resolve();
        })
    )
  );
  return n;
}

// ── Correspondance identifiant local → identifiant serveur (clients, sessions) ──────────────
const CLE_MAP_IDS = 'nopalou_idmap';

export function enregistrerCorrespondanceId(idLocal: string, idServeur: string): void {
  try {
    const m = JSON.parse(localStorage.getItem(CLE_MAP_IDS) || '{}');
    m[idLocal] = idServeur;
    localStorage.setItem(CLE_MAP_IDS, JSON.stringify(m));
  } catch {
    /* stockage indisponible */
  }
}

/** Renvoie l'identifiant serveur d'un identifiant local (cli_temp_…, loc_…) ou l'identifiant reçu tel quel. */
export function resoudreId<T extends string | null | undefined>(id: T): T {
  if (!id) return id;
  try {
    const m = JSON.parse(localStorage.getItem(CLE_MAP_IDS) || '{}');
    return (m[id as string] || id) as T;
  } catch {
    return id;
  }
}

/** Réécrit `champ` dans les entrées en attente des files données quand il vaut `idLocal`. */
export async function remapperReferences(files: NomFile[], champ: string, idLocal: string, idServeur: string): Promise<void> {
  const db = await initialiserBaseLocale();
  await Promise.all(
    files.map(
      (nom) =>
        new Promise<void>((resolve) => {
          if (!db.objectStoreNames.contains(nom)) return resolve();
          const tx = db.transaction(nom, 'readwrite');
          const store = tx.objectStore(nom);
          const req = store.openCursor();
          req.onsuccess = () => {
            const cursor = req.result;
            if (!cursor) return;
            if (cursor.value && cursor.value[champ] === idLocal) cursor.update({ ...cursor.value, [champ]: idServeur });
            cursor.continue();
          };
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        })
    )
  );
  enregistrerCorrespondanceId(idLocal, idServeur);
}

// ── Sessions et commandes hors-ligne (nouvelles files v7) ────────────────────────────────────
export interface OfflineSessionOpen {
  id_temporaire: string; // `loc_…` : identifiant local de session, aussi clé d'idempotence serveur
  boutique_id: string;
  user_id: string;
  caissier_id?: string | null;
  caissier_nom: string;
  fond_caisse: number;
  date: string;
  status: 'pending' | 'syncing' | 'done' | 'failed';
}

export interface OfflineCommande {
  id_temporaire: string; // clé d'idempotence serveur
  boutique_id: string;
  user_id: string;
  payload: Record<string, unknown>;
  total: number;
  date: string;
  status: 'pending' | 'syncing' | 'done' | 'failed';
}

async function ajouterDansFile(nom: NomFile, valeur: any): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(nom, 'readwrite');
    tx.objectStore(nom).put({ ...valeur, status: 'pending' });
    demanderSyncArrierePlan();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function lireFile<T>(nom: NomFile, boutiqueId?: string): Promise<T[]> {
  const db = await initialiserBaseLocale();
  return new Promise<T[]>((resolve, reject) => {
    const req = db.transaction(nom, 'readonly').objectStore(nom).getAll();
    req.onsuccess = () => {
      let list: any[] = req.result || [];
      if (boutiqueId) list = list.filter((v) => v.boutique_id === boutiqueId);
      resolve(list.filter((v) => v.status === 'pending'));
    };
    req.onerror = () => reject(req.error);
  });
}

async function changerEtat(nom: NomFile, id: string, etat: 'syncing' | 'pending'): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve) => {
    const tx = db.transaction(nom, 'readwrite');
    const store = tx.objectStore(nom);
    const g = store.get(id);
    g.onsuccess = () => {
      if (!g.result) return;
      if (etat === 'syncing') store.put({ ...g.result, status: 'syncing', syncing_since: Date.now() });
      else if (g.result.status === 'syncing') store.put({ ...g.result, status: 'pending', syncing_since: null });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

async function supprimerDeFile(nom: NomFile, id: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve) => {
    const tx = db.transaction(nom, 'readwrite');
    tx.objectStore(nom).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export const ajouterSessionHorsLigne = (s: Omit<OfflineSessionOpen, 'status'>) => ajouterDansFile('sessions_queue', s);
export const obtenirSessionsHorsLigne = (boutiqueId?: string) => lireFile<OfflineSessionOpen>('sessions_queue', boutiqueId);
export const marquerSessionSyncing = (id: string) => changerEtat('sessions_queue', id, 'syncing');
export const revertSessionSyncing = (id: string) => changerEtat('sessions_queue', id, 'pending');
export const supprimerSessionHorsLigne = (id: string) => supprimerDeFile('sessions_queue', id);

export const ajouterCommandeHorsLigne = (c: Omit<OfflineCommande, 'status'>) => ajouterDansFile('commandes_queue', c);
export const obtenirCommandesHorsLigne = (boutiqueId?: string) => lireFile<OfflineCommande>('commandes_queue', boutiqueId);
export const marquerCommandeSyncing = (id: string) => changerEtat('commandes_queue', id, 'syncing');
export const revertCommandeSyncing = (id: string) => changerEtat('commandes_queue', id, 'pending');
export const supprimerCommandeHorsLigne = (id: string) => supprimerDeFile('commandes_queue', id);

// ── Purge complète des données locales privées (AUD-091) ─────────────────────────────────────
const PREFIXES_LOCALSTORAGE_PRIVES = ['nopalou_offline_', 'nopalou_pos_', 'nopalou_bilan_', 'nopalou_plan', 'nopalou_user_id', 'nopalou_client_', CLE_MAP_IDS];

/**
 * À appeler et ATTENDRE avant toute déconnexion ou changement de compte : Cache Storage des pages et API
 * authentifiées, `localStorage` privé, catalogue/clients/caissiers/boutiques d'IndexedDB. Les files
 * d'opérations non synchronisées sont conservées (sinon perte de ventes) : elles restent filtrées par utilisateur.
 */
export async function purgerDonneesLocalesPrivees(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if ('caches' in window) {
      const noms = await caches.keys();
      await Promise.all(noms.filter((n) => /^nopalou-(api|html|rsc)-cache/.test(n)).map((n) => caches.delete(n)));
    }
  } catch {
    /* non bloquant */
  }
  try {
    const cles: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && PREFIXES_LOCALSTORAGE_PRIVES.some((p) => k.startsWith(p))) cles.push(k);
    }
    cles.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* non bloquant */
  }
  try {
    const db = await initialiserBaseLocale();
    const stores = ['produits', 'clients', 'caissiers', 'marchand_boutiques'];
    await new Promise<void>((resolve) => {
      const tx = db.transaction(stores, 'readwrite');
      stores.forEach((s) => tx.objectStore(s).clear());
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* non bloquant */
  }
}