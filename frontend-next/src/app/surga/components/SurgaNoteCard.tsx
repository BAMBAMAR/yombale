'use client'

import React, { useState } from 'react'
import {
  Pin, PinOff, Copy, Check, Share2, Trash2, CheckSquare, Square,
  ShoppingCart, Briefcase, User, AlertTriangle, FileText, Clock,
  Calendar, Wallet, type LucideIcon,
} from 'lucide-react'
import {
  type SurgaNote, type SurgaNoteCategorie, type SurgaNoteCouleur,
  saveLocalDepense, saveLocalEvenement,
} from '@/lib/surga-offline-sync'
import { detecterMontantTexte, afficherToast } from '@/lib/surga-cross-actions'

interface SurgaNoteCardProps {
  note: SurgaNote
  onEditer: (note: SurgaNote) => void
  onSupprimer: (id: string) => void
  onTogglePin: (id: string) => void
  onToggleCheckItem: (noteId: string, itemId: string) => void
}

const COULEURS_MAP: Record<SurgaNoteCouleur, { bg: string; border: string; accent: string }> = {
  creme: { bg: '#FFFFFF', border: 'var(--border, #E8DDD2)', accent: 'var(--navy, #1C2B4A)' },
  ambre: { bg: '#FFFDF5', border: '#FDE68A', accent: 'var(--accent, #C75B00)' },
  vert: { bg: '#F6FDF8', border: '#BBF7D0', accent: 'var(--price, #0A5C36)' },
  bleu: { bg: '#F4FAFF', border: '#BAE6FD', accent: '#0369A1' },
  violet: { bg: '#FAF7FF', border: '#E9D5FF', accent: '#6B21A8' },
}

const CATEGORIES_META: Record<SurgaNoteCategorie, { label: string; icon: LucideIcon }> = {
  general: { label: 'Mémo', icon: FileText },
  courses: { label: 'Courses', icon: ShoppingCart },
  travail: { label: 'Travail', icon: Briefcase },
  personnel: { label: 'Personnel', icon: User },
  urgent: { label: 'Urgent', icon: AlertTriangle },
}

