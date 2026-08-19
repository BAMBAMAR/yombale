'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { lireCompare, GROUPE_LABELS, type CompareEntry } from '@/lib/comparaison'
import { useTranslation } from '@/i18n/context'

// Bandeau affiché sur les pages liste produits quand une comparaison produit est active.
// Rôle double : expliquer pourquoi la liste est filtrée, et synchroniser le filtre
// d'URL si la comparaison a été démarrée ailleurs (ex: autre page, autre session).
export default function CompareFilterBanner() {
  const { t } = useTranslation()
  const router       = useRouter()
  const pathname     = usePathname()
  const [items, setItems] = useState<CompareEntry[]>([])

  function read() { setItems(lireCompare()) }

  useEffect(() => {
    read()
    window.addEventListener('nopalou:compare', read)
    return () => window.removeEventListener('nopalou:compare', read)
  }, [])

  const actif  = items.length > 0 && items[0].type === 'produit' ? items[0] : null
  const groupe = actif?.groupe || ''

  // Synchronise l'URL : comparaison active avec groupe, mais paramètre absent.
  useEffect(() => {
    if (!groupe) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('sousType') === groupe) return
    params.set('sousType', groupe)
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`)
  }, [groupe, pathname, router])

  if (!actif) return null

  const label   = GROUPE_LABELS[groupe] || actif.catSlug || ''
  const premier = actif.nom.length > 40 ? actif.nom.slice(0, 40) + '…' : actif.nom

  function vider(e: React.MouseEvent) {
    e.preventDefault()
    localStorage.removeItem('nopalou_compare')
    window.dispatchEvent(new CustomEvent('nopalou:compare'))
    const params = new URLSearchParams(window.location.search)
    params.delete('sousType')
    params.delete('page')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="compare-filter-banner" role="status">
      <span className="compare-filter-banner-titre">{t('common.activeComparison')}</span>
      <span className="compare-filter-banner-texte">
        {label
          ? <>Affichage limité aux <strong>{label}</strong> (similaires à « {premier} »)</>
          : <>Sélection en cours : « {premier} »</>}
      </span>
      <button onClick={vider} className="compare-filter-banner-vider">✕ {t('common.clear')}</button>
    </div>
  )
}
