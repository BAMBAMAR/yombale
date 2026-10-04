'use client';

// frontend-next/src/app/surga/components/SurgaVoiceModal.tsx
// Modale de commande vocale pour Surga
// Web Speech API, calcul exact, chaîne de confirmation obligatoire, zéro émoji

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  X,
  AlertCircle,
  Keyboard,
  ArrowRight,
} from 'lucide-react';
import {
  interpreterCommandeVocale,
  estReconnaissanceVocaleSupportee,
  type ActionVocaleDetectee,
} from '@/lib/surga-voice';
import SurgaVoiceConfirmation from './SurgaVoiceConfirmation';

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SurgaVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmerDepense?: (depense: { montant: number; categorie: string; note: string }) => Promise<void>;
  onConfirmerNote?: (note: { titre: string; contenu: string }) => Promise<void>;
  onConfirmerRappel?: (rappel: { titre: string; date: string; heure: string }) => Promise<void>;
}

export default function SurgaVoiceModal({
  isOpen,
  onClose,
  onConfirmerDepense,
  onConfirmerNote,
  onConfirmerRappel,
}: SurgaVoiceModalProps) {
  const [estSupporte, setEstSupporte] = useState(true);
  const [enEcoute, setEnEcoute] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [texteSaisiManuel, setTexteSaisiManuel] = useState('');
  const [actionDetectee, setActionDetectee] = useState<ActionVocaleDetectee | null>(null);
  const [statutSauvegarde, setStatutSauvegarde] = useState<'IDLE' | 'EN_COURS' | 'VALIDE' | 'ERREUR'>('IDLE');
  const [messageErreur, setMessageErreur] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const demarrerEcoute = useCallback(() => {
    setMessageErreur(null);
    setActionDetectee(null);
    setStatutSauvegarde('IDLE');
    setTranscription('');

    if (typeof window === 'undefined') return;
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };

    const SpeechRecClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecClass) {
      setEstSupporte(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const instance = new SpeechRecClass();
      instance.continuous = false;
      instance.interimResults = true;
      instance.lang = 'fr-FR';

      instance.onstart = () => {
        setEnEcoute(true);
      };

      instance.onresult = (event: SpeechRecognitionEvent) => {
        let texteComplet = '';
        for (let i = 0; i < event.results.length; i++) {
          texteComplet += event.results[i][0].transcript;
        }
        setTranscription(texteComplet);

        const dernierResultat = event.results[event.results.length - 1];
        if (dernierResultat.isFinal) {
          const action = interpreterCommandeVocale(texteComplet);
          setActionDetectee(action);
        }
      };

      instance.onerror = (err: SpeechRecognitionErrorEvent) => {
        setEnEcoute(false);
        if (err.error === 'not-allowed') {
          setMessageErreur("L'accès au microphone a été refusé. Veuillez l'autoriser ou saisir votre consigne au clavier.");
        } else if (err.error !== 'no-speech') {
          setMessageErreur(`Erreur de reconnaissance (${err.error}). Vous pouvez réessayer.`);
        }
      };

      instance.onend = () => {
        setEnEcoute(false);
      };

      recognitionRef.current = instance;
      instance.start();
    } catch {
      setEnEcoute(false);
      setEstSupporte(false);
    }
  }, []);

  const arreterEcoute = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setEnEcoute(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const supporte = estReconnaissanceVocaleSupportee();
      setEstSupporte(supporte);
      if (supporte) {
        demarrerEcoute();
      }
    } else {
      arreterEcoute();
      setActionDetectee(null);
      setTranscription('');
      setTexteSaisiManuel('');
      setStatutSauvegarde('IDLE');
    }
  }, [isOpen, demarrerEcoute, arreterEcoute]);

  if (!isOpen) return null;

  const handleValidationManuel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!texteSaisiManuel.trim()) return;
    const action = interpreterCommandeVocale(texteSaisiManuel);
    setActionDetectee(action);
    setTranscription(texteSaisiManuel);
  };

  const handleConfirmerAction = async () => {
    if (!actionDetectee) return;
    setStatutSauvegarde('EN_COURS');

    try {
      if (actionDetectee.intention === 'ADD_EXPENSE' && actionDetectee.depenseData && onConfirmerDepense) {
        await onConfirmerDepense(actionDetectee.depenseData);
      } else if (actionDetectee.intention === 'ADD_NOTE' && actionDetectee.noteData && onConfirmerNote) {
        await onConfirmerNote(actionDetectee.noteData);
      } else if (actionDetectee.intention === 'ADD_REMINDER' && actionDetectee.rappelData && onConfirmerRappel) {
        await onConfirmerRappel(actionDetectee.rappelData);
      }
      setStatutSauvegarde('VALIDE');
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch {
      setStatutSauvegarde('ERREUR');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(28, 43, 74, 0.2)',
          padding: '24px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(199, 91, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <Mic size={18} />
            </div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>
              Commande Vocale Surga
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              border: 'none',
              background: 'transparent',
              color: '#8A94A6',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Animation du microphone ou repli */}
        {estSupporte ? (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <button
              onClick={enEcoute ? arreterEcoute : demarrerEcoute}
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: enEcoute ? 'var(--accent)' : 'var(--navy)',
                color: '#FFFFFF',
                border: 'none',
                boxShadow: enEcoute
                  ? '0 0 0 10px rgba(199, 91, 0, 0.2), 0 0 0 20px rgba(199, 91, 0, 0.1)'
                  : '0 4px 12px rgba(28, 43, 74, 0.15)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={enEcoute ? "Arrêter l'écoute" : 'Parler à Surga'}
            >
              {enEcoute ? <Mic size={32} /> : <MicOff size={32} />}
            </button>
            <p style={{ fontSize: '0.85rem', color: '#6A7282', marginTop: '14px', marginBottom: 0 }}>
              {enEcoute ? "Surga vous écoute... Parlez naturellement." : "Appuyez sur le micro pour parler."}
            </p>
          </div>
        ) : (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(199, 91, 0, 0.08)',
              color: 'var(--navy)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={18} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              Reconnaissance vocale non disponible sur ce navigateur. Vous pouvez saisir votre commande ci-dessous.
            </div>
          </div>
        )}

        {messageErreur && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(217, 83, 79, 0.1)',
              color: '#C0392B',
              fontSize: '0.82rem',
              marginBottom: '14px',
            }}
          >
            {messageErreur}
          </div>
        )}

        {/* Transcription en direct ou texte manuel */}
        {transcription && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg)',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              marginBottom: '16px',
              fontSize: '0.9rem',
              color: 'var(--navy)',
              fontStyle: enEcoute ? 'italic' : 'normal',
            }}
          >
            « {transcription} »
          </div>
        )}

        {/* Zone de saisie manuelle de repli */}
        {!enEcoute && !actionDetectee && (
          <form onSubmit={handleValidationManuel} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder='Ex : "note 2500 taxi" ou "100 / 3"'
                value={texteSaisiManuel}
                onChange={(e) => setTexteSaisiManuel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              <Keyboard size={15} color="#8A94A6" style={{ position: 'absolute', left: '10px', top: '11px' }} />
            </div>
            <button
              type="submit"
              className="btn-npl"
              style={{ padding: '0 12px', height: '36px', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}
            >
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* ── Chaîne de confirmation pour Dépense, Note ou Rappel ── */}
        {actionDetectee && actionDetectee.intention !== 'INCONNU' && (
          <SurgaVoiceConfirmation
            actionDetectee={actionDetectee}
            statutSauvegarde={statutSauvegarde}
            onConfirmer={handleConfirmerAction}
            onAnnuler={() => {
              setActionDetectee(null);
              setTranscription('');
            }}
          />
        )}

        {actionDetectee && actionDetectee.intention === 'INCONNU' && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              color: '#6A7282',
              fontSize: '0.82rem',
              marginBottom: '14px',
            }}
          >
            Commande non reconnue. Exemples : <em>"note 2500 taxi"</em>, <em>"calcule 100 divisé par 3"</em>, <em>"rappel demain 14h"</em>.
          </div>
        )}

        {/* Pied de dialogue */}
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#8A94A6',
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
