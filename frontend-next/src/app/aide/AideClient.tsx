'use client'

import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search,
  Store,
  CreditCard,
  Truck,
  BookOpen,
  ChevronDown,
  MessageSquare,
  Sparkles,
  HelpCircle,
  PhoneCall,
  ExternalLink,
  Ticket,
  ShieldCheck,
} from 'lucide-react'
import ModalCreerTicket from './components/ModalCreerTicket'
import SuiviTicketSection from './components/SuiviTicketSection'

interface FaqItem {
  id: string
  categorie: string
  question: string
  reponse: string
}

const FAQ_ITEMS: FaqItem[] = [
  // Démarrage & Configuration
  {
    id: 'creer-boutique',
    categorie: 'demarrage',
    question: 'Comment créer et configurer ma boutique sur Nopalou ?',
    reponse: 'Rendez-vous sur "Créer ma boutique", indiquez le nom de votre enseigne, votre numéro WhatsApp et choisissez un plan. Vous aurez instantanément accès au Studio de personnalisation pour choisir votre thème, votre logo et vos couleurs.',
  },
  {
    id: 'theme-personnalisation',
    categorie: 'demarrage',
    question: 'Comment personnaliser le thème visuel de mon catalogue ?',
    reponse: 'Dans votre Espace Marchand, allez dans "Studio & Thème". Vous pouvez sélectionner parmi 5 thèmes natifs à haute lisibilité (Classique, Luxe Sombre, Nature Vert, Tech Moderne, Mode Chic) et prévisualiser immédiatement le rendu.',
  },
  {
    id: 'domaine-partage',
    categorie: 'demarrage',
    question: 'Quel est le lien de ma boutique pour mes clients ?',
    reponse: 'Votre boutique dispose d\'une adresse web dédiée type nopalou.com/boutiques/votre-nom. Vous pouvez partager ce lien direct ou votre QR code officiel dans vos stories Instagram, TikTok et statuts WhatsApp.',
  },

  // Caisse POS & Ventes
  {
    id: 'caisse-express',
    categorie: 'caisse',
    question: 'Comment fonctionne le mode Caisse POS & Vente Express ?',
    reponse: 'L\'interface Caisse permet d\'encaisser vos clients au comptoir en 3 clics avec un pavé tactile ultra-rapide. Elle fonctionne même hors-connexion (Offline-First) et synchronise les stocks dès le retour d\'Internet.',
  },
  {
    id: 'cloture-z',
    categorie: 'caisse',
    question: 'Qu\'est-ce que la Clôture Z et comment l\'exécuter ?',
    reponse: 'La Clôture Z est l\'arrêté de caisse journalier officiel. Elle calcule automatiquement le solde théorique de votre tiroir-caisse, compare avec votre décompte physique d\'espèces (billetterie BCEAO) et génère un ticket de caisse certifié.',
  },
  {
    id: 'carnet-dettes',
    categorie: 'caisse',
    question: 'Comment suivre les dettes et les avances de mes clients ?',
    reponse: 'Le module "Carnet de Dettes" consigne chaque crédit accordé et chaque acompte. Vous pouvez envoyer un rappel d\'échéance courtois à votre client directement sur WhatsApp en un clic.',
  },

  // Paiements
  {
    id: 'paiements-acceptes',
    categorie: 'paiements',
    question: 'Quels sont les moyens de paiement acceptés sur Nopalou ?',
    reponse: 'Nopalou prend en charge nativement Wave Sénégal (QR code & lien automatique), Orange Money (paiement web sécurisé), les Cartes Bancaires internationales (Visa, Mastercard via Stripe) et le paiement à la livraison (Cash on Delivery).',
  },
  {
    id: 'securite-wave-om',
    categorie: 'paiements',
    question: 'Les paiements mobiles sont-ils sécurisés ?',
    reponse: 'Oui, toutes les transactions transitent par les passerelles officielles chiffrées avec vérification HMAC-SHA256. L\'argent arrive directement sur votre compte marchand sans intermédiaire non autorisé.',
  },

  // Logistique & Livraison
  {
    id: 'livraison-tiaktiak',
    categorie: 'logistique',
    question: 'Comment configurer les frais de livraison par commune ?',
    reponse: 'Dans "Expéditions & Logistique", vous pouvez définir vos tarifs par commune (Dakar Plateau, Almadies, Guédiawaye, Rufisque...) ou appliquer un forfait Tiak-Tiak unique ainsi qu\'un seuil d\'achats pour la livraison gratuite.',
  },
  {
    id: 'suivi-colis',
    categorie: 'logistique',
    question: 'Mes clients peuvent-ils suivre l\'acheminement de leur colis ?',
    reponse: 'Oui, dès qu\'une commande passe au statut "Expédiée", le client reçoit une notification WhatsApp avec le nom du livreur et son numéro direct pour coordonner la remise en main propre.',
  },

  // Comptabilité SYSCOHADA
  {
    id: 'export-syscohada',
    categorie: 'comptabilite',
    question: 'Comment exporter mes écritures comptables conformes SYSCOHADA ?',
    reponse: 'Dans l\'onglet Comptabilité, cliquez sur "Exporter SYSCOHADA". Nopalou génère un fichier CSV/Excel conforme au Système Comptable Ouest-Africain avec équilibre strict Débit/Crédit (comptes 521 Wave, 571 Caisse, 701 Ventes, 443 TVA).',
  },
]

