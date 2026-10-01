'use client'

/**
 * SyncManager — synchronisation des opérations saisies hors-ligne (caisse, carnet, dépenses, commandes).
 *
 * Garanties :
 *  - Verrou par boutique, partagé entre onglets (Web Locks) : un seul cycle à la fois.
 *  - Une entrée n'est supprimée qu'après confirmation du serveur (succès ou doublon idempotent).
 *  - Erreur réseau / 5xx / 408 / 429 → l'entrée reste `pending`, nouvel essai (backoff 1 s, 2 s).
 *  - Erreur métier 4xx (abonnement expiré, validation…) → `failed` avec le message serveur : visible et
 *    traitable par le marchand, jamais rejouée en boucle silencieusement (AUD-089).
 *  - 401 (session expirée) → le cycle s'arrête, les entrées restent `pending` (AUD-089).
 *  - Entrée `syncing` dont le bail a expiré (page rechargée en plein envoi) → réclamée, renvoyée ; le
 *    serveur est idempotent (AUD-088).
 *  - Dépendances : session → clients → ventes → dettes → clôtures → dépenses → commandes ; les identifiants
 *    locaux (loc_…, cli_temp_…) sont remplacés par les identifiants serveur avant l'envoi (AUD-090, AUD-093).
 *  - Chaque opération porte la date réelle de saisie (`client_date`, AUD-096).
 */

import { useEffect, useCallback, useRef, useState } from 'react'
import {
  obtenirVentesHorsLigne,
  marquerVenteSyncing,
  supprimerVenteHorsLigne,
  revertVenteSyncing,
  obtenirDettesHorsLigne,
  marquerDetteSyncing,
  supprimerDetteHorsLigne,
  revertDetteSyncing,
  obtenirCloturesHorsLigne,
  marquerClotureSyncing,
  supprimerClotureHorsLigne,
  revertClotureSyncing,
  obtenirDepensesHorsLigne,
  marquerDepenseSyncing,
  supprimerDepenseHorsLigne,
  revertDepenseSyncing,
  obtenirNouveauxClientsHorsLigne,
  marquerNouveauClientSyncing,
  supprimerNouveauClientHorsLigne,
  revertNouveauClientSyncing,
  obtenirSessionsHorsLigne,
  marquerSessionSyncing,
  supprimerSessionHorsLigne,
  revertSessionSyncing,
  obtenirCommandesHorsLigne,
  marquerCommandeSyncing,
  supprimerCommandeHorsLigne,
  revertCommandeSyncing,
  obtenirBoutiquesLocales,
  reclamerEntreesPerimees,
  marquerEntreeEchec,
  obtenirEntreesEchouees,
  remapperReferences,
  resoudreId,
  type NomFile,
} from '@/lib/db-offline'

const MAX_RETRIES = 3
const BACKOFF_BASE_MS = 1000

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

interface Envoi {
  success: boolean
  /** Erreur transitoire : on réessaie puis on laisse l'entrée `pending`. */
  shouldRetry: boolean
  /** Session expirée : on arrête le cycle sans toucher aux entrées. */
  auth?: boolean
  error?: string
  code?: string
  data?: any
}

/** POST JSON vers une route relative ; classe la réponse en succès / transitoire / auth / erreur métier. */
async function poster(url: string, body: unknown, accepter?: (data: any) => boolean): Promise<Envoi> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json().catch(() => ({}))
    if (response.ok) {
      const ok = accepter ? accepter(data) : data.success !== false
      if (ok || data.duplicate) return { success: true, shouldRetry: false, data }
      return { success: false, shouldRetry: false, error: data.error || 'Réponse inattendue du serveur', code: data.code, data }
    }
    if (response.status === 401) return { success: false, shouldRetry: false, auth: true, error: 'Session expirée' }
    if (response.status === 408 || response.status === 429 || response.status >= 500) {
      return { success: false, shouldRetry: true, error: `Erreur serveur HTTP ${response.status}` }
    }
    return { success: false, shouldRetry: false, error: data.error || `Erreur HTTP ${response.status}`, code: data.code }
  } catch (err) {
    return { success: false, shouldRetry: true, error: err instanceof Error ? err.message : 'Erreur réseau' }
  }
}

