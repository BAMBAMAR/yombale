import re
with open('BoutiqueClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Signature BoutiqueCard
content = re.sub(
    r'function BoutiqueCard\(\{ boutique, planActif, onEdit, onDelete, onSponsoring, onPayerManuel, onManage \}: \{[^\}]+?\}\) \{',
    r"function BoutiqueCard({ boutique, planActif, onEdit, onDelete, onManage }: {\n  boutique: Boutique\n  planActif: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null\n  onEdit: () => void\n  onDelete: () => void\n  onManage: () => void\n}) {",
    content
)

# 2. Bouton Mettre en avant
content = re.sub(
    r'<button onClick=\{onSponsoring\} className="btn-premium".*?</button>',
    r'<Link href={`/payer-sponsoring-boutique/${boutique.id}`} className="btn-premium" style={{ flex: 1, minWidth: 120, padding: \'8px 12px\', fontSize: 13, color: \'#b45309\', borderColor: \'#fcd34d\', backgroundColor: \'#fffbeb\', fontWeight: 700, textAlign: \'center\', textDecoration: \'none\' }}>\n              ⭐ Mettre en avant\n            </Link>',
    content,
    flags=re.DOTALL
)

# 3. handleSponsoring function
content = re.sub(
    r'  async function handleSponsoring.*?setManuelBoutiqueId\(boutiqueId\)\r?\n    \}\)\r?\n  \}\r?\n\r?\n',
    r'',
    content,
    flags=re.DOTALL
)

# 4. Usage in list
content = re.sub(
    r'              onSponsoring=\{waveActif \? \(\) => handleSponsoring\(b\.id\) : undefined\}\r?\n              onPayerManuel=\{manuelActif \? \(\) => setManuelBoutiqueId\(b\.id\) : undefined\}\r?\n',
    r'',
    content
)

# 5. ModalPaiementManuel
content = re.sub(
    r'      \{manuelBoutiqueId && \(\r?\n        <ModalPaiementManuel.*?\/>\r?\n      \)\}\r?\n\r?\n',
    r'',
    content,
    flags=re.DOTALL
)

with open('BoutiqueClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
