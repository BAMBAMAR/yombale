'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Share2, Radio, Palette } from 'lucide-react'
import { fcfa } from '@/lib/format'
import {
  KitComProps,
  KitComTab,
  KitComAgentIdentity,
  KitComTabReseaux,
  KitComTabDemarchage,
  KitComTabBattlecard,
  KitComTabApporteur,
  KitComTabWhatsApp,
  KitComTabGenerateur,
} from './components'

const TABS: { id: KitComTab; label: string }[] = [
  { id: 'reseaux', label: 'Réseaux & Contenus' },
  { id: 'demarchage', label: 'Démarchage B2B & POS' },
  { id: 'battlecard', label: 'Kit Terrain & Objections' },
  { id: 'apporteur', label: "Apporteurs d'Affaires" },
  { id: 'whatsapp', label: 'Écosystème WhatsApp' },
  { id: 'generateur', label: 'Générateur Affiches Nopalou' },
]

export default function KitComClient({
  visuels,
  textes,
  postTemplates,
  prixDecouverte,
  prixPro,
  prixBusiness,
  tauxApporteur,
}: KitComProps) {
  const [tab, setTab] = useState<KitComTab>('reseaux')

  // Personnalisation Agent / Apporteur
  const [nomAgent, setNomAgent] = useState('')
  const [phoneAgent, setPhoneAgent] = useState('708717942')
  const [codeAgent, setCodeAgent] = useState('')

  // Notifications Toast
  const [toast, setToast] = useState<string | null>(null)
  const [publiEnCours, setPubliEnCours] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const copyToClipboard = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt)
    showToast(`${label} copié dans le presse-papier !`)
  }

  const handlePublierFb = async (texte: string, imageUrl?: string) => {
    setPubliEnCours(true)
    try {
      const res = await fetch('/admin-proxy/fb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: texte,
          image_url: imageUrl || null,
          publier_instagram: true,
          statut: 'brouillon',
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "Erreur d'envoi")
      }
      showToast('Post transmis au module Publications Facebook (/admin/publications) !')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      showToast(`Impossible d'envoyer le post : ${msg}`)
    } finally {
      setPubliEnCours(false)
    }
  }

  const agentPhoneFormatted = phoneAgent ? `+221 ${phoneAgent}` : '+221 70 871 79 42'
  const agentNameFormatted = nomAgent ? nomAgent : '[Votre Prénom]'
  const agentCodeFormatted = codeAgent ? codeAgent : '[VOTRE_CODE]'

  const scriptOralPerso = `🚨 [ACCROCHE - 15 sec]
"Bonjour ${agentNameFormatted}, partenaire certifié Nopalou. Vous savez, aujourd'hui vos clients comparent tout sur leur téléphone avant d'acheter. Nopalou, c'est l'outil qui vous permet de ne plus jamais rater une vente."

[LA DOULEUR & LA SOLUTION - 30 sec]
"Actuellement, gérer les commandes WhatsApp et tenir un carnet de dettes, c'est un casse-tête. Avec Nopalou, on vous donne une vraie Caisse Enregistreuse sur votre téléphone (qui marche même sans internet) et une Vitrine en ligne automatique. Vous scannez les articles, envoyez les reçus par WhatsApp, et encaissez directement sur votre Wave ou Orange Money."

[OFFRE IRRÉFUSABLE - 15 sec]
"Le 1er mois est 100% OFFERT. Pas besoin de carte bancaire, zéro commission sur vos ventes. Après, c'est à partir de seulement ${fcfa(prixPro)}/mois. C'est l'équivalent d'un bon repas pour digitaliser tout votre commerce."

[APPEL À L'ACTION - 10 sec]
"Je vous active votre mois offert tout de suite ? C'est prêt en 2 minutes. (Renseigner le code : ${agentCodeFormatted})"`

  const apporteurTextePerso = `OPPORTUNITÉ : Devenez Partenaire Nopalou !

Vous avez un réseau de commerçants à Dakar ? Vous cherchez un revenu passif fiable ?
Gagnez ${tauxApporteur}% de commission RÉCURRENTE sur chaque abonnement. Pas une seule fois, mais CHAQUE MOIS à vie !

Ce que vous gagnez :
- ${fcfa(Math.round((prixPro * tauxApporteur) / 100))} à ${fcfa(Math.round((prixBusiness * tauxApporteur) / 100))}/mois par boutique active.
- Paiement garanti le 5 du mois via Wave ou OM.
- 0 investissement de départ.

Vente facile :
Le 1er mois est 100% offert pour le commerçant. Vous n'avez qu'à partager votre code : *${agentCodeFormatted}*

Intéressé(e) ? Contactez-moi (${agentNameFormatted}) sur WhatsApp au ${agentPhoneFormatted} pour obtenir votre Kit de Démarrage.`

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px', fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}>
      {/* Barre d'onglets Social Media Unifiée */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, flexWrap: 'wrap' }}>
        <Link
          href="/admin/publications"
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
            background: '#f8fafc',
            color: '#475569',
            border: '1px solid #cbd5e1',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Share2 size={15} />
          Publications & Posts Meta
        </Link>
        <Link
          href="/admin/integrations"
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
            background: '#f8fafc',
            color: '#475569',
            border: '1px solid #cbd5e1',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Radio size={15} />
          Connecteurs & Pixels Sociaux
        </Link>
        <Link
          href="/admin/communication"
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
            background: '#1c2b4a',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Palette size={15} />
          Kit Com & Profils Sociaux
        </Link>
      </div>

      {/* Toast Notification Floating */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: 'var(--navy, #1C2B4A)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 12,
            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            fontSize: 14,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {toast}
        </div>
      )}

      {/* Header General */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 6px' }}>
          Kit de Communication Nopalou
        </h1>
        <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>
          Support marketing multi-canal, scripts de terrain, visuels HD et publication automatique vers tous les réseaux sociaux.
        </p>
      </div>

      {/* Barre de Personnalisation Agent / Apporteur */}
      <KitComAgentIdentity
        nomAgent={nomAgent}
        onNomAgentChange={setNomAgent}
        phoneAgent={phoneAgent}
        onPhoneAgentChange={setPhoneAgent}
        codeAgent={codeAgent}
        onCodeAgentChange={val => setCodeAgent(val.toUpperCase())}
      />

      {/* Navigation par Onglets (6 Tabs) */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          borderBottom: '2px solid var(--border, #E2E8F0)',
          paddingBottom: 2,
          marginBottom: 32,
        }}
      >
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: tab === t.id ? 800 : 600,
              color: tab === t.id ? 'var(--accent, #C75B00)' : '#64748B',
              borderBottom: tab === t.id ? '3px solid var(--accent, #C75B00)' : '3px solid transparent',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu des Onglets */}
      {tab === 'reseaux' && (
        <KitComTabReseaux
          visuels={visuels}
          textes={textes}
          postTemplates={postTemplates}
          onCopy={copyToClipboard}
          onPublishFb={handlePublierFb}
          publiEnCours={publiEnCours}
        />
      )}

      {tab === 'demarchage' && (
        <KitComTabDemarchage
          prixPro={prixPro}
          prixBusiness={prixBusiness}
          scriptOralPerso={scriptOralPerso}
          onCopy={copyToClipboard}
        />
      )}

      {tab === 'battlecard' && (
        <KitComTabBattlecard
          agentNameFormatted={agentNameFormatted}
          agentPhoneFormatted={agentPhoneFormatted}
          agentCodeFormatted={agentCodeFormatted}
          onCopy={copyToClipboard}
        />
      )}

      {tab === 'apporteur' && (
        <KitComTabApporteur
          prixDecouverte={prixDecouverte}
          prixPro={prixPro}
          prixBusiness={prixBusiness}
          tauxApporteur={tauxApporteur}
          apporteurTextePerso={apporteurTextePerso}
          onCopy={copyToClipboard}
        />
      )}

      {tab === 'whatsapp' && <KitComTabWhatsApp />}

      {tab === 'generateur' && (
        <KitComTabGenerateur
          prixDecouverte={prixDecouverte}
          prixPro={prixPro}
          prixBusiness={prixBusiness}
          agentCodeFormatted={agentCodeFormatted}
          tauxApporteur={tauxApporteur}
          onCopy={copyToClipboard}
          onPublishFb={handlePublierFb}
          publiEnCours={publiEnCours}
        />
      )}
    </div>
  )
}
