'use client'

import React, { useState, useEffect } from 'react'
import {
  Share2,
  MessageCircle,
  Send,
  CheckCircle2,
  XCircle,
  Save,
  Globe,
  Radio,
  ExternalLink,
  Smartphone,
  Sparkles,
  RefreshCw,
} from 'lucide-react'

interface CanauxConfig {
  whatsapp_numero: string
  whatsapp_statut: string
  telegram_channel: string
  facebook_page: string
  instagram_compte: string
  twitter_compte: string
  tiktok_compte: string
  templates_messages: {
    bienvenue: string
    briefing_matin: string
    alerte_concours: string
    alerte_trafic: string
  }
}

export default function AdminReseauxTab() {
  const [config, setConfig] = useState<CanauxConfig>({
    whatsapp_numero: '+221 77 845 00 00',
    whatsapp_statut: 'connecte',
    telegram_channel: 'https://t.me/surga_senegal',
    facebook_page: 'https://facebook.com/surga.sn',
    instagram_compte: 'https://instagram.com/surga.sn',
    twitter_compte: 'https://x.com/surga_sn',
    tiktok_compte: 'https://tiktok.com/@surga.sn',
    templates_messages: {
      bienvenue: "As-salamu alaykum ! Je suis Surga, votre assistant personnel de poche au Sénégal. Comment puis-je vous aider aujourd'hui ?",
      briefing_matin: "Bonjour ! Voici votre briefing Surga du jour avec la météo, le trafic et l'essentiel de l'actualité.",
      alerte_concours: "Rappel officiel Surga : le concours auquel vous participez a une échéance proche.",
      alerte_trafic: "Alerte circulation Dakar : perturbation majeure signalée sur votre axe habituel."
    }
  })

  const [chargement, setChargement] = useState(true)
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false)
  const [testEnCours, setTestEnCours] = useState(false)
  const [testTel, setTestTel] = useState('+221 77 123 45 67')
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/surga/canaux')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.canaux) {
          setConfig(data.canaux)
        }
      })
      .catch(() => {})
      .finally(() => setChargement(false))
  }, [])

  const sauvegarderConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSauvegardeEnCours(true)
    try {
      const res = await fetch('/api/admin/surga/canaux', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'succes', texte: 'Configuration des réseaux et canaux enregistrée avec succès.' })
      } else {
        setMessage({ type: 'erreur', texte: 'Impossible d enregistrer la configuration.' })
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Erreur réseau.' })
    } finally {
      setSauvegardeEnCours(false)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  const testerEnvoiWhatsApp = async () => {
    setTestEnCours(true)
    try {
      const res = await fetch('/api/admin/surga/canaux/test-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telephone: testTel,
          message: config.templates_messages.bienvenue,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'succes', texte: data.message })
      } else {
        setMessage({ type: 'erreur', texte: data.error || 'Échec du test.' })
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Erreur lors de la simulation WhatsApp.' })
    } finally {
      setTestEnCours(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {message && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 8,
            backgroundColor: message.type === 'succes' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'succes' ? '#10B981' : '#EF4444',
            border: `1px solid ${message.type === 'succes' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {message.type === 'succes' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{message.texte}</span>
        </div>
      )}

      {/* Bloc 1 : Passerelle & Bot WhatsApp */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: '20px 24px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              <MessageCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                Passerelle &amp; Numéro WhatsApp Officiel Surga
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Canal privilégié pour les commandes vocales, le briefing quotidien et les alertes automatisées.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontSize: 11, fontWeight: 800 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
            <span>Session Connectée &amp; Active</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>
              Numéro de téléphone du bot Surga
            </label>
            <input
              type="text"
              value={config.whatsapp_numero}
              onChange={(e) => setConfig({ ...config, whatsapp_numero: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>
              Tester l envoi vers un mobile sénégalais
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={testTel}
                onChange={(e) => setTestTel(e.target.value)}
                placeholder="+221 77..."
                style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
              <button
                type="button"
                disabled={testEnCours}
                onClick={testerEnvoiWhatsApp}
                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: '#10B981', color: '#FFFFFF', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Send size={13} />
                <span>{testEnCours ? 'Envoi...' : 'Tester'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={sauvegarderConfig} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Bloc 2 : Templates de Messages Automatiques */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: '20px 24px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
            Modèles de Messages Automatiques WhatsApp
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
            Personnalisez le texte transmis automatiquement lors des interactions clés avec les utilisateurs.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>
                Message d accueil / Onboarding
              </label>
              <textarea
                rows={3}
                value={config.templates_messages.bienvenue}
                onChange={(e) => setConfig({
                  ...config,
                  templates_messages: { ...config.templates_messages, bienvenue: e.target.value }
                })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>
                En-tête Briefing Matinal
              </label>
              <textarea
                rows={3}
                value={config.templates_messages.briefing_matin}
                onChange={(e) => setConfig({
                  ...config,
                  templates_messages: { ...config.templates_messages, briefing_matin: e.target.value }
                })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>
                Notification Alerte Concours Officiel
              </label>
              <textarea
                rows={3}
                value={config.templates_messages.alerte_concours}
                onChange={(e) => setConfig({
                  ...config,
                  templates_messages: { ...config.templates_messages, alerte_concours: e.target.value }
                })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>
                Notification Alerte Perturbation Trafic
              </label>
              <textarea
                rows={3}
                value={config.templates_messages.alerte_trafic}
                onChange={(e) => setConfig({
                  ...config,
                  templates_messages: { ...config.templates_messages, alerte_trafic: e.target.value }
                })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
              />
            </div>
          </div>
        </div>

        {/* Bloc 3 : Canaux Sociaux Officiels */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: '20px 24px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
            Canaux Sociaux &amp; Communautés Officielles Surga
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
            Liens intégrés dans l application et le partage de la revue de presse.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Canal Telegram Officiel</label>
              <input type="text" value={config.telegram_channel} onChange={(e) => setConfig({ ...config, telegram_channel: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Page Facebook</label>
              <input type="text" value={config.facebook_page} onChange={(e) => setConfig({ ...config, facebook_page: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Compte Instagram</label>
              <input type="text" value={config.instagram_compte} onChange={(e) => setConfig({ ...config, instagram_compte: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Compte X (Twitter)</label>
              <input type="text" value={config.twitter_compte} onChange={(e) => setConfig({ ...config, twitter_compte: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Compte TikTok</label>
              <input type="text" value={config.tiktok_compte} onChange={(e) => setConfig({ ...config, tiktok_compte: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }} />
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={sauvegardeEnCours}
            style={{
              padding: '10px 22px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#0B132B',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Save size={15} color="#F59E0B" />
            <span>{sauvegardeEnCours ? 'Enregistrement...' : 'Enregistrer les canaux & templates'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