export interface SyncResult {
  synced: number
  failed: number
  errors: Array<{ id: string; error: string }>
  /** Écarts de stock constatés à la synchronisation (vente hors-ligne d'un article épuisé entre-temps, AUD-097). */
  conflits: number
  /** Session expirée : les entrées restent en attente jusqu'à la reconnexion du compte. */
  authRequise: boolean
}

const vide = (): SyncResult => ({ synced: 0, failed: 0, errors: [], conflits: 0, authRequise: false })

interface Traitement<T extends { id_temporaire: string }> {
  file: NomFile
  lire: () => Promise<T[]>
  marquer: (id: string) => Promise<void>
  supprimer: (id: string) => Promise<void>
  revert: (id: string) => Promise<void>
  envoyer: (e: T) => Promise<Envoi>
  apres?: (e: T, r: Envoi) => Promise<void>
}

/** Traite toutes les entrées d'une file ; renvoie false si le cycle doit s'arrêter (session expirée). */
async function traiterFile<T extends { id_temporaire: string }>(t: Traitement<T>, res: SyncResult): Promise<boolean> {
  const entrees = await t.lire()
  for (const entree of entrees) {
    await t.marquer(entree.id_temporaire).catch(() => {})
    let dernier: Envoi = { success: false, shouldRetry: true, error: 'Erreur inconnue' }
    for (let tentative = 0; tentative < MAX_RETRIES; tentative++) {
      if (tentative > 0) await sleep(BACKOFF_BASE_MS * Math.pow(2, tentative - 1))
      dernier = await t.envoyer(entree)
      if (dernier.success || !dernier.shouldRetry) break
    }
    if (dernier.success) {
      if (t.apres) await t.apres(entree, dernier).catch(() => {})
      await t.supprimer(entree.id_temporaire).catch(() => {})
      res.synced++
      if (Array.isArray(dernier.data?.conflits)) res.conflits += dernier.data.conflits.length
      continue
    }
    if (dernier.auth) {
      await t.revert(entree.id_temporaire).catch(() => {})
      res.authRequise = true
      return false
    }
    if (dernier.shouldRetry) {
      await t.revert(entree.id_temporaire).catch(() => {})
    } else {
      await marquerEntreeEchec(t.file, entree.id_temporaire, dernier.error || 'Erreur inconnue', dernier.code)
    }
    res.failed++
    res.errors.push({ id: entree.id_temporaire, error: dernier.error || 'Erreur inconnue' })
  }
  return true
}

