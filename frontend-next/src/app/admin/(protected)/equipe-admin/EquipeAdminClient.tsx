'use client'

import { useState } from 'react'
import {
  ShieldAlert,
  UserPlus,
  ShieldCheck,
  Mail,
  Clock,
  Trash2,
  Lock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import {
  adminCreerMembreEquipe,
  adminModifierMembreEquipe,
  adminSupprimerMembreEquipe,
} from '@/app/actions/admin'

interface EquipeAdminClientProps {
  initialMembres: any[]
  initialError: string | null
}

const ROLES_INFO = [
  { role: 'super_admin', label: 'Super Admin', desc: 'Accès total sans restriction, gestion de l\'équipe et des configurations système.' },
  { role: 'admin_operationnel', label: 'Admin Opérationnel', desc: 'Supervision globale des marchands, boutiques, POS et immobilier.' },
  { role: 'support_client', label: 'Support Client', desc: 'Accès en lecture aux marchands, commandes et tickets pour assistance.' },
  { role: 'moderateur', label: 'Modérateur', desc: 'Approbation des annonces, des produits marchands et des contenus.' },
  { role: 'finance', label: 'Finance & Payouts', desc: 'Reversements Wave, validation des paiements manuels et rapprochements.' },
]

export default function EquipeAdminClient({ initialMembres, initialError }: EquipeAdminClientProps) {
  const [membres, setMembres] = useState(initialMembres)
  const [modalOpen, setModalOpen] = useState(false)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [role, setRole] = useState('admin_operationnel')
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nom || !email || !motDePasse) return
    setSaving(true)
    try {
      const res = await adminCreerMembreEquipe({ nom, email, motDePasse, role })
      if (res.success && res.membre) {
        setMembres((prev) => [...prev, res.membre])
        setModalOpen(false)
        setNom('')
        setEmail('')
        setMotDePasse('')
      } else {
        alert(res.error || 'Erreur lors de la création du compte')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActif = async (m: any) => {
    const nextActif = !m.actif
    setActionLoading(m.id)
    try {
      const res = await adminModifierMembreEquipe(m.id, { actif: nextActif })
      if (res.success) {
        setMembres((prev) =>
          prev.map((item) => (item.id === m.id ? { ...item, actif: nextActif } : item))
        )
      } else {
        alert(res.error || 'Erreur modification')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (m: any) => {
    if (!confirm(`Supprimer définitivement l'accès administrateur de ${m.nom} (${m.email}) ?`)) return
    setActionLoading(m.id)
    try {
      const res = await adminSupprimerMembreEquipe(m.id)
      if (res.success) {
        setMembres((prev) => prev.filter((item) => item.id !== m.id))
      } else {
        alert(res.error || 'Erreur suppression')
      }
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="admin-page-container">
      {/* En-tête Métier */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', margin: '0 0 6px' }}>
            Équipe Administrateurs & Droits RBAC
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
            Gestion nominative des accès au Control Center, traçabilité individuelle et assignation des rôles.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-npl"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}
          >
            <UserPlus size={14} />
            <span>Ajouter un collaborateur</span>
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-npl"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px', background: '#f1f5f9', color: 'var(--navy)', border: '1px solid var(--border)' }}
          >
            <RefreshCw size={14} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {initialError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 16, borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} />
          <span>{initialError}</span>
        </div>
      )}

      {/* Guide des Rôles RBAC */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        {ROLES_INFO.map((r) => (
          <div key={r.role} style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>
              {r.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>
              {r.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Tableau des Administrateurs */}
      <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                <th style={{ padding: '12px 16px' }}>Collaborateur</th>
                <th style={{ padding: '12px 16px' }}>Email</th>
                <th style={{ padding: '12px 16px' }}>Rôle Attribué</th>
                <th style={{ padding: '12px 16px' }}>Dernière Connexion</th>
                <th style={{ padding: '12px 16px' }}>Statut</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {membres.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text3)' }}>
                    Aucun administrateur nominatif configuré pour l&apos;instant.
                  </td>
                </tr>
              ) : (
                membres.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--navy)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                          {(m.nom || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{m.nom}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={12} color="var(--text3)" />
                        <span>{m.email}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          textTransform: 'uppercase',
                          letterSpacing: '.04em',
                          background: m.role === 'super_admin' ? '#fef3c7' : '#eff6ff',
                          color: m.role === 'super_admin' ? '#b45309' : '#1d4ed8',
                        }}
                      >
                        {m.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text3)', fontSize: 12 }}>
                      {m.derniere_connexion_at ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} />
                          <span>{new Date(m.derniere_connexion_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ) : (
                        'Jamais'
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {m.actif ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#10b981', background: '#ecfdf5', padding: '3px 8px', borderRadius: 12 }}>
                          <CheckCircle2 size={12} />
                          Actif
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#ef4444', background: '#fef2f2', padding: '3px 8px', borderRadius: 12 }}>
                          Suspendu
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          disabled={actionLoading === m.id}
                          onClick={() => handleToggleActif(m)}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            background: '#ffffff',
                            cursor: 'pointer',
                          }}
                        >
                          {m.actif ? 'Suspendre' : 'Réactiver'}
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === m.id}
                          onClick={() => handleDelete(m)}
                          style={{
                            fontSize: 11,
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            cursor: 'pointer',
                          }}
                          aria-label="Supprimer collaborateur"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale d'ajout d'un membre */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: 12, maxWidth: 440, width: '100%', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', margin: '0 0 16px' }}>
              Ajouter un Administrateur Nominatif
            </h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>
                  Nom complet
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Awa Diop"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>
                  Email professionnel
                </label>
                <input
                  type="email"
                  required
                  placeholder="awa.diop@nopalou.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>
                  Mot de passe temporaire
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>
                  Rôle & Droits
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: '#ffffff' }}
                >
                  <option value="admin_operationnel">Admin Opérationnel (Supervision globale)</option>
                  <option value="support_client">Support Client (Assistance & lecture)</option>
                  <option value="moderateur">Modérateur (Validation catalogue & annonces)</option>
                  <option value="finance">Finance & Payouts (Wave & Rapprochements)</option>
                  <option value="super_admin">Super Admin (Accès total)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', fontSize: 13, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-npl"
                  style={{ padding: '8px 14px', fontSize: 13 }}
                >
                  {saving ? 'Création...' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
