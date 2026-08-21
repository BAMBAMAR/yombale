import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#C75B00',
          borderRadius: 7,
        }}
      >
        {/* N propriétaire — tracé vectoriel via SVG inline */}
        <svg width="32" height="32" viewBox="0 0 512 512" style={{ position: 'absolute', top: 0, left: 0 }}>
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