async function cycleBoutique(boutiqueId: string, userId: string): Promise<SyncResult> {
  const res = vide()
  await reclamerEntreesPerimees().catch(() => 0)

  // 1. Sessions de caisse ouvertes hors-ligne (avant leurs ventes et clôtures)
  let continuer = await traiterFile(
    {
      file: 'sessions_queue',
      lire: () => obtenirSessionsHorsLigne(boutiqueId),
      marquer: marquerSessionSyncing,
      supprimer: supprimerSessionHorsLigne,
      revert: revertSessionSyncing,
      envoyer: (s) =>
        poster(
          `/api/boutiques/${s.boutique_id}/pos-sessions/ouvrir`,
          { caissierNom: s.caissier_nom, fondDeCaisse: s.fond_caisse, caissierId: s.caissier_id || undefined, idempotency_key: s.id_temporaire, client_date: s.date },
          (d) => Boolean(d.session?.id)
        ),
      apres: async (s, r) => {
        await remapperReferences(['ventes_queue', 'clotures_queue'], 'session_id', s.id_temporaire, r.data.session.id)
      },
    },
    res
  )

  // 2. Nouveaux clients du carnet (avant les dettes et ventes qui les référencent)
  if (continuer) {
    continuer = await traiterFile(
      {
        file: 'nouveaux_clients_queue',
        lire: () => obtenirNouveauxClientsHorsLigne(boutiqueId, userId),
        marquer: marquerNouveauClientSyncing,
        supprimer: supprimerNouveauClientHorsLigne,
        revert: revertNouveauClientSyncing,
        envoyer: (c) =>
          poster(
            `/api/boutiques/${c.boutique_id}/credits-clients`,
            {
              idempotency_key: c.id_temporaire,
              nom: c.nom,
              telephone: c.telephone,
              adresse: c.adresse || undefined,
              plafond_max: c.plafond_max || undefined,
              note_client: c.note_client || undefined,
            },
            (d) => Boolean(d.client?.id)
          ),
        apres: async (c, r) => {
          await remapperReferences(['dettes_queue', 'ventes_queue'], 'client_id', c.id_temporaire, r.data.client.id)
        },
      },
      res
    )
  }

  // 3. Ventes POS
  if (continuer) {
    continuer = await traiterFile(
      {
        file: 'ventes_queue',
        lire: () => obtenirVentesHorsLigne(boutiqueId, userId),
        marquer: marquerVenteSyncing,
        supprimer: supprimerVenteHorsLigne,
        revert: revertVenteSyncing,
        envoyer: (v) =>
          poster(`/api/boutiques/${v.boutique_id}/pos-vente`, {
            idempotency_key: v.id_temporaire,
            items: v.items,
            caissier: v.caissier,
            caissier_id: v.caissier_id || undefined,
            session_id: resoudreId(v.session_id) || undefined,
            modePaiement: v.modePaiement,
            client_id: resoudreId(v.client_id),
            total: v.total,
            client_date: v.date,
          }),
      },
      res
    )
  }

  // 4. Écritures du carnet de dettes
  if (continuer) {
    continuer = await traiterFile(
      {
        file: 'dettes_queue',
        lire: () => obtenirDettesHorsLigne(boutiqueId, userId),
        marquer: marquerDetteSyncing,
        supprimer: supprimerDetteHorsLigne,
        revert: revertDetteSyncing,
        envoyer: (d) =>
          poster(`/api/boutiques/${d.boutique_id}/credits-clients/${resoudreId(d.client_id)}/transaction`, {
            idempotency_key: d.id_temporaire,
            type: d.type,
            montant: d.montant,
            mode_paiement: d.mode_paiement || 'credit',
            note: d.note || null,
            produits: d.produits || [],
            date_echeance: d.date_echeance || null,
            relance_auto_whatsapp: d.relance_auto_whatsapp !== false,
            client_date: d.date,
          }),
      },
      res
    )
  }

  // 5. Clôtures Z
  if (continuer) {
    continuer = await traiterFile(
      {
        file: 'clotures_queue',
        lire: () => obtenirCloturesHorsLigne(boutiqueId),
        marquer: marquerClotureSyncing,
        supprimer: supprimerClotureHorsLigne,
        revert: revertClotureSyncing,
        envoyer: (c) =>
          poster(`/api/boutiques/${c.boutique_id}/pos-sessions/cloturer`, {
            sessionId: resoudreId(c.session_id),
            especesComptees: c.especes_comptees,
            detailBillets: c.detail_billets,
            ventesEspeces: c.ventes_especes,
            ventesWave: c.ventes_wave,
            ventesOrangeMoney: c.ventes_orange_money,
            ventesCarte: c.ventes_carte,
            ventesTotal: c.ventes_total,
            nbVentes: c.nb_ventes,
            caissierNom: c.caissier_nom,
            client_date: c.date,
          }),
      },
      res
    )
  }

  // 6. Dépenses
  if (continuer) {
    continuer = await traiterFile(
      {
        file: 'depenses_queue',
        lire: () => obtenirDepensesHorsLigne(boutiqueId, userId),
        marquer: marquerDepenseSyncing,
        supprimer: supprimerDepenseHorsLigne,
        revert: revertDepenseSyncing,
        envoyer: (d) =>
          poster(
            `/api/comptabilite/${d.boutique_id}/depenses`,
            {
              idempotency_key: d.id_temporaire,
              montant: d.montant,
              categorie: d.categorie,
              description: d.description || undefined,
              date_depense: d.date_depense || undefined,
            },
            (r) => Boolean(r.id || r.success)
          ),
      },
      res
    )
  }

  // 7. Commandes « WhatsApp Direct » passées hors-ligne
  if (continuer) {
    await traiterFile(
      {
        file: 'commandes_queue',
        lire: () => obtenirCommandesHorsLigne(boutiqueId),
        marquer: marquerCommandeSyncing,
        supprimer: supprimerCommandeHorsLigne,
        revert: revertCommandeSyncing,
        envoyer: (c) =>
          poster(`/api/comptabilite/${c.boutique_id}/commandes`, { ...c.payload, idempotency_key: c.id_temporaire }, (d) => Boolean(d.commande?.reference)),
        apres: async (c, r) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('nopalou:commande-synchronisee', { detail: { id_temporaire: c.id_temporaire, reference: r.data?.commande?.reference } }))
          }
        },
      },
      res
    )
  }

  return res
}

