import React from 'react'
import { Printer, Copy, Send, HelpCircle, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface KitComTabBattlecardProps {
  agentNameFormatted: string
  agentPhoneFormatted: string
  agentCodeFormatted: string
  onCopy: (txt: string, label: string) => void
}

const OBJECTIONS = [
  {
    q: "« C'est trop compliqué, je ne maîtrise pas l'informatique. »",
    peur: "Peur de la technologie et de l'échec.",
    r: "« Si vous savez envoyer une photo et un message vocal sur WhatsApp, vous savez utiliser Nopalou. Il n'y a rien de compliqué à installer, tout se fait avec de gros boutons simples conçus pour aller vite sur votre téléphone. »",
  },
  {
    q: "« Je vends déjà très bien sur mes statuts WhatsApp actuels. »",
    peur: "Satisfaction du statu quo et peur de changer d'habitudes.",
    r: "« Vos statuts WhatsApp sont parfaits ! Nopalou ne remplace pas WhatsApp, il le rend 10 fois plus puissant. Au lieu d'écrire 50 fois le prix en privé, vous mettez votre lien Nopalou dans votre statut : vos clients commandent directement et vous n'avez plus qu'à encaisser. »",
  },
  {
    q: "« J'ai déjà mes produits notés sur un cahier ou un fichier Excel. »",
    peur: "Peur de perdre du temps à tout retaper.",
    r: "« Donnez-nous votre cahier ou votre fichier : notre outil d'import intelligent transfère l'intégralité de vos articles et vos prix en 3 minutes sans que vous n'ayez rien à ressaisir. »",
  },
  {
    q: "« Je n'ai pas de carte bancaire pour payer un abonnement. »",
    peur: "Blocage bancaire classique en Afrique.",
    r: "« Aucun compte bancaire n'est requis ! Vous testez gratuitement pendant 1 mois, et ensuite vous réglez vos 2 500 ou 5 000 FCFA directement avec votre compte Wave ou Orange Money habituel. »",
  },
  {
    q: "« Que se passe-t-il si la connexion internet ou le réseau coupe ? »",
    peur: "Instabilité des réseaux télécoms et électricité.",
    r: "« Notre caisse POS continue de fonctionner à 100% hors-ligne. Vous continuez d'encaisser vos clients au comptoir, et dès que le réseau revient, tout se synchronise automatiquement. »",
  },
  {
    q: "« C'est cher pour mon petit commerce. »",
    peur: "Sensibilité au prix et méconnaissance du retour sur investissement.",
    r: "« À 2 500 FCFA/mois, cela revient à moins de 85 FCFA par jour. Si Nopalou vous permet de récupérer une seule dette oubliée ou de faire une vente de plus par mois, l'outil est déjà 100% rentabilisé. Et le premier mois est entièrement gratuit. »",
  },
  {
    q: "« Je n'ai pas beaucoup d'articles (moins de 15 produits). »",
    peur: "Sentiment que l'outil est réservé aux gros magasins.",
    r: "« C'est justement idéal : en 2 minutes votre vitrine est prête. Vos clients peuvent voir vos 15 articles disponibles en permanence sans que vous ayez à leur réécrire les détails à chaque fois. »",
  },
  {
    q: "« J'ai déjà une boutique Shopify ou un site web. »",
    peur: "Double emploi.",
    r: "« Shopify vous coûte 18 000 FCFA/mois en dollars par carte Visa, sans Wave natif. Avec Nopalou, vous divisez vos coûts par 4, vos clients paient par Wave en 1 clic et vous avez la caisse physique magasin incluse. »",
  },
  {
    q: "« Les clients préfèrent négocier et payer en espèces. »",
    peur: "Décalage avec la réalité du marché informel.",
    r: "« Nopalou gère parfaitement les espèces et les acomptes ! La caisse calcule instantanément le rendu de monnaie et enregistre si le client vous doit un reliquat dans le carnet de dettes sécurisé. »",
  },
  {
    q: "« Je ne veux pas perdre mes données si j'arrête. »",
    peur: "Enfermement propriétaire.",
    r: "« Vos données vous appartiennent à 100%. Vous pouvez exporter tout votre catalogue et votre carnet clients au format Excel/CSV en 1 clic à tout moment. »",
  },
  {
    q: "« Je veux continuer mon système actuel. »",
    peur: "Inertie générale.",
    r: "« Vous pouvez garder votre système actuel et tester Nopalou en parallèle pendant 30 jours sans risque. Si au bout d'un mois vous ne gagnez pas de temps, vous arrêtez sans payer un seul franc. On l'active ensemble ? »",
  },
]

export default function KitComTabBattlecard({
  agentNameFormatted,
  agentPhoneFormatted,
  agentCodeFormatted,
  onCopy,
}: KitComTabBattlecardProps) {
  const scriptsWhatsApp = [
    {
      titre: '1. Premier Contact Froid (Prospection)',
      msg: `« Bonjour [Nom_Boutique] ! \n\nJ'ai vu votre superbe collection sur les réseaux. Nous aidons les commerçants à Dakar à automatiser leurs commandes WhatsApp et à tenir leur caisse magasin sur téléphone sans cahier papier.\n\nExemple de vitrine en 30s : nopalou.com/demo\n\nVous bénéficiez de 30 jours 100% offerts sans engagement. Souhaitez-vous que je configure vos premiers articles gratuitement aujourd'hui ? »`,
    },
    {
      titre: '2. Relance Démo (Commerçant Intéressé)',
      msg: `« Bonjour ! Avez-vous pu jeter un œil à la démo Nopalou ?\n\nJe peux passer 5 minutes dans votre boutique ou vous guider en direct sur WhatsApp pour mettre vos 3 premiers produits en ligne.\n\nQuel est le meilleur moment pour vous aujourd'hui ? »`,
    },
    {
      titre: '3. Activation Boutique 0 Produit (Post-Inscription)',
      msg: `« Félicitations pour la création de votre boutique [Nom_Boutique] sur Nopalou ! \n\nIl ne vous reste qu'une étape : ajouter vos 3 premiers articles pour pouvoir partager votre lien à vos clients.\n\nEnvoyez-moi simplement les photos et les prix ici, notre équipe s'occupe de la mise en ligne pour vous en 5 minutes ! »`,
    },
    {
      titre: "4. Fin d'Essai (Conversion Payante Wave)",
      msg: `« Bonjour ! Votre période d'essai gratuit de 30 jours sur Nopalou se termine dans 3 jours.\n\nPour continuer à profiter de votre caisse POS et de vos commandes WhatsApp sans interruption, vous pouvez renouveler votre formule en 1 clic par Wave ici : [Lien_Paiement_Wave]\n\nMerci pour votre fidélité ! »`,
    },
    {
      titre: '5. Message de Parrainage (Pour vos Commerçants Actifs)',
      msg: `« Vous appréciez Nopalou ? Partagez votre lien de parrainage à vos amis commerçants ! \n\nPour chaque boutique qui s'abonne grâce à vous, vous touchez des commissions chaque mois directement sur votre Wave.\n\nVotre lien de parrainage : nopalou.com/creer-boutique?apporteur=${agentCodeFormatted} »`,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {/* Section 1 : Fiche Commerciale A5 Imprimable */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Fiche Commerciale Terrain A5 (Imprimable Recto/Verso)
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0' }}>
              Support officiel pour les visites de boutiques et marchés à Dakar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: '10px 20px',
              background: 'var(--navy, #1C2B4A)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Printer size={15} />
            Imprimer la Fiche A5
          </button>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '2px dashed #cbd5e1',
            padding: 28,
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          {/* En-tête Fiche A5 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid var(--accent, #C75B00)',
              paddingBottom: 16,
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>
                <span style={{ color: 'var(--navy, #1C2B4A)' }}>Nopa</span>
                <span style={{ color: 'var(--accent, #C75B00)' }}>lou</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#64748B', marginLeft: 10 }}>· Retail OS Sénégal</span>
              </div>
              <div style={{ fontSize: 13, color: '#475569', fontWeight: 700, marginTop: 4 }}>
                Tout votre commerce dans votre poche : Boutique en ligne, Caisse POS &amp; WhatsApp
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  background: 'var(--price, #0A5C36)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 900,
                  padding: '4px 12px',
                  borderRadius: 20,
                }}
              >
                1ER MOIS 100% OFFERT
              </span>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Zéro carte bancaire requise</div>
            </div>
          </div>

          {/* 3 Blocs Métiers Fiche A5 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div style={{ background: '#fff7ed', padding: 14, borderRadius: 10, border: '1px solid #fed7aa' }}>
              <div style={{ fontWeight: 900, color: 'var(--accent, #C75B00)', fontSize: 13, marginBottom: 4 }}>
                1. Vitrine WhatsApp
              </div>
              <div style={{ fontSize: 11.5, color: '#334155', lineHeight: 1.4 }}>
                Lien web personnalisé. Les clients choisissent leurs articles et commandent directement sur votre WhatsApp.
              </div>
            </div>
            <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 10, border: '1px solid #bbf7d0' }}>
              <div style={{ fontWeight: 900, color: '#15803d', fontSize: 13, marginBottom: 4 }}>
                2. Caisse POS Offline
              </div>
              <div style={{ fontSize: 11.5, color: '#334155', lineHeight: 1.4 }}>
                Caisse tactile sur smartphone/tablette. Fonctionne sans Internet en cas de coupure. Scan &amp; Factures OHADA.
              </div>
            </div>
            <div style={{ background: '#eff6ff', padding: 14, borderRadius: 10, border: '1px solid #bfdbfe' }}>
              <div style={{ fontWeight: 900, color: '#1d4ed8', fontSize: 13, marginBottom: 4 }}>
                3. Dettes &amp; Wave
              </div>
              <div style={{ fontSize: 11.5, color: '#334155', lineHeight: 1.4 }}>
                Carnet de crédits clients (Bor) avec relances WhatsApp 1-clic contenant directement votre lien de paiement Wave.
              </div>
            </div>
          </div>

          {/* Pied de Fiche avec Coordonnées Agent */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
              padding: '12px 16px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              color: '#334155',
            }}
          >
            <div>
              Conseiller : <strong>{agentNameFormatted}</strong> · WhatsApp : <strong>{agentPhoneFormatted}</strong>
            </div>
            <div>
              Code Partenaire : <strong style={{ color: 'var(--accent, #C75B00)' }}>{agentCodeFormatted}</strong> (1 mois offert)
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 : Battlecard Complète des 11 Objections Commerciales */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <ShieldAlert size={18} color="var(--navy, #1C2B4A)" />
          <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Battlecard Commerciale : Traitement des 11 Objections
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {OBJECTIONS.map((obj, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                borderRadius: 14,
                padding: 18,
                border: '1px solid var(--border, #E2E8F0)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 10 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#dc2626' }}>Objection : </span>
                  <strong style={{ fontSize: 14, color: '#0f172a' }}>{obj.q}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => onCopy(obj.r, `Réponse à ${obj.q}`)}
                  style={{
                    padding: '4px 10px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Copy size={11} />
                  Copier
                </button>
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B', fontStyle: 'italic', marginBottom: 8 }}>
                Réalité psychologique : {obj.peur}
              </div>
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: '#166534',
                  lineHeight: 1.5,
                  fontWeight: 600,
                }}
              >
                Réponse recommandée : {obj.r}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 : Scripts WhatsApp Terrain & Relance */}
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)', marginBottom: 16 }}>
          Bibliothèque des 5 Scripts WhatsApp Terrain &amp; Relance
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {scriptsWhatsApp.map((sc, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                borderRadius: 14,
                padding: 18,
                border: '1px solid var(--border, #E2E8F0)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent, #C75B00)', margin: 0 }}>
                  {sc.titre}
                </h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => onCopy(sc.msg, sc.titre)}
                    style={{
                      padding: '6px 12px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Copy size={11} />
                    Copier
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(sc.msg)}`
                      window.open(waUrl, '_blank')
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#25D366',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Send size={11} />
                    Envoyer WA
                  </button>
                </div>
              </div>
              <pre
                style={{
                  fontSize: 12.5,
                  color: 'var(--navy, #1C2B4A)',
                  whiteSpace: 'pre-wrap',
                  background: '#f8fafc',
                  border: '1px solid var(--border, #E2E8F0)',
                  borderRadius: 8,
                  padding: 12,
                  margin: 0,
                  lineHeight: 1.6,
                  fontFamily: 'inherit',
                }}
              >
                {sc.msg}
              </pre>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
