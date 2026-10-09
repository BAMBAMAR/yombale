'use client'

import React, { useState } from 'react'
import { Share2, Copy, Check, HelpCircle, Info, Mail, Phone, MessageCircle, LifeBuoy, ChevronDown, MapPin, Clock } from 'lucide-react'
import { SURGA_BASE_URL, copierDansPressePapier, executerPartage } from '@/lib/surga-share'

// Coordonnées publiques de Nopalou (éditeur de Surga), les mêmes que sur les mentions légales.
const CONTACT = {
  email: 'contact@nopalou.com',
  telephone: '+221 70 871 79 42',
  telephoneLien: 'tel:+221708717942',
  whatsappLien: 'https://wa.me/221708717942',
  adresse: 'Yoff, Dakar',
  horaires: 'Du lundi au samedi, de 8 h à 20 h',
}

const MESSAGE_PARTAGE =
  'Surga, l’assistant de poche du Sénégal : l’actualité du matin, la météo, le trafic, vos notes, vos dépenses, vos rappels et les démarches, dans une seule application légère.'

// Uniquement ce qui fonctionne aujourd'hui : rien n'est promis qui ne soit pas en ligne.
const QUESTIONS: Array<{ q: string; r: string }> = [
  { q: 'Le briefing du matin', r: 'Chaque matin, Surga réunit les titres de la presse (les sources sont citées), la météo, le sport et le trafic de votre quartier. Le quartier, l’heure et les rubriques se règlent ci-dessus, dans les préférences.' },
  { q: 'Notes, dépenses et agenda', r: 'Ils s’enregistrent d’abord sur votre téléphone, même sans internet. Avec un compte, ils se synchronisent et se retrouvent sur vos autres appareils.' },
  { q: 'Les rappels', r: 'Dans l’onglet Agenda, touchez « Activer » pour autoriser les notifications : Surga vous prévient à l’heure de chaque rappel.' },
  { q: 'Sama Xaalis (vos finances)', r: 'Suivez vos entrées, dépenses, dettes et épargne. Un code à 4 chiffres peut protéger l’écran, et l’icône en forme d’œil masque les montants.' },
  { q: 'Les services', r: 'Trafic, presse, démarches, emploi et CV, concours, immobilier, boutiques, bonnes adresses, radios et séries s’ouvrent depuis la liste des services de cet écran.' },
  { q: 'Compte et données personnelles', r: 'Sans compte, tout reste sur votre appareil. Pour vous connecter, entrez votre numéro WhatsApp : un code vous est envoyé. « Protection et données personnelles » permet d’exporter ou de supprimer vos données.' },
  { q: 'Installer Surga', r: 'Touchez « Installer » dans cet écran pour ajouter Surga à votre écran d’accueil. Il s’ouvre alors comme une application, avec un accès direct.' },
]

