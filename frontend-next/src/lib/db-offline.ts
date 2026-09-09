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
const DB_VERSION = 4;

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

export function initialiserBaseLocale(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error("IndexedDB n'est pas disponible côté serveur"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("❌ 💾 [IndexedDB v4] Erreur d'ouverture d'IndexedDB:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

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

    if (boutiqueId && userId) {
      const index = store.index('by_user_boutique');
      const range = IDBKeyRange.only([userId, boutiqueId]);
      const request = index.getAll(range);
      request.onsuccess = () => {
        const list = (request.result || []).filter((v) => v.status === 'pending');
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    } else {
      const request = store.getAll();
      request.onsuccess = () => {
        const list = request.result || [];
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    }
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

export async function purgerCacheUtilisateur(userId: string): Promise<void> {
  if (!userId) return;
  const db = await initialiserBaseLocale();

  await new Promise<void>((resolve) => {
    const tx = db.transaction(['produits', 'clients'], 'readwrite');

    for (const storeName of ['produits', 'clients'] as const) {
      const store = tx.objectStore(storeName);
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          if ((cursor.value as any).user_id === userId) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    }

    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => resolve();
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

    if (boutiqueId && userId) {
      const index = store.index('by_user_boutique');
      const range = IDBKeyRange.only([userId, boutiqueId]);
      const request = index.getAll(range);
      request.onsuccess = () => {
        const list = (request.result || []).filter((v) => v.status === 'pending');
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    } else {
      const request = store.getAll();
      request.onsuccess = () => {
        const list = request.result || [];
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    }
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

