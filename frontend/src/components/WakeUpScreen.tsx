/**
 * WakeUpScreen
 * Shown during Cloud Run cold starts while the backend is loading.
 * Polls /api/health every few seconds until the backend is ready.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface WakeUpScreenProps {
  onReady: () => void;
}

const POLL_INTERVAL = 4000;

export function WakeUpScreen({ onReady }: WakeUpScreenProps) {
  const { t } = useTranslation('common');
  const [dots, setDots] = useState('');
  const [isReady, setIsReady] = useState(false);

  // Animate the dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health', {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok') {
          setIsReady(true);
          setTimeout(onReady, 800);
        }
      }
    } catch {
      // Backend not ready yet — will retry on next interval
    }
  }, [onReady]);

  // Poll health endpoint
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-primary transition-opacity duration-700 ${
        isReady ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        {/* Cooking pot animation */}
        <div className="relative">
          <div className="text-7xl sm:text-8xl animate-bounce" style={{ animationDuration: '2s' }}>
            🍳
          </div>
          {/* Steam wisps */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-2">
            <span className="inline-block text-2xl opacity-60 animate-steam-1">~</span>
            <span className="inline-block text-2xl opacity-40 animate-steam-2">~</span>
            <span className="inline-block text-2xl opacity-60 animate-steam-3">~</span>
          </div>
        </div>

        {/* Text */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-display text-white font-semibold">
            {isReady ? t('wakeUp.ready') : t('wakeUp.title')}
            {!isReady && <span className="inline-block w-8 text-left">{dots}</span>}
          </h1>
          {!isReady && (
            <p className="mt-2 text-base sm:text-lg text-white/70">
              {t('wakeUp.subtitle')}
            </p>
          )}
        </div>

        {/* Progress bar */}
        {!isReady && (
          <div className="w-48 h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-accent-orange animate-progress" />
          </div>
        )}
      </div>
    </div>
  );
}
