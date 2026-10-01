// AUD-163 : un objet `openGraph` défini par une page REMPLACE celui du layout (fusion superficielle de Next.js) :
// sans `images`, le lien partagé sur WhatsApp, Facebook ou X s'affiche sans visuel. Toute page qui définit `openGraph`
// y ajoute ces images (image dynamique de la marque ; une page peut fournir la sienne).
export const OG_IMAGES = [
  { url: '/api/og-image', width: 1200, height: 630, alt: 'Nopalou — Plateforme de commerce digital au Sénégal' },
]