export default function SurgaNoteCard({
  note,
  onEditer,
  onSupprimer,
  onTogglePin,
  onToggleCheckItem,
}: SurgaNoteCardProps) {
  const [copie, setCopie] = useState<boolean>(false)
  const [rappelCree, setRappelCree] = useState<boolean>(false)
  const [depenseEnregistree, setDepenseEnregistree] = useState<boolean>(false)

  const montantDetecte = detecterMontantTexte(`${note.titre} ${note.contenu || ''}`)

  const handleCreerRappel = (e: React.MouseEvent) => {
    e.stopPropagation()
    const auj = new Date()
    const dateStr = auj.toISOString().split('T')[0]
    saveLocalEvenement({
      titre: `Note : ${note.titre}`,
      description: note.contenu?.slice(0, 150) || 'Rappel créé depuis la note',
      date_evenement: dateStr,
      heure_evenement: '10:00',
      est_rappel: true,
      priorite: note.categorie === 'urgent' ? 'urgente' : 'normale',
      repetition: 'AUCUNE',
    })
    setRappelCree(true)
    afficherToast(`Rappel ajouté à l'agenda pour aujourd'hui à 10h`, 'succes')
    setTimeout(() => setRappelCree(false), 2500)
  }

  const handleEnregistrerDepense = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!montantDetecte) return
    saveLocalDepense({
      montant_xof: montantDetecte,
      categorie: note.categorie === 'courses' ? 'alimentation' : 'autre',
      date_depense: new Date().toISOString().split('T')[0],
      note: `Créé depuis la note "${note.titre}"`,
    })
    setDepenseEnregistree(true)
    afficherToast(`Dépense de ${montantDetecte.toLocaleString('fr-FR')} F ajoutée à Sama Xaalis`, 'succes')
    setTimeout(() => setDepenseEnregistree(false), 3000)
  }

  const couleur = note.couleur || 'creme'
  const stylesCouleur = COULEURS_MAP[couleur] || COULEURS_MAP.creme
  const cat = note.categorie || 'general'
  const CatIcon = CATEGORIES_META[cat]?.icon || FileText
  const catLabel = CATEGORIES_META[cat]?.label || 'Mémo'

  const checklist = Array.isArray(note.checklist) ? note.checklist : []
  const nbItems = checklist.length
  const nbFaits = checklist.filter((i) => i.fait).length
  const progression = nbItems > 0 ? Math.round((nbFaits / nbItems) * 100) : 0

  const handleCopier = (e: React.MouseEvent) => {
    e.stopPropagation()
    let texte = `${note.titre}\n\n`
    if (note.is_checklist && nbItems > 0) {
      texte += checklist.map((i) => `${i.fait ? '[x]' : '[ ]'} ${i.texte}`).join('\n')
    } else {
      texte += note.contenu
    }
    navigator.clipboard?.writeText(texte).then(() => {
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    })
  }

  const handlePartagerWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    let texte = `*${note.titre}*\n\n`
    if (note.is_checklist && nbItems > 0) {
      texte += checklist.map((i) => `${i.fait ? '[x]' : '[ ]'} ${i.texte}`).join('\n')
    } else {
      texte += note.contenu
    }
    texte += `\n\n_Partagé via Surga_`
    const url = `https://wa.me/?text=${encodeURIComponent(texte)}`
    window.open(url, '_blank')
  }

  const formaterDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <article
      onClick={() => onEditer(note)}
      style={{
        backgroundColor: stylesCouleur.bg,
        border: `1px solid ${stylesCouleur.border}`,
        borderRadius: 12,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: note.epingle ? '0 2px 8px rgba(28, 43, 74, 0.08)' : '0 1px 3px rgba(0,0,0,0.03)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
      }}
    >
      {/* En-tête : Catégorie badge + Titre + Pin */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 7px',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                backgroundColor: 'rgba(28, 43, 74, 0.06)',
                color: stylesCouleur.accent,
              }}
            >
              <CatIcon size={11} />
              <span>{catLabel}</span>
            </span>

            {note.epingle && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '2px 6px',
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 800,
                  backgroundColor: 'rgba(199, 91, 0, 0.12)',
                  color: 'var(--accent, #C75B00)',
                }}
              >
                <Pin size={10} />
                <span>Épinglé</span>
              </span>
            )}
          </div>

          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--navy, #1C2B4A)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {note.titre}
          </h3>
        </div>

        {/* Bouton Pin rapide */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin(note.id)
          }}
          aria-label={note.epingle ? 'Détacher la note' : 'Épingler la note'}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 4,
            cursor: 'pointer',
            color: note.epingle ? 'var(--accent, #C75B00)' : 'var(--text3, #73675E)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {note.epingle ? <Pin size={16} /> : <PinOff size={15} />}
        </button>
      </div>

      {/* Contenu : Checklist ou Texte libre */}
      {note.is_checklist && nbItems > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Barre de progression */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3, #73675E)', fontWeight: 600 }}>
            <span>{nbFaits} sur {nbItems} faits</span>
            <span>{progression}%</span>
          </div>
          <div style={{ width: '100%', height: 4, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${progression}%`, height: '100%', backgroundColor: 'var(--price, #0A5C36)', transition: 'width 0.2s ease' }} />
          </div>

          {/* Aperçu des 4 premiers éléments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
            {checklist.slice(0, 4).map((item) => (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleCheckItem(note.id, item.id)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: item.fait ? 'var(--text3, #73675E)' : 'var(--navy, #1C2B4A)',
                  textDecoration: item.fait ? 'line-through' : 'none',
                  cursor: 'pointer',
                }}
              >
                {item.fait ? (
                  <CheckSquare size={15} color="var(--price, #0A5C36)" style={{ flexShrink: 0 }} />
                ) : (
                  <Square size={15} color="var(--text3, #73675E)" style={{ flexShrink: 0 }} />
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.texte}
                </span>
              </div>
            ))}
            {nbItems > 4 && (
              <span style={{ fontSize: 11, color: 'var(--text3, #73675E)', fontStyle: 'italic', marginTop: 2 }}>
                +{nbItems - 4} autre(s) élément(s)...
              </span>
            )}
          </div>
        </div>
      ) : (
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.45,
            color: 'var(--text2, #5A4E42)',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {note.contenu || <span style={{ color: 'var(--text3, #73675E)', fontStyle: 'italic' }}>Note vide</span>}
        </p>
      )}

      {/* Action transversale : Dépense détectée dans la note */}
      {montantDetecte && (
        <button
          type="button"
          onClick={handleEnregistrerDepense}
          title="Enregistrer automatiquement cette somme comme dépense dans Sama Xaalis"
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid #BBF7D0',
            backgroundColor: depenseEnregistree ? 'rgba(10, 92, 54, 0.12)' : '#F0FDF4',
            color: 'var(--price, #0A5C36)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 2,
          }}
        >
          <Wallet size={12} />
          <span>
            {depenseEnregistree
              ? 'Dépense enregistrée !'
              : `+ Sama Xaalis : ${montantDetecte.toLocaleString('fr-FR')} FCFA`}
          </span>
        </button>
      )}

      {/* Barre basse : Date + Actions rapides (Copier, Rappel, WhatsApp, Supprimer) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(0,0,0,0.05)',
          paddingTop: 8,
          marginTop: 2,
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--text3, #73675E)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} />
          <span>{formaterDate(note.updated_at || note.created_at)}</span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            onClick={handleCreerRappel}
            title="Ajouter en rappel dans l'Agenda"
            aria-label="Ajouter en rappel dans l'Agenda"
            style={{
              background: rappelCree ? 'rgba(10, 92, 54, 0.1)' : 'transparent',
              border: 'none',
              padding: '4px 6px',
              borderRadius: 6,
              cursor: 'pointer',
              color: rappelCree ? 'var(--price, #0A5C36)' : 'var(--text3, #73675E)',
              fontSize: 11,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Calendar size={13} />
            {rappelCree && <span>Rappelé</span>}
          </button>

          <button
            type="button"
            onClick={handleCopier}
            title="Copier le texte"
            aria-label="Copier la note"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px 6px',
              borderRadius: 6,
              cursor: 'pointer',
              color: copie ? 'var(--price, #0A5C36)' : 'var(--text3, #73675E)',
              fontSize: 11,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            {copie ? <Check size={13} /> : <Copy size={13} />}
            {copie && <span>Copié</span>}
          </button>

          <button
            type="button"
            onClick={handlePartagerWhatsApp}
            title="Partager sur WhatsApp"
            aria-label="Partager la note sur WhatsApp"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              color: 'var(--text3, #73675E)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Share2 size={13} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSupprimer(note.id)
            }}
            title="Supprimer la note"
            aria-label="Supprimer la note"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </article>
  )
}
