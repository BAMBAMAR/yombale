import React from 'react'
import Link from 'next/link'
import { Play, Star } from 'lucide-react'

export default function MerchantDemoCtaAndTestimonials() {
  return (
    <section style={{ marginBottom: 48 }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '26px 24px',
          color: '#ffffff',
          boxShadow: '0 10px 30px rgba(15,23,42,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 18,
          marginBottom: 36
        }}
      >
        <div style={{ maxWidth: 560 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(16,185,129,0.2)',
              color: '#A7F3D0',
              padding: '4px 10px',
              borderRadius: 14,
              fontSize: 11,
              fontWeight: 900,
              marginBottom: 8,
              border: '1px solid rgba(16,185,129,0.3)'
            }}
          >
            <Play size={12} fill="#A7F3D0" />
            <span>TEST EN DIRECT SANS CRÉATION DE COMPTE</span>
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 21, fontWeight: 900, color: '#ffffff' }}>
            Testez la Caisse POS &amp; la Boutique en Démo Interactive
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#CBD5E1', lineHeight: 1.5 }}>
            Prenez les commandes d&apos;une boutique test à Dakar : ajoutez des articles, encaissez en espèces ou Wave et simulez un ticket de caisse en moins de 30 secondes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            href="/demo?role=marchand"
            style={{
              padding: '12px 22px',
              borderRadius: 10,
              background: '#ffffff',
              color: '#0F172A',
              fontSize: 13,
              fontWeight: 900,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
            }}
          >
            <Play size={14} fill="#0F172A" />
            <span>Lancer la Démo Marchand</span>
          </Link>

          <Link
            href="/demo"
            style={{
              padding: '12px 18px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 800,
              textDecoration: 'none'
            }}
          >
            Explorer toute la Démo →
          </Link>
        </div>
      </div>

      {/* Témoignages Commerçants Vérifiés */}
      <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 20px' }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--accent, #C75B00)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Témoignages Vérifiés
        </span>
        <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '4px 0' }}>
          Adopté par les commerçants de Sandaga, Tilène et Castors
        </h3>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16
        }}
      >
        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '18px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', gap: 2, color: '#EAB308', marginBottom: 8 }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#EAB308" />)}
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--navy, #1C2B4A)', fontStyle: 'italic', lineHeight: 1.45 }}>
            &laquo; Avant, mes caissiers notaient tout sur un cahier. Le soir, il manquait toujours de l&apos;argent. Avec la caisse Nopalou sur tablette, chaque vente est tracée avec le PIN du vendeur et la clôture Z est exacte à 100%. &raquo;
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1C2B4A 0%, #C75B00 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>
              M
            </div>
            <div>
              <strong style={{ fontSize: 13, color: 'var(--navy, #1C2B4A)', display: 'block' }}>Moustapha Ndiaye</strong>
              <span style={{ fontSize: 11.5, color: 'var(--text2, #5A4E42)' }}>Électronique &amp; Accessoires · Sandaga</span>
            </div>
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '18px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', gap: 2, color: '#EAB308', marginBottom: 8 }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#EAB308" />)}
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--navy, #1C2B4A)', fontStyle: 'italic', lineHeight: 1.45 }}>
            &laquo; Le carnet de dettes est magique. J&apos;avais plus de 400 000 F de crédits éparpillés. J&apos;ai appuyé sur Relancer WhatsApp : le message part avec le montant et le bouton Wave. J&apos;ai récupéré la moitié dès le premier weekend ! &raquo;
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #C75B00 0%, #ea580c 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>
              F
            </div>
            <div>
              <strong style={{ fontSize: 13, color: 'var(--navy, #1C2B4A)', display: 'block' }}>Fatou Kiné Sarr</strong>
              <span style={{ fontSize: 11.5, color: 'var(--text2, #5A4E42)' }}>Prêt-à-porter &amp; Cosmétiques · Castors</span>
            </div>
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '18px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', gap: 2, color: '#EAB308', marginBottom: 8 }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#EAB308" />)}
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--navy, #1C2B4A)', fontStyle: 'italic', lineHeight: 1.45 }}>
            &laquo; Ce que j&apos;apprécie le plus, c&apos;est le 0% de commission. Je vends mes téléphones sur ma vitrine Nopalou, les clients paient par Wave et l&apos;argent arrive directement sur mon compte sans intermédiaire. C&apos;est imbattable. &raquo;
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>
              B
            </div>
            <div>
              <strong style={{ fontSize: 13, color: 'var(--navy, #1C2B4A)', display: 'block' }}>Babacar Amar</strong>
              <span style={{ fontSize: 11.5, color: 'var(--text2, #5A4E42)' }}>Smartphones &amp; High-Tech · Médina</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
