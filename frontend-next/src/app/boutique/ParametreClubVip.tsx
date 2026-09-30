'use client'

import React, { useEffect, useState } from 'react'
import { Award, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

// Réglage « Club VIP » : le marchand décide d'offrir (et de financer) une remise sur la livraison à ses clients fidèles,
// et définit lui-même ses paliers (seuils, montants, portée du comptage). Validé et appliqué côté serveur.

interface PalierForm {
  nom: string
  min_commandes: string
  min_depense: string
  mode: 'montant' | 'offerte'
  remise_fcfa: string
}

interface ConfigServeur {
  portee: 'plateforme' | 'boutique'
  paliers: { nom: string; min_commandes: number; min_depense: number | null; remise_fcfa: number; livraison_offerte: boolean }[]
}

const versForm = (c: ConfigServeur): { portee: 'plateforme' | 'boutique'; paliers: PalierForm[] } => ({
  portee: c.portee,
  paliers: c.paliers.map((p) => ({
    nom: p.nom,
    min_commandes: String(p.min_commandes),
    min_depense: p.min_depense === null ? '' : String(p.min_depense),
    mode: p.livraison_offerte ? 'offerte' : 'montant',
    remise_fcfa: String(p.remise_fcfa || ''),
  })),
})

const versServeur = (portee: string, paliers: PalierForm[]) => ({
  portee,
  paliers: paliers.map((p) => ({
    nom: p.nom.trim(),
    min_commandes: Number(p.min_commandes),
    min_depense: p.min_depense.trim() === '' ? null : Number(p.min_depense),
    livraison_offerte: p.mode === 'offerte',
    remise_fcfa: p.remise_fcfa.trim() === '' ? 0 : Number(p.remise_fcfa),
  })),
})

const champ: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8,
  border: '1px solid var(--border, #E8DDD2)', fontSize: 13, background: '#ffffff', minWidth: 0,
}
const etiquette: React.CSSProperties = { fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }

