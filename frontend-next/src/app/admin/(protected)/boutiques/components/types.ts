export interface Boutique {
  id: string
  nom: string
  slug?: string
  description: string | null
  categorie: string | null
  telephone: string | null
  whatsapp?: string | null
  adresse: string | null
  ville: string | null
  logo_url: string | null
  actif: boolean
  sponsorise: boolean
  sponsor_jusqu_au: string | null
  plan_actif: 'pro' | 'business' | null
  plan_fin: string | null
  created_at: string
  derniere_relance_catalogue_at?: string | null
  nb_relances_catalogue?: number
  nb_produits?: number
  proprietaire_nom: string | null
  proprietaire_prenom?: string | null
  proprietaire_email: string | null
  proprietaire_telephone?: string | null
}

export interface RelanceConfig {
  actif: boolean
  seuil: number
  delai_heures: number
  intervalle_jours: number
  titre: string
  template: string
}

export interface RelanceEligible {
  id: string
  nom: string
  slug?: string
  nb_produits: number
  telephone?: string
  created_at?: string
  derniere_relance_catalogue_at?: string | null
  nb_relances_catalogue?: number
}

export interface AdminBoutiquesClientProps {
  boutiques: Boutique[]
  initialRelanceConfig?: RelanceConfig
  initialRelanceStats?: Record<string, number>
  initialRelanceEligibles?: RelanceEligible[]
}

export function formatDate(s: string) {
  return new Date(s).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function isSponsorActif(b: Boutique) {
  if (!b.sponsorise) return false
  if (!b.sponsor_jusqu_au) return true
  return new Date(b.sponsor_jusqu_au) > new Date()
}

/**
 * Génère le message WhatsApp personnalisé pour le lien wa.me ou aperçu
 */
export function genererMessageGuide(b: Boutique, template?: string) {
  const prenom =
    b.proprietaire_prenom || (b.proprietaire_nom ? b.proprietaire_nom.trim().split(' ')[0] : 'Cher Marchand')
  const nom = b.proprietaire_nom || 'Marchand'
  const boutiqueNom = b.nom || 'Votre boutique'
  const nbProduits = b.nb_produits ?? 0
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nopalou.com'
  const lienBoutique = `${siteUrl}/boutique?tab=produits&id=${b.id}`
  const lienCaisse = `${siteUrl}/boutique/caisse?manage=${b.id}`
  const lienAccueil = `${siteUrl}/boutiques/${b.slug || b.id}`

  const tpl =
    template ||
    `Bonjour {prenom}, félicitations pour la création de votre boutique *{boutique_nom}* sur Nopalou ! \n\nActuellement, votre boutique compte {nb_produits} produit(s). Pour commencer à recevoir des commandes et attirer des clients, voici les moyens les plus simples d'alimenter votre boutique :\n\n1. *Directement par Message WhatsApp* :\nEnvoyez simplement le nom et le prix d'un article à ce numéro (ex: *« Robe Soie 15000 »*) avec une photo : il est publié immédiatement sur votre vitrine !\n\n2. *L'Import Intelligent Multi-Plateformes (Shopify, WooCommerce, Excel)* :\nImportez tout votre catalogue existant en 1 seul clic sans aucune ressaisie.\n\n3. *Depuis votre Espace Marchand Épuré* :\nRendez-vous sur : {lien_boutique}\nAjoutez vos articles en 5 secondes grâce au formulaire Express.\n\n4. *La Caisse POS Magasin Tactile* :\nEnregistrez vos ventes et tenez votre carnet de dettes client : {lien_caisse}\n\n5. *Votre Bilan du Jour instantané* :\nTapez simplement *« Bilan »* sur WhatsApp pour connaître votre chiffre d'affaires et vos encaissements du jour.\n\nBesoin d'aide ou d'un accompagnement personnalisé ? Répondez directement à ce message, l'équipe Nopalou est là pour vous !`

  return tpl
    .replace(/\{prenom\}/gi, prenom)
    .replace(/\{nom\}/gi, nom)
    .replace(/\{boutique_nom\}/gi, boutiqueNom)
    .replace(/\{nb_produits\}/gi, String(nbProduits))
    .replace(/\{lien_boutique\}/gi, lienBoutique)
    .replace(/\{lien_caisse\}/gi, lienCaisse)
    .replace(/\{lien_accueil\}/gi, lienAccueil)
}
