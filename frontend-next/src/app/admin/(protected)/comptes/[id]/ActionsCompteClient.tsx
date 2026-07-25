'use client'
import { useState, useTransition } from 'react'
import {
  verifierEmail, renvoyerVerification, genererLienReset,
  suspendreCompte, reactiverCompte,
  marquerSupprime, restaurerCompte, purgerCompte, saveUserQuota
} from './actions'

interface Props {
  id: string
  emailVerifie: boolean
  suspendu: boolean
  supprimeLe: string | null
  anonymiseLe: string | null
  quotaAnnonces: number | null
}

const btnStyle = (bg: string, color: string, border: string) => ({
  fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8,
  background: bg, color, border: `1px solid ${border}`, cursor: 'pointer',
})

export default function ActionsCompteClient({ id, emailVerifie, suspendu, supprimeLe, anonymiseLe, quotaAnnonces }: Props) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [lienReset, setLienReset] = useState<string | null>(null)
  const [quotaVal, setQuotaVal] = useState<string>(quotaAnnonces === null || quotaAnnonces === undefined ? '' : String(quotaAnnonces))
  const [savingQuota, setSavingQuota] = useState(false)

  function flash(ok: boolean, text: string) {
    setMsg({ ok, text })
    setTimeout(() => setMsg(null), 5000)
  }

  function run(action: () => Promise<{ error?: string; info?: string; success?: boolean; lien?: string }>) {
    startTransition(async () => {
      const res = await action()
      if (res.lien) setLienReset(res.lien)
      flash(!!res.success, res.info ?? res.error ?? '…')
    })
  }

  if (anonymiseLe) {
    return (
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, fontSize: 13, color: '#6b7280' }}>
        Ce compte a été purgé (anonymisé) le {new Date(anonymiseLe).toLocaleDateString('fr-FR')}. Aucune action supplémentaire disponible.
      </div>
    )
  }

  const joursRestants = supprimeLe
    ? Math.max(0, 30 - Math.floor((Date.now() - new Date(supprimeLe).getTime()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {msg && (
        <div style={{
          fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 8,
          background: msg.ok ? '#f0fdf4' : '#fef2f2',
          color: msg.ok ? '#16a34a' : '#dc2626',
          border: `1px solid ${msg.ok ? '#bbf7d0' : '#fecaca'}`,
        }}>
          {msg.ok ? '✅' : '❌'} {msg.text}
        </div>
      )}

      {lienReset && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
          <strong>Lien de reset (à transmettre manuellement) :</strong>
          <div style={{ marginTop: 6, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 11 }}>{lienReset}</div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Support client</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!emailVerifie && (
            <button disabled={isPending} onClick={() => run(() => verifierEmail(id))} style={btnStyle('#f0fdf4', '#16a34a', '#bbf7d0')}>
              ✓ Forcer vérification email
            </button>
          )}
          {!emailVerifie && (
            <button disabled={isPending} onClick={() => run(() => renvoyerVerification(id))} style={btnStyle('#eff6ff', '#1d4ed8', '#bfdbfe')}>
              ✉️ Renvoyer email de vérification
            </button>
          )}
          <button disabled={isPending} onClick={() => run(() => genererLienReset(id))} style={btnStyle('#fffbeb', '#d97706', '#fde68a')}>
            🔑 Générer lien de reset
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Quota d&apos;annonces personnalisé</h2>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
          Laissez vide pour utiliser le quota global (hérité). Saisissez une valeur numérique (ex: 0, 5, 10) pour écraser la limite de ce compte.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="number"
            min="0"
            placeholder="Par défaut (global)"
            value={quotaVal}
            onChange={(e) => setQuotaVal(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, width: 180 }}
          />
          <button
            disabled={savingQuota || isPending}
            onClick={async () => {
              setSavingQuota(true)
              const q = quotaVal === '' ? null : parseInt(quotaVal)
              const res = await saveUserQuota(id, q)
              if (res.success) {
                flash(true, res.info ?? 'Quota mis à jour.')
              } else {
                flash(false, res.error ?? 'Erreur.')
              }
              setSavingQuota(false)
            }}
            style={{
              fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 8,
              background: '#0f172a', color: '#fff', border: 'none', cursor: 'pointer',
              opacity: (savingQuota || isPending) ? 0.7 : 1
            }}
          >
            {savingQuota ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Modération</h2>
        {suspendu ? (
          <button disabled={isPending} onClick={() => run(() => reactiverCompte(id))} style={btnStyle('#f0fdf4', '#16a34a', '#bbf7d0')}>
            ▶ Réactiver le compte
          </button>
        ) : (
          <button
            disabled={isPending}
            onClick={() => { if (confirm('Suspendre ce compte ? L\'utilisateur ne pourra plus se connecter.')) run(() => suspendreCompte(id)) }}
            style={btnStyle('#fef2f2', '#dc2626', '#fecaca')}
          >
            🚫 Suspendre le compte
          </button>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Suppression RGPD</h2>
        {!supprimeLe && (
          <button
            disabled={isPending}
            onClick={() => { if (confirm('Marquer ce compte pour suppression ? Il sera désactivé immédiatement et purgé définitivement après 30 jours (réversible pendant cette période).')) run(() => marquerSupprime(id)) }}
            style={btnStyle('#fef2f2', '#dc2626', '#fecaca')}
          >
            🗑 Marquer pour suppression
          </button>
        )}
        {supprimeLe && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, color: '#d97706', fontWeight: 600 }}>
              ⏳ Période de grâce en cours — {joursRestants} jour(s) restant(s) avant purge possible.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button disabled={isPending} onClick={() => run(() => restaurerCompte(id))} style={btnStyle('#f0fdf4', '#16a34a', '#bbf7d0')}>
                ↩ Restaurer le compte
              </button>
              <button
                disabled={isPending || (joursRestants !== null && joursRestants > 0)}
                onClick={() => {
                  if (confirm('Purger définitivement ce compte ? Cette action est IRRÉVERSIBLE : nom/email/téléphone seront anonymisés.')) {
                    if (confirm('Confirmation finale : purger DÉFINITIVEMENT ce compte ?')) run(() => purgerCompte(id))
                  }
                }}
                style={{
                  ...btnStyle('#fef2f2', '#dc2626', '#fecaca'),
                  opacity: (joursRestants !== null && joursRestants > 0) ? 0.5 : 1,
                  cursor: (joursRestants !== null && joursRestants > 0) ? 'not-allowed' : 'pointer',
                }}
              >
                ⚠ Purger définitivement
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
