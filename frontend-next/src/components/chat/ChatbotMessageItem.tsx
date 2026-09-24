'use client'

import React from 'react'
import Link from 'next/link'
import {
  ExternalLink,
  ShoppingBag,
  Building2,
  Store,
  Package,
  Eye,
  MapPin,
} from 'lucide-react'

export interface ChatItemAction {
  label: string
  url: string
  variant?: 'primary' | 'secondary'
}

export interface ChatItemCard {
  id: string
  titre: string
  prix?: number | null
  photo?: string | null
  type: string
  boutiqueNom?: string | null
  boutiqueSlug?: string | null
  boutiqueId?: string | null
  typeBien?: string | null
  transaction?: string | null
  ville?: string | null
  categorie?: string | null
  agenceNom?: string | null
  agenceSlug?: string | null
  url: string
  actions?: ChatItemAction[]
}

export interface ChatChip {
  label: string
  url: string
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'bot'
  text: string
  time: string
  items?: ChatItemCard[]
  chips?: ChatChip[]
  whatsappUrl?: string
}

interface ChatbotMessageItemProps {
  msg: ChatMessage
  onChipClick?: (query: string) => void
}

function formatPrice(item: ChatItemCard): string | null {
  if (item.type === 'boutique') {
    return item.categorie ? `Catégorie : ${item.categorie}` : 'Boutique certifiée'
  }
  if (item.type === 'agence') {
    return 'Vitrine Agence Pro'
  }
  if (!item.prix || Number(item.prix) <= 0) {
    return 'Prix sur demande'
  }
  const formatted = new Intl.NumberFormat('fr-FR').format(Number(item.prix)) + ' FCFA'
  if (item.type === 'immo' && item.transaction === 'location') {
    return `${formatted} /mois`
  }
  return formatted
}

function getItemBadge(item: ChatItemCard): string | null {
  if (item.type === 'immo') {
    return item.transaction === 'vente' ? 'Vente' : 'Location'
  }
  if (item.type === 'boutique') {
    return 'Boutique'
  }
  if (item.type === 'agence') {
    return 'Agence'
  }
  if (item.type === 'produit') {
    return 'Boutique'
  }
  if (item.type === 'marketplace') {
    return 'Marketplace'
  }
  return null
}

export default function ChatbotMessageItem({ msg, onChipClick }: ChatbotMessageItemProps) {
  const isBot = msg.sender === 'bot'

  return (
    <div className={`npl-chat-msg ${msg.sender}`}>
      <div className="npl-chat-bubble">
        <div>{msg.text}</div>

        {/* Cartes Produits / Immo / Boutiques / Agences */}
        {isBot && msg.items && msg.items.length > 0 && (
          <div className="npl-chat-cards">
            {msg.items.slice(0, 4).map((item) => {
              const badge = getItemBadge(item)
              const priceText = formatPrice(item)
              const actions: ChatItemAction[] =
                item.actions && item.actions.length > 0
                  ? item.actions
                  : [
                      {
                        label:
                          item.type === 'immo'
                            ? 'Voir le bien'
                            : item.type === 'boutique'
                            ? 'Visiter la boutique'
                            : item.type === 'agence'
                            ? 'Voir la vitrine'
                            : 'Voir le produit',
                        url: item.url,
                        variant: 'primary',
                      },
                    ]

              return (
                <div key={`${item.type}-${item.id}`} className="npl-chat-card-box">
                  <Link href={item.url} className="npl-chat-card-main">
                    {item.photo ? (
                      <img
                        src={item.photo}
                        alt={item.titre}
                        className="npl-chat-card-thumb"
                      />
                    ) : (
                      <div className="npl-chat-card-thumb-placeholder">
                        {item.type === 'immo' ? (
                          <Building2 size={20} />
                        ) : item.type === 'boutique' ? (
                          <Store size={20} />
                        ) : item.type === 'agence' ? (
                          <Building2 size={20} />
                        ) : item.type === 'produit' ? (
                          <ShoppingBag size={20} />
                        ) : (
                          <Package size={20} />
                        )}
                      </div>
                    )}

                    <div className="npl-chat-card-info">
                      {badge && (
                        <span className="npl-chat-card-badge">{badge}</span>
                      )}
                      <div className="npl-chat-card-title" title={item.titre}>
                        {item.titre}
                      </div>
                      {priceText && (
                        <div className="npl-chat-card-price">{priceText}</div>
                      )}
                      {(item.boutiqueNom || item.agenceNom || item.ville) && (
                        <div className="npl-chat-card-meta">
                          {item.ville && <MapPin size={11} />}
                          <span>{item.boutiqueNom || item.agenceNom || item.ville}</span>
                        </div>
                      )}
                    </div>

                    <ExternalLink size={14} className="npl-chat-card-ext-icon" />
                  </Link>

                  {/* Actions fiables anti-404 */}
                  {actions.length > 0 && (
                    <div className="npl-chat-card-actions">
                      {actions.map((act, aIdx) => (
                        <Link
                          key={aIdx}
                          href={act.url}
                          className={`npl-chat-card-btn ${
                            act.variant === 'secondary'
                              ? 'npl-chat-card-btn-secondary'
                              : 'npl-chat-card-btn-primary'
                          }`}
                        >
                          {act.variant !== 'secondary' && <Eye size={12} />}
                          <span>{act.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Chips de suggestions & Liens rapides */}
        {isBot && msg.chips && msg.chips.length > 0 && (
          <div className="npl-chat-chips">
            {msg.chips.map((chip, idx) => {
              if (chip.url.startsWith('http://') || chip.url.startsWith('https://')) {
                return (
                  <a
                    key={idx}
                    href={chip.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="npl-chat-chip-btn"
                  >
                    {chip.label}
                  </a>
                )
              }
              if (chip.url.startsWith('/')) {
                return (
                  <Link key={idx} href={chip.url} className="npl-chat-chip-btn">
                    {chip.label}
                  </Link>
                )
              }
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChipClick && onChipClick(chip.url || chip.label)}
                  className="npl-chat-chip-btn"
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Bouton de bascule vers WhatsApp officiel */}
        {isBot && msg.whatsappUrl && (
          <div>
            <a
              href={msg.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="npl-chat-wa-cta"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>Continuer sur WhatsApp</span>
            </a>
          </div>
        )}
      </div>
      {msg.time ? <div className="npl-chat-msg-time" suppressHydrationWarning>{msg.time}</div> : null}
    </div>
  )
}
