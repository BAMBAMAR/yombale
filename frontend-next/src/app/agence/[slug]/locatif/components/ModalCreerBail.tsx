'use client'

import React, { useState, useEffect } from 'react'
import { X, Building, User, Calendar, DollarSign, Check, Loader2 } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface Bien {
  id: string
  titre: string
  prix_location?: number
  charges?: number
  depot_garantie?: number
  statut_occupation?: string
}

interface Contact {
  id: string
  nom: string
  prenom?: string
  telephone?: string
  type_contact?: string
}

interface ModalCreerBailProps {
  slug: string
  onClose: () => void
  onSuccess: (message: string) => void
}

export default function ModalCreerBail({ slug, onClose, onSuccess }: ModalCreerBailProps) {
  const [biens, setBiens] = useState<Bien[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mode sélection ou nouveau locataire
  const [nouveauLocataire, setNouveauLocataire] = useState(false)

  // Champs du formulaire
  const [bienId, setBienId] = useState('')
  const [locataireId, setLocataireId] = useState('')
  const [locataireNom, setLocataireNom] = useState('')
  const [locataireTel, setLocataireTel] = useState('')
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0])
  const [dureeMois, setDureeMois] = useState(12)
  const [loyerMensuel, setLoyerMensuel] = useState('')
  const [charges, setCharges] = useState('0')
  const [depotGarantie, setDepotGarantie] = useState('')
  const [jourEcheance, setJourEcheance] = useState(5)
  const [conditions, setConditions] = useState('')

  useEffect(() => {
    async function loadSelects() {
      try {
        setLoadingData(true)
        const headers = getImmoAuthHeaders()

        const [resBiens, resContacts] = await Promise.all([
          fetch(`/api/biens/agence/${slug}?statut=actif`, { headers }),
          fetch(`/api/crm-immo/agence/${slug}/contacts`, { headers }),
        ])

        const dBiens = await resBiens.json()
        const dContacts = await resContacts.json()

        if (dBiens.success) {
          setBiens(dBiens.biens || [])
          if (dBiens.biens?.length > 0) {
            handleSelectBien(dBiens.biens[0].id, dBiens.biens)
          }
        }
        if (dContacts.success) {
          setContacts(dContacts.contacts || [])
          if (dContacts.contacts?.length > 0) {
            setLocataireId(dContacts.contacts[0].id)
          }
        }
      } catch (err: any) {
        console.error('[LOAD_MODAL_BAIL_ERR]', err)
      } finally {
        setLoadingData(false)
      }
    }
    loadSelects()
  }, [slug])

  function handleSelectBien(id: string, list = biens) {
    setBienId(id)
    const selected = list.find(b => b.id === id)
    if (selected) {
      if (selected.prix_location) setLoyerMensuel(String(selected.prix_location))
      if (selected.charges !== undefined) setCharges(String(selected.charges || 0))
      if (selected.depot_garantie) {
        setDepotGarantie(String(selected.depot_garantie))
      } else if (selected.prix_location) {
        setDepotGarantie(String(selected.prix_location * 2))
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!bienId) {
      setError('Veuillez sélectionner un bien immobilier.')
      return
    }
    if (!nouveauLocataire && !locataireId) {
      setError('Veuillez sélectionner un locataire.')
      return
    }
    if (nouveauLocataire && !locataireNom.trim()) {
      setError('Le nom du locataire est obligatoire.')
      return
    }
    if (!loyerMensuel || parseFloat(loyerMensuel) <= 0) {
      setError('Le loyer mensuel doit être supérieur à zéro.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      const headers = getImmoAuthHeaders({ 'Content-Type': 'application/json' })

      let finalLocataireId = locataireId

      // Si création locataire à la volée
      if (nouveauLocataire) {
        const resContact = await fetch(`/api/crm-immo/agence/${slug}/contacts`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            nom: locataireNom.trim(),
            telephone: locataireTel.trim() || null,
            type_contact: 'locataire',
            statut_crm: 'gagne',
          }),
        })
        const dContact = await resContact.json()
        if (!dContact.success) {
          throw new Error(dContact.error || 'Erreur lors de la création du contact locataire')
        }
        finalLocataireId = dContact.contact.id
      }

      const res = await fetch(`/api/locatif-immo/agence/${slug}/baux`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bien_id: bienId,
          locataire_id: finalLocataireId,
          date_debut: dateDebut,
          duree_mois: dureeMois,
          loyer_mensuel: parseFloat(loyerMensuel),
          charges: parseFloat(charges) || 0,
          depot_garantie: parseFloat(depotGarantie) || 0,
          jour_echeance: jourEcheance,
          conditions: conditions.trim() || null,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la création du contrat de bail')
      }

      onSuccess(`Contrat de bail créé avec succès ! 12 échéances de loyers générées.`)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 43, 74, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          maxWidth: 620,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Nouveau Contrat de Bail Locatif
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748B' }}>
              Enregistrez le bail pour générer automatiquement l'échéancier des loyers.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#FEE2E2',
                color: '#991B1B',
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 16,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          {loadingData ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748B' }}>
              <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13 }}>Chargement des données du portefeuille...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Sélection Bien */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--navy, #1C2B4A)' }}>
                  Bien Immobilier à Louer *
                </label>
                {biens.length === 0 ? (
                  <p style={{ fontSize: 12.5, color: '#DC2626' }}>
                    Aucun bien trouvé. Veuillez d'abord ajouter un bien dans votre portefeuille.
                  </p>
                ) : (
                  <select
                    value={bienId}
                    onChange={e => handleSelectBien(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 13.5,
                      fontWeight: 600,
                      background: '#FFF',
                    }}
                  >
                    {biens.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.titre} {b.prix_location ? `(${Number(b.prix_location).toLocaleString('fr-FR')} FCFA/mois)` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Locataire */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                    Locataire (Preneur) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNouveauLocataire(!nouveauLocataire)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--accent, #C75B00)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {nouveauLocataire ? 'Choisir un locataire existant' : '+ Créer un nouveau locataire'}
                  </button>
                </div>

                {!nouveauLocataire ? (
                  <select
                    value={locataireId}
                    onChange={e => setLocataireId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 13.5,
                      fontWeight: 600,
                      background: '#FFF',
                    }}
                  >
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {[c.prenom, c.nom].filter(Boolean).join(' ')} {c.telephone ? `(${c.telephone})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input
                      type="text"
                      placeholder="Nom complet du locataire *"
                      value={locataireNom}
                      onChange={e => setLocataireNom(e.target.value)}
                      required
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border, #E8DDD2)',
                        fontSize: 13,
                      }}
                    />
                    <input
                      type="tel"
                      placeholder="Téléphone / WhatsApp"
                      value={locataireTel}
                      onChange={e => setLocataireTel(e.target.value)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border, #E8DDD2)',
                        fontSize: 13,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Loyer et Charges */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--navy, #1C2B4A)' }}>
                    Loyer Mensuel Net (FCFA) *
                  </label>
                  <input
                    type="number"
                    value={loyerMensuel}
                    onChange={e => setLoyerMensuel(e.target.value)}
                    placeholder="250000"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--navy, #1C2B4A)' }}>
                    Charges Mensuelles (FCFA)
                  </label>
                  <input
                    type="number"
                    value={charges}
                    onChange={e => setCharges(e.target.value)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              {/* Dépôt de garantie et Date début */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--navy, #1C2B4A)' }}>
                    Dépôt de Garantie (Caution FCFA)
                  </label>
                  <input
                    type="number"
                    value={depotGarantie}
                    onChange={e => setDepotGarantie(e.target.value)}
                    placeholder="Ex: 500000"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 13.5,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--navy, #1C2B4A)' }}>
                    Date de Prise d'Effet *
                  </label>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={e => setDateDebut(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 13.5,
                    }}
                  />
                </div>
              </div>

              {/* Durée et Jour d'échéance */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--navy, #1C2B4A)' }}>
                    Durée du Bail (mois)
                  </label>
                  <select
                    value={dureeMois}
                    onChange={e => setDureeMois(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 13.5,
                      background: '#FFF',
                    }}
                  >
                    <option value={6}>6 mois</option>
                    <option value={12}>12 mois (1 an - standard)</option>
                    <option value={24}>24 mois (2 ans)</option>
                    <option value={36}>36 mois (3 ans)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--navy, #1C2B4A)' }}>
                    Jour d'Échéance Mensuel
                  </label>
                  <select
                    value={jourEcheance}
                    onChange={e => setJourEcheance(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 13.5,
                      background: '#FFF',
                    }}
                  >
                    <option value={1}>Le 1er du mois</option>
                    <option value={5}>Le 5 du mois (recommandé)</option>
                    <option value={10}>Le 10 du mois</option>
                    <option value={15}>Le 15 du mois</option>
                  </select>
                </div>
              </div>

              {/* Conditions particulières */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--navy, #1C2B4A)' }}>
                  Conditions Particulières ou Notes
                </label>
                <textarea
                  value={conditions}
                  onChange={e => setConditions(e.target.value)}
                  placeholder="Ex : Animaux autorisés, peinture refaite à neuf, remise des clés..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border, #E8DDD2)',
                    fontSize: 13,
                  }}
                />
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 24,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                background: '#FFFFFF',
                color: '#64748B',
                fontWeight: 650,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || loadingData || biens.length === 0}
              style={{
                padding: '10px 22px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--navy, #1C2B4A)',
                color: '#FFFFFF',
                fontWeight: 750,
                fontSize: 13.5,
                cursor: submitting ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {submitting ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
              <span>{submitting ? 'Création en cours...' : 'Créer le Bail & Calendrier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
