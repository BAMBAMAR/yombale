// @vitest-environment node
// AUD-149 : la politique stricte est évaluée en rapport seul, sans retirer la politique actuelle
import { describe, it, expect } from 'vitest'

process.env.SESSION_SECRET = 'test-secret-csp'

describe('middleware CSP (AUD-149)', () => {
  it('ajoute Content-Security-Policy-Report-Only (nonce, strict-dynamic, sans unsafe-eval) et garde la politique existante', async () => {
    const { NextRequest } = await import('next/server')
    const { middleware } = await import('../middleware')
    const res = await middleware(new NextRequest('http://localhost/boutiques'))
    const enforce = res.headers.get('content-security-policy') || ''
    const rapport = res.headers.get('content-security-policy-report-only') || ''
    expect(enforce).toContain("'unsafe-inline'")
    expect(rapport).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/)
    expect(rapport).not.toContain("'unsafe-eval'")
    expect(rapport).not.toMatch(/script-src[^;]*'unsafe-inline'/)
    expect(rapport).toContain('report-uri /api/csp-report')
    expect(rapport).toContain("frame-ancestors 'none'")
  })
})
