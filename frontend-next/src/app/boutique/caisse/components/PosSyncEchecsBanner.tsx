'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, RotateCw, Trash2, PackageX, X } from 'lucide-react'
import {
  obtenirEntreesEchouees,
  reessayerEntreeEchouee,
  abandonnerEntreeEchouee,
  type EntreeEchouee,
} from '@/lib/db-offline'
import { syncToutBoutique } from '@/lib/sync-manager'

interface Props {
  boutiqueId: string
  userId: string
  onChange?: () => void
}

/**
 * AUD-088/089/097 : les opérations hors-ligne refusées par le serveur (abonnement expiré, validation…) ne sont
 * plus perdues en silence. Elles sont listées avec le message du serveur ; le marchand peut les renvoyer après
 * avoir régularisé la situation, ou les abandonner. Les écarts de stock constatés à la synchronisation sont
 * signalés ici jusqu'à ce qu'ils soient lus.
 */
export default function PosSyncEchecsBanner({ boutiqueId, userId, onChange }: Props) {
  const [echecs, setEchecs] = useState<EntreeEchouee[]>([])
  const [ouvert, setOuvert] = useState(false)
  const [conflits, setConflits] = useState(0)
  const [occupe, setOccupe] = useState(false)

  const rafraichir = useCallback(async () => {
    if (!boutiqueId) return
    setEchecs(await obtenirEntreesEchouees(boutiqueId).catch(() => []))
  }, [boutiqueId])

  useEffect(() => {
    rafraichir()
    const intervalle = setInterval(rafraichir, 15_000)
    const surSync = (e: Event) => {
      const d = (e as CustomEvent).detail
      if (d?.boutiqueId && d.boutiqueId !== boutiqueId) return
      if (d?.result?.conflits > 0) setConflits((n) => n + d.result.conflits)
      rafraichir()
    }
    window.addEventListener('nopalou:sync-complete', surSync)
    return () => {
      clearInterval(intervalle)
      window.removeEventListener('nopalou:sync-complete', surSync)
    }
  }, [boutiqueId, rafraichir])

  async function reessayer(e: EntreeEchouee) {
    setOccupe(true)
    try {
      await reessayerEntreeEchouee(e.file, e.id)
      await syncToutBoutique(boutiqueId, userId)
    } finally {
      setOccupe(false)
      await rafraichir()
      onChange?.()
    }
  }

  async function abandonner(e: EntreeEchouee) {
    const ok = window.confirm(`Abandonner définitivement cette opération ?\n\n${e.libelle}${e.montant ? ` — ${e.montant} FCFA` : ''}\n\nElle ne sera jamais enregistrée sur le serveur.`)
    if (!ok) return
    await abandonnerEntreeEchouee(e.file, e.id)
    await rafraichir()
    onChange?.()
  }

  if (echecs.length === 0 && conflits === 0) return null

  return (
    <div
      role="alert"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        background: 'var(--warning-bg, #FFF4E5)',
        border: '1px solid var(--accent)',
        borderRadius: 10,
        padding: '8px 12px',
        margin: '6px 0',
        fontSize: 13,
        color: 'var(--navy)',
      }}
    >
      {conflits > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
          <PackageX size={16} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <strong>{conflits} écart(s) de stock</strong> constaté(s) à la synchronisation : un article vendu hors-ligne était déjà épuisé. À recompter.
          </span>
          <button type="button" aria-label="Fermer l’alerte d’écart de stock" onClick={() => setConflits(0)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>
      )}
      {echecs.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOuvert((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'inherit', fontSize: 13, textAlign: 'left' }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>
              <strong>{echecs.length} opération(s) à traiter</strong> : refusée(s) par le serveur, non enregistrée(s).
            </span>
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{ouvert ? 'Masquer' : 'Voir'}</span>
          </button>
          {ouvert && (
            <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 6 }}>
              {echecs.map((e) => (
                <li key={`${e.file}:${e.id}`} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px' }}>
                  <div style={{ fontWeight: 700 }}>
                    {e.libelle}
                    {e.montant ? <span style={{ whiteSpace: 'nowrap' }}> — {new Intl.NumberFormat('fr-FR').format(e.montant)} FCFA</span> : null}
                  </div>
                  <div style={{ color: 'var(--danger, #B42318)' }}>{e.erreur}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button type="button" className="btn-npl" disabled={occupe} onClick={() => reessayer(e)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <RotateCw size={14} /> Renvoyer
                    </button>
                    <button type="button" className="btn-npl" onClick={() => abandonner(e)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Trash2 size={14} /> Abandonner
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
