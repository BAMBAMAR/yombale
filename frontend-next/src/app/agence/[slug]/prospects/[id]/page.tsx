'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Users2,
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Sparkles,
  Calendar,
  Briefcase,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

export default function AgenceProspectDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  const contactId = params?.id as string

  const [contact, setContact] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [visites, setVisites] = useState<any[]>([])
  const [offres, setOffres] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'matching' | 'visites' | 'offres' | 'notes'>('matching')

  async function chargerDonnees() {
    try {
      setLoading(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

      const [resContact, resMatch, resOffres] = await Promise.all([
        fetch(`/api/crm-immo/agence/${slug}/contacts/${contactId}`, { headers }),
        fetch(`/api/crm-immo/agence/${slug}/contacts/${contactId}/matching`, { headers }),
        fetch(`/api/offres-immo/agence/${slug}?contact_id=${contactId}`, { headers }),
      ])

      const [dC, dM, dO] = await Promise.all([resContact.json(), resMatch.json(), resOffres.json()])

      if (dC.success) {
        setContact(dC.contact)
        setVisites(dC.visites || [])
      }
      if (dM.success) setMatches(dM.biens_matches || [])
      if (dO.success) setOffres(dO.offres || [])
    } catch (err) {
      console.error('[LOAD_PROSPECT_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug && contactId) chargerDonnees()
  }, [slug, contactId])

  if (loading && !contact) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
        Chargement du profil prospect…
      </div>
    )
  }

  if (!contact) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h3 style={{ color: '#0f172a' }}>Prospect introuvable</h3>
        <Link href={`/agence/${slug}/prospects`} style={{ color: 'var(--accent, #C75B00)', textDecoration: 'none', fontWeight: 700 }}>
          ← Retour au CRM
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1150, margin: '0 auto', paddingBottom: 40 }}>
      {/* Fil d'Ariane */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link
          href={`/agence/${slug}/prospects`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12.5,
            fontWeight: 700,
            color: '#64748b',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} />
          <span>CRM Prospects</span>
        </Link>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <span style={{ fontSize: 12.5, color: '#334155', fontWeight: 600 }}>{contact.nom} {contact.prenom || ''}</span>
      </div>

      {/* Carte Fiche Contact */}
      <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 6,
                background: contact.type_operation === 'vente' ? '#fef3c7' : '#e0f2fe',
                color: contact.type_operation === 'vente' ? '#92400e' : '#0369a1',
              }}>
                {contact.type_operation === 'vente' ? 'Achat / Vente' : 'Location'}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 6,
                background: '#f1f5f9',
                color: '#334155',
              }}>
                Statut : {contact.statut_crm || 'nouveau'}
              </span>
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '8px 0 4px', color: 'var(--navy, #1C2B4A)' }}>
              {contact.nom} {contact.prenom || ''}
            </h1>

            <div style={{ fontSize: 13, color: '#64748b' }}>
              {contact.profession ? `${contact.profession} · ` : ''}Enregistré le {new Date(contact.created_at).toLocaleDateString('fr-FR')}
            </div>
          </div>

          {/* Boutons d'action rapide */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {contact.telephone && (
              <a
                href={`tel:${contact.telephone}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#f8fafc',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <Phone size={14} />
                <span>{contact.telephone}</span>
              </a>
            )}

            {contact.whatsapp && (
              <a
                href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#25D366',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <MessageCircle size={14} />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        {/* Détails Critères de Recherche */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 18, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Fourchette Budget</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--price, #0A5C36)' }}>
              {contact.budget_max ? `${Number(contact.budget_max).toLocaleString('fr-FR')} FCFA max` : 'Budget non précisé'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Type de bien recherché</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
              {contact.type_bien_souhaite || 'Tous types'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Quartiers ciblés</div>
            <div style={{ fontSize: 13, color: '#334155' }}>
              {Array.isArray(contact.quartiers_souhaites) && contact.quartiers_souhaites.length > 0
                ? contact.quartiers_souhaites.join(', ')
                : 'Toute la zone'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Biens compatibles (IA)</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent, #C75B00)' }}>
              {matches.length} opportunité(s)
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #e2e8f0', marginBottom: 20 }}>
        {[
          { key: 'matching', label: `Biens Correspondants (${matches.length})` },
          { key: 'visites', label: `Visites (${visites.length})` },
          { key: 'offres', label: `Offres Déposées (${offres.length})` },
          { key: 'notes', label: 'Notes de Négociation' },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              background: 'none',
              color: activeTab === tab.key ? 'var(--accent, #C75B00)' : '#64748b',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent, #C75B00)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu de l'onglet */}
      {activeTab === 'matching' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: 'var(--navy, #1C2B4A)' }}>
            Biens compatibles avec la recherche de {contact.nom} ({matches.length})
          </h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
            Rapprochement intelligent calculé en direct selon le budget et les secteurs demandés.
          </p>

          {matches.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
              Aucun bien du portefeuille ne correspond actuellement aux critères de ce prospect.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {matches.map((b: any) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 14,
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Link
                        href={`/agence/${slug}/biens/${b.id}`}
                        style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--navy, #1C2B4A)', textDecoration: 'none' }}
                      >
                        {b.titre}
                      </Link>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: '#f0fdf4',
                        color: '#15803d',
                        fontWeight: 800,
                        fontSize: 11,
                      }}>
                        {b.score_matching}% Match
                      </span>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--price, #0A5C36)', marginTop: 4 }}>
                      {Number(b.prix_location || b.prix_vente || 0).toLocaleString('fr-FR')} FCFA
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b', marginLeft: 6 }}>
                        · {b.quartier ? `${b.quartier}, ` : ''}{b.ville}
                      </span>
                    </div>

                    {b.raisons && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {b.raisons.map((r: string, idx: number) => (
                          <span key={idx} style={{ fontSize: 10.5, padding: '1px 6px', background: '#e2e8f0', borderRadius: 4, color: '#475569' }}>
                            ✓ {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/agence/${slug}/biens/${b.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--accent, #C75B00)',
                      color: '#fff',
                      padding: '7px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <span>Consulter le bien</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'visites' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', color: 'var(--navy, #1C2B4A)' }}>
            Visites Effectuées ({visites.length})
          </h3>
          {visites.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>
              Aucune visite enregistrée pour ce prospect.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visites.map(v => (
                <div key={v.id} style={{ padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{v.bien_titre}</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(v.date_visite).toLocaleString('fr-FR')}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                    Statut : {v.statut} {v.notes ? `· Commentaire : ${v.notes}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'offres' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', color: 'var(--navy, #1C2B4A)' }}>
            Offres d&apos;Achat / Location Déposées ({offres.length})
          </h3>
          {offres.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>
              Aucune offre déposée par ce prospect.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {offres.map(o => (
                <div key={o.id} style={{ padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: 13.5 }}>{Number(o.montant).toLocaleString('fr-FR')} FCFA</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: o.statut === 'acceptee' ? '#15803d' : '#b45309' }}>
                      {o.statut}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Pour le bien : {o.bien_titre}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: 'var(--navy, #1C2B4A)' }}>
            Notes et Historique de Négociation
          </h3>
          <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {contact.notes || 'Aucune note spécifique enregistrée.'}
          </p>
        </div>
      )}
    </div>
  )
}
