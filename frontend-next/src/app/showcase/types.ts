export type FeatureTab = 'pos' | 'boutique' | 'whatsapp' | 'migration'

export interface TabItem {
  id: FeatureTab
  label: string
  badge: string
}
