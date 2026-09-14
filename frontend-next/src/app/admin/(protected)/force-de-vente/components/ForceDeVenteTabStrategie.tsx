import React from 'react'
import { TrendingUp, MapPin, Store } from 'lucide-react'

export default function ForceDeVenteTabStrategie() {
  const steps = [
    {
      step: '1',
      title: 'Repérage & Brise-glace',
      desc: "Observer la boutique, saluer chaleureusement en wolof/français, poser la question d'accroche.",
      color: '#3B82F6',
    },
    {
      step: '2',
      title: 'Diagnostic Express',
      desc: 'Poser les 2 questions magiques (Gestion des dettes ? Temps passé sur WhatsApp ?).',
      color: '#8B5CF6',
    },
    {
      step: '3',
      title: 'Démo Live 60s',
      desc: "Démonstration de la Caisse POS hors-ligne, du bilan WhatsApp instantané ou de l'import Shopify/Excel.",
      color: '#EC4899',
    },
    {
      step: '4',
      title: 'Onboarding 30s WA',
      desc: "Création de la boutique en 30s sur WhatsApp (3 questions) ou import du catalogue existant.",
      color: '#10B981',
    },
    {
      step: '5',
      title: 'Suivi J+1 & J+7',
      desc: 'Message WhatsApp de félicitations à J+1, relance téléphonique à J+7 pour accompagner le 1er mois offert.',
      color: '#F59E0B',
    },
  ]

  const zonesDakar = [
    { zone: 'Marché Sandaga & Plateau', cible: 'Mode, Téléphonie, Maroquinerie, Parfumerie', vol: '150+ boutiques / km²' },
    { zone: 'Marché HLM 5 & Allées du Centenaire', cible: 'Tissus, Prêt-à-porter, Chaussures, Accessoires', vol: '200+ boutiques / km²' },
    { zone: 'Marché Tilène & Médina', cible: 'Alimentation, Quincaillerie, Électroménager, Épiceries', vol: '180+ boutiques / km²' },
    { zone: 'Colobane & Boulevard Général De Gaulle', cible: 'High-Tech, Informatique, Pièces détachées', vol: '120+ boutiques / km²' },
    { zone: 'Centres Commerciaux (Sea Plaza, Playce, Maristes)', cible: 'Boutiques de marque, Cosmétiques, Restauration', vol: 'Commerces structurés' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Funnel 5 Étapes */}
      <div style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: 16, padding: '24px' }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: 'var(--navy, #1C2B4A)',
            margin: '0 0 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <TrendingUp size={22} color="var(--accent, #C75B00)" />
          Le Funnel Terrain en 5 Étapes (Taux de Conversion Ciblé &gt; 40%)
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {steps.map(s => (
            <div
              key={s.step}
              style={{
                background: '#F8FAFC',
                border: '1px solid var(--border, #E2E8F0)',
                borderRadius: 12,
                padding: '16px 14px',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: s.color,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 13,
                  marginBottom: 8,
                }}
              >
                {s.step}
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 4px' }}>{s.title}</h3>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.4 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Zones Prioritaires de Quadrillage Dakar & Organisation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <div style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: 16, padding: '24px' }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--navy, #1C2B4A)',
              margin: '0 0 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <MapPin size={20} color="var(--accent, #C75B00)" />
            Zones Prioritaires — Dakar
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {zonesDakar.map((z, idx) => (
              <div
                key={idx}
                style={{
                  background: '#F8FAFC',
                  border: '1px solid var(--border, #E2E8F0)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'block' }}>
                    {z.zone}
                  </span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Cible : {z.cible}</span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--accent, #C75B00)',
                    background: '#FFF7ED',
                    padding: '4px 8px',
                    borderRadius: 6,
                  }}
                >
                  {z.vol}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: 16, padding: '24px' }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--navy, #1C2B4A)',
              margin: '0 0 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Store size={20} color="#16A34A" />
            Organisation de la Journée Type du Commercial
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: '#334155' }}>
            <div style={{ padding: '10px 14px', background: '#F0FDF4', borderRadius: 10, borderLeft: '4px solid #16A34A' }}>
              <strong>08h30 - 09h00 :</strong> Briefing matinal, vérification du stock de flyers/badges et sélection de la
              zone du jour.
            </div>
            <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, borderLeft: '4px solid #3B82F6' }}>
              <strong>09h00 - 13h00 :</strong> Session de prospection Terrain 1 (8 à 10 visites ciblées, démos live,
              inscriptions sur place).
            </div>
            <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, borderLeft: '4px solid #F59E0B' }}>
              <strong>14h00 - 17h30 :</strong> Session de prospection Terrain 2 (8 à 10 visites complémentaires + revisites
              de closing).
            </div>
            <div style={{ padding: '10px 14px', background: '#FFF7ED', borderRadius: 10, borderLeft: '4px solid var(--accent, #C75B00)' }}>
              <strong>17h30 - 18h00 :</strong> Debriefing, enregistrement des boutiques onboardées, envoi des messages de
              bienvenue WhatsApp.
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                background: 'var(--navy, #1C2B4A)',
                color: '#fff',
                padding: '12px 16px',
                borderRadius: 10,
                fontWeight: 800,
                marginTop: 4,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <span>Objectif quotidien par commercial :</span>
              <span style={{ color: '#38BDF8' }}>15 à 20 visites · 5 à 8 boutiques onboardées / jour</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