/** Un seul cycle par boutique, y compris entre onglets (Web Locks) ; repli sur le verrou local sans Web Locks. */
const verrousLocaux = new Set<string>()

export async function syncToutBoutique(boutiqueId: string, userId: string): Promise<SyncResult> {
  if (!boutiqueId || !userId) return vide()
  const nom = `nopalou-sync-${boutiqueId}`
  const locks: any = typeof navigator !== 'undefined' ? (navigator as any).locks : undefined
  if (locks?.request) {
    return locks.request(nom, { ifAvailable: true }, async (lock: any) => (lock ? cycleBoutique(boutiqueId, userId) : vide()))
  }
  if (verrousLocaux.has(nom)) return vide()
  verrousLocaux.add(nom)
  try {
    return await cycleBoutique(boutiqueId, userId)
  } finally {
    verrousLocaux.delete(nom)
  }
}

/**
 * Scanne toutes les boutiques de l'utilisateur (cache IndexedDB et files d'attente) et synchronise chacune.
 * Dispatch 'nopalou:sync-complete' pour chaque boutique ayant des éléments synchronisés, en échec ou en conflit.
 */
export async function syncToutesLesBoutiquesEnAttente(userId: string): Promise<Record<string, SyncResult>> {
  if (!userId) return {}

  const results: Record<string, SyncResult> = {}
  const ids = new Set<string>()

  try {
    const locales = await obtenirBoutiquesLocales(userId).catch(() => [])
    locales.forEach((b) => b?.id && ids.add(b.id))

    const [v, d, c, dp, nc, s, cm] = await Promise.all([
      obtenirVentesHorsLigne(undefined, userId).catch(() => []),
      obtenirDettesHorsLigne(undefined, userId).catch(() => []),
      obtenirCloturesHorsLigne().catch(() => []),
      obtenirDepensesHorsLigne(undefined, userId).catch(() => []),
      obtenirNouveauxClientsHorsLigne(undefined, userId).catch(() => []),
      obtenirSessionsHorsLigne().catch(() => []),
      obtenirCommandesHorsLigne().catch(() => []),
    ])
    for (const liste of [v, d, c, dp, nc, s, cm] as Array<Array<{ boutique_id?: string }>>) {
      liste.forEach((e) => e?.boutique_id && ids.add(e.boutique_id))
    }

    for (const bId of ids) {
      const res = await syncToutBoutique(bId, userId)
      results[bId] = res
      if (typeof window !== 'undefined' && (res.synced > 0 || res.failed > 0 || res.conflits > 0)) {
        window.dispatchEvent(new CustomEvent('nopalou:sync-complete', { detail: { boutiqueId: bId, result: res } }))
      }
      if (res.authRequise) break
    }
  } catch (err) {
    console.error('[SyncManager] Erreur synchronisation globale multi-boutiques:', err)
  }

  return results
}

