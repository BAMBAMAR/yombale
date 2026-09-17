'use client'

import React from 'react'
import Link from 'next/link'
import { Scale } from 'lucide-react'
import { fcfa } from '@/lib/format'
import BlocAgenceAnnonce, { AgenceInfo, AgentInfo } from './BlocAgenceAnnonce'
import SponsoringImmoBtn from './SponsoringImmoBtn'
import BadgePaySafe from '@/components/BadgePaySafe'

interface FicheImmoSidebarProps {
  annonce: {
    id: string
    titre: string
    prix: number | null
    transaction: string | null
    surface_m2: number | null
    nb_pieces: number | null
    nb_chambres: number | null
    quartier: string | null
    ville: string | null
    type_bien: string | null
    contact_tel: string | null
    contact_nom: string | null
    url_source: string | null
    source?: string | null
    sponsorisee_jusqu_au: string | null
    agence?: AgenceInfo | null
    agent?: AgentInfo | null
  }
  similaires: Array<{ id: string }>
  idsComparaison: string
  prixM2: number | null
  localisation: string | null
  isOwner: boolean
  isSponsorise: boolean
  session: { userId: string } | null
  settings: Record<string, string>
}

export default function FicheImmoSidebar({
  annonce,
  similaires,
  idsComparaison,
  prixM2,
  localisation,
  isOwner,
  isSponsorise,
  session,
  settings,
}: FicheImmoSidebarProps) {
  return (
    <aside className="fiche-sidebar">
      <div className="sidebar-card" style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}>
        <p className="sidebar-titre" style={{ color: 'var(--text3)' }}>RÉSUMÉ</p>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text1)', lineHeight: 1.4, marginBottom: 16 }}>
          {annonce.titre}
        </p>

        <div className="sidebar-ligne" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
          <span>Prix</span>
          <strong style={{ color: 'var(--text1)' }}>
            {fcfa(annonce.prix)}{annonce.transaction?.toLowerCase().includes('locat') ? ' /mois' : ''}
          </strong>
        </div>
        {prixM2 && (
          <div className="sidebar-ligne" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
            <span>Prix / m²</span>
            <strong style={{ color: 'var(--text1)' }}>{fcfa(prixM2)}</strong>
          </div>
        )}
        {annonce.surface_m2 && (
          <div className="sidebar-ligne" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
            <span>Surface</span>
            <strong style={{ color: 'var(--text1)' }}>{annonce.surface_m2} m²</strong>
          </div>
        )}
        {annonce.nb_pieces && (
          <div className="sidebar-ligne" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
            <span>Pièces</span>
            <strong style={{ color: 'var(--text1)' }}>{annonce.nb_pieces}</strong>
          </div>
        )}
        {annonce.nb_chambres && (
          <div className="sidebar-ligne" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
            <span>Chambres</span>
            <strong style={{ color: 'var(--text1)' }}>{annonce.nb_chambres}</strong>
          </div>
        )}
        {localisation && (
          <div className="sidebar-ligne" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
            <span>Localisation</span>
            <strong style={{ color: 'var(--text1)' }}>{localisation}</strong>
          </div>
        )}
        {annonce.transaction && (
          <div className="sidebar-ligne" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
            <span>Transaction</span>
            <strong style={{ color: 'var(--text1)' }}>{annonce.transaction === 'vente' ? 'Vente' : 'Location'}</strong>
          </div>
        )}

        {similaires.length > 0 && (
          <Link
            href={`/immo/comparaison?ids=${idsComparaison}`}
            className="sidebar-cta"
            style={{ background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Scale size={16} />
            <span>Comparaison détaillée côte à côte</span>
          </Link>
        )}

        {/* Sceau de confiance Nopalou Pay Safe Immo — UNIQUEMENT pour agences Nopalou certifiées */}
        {annonce.agence?.id && (
          <div style={{ marginTop: 14, marginBottom: 12 }}>
            <BadgePaySafe type="immo" compact={true} />
          </div>
        )}

        {/* Carte Agence Certifiée ou Vendeur Particulier */}
        <BlocAgenceAnnonce
          annonceId={annonce.id}
          titre={annonce.titre}
          prix={annonce.prix}
          transaction={annonce.transaction}
          quartier={annonce.quartier}
          ville={annonce.ville}
          typeBien={annonce.type_bien}
          contactTel={annonce.contact_tel}
          contactNom={annonce.contact_nom}
          agence={annonce.agence || null}
          agent={annonce.agent || null}
          urlSource={annonce.url_source || null}
          source={annonce.source || null}
        />

        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--bg, #F8F5F0)', border: '1px solid var(--border, #E8DDD2)', fontSize: '0.76rem', color: '#64748B', textAlign: 'center', lineHeight: '1.4' }}>
          Pour retirer ce bien ou votre numéro : envoyez &quot;supprimer&quot; sur <a href="https://wa.me/221708717942" target="_blank" rel="noopener noreferrer" style={{ color: '#25d366', fontWeight: 600, textDecoration: 'underline' }}>WhatsApp</a> ou <a href="/cgu#suppression-donnees" style={{ color: 'var(--navy, #1C2B4A)', textDecoration: 'underline' }}>consultez les CGU</a>.
        </div>

        {/* Lien source */}
        {annonce.url_source && (
          <a
            href={annonce.url_source}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              textAlign: 'center',
              background: 'var(--blue)',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              marginTop: 16,
            }}
          >
            Voir l&apos;annonce originale →
          </a>
        )}

        {/* Actions du propriétaire */}
        {isOwner && (
          <div style={{ marginTop: 16 }}>
            {isSponsorise ? (
              <div style={{ padding: '14px 18px', background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 10, marginBottom: 12 }}>
                <p style={{ fontWeight: 700, color: '#854D0E' }}>
                  Mise en avant active jusqu&apos;au{' '}
                  {new Date(annonce.sponsorisee_jusqu_au!).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ) : (
              session && <SponsoringImmoBtn immoId={annonce.id} userId={session.userId} settings={settings} />
            )}
            <Link
              href={`/mes-annonces-immo/${annonce.id}/modifier`}
              style={{
                display: 'block',
                textAlign: 'center',
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                marginTop: 10,
              }}
            >
              Modifier ou Supprimer ce bien
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
