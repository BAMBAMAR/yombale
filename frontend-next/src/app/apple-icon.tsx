import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: '#C75B00',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontSize: 110,
            fontWeight: 400,
            letterSpacing: 0,
            lineHeight: 1,
            marginTop: 4,
          }}
        >
          N
        </span>
      </div>
    ),
    { ...size }
  )
}
