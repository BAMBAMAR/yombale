'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { setAuthCookieAction } from '@/app/actions/auth'

export default function CreerBoutiqueWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialNom = searchParams?.get('nom') || ''
  const initialPlanParam = searchParams?.get('plan')
  const initialPlan = ['decouverte', 'pro', 'business'].includes(initialPlanParam || '')
    ? (initialPlanParam as 'decouverte' | 'pro' | 'business')
    : 'decouverte'

  const [step, setStep] = useState(1)
  const [nom, setNom] = useState(initialNom)
  const [telephone, setTelephone] = useState('')
  const [code, setCode] = useState('')
  const [plan, setPlan] = useState<'decouverte' | 'pro' | 'business'>(initialPlan)
  const [categorie, setCategorie] = useState('Mode & Vêtements')
  const [couleur, setCouleur] = useState('#C75B00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [plansConfig, setPlansConfig] = useState({
    decouverte: {
      name: 'Boutique Taf Taf',
      badge: '⚡ 1 MOIS OFFERT',
      priceMain: '0 FCFA',
      priceSub: 'pendant 30j puis 5.000 FCFA/mois',
      desc: 'Idéal pour débuter et vendre directement sur WhatsApp.',
      features: ['Catalogue illimité', 'Ventes WhatsApp 1-clic', 'Paiement Wave & OM'],
      color: '#10b981',
      bgLight: '#ecfdf5',
    },
    pro: {
      name: 'Vendeur Pro',
      badge: '⭐ POPULAIRE',
      priceMain: '0 FCFA',
      priceSub: 'pendant 30j puis 15.000 FCFA/mois',
      desc: 'Pour les commerces voulant être en tête des recherches.',
      features: ['Badge Pro Certifié ⭐', 'Référencement prioritaire', 'Caisse POS & Reçus PDF'],
      color: '#C75B00',
      bgLight: '#fff7ed',
    },
    business: {
      name: 'Business VIP',
      badge: '👑 MULTI-SITES & API',
      priceMain: '0 FCFA',
      priceSub: 'pendant 30j puis 35.000 FCFA/mois',
      desc: 'Solution complète pour chaînes, grossistes & marques.',
      features: ['Multi-Caissiers & Magasins', 'Clés API & Webhooks', 'Relances WhatsApp Auto'],
      color: '#1e3a5f',
      bgLight: '#f0f9ff',
    }
  })

  useEffect(() => {
    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
    fetch(`${BACKEND}/api/settings/public`)
      .then(res => res.json())
      .then(settings => {
        if (!settings) return;
        const pxDecouverte = Number(settings.plan_decouverte_prix) || 2500;
        const pxPro = Number(settings.plan_pro_prix) || 5000;
        const pxBusiness = Number(settings.plan_business_prix) || 10000;
        const essaiJours = settings.abonnement_essai_jours || '30';

        setPlansConfig({
          decouverte: {
            name: settings.plan_decouverte_label || 'Boutique Taf Taf',
            badge: `⚡ ${essaiJours}J OFFERTS`,
            priceMain: '0 FCFA',
            priceSub: `pendant ${essaiJours}j puis ${pxDecouverte.toLocaleString('fr-FR')} FCFA/mois`,
            desc: 'Idéal pour débuter et vendre directement sur WhatsApp.',
            features: ['Catalogue illimité', 'Ventes WhatsApp 1-clic', 'Paiement Wave & OM'],
            color: '#10b981',
            bgLight: '#ecfdf5',
          },
          pro: {
            name: settings.plan_pro_label || 'Vendeur Pro',
            badge: '⭐ POPULAIRE',
            priceMain: '0 FCFA',
            priceSub: `pendant ${essaiJours}j puis ${pxPro.toLocaleString('fr-FR')} FCFA/mois`,
            desc: 'Pour les commerces voulant être en tête des recherches.',
            features: ['Badge Pro Certifié ⭐', 'Référencement prioritaire', 'Caisse POS & Reçus PDF'],
            color: '#C75B00',
            bgLight: '#fff7ed',
          },
          business: {
            name: settings.plan_business_label || 'Business VIP',
            badge: '👑 MULTI-SITES & API',
            priceMain: '0 FCFA',
            priceSub: `pendant ${essaiJours}j puis ${pxBusiness.toLocaleString('fr-FR')} FCFA/mois`,
            desc: 'Solution complète pour chaînes, grossistes & marques.',
            features: ['Multi-Caissiers & Magasins', 'Clés API & Webhooks', 'Relances WhatsApp Auto'],
            color: '#1e3a5f',
            bgLight: '#f0f9ff',
          }
        })
      })
      .catch(() => {})
  }, [])

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1 && !nom.trim()) { setError('Veuillez entrer le nom de votre boutique.'); return; }
    if (step === 2 && telephone.replace(/\D/g, '').length < 9) { setError('Veuillez saisir un numéro WhatsApp valide (ex: 77 123 45 67).'); return; }
    
    setError('')
    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

    if (step === 2) {
      setLoading(true)
      try {
        const res = await fetch(`${BACKEND}/api/auth/whatsapp-otp-send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telephone })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'envoi du code')
        setStep(3)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
      return
    }

    if (step === 3) {
      if (code.length < 4) { setError('Veuillez saisir le code à 6 chiffres.'); return; }
      setLoading(true)
      try {
        const res = await fetch(`${BACKEND}/api/auth/whatsapp-otp-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telephone, code })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Code de vérification incorrect.')
        setStep(4)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
      return
    }

    setStep(step + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
      const res = await fetch(`${BACKEND}/api/boutiques/taf-taf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, telephone, couleur, plan, categorie })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création de la boutique.')
      
      if (data.token) {
        await setAuthCookieAction(data.token)
      }
      
      window.location.href = `/boutique?manage=${data.boutiqueId}&bienvenue=true`
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const fontStyle = { fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 0%, #fff7ed 0%, #f8fafc 60%, #f1f5f9 100%)',
      padding: '32px 16px', ...fontStyle
    }}>
      <div style={{
        background: '#ffffff', padding: step === 4 ? '40px 32px' : '44px 36px',
        borderRadius: 28, boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)',
        maxWidth: step === 4 ? 760 : 540, width: '100%', transition: 'all 0.3s ease-in-out'
      }}>
        
        {/* En-tête & Barre de progression */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#C75B00', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Étape {step} sur 4
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>
              {step === 1 ? 'Identité' : step === 2 ? 'Contact' : step === 3 ? 'Vérification' : 'Formule & Style'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s}
                style={{
                  flex: 1, height: 8, borderRadius: 4,
                  background: step >= s ? 'linear-gradient(90deg, #FF6600 0%, #C75B00 100%)' : '#e2e8f0',
                  boxShadow: step >= s ? '0 2px 8px rgba(199, 91, 0, 0.3)' : 'none',
                  transition: 'all 0.3s ease'
                }} 
              />
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1.5px solid #fecaca', color: '#dc2626',
            padding: '14px 18px', borderRadius: 14, fontSize: 14, fontWeight: 700,
            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={step < 4 ? handleNext : handleSubmit}>

          {/* ÉTAPE 1 : Nom de la boutique */}
          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>
                🏪
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                Quel est le nom de votre boutique ou marque ?
              </h1>
              <p style={{ color: '#64748b', fontSize: 15, marginBottom: 28, lineHeight: 1.5 }}>
                C&apos;est le nom sous lequel vos clients vous reconnaîtront. Vous pourrez le modifier à tout moment.
              </p>
              
              <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 8 }}>
                Nom commercial :
              </label>
              <input 
                type="text" 
                value={nom} 
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Teranga Shopping, Cosmétiques Dakar..." 
                autoFocus
                style={{
                  width: '100%', padding: '18px 22px', borderRadius: 16,
                  border: '2px solid #cbd5e1', fontSize: 18, color: '#0f172a',
                  fontWeight: 700, outline: 'none', background: '#f8fafc',
                  transition: 'all 0.2s ease', ...fontStyle
                }}
              />
            </div>
          )}

          {/* ÉTAPE 2 : Numéro WhatsApp */}
          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>
                💬
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                Votre numéro WhatsApp
              </h1>
              <p style={{ color: '#64748b', fontSize: 15, marginBottom: 28, lineHeight: 1.5 }}>
                Les commandes passées sur votre vitrine arriveront directement sur ce numéro WhatsApp.
              </p>
              
              <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 8 }}>
                Numéro WhatsApp (Sénégal) :
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 800, color: '#475569' }}>
                  🇸🇳 +221
                </span>
                <input 
                  type="tel" 
                  value={telephone} 
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="77 123 45 67" 
                  autoFocus
                  style={{
                    width: '100%', padding: '18px 22px 18px 105px', borderRadius: 16,
                    border: '2px solid #cbd5e1', fontSize: 18, color: '#0f172a',
                    fontWeight: 700, outline: 'none', background: '#f8fafc',
                    transition: 'all 0.2s ease', ...fontStyle
                  }}
                />
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : Code OTP */}
          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>
                🔐
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                Vérification WhatsApp
              </h1>
              <p style={{ color: '#64748b', fontSize: 15, marginBottom: 28, lineHeight: 1.5 }}>
                Entrez le code à 6 chiffres envoyé au <strong style={{ color: '#0f172a' }}>{telephone}</strong>.
              </p>

              <input 
                type="text" 
                value={code} 
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456" 
                autoFocus
                maxLength={6}
                style={{
                  width: '100%', padding: '20px 22px', borderRadius: 16,
                  border: '2px solid #3b82f6', fontSize: 28, color: '#0f172a',
                  fontWeight: 900, outline: 'none', letterSpacing: '6px', textAlign: 'center',
                  background: '#eff6ff', ...fontStyle
                }}
              />
            </div>
          )}

          {/* ÉTAPE 4 : CHOIX DES FORFAITS ET STYLE (REDESIGN HIGH-END) */}
          {step === 4 && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <span style={{
                  background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 900,
                  padding: '6px 16px', borderRadius: 20, letterSpacing: '0.04em', textTransform: 'uppercase',
                  display: 'inline-block', marginBottom: 10
                }}>
                  🎁 1er mois 100% offert sur tous nos forfaits
                </span>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                  Choisissez votre formule & couleur
                </h1>
                <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                  Testez gratuitement pendant 30 jours sans aucun engagement bancaire.
                </p>
              </div>

              {/* GRILLE DES 3 FORFAITS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))', gap: 16, marginBottom: 28 }}>
                {(['decouverte', 'pro', 'business'] as const).map(pId => {
                  const p = plansConfig[pId]
                  const isSelected = plan === pId

                  return (
                    <div
                      key={pId}
                      onClick={() => setPlan(pId)}
                      style={{
                        padding: '20px 18px', borderRadius: 20, cursor: 'pointer',
                        border: isSelected ? `2.5px solid ${p.color}` : '1.5px solid #e2e8f0',
                        background: isSelected ? p.bgLight : '#ffffff',
                        boxShadow: isSelected ? `0 12px 28px -6px ${p.color}35` : '0 4px 12px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{
                            background: p.color, color: '#ffffff', fontSize: 10, fontWeight: 900,
                            padding: '3px 10px', borderRadius: 12, textTransform: 'uppercase', letterSpacing: '0.05em'
                          }}>
                            {p.badge}
                          </span>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            border: isSelected ? `2px solid ${p.color}` : '2px solid #cbd5e1',
                            background: isSelected ? p.color : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: 12, fontWeight: 900
                          }}>
                            {isSelected && '✓'}
                          </div>
                        </div>

                        <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
                          {p.name}
                        </h3>
                        
                        <div style={{ margin: '8px 0 12px' }}>
                          <span style={{ fontSize: 24, fontWeight: 900, color: p.color }}>
                            {p.priceMain}
                          </span>
                          <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                            {p.priceSub}
                          </p>
                        </div>

                        <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.4, margin: '0 0 14px' }}>
                          {p.desc}
                        </p>
                      </div>

                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 12 }}>
                        {p.features.map(f => (
                          <li key={f} style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: p.color, fontWeight: 900 }}>✓</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>

              {/* TYPE DE BOUTIQUE */}
              <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 18, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>
                  🛍️ Type de boutique :
                </label>
                <select 
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 12,
                    border: '2px solid #cbd5e1', fontSize: 16, color: '#0f172a',
                    fontWeight: 700, outline: 'none', background: '#ffffff',
                    ...fontStyle
                  }}
                >
                  <option value="Mode & Vêtements">Mode & Vêtements</option>
                  <option value="Électronique & High-Tech">Électronique & High-Tech</option>
                  <option value="Cosmétique & Beauté">Cosmétique & Beauté</option>
                  <option value="Alimentation & Restauration">Alimentation & Restauration</option>
                  <option value="Maison & Décoration">Maison & Décoration</option>
                  <option value="Services">Services</option>
                  <option value="Divers">Divers (Autre)</option>
                </select>
              </div>

              {/* COULEUR THÈME DE LA BOUTIQUE */}
              <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 18, border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>
                  🎨 Couleur principale de votre vitrine :
                </label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {[
                    { hex: '#C75B00', label: 'Orange Nopalou' },
                    { hex: '#2563eb', label: 'Bleu Royal' },
                    { hex: '#16a34a', label: 'Vert Émeraude' },
                    { hex: '#db2777', label: 'Rose Pop' },
                    { hex: '#7c3aed', label: 'Violet Luxe' },
                    { hex: '#0f172a', label: 'Noir Chic' }
                  ].map(c => (
                    <button 
                      key={c.hex}
                      type="button"
                      title={c.label}
                      onClick={() => setCouleur(c.hex)}
                      style={{ 
                        width: 38, height: 38, borderRadius: '50%', background: c.hex, border: 'none', cursor: 'pointer',
                        boxShadow: couleur === c.hex ? `0 0 0 3px #ffffff, 0 0 0 6px ${c.hex}` : '0 2px 6px rgba(0,0,0,0.1)',
                        transform: couleur === c.hex ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 900
                      }}
                    >
                      {couleur === c.hex && '✓'}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* BARRE D'ACTIONS PREMUM */}
          <div style={{ marginTop: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            {step > 1 ? (
              <button 
                type="button" 
                onClick={() => setStep(step - 1)}
                disabled={loading}
                style={{
                  background: '#ffffff', color: '#475569', border: '1.5px solid #cbd5e1',
                  padding: '14px 24px', borderRadius: 14, fontWeight: 800, fontSize: 15,
                  cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', ...fontStyle
                }}
              >
                ← Retour
              </button>
            ) : <div />}

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                background: step === 4 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
                color: '#ffffff', border: 'none', padding: '16px 36px', borderRadius: 16, 
                fontWeight: 900, fontSize: 17, cursor: loading ? 'wait' : 'pointer',
                boxShadow: step === 4 ? '0 10px 25px -5px rgba(16, 185, 129, 0.4)' : '0 10px 25px -5px rgba(199, 91, 0, 0.4)',
                transform: loading ? 'none' : 'translateY(0)',
                transition: 'all 0.2s ease', ...fontStyle
              }}
            >
              {loading ? 'Création en cours...' : step === 4 ? 'Lancer ma boutique 🚀' : 'Continuer →'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
