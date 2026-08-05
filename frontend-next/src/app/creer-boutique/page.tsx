'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { setAuthCookieAction } from '@/app/actions/auth'

export default function CreerBoutiqueWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialNom = searchParams?.get('nom') || ''
  
  const [step, setStep] = useState(1)
  const [nom, setNom] = useState(initialNom)
  const [telephone, setTelephone] = useState('')
  const [code, setCode] = useState('')
  const [plan, setPlan] = useState<'decouverte' | 'pro' | 'business'>('decouverte')
  const [couleur, setCouleur] = useState('#25D366')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1 && !nom.trim()) { setError('Veuillez entrer un nom.'); return; }
    if (step === 2 && telephone.length < 9) { setError('Numéro WhatsApp invalide.'); return; }
    
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
      if (code.length < 4) { setError('Code invalide.'); return; }
      setLoading(true)
      try {
        const res = await fetch(`${BACKEND}/api/auth/whatsapp-otp-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telephone, code })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Code incorrect')
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
        body: JSON.stringify({ nom, telephone, couleur, plan })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création')
      
      // Connecter l'utilisateur (cookie session) via server action
      if (data.token) {
        await setAuthCookieAction(data.token)
      }
      
      // Rediriger vers la nouvelle boutique et l'ouvrir automatiquement
      window.location.href = `/boutique?manage=${data.boutiqueId}&bienvenue=true`
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 20 }}>
      <div style={{ background: '#fff', padding: 40, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.05)', maxWidth: 520, width: '100%' }}>
        
        {/* Barre de progression */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: step >= 1 ? '#C75B00' : '#e2e8f0' }} />
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: step >= 2 ? '#C75B00' : '#e2e8f0' }} />
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: step >= 3 ? '#C75B00' : '#e2e8f0' }} />
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: step >= 4 ? '#C75B00' : '#e2e8f0' }} />
        </div>

        {error && <p style={{ color: '#ef4444', background: '#fef2f2', padding: 12, borderRadius: 8, fontSize: 14 }}>{error}</p>}

        <form onSubmit={step < 4 ? handleNext : handleSubmit}>
          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Quel est le nom de votre boutique ou produit ?</h1>
              <p style={{ color: '#64748b', marginBottom: 24 }}>Vous pourrez le changer plus tard.</p>
              <input 
                type="text" 
                value={nom} 
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Cosmétiques Dakar, iPhone 14 Pro..." 
                autoFocus
                style={{ width: '100%', padding: '16px 20px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 18, outline: 'none' }}
              />
            </div>
          )}

          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Sur quel numéro WhatsApp gérez-vous vos clients ?</h1>
              <p style={{ color: '#64748b', marginBottom: 24 }}>Ce numéro recevra directement les commandes de vos clients.</p>
              <input 
                type="tel" 
                value={telephone} 
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex: 77 123 45 67" 
                autoFocus
                style={{ width: '100%', padding: '16px 20px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 18, outline: 'none' }}
              />
            </div>
          )}

          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Vérification de votre numéro</h1>
              <p style={{ color: '#64748b', marginBottom: 24 }}>Saisissez le code à 6 chiffres que vous venez de recevoir sur WhatsApp.</p>
              <input 
                type="text" 
                value={code} 
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456" 
                autoFocus
                maxLength={6}
                style={{ width: '100%', padding: '16px 20px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 24, outline: 'none', letterSpacing: '4px', textAlign: 'center' }}
              />
            </div>
          )}

          {step === 4 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                Choisissez votre formule & votre style
              </h1>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
                Le forfait <strong>Boutique Taf Taf (1 mois offert)</strong> est sélectionné par défaut. Vous pouvez le conserver ou faire évoluer votre offre dès maintenant.
              </p>

              {/* Sélecteur de Plan */}
              <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 8 }}>
                1. Formule d&apos;abonnement :
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[
                  { id: 'decouverte', name: '⚡ Boutique Taf Taf (1 mois offert)', price: 'Gratuit pendant 30j puis 5.000 FCFA/mois' },
                  { id: 'pro', name: '⭐ Vendeur Pro', price: '15.000 FCFA / mois' },
                  { id: 'business', name: '💼 Business VIP', price: '35.000 FCFA / mois' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlan(p.id as any)}
                    style={{
                      padding: '12px 14px', borderRadius: 10, textAlign: 'left',
                      border: plan === p.id ? '2px solid #C75B00' : '1px solid #cbd5e1',
                      background: plan === p.id ? '#fff7ed' : '#fff',
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{p.price}</div>
                    </div>
                    {plan === p.id && <span style={{ color: '#C75B00', fontWeight: 900 }}>✓</span>}
                  </button>
                ))}
              </div>

              {/* Couleur de Marque */}
              <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 8 }}>
                2. Couleur de votre boutique :
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['#C75B00', '#2563eb', '#16a34a', '#db2777', '#7c3aed', '#0f172a'].map(c => (
                  <button 
                    key={c}
                    type="button"
                    onClick={() => setCouleur(c)}
                    style={{ 
                      width: 36, height: 36, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                      boxShadow: couleur === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : 'none',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
            {step > 1 && (
              <button 
                type="button" 
                onClick={() => setStep(step - 1)}
                style={{ background: 'transparent', color: '#64748b', border: 'none', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
                disabled={loading}
              >
                ← Retour
              </button>
            )}
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                background: '#C75B00', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: 12, 
                fontWeight: 800, fontSize: 16, cursor: loading ? 'wait' : 'pointer', marginLeft: 'auto',
                boxShadow: '0 4px 12px rgba(199, 91, 0, 0.25)'
              }}
            >
              {loading ? 'Chargement...' : step === 4 ? 'Lancer ma boutique 🚀' : 'Continuer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
