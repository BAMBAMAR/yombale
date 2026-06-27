import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: '#C75B00',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.5px',
            lineHeight: 1,
            marginTop: 1,
          }}
        >
          N
        </span>
      </div>
    ),
    { ...size }
  )
}
