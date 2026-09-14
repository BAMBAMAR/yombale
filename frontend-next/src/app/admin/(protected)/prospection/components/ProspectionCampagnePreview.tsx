interface Props {
  previewLead: {
    nom_boutique?: string | null
  }
  previewText: string
}

export default function ProspectionCampagnePreview({
  previewLead,
  previewText,
}: Props) {
  return (
    <div style={{ background: '#FFF7ED', border: '2px solid #FFEDD5', borderRadius: 16, padding: '24px' }}>
      <h2 style={{ fontSize: 16, fontWeight: 900, color: '#C75B00', margin: '0 0 12px' }}>
        Aperçu WhatsApp Réel (Destinataire Exemple : {previewLead.nom_boutique || 'Dakar Chic Boutique'})
      </h2>

      <div style={{
        background: '#DCF8C6', borderRadius: 12, padding: '16px', color: '#000',
        fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        {previewText}
      </div>

      <div style={{ marginTop: 20, padding: '12px 16px', background: '#fff', borderRadius: 12, border: '1px solid #FED7AA' }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#9A3412', display: 'block', marginBottom: 4 }}>
          Recommandations Anti-Ban WhatsApp Sénégal :
        </span>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
          <li>Envoyez par vagues de 30 à 50 contacts par jour.</li>
          <li>Le système applique automatiquement une temporisation de 1.5s entre chaque message.</li>
          <li>Privilégiez les messages chaleureux mentionnant le nom de la boutique.</li>
        </ul>
      </div>
    </div>
  )
}
