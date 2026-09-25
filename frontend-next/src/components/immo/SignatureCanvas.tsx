'use client'

import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react'
import { PenTool, RotateCcw } from 'lucide-react'

export interface SignatureCanvasHandle {
  clear: () => void
  getDataUrl: () => string | null
  hasDrawn: () => boolean
}

interface Props {
  onStrokeChange?: (hasDrawn: boolean) => void
}

const SignatureCanvas = forwardRef<SignatureCanvasHandle, Props>(function SignatureCanvas(
  { onStrokeChange },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [hasDrawn, setHasDrawn] = useState(false)

  // Références pour éviter tout cycle de re-render ou effacement intempestif
  const onStrokeChangeRef = useRef(onStrokeChange)
  const isDrawingRef = useRef(false)
  const hasDrawnRef = useRef(false)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    onStrokeChangeRef.current = onStrokeChange
  }, [onStrokeChange])

  // Initialisation du canvas sans détruire le tracé lors des re-renders parents
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    // Si déjà initialisé avec des dimensions valides, ne pas réinitialiser (évite l'effacement en cours d'écriture)
    if (isInitializedRef.current && canvas.width > 0) return

    const dpr = Math.max(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#1C2B4A' // Navy Nopalou
      ctx.lineWidth = 2.5
    }
    isInitializedRef.current = true
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setupCanvas()
    }, 50)
    return () => clearTimeout(timer)
  }, [setupCanvas])

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      hasDrawnRef.current = false
      setHasDrawn(false)
      onStrokeChangeRef.current?.(false)
    },
    getDataUrl: () => {
      const canvas = canvasRef.current
      if (!canvas || !hasDrawnRef.current) return null
      return canvas.toDataURL('image/png')
    },
    hasDrawn: () => hasDrawnRef.current,
  }))

  function getCoordinates(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    // S'assurer que le canvas est initialisé
    if (!isInitializedRef.current) {
      setupCanvas()
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignore si le navigateur ne supporte pas pointer capture
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    isDrawingRef.current = true

    if (!hasDrawnRef.current) {
      hasDrawnRef.current = true
      setHasDrawn(true)
      onStrokeChangeRef.current?.(true)
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()

    if (!hasDrawnRef.current) {
      hasDrawnRef.current = true
      setHasDrawn(true)
      onStrokeChangeRef.current?.(true)
    }
  }

  function handlePointerEnd(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // Ignore
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.closePath()
  }

  function handleClear() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    hasDrawnRef.current = false
    setHasDrawn(false)
    onStrokeChangeRef.current?.(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
          Zone de tracé manuscrit
        </span>
        <button
          type="button"
          onClick={handleClear}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748B',
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 6px',
          }}
        >
          <RotateCcw size={12} />
          <span>Effacer</span>
        </button>
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 190,
          border: '2px dashed var(--border, #E8DDD2)',
          borderRadius: 12,
          background: '#FAF8F5',
          overflow: 'hidden',
          touchAction: 'none',
          userSelect: 'none',
          cursor: 'crosshair',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        />

        {!hasDrawn && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              color: '#94A3B8',
              gap: 6,
            }}
          >
            <PenTool size={22} style={{ opacity: 0.6 }} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>
              Tracez votre signature au doigt ou à la souris
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, fontSize: 10.5, color: '#94A3B8' }}>
        <span>Horodatage certifié</span>
        <span>Intégré sur le PDF</span>
      </div>
    </div>
  )
})

export default SignatureCanvas
