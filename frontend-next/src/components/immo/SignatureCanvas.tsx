'use client'

import React, { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
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
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#1C2B4A' // Navy Nopalou
      ctx.lineWidth = 2.5
    }
    setHasDrawn(false)
    if (onStrokeChange) onStrokeChange(false)
  }, [onStrokeChange])

  useEffect(() => {
    const t = setTimeout(() => {
      initCanvas()
    }, 80)
    return () => clearTimeout(t)
  }, [initCanvas])

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHasDrawn(false)
      if (onStrokeChange) onStrokeChange(false)
    },
    getDataUrl: () => {
      const canvas = canvasRef.current
      if (!canvas || !hasDrawn) return null
      return canvas.toDataURL('image/png')
    },
    hasDrawn: () => hasDrawn,
  }))

  function getCoordinates(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()

    if ('touches' in e) {
      const touch = e.touches[0]
      if (!touch) return { x: 0, y: 0 }
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  function handleStart(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if ('touches' in e && e.cancelable) e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  function handleMove(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return
    if ('touches' in e && e.cancelable) e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    if (!hasDrawn) {
      setHasDrawn(true)
      if (onStrokeChange) onStrokeChange(true)
    }
  }

  function handleEnd() {
    if (!isDrawing) return
    setIsDrawing(false)
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
    setHasDrawn(false)
    if (onStrokeChange) onStrokeChange(false)
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
          cursor: 'crosshair',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
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
