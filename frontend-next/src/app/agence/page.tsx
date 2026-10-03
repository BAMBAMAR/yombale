import { getOptionalSession } from '@/lib/dal'
import AgencesHubClient from './AgencesHubClient'

// La session (signature vérifiée) décide côté serveur : visiteur → page publique directement
// dans le HTML (indexable, sans écran de chargement) ; connecté → liste de ses agences.
export const dynamic = 'force-dynamic'

export default async function AgencesHubPage() {
  const session = await getOptionalSession()
  return <AgencesHubClient sessionServeur={!!session?.userId} />
}
