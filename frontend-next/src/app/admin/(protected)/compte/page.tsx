import { cookies } from 'next/headers'
import { adminLogout } from '@/app/actions/admin'

const COOKIE = 'nopalou_admin'

export default async function AdminComptePage() {
  const jar    = await cookies()
  const cookie = jar.get(COOKIE)
  const expires = cookie ? new Date(Date.now() + 8 * 60 * 60 * 1000) : null

  return (
    <div className="admin-content">
      <h1 className="admin-page-titre">Mon compte admin</h1>

      {/* Session info */}
      <div className="admin-section" style={{ maxWidth: 560, marginBottom: 32 }}>
        <h2 className="admin-section-titre">Session en cours</h2>
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: '#374151', fontSize: 14 }}>Statut</span>
            <span className="admin-badge admin-badge--green">Connecté</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: '#374151', fontSize: 14 }}>Rôle</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Administrateur Nopalou</span>
          </div>
          {expires && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#374151', fontSize: 14 }}>Session expire</span>
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                {expires.toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' })} (dans ~8h)
              </span>
            </div>
          )}
        </div>
        <form action={adminLogout} style={{ marginTop: 16 }}>
          <button type="submit" className="admin-logout-btn" style={{ width: '100%', justifyContent: 'center' }}>
            Déconnexion
          </button>
        </form>
      </div>

      {/* Changer le secret */}
      <div className="admin-section" style={{ maxWidth: 560 }}>
        <h2 className="admin-section-titre">Changer le secret administrateur</h2>
        <div style={{
          background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: 20, marginBottom: 20
        }}>
          <p style={{ fontSize: 14, color: '#92400e', margin: 0, lineHeight: 1.6 }}>
            <strong>ℹ️ Le secret admin est une variable d&apos;environnement.</strong><br />
            Il ne peut pas être modifié depuis cette interface pour des raisons de sécurité.
            Pour le changer, suivez les étapes ci-dessous.
          </p>
        </div>

        <ol style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <li style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
            Générez un nouveau secret sécurisé :<br />
            <code style={{
              display: 'block', background: '#f3f4f6', padding: '8px 12px',
              borderRadius: 6, marginTop: 6, fontSize: 13, color: '#1e40af'
            }}>
              node -e &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;hex&apos;))&quot;
            </code>
          </li>
          <li style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
            Connectez-vous au <strong>tableau de bord Render</strong> →{' '}
            <strong>yombale-backend</strong> → <strong>Environment</strong>
          </li>
          <li style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
            Mettez à jour la variable <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>ADMIN_SECRET</code> avec la nouvelle valeur
          </li>
          <li style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
            Faites de même pour le service <strong>nopalou-frontend</strong> si vous y avez défini cette variable
          </li>
          <li style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
            Cliquez sur <strong>Save Changes</strong> → le service redémarre automatiquement
          </li>
          <li style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
            Reconnectez-vous avec le nouveau secret depuis <a href="/admin/login" className="auth-link">/admin/login</a>
          </li>
        </ol>

        <div style={{ marginTop: 20 }}>
          <a
            href="https://dashboard.render.com"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-action-btn"
            style={{ display: 'inline-block' }}
          >
            Ouvrir Render Dashboard →
          </a>
        </div>
      </div>
    </div>
  )
}
