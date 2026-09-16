'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
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
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          style={{
            padding: '6px 12px',
            background: '#DC2626',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontSize: 12,
            cursor: pending ? 'wait' : 'pointer',
            fontWeight: 700,
          }}
        >
          {pending ? '…' : t('common.confirm')}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          style={{
            padding: '6px 10px',
            background: '#FFFFFF',
            color: 'var(--navy, #1C2B4A)',
            border: '1px solid var(--border, #E8DDD2)',
            borderRadius: 8,
            fontSize: 12,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {t('common.cancel')}
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '6px 12px',
        background: '#FEE2E2',
        color: '#991B1B',
        border: '1px solid #FCA5A5',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      title="Supprimer cette annonce immobilière"
    >
      <Trash2 size={13} />
      <span>{t('account.adActionDelete')}</span>
    </button>
  )
}
