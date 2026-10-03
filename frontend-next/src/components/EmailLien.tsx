import React from 'react'

interface Props {
  adresse?: string
  sujet?: string
  style?: React.CSSProperties
}

/**
 * Lien mailto dont l'adresse est rendue en plusieurs nœuds de texte (React insère un commentaire entre eux).
 * Cloudflare « Email Address Obfuscation » remplace toute adresse lisible du HTML par « [email protected] » puis la
 * rétablit par script : le texte reçu par React ne correspond alors plus au rendu serveur (erreurs d'hydratation
 * #425 / #418 / #423 sur toutes les pages publiques). Une adresse découpée n'est pas détectée.
 */
export default function EmailLien({ adresse = 'contact@nopalou.com', sujet, style }: Props) {
  const [local, domaine] = adresse.split('@')
  const href = `mailto:${adresse}${sujet ? `?subject=${encodeURIComponent(sujet)}` : ''}`
  return (
    <a href={href} style={style}>
      {local}
      {'@'}
      {domaine}
    </a>
  )
}
