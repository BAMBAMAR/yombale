import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const q = url.searchParams.get('q')

  const proto = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3001'
  const baseUrl = `${proto}://${host}`

  if (q) {
    return NextResponse.redirect(new URL(`/recherche?q=${encodeURIComponent(q)}`, baseUrl), 308)
  }

  return NextResponse.redirect(new URL('/', baseUrl), 308)
}
