import OperateurLanding, { telecomLandingMetadata } from '../OperateurLanding'

export const revalidate = 3600
export const metadata = telecomLandingMetadata('expresso')

export default function Page() {
  return <OperateurLanding slug="expresso" />
}
