import ImmoLanding, { immoLandingMetadata } from '../ImmoLanding'

export const dynamic = 'force-dynamic'
export const metadata = immoLandingMetadata('vente-appartement-dakar')

export default function Page({ searchParams }: { searchParams: { page?: string } }) {
  return <ImmoLanding slug="vente-appartement-dakar" searchParams={searchParams} />
}
