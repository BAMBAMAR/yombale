import OperateurLanding, { telecomLandingMetadata } from '../OperateurLanding'

export const dynamic = 'force-dynamic'
export const metadata = telecomLandingMetadata('expresso')

export default function Page() {
  return <OperateurLanding slug="expresso" />
}