const ligne: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', textDecoration: 'none', color: 'var(--surga-text1, #0F172A)', minHeight: 44, borderTop: '1px solid var(--surga-border, #E2E8F0)' }
const pastille: React.CSSProperties = { width: 34, height: 34, borderRadius: 10, background: 'rgba(217, 119, 6, 0.08)', color: 'var(--surga-accent-ink, #A64B08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const titreSection: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 10px', fontSize: 15, fontWeight: 800, color: 'var(--surga-primary, #0F172A)' }

function annoncer(message: string) {
  try { window.dispatchEvent(new CustomEvent('surga-toast', { detail: { message, type: 'success' } })) } catch {}
}

/**
 * Rubrique « Aide, à propos et partage » de l'écran Services : explique l'application, dit qui l'édite, permet de
 * la partager et de joindre l'assistance de Nopalou.
 */
export default function SurgaAideApropos() {
  const [copie, setCopie] = useState(false)

  const partager = async () => {
    const issue = await executerPartage({ titre: 'Surga', texte: `${MESSAGE_PARTAGE} ${SURGA_BASE_URL}`, url: SURGA_BASE_URL })
    if (issue === 'NATIVE' || issue === 'WHATSAPP') annoncer('Merci de faire connaître Surga.')
  }
  const copier = async () => {
    if (await copierDansPressePapier(SURGA_BASE_URL)) {
      setCopie(true)
      annoncer('Lien de Surga copié.')
      setTimeout(() => setCopie(false), 2500)
    }
  }

  return (
    <section aria-label="Aide, à propos et partage" style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
      {/* Partager */}
      <div className="surga-card" style={{ padding: 16 }}>
        <h3 style={titreSection}><Share2 size={18} color="var(--surga-accent-ink, #A64B08)" aria-hidden="true" />Faire connaître Surga</h3>
        <p style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.5, color: 'var(--surga-text2, #475569)' }}>
          Envoyez Surga à vos proches : le lien ouvre l’application directement, sans compte à créer.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" onClick={partager} className="surga-btn-primary" style={{ flex: '1 1 150px', width: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <Share2 size={16} aria-hidden="true" /><span>Partager l’application</span>
          </button>
          <button type="button" onClick={copier} className="surga-btn-secondary" style={{ flex: '1 1 130px', width: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            {copie ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}<span>{copie ? 'Lien copié' : 'Copier le lien'}</span>
          </button>
        </div>
      </div>

      {/* Comment ça marche */}
      <div className="surga-card" style={{ padding: '16px 16px 6px' }}>
        <h3 style={titreSection}><HelpCircle size={18} color="var(--surga-accent-ink, #A64B08)" aria-hidden="true" />Comment ça marche ?</h3>
        {QUESTIONS.map((item) => (
          <details key={item.q} style={{ borderTop: '1px solid var(--surga-border, #E2E8F0)' }}>
            <summary style={{ listStyle: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 46, fontSize: 14, fontWeight: 700, color: 'var(--surga-text1, #0F172A)' }}>
              <span>{item.q}</span>
              <ChevronDown size={16} aria-hidden="true" style={{ flexShrink: 0, color: 'var(--surga-text3, #536175)' }} />
            </summary>
            <p style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.55, color: 'var(--surga-text2, #475569)' }}>{item.r}</p>
          </details>
        ))}
      </div>

      {/* À propos */}
      <div className="surga-card" style={{ padding: 16 }}>
        <h3 style={titreSection}><Info size={18} color="var(--surga-accent-ink, #A64B08)" aria-hidden="true" />À propos de Surga</h3>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.55, color: 'var(--surga-text2, #475569)' }}>
          Surga est l’assistant de poche de <strong>Nopalou</strong>, plateforme de commerce digital au Sénégal, qui l’édite et en est propriétaire. Il se veut léger : peu de données, du texte d’abord, et l’essentiel disponible même hors ligne.
        </p>
        <p style={{ margin: '0 0 4px', fontSize: 13, lineHeight: 1.55, color: 'var(--surga-text2, #475569)' }}>
          Une grande partie des fonctions est gratuite ; Surga Plus lève les limites. Les actualités citent toujours leur source, et vos données ne sont ni revendues ni utilisées pour de la publicité.
        </p>
        <a href="/mentions-legales" target="_blank" rel="noopener noreferrer" style={ligne}><span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Mentions légales</span></a>
        <a href="/confidentialite" target="_blank" rel="noopener noreferrer" style={ligne}><span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Confidentialité</span></a>
        <a href="/cgu" target="_blank" rel="noopener noreferrer" style={ligne}><span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Conditions d’utilisation</span></a>
      </div>

      {/* Contact */}
      <div className="surga-card" style={{ padding: '16px 16px 4px' }}>
        <h3 style={titreSection}><LifeBuoy size={18} color="var(--surga-accent-ink, #A64B08)" aria-hidden="true" />Aide et contact</h3>
        <a href="/aide" target="_blank" rel="noopener noreferrer" style={ligne}>
          <span style={pastille}><LifeBuoy size={16} aria-hidden="true" /></span>
          <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>Centre d’aide et assistance</span><span style={{ display: 'block', fontSize: 12, color: 'var(--surga-text3, #536175)' }}>Poser une question, signaler un problème</span></span>
        </a>
        <a href={CONTACT.whatsappLien} target="_blank" rel="noopener noreferrer" style={ligne}>
          <span style={pastille}><MessageCircle size={16} aria-hidden="true" /></span>
          <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>Écrire sur WhatsApp</span><span style={{ display: 'block', fontSize: 12, color: 'var(--surga-text3, #536175)' }}>{CONTACT.telephone}</span></span>
        </a>
        <a href={CONTACT.telephoneLien} style={ligne}>
          <span style={pastille}><Phone size={16} aria-hidden="true" /></span>
          <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>Appeler</span><span style={{ display: 'block', fontSize: 12, color: 'var(--surga-text3, #536175)' }}>{CONTACT.horaires}</span></span>
        </a>
        <a href={`mailto:${CONTACT.email}`} style={ligne}>
          <span style={pastille}><Mail size={16} aria-hidden="true" /></span>
          <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>Envoyer un e-mail</span><span style={{ display: 'block', fontSize: 12, color: 'var(--surga-text3, #536175)', overflowWrap: 'anywhere' }}>{CONTACT.email}</span></span>
        </a>
        <div style={{ ...ligne, color: 'var(--surga-text2, #475569)' }}>
          <span style={pastille}><MapPin size={16} aria-hidden="true" /></span>
          <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--surga-text1, #0F172A)' }}>Nopalou</span><span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--surga-text3, #536175)' }}>{CONTACT.adresse}<Clock size={12} aria-hidden="true" />{CONTACT.horaires.replace('Du lundi au samedi, de ', 'lun.–sam. ')}</span></span>
        </div>
      </div>
    </section>
  )
}