export default function ParametreClubVip({ boutiqueId }: { boutiqueId: string }) {
  const { toast } = useToast()
  const [actif, setActif] = useState(false)
  const [portee, setPortee] = useState<'plateforme' | 'boutique'>('plateforme')
  const [paliers, setPaliers] = useState<PalierForm[]>([])
  const [defaut, setDefaut] = useState<ConfigServeur | null>(null)
  const [maxPaliers, setMaxPaliers] = useState(6)
  const [chargement, setChargement] = useState(true)
  const [envoi, setEnvoi] = useState(false)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  const entetes = (): Record<string, string> => {
    const token = localStorage.getItem('token') || localStorage.getItem('nopalou_token') || ''
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  }

  useEffect(() => {
    let vivant = true
    fetch(`${backendUrl}/api/boutiques/${boutiqueId}/club-vip`, { headers: entetes() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!vivant || !d) return
        setActif(d.actif === true)
        const f = versForm(d.config)
        setPortee(f.portee)
        setPaliers(f.paliers)
        setDefaut(d.defaut)
        if (d.max_paliers) setMaxPaliers(d.max_paliers)
      })
      .catch(() => {})
      .finally(() => { if (vivant) setChargement(false) })
    return () => { vivant = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boutiqueId, backendUrl])

  const envoyer = async (corps: Record<string, unknown>, succes: string) => {
    setEnvoi(true)
    try {
      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/club-vip`, {
        method: 'PUT',
        headers: entetes(),
        body: JSON.stringify(corps),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour')
      setActif(data.actif === true)
      const f = versForm(data.config)
      setPortee(f.portee)
      setPaliers(f.paliers)
      toast({ type: 'success', message: succes })
    } catch (err: any) {
      toast({ type: 'error', message: err.message })
    } finally {
      setEnvoi(false)
    }
  }

  const modifier = (i: number, patch: Partial<PalierForm>) =>
    setPaliers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))

  return (
    <div
      style={{
        width: '100%', boxSizing: 'border-box', marginBottom: 16, padding: '14px 16px',
        border: '1px solid var(--border, #E8DDD2)', borderRadius: 12, background: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <Award size={18} color="var(--accent, #C75B00)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--navy, #1C2B4A)' }}>Remise Club VIP sur la livraison</div>
          <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4, lineHeight: 1.45 }}>
            Vos clients fidèles paient moins cher leur livraison selon les paliers que vous définissez.{' '}
            <strong>Cette remise est déduite de votre encaissement.</strong> Désactivée par défaut.
          </div>
        </div>
        <button
          type="button"
          onClick={() => envoyer({ actif: !actif }, !actif ? 'Remise Club VIP activée sur votre boutique.' : 'Remise Club VIP désactivée.')}
          disabled={chargement || envoi}
          aria-pressed={actif}
          className="btn-npl"
          style={{
            flexShrink: 0, whiteSpace: 'nowrap', padding: '9px 16px', borderRadius: 10, fontWeight: 800, fontSize: 13,
            cursor: chargement || envoi ? 'default' : 'pointer', border: '1.5px solid var(--accent, #C75B00)',
            background: actif ? 'var(--accent, #C75B00)' : '#ffffff', color: actif ? '#ffffff' : 'var(--accent, #C75B00)',
          }}
        >
          {chargement ? '…' : actif ? 'Activée — désactiver' : 'Activer'}
        </button>
      </div>

      {!chargement && (
        <div style={{ marginTop: 14, borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: 14 }}>
          <div style={{ maxWidth: 420, marginBottom: 12 }}>
            <label style={etiquette} htmlFor="club-vip-portee">Commandes prises en compte</label>
            <select id="club-vip-portee" style={champ} value={portee} onChange={(e) => setPortee(e.target.value as 'plateforme' | 'boutique')}>
              <option value="plateforme">Toutes les commandes du client sur Nopalou</option>
              <option value="boutique">Seulement ses commandes dans ma boutique</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {paliers.map((p, i) => (
              <div
                key={i}
                style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, alignItems: 'end',
                  padding: 10, border: '1px solid var(--border, #E8DDD2)', borderRadius: 10, background: '#FBF9F6',
                }}
              >
                <div>
                  <label style={etiquette}>Nom du palier</label>
                  <input style={champ} value={p.nom} maxLength={40} onChange={(e) => modifier(i, { nom: e.target.value })} />
                </div>
                <div>
                  <label style={etiquette}>Dès … commandes</label>
                  <input style={champ} type="number" min={1} value={p.min_commandes} onChange={(e) => modifier(i, { min_commandes: e.target.value })} />
                </div>
                <div>
                  <label style={etiquette}>ou dès … FCFA dépensés</label>
                  <input style={champ} type="number" min={1} placeholder="facultatif" value={p.min_depense} onChange={(e) => modifier(i, { min_depense: e.target.value })} />
                </div>
                <div>
                  <label style={etiquette}>Avantage</label>
                  <select style={champ} value={p.mode} onChange={(e) => modifier(i, { mode: e.target.value as 'montant' | 'offerte' })}>
                    <option value="montant">Remise en FCFA</option>
                    <option value="offerte">Livraison offerte</option>
                  </select>
                </div>
                <div>
                  <label style={etiquette}>{p.mode === 'offerte' ? 'Plafond FCFA (facultatif)' : 'Remise en FCFA'}</label>
                  <input style={champ} type="number" min={0} value={p.remise_fcfa} onChange={(e) => modifier(i, { remise_fcfa: e.target.value })} />
                </div>
                <button
                  type="button"
                  onClick={() => setPaliers((prev) => prev.filter((_, idx) => idx !== i))}
                  disabled={paliers.length <= 1}
                  aria-label={`Supprimer le palier ${p.nom}`}
                  style={{ justifySelf: 'start', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', background: '#ffffff', cursor: paliers.length <= 1 ? 'default' : 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <button
              type="button"
              disabled={paliers.length >= maxPaliers}
              onClick={() => setPaliers((prev) => [...prev, { nom: `Palier ${prev.length + 1}`, min_commandes: '3', min_depense: '', mode: 'montant', remise_fcfa: '500' }])}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', background: '#ffffff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              <Plus size={14} /> Ajouter un palier
            </button>
            {defaut && (
              <button
                type="button"
                onClick={() => { const f = versForm(defaut); setPortee(f.portee); setPaliers(f.paliers) }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', background: '#ffffff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                <RotateCcw size={14} /> Valeurs par défaut
              </button>
            )}
            <button
              type="button"
              className="btn-npl"
              disabled={envoi}
              onClick={() => envoyer({ config: versServeur(portee, paliers) }, 'Paliers Club VIP enregistrés.')}
              style={{ marginLeft: 'auto', padding: '9px 16px', borderRadius: 10, fontWeight: 800, fontSize: 13, border: 'none', background: 'var(--navy, #1C2B4A)', color: '#ffffff', cursor: envoi ? 'default' : 'pointer' }}
            >
              Enregistrer les paliers
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
