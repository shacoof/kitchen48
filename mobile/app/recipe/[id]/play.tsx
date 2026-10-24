import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { Text } from '../../../src/components/ScaledText';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { getRecipeById, type RecipeWithSteps, type StepWithIngredients } from '../../../src/db/recipes-db';
import {
  startOrResumeSession,
  stopSession,
  advanceToStep,
  startStepTimer,
  pauseStepTimer,
  resumeStepTimer,
  cancelStepTimer,
  findLiveTimer,
} from '../../../src/services/play-session-service';
import { listActiveSessions, type PlaySession } from '../../../src/db/play-sessions-db';
import { listLiveTimersForSession, type StepTimer, type TimerKind } from '../../../src/db/step-timers-db';
import { getSetting, setSetting } from '../../../src/db/settings-db';
import { useSessionTimers, computeRemainingMs, formatCountdown } from '../../../src/hooks/useSessionTimers';
import { handleFiredTimers } from '../../../src/services/timer-alarms';
import { useScreenHeader } from '../../../src/hooks/useScreenHeader';
import { useVoiceControl } from '../../../src/hooks/useVoiceControl';
import { speak, stopSpeaking, onSpeakingChange } from '../../../src/services/tts';
import { VOICE_COMMANDS, titleMatchScore, type MatchedCommand } from '../../../src/voice/commands';
import { VoiceBar } from '../../../src/components/VoiceBar';
import { VoiceHelpModal } from '../../../src/components/VoiceHelpModal';
import { createLogger } from '../../../src/lib/logger';

const logger = createLogger('PlayScreen');

