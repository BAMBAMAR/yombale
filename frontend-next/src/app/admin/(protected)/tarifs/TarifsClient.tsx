'use client'
import { useState } from 'react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

interface Settings {
  quota_annonces_gratuit: string
  prix_annonce: string
  prix_sponsoring: string
  prix_boost: string
  boost_duree_jours: string
  plan_pro_prix: string
  plan_business_prix: string
  plan_pro_label: string
  plan_business_label: string
  commission_business: string
  paiement_wave: string
  paiement_orange: string
  promo_active: string
  promo_code: string
  promo_reduction: string
  promo_expiry: string
  paiement_manuel_actif: string
  paiement_manuel_numero_wave: string
  paiement_manuel_numero_om: string
}

export default function TarifsClient({ initial, secret }: { initial: Settings; secret: string }) {
  const [form, setForm] = useState<Settings>(() => {
    const defaults: Settings = {
      quota_annonces_gratuit: '2',
      prix_annonce: '1500',
      prix_sponsoring: '5000',
      prix_boost: '500',
      boost_duree_jours: '7',
      plan_pro_prix: '15000',
      plan_business_prix: '35000',
      plan_pro_label: 'Boutique Pro',
      plan_business_label: 'Boutique Business',
      commission_business: '2.0',
      paiement_wave: 'true',
      paiement_orange: 'true',
      promo_active: 'false',
      promo_code: '',
      promo_reduction: '0',
      promo_expiry: '',
      paiement_manuel_actif: 'true',
      paiement_manuel_numero_wave: '',
      paiement_manuel_numero_om: '',
    }
    return { ...defaults, ...initial }
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function field(key: keyof Settings, label: string, type = 'text', suffix = '') {
    return (
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13, color: '#374151' }}>
          {label}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type={type}
            value={form[key] ?? ''}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 180 }}
          />
          {suffix && <span style={{ color: '#6b7280', fontSize: 13 }}>{suffix}</span>}
        </div>
      </div>
    )
  }

  function toggle(key: 'paiement_wave' | 'paiement_orange' | 'promo_active' | 'paiement_manuel_actif', label: string) {
    const on = form[key] === 'true'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <button
          onClick={() => setForm(f => ({ ...f, [key]: on ? 'false' : 'true' }))}
          style={{
            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: on ? '#16a34a' : '#d1d5db', position: 'relative', transition: 'background .2s',
          }}
        >
          <span style={{
            position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18,
            borderRadius: '50%', background: '#fff', transition: 'left .2s',
          }} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{label} — <strong style={{ color: on ? '#16a34a' : '#dc2626' }}>{on ? 'Activé' : 'Désactivé'}</strong></span>
      </div>
    )
  }

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      const r = await fetch(`/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
        body: JSON.stringify(form),
      })
      const data = await r.json()
      if (r.ok) setMsg({ type: 'ok', text: `${Object.keys(data.updated || {}).length} paramètre(s) sauvegardé(s) ✓` })
      else setMsg({ type: 'err', text: data.error || 'Erreur' })
    } catch {
      setMsg({ type: 'err', text: 'Erreur réseau' })
    } finally { setSaving(false) }
  }

  const card = (title: string, children: React.ReactNode) => (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: '#111827', borderBottom: '1px solid #f3f4f6', paddingBottom: 10 }}>{title}</h3>
      {children}
    </div>
  )

  return (
    <div style={{ maxWidth: 720 }}>
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14, fontWeight: 600,
          background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'ok' ? '#166534' : '#991b1b' }}>
          {msg.text}
        </div>
      )}

      {card('💰 Prix et quotas des annonces', <>
        {field('quota_annonces_gratuit', 'Quota d\'annonces gratuites par compte', 'number', 'annonces')}
        {field('prix_annonce', 'Publication annonce classifiée', 'number', 'FCFA')}
        {field('prix_sponsoring', 'Mise en avant (immo / boutique / produit) — 30j', 'number', 'FCFA')}
        {field('prix_boost', 'Boost annonce urgence', 'number', 'FCFA')}
        {field('boost_duree_jours', 'Durée du boost', 'number', 'jours')}
      </>)}

      {card('📦 Plans d\'abonnement boutiques', <>
        {field('plan_pro_label', 'Nom plan Pro', 'text')}
        {field('plan_pro_prix', 'Prix plan Pro', 'number', 'FCFA/mois')}
        {field('plan_business_label', 'Nom plan Business', 'text')}
        {field('plan_business_prix', 'Prix plan Business', 'number', 'FCFA/mois')}
        {field('commission_business', 'Commission plan Business', 'number', '%')}
      </>)}

      {card('💳 Méthodes de paiement', <>
        {toggle('paiement_wave', 'Wave Senegal')}
        {toggle('paiement_orange', 'Orange Money')}
      </>)}

      {card('🧾 Paiement manuel (dépôt Wave/Orange)', <>
        {toggle('paiement_manuel_actif', 'Paiement manuel activé')}
        {field('paiement_manuel_numero_wave', 'Numéro Wave pour dépôt', 'text')}
        {field('paiement_manuel_numero_om', 'Numéro Orange Money pour dépôt', 'text')}
      </>)}

      {card('🎁 Code promo', <>
        {toggle('promo_active', 'Promotion active')}
        {field('promo_code', 'Code promo (ex: NOPALOU25)', 'text')}
        {field('promo_reduction', 'Réduction', 'number', '%')}
        {field('promo_expiry', 'Expiration (YYYY-MM-DD)', 'date')}
        {form.promo_active === 'true' && form.promo_code && (
          <div style={{ padding: '10px 14px', background: '#fef9c3', borderRadius: 8, fontSize: 13, color: '#854d0e', marginTop: 8 }}>
            ⚠️ Code actif : <strong>{form.promo_code}</strong> — {form.promo_reduction}% de réduction
            {form.promo_expiry ? ` jusqu'au ${form.promo_expiry}` : ''}
          </div>
        )}
      </>)}

      <button
        onClick={save}
        disabled={saving}
        style={{ padding: '12px 32px', background: saving ? '#9ca3af' : '#ff6600', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
      >
        {saving ? 'Sauvegarde...' : 'Sauvegarder les tarifs'}
      </button>
    </div>
  )
}
