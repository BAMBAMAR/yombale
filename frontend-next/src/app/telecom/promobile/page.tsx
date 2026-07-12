import OperateurLanding, { telecomLandingMetadata } from '../OperateurLanding'

export const dynamic = 'force-dynamic'
export const metadata = telecomLandingMetadata('promobile')

export default function Page() {
  return <OperateurLanding slug="promobile" />
}
