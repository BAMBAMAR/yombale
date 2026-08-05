'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

export default function ShowcaseTabs() {
  const [duree, setDuree] = useState<'1m' | '12m'>('1m');

  return (
    <section style={{
      background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
      borderRadius: 24,
      padding: '44px 24px',
      margin: '40px 0',
      border: '1px solid #e2e8f0',
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            alignSelf: 'center', background: '#fff7ed', color: '#c75b00',
            fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 20,
            border: '1px solid #ffedd5', display: 'inline-flex', alignItems: 'center', gap: 6
          }}>
            <Sparkles size={14} style={{ color: '#C75B00' }} />
            <span>Formules & Solutions Commerciales Nopalou</span>
          </div>

          <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.25 }}>
            Propulsez vos ventes avec des outils de gestion <span style={{ color: '#C75B00' }}>puissants & simples</span>
          </h2>

          <p style={{ fontSize: 15, color: '#475569', margin: 0, lineHeight: 1.6 }}>
            Choisissez la formule adaptée à votre commerce. Essayez gratuitement pendant 30 jours, sans engagement.
          </p>
                  download
                  style={{
                    background: '#1E293B', color: '#FFF', border: '1px solid #334155', padding: '10px 18px', borderRadius: 8,
                    fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6
                  }}
                >
                  📥 Télécharger la Brochure PDF (13 p.)
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
