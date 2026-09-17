'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
  exiting?: boolean
}

export interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isDanger?: boolean
}

interface ConfirmState extends ConfirmOptions {
  id: string
  resolve: (value: boolean) => void
}

interface ToastContextType {
  toast: {
    (options: { message: string; title?: string; type?: ToastType; duration?: number }): void
    success: (message: string, title?: string, duration?: number) => void
    error: (message: string, title?: string, duration?: number) => void
    warning: (message: string, title?: string, duration?: number) => void
    info: (message: string, title?: string, duration?: number) => void
  }
  confirmModal: (options: ConfirmOptions) => Promise<boolean>
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState | null>(null)
  const [mounted, setMounted] = useState(false)

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    )
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 220)
  }, [])

  const addToast = useCallback(
    ({
      message,
      title,
      type = 'info',
      duration = 3500,
    }: {
      message: string
      title?: string
      type?: ToastType
      duration?: number
    }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      const newToast: ToastItem = { id, message, title, type, duration }

      setToasts((prev) => [...prev.slice(-4), newToast]) // Maximum 5 toasts simultanés

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const confirmModal = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        ...options,
        id: String(Date.now()),
        resolve,
      })
    })
  }, [])

  useEffect(() => {
    setMounted(true)
    const handleCustomToast = (e: Event) => {
      const customEvent = e as CustomEvent<{
        message: string
        title?: string
        type?: ToastType
        duration?: number
      }>
      if (customEvent.detail) {
        addToast(customEvent.detail)
      }
    }
    const handleCustomConfirm = (e: Event) => {
      const customEvent = e as CustomEvent<{
        options: ConfirmOptions
        callback: (val: boolean) => void
      }>
      if (customEvent.detail) {
        confirmModal(customEvent.detail.options).then(customEvent.detail.callback)
      }
    }
    window.addEventListener('nopalou:toast', handleCustomToast)
    window.addEventListener('nopalou:confirm', handleCustomConfirm)
    return () => {
      window.removeEventListener('nopalou:toast', handleCustomToast)
      window.removeEventListener('nopalou:confirm', handleCustomConfirm)
    }
  }, [addToast, confirmModal])

  const toastHelpers = Object.assign(
    (opts: { message: string; title?: string; type?: ToastType; duration?: number }) => addToast(opts),
    {
      success: (message: string, title?: string, duration = 3500) =>
        addToast({ message, title, type: 'success', duration }),
      error: (message: string, title?: string, duration = 4500) =>
        addToast({ message, title, type: 'error', duration }),
      warning: (message: string, title?: string, duration = 4000) =>
        addToast({ message, title, type: 'warning', duration }),
      info: (message: string, title?: string, duration = 3500) =>
        addToast({ message, title, type: 'info', duration }),
    }
  )

  return (
    <ToastContext.Provider value={{ toast: toastHelpers, confirmModal }}>
      {children}
      {mounted &&
        createPortal(
          <>
            <div className="npl-toast-container" aria-live="polite" role="region">
              {toasts.map((t) => (
                <div
                  key={t.id}
                  className={`npl-toast-item npl-toast-${t.type} ${t.exiting ? 'exiting' : ''}`}
                  role="alert"
                >
                  <div className="npl-toast-icon">
                    {t.type === 'success' && <CheckCircle2 size={18} />}
                    {t.type === 'error' && <AlertCircle size={18} />}
                    {t.type === 'warning' && <AlertTriangle size={18} />}
                    {t.type === 'info' && <Info size={18} />}
                  </div>
                  <div className="npl-toast-content">
                    {t.title && <div className="npl-toast-title">{t.title}</div>}
                    <div className="npl-toast-message">{t.message}</div>
                  </div>
                  <button
                    type="button"
                    className="npl-toast-close"
                    onClick={() => removeToast(t.id)}
                    aria-label="Fermer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {confirmDialog && (
              <div
                className="npl-confirm-overlay"
                onClick={() => {
                  confirmDialog.resolve(false)
                  setConfirmDialog(null)
                }}
              >
                <div
                  className="npl-confirm-modal"
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="npl-confirm-header">
                    <div className={`npl-confirm-icon-box ${confirmDialog.isDanger ? 'danger' : 'warning'}`}>
                      <AlertTriangle size={22} />
                    </div>
                    <div>
                      <h4 className="npl-confirm-title">
                        {confirmDialog.title || 'Confirmation requise'}
                      </h4>
                      <p className="npl-confirm-message">{confirmDialog.message}</p>
                    </div>
                  </div>
                  <div className="npl-confirm-actions">
                    <button
                      type="button"
                      className="npl-confirm-btn npl-confirm-btn-cancel"
                      onClick={() => {
                        confirmDialog.resolve(false)
                        setConfirmDialog(null)
                      }}
                    >
                      {confirmDialog.cancelLabel || 'Annuler'}
                    </button>
                    <button
                      type="button"
                      className={`npl-confirm-btn npl-confirm-btn-confirm ${confirmDialog.isDanger ? 'danger' : ''}`}
                      onClick={() => {
                        confirmDialog.resolve(true)
                        setConfirmDialog(null)
                      }}
                    >
                      {confirmDialog.confirmLabel || 'Confirmer'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body
        )}
    </ToastContext.Provider>
  )
}

export function showToast(message: string, type: ToastType = 'info', title?: string, duration = 3500) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('nopalou:toast', { detail: { message, title, type, duration } })
    )
  }
}

export function showConfirm(options: ConfirmOptions): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent('nopalou:confirm', {
        detail: {
          options,
          callback: resolve,
        },
      })
    )
  })
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // Fallback gracieux si utilisé hors provider (ex: SSR ou tests)
    return {
      toast: Object.assign(
        (opts: any) => showToast(opts.message, opts.type, opts.title, opts.duration),
        {
          success: (msg: string, title?: string, d?: number) => showToast(msg, 'success', title, d),
          error: (msg: string, title?: string, d?: number) => showToast(msg, 'error', title, d),
          warning: (msg: string, title?: string, d?: number) => showToast(msg, 'warning', title, d),
          info: (msg: string, title?: string, d?: number) => showToast(msg, 'info', title, d),
        }
      ),
      confirmModal: (opts: ConfirmOptions) => showConfirm(opts),
    }
  }
  return context
}