const CATEGORIES = [
  { id: 'tous', label: 'Toutes les rubriques', icon: Sparkles },
  { id: 'demarrage', label: 'Démarrage & Studio', icon: Store },
  { id: 'caisse', label: 'Caisse POS & Ventes', icon: BookOpen },
  { id: 'paiements', label: 'Paiements & Wave/OM', icon: CreditCard },
  { id: 'logistique', label: 'Livraison Tiak-Tiak', icon: Truck },
  { id: 'comptabilite', label: 'SYSCOHADA & Fiscalité', icon: HelpCircle },
]

export default function AideClient() {
  const searchParams = useSearchParams()
  const initialTicket = searchParams.get('ticket') || ''

  const [recherche, setRecherche] = useState('')
  const [catActive, setCatActive] = useState('tous')
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ 'creer-boutique': true })

  // Support & Suivi
  const [modalTicketOpen, setModalTicketOpen] = useState(false)
  const [suiviOpen, setSuiviOpen] = useState(!!initialTicket)
  const [activeTicketNum, setActiveTicketNum] = useState(initialTicket)

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const itemsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return FAQ_ITEMS.filter(item => {
      const matchCat = catActive === 'tous' || item.categorie === catActive
      const matchQ = !q || item.question.toLowerCase().includes(q) || item.reponse.toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [recherche, catActive])

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px 80px' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--accent, #C75B00)',
            background: 'rgba(199, 91, 0, 0.08)',
            padding: '4px 12px',
            borderRadius: '16px',
            marginBottom: '12px',
          }}
        >
          <HelpCircle size={14} /> Centre d&apos;Aide & Support
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 10px' }}>
          Comment pouvons-nous vous aider ?
        </h1>
        <p style={{ fontSize: '14.5px', color: 'var(--text2, #555)', maxWidth: '580px', margin: '0 auto' }}>
          Retrouvez les guides d&apos;utilisation, ouvrez un ticket d&apos;assistance officiel ou suivez votre dossier en direct.
        </p>

        {/* Barre de Recherche */}
        <div style={{ maxWidth: '520px', margin: '22px auto 0', position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text3, #888)',
            }}
          />
          <input
            type="text"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher une aide (ex: Wave, Caisse, SYSCOHADA, Thème...)"
            className="input-npl"
            style={{
              paddingLeft: '42px',
              height: '46px',
              fontSize: '14px',
              boxShadow: 'var(--shadow-sm)',
            }}
          />
        </div>
      </div>

      {/* Cartes d'Actions Rapides Support */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px',
          marginBottom: '32px',
        }}
      >
        <button
          type="button"
          onClick={() => setModalTicketOpen(true)}
          className="card-npl"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            textAlign: 'left',
            cursor: 'pointer',
            border: '1px solid var(--border, #E8DDD2)',
            transition: 'border-color 0.15s ease',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(199, 91, 0, 0.1)',
              color: 'var(--accent, #C75B00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Ticket size={20} />
          </div>
          <div>
            <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Ouvrir un ticket SAV
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3, #888)', marginTop: '2px' }}>
              Déclarez un bug ou un litige
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSuiviOpen(prev => !prev)}
          className="card-npl"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            textAlign: 'left',
            cursor: 'pointer',
            border: `1px solid ${suiviOpen ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'}`,
            background: suiviOpen ? 'rgba(199, 91, 0, 0.03)' : 'var(--card, #ffffff)',
            transition: 'all 0.15s ease',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(10, 92, 54, 0.1)',
              color: 'var(--price, #0A5C36)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Suivre un ticket
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3, #888)', marginTop: '2px' }}>
              Consulter l&apos;avancement (TCK-...)
            </div>
          </div>
        </button>

        <a
          href="https://wa.me/221708717942?text=Bonjour%20Nopalou%2C%20j%27ai%20besoin%20d%27assistance"
          target="_blank"
          rel="noopener noreferrer"
          className="card-npl"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            textDecoration: 'none',
            border: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#25D366',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MessageSquare size={20} />
          </div>
          <div>
            <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Support WhatsApp 7j/7
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3, #888)', marginTop: '2px' }}>
              +221 70 871 79 42 (Direct)
            </div>
          </div>
        </a>
      </div>

      {/* Section interactive de suivi de ticket */}
      {suiviOpen && (
        <SuiviTicketSection
          initialNumero={activeTicketNum}
          onClose={() => setSuiviOpen(false)}
        />
      )}

      {/* Filtres de Catégories */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '24px',
        }}
      >
        {CATEGORIES.map(c => {
          const Icon = c.icon
          const isActive = catActive === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCatActive(c.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: `1px solid ${isActive ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'}`,
                background: isActive ? 'var(--accent, #C75B00)' : 'var(--card, #ffffff)',
                color: isActive ? '#ffffff' : 'var(--navy, #1C2B4A)',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={15} />
              <span>{c.label}</span>
            </button>
          )
        })}
      </div>

      {/* Accordéons FAQ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '48px' }}>
        {itemsFiltres.length === 0 ? (
          <div className="card-npl" style={{ padding: '36px', textAlign: 'center', color: 'var(--text3, #888)' }}>
            Aucun résultat trouvé pour votre recherche. Essayez un autre mot-clé ou ouvrez un ticket d&apos;assistance ci-dessus.
          </div>
        ) : (
          itemsFiltres.map(item => {
            const isOpen = !!openItems[item.id]
            return (
              <div
                key={item.id}
                className="card-npl"
                style={{
                  overflow: 'hidden',
                  transition: 'border-color 0.15s ease',
                  borderColor: isOpen ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                    {item.question}
                  </span>
                  <ChevronDown
                    size={18}
                    style={{
                      color: isOpen ? 'var(--accent, #C75B00)' : 'var(--text3, #888)',
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0,
                    }}
                  />
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: '0 20px 18px',
                      fontSize: '13.5px',
                      color: 'var(--text2, #555)',
                      lineHeight: 1.6,
                      borderTop: '1px solid var(--border, #E8DDD2)',
                      paddingTop: '14px',
                    }}
                  >
                    {item.reponse}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Support Direct WhatsApp */}
      <div
        className="card-npl"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, var(--bg, #F8F5F0) 0%, #ffffff 100%)',
          border: '1px solid var(--border, #E8DDD2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
            }}
          >
            <MessageSquare size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Besoin d&apos;une assistance immédiate ?
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text2, #555)' }}>
              Notre équipe d&apos;assistance basée à Dakar est disponible 7j/7 pour vous accompagner par message direct.
            </p>
          </div>
        </div>

        <a
          href="https://wa.me/221708717942?text=Bonjour%20Nopalou%2C%20j%27ai%20besoin%20d%27aide%20pour%20ma%20boutique"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-npl btn-npl-primary"
          style={{ textDecoration: 'none' }}
        >
          <PhoneCall size={16} />
          <span>Contacter le Support WhatsApp</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Modal d'ouverture de ticket */}
      <ModalCreerTicket
        isOpen={modalTicketOpen}
        onClose={() => setModalTicketOpen(false)}
        onTicketCree={(numero) => {
          setActiveTicketNum(numero)
          setSuiviOpen(true)
        }}
      />
    </div>
  )
}
