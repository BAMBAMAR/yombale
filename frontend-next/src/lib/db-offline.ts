/**
 * Service de base de données locale (IndexedDB) pour la caisse enregistreuse POS en mode offline.
 */

const DB_NAME = 'nopalou_pos_offline';
const DB_VERSION = 2;

export interface OfflineSale {
  id_temporaire: string;
  boutique_id: string;
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
}

export function initialiserBaseLocale(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('IndexedDB n\'est pas disponible côté serveur'));
    }
    
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Erreur d\'ouverture de IndexedDB');
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Stockage produits du catalogue
      if (!db.objectStoreNames.contains('produits')) {
        db.createObjectStore('produits', { keyPath: 'id' });
      }
      
      // Stockage clients isolé par boutique. La version 1 utilisait l'id client
      // comme clé globale et écrasait le carnet d'une autre boutique.
      if (db.objectStoreNames.contains('clients')) {
        db.deleteObjectStore('clients');
      }
      db.createObjectStore('clients', { keyPath: 'cache_key' });
      
      // File d'attente des ventes offline
      if (!db.objectStoreNames.contains('ventes_queue')) {
        db.createObjectStore('ventes_queue', { keyPath: 'id_temporaire' });
      }
    };
  });
}

// --- CATALOGUE PRODUITS ---

export async function sauvegarderProduitsLocaux(produits: any[], boutiqueId?: string): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('produits', 'readwrite');
    const store = tx.objectStore('produits');
    
    const getAllReq = store.getAll();
    getAllReq.onsuccess = () => {
      const existing: any[] = getAllReq.result || [];
      if (boutiqueId) {
        existing.forEach(item => {
          if (item.boutique_id === boutiqueId) {
            store.delete(item.id);
          }
        });
      } else {
        store.clear();
      }

      produits.forEach(p => {
        const itemToSave = boutiqueId ? { ...p, boutique_id: boutiqueId } : p;
        store.put(itemToSave);
      });
    };

    getAllReq.onerror = () => {
      if (!boutiqueId) store.clear();
      produits.forEach(p => store.put(p));
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function obtenirProduitsLocaux(boutiqueId?: string): Promise<any[]> {
  const db = await initialiserBaseLocale();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('produits', 'readonly');
    const store = tx.objectStore('produits');
    const request = store.getAll();

    request.onsuccess = () => {
      const results: any[] = request.result || [];
      if (boutiqueId) {
        const filtered = results.filter(p => !p.boutique_id || p.boutique_id === boutiqueId);
        resolve(filtered);
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// --- CLIENTS ---

export async function sauvegarderClientsLocaux(clients: any[], boutiqueId: string): Promise<void> {
  if (!boutiqueId) return;
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('clients', 'readwrite');
    const store = tx.objectStore('clients');
    
    const existing = store.getAll();
    existing.onsuccess = () => {
      (existing.result || []).forEach((client: any) => {
        if (client.boutique_id === boutiqueId) store.delete(client.cache_key);
      });
      clients.forEach(c => {
        store.put({ ...c, boutique_id: boutiqueId, cache_key: `${boutiqueId}:${c.id}` });
      });
    };
    existing.onerror = () => {
      clients.forEach(c => {
        store.put({ ...c, boutique_id: boutiqueId, cache_key: `${boutiqueId}:${c.id}` });
      });
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function obtenirClientsLocaux(boutiqueId: string): Promise<any[]> {
  if (!boutiqueId) return [];
  const db = await initialiserBaseLocale();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('clients', 'readonly');
    const store = tx.objectStore('clients');
    const request = store.getAll();

    request.onsuccess = () => resolve((request.result || [])
      .filter((client: any) => client.boutique_id === boutiqueId)
      .map(({ cache_key, boutique_id, ...client }: any) => client));
    request.onerror = () => reject(request.error);
  });
}

// --- SYNCHRONISATION DES VENTES HORS-LIGNE ---

export async function ajouterVenteHorsLigne(vente: OfflineSale): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('ventes_queue', 'readwrite');
    const store = tx.objectStore('ventes_queue');
    store.put(vente);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function obtenirVentesHorsLigne(): Promise<OfflineSale[]> {
  const db = await initialiserBaseLocale();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ventes_queue', 'readonly');
    const store = tx.objectStore('ventes_queue');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

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

export async function viderVentesHorsLigne(): Promise<void> {
  const db = await initialiserBaseLocale();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('ventes_queue', 'readwrite');
    const store = tx.objectStore('ventes_queue');
    store.clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
