import React, { useState, useTransition } from 'react'
import { Store, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { modererBoutique, activerSponsoringBoutique } from '@/app/actions/admin'
import { activerPlanTest } from '../../abonnements/actions'
import { Boutique, isSponsorActif } from './types'

interface ModalGestionMarchandProps {
  boutique: Boutique
  onClose: () => void
  onRefresh: () => void
}

export default function ModalGestionMarchand({
  boutique,
  onClose,
  onRefresh,
}: ModalGestionMarchandProps) {
  const [pending, startTransition] = useTransition()
  const [planSelect, setPlanSelect] = useState<'pro' | 'business'>(boutique.plan_actif || 'pro')
  const [joursSelect, setJoursSelect] = useState<number>(30)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const sponsorActif = isSponsorActif(boutique)

  async function handleActiverPlan() {
    if (!boutique.proprietaire_email) {
      setMsg({ type: 'err', text: 'Email propriétaire manquant' })
      return
    }
    setMsg(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('email', boutique.proprietaire_email!)
      fd.append('plan', planSelect)
      fd.append('jours', String(joursSelect))

      const res = await activerPlanTest({}, fd)
      if (res.error) {
        setMsg({ type: 'err', text: res.error })
      } else {
        setMsg({ type: 'ok', text: res.info || 'Plan activé avec succès !' })
        setTimeout(() => {
          onRefresh()
          onClose()
        }, 1200)
      }
    })
  }

  function handleToggleSponsor() {
    startTransition(async () => {
      await activerSponsoringBoutique(boutique.id, !sponsorActif)
      onRefresh()
      onClose()
    })
  }

  function handleToggleActif() {
    startTransition(async () => {
      await modererBoutique(boutique.id, !boutique.actif)
      onRefresh()
      onClose()
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 540,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid var(--border, #e2e8f0)',
          fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            background:
              boutique.plan_actif === 'business'
                ? '#1e3a5f'
                : boutique.plan_actif === 'pro'
                  ? 'var(--accent, #C75B00)'
                  : 'var(--navy, #0f172a)',
            color: '#fff',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Store size={26} />
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{boutique.nom}</h3>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>
                {boutique.proprietaire_nom || 'Propriétaire'} ({boutique.proprietaire_email || 'sans email'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
          {msg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                marginBottom: 20,
                fontSize: 13,
                fontWeight: 600,
                background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2',
                color: msg.type === 'ok' ? '#166534' : '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {msg.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {msg.text}
            </div>
          )}

          {/* Section Plan & Attribution */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: 14,
              padding: 18,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#334155',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 12,
              }}
            >
              Activation / Changement d&apos;Abonnement
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                  Formule :
                </label>
                <select
                  value={planSelect}
                  onChange={e => setPlanSelect(e.target.value as 'pro' | 'business')}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <option value="pro">Pro (5 000 FCFA/mois)</option>
                  <option value="business">Business (10 000 FCFA/mois)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                  Durée engagée :
                </label>
                <select
                  value={joursSelect}
                  onChange={e => setJoursSelect(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <option value={30}>1 Mois (30j)</option>
                  <option value={90}>3 Mois (90j — 10% reduc)</option>
                  <option value={180}>6 Mois (180j — 15% reduc)</option>
                  <option value={365}>1 An (365j — 25% reduc)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleActiverPlan}
              disabled={pending}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 800,
                background: planSelect === 'business' ? '#1e3a5f' : 'var(--accent, #C75B00)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                opacity: pending ? 0.7 : 1,
              }}
            >
              {pending ? 'Activation en cours…' : `Accorder l'Abonnement ${planSelect.toUpperCase()}`}
            </button>
          </div>

          {/* Section Modération Rapide */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button
              type="button"
              onClick={handleToggleSponsor}
              disabled={pending}
              style={{
                padding: '10px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                background: sponsorActif ? '#fee2e2' : '#fef3c7',
                color: sponsorActif ? '#991b1b' : '#92400e',
                cursor: 'pointer',
              }}
            >
              {sponsorActif ? 'Enlever Sponsoring' : 'Mettre en Sponsoring'}
            </button>

            <button
              type="button"
              onClick={handleToggleActif}
              disabled={pending}
              style={{
                padding: '10px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                background: boutique.actif ? '#fee2e2' : '#dcfce7',
                color: boutique.actif ? '#991b1b' : '#166534',
                cursor: 'pointer',
              }}
            >
              {boutique.actif ? 'Désactiver Boutique' : 'Réactiver Boutique'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
