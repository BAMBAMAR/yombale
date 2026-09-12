'use client'

import { useState } from 'react'
import { useTranslation } from '@/i18n/context'
import BoutiqueAdmins from './BoutiqueAdmins'
import BoutiqueCaissiers from './BoutiqueCaissiers'

export default function BoutiqueEquipe({ boutiqueId }: { boutiqueId: string }) {
  const [subTab, setSubTab] = useState<'admins' | 'caissiers'>('admins')
  const { t } = useTranslation()

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
        <button
          onClick={() => setSubTab('admins')}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            border: subTab === 'admins' ? '2px solid #C75B00' : '1px solid #d1d5db',
            background: subTab === 'admins' ? '#fff7f0' : '#fff',
            color: subTab === 'admins' ? '#C75B00' : '#374151',
          }}
        >
          {t('shop.admins')}
        </button>
        <button
          onClick={() => setSubTab('caissiers')}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            border: subTab === 'caissiers' ? '2px solid #C75B00' : '1px solid #d1d5db',
            background: subTab === 'caissiers' ? '#fff7f0' : '#fff',
            color: subTab === 'caissiers' ? '#C75B00' : '#374151',
          }}
        >
          {t('shop.caissiers')}
        </button>
      </div>

      {subTab === 'admins' ? (
        <BoutiqueAdmins boutiqueId={boutiqueId} />
      ) : (
        <BoutiqueCaissiers boutiqueId={boutiqueId} />
      )}
    </div>
  )
}
