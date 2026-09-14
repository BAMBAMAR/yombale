export interface TemplateProduit {
  id: string
  nom: string
  description: string
  categorie: string
  photo_defaut: string
}

export interface SaisieProduit {
  template: TemplateProduit
  selectionne: boolean
  prix: string
  quantite: number
}

export interface LigneFichier {
  id: string
  nom: string
  prix: number
  quantite: number
  categorie: string
  code_barre?: string
  description?: string
  image_url?: string
  valide: boolean
  avertissement?: string
}

export interface DiagnosticImport {
  plateforme: string
  totalDetecte: number
  prets: number
  avertissements: number
  colonnesDetectees: {
    nom: string
    prix: string
    stock: string
    categorie: string
    code_barre: string
  }
}
