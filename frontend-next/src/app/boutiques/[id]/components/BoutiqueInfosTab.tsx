'use client'

import React from 'react'
import { Info, Check, Globe, Phone, MessageCircle, MapPin, Clock } from 'lucide-react'
import AvisClients from '@/components/AvisClients'
import { BoutiqueData } from './types'

interface BoutiqueInfosTabProps {
  boutique: BoutiqueData
}

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const HORAIRES_KEYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

export default function BoutiqueInfosTab({ boutique }: BoutiqueInfosTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Bloc À Propos */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 12,
            flexWrap: 'wrap',
          }}
        >
          <p
            style={{
              fontWeight: 900,
              margin: 0,
              fontSize: 15,
              color: 'var(--accent, #C75B00)',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Info size={18} /> À propos de {boutique.nom}
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '4px 12px',
              borderRadius: 20,
            }}
          >
            <Check size={14} style={{ color: '#16a34a', strokeWidth: 3 }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#15803d' }}>Vendeur Vérifié Nopalou</span>
          </div>
        </div>

        <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.7, color: '#334155' }}>
          {boutique.description ||
            `Bienvenue sur la boutique officielle de ${boutique.nom} sur Nopalou. Retrouvez tout notre catalogue de produits au Sénégal, comparez nos prix et contactez-nous directement.`}
        </p>

        {/* Réseaux Sociaux & Site Web */}
        {(boutique.instagram || boutique.facebook || boutique.tiktok || boutique.youtube || boutique.site_web) && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
            {boutique.instagram && (
              <a
                href={boutique.instagram.startsWith('http') ? boutique.instagram : `https://instagram.com/${boutique.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'linear-gradient(135deg, #fdf2f8, #fff7ed)',
                    border: '1px solid #fbcfe8',
                    padding: '6px 14px',
                    borderRadius: 20,
                    color: '#db2777',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span>Instagram</span>
                </div>
              </a>
            )}
            {boutique.facebook && (
              <a
                href={boutique.facebook.startsWith('http') ? boutique.facebook : `https://facebook.com/${boutique.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    padding: '6px 14px',
                    borderRadius: 20,
                    color: '#1d4ed8',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span>Facebook</span>
                </div>
              </a>
            )}
            {boutique.tiktok && (
              <a
                href={boutique.tiktok.startsWith('http') ? boutique.tiktok : `https://www.tiktok.com/@${boutique.tiktok}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#f8f8f8',
                    border: '1px solid #e2e8f0',
                    padding: '6px 14px',
                    borderRadius: 20,
                    color: '#000',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span>TikTok</span>
                </div>
              </a>
            )}
            {boutique.youtube && (
              <a
                href={boutique.youtube.startsWith('http') ? boutique.youtube : `https://www.youtube.com/@${boutique.youtube}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    padding: '6px 14px',
                    borderRadius: 20,
                    color: '#dc2626',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span>YouTube</span>
                </div>
              </a>
            )}
            {boutique.site_web && (
              <a
                href={boutique.site_web.startsWith('http') ? boutique.site_web : `https://${boutique.site_web}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    padding: '6px 14px',
                    borderRadius: 20,
                    color: '#334155',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <Globe size={14} />
                  <span>Site Web Officiel</span>
                </div>
              </a>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 20 }}>
        {/* Carte Contact & Adresse */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 16,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          }}
        >
          <p style={{ fontWeight: 900, margin: 0, fontSize: 15, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Phone size={18} style={{ color: 'var(--accent, #C75B00)' }} /> Coordonnées & Contact
          </p>

          {boutique.adresse && (
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                background: '#f8fafc',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid #f1f5f9',
              }}
            >
              <MapPin size={20} style={{ color: 'var(--accent, #C75B00)', marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{boutique.adresse}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b', fontWeight: 600 }}>Ville : {boutique.ville}</p>
              </div>
            </div>
          )}

          {boutique.telephone && (
            <a href={`tel:${boutique.telephone}`} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#eff6ff',
                  borderRadius: 12,
                  padding: '12px 16px',
                  border: '1px solid #dbeafe',
                  transition: 'transform 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Phone size={20} style={{ color: '#1d4ed8' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: '#2563eb', fontWeight: 800, letterSpacing: '0.05em' }}>TÉLÉPHONE DIRECT</p>
                    <p style={{ margin: 0, fontSize: 15, color: '#1d4ed8', fontWeight: 900 }}>{boutique.telephone}</p>
                  </div>
                </div>
                <span style={{ fontSize: 12, background: '#1d4ed8', color: '#fff', padding: '4px 10px', borderRadius: 20, fontWeight: 800 }}>Appeler</span>
              </div>
            </a>
          )}

          {boutique.whatsapp && (
            <a href={`https://wa.me/${boutique.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f0fdf4',
                  borderRadius: 12,
                  padding: '12px 16px',
                  border: '1px solid #dcfce7',
                  transition: 'transform 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <MessageCircle size={20} style={{ color: '#16a34a' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: '#16a34a', fontWeight: 800, letterSpacing: '0.05em' }}>WHATSAPP PRO</p>
                    <p style={{ margin: 0, fontSize: 15, color: '#15803d', fontWeight: 900 }}>{boutique.whatsapp}</p>
                  </div>
                </div>
                <span style={{ fontSize: 12, background: '#25d366', color: '#fff', padding: '4px 10px', borderRadius: 20, fontWeight: 800 }}>Discuter</span>
              </div>
            </a>
          )}
        </div>

        {/* Carte Horaires */}
        {boutique.horaires && Object.keys(boutique.horaires).length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <p style={{ fontWeight: 900, margin: '0 0 16px', fontSize: 15, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} style={{ color: '#2563eb' }} /> Horaires d&apos;ouverture
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {HORAIRES_KEYS.map((key, i) => {
                const val = boutique.horaires?.[key]
                if (!val) return null
                const isToday = new Date().getDay() === (i === 6 ? 0 : i + 1)
                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '9px 14px',
                      borderRadius: 10,
                      background: isToday ? '#fff7f0' : '#f8fafc',
                      border: isToday ? '1.5px solid #ffedd5' : '1px solid #f1f5f9',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: isToday ? 900 : 700, color: isToday ? 'var(--accent, #C75B00)' : '#334155' }}>
                      {JOURS[i]} {isToday && " — Aujourd'hui"}
                    </span>
                    <span style={{ fontSize: 13, color: val.toLowerCase().includes('fermé') ? '#dc2626' : '#16a34a', fontWeight: 800 }}>
                      {val}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <AvisClients boutiqueId={boutique.id} />
    </div>
  )
}
