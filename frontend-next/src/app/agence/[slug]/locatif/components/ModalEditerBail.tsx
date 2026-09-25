'use client'

import React, { useState, useEffect } from 'react'
import { X, DollarSign, Loader2, Save, FileText, Settings, Sparkles, CheckCircle2 } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'
import { BailItem } from './TableBauxImmo'
import ModalEditerBailArticles, { ArticlesMap } from './ModalEditerBailArticles'

interface ModalEditerBailProps {
  slug: string
  bail: BailItem
  onClose: () => void
  onSuccess: (message: string) => void
}

export default function ModalEditerBail({ slug, bail, onClose, onSuccess }: ModalEditerBailProps) {
  const [activeTab, setActiveTab] = useState<'financier' | 'articles'>('articles')
  const [loyerMensuel, setLoyerMensuel] = useState(String(bail.loyer_mensuel || ''))
  const [charges, setCharges] = useState(String(bail.charges || 0))
  const [depotGarantie, setDepotGarantie] = useState(String(bail.depot_garantie || 0))
  const [jourEcheance, setJourEcheance] = useState(bail.jour_echeance || 5)
  const [dureeMois, setDureeMois] = useState(bail.duree_mois || 12)
  const [dateFin, setDateFin] = useState(bail.date_fin ? bail.date_fin.split('T')[0] : '')
  const [documentUrl, setDocumentUrl] = useState(bail.document_url || '')
  
  const [clauses, setClauses] = useState<ArticlesMap>(bail.clauses_personnalisees || {})
  const [defauts, setDefauts] = useState<ArticlesMap>({})
  const [loadingModeles, setLoadingModeles] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function chargerModeles() {
      try {
        const res = await fetch(`/api/locatif-immo/agence/${slug}/baux/${bail.id}/modeles-articles`, {
          headers: getImmoAuthHeaders(),
        })
        const data = await res.json()
        if (mounted && data.success) {
          if (data.defauts) setDefauts(data.defauts)
          if (data.clauses_personnalisees && Object.keys(data.clauses_personnalisees).length > 0) {
            setClauses(data.clauses_personnalisees)
          } else if (data.conditions) {
            setClauses(prev => ({ ...prev, article6_conditions: data.conditions }))
          }
        }
      } catch {
        // Fallback silencieux, les textes locaux par défaut sont conservés
      } finally {
        if (mounted) setLoadingModeles(false)
      }
    }
    chargerModeles()
    return () => { mounted = false }
  }, [slug, bail.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`/api/locatif-immo/agence/${slug}/baux/${bail.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getImmoAuthHeaders(),
        },
        body: JSON.stringify({
          loyer_mensuel: parseFloat(loyerMensuel) || 0,
          charges: parseFloat(charges) || 0,
          depot_garantie: parseFloat(depotGarantie) || 0,
          jour_echeance: parseInt(String(jourEcheance), 10) || 5,
          duree_mois: parseInt(String(dureeMois), 10) || 12,
          date_fin: dateFin || null,
          conditions: clauses.article6_conditions || null,
          clauses_personnalisees: clauses,
          document_url: documentUrl.trim() || null,
        }),
      })

      const data = await res.json()
      if (data.success) {
        onSuccess(data.message || 'Contrat de bail et clauses mis à jour avec succès.')
        onClose()
      } else {
        setError(data.error || 'Erreur lors de la mise à jour du bail.')
      }
    } catch {
      setError('Impossible de joindre le serveur.')
    } finally {
      setLoading(false)
    }
  }

  const nbClausesPerso = Object.keys(clauses).filter(k => Boolean(clauses[k as keyof ArticlesMap]?.trim())).length

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 680,
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF3E8 100%)',
          }}
        >
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '.05em',
                color: 'var(--accent, #C75B00)',
              }}
            >
              Éditeur Intégral de Contrat de Bail COCC
            </span>
            <h3 style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              Personnaliser le Contrat : {bail.bien_titre}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
              Locataire : {bail.locataire_prenom ? `${bail.locataire_prenom} ` : ''}{bail.locataire_nom}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Onglets */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            background: '#FAF8F5',
            padding: '0 16px',
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('articles')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '12px 14px',
              fontSize: 13,
              fontWeight: 800,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'articles' ? 'var(--accent, #C75B00)' : '#64748B',
              borderBottom: activeTab === 'articles' ? '2.5px solid var(--accent, #C75B00)' : '2.5px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={15} />
            <span>Articles du Contrat (1 à 6)</span>
            {nbClausesPerso > 0 && (
              <span
                style={{
                  background: activeTab === 'articles' ? 'var(--accent, #C75B00)' : '#CBD5E1',
                  color: '#FFFFFF',
                  borderRadius: 10,
                  padding: '1px 6px',
                  fontSize: 10.5,
                  fontWeight: 900,
                }}
              >
                {nbClausesPerso}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financier')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '12px 14px',
              fontSize: 13,
              fontWeight: 800,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'financier' ? 'var(--navy, #1C2B4A)' : '#64748B',
              borderBottom: activeTab === 'financier' ? '2.5px solid var(--navy, #1C2B4A)' : '2.5px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            <Settings size={15} />
            <span>Paramètres Financiers & Échéances</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', color: '#991B1B', fontSize: 12.5, fontWeight: 700 }}>
              {error}
            </div>
          )}

          {/* ONGLET 1 : ARTICLES DU CONTRAT */}
          {activeTab === 'articles' && (
            <div>
              {loadingModeles ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, margin: 0 }}>Chargement des modèles légaux de bail...</p>
                </div>
              ) : (
                <ModalEditerBailArticles
                  defauts={defauts}
                  clauses={clauses}
                  onChange={setClauses}
                />
              )}
            </div>
          )}

          {/* ONGLET 2 : PARAMÈTRES FINANCIERS */}
          {activeTab === 'financier' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Loyer et charges */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                    Loyer Mensuel Nu (FCFA) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      required
                      min="1000"
                      value={loyerMensuel}
                      onChange={e => setLoyerMensuel(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 34px',
                        borderRadius: 8,
                        border: '1px solid var(--border, #E8DDD2)',
                        fontSize: 13.5,
                        fontWeight: 800,
                      }}
                    />
                    <DollarSign size={15} style={{ position: 'absolute', left: 10, top: 12, color: '#94A3B8' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                    Charges Locatives (FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={charges}
                    onChange={e => setCharges(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 13.5,
                      fontWeight: 800,
                    }}
                  />
                </div>
              </div>

              {/* Dépôt de garantie et jour d'échéance */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                    Dépôt de Garantie (Caution FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={depotGarantie}
                    onChange={e => setDepotGarantie(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 13.5,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                    Jour d&apos;Échéance du Mois
                  </label>
                  <select
                    value={jourEcheance}
                    onChange={e => setJourEcheance(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 13.5,
                      background: '#FFF',
                    }}
                  >
                    <option value={1}>Le 1er du mois</option>
                    <option value={5}>Le 5 du mois (standard)</option>
                    <option value={10}>Le 10 du mois</option>
                    <option value={15}>Le 15 du mois</option>
                  </select>
                </div>
              </div>

              {/* Durée ferme et Date de fin */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                    Durée Ferme du Contrat
                  </label>
                  <select
                    value={dureeMois}
                    onChange={e => setDureeMois(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 13.5,
                      background: '#FFF',
                    }}
                  >
                    <option value={6}>6 mois</option>
                    <option value={12}>12 mois (1 an standard)</option>
                    <option value={24}>24 mois (2 ans)</option>
                    <option value={36}>36 mois (3 ans)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                    Date de Fin Convenue (Optionnelle)
                  </label>
                  <input
                    type="date"
                    value={dateFin}
                    onChange={e => setDateFin(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8.5px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              {/* URL du document signé numérisé */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                  Lien du Contrat Numérisé Signé (Optionnel)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={documentUrl}
                  onChange={e => setDocumentUrl(e.target.value)}
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
          )}

          {/* Actions Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border, #E8DDD2)',
              paddingTop: 14,
              marginTop: 4,
            }}
          >
            <div style={{ fontSize: 11.5, color: '#64748B' }}>
              {nbClausesPerso > 0 ? (
                <span style={{ color: 'var(--accent, #C75B00)', fontWeight: 700 }}>
                  {nbClausesPerso} article{nbClausesPerso > 1 ? 's' : ''} personnalisé{nbClausesPerso > 1 ? 's' : ''}
                </span>
              ) : (
                <span>Tous les articles utilisent le texte légal standard</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 15px',
                  borderRadius: 8,
                  background: '#F1F5F9',
                  color: '#64748B',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  borderRadius: 8,
                  background: 'var(--navy, #1C2B4A)',
                  color: '#ffffff',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{loading ? 'Enregistrement...' : 'Enregistrer le contrat'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
