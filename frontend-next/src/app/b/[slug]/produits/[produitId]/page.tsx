import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string; produitId: string }>
}

export default async function ShortBoutiqueProduitRedirectPage({ params }: PageProps) {
  const { slug, produitId } = await params

  if (!slug || !produitId) {
    redirect('/boutiques')
  }

  redirect(`/boutiques/${slug}/produits/${produitId}`)
}
