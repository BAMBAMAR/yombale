import OperateurLanding, { telecomLandingMetadata } from '../OperateurLanding'

export const dynamic = 'force-dynamic'
export const metadata = telecomLandingMetadata('orange')

export default function Page() {
  return <OperateurLanding slug="orange" />
}
