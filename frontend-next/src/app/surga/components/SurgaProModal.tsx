'use client'

import React, { useEffect, useState } from 'react'
import {
  X,
  Briefcase,
  UtensilsCrossed,
  Building,
  GraduationCap,
  Check,
  ArrowRight,
  Phone,
  ShieldCheck,
} from 'lucide-react'
import { formaterFCFA } from '@/lib/surga-formatting'
import { oublierOffre, useSurgaOffre } from '@/lib/surga-offre'

interface SurgaProModalProps {
  isOpen: boolean
  onClose: () => void
}

// Les formules professionnelles (nom, prix, avantages) viennent de la console d'administration ; cette fenêtre n'est atteignable
// que si au moins une formule pro est en vente. Seule l'icône dépend de l'identifiant de la formule.
const ICONES_PRO: Record<string, typeof Briefcase> = {
  b2b_visibilite_resto: UtensilsCrossed,
  b2b_immo_pro: Building,
  b2b_education_pro: GraduationCap,
}

export default function SurgaProModal({ isOpen, onClose }: SurgaProModalProps) {
  const { offre, recharger } = useSurgaOffre()
  const [offreChoisie, setOffreChoisie] = useState<string>('')
  const [nomEtablissement, setNomEtablissement] = useState<string>('')
  const [telephoneContact, setTelephoneContact] = useState<string>('')
  const [quartier, setQuartier] = useState<string>('')
  const [chargement, setChargement] = useState<boolean>(false)
  const [succes, setSucces] = useState<boolean>(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    oublierOffre()
    recharger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!isOpen) return null

  const plansPro = (offre?.plans ?? []).filter((p) => p.type === 'b2b' && p.cycles.length > 0)
  const offreActuelle = plansPro.find((p) => p.id === offreChoisie) || plansPro[0] || null
  const cycleMensuel = (p: { cycles: { cycle: string; montant: number }[] } | null) => p?.cycles.find((c) => c.cycle === 'mensuel') || p?.cycles[0] || null
  const tarif = (p: { cycles: { cycle: string; montant: number }[] } | null) => { const c = cycleMensuel(p); return c ? `${formaterFCFA(c.montant)} / mois` : '' }

  const handleSouscrirePro = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offreActuelle) return
    if (!nomEtablissement.trim() || !telephoneContact.trim()) {
      setErreur('Veuillez renseigner le nom de votre structure et un téléphone de contact.')
      return
    }

    setChargement(true)
    setErreur(null)

    try {
      const res = await fetch('/api/surga/abonnements/initier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: offreActuelle.id,
          cycle: cycleMensuel(offreActuelle)?.cycle || 'mensuel',
          provider: 'wave',
          phone: telephoneContact,
          metadata: {
            nomEtablissement,
            quartier,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la prise en compte de votre demande.')
      }

      setSucces(true)
      if (data.paiementUrl) {
        window.open(data.paiementUrl, '_blank')
      }
    } catch (err: any) {
      setErreur(err.message || 'Une erreur est survenue.')
    } finally {
      setChargement(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '18px 20px',
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Briefcase size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Espaces Professionnels Surga</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>Développez votre visibilité et votre clientèle</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!succes ? (
            <form onSubmit={handleSouscrirePro} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Choix du secteur d'activité */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                  Sélectionnez votre formule professionnelle
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plansPro.length === 0 && (
                    <div style={{ fontSize: 13, color: 'var(--text2, #5A4E42)' }}>Aucune formule professionnelle n’est proposée pour le moment.</div>
                  )}
                  {plansPro.map((plan) => {
                    const Icon = ICONES_PRO[plan.id] || Briefcase
                    const estSelectionne = offreActuelle?.id === plan.id
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setOffreChoisie(plan.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: estSelectionne ? '2px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                          backgroundColor: estSelectionne ? 'rgba(199, 91, 0, 0.04)' : '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Icon size={18} color={estSelectionne ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)'} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>{plan.nom}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--price, #0A5C36)' }}>{tarif(plan)}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingLeft: 26 }}>
                          {plan.avantages.map((pt, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2, #5A4E42)' }}>
                              <Check size={12} color="var(--price, #0A5C36)" />
                              <span>{pt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Coordonnées */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 4 }}>
                    Nom de votre établissement ou entreprise *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : Restaurant Le Balafon, Agence Dakar Immo..."
                    value={nomEtablissement}
                    onChange={(e) => setNomEtablissement(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 13,
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 4 }}>
                      Quartier à Dakar
                    </label>
                    <input
                      type="text"
                      placeholder="Ex : Almadies, Plateau..."
                      value={quartier}
                      onChange={(e) => setQuartier(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border, #E8DDD2)',
                        fontSize: 13,
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 4 }}>
                      Téléphone WhatsApp pro *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex : 77 123 45 67"
                      value={telephoneContact}
                      onChange={(e) => setTelephoneContact(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border, #E8DDD2)',
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
              </div>

              {erreur && (
                <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 600, padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8 }}>
                  {erreur}
                </div>
              )}

              {/* Bouton de validation */}
              <button
                type="submit"
                disabled={chargement || !offreActuelle || offre?.ventes_ouvertes === false}
                className="surga-btn-primary"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 14,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 6,
                  opacity: chargement ? 0.7 : 1,
                }}
              >
                <ShieldCheck size={16} />
                <span>Activer mon partenariat{offreActuelle ? ` (${tarif(offreActuelle)})` : ''}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(10, 92, 54, 0.1)',
                  color: 'var(--price, #0A5C36)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                <ShieldCheck size={32} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Demande transmise avec succès !
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', margin: 0 }}>
                Votre établissement <strong>{nomEtablissement}</strong> est en cours de configuration. La passerelle de règlement s est ouverte. Notre équipe commerciale vous contacte également au <strong>{telephoneContact}</strong> pour calibrer votre mise en avant sur Surga.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="surga-btn-primary"
                style={{ width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 800, marginTop: 8 }}
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
