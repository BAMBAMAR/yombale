'use client'

import React, { useState } from 'react'
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

interface SurgaProModalProps {
  isOpen: boolean
  onClose: () => void
}

const OFFRES_PRO = [
  {
    id: 'b2b_visibilite_resto',
    titre: 'Bonnes Adresses & Restauration',
    tarifMensuel: '5 000 FCFA / mois',
    icon: UtensilsCrossed,
    points: [
      'Positionnement prioritaire en tête de liste dans votre quartier',
      'Badge vérifié "Recommandé par Surga"',
      'Bouton contact direct WhatsApp & réservation',
      'Statistiques mensuelles de consultation',
    ],
  },
  {
    id: 'b2b_immo_pro',
    titre: 'Agences Immobilières Partenaires',
    tarifMensuel: '5 000 FCFA / mois',
    icon: Building,
    points: [
      'Transmission de vos mandats en moins de 60s aux chercheurs qualifiés',
      'Badge officiel "Agence Immobilière Vérifiée"',
      'Mise en relation directe sans intermédiaire',
      'Volume d appels qualifiés mensuels',
    ],
  },
  {
    id: 'b2b_education_pro',
    titre: 'Centres de Formation & Prépa Concours',
    tarifMensuel: '10 000 FCFA / mois',
    icon: GraduationCap,
    points: [
      'Encart dédié sur les pages des concours officiels du Sénégal',
      'Bouton d inscription directe vers votre WhatsApp ou secrétariat',
      'Badge "Centre Partenaire Officiel"',
      'Audience ciblée de candidats préparant activement leurs dossiers',
    ],
  },
]

export default function SurgaProModal({ isOpen, onClose }: SurgaProModalProps) {
  const [offreChoisie, setOffreChoisie] = useState<string>('b2b_visibilite_resto')
  const [nomEtablissement, setNomEtablissement] = useState<string>('')
  const [telephoneContact, setTelephoneContact] = useState<string>('')
  const [quartier, setQuartier] = useState<string>('')
  const [chargement, setChargement] = useState<boolean>(false)
  const [succes, setSucces] = useState<boolean>(false)
  const [erreur, setErreur] = useState<string | null>(null)

  if (!isOpen) return null

  const offreActuelle = OFFRES_PRO.find((o) => o.id === offreChoisie) || OFFRES_PRO[0]

  const handleSouscrirePro = async (e: React.FormEvent) => {
    e.preventDefault()
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
          plan: offreChoisie,
          cycle: 'mensuel',
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
              <div style={{ fontSize: 11, opacity: 0.85 }}>Développez votre visibilité et votre clientèle</div>
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
                  {OFFRES_PRO.map((offre) => {
                    const Icon = offre.icon
                    const estSelectionne = offreChoisie === offre.id
                    return (
                      <div
                        key={offre.id}
                        onClick={() => setOffreChoisie(offre.id)}
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
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                              {offre.titre}
                            </span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--price, #0A5C36)' }}>
                            {offre.tarifMensuel}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingLeft: 26 }}>
                          {offre.points.map((pt, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text2, #5A4E42)' }}>
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
                disabled={chargement}
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
                <span>Activer mon partenariat ({offreActuelle.tarifMensuel})</span>
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
