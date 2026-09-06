import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #FF7E22 0%, #EA580C 35%, #C75B00 70%, #9E3C00 100%)',
          boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.25)',
        }}
      >
        <svg width="180" height="180" viewBox="0 0 512 512" style={{ position: 'absolute', top: 0, left: 0 }}>
          <path
            fillRule="evenodd"
            d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}

