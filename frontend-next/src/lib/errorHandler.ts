/**
 * Nopalou Unified Error & Resilience Handler
 * 
 * Remplace les "silent catches" (catch (e) { console.warn('[Nopalou:errorHandler:L4]', e); }) par une gestion contextualisée :
 * - Logging structuré avec contexte métier
 * - Notifications utilisateur (toasts / retours visuels) en cas d'échec critique
 * - Fallbacks sécurisés sans avaler les exceptions à l'aveugle
 */

export interface ErrorOptions {
  /** Affiche un message d'alerte à l'utilisateur (par défaut false pour les parsings de cache, true pour les actions) */
  notifyUser?: boolean;
  /** Niveau de sévérité du log */
  level?: 'warn' | 'error' | 'info';
  /** Message contextualisé explicite pour l'utilisateur */
  userMessage?: string;
}

/**
 * Traite une exception avec contextualisation obligatoire
 */
export function handleClientError(
  error: unknown,
  context: string,
  options: ErrorOptions = {}
): void {
  const level = options.level || 'warn';
  const errMessage = error instanceof Error ? error.message : String(error);

  // Log structuré pour faciliter le debugging
  const logPayload = `[Nopalou:${context}] ${errMessage}`;
  if (level === 'error') {
    console.error(logPayload, error);
  } else if (level === 'warn') {
    console.warn(logPayload);
  } else {
    console.info(logPayload);
  }

  // Si notification utilisateur demandée
  if (options.notifyUser) {
    const displayMsg = options.userMessage || `Une erreur est survenue lors de l'opération (${context}).`;
    if (typeof window !== 'undefined') {
      // Déclenche un événement personnalisé pouvant être écouté par un composant Toast global
      window.dispatchEvent(
        new CustomEvent('nopalou:notification', {
          detail: { type: 'error', message: displayMsg }
        })
      );
    }
  }
}

/**
 * Parsing JSON sécurisé avec fallback et warning structuré
 */
export function safeJsonParse<T>(
  raw: string | null | undefined,
  fallback: T,
  context: string = 'JSON'
): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    handleClientError(err, `safeJsonParse:${context}`, { level: 'warn' });
    return fallback;
  }
}

/**
 * Récupération sécurisée depuis localStorage / sessionStorage
 */
export function safeStorageGet<T>(
  key: string,
  fallback: T,
  storage: 'local' | 'session' = 'local'
): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const store = storage === 'local' ? window.localStorage : window.sessionStorage;
    const item = store.getItem(key);
    return safeJsonParse<T>(item, fallback, `storage:${key}`);
  } catch (err) {
    handleClientError(err, `safeStorageGet:${key}`, { level: 'warn' });
    return fallback;
  }
}

/**
 * Écriture sécurisée dans localStorage avec gestion de quota plein
 */
export function safeStorageSet(
  key: string,
  value: unknown,
  storage: 'local' | 'session' = 'local'
): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const store = storage === 'local' ? window.localStorage : window.sessionStorage;
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    store.setItem(key, serialized);
    return true;
  } catch (err) {
    handleClientError(err, `safeStorageSet:${key}`, {
      level: 'error',
      notifyUser: false,
      userMessage: 'Espace de stockage local saturé. Certaines données hors-ligne peuvent ne pas être sauvegardées.'
    });
    return false;
  }
}

/**
 * Suppression sécurisée dans le stockage
 */
export function safeStorageRemove(
  key: string,
  storage: 'local' | 'session' = 'local'
): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const store = storage === 'local' ? window.localStorage : window.sessionStorage;
    store.removeItem(key);
    return true;
  } catch (err) {
    handleClientError(err, `safeStorageRemove:${key}`, { level: 'warn' });
    return false;
  }
}
