/**
 * RecipePlayPage — Immersive Kitchen-Optimized Cooking Mode
 * Full-screen dark theme with voice control, timers, ingredient checklist,
 * oversized touch targets, and screen wake lock.
 * Accessible via /:nickname/:recipeSlug/play
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { recipesApi, Recipe, Step } from '../services/recipes.api';
import { formatQuantity } from '../../../utils/measurement';
import { createLogger } from '../../../lib/logger';
import { VideoPlayer } from '../../media/components/VideoPlayer';

const logger = createLogger('RecipePlayPage');

// Web Speech API types (not in default TS lib)
/* eslint-disable @typescript-eslint/no-explicit-any */
type SpeechRecognitionType = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

// ============================================================================
// Helpers
// ============================================================================

function toSeconds(value: number | null, unit: string | null): number {
  if (!value || !unit) return 0;
  switch (unit) {
    case 'SECONDS': return value;
    case 'MINUTES': return value * 60;
    case 'HOURS': return value * 3600;
    case 'DAYS': return value * 86400;
    default: return value;
  }
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Voice command keyword matching (English + Hebrew)
const VOICE_COMMANDS: Record<string, string[]> = {
  next: ['next', 'הבא'],
  previous: ['previous', 'back', 'הקודם', 'אחורה'],
  describe: ['read instructions', 'read step', 'describe', 'read', 'קרא הוראות', 'תקריא', 'קרא'],
  ingredients: ['read ingredients', 'ingredients', 'קרא מרכיבים', 'מרכיבים'],
  play: ['play video', 'play', 'הפעל'],
  stop: ['stop', 'עצור'],
  louder: ['louder', 'volume up', 'חזק יותר'],
  quieter: ['quieter', 'volume down', 'שקט יותר', 'חלש יותר'],
  timer: ['start timer', 'activate timer', 'התחל טיימר'],
  timerStatus: ['timer status', 'סטטוס טיימר'],
  restart: ['restart', 'התחל מחדש'],
  bigger: ['bigger', 'larger', 'גדול יותר'],
  smaller: ['smaller', 'קטן יותר'],
  exit: ['exit', 'יציאה'],
  help: ['help', 'עזרה'],
};

function matchVoiceCommand(transcript: string): string | null {
  const lower = transcript.toLowerCase().trim();
  for (const [cmd, keywords] of Object.entries(VOICE_COMMANDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cmd;
  }
  return null;
}

// ============================================================================
// Main Component
// ============================================================================

export function RecipePlayPage() {
  const { nickname, recipeSlug } = useParams<{
    nickname: string;
    recipeSlug: string;
  }>();
  const navigate = useNavigate();
  const { t } = useTranslation('recipes');

  // Core state
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer state: { stepId: remainingSeconds }
  const [timers, setTimers] = useState<Record<string, number>>({});

  // Completed steps
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Ingredient checklist: { stepId: Set<ingredientId> }
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, Set<string>>>({});

  // Voice control
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [recognizedCommand, setRecognizedCommand] = useState('');
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  // Volume level
  const [volume, setVolume] = useState(1.0);

  // Font size scale (1.0 = default, range 0.8–1.6)
  const [fontScale, setFontScale] = useState(1.0);

  // Help overlay
  const [showHelp, setShowHelp] = useState(false);

  // Wake lock
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Audio context for timer chime
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Ref for latest voice command handler (avoids stale closures)
  const voiceHandlerRef = useRef<(cmd: string) => void>(() => {});

  // Touch swipe tracking
  const touchStartX = useRef<number | null>(null);

  const steps = recipe?.steps || [];
  const activeStep = steps[activeStepIdx] || null;
  const progress = steps.length > 0 ? Math.round(((activeStepIdx + 1) / steps.length) * 100) : 0;

  // ──────────────────────────────────────────────────────────────────────
  // Data Fetching
  // ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!nickname || !recipeSlug) {
      setError('Invalid URL');
      setLoading(false);
      return;
    }

    const fetchRecipe = async () => {
      setLoading(true);
      setError(null);
      const result = await recipesApi.getRecipeBySemanticUrl(nickname, recipeSlug);

      if (result.error) {
        logger.warning(`Failed to load recipe: ${result.error}`);
        setError(result.error.includes('not found') ? 'not_found' : 'error');
        setLoading(false);
        return;
      }

      if (result.recipe) {
        setRecipe(result.recipe);
      }
      setLoading(false);
    };

    fetchRecipe();
  }, [nickname, recipeSlug]);

  // ──────────────────────────────────────────────────────────────────────
  // Screen Wake Lock
  // ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          logger.debug('Wake lock acquired');
        }
      } catch (err) {
        logger.warning(`Wake lock failed: ${err}`);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // Timer Chime
  // ──────────────────────────────────────────────────────────────────────

  const playTimerChime = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (err) {
      logger.warning(`Timer chime failed: ${err}`);
    }
  }, [volume]);

  // ──────────────────────────────────────────────────────────────────────
  // Timer Tick
  // ──────────────────────────────────────────────────────────────────────

  const playChimeRef = useRef(playTimerChime);
  playChimeRef.current = playTimerChime;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const hasActive = Object.values(prev).some((r) => r > 0);
        if (!hasActive) return prev;
        const next: Record<string, number> = {};
        for (const [key, val] of Object.entries(prev)) {
          const newVal = Math.max(0, val - 1);
          if (val > 0 && newVal === 0) {
            playChimeRef.current();
          }
          next[key] = newVal;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // Timer Controls
  // ──────────────────────────────────────────────────────────────────────

  const startTimer = useCallback((stepId: string, step: Step) => {
    const secs = toSeconds(step.waitTime, step.waitTimeUnit);
    if (secs <= 0) return;
    setTimers((prev) => ({ ...prev, [stepId]: secs }));
  }, []);

  const stopTimer = useCallback((stepId: string) => {
    setTimers((prev) => {
      const next = { ...prev };
      delete next[stepId];
      return next;
    });
  }, []);

  const activeTimerCount = useMemo(
    () => Object.values(timers).filter((r) => r > 0).length,
    [timers],
  );

  // ──────────────────────────────────────────────────────────────────────
  // Text-to-Speech
  // ──────────────────────────────────────────────────────────────────────

  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.rate = 0.9;
    synth.speak(utterance);
  }, [volume]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────

  const goToStep = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= steps.length) return;
      if (idx > activeStepIdx) {
        setCompletedSteps((prev) => new Set(prev).add(activeStepIdx));
      }
      setActiveStepIdx(idx);
    },
    [steps.length, activeStepIdx],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goToStep(activeStepIdx + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goToStep(activeStepIdx - 1);
      } else if (e.key === 'Escape') {
        navigate(`/${nickname}/${recipeSlug}`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStepIdx, goToStep, nickname, recipeSlug, navigate]);

  // Touch swipe (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 80) {
      if (diff > 0) goToStep(activeStepIdx - 1);
      else goToStep(activeStepIdx + 1);
    }
    touchStartX.current = null;
  };

  // ──────────────────────────────────────────────────────────────────────
  // Voice Command Handler (ref-based to avoid stale closures)
  // ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    voiceHandlerRef.current = (cmd: string) => {
      switch (cmd) {
        case 'next':
          goToStep(activeStepIdx + 1);
          break;
        case 'previous':
          goToStep(activeStepIdx - 1);
          break;
        case 'describe':
          if (activeStep) speak(activeStep.instruction);
          break;
        case 'ingredients':
          if (activeStep) {
            const ingText = activeStep.ingredients
              .map((i) => `${formatQuantity(i.quantity, i.unit)} ${i.name}`)
              .join(', ');
            speak(ingText || t('play.no_ingredients'));
          }
          break;
        case 'stop':
          stopSpeaking();
          break;
        case 'louder':
          setVolume((v) => Math.min(1.0, v + 0.2));
          break;
        case 'quieter':
          setVolume((v) => Math.max(0.1, v - 0.2));
          break;
        case 'timer':
          if (activeStep) startTimer(activeStep.id, activeStep);
          break;
        case 'timerStatus':
          if (activeStep && timers[activeStep.id] !== undefined) {
            speak(`Timer: ${formatTimer(timers[activeStep.id])}`);
          }
          break;
        case 'restart':
          goToStep(0);
          break;
        case 'bigger':
          setFontScale((s) => Math.min(1.6, +(s + 0.1).toFixed(1)));
          break;
        case 'smaller':
          setFontScale((s) => Math.max(0.8, +(s - 0.1).toFixed(1)));
          break;
        case 'exit':
          navigate(`/${nickname}/${recipeSlug}`);
          break;
        case 'help': {
          setShowHelp(true);
          const helpText = [
            `${t('play.help_cmd_read_instructions')}`,
            `${t('play.help_cmd_read_ingredients')}`,
            `${t('play.help_cmd_stop')}`,
            `${t('play.help_cmd_next')}`,
            `${t('play.help_cmd_previous')}`,
            `${t('play.help_cmd_louder')}`,
            `${t('play.help_cmd_quieter')}`,
            `${t('play.help_cmd_bigger')}`,
            `${t('play.help_cmd_smaller')}`,
            `${t('play.help_cmd_timer')}`,
            `${t('play.help_cmd_restart')}`,
            `${t('play.help_cmd_exit')}`,
            `${t('play.help_cmd_help')}`,
          ].join('. ');
          speak(helpText);
          break;
        }
      }
    };
  }, [activeStepIdx, activeStep, timers, volume, goToStep, speak, stopSpeaking, startTimer, t, navigate, nickname, recipeSlug]);

  // ──────────────────────────────────────────────────────────────────────
  // Voice Control (Web Speech API)
  // iOS/iPadOS: All browsers use WebKit which has unreliable continuous
  // mode. We use single-shot mode + delayed restart on iOS.
  // ──────────────────────────────────────────────────────────────────────

  const isIOSRef = useRef(
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
  const voiceRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceRetryCountRef = useRef(0);

  const startVoiceRecognition = useCallback(() => {
    const SpeechRecognitionCtor =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      logger.warning('SpeechRecognition not supported in this browser');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognitionCtor as any)();
    // iOS WebKit: continuous mode is unreliable — use single-shot + restart
    recognition.continuous = !isIOSRef.current;
    recognition.interimResults = false;
    recognition.lang = document.documentElement.lang === 'he' ? 'he-IL' : 'en-US';

    recognition.onresult = (event: { results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } } }) => {
      const last = event.results[event.results.length - 1];
      if (last.isFinal) {
        voiceRetryCountRef.current = 0; // successful result resets retry counter
        const transcript = last[0].transcript;
        logger.debug(`Voice recognized: ${transcript}`);
        const cmd = matchVoiceCommand(transcript);
        if (cmd) {
          setRecognizedCommand(cmd);
          voiceHandlerRef.current(cmd);
          setTimeout(() => setRecognizedCommand(''), 2000);
        }
      }
    };

    recognition.onerror = (event: { error: string }) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        logger.warning('Microphone permission denied');
        recognitionRef.current = null;
        setVoiceEnabled(false);
        return;
      }
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        logger.warning(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still enabled (delayed for iOS compatibility)
      if (recognitionRef.current === recognition) {
        if (voiceRetryCountRef.current >= 5) {
          // Too many silent restarts — stop to avoid battery drain
          logger.warning('Voice recognition: too many retries, pausing');
          recognitionRef.current = null;
          setVoiceEnabled(false);
          return;
        }
        voiceRetryCountRef.current += 1;
        const delay = isIOSRef.current ? 300 : 50;
        voiceRestartTimerRef.current = setTimeout(() => {
          if (recognitionRef.current === recognition) {
            try {
              recognition.start();
            } catch {
              /* already running or stopped intentionally */
            }
          }
        }, delay);
      }
    };

    recognitionRef.current = recognition;
    voiceRetryCountRef.current = 0;
    try {
      recognition.start();
      setVoiceEnabled(true);
    } catch {
      logger.warning('Could not start speech recognition');
    }
  }, []);

  const stopVoiceRecognition = useCallback(() => {
    if (voiceRestartTimerRef.current) {
      clearTimeout(voiceRestartTimerRef.current);
      voiceRestartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      const ref = recognitionRef.current;
      recognitionRef.current = null; // prevent restart in onend
      ref.stop();
    }
    setVoiceEnabled(false);
    setRecognizedCommand('');
  }, []);

  const toggleVoice = useCallback(() => {
    if (voiceEnabled) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  }, [voiceEnabled, startVoiceRecognition, stopVoiceRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (voiceRestartTimerRef.current) {
        clearTimeout(voiceRestartTimerRef.current);
      }
      if (recognitionRef.current) {
        const ref = recognitionRef.current;
        recognitionRef.current = null;
        ref.stop();
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // Ingredient Checklist
  // ──────────────────────────────────────────────────────────────────────

  const toggleIngredient = useCallback((stepId: string, ingredientId: string) => {
    setCheckedIngredients((prev) => {
      const stepChecked = new Set(prev[stepId] || []);
      if (stepChecked.has(ingredientId)) {
        stepChecked.delete(ingredientId);
      } else {
        stepChecked.add(ingredientId);
      }
      return { ...prev, [stepId]: stepChecked };
    });
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // Render: Loading / Error States
  // ──────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c1a11] flex items-center justify-center">
        <div className="text-white/60">{t('steps.loading')}</div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-[#0c1a11] flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">🍳</div>
        <h1 className="text-2xl font-bold text-white">
          {error === 'not_found' ? t('steps.not_found') : t('steps.error')}
        </h1>
        <p className="text-white/60">
          {error === 'not_found' ? t('steps.not_found_message') : t('steps.error_message')}
        </p>
        <div className="flex gap-4 mt-4">
          <Link
            to={`/${nickname}/${recipeSlug}`}
            className="px-6 py-3 bg-white/10 text-white rounded-full hover:bg-white/20 font-medium"
          >
            {t('steps.view_recipe')}
          </Link>
          <Link
            to="/"
            className="px-6 py-3 bg-[#13ec5b] text-[#102216] rounded-full hover:opacity-90 font-bold"
          >
            {t('steps.go_home')}
          </Link>
        </div>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="min-h-screen bg-[#0c1a11] flex flex-col items-center justify-center gap-4 text-white/60">
        <span className="material-symbols-outlined text-6xl">restaurant_menu</span>
        <p>{t('steps.no_steps_yet')}</p>
        <Link
          to={`/${nickname}/${recipeSlug}`}
          className="mt-4 px-6 py-3 bg-[#13ec5b] text-[#102216] rounded-full font-bold"
        >
          {t('steps.view_recipe')}
        </Link>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // Derived values for render
  // ──────────────────────────────────────────────────────────────────────

  const stepTimerSeconds = activeStep ? timers[activeStep.id] : undefined;
  const stepHasTimer = !!(activeStep && activeStep.waitTime && activeStep.waitTimeUnit);
  const stepTimerTotal = activeStep ? toSeconds(activeStep.waitTime, activeStep.waitTimeUnit) : 0;

  // ──────────────────────────────────────────────────────────────────────
  // Render: Main Play Layout
  // ──────────────────────────────────────────────────────────────────────

  return (
    <div
      className="h-screen w-full flex bg-[#0c1a11] text-white overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Left Pane: Step Navigator (desktop/tablet) ── */}
      <aside className="hidden md:flex flex-col w-80 lg:w-96 flex-shrink-0 border-r border-white/10 bg-[#0c1a11]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="bg-[#13ec5b]/20 p-2 rounded-full">
            <span className="material-symbols-outlined text-[#13ec5b]">restaurant</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-lg leading-tight truncate">Kitchen48</h1>
            <p className="text-sm text-white/50 truncate">{recipe.title}</p>
          </div>
          <button
            onClick={() => navigate(`/${nickname}/${recipeSlug}`)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
            title={t('play.exit')}
          >
            <span className="material-symbols-outlined text-white/60">close</span>
          </button>
        </div>

        {/* Step List */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-3">
          {steps.map((s, idx) => {
            const isActive = idx === activeStepIdx;
            const isComplete = completedSteps.has(idx);
            const title = s.title || s.instruction.slice(0, 30) + (s.instruction.length > 30 ? '...' : '');

            return (
              <button
                key={s.id}
                onClick={() => goToStep(idx)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-white/10 relative overflow-hidden'
                    : isComplete
                      ? 'bg-white/5 opacity-60'
                      : 'hover:bg-white/5 cursor-pointer'
                }`}
                style={
                  isActive
                    ? {
                        boxShadow: '0 0 20px rgba(251, 146, 60, 0.4)',
                        border: '2px solid #fb923c',
                      }
                    : undefined
                }
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-400" />
                )}

                {isComplete && !isActive ? (
                  <span
                    className="material-symbols-outlined text-[#13ec5b]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                ) : isActive ? (
                  <span
                    className="material-symbols-outlined text-orange-400"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    radio_button_checked
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-white/40">
                    radio_button_unchecked
                  </span>
                )}

                <span
                  className={`font-medium truncate ${
                    isActive
                      ? 'font-bold text-orange-400'
                      : isComplete
                        ? ''
                        : 'text-white/60'
                  }`}
                >
                  {idx + 1}. {title}
                </span>

                {/* Floating timer badge for non-active steps */}
                {timers[s.id] !== undefined && timers[s.id] > 0 && !isActive && (
                  <span className="ml-auto text-xs font-mono text-[#13ec5b] bg-[#13ec5b]/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    {formatTimer(timers[s.id])}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Overall Progress */}
        <div className="p-6 bg-white/5 border-t border-white/10">
          <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wider text-white/40">
            <span>{t('play.overall_progress')}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#13ec5b] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col relative bg-[#0c1a11]">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full">
            {/* Voice Control Bar */}
            <div className="bg-black/90 backdrop-blur-md rounded-t-xl border-x border-t border-white/10 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                {/* Exit button (mobile) */}
                <button
                  onClick={() => navigate(`/${nickname}/${recipeSlug}`)}
                  className="md:hidden p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                  title={t('play.exit')}
                >
                  <span className="material-symbols-outlined text-white/60">close</span>
                </button>
                <button
                  onClick={toggleVoice}
                  className="relative flex items-center justify-center flex-shrink-0"
                  style={{ minWidth: '40px', minHeight: '40px' }}
                >
                  {voiceEnabled && (
                    <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-[#4CAF50] opacity-20" />
                  )}
                  <div
                    className={`p-2 rounded-full relative z-10 ${voiceEnabled ? 'bg-[#4CAF50]' : 'bg-white/20'}`}
                  >
                    <span
                      className="material-symbols-outlined text-white text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {voiceEnabled ? 'mic' : 'mic_off'}
                    </span>
                  </div>
                </button>
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-widest ${voiceEnabled ? 'text-[#4CAF50]' : 'text-white/40'}`}
                  >
                    {voiceEnabled ? t('play.voice_active') : t('play.voice_off')}
                  </span>
                  <span className="text-xs text-white/60 font-medium italic leading-tight truncate">
                    {recognizedCommand
                      ? t('play.command_recognized', { command: recognizedCommand })
                      : voiceEnabled
                        ? t('play.listening')
                        : t('play.tap_to_enable')}
                  </span>
                </div>
              </div>

              {/* Voice command hint buttons (desktop) */}
              <div className="hidden lg:flex items-center gap-4 xl:gap-6 flex-shrink-0">
                <button
                  onClick={() => activeStep && speak(activeStep.instruction)}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#4CAF50] group-hover:scale-110 transition-transform">
                    record_voice_over
                  </span>
                  <span className="text-[9px] uppercase font-bold text-white/50">
                    {t('play.say_read_instructions')}
                  </span>
                </button>
                <button
                  onClick={() => {
                    if (activeStep) {
                      const ingText = activeStep.ingredients
                        .map((i) => `${formatQuantity(i.quantity, i.unit)} ${i.name}`)
                        .join(', ');
                      speak(ingText || t('play.no_ingredients'));
                    }
                  }}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#4CAF50] group-hover:scale-110 transition-transform">
                    shopping_basket
                  </span>
                  <span className="text-[9px] uppercase font-bold text-white/50">
                    {t('play.say_read_ingredients')}
                  </span>
                </button>
                <button
                  onClick={stopSpeaking}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <span
                    className="material-symbols-outlined text-[#4CAF50] group-hover:scale-110 transition-transform"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    stop_circle
                  </span>
                  <span className="text-[9px] uppercase font-bold text-white/50">
                    {t('play.say_stop')}
                  </span>
                </button>
                <button
                  onClick={() => setVolume((v) => Math.min(1.0, v + 0.2))}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#4CAF50] group-hover:scale-110 transition-transform">
                    volume_up
                  </span>
                  <span className="text-[9px] uppercase font-bold text-white/50">
                    {t('play.say_louder')}
                  </span>
                </button>
                <button
                  onClick={() => setVolume((v) => Math.max(0.1, v - 0.2))}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#4CAF50] group-hover:scale-110 transition-transform">
                    volume_down
                  </span>
                  <span className="text-[9px] uppercase font-bold text-white/50">
                    {t('play.say_quieter')}
                  </span>
                </button>
                <div className="h-6 w-px bg-white/10" />
                <button
                  onClick={() => setFontScale((s) => Math.min(1.6, +(s + 0.1).toFixed(1)))}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#4CAF50] group-hover:scale-110 transition-transform">
                    text_increase
                  </span>
                  <span className="text-[9px] uppercase font-bold text-white/50">
                    {t('play.say_bigger')}
                  </span>
                </button>
                <button
                  onClick={() => setFontScale((s) => Math.max(0.8, +(s - 0.1).toFixed(1)))}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#4CAF50] group-hover:scale-110 transition-transform">
                    text_decrease
                  </span>
                  <span className="text-[9px] uppercase font-bold text-white/50">
                    {t('play.say_smaller')}
                  </span>
                </button>
              </div>

              {/* Help button */}
              <button
                onClick={() => setShowHelp((v) => !v)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/5 transition-colors flex-shrink-0"
                title={t('play.help_title')}
              >
                <span className="material-symbols-outlined text-white/60 text-xl">help</span>
              </button>
            </div>

            {/* Step Image */}
            {(() => {
              const stepImg = activeStep?.image?.status === 'ready' ? activeStep.image : null;
              const stepImgUrl = stepImg?.url || null;
              return stepImgUrl ? (
                <div className="w-full rounded-lg overflow-hidden shadow-2xl border border-white/10">
                  <img
                    src={stepImgUrl}
                    alt={activeStep?.title || t('play.step_label', { n: activeStepIdx + 1 })}
                    className="w-full max-h-72 object-cover"
                  />
                </div>
              ) : null;
            })()}

            {/* Video Player Area */}
            {(() => {
              const stepVid = activeStep?.video?.status === 'ready' ? activeStep.video : null;
              const videoSrc = stepVid?.url || activeStep?.videoUrl || null;
              const posterSrc = stepVid?.thumbnailUrl || null;
              return videoSrc ? (
                <div className="w-full rounded-lg overflow-hidden shadow-2xl border border-white/10">
                  <VideoPlayer
                    src={videoSrc}
                    poster={posterSrc}
                    className="rounded-lg"
                  />
                </div>
              ) : null;
            })()}

            {/* Step Content */}
            <div className="mt-6 sm:mt-8 md:mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
              {/* Left Column: Instructions */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4 md:mb-6">
                  <span className="text-[#13ec5b]">
                    {t('play.step_label', { n: activeStepIdx + 1 })}
                  </span>
                  {activeStep?.title && (
                    <span className="text-white">: {activeStep.title}</span>
                  )}
                </h2>

                <p
                  className="text-lg sm:text-xl lg:text-2xl leading-relaxed text-white/80 transition-all"
                  style={{ fontSize: `${fontScale * 1.25}rem` }}
                >
                  {activeStep?.instruction}
                </p>

                {/* Inline Timer Widget */}
                {stepHasTimer && (
                  <div className="mt-6 md:mt-8 p-4 md:p-6 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white/40 mb-1 flex items-center gap-2">
                          <span className="material-symbols-outlined text-base">timer</span>
                          {t('play.timer')}
                        </h3>
                        <p className="text-4xl md:text-5xl font-mono font-bold text-[#13ec5b]">
                          {stepTimerSeconds !== undefined
                            ? formatTimer(stepTimerSeconds)
                            : formatTimer(stepTimerTotal)}
                        </p>
                        {stepTimerSeconds === 0 && (
                          <p className="text-orange-400 font-semibold mt-2 animate-pulse text-lg">
                            {t('steps.timer_done')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        {stepTimerSeconds === undefined || stepTimerSeconds === 0 ? (
                          <button
                            onClick={() => activeStep && startTimer(activeStep.id, activeStep)}
                            className="px-6 py-3 bg-[#13ec5b] text-[#102216] rounded-full font-bold text-base sm:text-lg hover:scale-105 active:scale-95 transition-all"
                            style={{ minHeight: '48px' }}
                          >
                            {t('steps.timer_start')}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => activeStep && stopTimer(activeStep.id)}
                              className="px-5 py-3 bg-red-500/80 text-white rounded-full font-bold text-base hover:bg-red-500 transition-all"
                              style={{ minHeight: '48px' }}
                            >
                              {t('steps.timer_stop')}
                            </button>
                            <button
                              onClick={() => activeStep && startTimer(activeStep.id, activeStep)}
                              className="px-5 py-3 bg-white/10 text-white rounded-full font-bold text-base hover:bg-white/20 transition-all"
                              style={{ minHeight: '48px' }}
                            >
                              {t('steps.timer_reset')}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Ingredient Checklist */}
              {activeStep && (
                <div key={activeStep.id} className="bg-white/5 rounded-xl p-5 md:p-6 h-fit border border-white/10 lg:sticky lg:top-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">shopping_basket</span>
                    {t('play.needed_for_step')}
                  </h3>
                  {activeStep.ingredients.length > 0 ? (
                    <ul className="space-y-4">
                      {activeStep.ingredients.map((ing) => {
                        const isChecked =
                          checkedIngredients[activeStep.id]?.has(ing.id) || false;
                        return (
                          <li key={ing.id} className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleIngredient(activeStep.id, ing.id)}
                              className="mt-1 h-6 w-6 rounded border-white/20 bg-transparent text-[#13ec5b] focus:ring-[#13ec5b] cursor-pointer flex-shrink-0"
                              style={{ minWidth: '24px', minHeight: '24px' }}
                            />
                            <div className={isChecked ? 'opacity-50 line-through' : ''}>
                              <p
                                className="font-bold text-lg transition-all"
                                style={{ fontSize: `${fontScale * 1.125}rem` }}
                              >
                                {formatQuantity(ing.quantity, ing.unit)} {ing.name}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-white/40 text-sm italic">{t('play.no_ingredients')}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Help Overlay ── */}
        {showHelp && (
          <div
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowHelp(false)}
          >
            <div
              className="bg-[#1a2e20] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#13ec5b]">help</span>
                  {t('play.help_title')}
                </h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-white/60">close</span>
                </button>
              </div>
              <ul className="space-y-3">
                {[
                  { icon: 'record_voice_over', cmd: t('play.help_kw_read_instructions'), desc: t('play.help_cmd_read_instructions') },
                  { icon: 'shopping_basket', cmd: t('play.help_kw_read_ingredients'), desc: t('play.help_cmd_read_ingredients') },
                  { icon: 'stop_circle', cmd: t('play.help_kw_stop'), desc: t('play.help_cmd_stop') },
                  { icon: 'skip_next', cmd: t('play.help_kw_next'), desc: t('play.help_cmd_next') },
                  { icon: 'skip_previous', cmd: t('play.help_kw_previous'), desc: t('play.help_cmd_previous') },
                  { icon: 'volume_up', cmd: t('play.help_kw_louder'), desc: t('play.help_cmd_louder') },
                  { icon: 'volume_down', cmd: t('play.help_kw_quieter'), desc: t('play.help_cmd_quieter') },
                  { icon: 'text_increase', cmd: t('play.help_kw_bigger'), desc: t('play.help_cmd_bigger') },
                  { icon: 'text_decrease', cmd: t('play.help_kw_smaller'), desc: t('play.help_cmd_smaller') },
                  { icon: 'timer', cmd: t('play.help_kw_timer'), desc: t('play.help_cmd_timer') },
                  { icon: 'replay', cmd: t('play.help_kw_restart'), desc: t('play.help_cmd_restart') },
                  { icon: 'logout', cmd: t('play.help_kw_exit'), desc: t('play.help_cmd_exit') },
                  { icon: 'help', cmd: t('play.help_kw_help'), desc: t('play.help_cmd_help') },
                ].map((item) => (
                  <li key={item.cmd} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#13ec5b] text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <span className="font-bold text-white text-sm">{item.cmd}</span>
                      <p className="text-white/50 text-xs">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-white/30 text-center">{t('play.help_hint')}</p>
            </div>
          </div>
        )}

        {/* ── Bottom Navigation Bar (Sticky) ── */}
        <div className="p-3 sm:p-4 md:p-6 border-t border-white/10 bg-[#0c1a11]/80 backdrop-blur-md flex-shrink-0">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            {/* Previous */}
            <button
              onClick={() => goToStep(activeStepIdx - 1)}
              disabled={activeStepIdx === 0}
              className={`flex items-center gap-2 px-5 sm:px-6 md:px-8 py-3 md:py-4 rounded-full font-bold transition-all ${
                activeStepIdx === 0
                  ? 'text-white/20 cursor-not-allowed'
                  : 'text-white/70 bg-white/10 hover:bg-white/20'
              }`}
              style={{ minHeight: '48px' }}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="hidden sm:inline">{t('steps.previous')}</span>
            </button>

            {/* Center: Timer + Volume (desktop/tablet) */}
            <div className="hidden md:flex items-center gap-6 md:gap-8">
              {stepHasTimer && (
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-white/40">
                    {t('play.timer')}
                  </span>
                  <span className="text-xl font-mono font-bold text-[#13ec5b]">
                    {stepTimerSeconds !== undefined
                      ? formatTimer(stepTimerSeconds)
                      : formatTimer(stepTimerTotal)}
                  </span>
                </div>
              )}
              {activeTimerCount > 0 && (
                <>
                  <div className="h-8 w-px bg-white/10" />
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#13ec5b]/20 text-[#13ec5b] text-xs rounded-full font-bold">
                    <span className="material-symbols-outlined text-sm">timer</span>
                    {activeTimerCount} {t('play.active_timers')}
                  </span>
                </>
              )}
              <div className="h-8 w-px bg-white/10" />
              <button
                onClick={() => setVolume((v) => (v > 0 ? 0 : 1.0))}
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 transition-all"
                style={{ minWidth: '48px', minHeight: '48px' }}
              >
                <span className="material-symbols-outlined">
                  {volume > 0 ? 'volume_up' : 'volume_off'}
                </span>
              </button>
            </div>

            {/* Mobile progress indicator */}
            <div className="md:hidden flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-white/40">
                {activeStepIdx + 1}/{steps.length}
              </span>
              <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-[#13ec5b] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Next */}
            <button
              onClick={() => goToStep(activeStepIdx + 1)}
              disabled={activeStepIdx === steps.length - 1}
              className={`flex items-center gap-2 px-6 sm:px-8 md:px-10 py-3 md:py-4 rounded-full font-bold transition-all ${
                activeStepIdx === steps.length - 1
                  ? 'bg-white/10 text-white/20 cursor-not-allowed'
                  : 'bg-[#13ec5b] text-[#102216] hover:scale-105 active:scale-95 shadow-xl shadow-[#13ec5b]/20'
              }`}
              style={{ minHeight: '48px' }}
            >
              <span className="hidden sm:inline">{t('steps.next')}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default RecipePlayPage;
