'use client'

import React, { useState } from 'react'

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 14,
  boxSizing: 'border-box',
}

export function CaracChips({ label, name, value, onChange, suggestions, allowAutre = true, required: req = false }: {
  label: string; name: string; value: string; onChange: (k: string, v: string) => void
  suggestions: string[]; allowAutre?: boolean; required?: boolean
}) {
  const estSuggestion = suggestions.includes(value)
  const [modeAutre, setModeAutre] = useState(!!value && !estSuggestion)

  function choisir(val: string) {
    setModeAutre(false)
    onChange(name, value === val ? '' : val)
  }

  function activerAutre() {
    setModeAutre(true)
    onChange(name, '')
  }

  return (
    <div>
      <label style={labelStyle}>{label}{req && <span style={{ color: '#dc2626' }}> *</span>}</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: modeAutre ? 8 : 0 }}>
        {suggestions.map(val => {
          const selectionnee = !modeAutre && value === val
          return (
            <button
              key={val} type="button" onClick={() => choisir(val)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: selectionnee ? '2px solid #C75B00' : '1px solid #d1d5db',
                background: selectionnee ? '#fff7f0' : '#fff',
                color: selectionnee ? '#C75B00' : '#374151',
              }}
            >
              {val}
            </button>
          )
        })}
        {allowAutre && (
          <button
            type="button" onClick={activerAutre}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: modeAutre ? '2px solid #C75B00' : '1px dashed #d1d5db',
              background: modeAutre ? '#fff7f0' : '#fff',
              color: modeAutre ? '#C75B00' : '#374151',
            }}
          >
            Autre
          </button>
        )}
      </div>
      {allowAutre && modeAutre && (
        <input
          type="text" value={value} onChange={e => onChange(name, e.target.value)}
          style={inputStyle} placeholder="Autre valeur…"
        />
      )}
    </div>
  )
}
