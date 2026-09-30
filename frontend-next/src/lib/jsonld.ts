// AUD-025 : sérialisation JSON-LD sûre pour <script type="application/ld+json">.
// JSON.stringify n'échappe pas "<" : un nom contenant "</script><script>…" fermerait la balise
// et exécuterait du code. On remplace les caractères dangereux par leurs séquences \uXXXX,
// qui restent du JSON valide et se décodent à l'identique pour les robots.
const LINE_SEP = String.fromCharCode(0x2028)
const PARA_SEP = String.fromCharCode(0x2029)
const UNSAFE = new RegExp('[<>&' + LINE_SEP + PARA_SEP + ']', 'g')

function escapeChar(c: string): string {
  return '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')
}

export function safeJsonLd(value: unknown): string {
  const json = JSON.stringify(value)
  // JSON.stringify(undefined) renvoie undefined : on garde un JSON valide
  return (json === undefined ? 'null' : json).replace(UNSAFE, escapeChar)
}
