'use client'
import { useState } from 'react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

interface Settings {
  quota_annonces_gratuit: string
  prix_annonce: string
  prix_sponsoring: string
  prix_boost: string
  boost_duree_jours: string
  plan_decouverte_label: string
  plan_decouverte_prix: string
  abonnement_essai_jours: string
  plan_pro_label: string
  plan_pro_prix: string
  plan_business_label: string
  plan_business_prix: string
  reduc_3_mois: string
  reduc_6_mois: string
  reduc_12_mois: string
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
  max_boutiques_par_compte: string
  max_boutiques_par_telephone: string
  alertes_abonnement_jours_avant: string
  alertes_abonnement_whatsapp: string
  alertes_abonnement_email: string
  contrat_vendeur_requis?: string
  contrat_vendeur_texte?: string
}

export default function TarifsClient({ initial, secret }: { initial: Settings; secret: string }) {
  const [form, setForm] = useState<Settings>(() => {
    const defaults: Settings = {
      quota_annonces_gratuit: '2',
      prix_annonce: '1500',
      prix_sponsoring: '5000',
      prix_boost: '500',
      boost_duree_jours: '7',
      plan_decouverte_label: 'Boutique Taf Taf',
      plan_decouverte_prix: '2500',
      abonnement_essai_jours: '30',
      plan_pro_label: 'Boutique Pro',
      plan_pro_prix: '5000',
      plan_business_label: 'Boutique Business',
      plan_business_prix: '10000',
      reduc_3_mois: '10',
      reduc_6_mois: '15',
      reduc_12_mois: '25',
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
      max_boutiques_par_compte: '3',
      max_boutiques_par_telephone: '3',
      alertes_abonnement_jours_avant: '7',
      alertes_abonnement_whatsapp: 'true',
      alertes_abonnement_email: 'true',
      contrat_vendeur_requis: 'true',
      contrat_vendeur_texte: '',
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

  function toggle(key: 'paiement_wave' | 'paiement_orange' | 'promo_active' | 'paiement_manuel_actif' | 'alertes_abonnement_whatsapp' | 'alertes_abonnement_email', label: string) {
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
        {field('plan_decouverte_label', 'Nom plan Taf Taf (Découverte)', 'text')}
        {field('plan_decouverte_prix', 'Prix plan Taf Taf (mensuel)', 'number', 'FCFA/mois')}
        {field('abonnement_essai_jours', 'Durée essai gratuit / 1er mois offert', 'number', 'jours')}
        <div style={{ margin: '14px 0', borderTop: '1px dashed #e5e7eb' }} />
        {field('plan_pro_label', 'Nom plan Boutique Pro', 'text')}
        {field('plan_pro_prix', 'Prix plan Boutique Pro (mensuel)', 'number', 'FCFA/mois')}
        <div style={{ margin: '14px 0', borderTop: '1px dashed #e5e7eb' }} />
        {field('plan_business_label', 'Nom plan Boutique Business', 'text')}
        {field('plan_business_prix', 'Prix plan Boutique Business (mensuel)', 'number', 'FCFA/mois')}
        {field('commission_business', 'Commission plan Boutique Business', 'number', '%')}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed #e5e7eb' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>🏷️ Réductions multi-durées engagées :</div>
          {field('reduc_3_mois', 'Réduction engagement 3 Mois', 'number', '%')}
          {field('reduc_6_mois', 'Réduction engagement 6 Mois', 'number', '%')}
          {field('reduc_12_mois', 'Réduction engagement 12 Mois (1 an)', 'number', '%')}
        </div>
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

      {card('🎁 Code promo Plateforme (Abonnements)', <>
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

      {card('🏬 Quotas et limites de création de boutiques', <>
        {field('max_boutiques_par_compte', 'Nombre max de boutiques par compte utilisateur', 'number', 'boutiques')}
        {field('max_boutiques_par_telephone', 'Nombre max de boutiques associées au même téléphone / email', 'number', 'boutiques')}
        <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
          💡 Empêche les utilisateurs de créer plus de boutiques que la limite autorisée, même en créant plusieurs comptes avec le même numéro ou e-mail.
        </p>
      </>)}

      {card('🔔 Alertes et relances d\'expiration de forfaits', <>
        {field('alertes_abonnement_jours_avant', 'Délai de première alerte avant expiration', 'number', 'jours avant')}
        {toggle('alertes_abonnement_email', 'Relance par E-mail')}
        {toggle('alertes_abonnement_whatsapp', 'Relance par WhatsApp')}
      </>)}

      {card('📜 Contrat Vendeur & Charte Marchand (CGU Dynamiques)', <>
        {toggle('contrat_vendeur_requis', 'Acceptation du contrat obligatoire lors de la création de boutique')}
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13, color: '#374151' }}>
            Texte du Contrat / CGU Marchand Nopalou :
          </label>
          <textarea
            rows={12}
            value={form.contrat_vendeur_texte ?? ''}
            onChange={e => setForm(f => ({ ...f, contrat_vendeur_texte: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', lineHeight: 1.5, resize: 'vertical' }}
          />
          <p style={{ fontSize: 12, color: '#6b7280', margin: '6px 0 0' }}>
            💡 Ce texte est affiché en direct dans la modale d'acceptation lors de la création de boutique et sur la page des CGU. Vous pouvez modifier les clauses et commissions à tout moment.
          </p>
        </div>
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

