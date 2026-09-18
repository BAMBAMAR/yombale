export interface AgenceImmo {
  id: string
  utilisateur_id?: string
  nom: string
  slug: string
  description?: string | null
  logo_url?: string | null
  adresse?: string | null
  ville?: string | null
  quartier?: string | null
  telephone?: string | null
  whatsapp?: string | null
  email_contact?: string | null
  email?: string | null // fallback
  site_web?: string | null
  numero_agrement?: string | null
  statut: 'actif' | 'active' | 'suspendu' | 'suspendue' | 'en_attente'
  abonnement_plan?: string | null
  abonnement_fin?: string | null
  sponsorise?: boolean
  sponsor_jusqu_au?: string | null
  parametres?: Record<string, any>
  created_at: string
  updated_at?: string
  proprietaire_nom?: string | null
  proprietaire_email?: string | null
  nb_biens?: number
  nb_baux_actifs?: number
}

export interface AgencesFilterCounts {
  toutes: number
  abonnees: number
  sponsorisees: number
  suspendues: number
  zeroBien: number
  max2Biens: number
}

export function formatDate(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('fr-SN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function isSponsorActif(a: AgenceImmo) {
  if (!a.sponsorise) return false
  if (!a.sponsor_jusqu_au) return true
  return new Date(a.sponsor_jusqu_au) > new Date()
}

export function isAgenceActive(a: AgenceImmo) {
  return a.statut === 'actif' || a.statut === 'active'
}

export function getPlanLabel(planSlug?: string | null) {
  switch (planSlug) {
    case 'immo_pro':
    case 'pro':
      return {
        label: 'Plan Pro',
        color: '#7c3aed',
        bg: '#ede9fe',
        border: '#ddd6fe',
      }
    case 'immo_multi_agence':
    case 'multi_agence':
      return {
        label: 'Multi-Agences',
        color: '#b45309',
        bg: '#fef3c7',
        border: '#fde68a',
      }
    case 'immo_essentiel':
    case 'essentiel':
    default:
      return {
        label: 'Essentiel',
        color: '#475569',
        bg: '#f1f5f9',
        border: '#e2e8f0',
      }
  }
}

/**
 * Génère le message WhatsApp personnalisé pour le lien direct wa.me ou la relance
 */
export function genererMessageGuideAgence(a: AgenceImmo, template?: string) {
  const nomAgence = a.nom || 'Votre agence'
  const responsable = a.proprietaire_nom?.trim().split(' ')[0] || 'Cher Professionnel'
  const nbBiens = a.nb_biens ?? 0
  const nbBaux = a.nb_baux_actifs ?? 0
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nopalou.com'
  const lienVitrine = `${siteUrl}/agence/${a.slug || a.id}/vitrine`
  const lienEspace = `${siteUrl}/agence/${a.slug || a.id}`

  const tpl =
    template ||
    `Bonjour {responsable}, félicitations pour la création de votre agence *{agence_nom}* sur Nopalou Immobilier !\n\nActuellement, votre espace compte {nb_biens} bien(s) et {nb_baux} bail(baux) locatif(s) actif(s). Pour valoriser vos mandats et développer votre clientèle, voici vos outils clés disponibles immédiatement :\n\n1. *Votre Vitrine Publique Dédiée* :\nConsultez et partagez votre vitrine avec vos clients acquéreurs et locataires :\n{lien_vitrine}\n\n2. *Ajout Rapide de vos Biens & Photos HD* :\nPubliez vos appartements, villas, terrains et bureaux en quelques clics depuis votre espace pro :\n{lien_espace}\n\n3. *Gestion Locative & Baux OHADA Conformes* :\nGénérez vos contrats de bail types, quittances automatiques et suivez vos échéances de loyers sans tracas.\n\n4. *Visites Virtuelles & Vidéos Reels* :\nAugmentez vos prises de contact en ajoutant de courtes visites vidéo à vos annonces.\n\nBesoin d'aide pour importer votre portefeuille de biens ou configurer votre agence ? Répondez directement à ce message, l'équipe Nopalou Immobilier est à votre disposition !`

  return tpl
    .replace(/\{responsable\}/gi, responsable)
    .replace(/\{agence_nom\}/gi, nomAgence)
    .replace(/\{nb_biens\}/gi, String(nbBiens))
    .replace(/\{nb_baux\}/gi, String(nbBaux))
    .replace(/\{lien_vitrine\}/gi, lienVitrine)
    .replace(/\{lien_espace\}/gi, lienEspace)
}