export default function PlayScreen() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation('common');
  const router = useRouter();

  const [recipe, setRecipe] = useState<RecipeWithSteps | null>(null);
  const [session, setSession] = useState<PlaySession | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const { timers, refresh: refreshTimers } = useSessionTimers(session?.id ?? null);
  const [autoRead, setAutoRead] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [speaking, setSpeakingState] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      const loaded = await getRecipeById(id);
      if (cancelled || !loaded) return;
      setRecipe(loaded);
      const newSession = await startOrResumeSession(id);
      if (cancelled) return;
      setSession(newSession);
      // If resuming, jump to current step
      if (newSession.currentStepId) {
        const idx = loaded.steps.findIndex((s) => s.id === newSession.currentStepId);
        if (idx >= 0) setStepIdx(idx);
      }
    })().catch((err) => logger.error(`Play init failed: ${err}`));
    return () => { cancelled = true; };
  }, [id]);

  const currentStep: StepWithIngredients | null = recipe?.steps[stepIdx] ?? null;

  const goToStep = useCallback(async (idx: number) => {
    if (!recipe || !session) return;
    const clamped = Math.max(0, Math.min(recipe.steps.length - 1, idx));
    setStepIdx(clamped);
    const step = recipe.steps[clamped];
    if (step) await advanceToStep(session.id, step.id);
  }, [recipe, session]);

  const handleStop = useCallback(() => {
    if (!session || !recipe) return;
    Alert.alert(
      t('play.stop_title', 'Stop cooking?'),
      t('play.stop_body', '"{{title}}" will be removed and all its timers will be lost.', {
        title: recipe.title,
      }),
      [
        { text: t('buttons.cancel'), style: 'cancel' },
        {
          text: t('play.stop_confirm', 'Stop'),
          style: 'destructive',
          onPress: async () => {
            await stopSession(session.id);
            router.back();
          },
        },
      ]
    );
  }, [session, recipe, t, router]);

  const handleTimerToggle = useCallback(async (kind: TimerKind, minutes: number | null) => {
    if (!session || !recipe || !currentStep || !minutes || minutes <= 0) return;
    const existing = await findLiveTimer(session.id, currentStep.id, kind);
    if (!existing) {
      await startStepTimer({
        sessionId: session.id,
        stepId: currentStep.id,
        kind,
        durationMs: minutes * 60 * 1000,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
      });
    } else if (existing.state === 'running') {
      await pauseStepTimer(existing.id);
    } else if (existing.state === 'paused') {
      await resumeStepTimer(existing.id, recipe.id, recipe.title);
    }
    refreshTimers();
  }, [session, recipe, currentStep, refreshTimers]);

  const handleTimerCancel = useCallback(async (timer: StepTimer) => {
    await cancelStepTimer(timer.id);
    refreshTimers();
  }, [refreshTimers]);

  // ---- Voice: TTS --------------------------------------------------------

  useEffect(() => onSpeakingChange(setSpeakingState), []);
  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    getSetting('voice_auto_read')
      .then((v) => setAutoRead(v !== '0'))
      .catch((err) => logger.error(`Failed to load voice_auto_read: ${err}`));
  }, []);

  const handleAutoReadChange = useCallback((value: boolean) => {
    setAutoRead(value);
    setSetting('voice_auto_read', value ? '1' : '0')
      .catch((err) => logger.error(`Failed to save voice_auto_read: ${err}`));
  }, []);

  const say = useCallback((...parts: string[]) => speak(parts, i18n.language), [i18n.language]);

  const spokenTime = useCallback((ms: number) => {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    if (m > 0 && s > 0) return t('voice.time_ms', { m, s });
    if (m > 0) return t('voice.time_m', { m });
    return t('voice.time_s', { s });
  }, [t]);

  // Speech mirrors what the screen shows for the step.
  const instructionParts = useCallback((step: StepWithIngredients) =>
    [step.title ?? '', step.instruction ?? ''], []);

  const ingredientParts = useCallback((step: StepWithIngredients) => {
    if (step.ingredients.length === 0) return [t('voice.no_ingredients')];
    return [
      t('voice.ingredients_intro'),
      ...step.ingredients.map((ing) =>
        `${ing.quantity ? `${ing.quantity} ` : ''}${ing.unit ? `${ing.unit} ` : ''}${ing.name}`),
    ];
  }, [t]);

  const readStep = useCallback((step: StepWithIngredients) => {
    const parts = [...instructionParts(step)];
    if (step.ingredients.length > 0) parts.push(...ingredientParts(step));
    return speak(parts, i18n.language);
  }, [instructionParts, ingredientParts, i18n.language]);

  // Auto-read when the step changes (not on first open, so resuming a
  // session doesn't start talking unprompted).
  const prevStepIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!currentStep) return;
    const prev = prevStepIdRef.current;
    prevStepIdRef.current = currentStep.id;
    if (prev !== null && prev !== currentStep.id && autoRead) void readStep(currentStep);
  }, [currentStep, autoRead, readStep]);

  // ---- Voice: commands ---------------------------------------------------

  const kindLabel = useCallback((kind: TimerKind) => t(`play.${kind}`), [t]);

  /**
   * Which session a timer command targets: the foreground one, unless the
   * transcript names another active recipe ("pause lasagna timer").
   */
  const resolveTimerTarget = useCallback(async (cmd: MatchedCommand) => {
    if (!session || !recipe) return null;
    let best = { sessionId: session.id, recipeId: recipe.id, title: recipe.title, foreground: true };
    let bestScore = titleMatchScore(cmd.text, recipe.title);
    for (const other of await listActiveSessions()) {
      if (other.id === session.id) continue;
      const otherRecipe = await getRecipeById(other.recipeId);
      if (!otherRecipe) continue;
      const score = titleMatchScore(cmd.text, otherRecipe.title);
      if (score > bestScore) {
        bestScore = score;
        best = { sessionId: other.id, recipeId: otherRecipe.id, title: otherRecipe.title, foreground: false };
      }
    }
    return best;
  }, [session, recipe]);

  const handleStartTimerCommand = useCallback(async (cmd: MatchedCommand) => {
    if (!session || !recipe || !currentStep) return;
    const prepLive = timers.find((x) => x.stepId === currentStep.id && x.kind === 'prep'
      && (x.state === 'running' || x.state === 'paused'));
    let kind: TimerKind | null = cmd.timerKind;
    if (!kind) {
      if (currentStep.prepTime && (!prepLive || !currentStep.waitTime)) kind = 'prep';
      else if (currentStep.waitTime) kind = 'wait';
    }
    const minutes = kind === 'prep' ? currentStep.prepTime : kind === 'wait' ? currentStep.waitTime : null;
    if (!kind || !minutes || minutes <= 0) {
      void say(t('voice.no_timer'));
      return;
    }
    const label = kindLabel(kind);
    const existing = await findLiveTimer(session.id, currentStep.id, kind);
    if (existing?.state === 'running') {
      void say(t('voice.timer_already_running', { label }));
    } else if (existing?.state === 'paused') {
      await resumeStepTimer(existing.id, recipe.id, recipe.title);
      void say(t('voice.timer_resumed', { label }));
    } else {
      await handleTimerToggle(kind, minutes);
      void say(t('voice.timer_started', { label, time: spokenTime(minutes * 60 * 1000) }));
    }
    refreshTimers();
  }, [session, recipe, currentStep, timers, kindLabel, say, t, spokenTime, handleTimerToggle, refreshTimers]);

  const handleTimerActionCommand = useCallback(async (cmd: MatchedCommand) => {
    const target = await resolveTimerTarget(cmd);
    if (!target) return;
    let live = await listLiveTimersForSession(target.sessionId);
    if (cmd.timerKind) live = live.filter((x) => x.kind === cmd.timerKind);
    // Foreground: prefer timers on the visible step.
    if (target.foreground && currentStep) {
      live = [...live].sort((a, b) =>
        Number(b.stepId === currentStep.id) - Number(a.stepId === currentStep.id));
    }
    const label = (timer: StepTimer) =>
      target.foreground ? kindLabel(timer.kind) : `${target.title} ${kindLabel(timer.kind)}`;

    if (cmd.id === 'timerStatus') {
      if (live.length === 0) {
        void say(t('voice.no_active_timer'));
        return;
      }
      void say(...live.map((timer) => t(
        timer.state === 'paused' ? 'voice.timer_left_paused' : 'voice.timer_left',
        { label: label(timer), time: spokenTime(computeRemainingMs(timer)) },
      )));
      return;
    }

    const wanted = cmd.id === 'pauseTimer' ? ['running']
      : cmd.id === 'resumeTimer' ? ['paused']
      : ['running', 'paused'];
    const timer = live.find((x) => wanted.includes(x.state));
    if (!timer) {
      void say(t('voice.no_active_timer'));
      return;
    }
    if (cmd.id === 'pauseTimer') {
      await pauseStepTimer(timer.id);
      void say(t('voice.timer_paused', { label: label(timer) }));
    } else if (cmd.id === 'resumeTimer') {
      await resumeStepTimer(timer.id, target.recipeId, target.title);
      void say(t('voice.timer_resumed', { label: label(timer) }));
    } else {
      await cancelStepTimer(timer.id);
      void say(t('voice.timer_reset', { label: label(timer) }));
    }
    refreshTimers();
  }, [resolveTimerTarget, currentStep, kindLabel, say, t, spokenTime, refreshTimers]);

  const handleVoiceCommand = useCallback((cmd: MatchedCommand) => {
    if (!recipe || !currentStep) return;
    void Haptics.selectionAsync();
    const run = async () => {
      switch (cmd.id) {
        case 'next':
          if (stepIdx >= recipe.steps.length - 1) void say(t('voice.last_step'));
          else await goToStep(stepIdx + 1);
          break;
        case 'previous':
          if (stepIdx === 0) void say(t('voice.first_step'));
          else await goToStep(stepIdx - 1);
          break;
        case 'restart':
          await goToStep(0);
          break;
        case 'describe':
          void say(...instructionParts(currentStep));
          break;
        case 'ingredients':
          void say(...ingredientParts(currentStep));
          break;
        case 'stop':
          stopSpeaking();
          break;
        case 'timer':
          await handleStartTimerCommand(cmd);
          break;
        case 'pauseTimer':
        case 'resumeTimer':
        case 'resetTimer':
        case 'timerStatus':
          await handleTimerActionCommand(cmd);
          break;
        case 'exit':
          stopSpeaking();
          router.back();
          break;
        case 'help':
          setHelpOpen(true);
          void say(t('voice.help_spoken', {
            list: VOICE_COMMANDS.map((c) => t(`voice.cmd.${c.id}.keyword`).replace(/"/g, '')).join(', '),
          }));
          break;
      }
    };
    run().catch((err) => logger.error(`Voice command ${cmd.id} failed: ${err}`));
  }, [recipe, currentStep, stepIdx, goToStep, say, t, instructionParts, ingredientParts,
    handleStartTimerCommand, handleTimerActionCommand, router]);

  const voice = useVoiceControl({ lang: i18n.language, onCommand: handleVoiceCommand });
  const stopVoice = voice.stop;

  // Leaving the screen (even without unmounting) stops the mic and speech.
  useFocusEffect(useCallback(() => () => {
    stopVoice();
    stopSpeaking();
  }, [stopVoice]));

  const handleReadToggle = useCallback(() => {
    if (speaking) stopSpeaking();
    else if (currentStep) void readStep(currentStep);
  }, [speaking, currentStep, readStep]);

  // Foreground alarm loop: tick once a second and fire haptics when any
  // running timer in the session hits zero. DB state updates to 'fired'.
  useEffect(() => {
    if (!session) return;
    const tick = () => { void handleFiredTimers(timers); };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session, timers]);

  const headerTitle = recipe
    ? `${recipe.title} · ${t('play.step_counter_short', 'Step {{n}}/{{total}}', {
        n: stepIdx + 1, total: recipe.steps.length,
      })}`
    : t('messages.loading');

  const atFirstStep = stepIdx === 0;
  const atLastStep = !recipe || stepIdx >= recipe.steps.length - 1;

  useScreenHeader(useMemo(() => ({
    title: headerTitle,
    showBack: true,
    actions: [
      {
        icon: 'play-skip-back-outline',
        label: t('play.prev', 'Prev'),
        onPress: () => goToStep(stepIdx - 1),
        disabled: atFirstStep,
      },
      {
        icon: 'play-skip-forward-outline',
        label: t('play.next', 'Next'),
        onPress: () => goToStep(stepIdx + 1),
        disabled: atLastStep,
      },
      {
        icon: 'stop-circle-outline',
        label: t('play.stop', 'Stop'),
        onPress: handleStop,
        tint: '#dc2626',
      },
    ],
  }), [headerTitle, t, handleStop, goToStep, stepIdx, atFirstStep, atLastStep]));

  if (!recipe || !session || !currentStep) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  const prepTimer = timers.find(
    (x) => x.stepId === currentStep.id && x.kind === 'prep' && (x.state === 'running' || x.state === 'paused')
  );
  const waitTimer = timers.find(
    (x) => x.stepId === currentStep.id && x.kind === 'wait' && (x.state === 'running' || x.state === 'paused')
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {currentStep.title ? (
          <Text style={styles.stepTitle}>{currentStep.title}</Text>
        ) : null}
        {currentStep.instruction ? (
          <Text style={styles.stepInstruction}>{currentStep.instruction}</Text>
        ) : null}

        {currentStep.ingredients.length > 0 ? (
          <View style={styles.ingSection}>
            <Text style={styles.ingHeader}>{t('play.for_this_step', 'For this step')}</Text>
            {currentStep.ingredients.map((ing) => (
              <Text key={ing.id} style={styles.ingLine}>
                {ing.quantity ? `${ing.quantity} ` : ''}{ing.unit ? `${ing.unit} ` : ''}{ing.name}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.timerGrid}>
          <TimerCard
            label={t('play.prep', 'Prep')}
            minutes={currentStep.prepTime}
            timer={prepTimer}
            onToggle={() => handleTimerToggle('prep', currentStep.prepTime)}
            onCancel={() => prepTimer && handleTimerCancel(prepTimer)}
          />
          <TimerCard
            label={t('play.wait', 'Wait')}
            minutes={currentStep.waitTime}
            timer={waitTimer}
            onToggle={() => handleTimerToggle('wait', currentStep.waitTime)}
            onCancel={() => waitTimer && handleTimerCancel(waitTimer)}
          />
        </View>
      </ScrollView>

      <VoiceBar
        available={voice.available}
        mode={voice.mode}
        listening={voice.listening}
        lastHeard={voice.lastHeard}
        error={voice.error}
        speaking={speaking}
        onToggleMic={voice.toggleContinuous}
        onPushToTalk={voice.pushToTalk}
        onReadToggle={handleReadToggle}
        onHelp={() => setHelpOpen(true)}
      />
      <VoiceHelpModal
        visible={helpOpen}
        autoRead={autoRead}
        onAutoReadChange={handleAutoReadChange}
        onClose={() => setHelpOpen(false)}
      />
    </View>
  );
}

interface TimerCardProps {
  label: string;
  minutes: number | null;
  timer: StepTimer | undefined;
  onToggle: () => void;
  onCancel: () => void;
}

function TimerCard({ label, minutes, timer, onToggle, onCancel }: TimerCardProps) {
  const { t } = useTranslation('common');
  if (!minutes || minutes <= 0) {
    return (
      <View style={[styles.timerCard, styles.timerCardMuted]}>
        <Text style={styles.timerLabel}>{label}</Text>
        <Text style={styles.timerEmpty}>—</Text>
      </View>
    );
  }

  const remaining = timer ? computeRemainingMs(timer) : minutes * 60 * 1000;
  const running = timer?.state === 'running';
  const paused = timer?.state === 'paused';
  const active = running || paused;

  return (
    <View style={[styles.timerCard, active && styles.timerCardActive]}>
      <Text style={styles.timerLabel}>{label}</Text>
      <Text style={[styles.timerCountdown, active && styles.timerCountdownActive]}>
        {formatCountdown(remaining)}
      </Text>
      <View style={styles.timerBtnRow}>
        <Pressable style={styles.timerBtn} onPress={onToggle}>
          <Text style={styles.timerBtnText}>
            {!timer ? t('play.start', 'Start')
              : running ? t('play.pause', 'Pause')
              : t('play.resume', 'Resume')}
          </Text>
        </Pressable>
        {active ? (
          <Pressable style={[styles.timerBtn, styles.timerBtnSecondary]} onPress={onCancel}>
            <Text style={styles.timerBtnSecondaryText}>{t('play.reset', 'Reset')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff7ed' },
  body: { flex: 1 },
  bodyContent: { padding: 20 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  stepInstruction: { fontSize: 16, color: '#334155', lineHeight: 24 },
  ingSection: { marginTop: 20, padding: 14, backgroundColor: '#ffffff', borderRadius: 12 },
  ingHeader: { fontSize: 13, fontWeight: '700', color: '#f97316', textTransform: 'uppercase', marginBottom: 8 },
  ingLine: { fontSize: 15, color: '#334155', paddingVertical: 2 },
  timerGrid: { flexDirection: 'row', gap: 12, marginTop: 20 },
  timerCard: {
    flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#ffffff',
    borderWidth: 2, borderColor: 'transparent',
  },
  timerCardActive: { borderColor: '#f97316', backgroundColor: '#fffbeb' },
  timerCardMuted: { opacity: 0.5 },
  timerLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  timerCountdown: {
    fontSize: 28, fontWeight: '700', color: '#334155', marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  timerCountdownActive: { color: '#f97316' },
  timerEmpty: { fontSize: 28, fontWeight: '700', color: '#cbd5e1', marginTop: 6 },
  timerBtnRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  timerBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f97316',
    alignItems: 'center',
  },
  timerBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  timerBtnSecondary: { backgroundColor: '#fee2e2' },
  timerBtnSecondaryText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
});
