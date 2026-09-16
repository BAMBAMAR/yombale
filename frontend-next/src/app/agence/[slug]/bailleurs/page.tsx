'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  UserCheck,
  Plus,
  Phone,
  Mail,
  CheckCircle2,
  FileText,
  MessageCircle,
  Pencil,
} from 'lucide-react'
import { getImmoAuthHeaders, getImmoAuthToken } from '@/lib/immo-auth'
import { ModalEditerBailleur, BailleurEditData } from './components/ModalEditerBailleur'
import { ModalNouveauBailleur } from './components/ModalNouveauBailleur'

interface Proprietaire {
  id: string
  nom: string
  prenom?: string
  telephone?: string
  whatsapp?: string
  email?: string
  type_bailleur: string
  adresse?: string
  iban?: string
  notes?: string
  nb_biens_total: number
  nb_biens_loues: number
}

export default function BailleursPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [proprietaires, setProprietaires] = useState<Proprietaire[]>([])
  const [loading, setLoading] = useState(true)
  const [showModalNouveau, setShowModalNouveau] = useState(false)
  const [bailleurAEditer, setBailleurAEditer] = useState<BailleurEditData | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const token = getImmoAuthToken()

  async function chargerBailleurs() {
    try {
      setLoading(true)
      const res = await fetch(`/api/crm-immo/agence/${slug}/proprietaires`, {
        headers: getImmoAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setProprietaires(data.proprietaires || [])
      }
    } catch (err) {
      console.error('[LOAD_BAILLEURS_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerBailleurs()
  }, [slug])

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Bailleurs & Propriétaires</h1>
          <p className="agence-subtitle">Gérez les propriétaires mandants et leurs biens confiés à l'agence.</p>
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
          Ajouter un propriétaire
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

      {/* ── Liste des Bailleurs ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des propriétaires mandants...</p>
        </div>
      ) : proprietaires.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <UserCheck size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucun propriétaire enregistré</p>
          <p style={{ fontSize: 13.5 }}>Enregistrez vos bailleurs pour rattacher leurs biens et mandats de gestion.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {proprietaires.map(p => {
            const decomptePdfUrl = `/api/agences/agence/${slug}/documents/decompte-bailleur/${p.id}.pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`

            return (
              <div
                key={p.id}
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
                      <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 15.5 }}>
                        {p.nom} {p.prenom || ''}
                      </div>
                      <span style={{ fontSize: 12, color: '#64748B', textTransform: 'capitalize', fontWeight: 500 }}>
                        {p.type_bailleur || 'Particulier'}
                      </span>
                    </div>
                    <div
                      style={{
                        padding: '4px 8px',
                        borderRadius: 8,
                        background: '#FAF8F5',
                        border: '1px solid var(--border, #E8DDD2)',
                        fontSize: 12,
                        fontWeight: 750,
                        color: 'var(--navy, #1C2B4A)',
                      }}
                    >
                      {p.nb_biens_total} bien(s)
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: '#475569', marginBottom: 14 }}>
                    {p.telephone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={13} color="var(--navy, #1C2B4A)" />
                        <a href={`tel:${p.telephone}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>
                          {p.telephone}
                        </a>
                      </div>
                    )}
                    {p.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={13} color="#64748B" />
                        <span style={{ color: '#64748B' }}>{p.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Barre d'Actions Bailleurs */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr 1fr auto',
                    gap: 6,
                    paddingTop: 12,
                    borderTop: '1px solid var(--border, #E8DDD2)',
                    alignItems: 'center',
                  }}
                >
                  {/* Modifier */}
                  <button
                    type="button"
                    onClick={() => setBailleurAEditer(p)}
                    title="Modifier les coordonnées"
                    style={{
                      padding: '7px 9px',
                      borderRadius: 6,
                      background: '#F8F5F0',
                      border: '1px solid var(--border, #E8DDD2)',
                      color: 'var(--navy, #1C2B4A)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Pencil size={13} />
                  </button>

                  {/* Décompte PDF Officiel */}
                  <a
                    href={decomptePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Générer le Décompte de Gestion officiel PDF"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '7px 8px',
                      borderRadius: 6,
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      color: 'var(--navy, #1C2B4A)',
                      fontSize: 11.5,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <FileText size={12} />
                    <span>Décompte</span>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/${(p.whatsapp || p.telephone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Bonjour ${p.nom}, ceci est un message de votre agence concernant la gestion de vos biens immobiliers.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '7px 8px',
                      borderRadius: 6,
                      background: 'rgba(22, 163, 74, 0.08)',
                      color: '#166534',
                      fontWeight: 700,
                      fontSize: 11.5,
                      textDecoration: 'none',
                      border: '1px solid rgba(22, 163, 74, 0.2)',
                    }}
                  >
                    <MessageCircle size={12} />
                    <span>WhatsApp</span>
                  </a>

                  {/* Téléphone */}
                  {p.telephone ? (
                    <a
                      href={`tel:${p.telephone}`}
                      title="Appeler directement"
                      style={{
                        padding: '7px 9px',
                        borderRadius: 6,
                        background: 'rgba(28, 43, 74, 0.06)',
                        border: '1px solid rgba(28, 43, 74, 0.12)',
                        color: 'var(--navy, #1C2B4A)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                      }}
                    >
                      <Phone size={13} />
                    </a>
                  ) : (
                    <div />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modale Ajout Propriétaire ── */}
      <ModalNouveauBailleur
        slug={slug}
        isOpen={showModalNouveau}
        onClose={() => setShowModalNouveau(false)}
        onSuccess={() => {
          setToastMsg('Propriétaire bailleur enregistré avec succès !')
          chargerBailleurs()
          setTimeout(() => setToastMsg(null), 4000)
        }}
      />

      {/* ── Modale Édition Propriétaire ── */}
      <ModalEditerBailleur
        slug={slug}
        bailleur={bailleurAEditer}
        isOpen={!!bailleurAEditer}
        onClose={() => setBailleurAEditer(null)}
        onSuccess={() => {
          setToastMsg('Propriétaire bailleur mis à jour avec succès !')
          chargerBailleurs()
          setTimeout(() => setToastMsg(null), 4000)
        }}
      />
    </div>
  )
}
