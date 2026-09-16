'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  UserCheck,
  Plus,
  Phone,
  MessageCircle,
  Pencil,
  CheckCircle2,
  Search,
} from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'
import { ModalNouveauLocataire, BienOption } from './components/ModalNouveauLocataire'
import { ModalEditerLocataire, LocataireEditData } from './components/ModalEditerLocataire'

interface LocataireItem {
  id: string
  nom: string
  prenom?: string
  telephone?: string
  whatsapp?: string
  email?: string
  profession?: string
  notes?: string
  bail_id?: string
  bien_titre?: string
  bien_quartier?: string
  bien_ville?: string
  loyer_mensuel?: number
  jour_echeance?: number
  date_debut?: string
  statut_paiement?: string
  nb_impayes?: number
}

export default function LocatairesPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [locataires, setLocataires] = useState<LocataireItem[]>([])
  const [biensDispo, setBiensDispo] = useState<BienOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModalNouveau, setShowModalNouveau] = useState(false)
  const [locataireAEditer, setLocataireAEditer] = useState<LocataireEditData | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  async function chargerLocataires() {
    try {
      setLoading(true)
      const res = await fetch(`/api/crm-immo/agence/${slug}/contacts?type_contact=locataire`, {
        headers: getImmoAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setLocataires(data.contacts || [])
      }
    } catch (err) {
      console.error('[LOAD_LOCATAIRES_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  async function chargerBiens() {
    try {
      const res = await fetch(`/api/biens/agence/${slug}?statut=actif`, {
        headers: getImmoAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setBiensDispo(data.biens || [])
      }
    } catch (err) {
      console.error('[LOAD_BIENS_ERR]', err)
    }
  }

  useEffect(() => {
    if (slug) {
      chargerLocataires()
      chargerBiens()
    }
  }, [slug])

  const locatairesFiltres = locataires.filter(l => {
    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()
    return (
      l.nom.toLowerCase().includes(q) ||
      (l.prenom && l.prenom.toLowerCase().includes(q)) ||
      (l.telephone && l.telephone.includes(q))
    )
  })

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Gestion des Locataires</h1>
          <p className="agence-subtitle">Répertoire des locataires sous contrat, suivi des baux et contacts directs.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowModalNouveau(true)}
          className="btn-npl"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          Nouveau locataire
        </button>
      </div>

      {toastMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#DCFCE7',
            color: '#166534',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <CheckCircle2 size={18} />
          {toastMsg}
        </div>
      )}

      {/* ── Recherche ── */}
      <div className="agence-card" style={{ padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ padding: '8px 12px', width: '100%' }}
          />
        </div>
      </div>

      {/* ── Liste des Locataires ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des locataires...</p>
        </div>
      ) : locatairesFiltres.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <UserCheck size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucun locataire enregistré</p>
          <p style={{ fontSize: 13.5 }}>Ajoutez votre premier locataire pour démarrer le suivi des loyers et quittances.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {locatairesFiltres.map(loc => (
            <div
              key={loc.id}
              className="agence-card"
              style={{
                padding: 18,
                marginBottom: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid var(--border, #E8DDD2)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>
                      {loc.nom} {loc.prenom || ''}
                    </div>
                    {loc.profession && (
                      <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{loc.profession}</span>
                    )}
                  </div>
                  <span className="status-badge actif">Locataire Actif</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#475569', marginBottom: 14 }}>
                  {loc.telephone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={13} color="var(--navy, #1C2B4A)" />
                      <a href={`tel:${loc.telephone}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>
                        {loc.telephone}
                      </a>
                    </div>
                  )}
                  {loc.whatsapp && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MessageCircle size={13} color="#16a34a" />
                      <a
                        href={`https://wa.me/${loc.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}
                      >
                        WhatsApp Direct
                      </a>
                    </div>
                  )}
                  {loc.email && (
                    <div style={{ fontSize: 12.5, color: '#64748B' }}>
                      {loc.email}
                    </div>
                  )}
                </div>
              </div>

              {/* Barre d'Actions complètes */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr 1fr',
                  gap: 8,
                  paddingTop: 12,
                  borderTop: '1px solid var(--border, #E8DDD2)',
                }}
              >
                {/* Bouton Modifier */}
                <button
                  type="button"
                  onClick={() => setLocataireAEditer(loc)}
                  title="Modifier les coordonnées"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: '#F8F5F0',
                    color: 'var(--navy, #1C2B4A)',
                    border: '1px solid var(--border, #E8DDD2)',
                    cursor: 'pointer',
                  }}
                >
                  <Pencil size={14} />
                </button>

                {/* Bouton Téléphone */}
                {loc.telephone ? (
                  <a
                    href={`tel:${loc.telephone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      padding: '8px',
                      borderRadius: 6,
                      background: 'rgba(28, 43, 74, 0.06)',
                      color: 'var(--navy, #1C2B4A)',
                      fontWeight: 700,
                      fontSize: 12,
                      textDecoration: 'none',
                      border: '1px solid rgba(28, 43, 74, 0.12)',
                    }}
                  >
                    <Phone size={13} />
                    Appeler
                  </a>
                ) : (
                  <div />
                )}

                {/* Bouton WhatsApp */}
                <a
                  href={`https://wa.me/${(loc.whatsapp || loc.telephone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Bonjour ${loc.nom}, ceci est un message de votre agence immobilière concernant votre bail locatif.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    padding: '8px',
                    borderRadius: 6,
                    background: 'rgba(22, 163, 74, 0.08)',
                    color: '#166534',
                    fontWeight: 700,
                    fontSize: 12,
                    textDecoration: 'none',
                    border: '1px solid rgba(22, 163, 74, 0.2)',
                  }}
                >
                  <MessageCircle size={13} />
                  WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modale Création Locataire ── */}
      <ModalNouveauLocataire
        slug={slug}
        isOpen={showModalNouveau}
        biensDispo={biensDispo}
        onClose={() => setShowModalNouveau(false)}
        onSuccess={() => {
          setToastMsg('Nouveau locataire enregistré avec succès !')
          chargerLocataires()
          setTimeout(() => setToastMsg(null), 4000)
        }}
      />

      {/* ── Modale Édition Locataire ── */}
      <ModalEditerLocataire
        slug={slug}
        locataire={locataireAEditer}
        isOpen={!!locataireAEditer}
        onClose={() => setLocataireAEditer(null)}
        onSuccess={() => {
          setToastMsg('Locataire mis à jour avec succès !')
          chargerLocataires()
          setTimeout(() => setToastMsg(null), 4000)
        }}
      />
    </div>
  )
}
