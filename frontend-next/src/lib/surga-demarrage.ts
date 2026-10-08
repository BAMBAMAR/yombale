// Marque « appareil déjà configuré », lue par le serveur au rendu de /surga.
// SRG-A3-003 : la configuration vit dans le stockage du navigateur, que le serveur ne voit pas ; il envoyait donc
// toujours la page d'accueil publique, qu'un utilisateur déjà configuré revoyait à chaque ouverture, jusqu'à dix
// secondes sur un réseau lent. Ce témoin ne contient aucune donnée personnelle : il dit seulement « configuré ».
// Importé aussi par un composant serveur : aucun accès au navigateur au chargement du module.

export const TEMOIN_CONFIGURE = 'surga_configure'
export const CLASSE_CONFIGURE = 'surga-deja-configure'

export function marquerConfigure(oui: boolean): void {
  if (typeof document === 'undefined') return
  try {
    document.cookie = oui
      ? `${TEMOIN_CONFIGURE}=1; path=/; max-age=31536000; SameSite=Lax`
      : `${TEMOIN_CONFIGURE}=; path=/; max-age=0; SameSite=Lax`
    document.querySelector('.surga-root')?.classList.toggle(CLASSE_CONFIGURE, oui)
  } catch {}
}
