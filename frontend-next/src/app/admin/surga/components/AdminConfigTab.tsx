'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Power,
  Key,
  Lock,
  Save,
  RefreshCw,
  Info,
} from 'lucide-react'

// Réglages commerciaux de Surga : tout vient de la base (GET /api/admin/surga/reglages) et s'écrit par PUT.
// Rien n'est simulé : une valeur enregistrée ici est lue par l'application et par le paiement au plus tard 15 secondes après.

interface Reglage {
  cle: string
  type: 'booleen' | 'entier'
  groupe: string
  libelle: string
  aide: string
  min: number | null
  max: number | null
  defaut: boolean | number
  valeur: boolean | number
  personnalise: boolean
  modifie_le: string | null
  modifie_par: string | null
}

interface Fournisseur {
  id: string
  libelle: string
  etat: 'ok' | 'partiel' | 'absent' | 'eteint'
  detail: string
}

const GROUPES: { id: string; titre: string; aide: string }[] = [
  { id: 'ventes', titre: 'Ventes', aide: 'Ouvre ou ferme la souscription à tous les abonnements.' },
  { id: 'gratuit', titre: 'Ce que le gratuit donne', aide: 'Par compte. 0 réserve la fonction aux abonnés. Les écrans de l’application affichent ces chiffres.' },
  { id: 'whatsapp', titre: 'WhatsApp', aide: 'Sans effet tant que WhatsApp est éteint côté serveur.' },
]

const COULEUR_ETAT: Record<Fournisseur['etat'], string> = {
  ok: 'var(--surga-price)',
  partiel: 'var(--surga-accent)',
  absent: '#DC2626',
  eteint: 'var(--surga-text3)',
}
const LIBELLE_ETAT: Record<Fournisseur['etat'], string> = { ok: 'Prêt', partiel: 'Incomplet', absent: 'Absent', eteint: 'Éteint' }