// Rétrocompatibilité
export async function syncVentesBoutique(boutiqueId: string, userId: string): Promise<SyncResult> {
  return syncToutBoutique(boutiqueId, userId)
}

export interface UseSyncOfflineReturn {
  syncPending: boolean
  ventesEnAttente: number
  dettesEnAttente: number
  cloturesEnAttente: number
  depensesEnAttente: number
  nouveauxClientsEnAttente: number
  echecsEnAttente: number
  totalEnAttente: number
  lastSyncResult: SyncResult | null
  declencherSync: () => Promise<SyncResult>
  rafraichirCompteur: () => Promise<void>
}

/** Hook React : déclenche et suit la synchronisation d'une boutique (clients, sessions, POS, dettes, clôtures, dépenses, commandes). */
export function useSyncOffline(boutiqueId: string, userId: string): UseSyncOfflineReturn {
  const [syncPending, setSyncPending] = useState(false)
  const [ventesEnAttente, setVentesEnAttente] = useState(0)
  const [dettesEnAttente, setDettesEnAttente] = useState(0)
  const [cloturesEnAttente, setCloturesEnAttente] = useState(0)
  const [depensesEnAttente, setDepensesEnAttente] = useState(0)
  const [nouveauxClientsEnAttente, setNouveauxClientsEnAttente] = useState(0)
  const [echecsEnAttente, setEchecsEnAttente] = useState(0)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const rafraichirCompteur = useCallback(async () => {
    if (!boutiqueId || !userId) return
    try {
      const [ventes, dettes, clotures, depenses, nouveauxClients, echecs] = await Promise.all([
        obtenirVentesHorsLigne(boutiqueId, userId).catch(() => []),
        obtenirDettesHorsLigne(boutiqueId, userId).catch(() => []),
        obtenirCloturesHorsLigne(boutiqueId).catch(() => []),
        obtenirDepensesHorsLigne(boutiqueId, userId).catch(() => []),
        obtenirNouveauxClientsHorsLigne(boutiqueId, userId).catch(() => []),
        obtenirEntreesEchouees(boutiqueId).catch(() => []),
      ])
      if (isMounted.current) {
        setVentesEnAttente(ventes.length)
        setDettesEnAttente(dettes.length)
        setCloturesEnAttente(clotures.length)
        setDepensesEnAttente(depenses.length)
        setNouveauxClientsEnAttente(nouveauxClients.length)
        setEchecsEnAttente(echecs.length)
      }
    } catch {
      if (isMounted.current) {
        setVentesEnAttente(0)
        setDettesEnAttente(0)
        setCloturesEnAttente(0)
        setDepensesEnAttente(0)
        setNouveauxClientsEnAttente(0)
        setEchecsEnAttente(0)
      }
    }
  }, [boutiqueId, userId])

  const declencherSync = useCallback(async (): Promise<SyncResult> => {
    if (!boutiqueId || !userId) return vide()
    if (isMounted.current) setSyncPending(true)

    try {
      const result = await syncToutBoutique(boutiqueId, userId)
      if (isMounted.current) {
        setLastSyncResult(result)
        await rafraichirCompteur()
      }
      return result
    } finally {
      if (isMounted.current) setSyncPending(false)
    }
  }, [boutiqueId, userId, rafraichirCompteur])

  useEffect(() => {
    rafraichirCompteur()
  }, [rafraichirCompteur])

  return {
    syncPending,
    ventesEnAttente,
    dettesEnAttente,
    cloturesEnAttente,
    depensesEnAttente,
    nouveauxClientsEnAttente,
    echecsEnAttente,
    totalEnAttente: ventesEnAttente + dettesEnAttente + cloturesEnAttente + depensesEnAttente + nouveauxClientsEnAttente,
    lastSyncResult,
    declencherSync,
    rafraichirCompteur,
  }
}
