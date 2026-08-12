/**
 * Service de base de données locale (IndexedDB) pour la caisse enregistreuse POS en mode offline.
 *
 * v3 — Refonte majeure :
 *  - Isolation complète par userId + boutiqueId dans toutes les clés.
 *  - Champ `status` dans ventes_queue ('pending' | 'syncing' | 'done') pour éviter les doubles syncs.
 *  - Suppression de `viderVentesHorsLigne` (trop dangereux).
 *  - Tous les stores sont purgés lors d'une migration de version.
 */

const DB_NAME = 'nopalou_pos_offline';
const DB_VERSION = 3;

export interface OfflineSale {
  id_temporaire: string;    // UUID unique généré côté client — utilisé comme idempotency_key
  boutique_id: string;
  user_id: string;          // Isolation par utilisateur
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

export function initialiserBaseLocale(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error("IndexedDB n'est pas disponible côté serveur"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Erreur d'ouverture de IndexedDB");
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      console.log(`[DB-Offline] Migration IndexedDB v${oldVersion} → v${DB_VERSION}`);

      // ── Purge complète des anciens stores (migration propre) ──
      // v1 et v2 utilisaient des clés non isolées par userId → fuites de cache entre comptes
      if (db.objectStoreNames.contains('produits')) {
        db.deleteObjectStore('produits');
      }
      if (db.objectStoreNames.contains('clients')) {
        db.deleteObjectStore('clients');
      }
      if (db.objectStoreNames.contains('ventes_queue')) {
        db.deleteObjectStore('ventes_queue');
      }

      // ── Nouveau store produits isolé par userId + boutiqueId ──
      // cache_key = `${userId}:${boutiqueId}:${produitId}`
      const produitsStore = db.createObjectStore('produits', { keyPath: 'cache_key' });
      produitsStore.createIndex('by_boutique', ['user_id', 'boutique_id'], { unique: false });

      // ── Nouveau store clients isolé par userId + boutiqueId ──
      const clientsStore = db.createObjectStore('clients', { keyPath: 'cache_key' });
      clientsStore.createIndex('by_boutique', ['user_id', 'boutique_id'], { unique: false });

      // ── Nouveau store ventes_queue avec champ status ──
      const ventesStore = db.createObjectStore('ventes_queue', { keyPath: 'id_temporaire' });
      ventesStore.createIndex('by_boutique_status', ['boutique_id', 'status'], { unique: false });
      ventesStore.createIndex('by_user_boutique', ['user_id', 'boutique_id'], { unique: false });
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

    // Supprimer d'abord les anciens produits de cette boutique/user
    const index = store.index('by_boutique');
    const range = IDBKeyRange.only([userId, boutiqueId]);
    const cursorReq = index.openCursor(range);

    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        // Insérer les nouveaux produits
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

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
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
      // Nettoyer les champs de cache avant de retourner
      resolve(results.map(({ cache_key, user_id, boutique_id: _b, ...prod }) => prod));
    };
    request.onerror = () => reject(request.error);
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

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
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
      resolve(
        results.map(({ cache_key, user_id, boutique_id: _b, ...client }) => client)
      );
    };
    request.onerror = () => reject(request.error);
  });
}

// --- SYNCHRONISATION DES VENTES HORS-LIGNE ---

export async function ajouterVenteHorsLigne(vente: Omit<OfflineSale, 'status'>): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('ventes_queue', 'readwrite');
    const store = tx.objectStore('ventes_queue');
    store.put({ ...vente, status: 'pending' });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
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
      // Lire uniquement les ventes en attente pour cette boutique/user
      const index = store.index('by_user_boutique');
      const range = IDBKeyRange.only([userId, boutiqueId]);
      const request = index.getAll(range);
      request.onsuccess = () =>
        resolve((request.result || []).filter((v) => v.status === 'pending'));
      request.onerror = () => reject(request.error);
    } else {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    }
  });
}

/**
 * Marquer une vente comme "en cours de sync" pour éviter les doubles syncs.
 */
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

/**
 * Supprimer une vente après ACK confirmé du serveur.
 * NE PAS appeler avant d'avoir reçu success:true en réponse HTTP.
 */
export async function supprimerVenteHorsLigne(id_temporaire: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('ventes_queue', 'readwrite');
    const store = tx.objectStore('ventes_queue');
    store.delete(id_temporaire);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Remettre une vente en status 'pending' si la sync a échoué.
 */
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

/**
 * Purger le cache d'une boutique lors de la déconnexion de l'utilisateur.
 */
export async function purgerCacheUtilisateur(userId: string): Promise<void> {
  if (!userId) return;
  const db = await initialiserBaseLocale();

  await new Promise<void>((resolve) => {
    const tx = db.transaction(['produits', 'clients'], 'readwrite');

    for (const storeName of ['produits', 'clients'] as const) {
      const store = tx.objectStore(storeName);
      const index = store.index('by_boutique');
      // On ne peut pas filtrer par userId seul via l'index compound, on fait un scan
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

    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve(); // Ne pas bloquer même si erreur
  });
}