export default function AdminConfigTab() {
  const [reglages, setReglages] = useState<Reglage[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [brouillon, setBrouillon] = useState<Record<string, boolean | number | string>>({})
  const [chargement, setChargement] = useState(true)
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false)
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  const charger = useCallback(async () => {
    setChargement(true)
    try {
      const res = await fetch('/api/admin/surga/reglages')
      const data = await res.json()
      if (data.success) {
        setReglages(data.reglages)
        setFournisseurs(data.fournisseurs || [])
        setBrouillon({})
      } else {
        setMessage({ type: 'erreur', texte: data.error || 'Impossible de charger les réglages.' })
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Impossible de charger les réglages.' })
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

  const valeurAffichee = (r: Reglage) => (r.cle in brouillon ? brouillon[r.cle] : r.valeur)
  const modifies = reglages.filter((r) => r.cle in brouillon && brouillon[r.cle] !== r.valeur)

  const enregistrer = async () => {
    if (modifies.length === 0) return
    setSauvegardeEnCours(true)
    setMessage(null)
    try {
      const patch: Record<string, boolean | number> = {}
      for (const r of modifies) {
        const v = brouillon[r.cle]
        patch[r.cle] = r.type === 'entier' ? Number(v) : (v as boolean)
      }
      const res = await fetch('/api/admin/surga/reglages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reglages: patch }),
      })
      const data = await res.json()
      if (data.success) {
        setReglages(data.reglages)
        setFournisseurs(data.fournisseurs || [])
        setBrouillon({})
        setMessage({ type: 'succes', texte: `${modifies.length} réglage(s) enregistré(s). L’application les utilise dès maintenant.` })
      } else {
        setMessage({ type: 'erreur', texte: data.error || 'Enregistrement refusé.' })
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Erreur réseau : rien n’a été enregistré.' })
    } finally {
      setSauvegardeEnCours(false)
    }
  }

  const carte: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid var(--surga-border)', padding: '20px 24px' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {message && (
        <div
          role={message.type === 'erreur' ? 'alert' : 'status'}
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            backgroundColor: message.type === 'succes' ? 'rgba(10, 92, 54, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'succes' ? 'var(--surga-price)' : '#B91C1C',
            border: `1px solid ${message.type === 'succes' ? 'rgba(10, 92, 54, 0.2)' : 'rgba(239, 68, 68, 0.25)'}`,
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {message.type === 'succes' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{message.texte}</span>
        </div>
      )}

      {/* Réglages commerciaux */}
      {GROUPES.map((g) => {
        const lignes = reglages.filter((r) => r.groupe === g.id)
        if (lignes.length === 0) return null
        return (
          <div key={g.id} style={carte}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Power size={18} color="var(--surga-navy)" />
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--surga-navy)' }}>{g.titre}</div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--surga-text3)', margin: '0 0 16px' }}>{g.aide}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {lignes.map((r) => {
                const v = valeurAffichee(r)
                const change = r.cle in brouillon && brouillon[r.cle] !== r.valeur
                const idChamp = `reglage-${r.cle}`
                return (
                  <div key={r.cle} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '12px 16px', borderRadius: 8, backgroundColor: change ? 'rgba(245, 158, 11, 0.08)' : 'var(--surga-bg)', border: change ? '1px solid var(--surga-accent)' : '1px solid var(--surga-border)' }}>
                    <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                      <label htmlFor={idChamp} style={{ fontSize: 13, fontWeight: 700, color: 'var(--surga-navy)', display: 'block' }}>{r.libelle}</label>
                      <div style={{ fontSize: 12, color: 'var(--surga-text2)', marginTop: 2 }}>{r.aide}</div>
                      <div style={{ fontSize: 11, color: 'var(--surga-text3)', marginTop: 4 }}>
                        {r.personnalise && r.modifie_le
                          ? `Modifié le ${new Date(r.modifie_le).toLocaleString('fr-FR')}${r.modifie_par ? ` par ${r.modifie_par}` : ''}`
                          : 'Valeur par défaut du produit'}
                        {' · défaut : '}{typeof r.defaut === 'boolean' ? (r.defaut ? 'oui' : 'non') : r.defaut}
                      </div>
                    </div>

                    {r.type === 'booleen' ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--surga-navy)' }}>
                        <input
                          id={idChamp}
                          type="checkbox"
                          checked={Boolean(v)}
                          onChange={(e) => setBrouillon((b) => ({ ...b, [r.cle]: e.target.checked }))}
                          style={{ width: 18, height: 18 }}
                        />
                        <span>{v ? 'Oui' : 'Non'}</span>
                      </label>
                    ) : (
                      <input
                        id={idChamp}
                        type="number"
                        inputMode="numeric"
                        min={r.min ?? undefined}
                        max={r.max ?? undefined}
                        step={1}
                        value={String(v)}
                        onChange={(e) => setBrouillon((b) => ({ ...b, [r.cle]: e.target.value === '' ? '' : Number(e.target.value) }))}
                        style={{ width: 110, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--surga-border)', fontSize: 14, fontWeight: 700 }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {chargement && reglages.length === 0 && (
        <div style={{ ...carte, fontSize: 13, color: 'var(--surga-text3)' }}>Chargement des réglages…</div>
      )}

      {/* Bouton d'enregistrement : actif seulement s'il y a un changement */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={charger}
          style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--surga-border)', backgroundColor: '#FFFFFF', color: 'var(--surga-navy)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <RefreshCw size={15} />
          <span>{modifies.length > 0 ? 'Annuler les changements' : 'Actualiser'}</span>
        </button>
        <button
          type="button"
          onClick={enregistrer}
          disabled={sauvegardeEnCours || modifies.length === 0}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: 'var(--surga-accent)', color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: modifies.length === 0 ? 'not-allowed' : 'pointer', opacity: modifies.length === 0 ? 0.55 : 1, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Save size={16} />
          <span>{sauvegardeEnCours ? 'Enregistrement...' : modifies.length > 0 ? `Enregistrer (${modifies.length})` : 'Aucun changement'}</span>
        </button>
      </div>

      {/* Fournisseurs : état réel lu côté serveur (jamais une clé) */}
      <div style={carte}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Key size={20} color="var(--surga-navy)" />
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--surga-navy)' }}>État réel des services externes</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {fournisseurs.map((f) => (
            <div key={f.id} style={{ padding: 14, borderRadius: 8, backgroundColor: 'var(--surga-bg)', border: '1px solid var(--surga-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--surga-navy)' }}>{f.libelle}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: COULEUR_ETAT[f.etat], display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                  {f.etat === 'ok' ? <CheckCircle2 size={14} /> : f.etat === 'partiel' ? <AlertTriangle size={14} /> : f.etat === 'eteint' ? <Lock size={14} /> : <XCircle size={14} />}
                  {LIBELLE_ETAT[f.etat]}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--surga-text3)', marginTop: 4 }}>{f.detail}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 14, fontSize: 12, color: 'var(--surga-text3)' }}>
          <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Les clés des services se posent chez l’hébergeur (variables d’environnement), jamais dans cette console. Cet écran n’en montre que la présence.</span>
        </div>
      </div>

      {/* Règles de conduite : fixées dans le code, pas modifiables ici */}
      <div style={carte}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--surga-navy)', marginBottom: 6 }}>Règles de conduite (fixées dans le code)</div>
        <p style={{ fontSize: 13, color: 'var(--surga-text3)', margin: '0 0 12px' }}>
          Ces règles ne se règlent pas ici : elles font partie du produit.
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--surga-text2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>Vouvoiement systématique, ton respectueux et sobre.</li>
          <li>Tout calcul est fait par un moteur déterministe, jamais par un modèle d’IA.</li>
          <li>Monnaie par défaut : FCFA ; toponymes de Dakar et des régions compris.</li>
        </ul>
      </div>
    </div>
  )
}
