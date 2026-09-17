'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/context/ToastContext'
import {
  Store,
  Layers,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Code2,
  Share2,
  TrendingUp,
  MessageCircle,
  CreditCard,
  ShieldCheck,
  Cpu
} from 'lucide-react'

interface AppPlugin {
  id: string
  nom: string
  categorie: 'marketing' | 'paiement' | 'automatisation' | 'logistique'
  description: string
  actif: boolean
  statutLabel: string
  champCle?: string
  valeurCle?: string
  placeholderCle?: string
  aideUrl?: string
}

export default function AppStoreBoutique({
  boutiqueId,
  initialMetaPixel = '',
  initialTiktokPixel = '',
  initialGa4 = ''
}: {
  boutiqueId: string
  initialMetaPixel?: string
  initialTiktokPixel?: string
  initialGa4?: string
}) {
  const [metaPixel, setMetaPixel] = useState(initialMetaPixel)
  const [tiktokPixel, setTiktokPixel] = useState(initialTiktokPixel)
  const [ga4, setGa4] = useState(initialGa4)
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const { toast } = useToast()
  const [modalAppActive, setModalAppActive] = useState<string | null>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null

  useEffect(() => {
    // Charger la configuration actuelle des pixels et intégrations
    if (!boutiqueId) return
    fetch(`/api/boutiques/${boutiqueId}/pixels/public`)
      .then(res => res.json())
      .then(data => {
        if (data.meta_pixel_id) setMetaPixel(data.meta_pixel_id)
        if (data.tiktok_pixel_id) setTiktokPixel(data.tiktok_pixel_id)
        if (data.ga4_id) setGa4(data.ga4_id)
      })
      .catch(err => console.warn('[AppStoreBoutique] Erreur chargement pixels:', err))
  }, [boutiqueId])

  const enregistrerIntegrations = async () => {
    setSauvegardeEnCours(true)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/pixels`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          meta_pixel_id: metaPixel.trim(),
          tiktok_pixel_id: tiktokPixel.trim(),
          ga4_id: ga4.trim()
        })
      })
      if (!res.ok) throw new Error('Échec de la sauvegarde')
      toast.success('Paramètres de l’application enregistrés avec succès !')
      setModalAppActive(null)
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde.')
    } finally {
      setSauvegardeEnCours(false)
    }
  }

  const applications: AppPlugin[] = [
    {
      id: 'meta_pixel',
      nom: 'Meta Pixel (Facebook & Instagram)',
      categorie: 'marketing',
      description: 'Suivi des conversions, paniers et ventes pour optimiser vos publicités Facebook Ads et Instagram Shop.',
      actif: !!metaPixel.trim(),
      statutLabel: metaPixel.trim() ? 'Connecté' : 'Non configuré',
      champCle: 'Pixel ID Meta',
      valeurCle: metaPixel,
      placeholderCle: 'Ex: 1234567890123456',
      aideUrl: 'https://business.facebook.com/events_manager'
    },
    {
      id: 'tiktok_pixel',
      nom: 'TikTok Shop & Pixel Analytics',
      categorie: 'marketing',
      description: 'Mesurez le retour sur investissement de vos vidéos TikTok et ciblez les acheteurs à fort pouvoir d’achat.',
      actif: !!tiktokPixel.trim(),
      statutLabel: tiktokPixel.trim() ? 'Connecté' : 'Non configuré',
      champCle: 'TikTok Pixel ID',
      valeurCle: tiktokPixel,
      placeholderCle: 'Ex: C1234567890ABCDEF',
      aideUrl: 'https://ads.tiktok.com'
    },
    {
      id: 'ga4',
      nom: 'Google Analytics 4 (GA4)',
      categorie: 'marketing',
      description: 'Rapports d’audience e-commerce avancés, tunnel d’achat et mesure des canaux d’acquisition trafic.',
      actif: !!ga4.trim(),
      statutLabel: ga4.trim() ? 'Connecté' : 'Non configuré',
      champCle: 'ID de mesure GA4',
      valeurCle: ga4,
      placeholderCle: 'Ex: G-XXXXXXXXXX',
      aideUrl: 'https://analytics.google.com'
    },
    {
      id: 'wave_money',
      nom: 'Wave Sénégal 1-Tap',
      categorie: 'paiement',
      description: 'Passerelle native Wave sans intermédiaire : encaissement direct sur votre compte marchand avec 0% de commission Nopalou.',
      actif: true,
      statutLabel: 'Natif & Actif',
      champCle: 'Passerelle officielle',
    },
    {
      id: 'whatsapp_commerce',
      nom: 'WhatsApp Business Cloud Hub',
      categorie: 'automatisation',
      description: 'Tunnel de commande 1-clic, relances paniers abandonnés automatiques et notifications instantanées avec Meta Cloud API.',
      actif: true,
      statutLabel: 'Natif & Actif',
    },
    {
      id: 'syscohada_erp',
      nom: 'Connecteur ERP SYSCOHADA (Sage / Odoo)',
      categorie: 'automatisation',
      description: 'Exports comptables conformes OHADA Révisé (Débit/Crédit, TVA 18%, Fichier FEC, Sage Saari et Odoo JSON).',
      actif: true,
      statutLabel: 'Prêt à l’emploi',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          background: '#166534', color: '#ffffff', padding: '10px 20px', borderRadius: 10,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <CheckCircle2 size={16} color="#ffffff" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête Hub App Store */}
      <div style={{
        background: 'linear-gradient(135deg, #1C2B4A 0%, #2A3F6D 100%)',
        borderRadius: 16, padding: '24px 28px', color: '#ffffff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
        boxShadow: '0 4px 15px rgba(28, 43, 74, 0.15)'
      }}>
        <div style={{ maxWidth: 650 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            <Sparkles size={12} color="#C75B00" />
            <span>Écosystème & Extensions Marchand</span>
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800 }}>App Store & Connecteurs Nopalou</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#CBD5E1', lineHeight: 1.5 }}>
            Activez vos pixels marketing, outils d’automatisation et connecteurs comptables en un clic pour démultiplier vos ventes et automatiser votre gestion.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#C75B00' }}>{applications.filter(a => a.actif).length}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Apps actives</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#ffffff' }}>0 FCFA</div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Frais d’extension</div>
          </div>
        </div>
      </div>

      {/* Grille des Applications Disponibles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {applications.map(app => {
          const isConfigurable = ['meta_pixel', 'tiktok_pixel', 'ga4'].includes(app.id)

          return (
            <div
              key={app.id}
              style={{
                background: '#ffffff',
                border: app.actif ? '1.5px solid #E8DDD2' : '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: app.categorie === 'marketing' ? '#FFF3E8' : app.categorie === 'paiement' ? '#E6F4EC' : '#EFF6FF',
                    color: app.categorie === 'marketing' ? '#C75B00' : app.categorie === 'paiement' ? '#0A5C36' : '#1C2B4A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {app.categorie === 'marketing' ? <TrendingUp size={20} /> : app.categorie === 'paiement' ? <CreditCard size={20} /> : <Cpu size={20} />}
                  </div>

                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
                    background: app.actif ? '#E6F4EC' : '#F1F5F9',
                    color: app.actif ? '#0A5C36' : '#64748B',
                    border: `1px solid ${app.actif ? '#A7F3D0' : '#E2E8F0'}`
                  }}>
                    {app.statutLabel}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 800, color: '#1C2B4A' }}>{app.nom}</h3>
                <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#5A4E42', lineHeight: 1.45 }}>{app.description}</p>
              </div>

              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#8C7E74', fontWeight: 600, textTransform: 'uppercase' }}>
                  {app.categorie}
                </span>

                {isConfigurable ? (
                  <button
                    type="button"
                    onClick={() => setModalAppActive(app.id)}
                    style={{
                      padding: '7px 14px', borderRadius: 8,
                      border: '1.5px solid #1C2B4A', background: app.actif ? '#FFFFFF' : '#1C2B4A',
                      color: app.actif ? '#1C2B4A' : '#FFFFFF', fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      boxShadow: '0 1px 3px rgba(28, 43, 74, 0.1)'
                    }}
                  >
                    <span>{app.actif ? 'Modifier' : 'Configurer'}</span>
                  </button>
                ) : (
                  <span style={{ fontSize: 12, color: '#0A5C36', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={14} />
                    <span>Inclus au forfait</span>
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modale de Configuration d'une Application */}
      {modalAppActive && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: 16
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 16, padding: '24px',
            width: '100%', maxWidth: 480, boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: '#1C2B4A' }}>
              Configuration : {applications.find(a => a.id === modalAppActive)?.nom}
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: 12.5, color: '#5A4E42' }}>
              Renseignez l’identifiant de suivi fourni par la plateforme pour activer le tracking en direct sur votre vitrine Nopalou.
            </p>

            {modalAppActive === 'meta_pixel' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Pixel ID Meta (Facebook/Instagram)
                </label>
                <input
                  type="text"
                  value={metaPixel}
                  onChange={e => setMetaPixel(e.target.value)}
                  placeholder="Ex: 1234567890123456"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                />
              </div>
            )}

            {modalAppActive === 'tiktok_pixel' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  TikTok Pixel ID
                </label>
                <input
                  type="text"
                  value={tiktokPixel}
                  onChange={e => setTiktokPixel(e.target.value)}
                  placeholder="Ex: C1234567890ABCDEF"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                />
              </div>
            )}

            {modalAppActive === 'ga4' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Google Analytics 4 Measurement ID
                </label>
                <input
                  type="text"
                  value={ga4}
                  onChange={e => setGa4(e.target.value)}
                  placeholder="Ex: G-XXXXXXXXXX"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setModalAppActive(null)}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={enregistrerIntegrations}
                disabled={sauvegardeEnCours}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#C75B00', color: '#FFFFFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
              >
                {sauvegardeEnCours ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
