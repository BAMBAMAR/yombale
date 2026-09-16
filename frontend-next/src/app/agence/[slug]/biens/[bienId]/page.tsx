'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  ArrowLeft,
  MapPin,
  Maximize2,
  BedDouble,
  Bath,
  Calendar,
  User,
  Phone,
  MessageCircle,
  Share2,
  CheckCircle2,
  Layers,
  Percent,
  Sparkles,
  Key,
  Briefcase,
  Globe,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

export default function AgenceBienDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const bienId = params?.bienId as string

  const [bien, setBien] = useState<any>(null)
  const [visites, setVisites] = useState<any[]>([])
  const [baux, setBaux] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [offres, setOffres] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'apercu' | 'matching' | 'visites' | 'bail' | 'offres'>('apercu')
  const [publishing, setPublishing] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  async function chargerDonnees() {
    try {
      setLoading(true)
      const headers = getImmoAuthHeaders()

      const [resBien, resMatch, resOffres] = await Promise.all([
        fetch(`/api/biens/agence/${slug}/${bienId}`, { headers }),
        fetch(`/api/biens/agence/${slug}/${bienId}/matching`, { headers }),
        fetch(`/api/offres-immo/agence/${slug}?bien_id=${bienId}`, { headers }),
      ])

      const [dB, dM, dO] = await Promise.all([resBien.json(), resMatch.json(), resOffres.json()])

      if (dB.success) {
        setBien(dB.bien)
        setVisites(dB.visites || [])
        setBaux(dB.baux || [])
      }
      if (dM.success) setMatches(dM.prospects_matches || [])
      if (dO.success) setOffres(dO.offres || [])
    } catch (err) {
      console.error('[LOAD_BIEN_DETAIL_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug && bienId) chargerDonnees()
  }, [slug, bienId])

  async function handleTogglePublication() {
    try {
      setPublishing(true)
      const res = await fetch(`/api/biens/agence/${slug}/${bienId}/publier`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setToastMsg('Statut de publication mis à jour sur la marketplace !')
        chargerDonnees()
        setTimeout(() => setToastMsg(null), 3500)
      }
    } catch (err) {
      console.error('[PUB_ERR]', err)
    } finally {
      setPublishing(false)
    }
  }

  if (loading && !bien) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
        Chargement de la fiche 360° du bien…
      </div>
    )
  }

  if (!bien) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h3 style={{ color: '#0f172a' }}>Bien introuvable</h3>
        <Link href={`/agence/${slug}/biens`} style={{ color: 'var(--accent, #C75B00)', textDecoration: 'none', fontWeight: 700 }}>
          ← Retour au portefeuille
        </Link>
      </div>
    )
  }

  const isPublie = Boolean(bien.annonce_publiee_id && bien.annonce_publiee_actif)
  const isLocation = Boolean(bien.prix_location)
  const prix = bien.prix_location || bien.prix_vente || 0

  return (
    <div style={{ maxWidth: 1150, margin: '0 auto', paddingBottom: 40 }}>
      {/* Navigation fil d'Ariane */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link
          href={`/agence/${slug}/biens`}
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
          <span>Portefeuille Biens</span>
        </Link>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <span style={{ fontSize: 12.5, color: '#334155', fontWeight: 600 }}>{bien.reference || 'Bien'}</span>
      </div>

      {toastMsg && (
        <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#15803d', fontSize: 13, marginBottom: 16 }}>
          {toastMsg}
        </div>
      )}

      {/* Carte En-tête Principale */}
      <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 6,
                background: isLocation ? '#e0f2fe' : '#fef3c7',
                color: isLocation ? '#0369a1' : '#92400e',
              }}>
                {isLocation ? 'Location' : 'Vente'}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 6,
                background: bien.statut === 'actif' ? '#f0fdf4' : '#f1f5f9',
                color: bien.statut === 'actif' ? '#166534' : '#475569',
              }}>
                {bien.statut === 'actif' ? 'Actif au portefeuille' : bien.statut}
              </span>
              {bien.statut_occupation && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#f8fafc', color: '#64748b' }}>
                  {bien.statut_occupation}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '8px 0 4px', color: 'var(--navy, #1C2B4A)' }}>
              {bien.titre}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13 }}>
              <MapPin size={14} />
              <span>{bien.adresse ? `${bien.adresse}, ` : ''}{bien.quartier ? `${bien.quartier}, ` : ''}{bien.ville}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--price, #0A5C36)' }}>
              {Number(prix).toLocaleString('fr-FR')} FCFA
              {isLocation && <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}> / mois</span>}
            </div>

            <button
              type="button"
              onClick={handleTogglePublication}
              disabled={publishing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: isPublie ? '#f0fdf4' : 'var(--accent, #C75B00)',
                color: isPublie ? '#15803d' : '#fff',
                border: isPublie ? '1px solid #bbf7d0' : 'none',
                borderRadius: 8,
                padding: '7px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: publishing ? 'not-allowed' : 'pointer',
              }}
            >
              <Globe size={13} />
              <span>{publishing ? 'Patientez…' : isPublie ? 'En ligne sur Marketplace ✓' : 'Publier sur Marketplace'}</span>
            </button>
          </div>
        </div>

        {/* Mini Grille Specs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 18, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Maximize2 size={16} color="#64748b" />
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Surface</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{bien.surface_m2 ? `${bien.surface_m2} m²` : 'Non précisé'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BedDouble size={16} color="#64748b" />
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Chambres</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{bien.nb_chambres || 1} ch.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bath size={16} color="#64748b" />
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Salles de bain</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{bien.nb_sdb || 1} sdb</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="var(--accent, #C75B00)" />
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Matching IA</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--accent, #C75B00)' }}>{matches.length} acquéreur(s)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets de la Fiche 360° */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #e2e8f0', marginBottom: 20, overflowX: 'auto' }}>
        {[
          { key: 'apercu', label: 'Aperçu & Médias' },
          { key: 'matching', label: `Matching Prospects (${matches.length})` },
          { key: 'visites', label: `Visites (${visites.length})` },
          { key: 'bail', label: `Bail & Locataire (${baux.length})` },
          { key: 'offres', label: `Offres reçues (${offres.length})` },
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
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu de l'onglet actif */}
      {activeTab === 'apercu' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: 'var(--navy, #1C2B4A)' }}>
              Description & Prestations
            </h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-line' }}>
              {bien.description || 'Aucune description rédigée.'}
            </p>

            <h4 style={{ fontSize: 14, fontWeight: 700, margin: '20px 0 10px', color: 'var(--navy, #1C2B4A)' }}>
              Équipements & Atouts
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {bien.climatisation && <span style={{ padding: '4px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}>❄️ Climatisation</span>}
              {bien.parking && <span style={{ padding: '4px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}>🚗 Parking réservé</span>}
              {bien.gardien && <span style={{ padding: '4px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}>🛡️ Gardiennage 24/7</span>}
              {bien.ascenseur && <span style={{ padding: '4px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}>🛗 Ascenseur</span>}
              {bien.piscine && <span style={{ padding: '4px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}>🏊 Piscine</span>}
              {bien.meuble && <span style={{ padding: '4px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}>🛋️ Meublé</span>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', color: 'var(--navy, #1C2B4A)' }}>
                Propriétaire Bailleur
              </h4>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                {bien.proprietaire_nom || 'Direct Agence'}
              </div>
              {bien.proprietaire_tel && (
                <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>
                  {bien.proprietaire_tel}
                </div>
              )}
            </div>

            <div style={{ background: '#fff', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', color: 'var(--navy, #1C2B4A)' }}>
                Agent Référent
              </h4>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                {bien.agent_nom || 'Non assigné'}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'matching' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: 'var(--navy, #1C2B4A)' }}>
            Prospects Qualifiés & Intéressés ({matches.length})
          </h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
            Rapprochement calculé selon le budget, la zone géographique ciblée et le type d&apos;opération.
          </p>

          {matches.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>
              Aucun prospect ne correspond exactement aux critères actuels de ce bien.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {matches.map((m: any) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{m.nom}</span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: 6,
                        background: '#f0fdf4',
                        color: '#15803d',
                        fontWeight: 800,
                        fontSize: 11,
                      }}>
                        {m.score_matching}% Match
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                      Budget max : {Number(m.budget_max || 0).toLocaleString('fr-FR')} FCFA · Tél : {m.telephone || 'Non renseigné'}
                    </div>
                    {m.raisons && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {m.raisons.map((r: string, idx: number) => (
                          <span key={idx} style={{ fontSize: 10.5, padding: '1px 6px', background: '#e2e8f0', borderRadius: 4, color: '#475569' }}>
                            ✓ {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {m.telephone && (
                      <a
                        href={`https://wa.me/${m.telephone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${m.nom}, j'ai un bien qui correspond exactement à votre recherche : ${bien.titre} à ${bien.quartier}. Souhaitez-vous le visiter ?`)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: '#25D366',
                          color: '#fff',
                          padding: '6px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        <MessageCircle size={13} />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'visites' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', color: 'var(--navy, #1C2B4A)' }}>
            Historique des Visites Réalisées ({visites.length})
          </h3>
          {visites.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>
              Aucune visite programmée pour ce bien.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visites.map(v => (
                <div key={v.id} style={{ padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{v.contact_nom}</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(v.date_visite).toLocaleString('fr-FR')}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                    Statut : {v.statut} {v.notes ? `· Notes : ${v.notes}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bail' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', color: 'var(--navy, #1C2B4A)' }}>
            Bail Actif & Locataire en Titre
          </h3>
          {baux.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>
              Ce bien n&apos;a aucun contrat de bail actif enregistré.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {baux.map(b => (
                <div key={b.id} style={{ padding: 14, borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#166534' }}>
                    Locataire : {b.locataire_nom} {b.locataire_prenom || ''}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#334155', marginTop: 4 }}>
                    Loyer mensuel : {Number(b.loyer_mensuel).toLocaleString('fr-FR')} FCFA · Échéance chaque {b.jour_echeance || 5} du mois
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
            Offres d&apos;Achat et Propositions ({offres.length})
          </h3>
          {offres.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>
              Aucune offre d&apos;achat ou de location déposée pour le moment.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {offres.map(o => (
                <div key={o.id} style={{ padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{Number(o.montant).toLocaleString('fr-FR')} FCFA</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Par {o.contact_nom} · Statut: {o.statut}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
