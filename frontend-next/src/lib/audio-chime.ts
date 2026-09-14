// frontend-next/src/lib/audio-chime.ts
// Synthétiseur de sons WebAudio natif (Zéro CDN, zéro fichier audio externe)
// Conforme à la règle de performance et d'indépendance réseau Nopalou

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Émet un carillon doux et harmonieux (Do - Mi - Sol) lors de l'arrivée d'une commande Web sur la caisse POS
 */
export function playWebOrderChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  const noteDuration = 0.12;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * noteDuration);

    gain.gain.setValueAtTime(0.001, now + idx * noteDuration);
    gain.gain.exponentialRampToValueAtTime(0.18, now + idx * noteDuration + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * noteDuration + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * noteDuration);
    osc.stop(now + idx * noteDuration + 0.36);
  });
}

/**
 * Émet un bip bref et net lors de la détection réussie d'un code-barres au scanner
 */
export function playScannerBeep(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now); // La5 (880 Hz)

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.15, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}
