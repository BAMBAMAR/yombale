'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Clock, PackageCheck, Truck, CheckCircle2, MessageCircle, CreditCard, Zap, ArrowRight, AlertCircle } from 'lucide-react'

interface CommandeSuivie {
  id: string
  reference: string
  client_nom: string
  client_telephone: string
  statut: string
  montant_total: number
  methode_paiement: string
  created_at: string
  boutique_id?: string
  produit_id?: string
  nom_produit?: string
  quantite?: number
  boutique_nom: string
  boutique_slug?: string
  boutique_whatsapp?: string
}

function SuiviCommandeContent() {
  const searchParams = useSearchParams()
  const initialRef = searchParams.get('ref') || searchParams.get('q') || ''
  
  const [refInput, setRefInput] = useState(initialRef)
  const [loading, setLoading] = useState(false)
  const [commandes, setCommandes] = useState<CommandeSuivie[]>([])
  const [error, setError] = useState<string | null>(null)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  const executeSearch = useCallback(async (queryTerm: string) => {
    const term = queryTerm.trim()
    if (!term) return

    setLoading(true)
    setError(null)
    setCommandes([])

    try {
      const res = await fetch(`${backendUrl}/api/boutiques/commandes/suivi?q=${encodeURIComponent(term)}&ref=${encodeURIComponent(term)}&tel=${encodeURIComponent(term)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Commande introuvable. Vérifiez votre référence ou votre numéro de téléphone.')
      } else {
        setCommandes(data.commandes || [])
      }
    } catch {
      setError('Impossible d\'effectuer la recherche. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }, [backendUrl])

  useEffect(() => {
    if (initialRef) {
      setRefInput(initialRef)
      executeSearch(initialRef)
    }
  }, [initialRef, executeSearch])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    executeSearch(refInput)
  }

  function getStepIndex(statut: string) {
    const s = (statut || '').toLowerCase()
    if (s === 'livree' || s === 'payee') return 4
    if (s === 'en_livraison' || s === 'expediee') return 3
    if (s === 'en_preparation' || s === 'validee') return 2
    return 1 // en_attente
  }

  const fcfa = (v: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v) + ' FCFA'

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 16px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: 650, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <Link href="/" className="annonce-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Retour à l&apos;accueil Nopalou</span>
          </Link>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '28px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 22, fontWeight: 800, color: '#1C2B4A', margin: '0 0 8px' }}>
            Suivre ma Commande
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
            Entrez votre numéro de référence (ex: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>CMD-2026-XXXX</code>) ou votre numéro de téléphone.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%' }}>
            <input
              type="text"
              value={refInput}
              onChange={e => setRefInput(e.target.value)}
              placeholder="N° de référence ou Téléphone..."
              style={{
                flex: '1 1 220px',
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                fontSize: 14,
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              className="npl-btn npl-btn-primary npl-btn-lg"
              style={{ flex: '0 0 auto', color: '#ffffff', whiteSpace: 'nowrap', padding: '0 22px' }}
            >
              <span>{loading ? '' : ''}</span>
              <span>{loading ? 'Recherche...' : 'Rechercher'}</span>
            </button>
          </form>

          {error && (
            <div style={{ marginTop: 16, padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Résultats du suivi */}
        {commandes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {commandes.map(cmd => {
              const currentStep = getStepIndex(cmd.statut)
              const isAnnulee = cmd.statut === 'annulee' || cmd.statut === 'rejetee'

              return (
                <div key={cmd.id} style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Boutique : {cmd.boutique_nom}</span>
                      <h3 style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, color: '#1C2B4A' }}>Réf : {cmd.reference || cmd.id.slice(0, 8)}</h3>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: isAnnulee ? '#dc2626' : '#15803d' }}>
                      {isAnnulee ? (cmd.statut === 'rejetee' ? 'Rejetée' : 'Annulée') : fcfa(cmd.montant_total)}
                    </span>
                  </div>

                  {isAnnulee ? (
                    <div style={{ margin: '16px 0', padding: '14px 16px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, color: '#dc2626' }}>
                      <AlertCircle size={20} />
                      <div>
                        <span style={{ fontSize: 13.5, fontWeight: 800, display: 'block' }}>Commande {cmd.statut === 'rejetee' ? 'Rejetée' : 'Annulée'}</span>
                        <span style={{ fontSize: 12, color: '#b91c1c' }}>Cette commande a été clôturée et ne fait plus l&apos;objet d&apos;une livraison. Contactez le marchand pour assistance.</span>
                      </div>
                    </div>
                  ) : (
                    /* Timeline des 4 étapes */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, margin: '20px 0', textAlign: 'center' }}>
                      {[
                        { step: 1, label: 'En attente', icon: Clock },
                        { step: 2, label: 'En préparation', icon: PackageCheck },
                        { step: 3, label: 'En livraison', icon: Truck },
                        { step: 4, label: 'Livrée', icon: CheckCircle2 },
                      ].map(st => {
                        const isActive = currentStep >= st.step
                        const IconComp = st.icon
                        return (
                          <div key={st.step} style={{ opacity: isActive ? 1 : 0.4 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%', margin: '0 auto 6px',
                              background: isActive ? 'var(--accent, #C75B00)' : '#e2e8f0', color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <IconComp size={18} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? '#1C2B4A' : '#94a3b8', display: 'block' }}>
                              {st.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Bloc d'action immédiate si paiement échelonné ou Wave en attente */}
                  {!isAnnulee && cmd.statut === 'en_attente' && (cmd.methode_paiement === 'credit' || cmd.methode_paiement === 'echelonne') && (
                    <div style={{ margin: '14px 0', padding: '14px 16px', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CreditCard size={18} color="#C75B00" />
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#9a3412' }}>
                            Paiement échelonné sélectionné (En attente d&apos;acompte)
                          </span>
                        </div>
                        <span style={{ fontSize: 11, background: '#ffedd5', color: '#c2410c', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                          Action requise
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12.5, color: '#7c2d12', lineHeight: 1.4 }}>
                        Définissez vos mensualités (2x, 3x, 4x) et réglez votre acompte pour valider définitivement la commande.
                      </p>
                      <a
                        href={`/checkout-express?${cmd.produit_id ? `produit=${cmd.produit_id}&` : ''}${cmd.boutique_id ? `boutique=${cmd.boutique_id}&` : ''}nom=${encodeURIComponent(cmd.client_nom)}&phone=${cmd.client_telephone}&echelonne=1&ref=${encodeURIComponent(cmd.reference)}`}
                        className="npl-btn npl-btn-primary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '11px 20px',
                          borderRadius: 10,
                          background: 'var(--accent, #C75B00)',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: 13.5,
                          textDecoration: 'none',
                          marginTop: 2,
                          boxShadow: '0 2px 8px rgba(199, 91, 0, 0.25)',
                        }}
                      >
                        <CreditCard size={16} />
                        <span>Finaliser mon paiement échelonné</span>
                        <ArrowRight size={14} />
                      </a>
                    </div>
                  )}

                  {!isAnnulee && cmd.statut === 'en_attente' && (cmd.methode_paiement === 'wave' || cmd.methode_paiement === 'pay_wave') && (
                    <div style={{ margin: '14px 0', padding: '14px 16px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Zap size={18} color="#15803d" />
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#166534' }}>
                            Paiement Wave en attente de règlement
                          </span>
                        </div>
                        <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                          En attente
                        </span>
                      </div>
                      <a
                        href={`/checkout-express?${cmd.produit_id ? `produit=${cmd.produit_id}&` : ''}${cmd.boutique_id ? `boutique=${cmd.boutique_id}&` : ''}nom=${encodeURIComponent(cmd.client_nom)}&phone=${cmd.client_telephone}&pay=wave&ref=${encodeURIComponent(cmd.reference)}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '11px 20px',
                          borderRadius: 10,
                          background: '#0284c7',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: 13.5,
                          textDecoration: 'none',
                          marginTop: 2,
                          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                        }}
                      >
                        <Zap size={16} />
                        <span>Payer maintenant par Wave</span>
                        <ArrowRight size={14} />
                      </a>
                    </div>
                  )}

                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 12, color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Client : <strong>{cmd.client_nom}</strong> ({cmd.client_telephone})</span>
                    {cmd.boutique_whatsapp && (
                      <a
                        href={`https://wa.me/${cmd.boutique_whatsapp.replace(/[^0-9]/g, '')}?text=Bonjour,%20je%20suis%20le%20suivi%20de%20ma%20commande%20${cmd.reference}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#16a34a', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <MessageCircle size={14} /> Contacter la boutique
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

export default function SuiviCommandePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>Recherche du suivi de commande...</p>
      </div>
    }>
      <SuiviCommandeContent />
    </Suspense>
  )
}
