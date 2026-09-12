'use client'

import React, { useState } from 'react'
import { Terminal, Copy, Check, Code, ShieldCheck, BookOpen } from 'lucide-react'

interface DevCodeSnippetsProps {
  boutiqueId: string
}

type Lang = 'curl' | 'javascript' | 'php' | 'python'
type UseCase = 'commande' | 'catalogue' | 'webhook'

export default function DevCodeSnippets({ boutiqueId }: DevCodeSnippetsProps) {
  const [lang, setLang] = useState<Lang>('curl')
  const [useCase, setUseCase] = useState<UseCase>('commande')
  const [copied, setCopied] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nopalou.com'

  const snippets: Record<UseCase, Record<Lang, string>> = {
    commande: {
      curl: `curl -X POST "${origin}/api/boutiques/${boutiqueId}/commandes" \\
  -H "Authorization: Bearer VOTRE_CLE_API_SECRETE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_nom": "Amadou Diallo",
    "client_telephone": "+221771234567",
    "adresse_livraison": "Médina Rue 6, Dakar",
    "moyen_paiement": "WAVE",
    "lignes": [
      { "produit_id": "PROD_UUID_ICI", "quantite": 2 }
    ]
  }'`,
      javascript: `// Node.js (v18+) ou Browser Fetch
const creerCommande = async () => {
  const res = await fetch('${origin}/api/boutiques/${boutiqueId}/commandes', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer VOTRE_CLE_API_SECRETE',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_nom: 'Amadou Diallo',
      client_telephone: '+221771234567',
      adresse_livraison: 'Médina Rue 6, Dakar',
      moyen_paiement: 'WAVE',
      lignes: [
        { produit_id: 'PROD_UUID_ICI', quantite: 2 }
      ]
    })
  });
  const data = await res.json();
  console.log('Commande créée :', data);
};
creerCommande();`,
      php: `<?php
// PHP cURL
$ch = curl_init("${origin}/api/boutiques/${boutiqueId}/commandes");
$payload = json_encode([
    "client_nom" => "Amadou Diallo",
    "client_telephone" => "+221771234567",
    "adresse_livraison" => "Médina Rue 6, Dakar",
    "moyen_paiement" => "WAVE",
    "lignes" => [
        ["produit_id" => "PROD_UUID_ICI", "quantite" => 2]
    ]
]);

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer VOTRE_CLE_API_SECRETE",
        "Content-Type: application/json"
    ]
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>`,
      python: `import requests

url = "${origin}/api/boutiques/${boutiqueId}/commandes"
headers = {
    "Authorization": "Bearer VOTRE_CLE_API_SECRETE",
    "Content-Type": "application/json"
}
payload = {
    "client_nom": "Amadou Diallo",
    "client_telephone": "+221771234567",
    "adresse_livraison": "Médina Rue 6, Dakar",
    "moyen_paiement": "WAVE",
    "lignes": [
        {"produit_id": "PROD_UUID_ICI", "quantite": 2}
    ]
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`
    },
    catalogue: {
      curl: `curl -X GET "${origin}/api/boutiques/${boutiqueId}/produits" \\
  -H "Authorization: Bearer VOTRE_CLE_API_SECRETE"`,
      javascript: `// Consulter le catalogue & stocks
const chargerCatalogue = async () => {
  const res = await fetch('${origin}/api/boutiques/${boutiqueId}/produits', {
    headers: { 'Authorization': 'Bearer VOTRE_CLE_API_SECRETE' }
  });
  const produits = await res.json();
  console.log('Catalogue disponible :', produits);
};
chargerCatalogue();`,
      php: `<?php
$ch = curl_init("${origin}/api/boutiques/${boutiqueId}/produits");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ["Authorization: Bearer VOTRE_CLE_API_SECRETE"]
]);
$produits = curl_exec($ch);
curl_close($ch);
echo $produits;
?>`,
      python: `import requests

url = "${origin}/api/boutiques/${boutiqueId}/produits"
headers = {"Authorization": "Bearer VOTRE_CLE_API_SECRETE"}
res = requests.get(url, headers=headers)
print(res.json())`
    },
    webhook: {
      curl: `# Exemple de payload reçu par votre webhook :
# Headers:
# X-Nopalou-Signature: t=1690000000,v1=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08

# Payload JSON :
{
  "event": "order.created",
  "boutique_id": "${boutiqueId}",
  "timestamp": "2026-09-12T22:00:00Z",
  "data": {
    "id": "cmd_123456",
    "total": 15000,
    "statut": "payee"
  }
}`,
      javascript: `// Node.js (Express) - Vérification de la signature HMAC SHA-256
import crypto from 'crypto';

app.post('/api/webhook-nopalou', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-nopalou-signature'];
  const secret = process.env.NOPALOU_WEBHOOK_SECRET;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(req.body).digest('hex');

  if (signature !== digest) {
    return res.status(401).send('Signature invalide');
  }

  const event = JSON.parse(req.body.toString());
  console.log('Événement reçu avec succès :', event.event);
  res.status(200).json({ received: true });
});`,
      php: `<?php
// PHP - Vérification de signature HMAC SHA-256
$payload = file_get_contents('php://input');
$signatureHeader = $_SERVER['HTTP_X_NOPALOU_SIGNATURE'] ?? '';
$secret = getenv('NOPALOU_WEBHOOK_SECRET');

$computedSignature = hash_hmac('sha256', $payload, $secret);

if (!hash_equals($signatureHeader, $computedSignature)) {
    http_response_code(401);
    exit('Signature invalide');
}

$event = json_decode($payload, true);
// Traiter l'événement
http_response_code(200);
echo json_encode(['received' => true]);
?>`,
      python: `# Python (FastAPI / Flask)
import hmac
import hashlib
import os

def verify_webhook(raw_payload: bytes, signature_header: str) -> bool:
    secret = os.environ.get("NOPALOU_WEBHOOK_SECRET", "").encode()
    computed = hmac.new(secret, raw_payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature_header, computed)`
    }
  }

  const currentCode = snippets[useCase][lang]

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
            <Code size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
              Exemples de Code & Intégration SDK
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
              Snippets prêts à l'emploi pour synchroniser votre boutique avec vos systèmes internes.
            </p>
          </div>
        </div>

        {/* Bouton de copie */}
        <button
          type="button"
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 8,
            background: copied ? '#f0fdf4' : '#f8fafc',
            border: `1px solid ${copied ? '#86efac' : '#cbd5e1'}`,
            color: copied ? '#166534' : '#334155',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copié !' : 'Copier le code'}</span>
        </button>
      </div>

      {/* Barre d'onglets de cas d'usage */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setUseCase('commande')}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: useCase === 'commande' ? '#0f172a' : '#f1f5f9',
            color: useCase === 'commande' ? '#ffffff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <BookOpen size={14} />
          <span>Créer une commande</span>
        </button>
        <button
          type="button"
          onClick={() => setUseCase('catalogue')}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: useCase === 'catalogue' ? '#0f172a' : '#f1f5f9',
            color: useCase === 'catalogue' ? '#ffffff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Terminal size={14} />
          <span>Consulter les stocks</span>
        </button>
        <button
          type="button"
          onClick={() => setUseCase('webhook')}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: useCase === 'webhook' ? '#0f172a' : '#f1f5f9',
            color: useCase === 'webhook' ? '#ffffff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ShieldCheck size={14} />
          <span>Vérification Webhook (HMAC)</span>
        </button>
      </div>

      {/* Barre de sélection de langage */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['curl', 'javascript', 'php', 'python'] as Lang[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              border: 'none',
              background: lang === l ? '#ff6600' : '#f1f5f9',
              color: lang === l ? '#ffffff' : '#64748b',
            }}
          >
            {l === 'curl' ? 'cURL' : l === 'javascript' ? 'Node.js' : l}
          </button>
        ))}
      </div>

      {/* Bloc de code stylisé */}
      <div style={{ position: 'relative' }}>
        <pre
          style={{
            margin: 0,
            padding: 16,
            background: '#0f172a',
            color: '#e2e8f0',
            borderRadius: 12,
            fontFamily: 'Consolas, Monaco, "Courier New", Courier, monospace',
            fontSize: 12.5,
            lineHeight: 1.55,
            overflowX: 'auto',
            border: '1px solid #1e293b',
          }}
        >
          <code>{currentCode}</code>
        </pre>
      </div>
    </div>
  )
}
