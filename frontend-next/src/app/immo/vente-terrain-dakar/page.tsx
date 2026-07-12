import ImmoLanding, { immoLandingMetadata } from '../ImmoLanding'

export const dynamic = 'force-dynamic'
export const metadata = immoLandingMetadata('vente-terrain-dakar')

export default function Page({ searchParams }: { searchParams: { page?: string } }) {
  return <ImmoLanding slug="vente-terrain-dakar" searchParams={searchParams} />
}
