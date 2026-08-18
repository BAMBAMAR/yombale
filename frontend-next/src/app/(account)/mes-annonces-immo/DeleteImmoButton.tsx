'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAnnonceImmo } from '@/app/actions/immo'
import { useTranslation } from '@/i18n/context'

export default function DeleteImmoButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const { t } = useTranslation()

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteAnnonceImmo(id)
      if (!res.error) {
        router.refresh()
      } else {
        alert(res.error)
      }
      setConfirming(false)
    })
  }

  if (confirming) {
    return (
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={handleDelete}
          disabled={pending}
          style={{
            padding: '5px 12px', background: '#dc2626', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600,
          }}
        >
          {pending ? '…' : t('common.confirm')}
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{
            padding: '5px 12px', background: 'transparent', color: 'var(--text2)',
            border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, cursor: 'pointer',
          }}
        >
          {t('common.cancel')}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        padding: '5px 12px', background: 'transparent', color: '#dc2626',
        border: '1px solid #fca5a5', borderRadius: 6, fontSize: 12,
        cursor: 'pointer', marginTop: 8,
      }}
    >
      🗑 {t('account.adActionDelete')}
    </button>
  )
}
