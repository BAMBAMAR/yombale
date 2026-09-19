'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { setAuthCookieAction } from '@/app/actions/auth'
import { CATEGORIES } from '@/lib/categories'
import ModalBoutiqueCreeeSucces from './components/ModalBoutiqueCreeeSucces'
import ModalContratVendeur from './components/ModalContratVendeur'
import WizardStepPlanStyle, { PlansConfig, DEFAULT_PLANS } from './components/WizardStepPlanStyle'
import StepIdentity from './components/StepIdentity'
import StepContactVerify from './components/StepContactVerify'

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
  const [categorie, setCategorie] = useState(CATEGORIES[0]?.value || 'mixte')
  const [couleur, setCouleur] = useState('#C75B00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [contratTexte, setContratTexte] = useState<string>('')
  const [contratRequis, setContratRequis] = useState<boolean>(true)
  const [accepteContrat, setAccepteContrat] = useState<boolean>(false)
  const [showContratModal, setShowContratModal] = useState<boolean>(false)
  const [boutiqueCreee, setBoutiqueCreee] = useState<{
    id: string | number
    nom: string
    slug?: string | null
    telephone?: string
  } | null>(null)

  const [plansConfig, setPlansConfig] = useState<PlansConfig>(DEFAULT_PLANS)

  useEffect(() => {
    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
    fetch(`${BACKEND}/api/settings/public`)
      .then((res) => res.json())
      .then((settings) => {
        if (!settings) return
        const pxDecouverte = Number(settings.plan_decouverte_prix) || 2500
        const pxPro = Number(settings.plan_pro_prix) || 5000
        const pxBusiness = Number(settings.plan_business_prix) || 10000
        const essaiJours = settings.abonnement_essai_jours || '30'

        if (settings.contrat_vendeur_texte) setContratTexte(settings.contrat_vendeur_texte)
        if (settings.contrat_vendeur_requis !== undefined) {
          setContratRequis(settings.contrat_vendeur_requis === 'true')
        }

        setPlansConfig({
          decouverte: {
            name: settings.plan_decouverte_label || 'Boutique Taf Taf',
            badge: `${essaiJours}J OFFERTS`,
            priceMain: '0 FCFA',
            priceSub: `pendant ${essaiJours}j puis ${pxDecouverte.toLocaleString('fr-FR')} FCFA/mois`,
            desc: 'Idéal pour débuter et vendre directement sur WhatsApp.',
            features: ['Catalogue illimité', 'Ventes WhatsApp 1-clic', 'Paiement Wave & OM'],
            color: '#10b981',
            bgLight: '#ecfdf5',
          },
          pro: {
            name: settings.plan_pro_label || 'Vendeur Pro',
            badge: 'POPULAIRE',
            priceMain: '0 FCFA',
            priceSub: `pendant ${essaiJours}j puis ${pxPro.toLocaleString('fr-FR')} FCFA/mois`,
            desc: 'Pour les commerces voulant être en tête des recherches.',
            features: ['Badge Pro Certifié', 'Référencement prioritaire', 'Caisse POS & Reçus PDF'],
            color: '#C75B00',
            bgLight: '#fff7ed',
          },
          business: {
            name: settings.plan_business_label || 'Business VIP',
            badge: 'MULTI-SITES & API',
            priceMain: '0 FCFA',
            priceSub: `pendant ${essaiJours}j puis ${pxBusiness.toLocaleString('fr-FR')} FCFA/mois`,
            desc: 'Solution complète pour chaînes, grossistes & marques.',
            features: ['Multi-Caissiers & Magasins', 'Clés API & Webhooks', 'Relances WhatsApp Auto'],
            color: '#1e3a5f',
            bgLight: '#f0f9ff',
          },
        })
      })
      .catch(() => {})
  }, [])

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1 && !nom.trim()) {
      setError('Veuillez entrer le nom de votre boutique.')
      return
    }
    if (step === 2 && telephone.replace(/\D/g, '').length < 9) {
      setError('Veuillez saisir un numéro WhatsApp valide (ex: 77 123 45 67).')
      return
    }
    if (step === 4 && contratRequis && !accepteContrat) {
      setError('Veuillez cocher la case d\'acceptation de la Charte Vendeur & des CGU Marchand pour créer votre boutique.')
      return
    }

    setError('')
    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

    if (step === 2) {
      setLoading(true)
      try {
        const res = await fetch(`${BACKEND}/api/auth/whatsapp-otp-send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telephone }),
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
      if (code.length < 4) {
        setError('Veuillez saisir le code à 6 chiffres.')
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`${BACKEND}/api/auth/whatsapp-otp-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telephone, code }),
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
      const storedApporteur = typeof window !== 'undefined' ? localStorage.getItem('nopalou_apporteur_code') : null
      const code_apporteur =
        searchParams?.get('apporteur') ||
        searchParams?.get('ref') ||
        searchParams?.get('code') ||
        storedApporteur ||
        ''

      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
      const res = await fetch(`${BACKEND}/api/boutiques/taf-taf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, telephone, couleur, plan, categorie, code_apporteur }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création de la boutique.')

      if (data.token) {
        await setAuthCookieAction(data.token)
      }

      setBoutiqueCreee({
        id: String(data.boutiqueId),
        nom: nom.trim(),
        slug: data.slug || null,
        telephone: telephone.trim(),
      })
      setLoading(false)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const fontStyle = {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 0%, #fff7ed 0%, #f8fafc 60%, #f1f5f9 100%)',
        padding: '32px 16px',
        ...fontStyle,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          padding: step === 4 ? '40px 32px' : '44px 36px',
          borderRadius: 28,
          boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          maxWidth: step === 4 ? 760 : 540,
          width: '100%',
          transition: 'all 0.3s ease-in-out',
        }}
      >
        {/* En-tête & Barre de progression */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--accent, #C75B00)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Étape {step} sur 4
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>
              {step === 1 ? 'Identité' : step === 2 ? 'Contact' : step === 3 ? 'Vérification' : 'Formule & Style'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  background:
                    step >= s ? 'linear-gradient(90deg, #FF6600 0%, #C75B00 100%)' : '#e2e8f0',
                  boxShadow: step >= s ? '0 2px 8px rgba(199, 91, 0, 0.3)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1.5px solid #fecaca',
              color: '#dc2626',
              padding: '14px 18px',
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={step < 4 ? handleNext : handleSubmit}>
          {/* ÉTAPE 1 : Nom de la boutique */}
          {step === 1 && (
            <StepIdentity nom={nom} setNom={setNom} />
          )}

          {/* ÉTAPE 2 & 3 : WhatsApp & Code OTP */}
          {(step === 2 || step === 3) && (
            <StepContactVerify
              step={step}
              telephone={telephone}
              setTelephone={setTelephone}
              code={code}
              setCode={setCode}
            />
          )}

          {/* ÉTAPE 4 : Choix des forfaits et style */}
          {step === 4 && (
            <WizardStepPlanStyle
              plansConfig={plansConfig}
              plan={plan}
              setPlan={setPlan}
              categorie={categorie}
              setCategorie={setCategorie}
              couleur={couleur}
              setCouleur={setCouleur}
              contratRequis={contratRequis}
              accepteContrat={accepteContrat}
              setAccepteContrat={setAccepteContrat}
              onOpenContratModal={() => setShowContratModal(true)}
            />
          )}

          {/* Barre d'actions */}
          <div
            style={{
              marginTop: 36,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={loading}
                style={{
                  background: '#ffffff',
                  color: '#475569',
                  border: '1.5px solid #cbd5e1',
                  padding: '14px 22px',
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                  ...fontStyle,
                }}
              >
                <ArrowLeft size={16} />
                Retour
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background:
                  step === 4
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '16px 32px',
                borderRadius: 16,
                fontWeight: 900,
                fontSize: 16,
                cursor: loading ? 'wait' : 'pointer',
                boxShadow:
                  step === 4
                    ? '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
                    : '0 10px 25px -5px rgba(199, 91, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                ...fontStyle,
              }}
            >
              {loading ? (
                'Création en cours...'
              ) : step === 4 ? (
                <>
                  Lancer ma boutique
                  <ArrowRight size={18} />
                </>
              ) : (
                <>
                  Continuer
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Modale d'affichage du contrat vendeur */}
        <ModalContratVendeur
          isOpen={showContratModal}
          onClose={() => setShowContratModal(false)}
          onAccept={() => {
            setAccepteContrat(true)
            setShowContratModal(false)
          }}
          contratTexte={contratTexte}
        />

        {/* Modale de célébration et QR code 1-clic */}
        {boutiqueCreee && (
          <ModalBoutiqueCreeeSucces
            boutiqueId={String(boutiqueCreee.id)}
            nom={boutiqueCreee.nom}
            slug={boutiqueCreee.slug}
            telephone={boutiqueCreee.telephone}
          />
        )}
      </div>
    </div>
  )
}
