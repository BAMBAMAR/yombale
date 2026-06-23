import type { Metadata } from 'next'
import InscriptionForm from './InscriptionForm'

export const metadata: Metadata = {
  title: 'Créer un compte',
  description: 'Créez votre compte Nopalou pour gérer vos annonces et boutique.',
}

export default function InscriptionPage() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 62px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: 'var(--shadow2)',
      }}>
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <a href="/" style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: '26px',
            fontWeight: 800,
            color: 'var(--blue)',
            letterSpacing: '-0.02em',
          }}>
            Nopa<span style={{ color: 'var(--orange)' }}>lou</span>
          </a>
          <h1 style={{
            marginTop: '16px',
            fontSize: '20px',
            fontWeight: 800,
            color: 'var(--text1)',
          }}>
            Créer un compte
          </h1>
          <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text2)' }}>
            Rejoignez Nopalou gratuitement
          </p>
        </div>

        <InscriptionForm />
      </div>
    </div>
  )
}
