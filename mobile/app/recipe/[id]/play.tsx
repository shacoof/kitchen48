import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useTranslation } from 'react-i18next';
import { getRecipeById, type RecipeWithSteps, type StepWithIngredients } from '../../../src/db/recipes-db';
import {
  startOrResumeSession,
  stopSession,
  advanceToStep,
} from '../../../src/services/play-session-service';
import type { PlaySession } from '../../../src/db/play-sessions-db';
import {
  findLiveTimer,
  startTimer,
  pauseTimer,
  resumeTimer,
  cancelTimer,
  type StepTimer,
  type TimerKind,
} from '../../../src/db/step-timers-db';
import { useSessionTimers, computeRemainingMs, formatCountdown } from '../../../src/hooks/useSessionTimers';
import { useScreenHeader } from '../../../src/hooks/useScreenHeader';
import { createLogger } from '../../../src/lib/logger';

const logger = createLogger('PlayScreen');

export default function PlayScreen() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation('common');
  const router = useRouter();

  const [recipe, setRecipe] = useState<RecipeWithSteps | null>(null);
  const [session, setSession] = useState<PlaySession | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const { timers, refresh: refreshTimers } = useSessionTimers(session?.id ?? null);

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
    if (!session || !currentStep || !minutes || minutes <= 0) return;
    const existing = await findLiveTimer(session.id, currentStep.id, kind);
    if (!existing) {
      await startTimer(session.id, currentStep.id, kind, minutes * 60 * 1000);
    } else if (existing.state === 'running') {
      await pauseTimer(existing.id);
    } else if (existing.state === 'paused') {
      await resumeTimer(existing.id);
    }
    refreshTimers();
  }, [session, currentStep, refreshTimers]);

  const handleTimerCancel = useCallback(async (timer: StepTimer) => {
    await cancelTimer(timer.id);
    refreshTimers();
  }, [refreshTimers]);

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
