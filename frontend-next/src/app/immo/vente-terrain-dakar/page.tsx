import ImmoLanding, { immoLandingMetadata } from '../ImmoLanding'

export const revalidate = 600
export const metadata = immoLandingMetadata('vente-terrain-dakar')

export default function Page({ searchParams }: { searchParams: { page?: string } }) {
  return <ImmoLanding slug="vente-terrain-dakar" searchParams={searchParams} />
}
