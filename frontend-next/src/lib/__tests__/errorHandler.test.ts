import { describe, it, expect, vi } from 'vitest';
import { safeJsonParse, safeStorageGet, safeStorageSet, safeStorageRemove, handleClientError } from '../errorHandler';

describe('Unified ErrorHandler & Storage Resilience', () => {
  it('safeJsonParse retourne l objet parsé si le JSON est valide', () => {
    const valid = '{"foo":"bar","num":42}';
    expect(safeJsonParse(valid, {})).toEqual({ foo: 'bar', num: 42 });
  });

  it('safeJsonParse retourne le fallback sécurisé sans planter si le JSON est invalide', () => {
    const invalid = '{"broken json';
    const fallback = { fallback: true };
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    expect(safeJsonParse(invalid, fallback, 'test')).toEqual(fallback);
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('safeJsonParse gère null et undefined sans warning', () => {
    expect(safeJsonParse(null, 'default')).toBe('default');
    expect(safeJsonParse(undefined, 'default')).toBe('default');
  });

  it('handleClientError logue avec le préfixe [Nopalou:<context>]', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    handleClientError(new Error('Erreur test'), 'UnitTesting', { level: 'warn' });
    expect(warnSpy).toHaveBeenCalledWith('[Nopalou:UnitTesting] Erreur test');
    warnSpy.mockRestore();
  });

  it('handleClientError déclenche un événement window en cas de notification', () => {
    let eventFired = false;
    let eventDetail: any = null;
    const handler = (e: any) => {
      eventFired = true;
      eventDetail = e.detail;
    };

    window.addEventListener('nopalou:notification', handler);
    handleClientError(new Error('Boom'), 'TestNotification', {
      notifyUser: true,
      userMessage: 'Message personnalisé'
    });

    expect(eventFired).toBe(true);
    expect(eventDetail).toEqual({ type: 'error', message: 'Message personnalisé' });
    window.removeEventListener('nopalou:notification', handler);
  });
});
