import ImmoLanding, { immoLandingMetadata } from '../ImmoLanding'

export const revalidate = 600
export const metadata = immoLandingMetadata('location-maison-dakar')

export default function Page({ searchParams }: { searchParams: { page?: string } }) {
  return <ImmoLanding slug="location-maison-dakar" searchParams={searchParams} />
}
