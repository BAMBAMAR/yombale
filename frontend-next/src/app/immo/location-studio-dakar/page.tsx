import ImmoLanding, { immoLandingMetadata } from '../ImmoLanding'

export const dynamic = 'force-dynamic'
export const metadata = immoLandingMetadata('location-studio-dakar')

export default function Page({ searchParams }: { searchParams: { page?: string } }) {
  return <ImmoLanding slug="location-studio-dakar" searchParams={searchParams} />
}
